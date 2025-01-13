const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const logger = require('./logger');

// Log Supabase configuration (but mask sensitive parts of the keys)
const maskKey = (key) => {
  if (!key) return 'undefined';
  return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
};

logger.info('Initializing Supabase with:', {
  url: config.supabase.url,
  serviceKey: maskKey(config.supabase.serviceKey)
});

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) throw error;
    logger.info('Connected to Supabase successfully');
  } catch (error) {
    logger.error('Error connecting to Supabase:', error);
    throw error;
  }
};

// Test connection immediately
testConnection().catch(error => {
  logger.error('Failed to initialize Supabase client:', error);
  process.exit(1);
});

module.exports = supabase; 