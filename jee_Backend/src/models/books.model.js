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
  try {
    let query = supabase
      .from('books_metadata')
      .select(`
        id,
        created_at,
        file_name,
        file_path,
        subject,
        topic,
        storage_url,
        updated_at
      `);

    // Apply filters
    if (filters.subject) {
      query = query.eq('subject', filters.subject.toLowerCase());
    }
    if (filters.topic) {
      query = query.eq('topic', filters.topic.toLowerCase());
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log('Books data from Supabase:', data); // Debug log
    return data || [];
  } catch (error) {
    console.error('Error in getBooksMetadata:', error);
    throw error;
  }
};

const getBookById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('books_metadata')
      .select(`
        id,
        created_at,
        file_name,
        file_path,
        subject,
        topic,
        storage_url,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getBookById:', error);
    throw error;
  }
};

module.exports = {
  getBooksMetadata,
  getBookById,
  supabase
}; 