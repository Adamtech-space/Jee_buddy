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
        ...profile
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
  try {
    console.log('Attempting login for email:', email);

    // First try direct sign in
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && signInData?.user) {
      console.log('Direct login successful');
      
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user profile');
      }

      // Generate new session ID
      const sessionId = uuidv4();

      // Update profile with new session ID
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          current_session_id: sessionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', signInData.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating session:', updateError);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update session');
      }

      // Generate application tokens
      const tokens = await generateAuthTokens({
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name
      });

      return {
        user: {
          ...updatedProfile
        },
        tokens
      };
    }

    // If direct login failed, check if user exists in profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!existingProfile) {
      console.error('Account not found');
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Account not found');
    }

    // Try to update password and retry login
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingProfile.id,
      { password }
    );

    if (updateError) {
      console.error('Password update failed:', updateError);
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
    }

    // Retry login after password update
    const { data: retryData, error: retryError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (retryError || !retryData?.user) {
      console.error('Login retry failed:', retryError);
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed');
    }

    // Get full profile data
    const { data: fullProfile, error: fullProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', retryData.user.id)
      .single();

    if (fullProfileError) {
      console.error('Error fetching full profile:', fullProfileError);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user profile');
    }

    // Generate new session ID
    const sessionId = uuidv4();

    // Update profile with new session ID
    const { data: updatedProfile, error: sessionUpdateError } = await supabase
      .from('profiles')
      .update({
        current_session_id: sessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', retryData.user.id)
      .select()
      .single();

    if (sessionUpdateError) {
      console.error('Error updating session:', sessionUpdateError);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update session');
    }

    // Generate application tokens
    const tokens = await generateAuthTokens({
      id: updatedProfile.id,
      email: updatedProfile.email,
      name: updatedProfile.name
    });

    return {
      user: {
        ...updatedProfile
      },
      tokens
    };
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.statusCode || httpStatus.UNAUTHORIZED,
      error.message || 'Authentication failed'
    );
  }
};

const cleanupExistingUser = async (email) => {
  console.log('Starting cleanup for email:', email);
  
  try {
    // First check if user exists
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email);

    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
    const existingAuthUsers = existingUsers?.filter(u => u.email === email);

    if (existingProfiles?.length > 0 || existingAuthUsers?.length > 0) {
      console.log('Found existing user data, cleaning up...');

      // Try hard delete first
      try {
        await supabase.rpc('hard_delete_user', { user_email: email });
        console.log('Hard delete completed');
      } catch (hardDeleteError) {
        console.error('Hard delete failed:', hardDeleteError);
        
        // Fall back to manual deletion
        console.log('Falling back to manual deletion...');

        // Delete profiles one by one
        if (existingProfiles?.length > 0) {
          for (const profile of existingProfiles) {
            try {
              await supabase
                .from('profiles')
                .delete()
                .eq('id', profile.id);
              console.log('Deleted profile:', profile.id);
            } catch (e) {
              console.error('Error deleting profile:', e);
            }
          }
        }

        // Delete auth users one by one
        if (existingAuthUsers?.length > 0) {
          for (const user of existingAuthUsers) {
            try {
              await supabase.auth.admin.deleteUser(user.id);
              console.log('Deleted auth user:', user.id);
            } catch (e) {
              console.error('Error deleting auth user:', e);
            }
          }
        }
      }

      // Wait for deletions to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Final verification
      const { data: finalProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email);

      const { data: { users: finalUsers } } = await supabase.auth.admin.listUsers();
      const finalAuthUsers = finalUsers?.filter(u => u.email === email);

      if (finalProfiles?.length > 0 || finalAuthUsers?.length > 0) {
        console.error('Warning: Could not completely clean up user data:', {
          remainingProfiles: finalProfiles,
          remainingAuthUsers: finalAuthUsers
        });
        // Don't throw error, just log warning
        console.log('Continuing despite incomplete cleanup');
      } else {
        console.log('Cleanup completed successfully');
      }
    } else {
      console.log('No existing user data found');
    }
  } catch (error) {
    console.error('Cleanup error:', error);
    // Log error but don't throw
    console.log('Continuing despite cleanup error');
  }
};

/**
 * Create a user
 * @param {Object} userInput
 * @returns {Promise<User>}
 */
const createUser = async (userInput) => {
  try {
    console.log('Starting user creation with data:', {
      email: userInput.email,
      name: userInput.name
    });

    // Initial cleanup
    await cleanupExistingUser(userInput.email);

    // Wait a bit for cleanup to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create new auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userInput.email,
      password: userInput.password,
      email_confirm: true,
      user_metadata: {
        name: userInput.name
      }
    });
    
    if (authError) {
      console.error('Auth user creation error:', authError);
      throw new ApiError(httpStatus.BAD_REQUEST, `Failed to create account: ${authError.message}`);
    }

    if (!authUser?.user?.id) {
      console.error('No user ID received from auth signup');
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create account');
    }

    console.log('Auth user created successfully with ID:', authUser.user.id);

    // Before creating profile, verify the ID doesn't exist
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUser.user.id)
      .single();

    if (existingProfile) {
      // If profile exists with this ID, delete it first
      await supabase
        .from('profiles')
        .delete()
        .eq('id', authUser.user.id);
      
      // Wait for deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Create profile record with retries
    let profile = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (!profile && retryCount < maxRetries) {
      const now = new Date().toISOString();
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: authUser.user.id,
          name: userInput.name,
          email: userInput.email,
          phone_number: userInput.phonenumber,
          created_at: now,
          updated_at: now,
          current_session_id: null
        }])
        .select()
        .single();

      if (insertError) {
        console.error(`Profile creation attempt ${retryCount + 1} failed:`, insertError);
        
        if (insertError.code === '23505' && retryCount < maxRetries - 1) {
          // On conflict, try to delete the conflicting profile
          await supabase
            .from('profiles')
            .delete()
            .eq('id', authUser.user.id);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
          continue;
        }

        // If we've exhausted retries or got a different error, clean up and throw
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw new ApiError(httpStatus.CONFLICT, 'Account creation conflict. Please try again.');
      }

      profile = newProfile;
    }

    if (!profile) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create profile after multiple attempts');
    }

    console.log('Profile created successfully');

    // Generate tokens for the new user
    const tokens = await generateAuthTokens({
      id: profile.id,
      email: profile.email,
      name: profile.name
    });

    return {
      user: {
        ...profile
      },
      tokens
    };
  } catch (error) {
    console.error('User creation error:', {
      error,
      message: error.message,
      stack: error.stack
    });
    throw error instanceof ApiError ? error : new ApiError(
      error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to create account'
    );
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
