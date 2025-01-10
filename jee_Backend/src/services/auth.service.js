const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const querystring = require('querystring');
const httpStatus = require('http-status');
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
  console.log('Generating token for user:', user); // Debug log
  const accessToken = jwt.sign(
    {
      sub: user.id, // This should match the UUID from profiles table
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
  // First authenticate with Supabase Auth
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Login error:', signInError);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
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
    .eq('email', email)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating profile:', updateError);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update profile');
  }

  return profile;
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  // Create user with Supabase Auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: userBody.email,
    password: userBody.password,
    options: {
      data: {
        name: userBody.name,
      },
    },
  });

  if (signUpError) {
    console.error('Signup error:', signUpError);
    if (signUpError.message.includes('already registered')) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create user');
  }

  // Get the created profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch user profile');
  }

  return profile;
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

module.exports = {
  getGoogleOAuthUrl,
  handleGoogleCallback,
  generateAuthTokens,
  loginUserWithEmailAndPassword,
  createUser,
  logout,
}; 