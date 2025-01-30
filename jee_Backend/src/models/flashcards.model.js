const supabase = require('../config/supabaseClient');

const saveFlashCard = async (userId, data) => {
  const { subject, topic, content, source } = data;
  
  const { data: flashcard, error } = await supabase
    .from('flashcards')
    .insert([{
      user_id: userId,
      subject,
      topic,
      content,
      source,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return flashcard;
};

const getFlashCards = async (userId, subject = null) => {
  let query = supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (subject) {
    query = query.eq('subject', subject);
  }

  const { data: flashcards, error } = await query;
  if (error) throw error;
  return flashcards;
};

const deleteFlashCard = async (userId, cardId) => {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
};

const updateFlashCard = async (userId, cardId, data) => {
  const { subject, topic, content } = data;
  
  const { data: flashcard, error } = await supabase
    .from('flashcards')
    .update({
      subject,
      topic,
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', cardId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return flashcard;
};

module.exports = {
  saveFlashCard,
  getFlashCards,
  deleteFlashCard,
  updateFlashCard
}; 