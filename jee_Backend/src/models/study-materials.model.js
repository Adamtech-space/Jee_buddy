const supabase = require('../config/supabaseClient');

const createFolder = async (userId, { name, parentId = null }) => {
  const { data: folder, error } = await supabase
    .from('study_materials')
    .insert([{
      user_id: userId,
      name,
      type: 'folder',
      parent_id: parentId,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return folder;
};

const uploadFile = async (userId, { name, parentId = null, file, size, mimeType }) => {
  // First upload file to storage bucket
  const filePath = `${userId}/${Date.now()}-${name}`;
  const { error: uploadError } = await supabase.storage
    .from('study-materials')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Then create database entry
  const { data: fileEntry, error: dbError } = await supabase
    .from('study_materials')
    .insert([{
      user_id: userId,
      name,
      type: 'file',
      parent_id: parentId,
      file_path: filePath,
      file_size: size,
      mime_type: mimeType,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (dbError) {
    // If database entry fails, delete the uploaded file
    await supabase.storage
      .from('study-materials')
      .remove([filePath]);
    throw dbError;
  }

  return fileEntry;
};

const getItems = async (userId, parentId = null) => {
  const query = supabase
    .from('study_materials')
    .select('*')
    .eq('user_id', userId)
    .order('type', { ascending: false }) // Folders first
    .order('created_at', { ascending: false });

  if (parentId) {
    query.eq('parent_id', parentId);
  } else {
    query.is('parent_id', null);
  }

  const { data: items, error } = await query;
  if (error) throw error;
  return items;
};

const deleteItem = async (userId, itemId) => {
  // First get the item to check if it's a file and get its path
  const { data: item, error: fetchError } = await supabase
    .from('study_materials')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  // If it's a file, delete from storage
  if (item.type === 'file' && item.file_path) {
    const { error: storageError } = await supabase.storage
      .from('study-materials')
      .remove([item.file_path]);

    if (storageError) throw storageError;
  }

  // Delete from database (will cascade to children)
  const { error: deleteError } = await supabase
    .from('study_materials')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (deleteError) throw deleteError;
  return true;
};

const renameItem = async (userId, itemId, newName) => {
  const { data: item, error } = await supabase
    .from('study_materials')
    .update({ name: newName })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return item;
};

const getDownloadUrl = async (userId, itemId) => {
  // First verify the user owns this file
  const { data: item, error: fetchError } = await supabase
    .from('study_materials')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;
  if (!item || item.type !== 'file') {
    throw new Error('File not found');
  }

  const { data: { signedUrl }, error: signError } = await supabase.storage
    .from('study-materials')
    .createSignedUrl(item.file_path, 3600); // 1 hour expiry

  if (signError) throw signError;
  return { signedUrl, fileName: item.name, mimeType: item.mime_type };
};

module.exports = {
  createFolder,
  uploadFile,
  getItems,
  deleteItem,
  renameItem,
  getDownloadUrl
}; 