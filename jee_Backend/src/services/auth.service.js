const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const querystring = require('querystring');

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

    // 3. Generate tokens
    const token = jwt.sign(
      { 
        sub: googleUser.id,
        email: googleUser.email,
        name: googleUser.name
      },
      config.jwt.secret,
      { expiresIn: '1d' }
    );

    return {
      user: {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture
      },
      tokens: {
        access: {
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        }
      }
    };
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

module.exports = {
  getGoogleOAuthUrl,
  handleGoogleCallback,
}; 