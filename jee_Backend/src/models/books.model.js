const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');

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

const getBooksMetadata = async (filters = {}) => {
  let query = supabase
    .from('books_metadata')
    .select('*');

  if (filters.subject) {
    query = query.eq('subject', filters.subject);
  }
  if (filters.topic) {
    query = query.eq('topic', filters.topic);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const getBookById = async (id) => {
  const { data, error } = await supabase
    .from('books_metadata')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

module.exports = {
  getBooksMetadata,
  getBookById,
  supabase
}; 