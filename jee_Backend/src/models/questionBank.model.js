const supabase = require('../config/supabaseClient');

const getQuestionBankList = async (subject) => {
  try {
    let query = supabase.from('question_bank').select(`
        id,
        created_at,
        exam_type,
        year,
        subject,
        pdf_url,
        storage_path
      `);

    if (subject) {
      query = query.eq('subject', subject.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getQuestionBankList:', error);
    throw error;
  }
};

module.exports = {
  getQuestionBankList,
};
