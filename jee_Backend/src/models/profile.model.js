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
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return profile;
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