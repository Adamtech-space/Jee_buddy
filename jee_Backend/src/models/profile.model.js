const supabase = require('../config/supabaseClient');

const createProfile = async (profileData) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert([{
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return profile;
};

const getProfileById = async (profileId) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) throw error;
  return profile;
};

const updateProfile = async (profileId, updateData) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(error.message);
    }

    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile;
  } catch (error) {
    console.error('Profile update model error:', error);
    throw error;
  }
};

const deleteProfile = async (profileId) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);

  if (error) throw error;
  return true;
};

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile
}; 