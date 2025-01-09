const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const querystring = require('querystring');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const generateSessionId = () => {
  return crypto.randomUUID();
};

/**
 * Update session ID for user
 * @param {string} userId
 * @returns {Promise<string>} new session ID
 */
const updateSessionId = async (userId) => {
  const sessionId = generateSessionId();
  
  const { error } = await supabase
    .from('profiles')
    .update({ current_session_id: sessionId })
    .eq('id', userId);

  if (error) {
    throw new Error('Failed to update session ID');
  }

  return sessionId;
};

/**
 * Clear session ID for user
 * @param {string} userId
 */
const clearSessionId = async (userId) => {
  const { error } = await supabase
    .from('profiles')
    .update({ current_session_id: null })
    .eq('id', userId);

  if (error) {
    console.error('Session Clear Error:', error);
  }
};

/**
 * Create a new user
 * @param {Object} userBody
 * @returns {Promise<Object>}
 */
const createUser = async (userBody) => {
  const { email, password, name, phonenumber } = userBody;
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  try {
    // Create user in auth.users table using admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_verified: false,
      user_metadata: {
        name,
        phone: phonenumber,
        provider: 'email'
      },
      app_metadata: {
        provider: 'email',
        providers: ['email']
      }
    });

    if (authError) {
      console.error('Auth Error:', authError);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to create user in auth table');
    }

    const now = new Date().toISOString();
    const sessionId = uuidv4();

    // Create user in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        name,
        email,
        created_at: now,
        updated_at: now,
        current_session_id: sessionId
      });

    if (profileError) {
      console.error('Profile Error:', profileError);
      // Rollback auth user creation if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to create user profile');
    }

    return {
      id: authUser.user.id,
      email,
      name,
      phonenumber,
      sessionId
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Failed to create user');
  }
};

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

    const { access_token } = tokenResponse.data;
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

    // Check if user exists in either auth.users or profiles
    const { data: existingAuthUser } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    // If user exists in either table, just log them in
    if (existingAuthUser || existingProfile) {
      const userId = existingAuthUser?.id || existingProfile?.id;

      // Update user metadata if needed
      if (existingAuthUser) {
        await supabase.auth.admin.updateUserById(existingAuthUser.id, {
          user_metadata: {
            name: googleUser.name,
            picture: googleUser.picture,
            provider: 'google',
            provider_id: googleUser.sub
          }
        });
      }

      // Create profile if it doesn't exist
      if (!existingProfile && existingAuthUser) {
        const now = new Date().toISOString();
        const sessionId = uuidv4();
        await supabase
          .from('profiles')
          .insert({
            id: existingAuthUser.id,
            name: googleUser.name,
            email: googleUser.email,
            created_at: now,
            updated_at: now,
            current_session_id: sessionId
          });
      } else {
        // Update session ID for existing profile
        await updateSessionId(userId);
      }

      // Get the current session ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_session_id')
        .eq('id', userId)
        .single();

      return {
        user: {
          id: userId,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          sessionId: profile.current_session_id
        },
        tokens: {
          access: {
            token: jwt.sign(
              { 
                sub: userId,
                email: googleUser.email,
                name: googleUser.name,
                sessionId: profile.current_session_id
              },
              config.jwt.secret,
              { expiresIn: '1d' }
            ),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        }
      };
    }

    // Create new user if they don't exist in either table
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: googleUser.email,
      email_verified: true,
      user_metadata: {
        name: googleUser.name,
        picture: googleUser.picture,
        provider: 'google',
        provider_id: googleUser.sub
      },
      app_metadata: {
        provider: 'google',
        providers: ['google']
      }
    });

    if (authError) {
      console.error('Auth Error:', authError);
      throw new Error('Failed to create user in auth table');
    }

    if (!authUser || !authUser.user) {
      throw new Error('Failed to create user account');
    }

    const userId = authUser.user.id;
    const now = new Date().toISOString();
    const sessionId = uuidv4();

    try {
      // Create user in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: googleUser.name,
          email: googleUser.email,
          created_at: now,
          updated_at: now,
          current_session_id: sessionId
        });

      if (profileError) {
        // If profile creation fails, check if it's because the profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', googleUser.email)
          .single();

        if (!existingProfile) {
          console.error('Profile Error:', profileError);
          // Only delete auth user if profile doesn't exist
          await supabase.auth.admin.deleteUser(userId);
          throw new Error('Failed to create user profile');
        }
      }

      return {
        user: {
          id: userId,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          sessionId
        },
        tokens: {
          access: {
            token: jwt.sign(
              { 
                sub: userId,
                email: googleUser.email,
                name: googleUser.name,
                sessionId
              },
              config.jwt.secret,
              { expiresIn: '1d' }
            ),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        }
      };
    } catch (error) {
      // Clean up auth user if anything fails
      await supabase.auth.admin.deleteUser(userId);
      throw error;
    }
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    if (error.response?.data?.error === 'invalid_grant') {
      throw new ApiError(401, 'Authorization code has expired or already been used');
    }
    
    throw new ApiError(401, 'Google authentication failed: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Logout user
 * @param {string} userId
 */
const logout = async (userId) => {
  await clearSessionId(userId);
};

module.exports = {
  createUser,
  getGoogleOAuthUrl,
  handleGoogleCallback,
  logout,
  updateSessionId,
  clearSessionId
}; 