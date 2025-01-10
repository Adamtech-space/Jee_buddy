const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('./logger');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase URL or Service Role Key');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    logger.info('Connected to Supabase successfully');
  } catch (error) {
    logger.error('Failed to connect to Supabase:', error.message);
    throw error;
  }
}

// Initialize connection
testConnection();

module.exports = supabase; 