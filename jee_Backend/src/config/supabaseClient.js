const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) throw error;
    console.log('Connected to Supabase successfully');
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
  }
};

testConnection();

module.exports = supabase; 