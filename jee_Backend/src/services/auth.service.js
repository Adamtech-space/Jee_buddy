const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const querystring = require('querystring');
const httpStatus = require('http-status');
const { createClient } = require('@supabase/supabase-js');

// Create a separate client for auth operations using the anon key
const authClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

// Use the service role client for admin operations
const supabase = require('../config/supabaseClient');

/**
 * Get Google OAuth URL
 * @returns {string}
 */
const getGoogleOAuthUrl = () => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: config.google.callbackUrl,
    client_id: config.google.clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };
  
  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

/**
 * Process Google OAuth callback
 * @param {string} code
 * @returns {Promise<Object>}
 */
const handleGoogleCallback = async (code) => {
  try {
    // 1. Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      querystring.stringify({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.callbackUrl,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, id_token } = tokenResponse.data;
    if (!access_token) {
      throw new Error('No access token received from Google');
    }

    // 2. Get user info from Google
    const userResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
    );

    const googleUser = userResponse.data;
    if (!googleUser.email) {
      throw new Error('No email received from Google');
    }

    console.log('Google user data:', googleUser);

    // 3. Sign up/in with Supabase Auth using Google token
    const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: id_token,
    });

    if (signInError) {
      console.error('Supabase Auth Error:', signInError);
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed');
    }

    console.log('Auth user:', authUser); // Debug log

    // Create a new session ID
    const sessionId = uuidv4();

    // 4. Get or create profile using the auth user's ID
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileError);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Database error');
    }

    let profile;
    if (!existingProfile) {
      // Create new profile using auth user's ID
      const now = new Date().toISOString();
      
      console.log('Creating new profile with data:', {
        id: authUser.id,
        email: googleUser.email,
        name: googleUser.name,
        sessionId
      });

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: authUser.id,
          email: googleUser.email,
          name: googleUser.name,
          created_at: now,
          updated_at: now,
          current_session_id: sessionId
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        // Try to get more detailed error information
        const { data: errorDetails, error: errorCheckError } = await supabase
          .rpc('get_last_error');
        if (!errorCheckError) {
          console.error('Additional error details:', errorDetails);
        }
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to create profile: ${createError.message}`);
      }

      console.log('Successfully created new profile:', newProfile);
      profile = newProfile;
    } else {
      // Update existing profile with new session ID
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          current_session_id: sessionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update profile');
      }
      profile = updatedProfile;
    }

    console.log('Profile after save/update:', profile); // Debug log

    // Generate application token
    const token = jwt.sign(
      { 
        sub: profile.id,
        email: profile.email,
        name: profile.name,
        type: 'access',
        session_id: sessionId
      },
      config.jwt.secret,
      { expiresIn: '1d' }
    );

    return {
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: googleUser.picture,
        current_session_id: sessionId
      },
      tokens: {
        access: {
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        }
      }
    };
  } catch (error) {
    console.error('Google Auth Error:', error);
    throw error;
  }
};

/**
 * Generate auth tokens for user
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'access'
    },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpirationMinutes * 60 }
  );

  return {
    access: {
      token: accessToken,
      expires: new Date(Date.now() + config.jwt.accessExpirationMinutes * 60 * 1000),
    }
  };
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  // First check if the user exists in the profiles table
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Database error');
  }

  if (!existingProfile) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Account not found');
  }

  try {
    // Get the user's auth details first
    const { data: authUser, error: authCheckError } = await supabase.auth.admin.getUserById(existingProfile.id);
    
    if (authCheckError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Authentication system error');
    }

    // Try to authenticate with regular auth client
    let { data: authData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If regular auth fails, try to update the password and retry
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingProfile.id,
        { password }
      );

      if (updateError) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid password');
      }
      
      // Try login again after password update
      const retryAuth = await authClient.auth.signInWithPassword({
        email,
        password,
      });

      if (retryAuth.error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed after password update');
      }

      if (!retryAuth.data?.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'No user data after password update');
      }

      authData = retryAuth.data;
    }

    // Generate new session ID
    const sessionId = uuidv4();

    // Update profile with new session ID
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        current_session_id: sessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)
      .select('*')
      .single();

    if (updateError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update profile');
    }

    // Generate application tokens
    const tokens = await generateAuthTokens({
      id: profile.id,
      email: profile.email,
      name: profile.name
    });

    return {
      user: profile,
      tokens
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed');
  }
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  try {
    console.log('Starting user creation for email:', userBody.email);

    // Check if user already exists in profiles
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userBody.email)
      .single();

    if (existingUser) {
      console.log('User already exists with email:', userBody.email);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    // First try to sign up with Supabase Auth
    console.log('Creating auth user...');
    const { data: authData, error: signUpError } = await authClient.auth.signUp({
      email: userBody.email,
      password: userBody.password,
      options: {
        data: {
          name: userBody.name,
        },
      },
    });

    if (signUpError) {
      console.error('Signup error details:', {
        message: signUpError.message,
        status: signUpError.status,
        code: signUpError.code
      });
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create user');
    }

    if (!authData?.user) {
      console.error('Auth data missing user object after signup');
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create user');
    }

    console.log('Auth user created with ID:', authData.user.id);

    // Create profile record
    console.log('Creating profile record...');
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          name: userBody.name,
          email: userBody.email,
          phone_number: userBody.phonenumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Profile creation error:', insertError);
      // If profile creation fails, we should try to delete the auth user
      await authClient.auth.admin.deleteUser(authData.user.id);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create user profile');
    }

    console.log('Profile created successfully');
    console.log('Generating tokens...');

    // Generate application tokens
    const tokens = await generateAuthTokens({
      id: profile.id,
      email: profile.email,
      name: profile.name
    });

    console.log('User creation completed successfully');

    return {
      user: profile,
      tokens
    };
  } catch (error) {
    console.error('Signup process error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Registration failed');
  }
};

const logout = async (userId) => {
  try {
    // Clear session ID on logout
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_session_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile on logout:', updateError);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to logout');
    }

    // Sign out from Supabase Auth
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('Error signing out:', signOutError);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to sign out');
    }

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
  try {
    console.log('Generating reset password token for:', email);

    // Check if user exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
    }

    // Use Supabase's built-in password reset
    const { data, error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.clientUrl}/auth/reset-password`,
    });

    if (error) {
      console.error('Reset password error:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send reset password email');
    }

    console.log('Reset password email sent successfully');
    return true;
  } catch (error) {
    console.error('Reset password process error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to process reset password request');
  }
};

/**
 * Reset password
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (token, newPassword) => {
  try {
    console.log('Attempting to reset password');

    const { data, error } = await authClient.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to reset password');
    }

    console.log('Password reset successful');
    return true;
  } catch (error) {
    console.error('Reset password error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to reset password');
  }
};

module.exports = {
  getGoogleOAuthUrl,
  handleGoogleCallback,
  generateAuthTokens,
  loginUserWithEmailAndPassword,
  createUser,
  logout,
  generateResetPasswordToken,
  resetPassword,
}; 