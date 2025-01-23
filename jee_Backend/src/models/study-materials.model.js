const supabase = require('../config/supabaseClient');

const createFolder = async (userId, { name, parentId = null, subject }) => {
  const { data: folder, error } = await supabase
    .from('study_materials')
    .insert([{
      user_id: userId,
      name,
      type: 'folder',
      parent_id: parentId,
      subject,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return folder;
};

const uploadFile = async (userId, { name, parentId = null, file, size, mimeType, subject }) => {
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
      subject,
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

const getItems = async (userId, parentId = null, subject) => {
  // Debug: Log input parameters
  console.log('getItems called with:', { userId, parentId, subject });

  try {
    let query = supabase
      .from('study_materials')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .order('type', { ascending: false }) // Folders first
      .order('created_at', { ascending: false });

    // Add parentId condition
    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    // Execute the query
    const { data: items, error } = await query;
  
    // Debug: Log the results and any error
    console.log('Query results:', {
      itemsCount: items?.length || 0,
      firstItem: items?.[0],
      error,
      userId,
      subject
    });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Verify the data matches our filters
    if (items && items.length > 0) {
      console.log('First item matches:', {
        userIdMatch: items[0].user_id === userId,
        subjectMatch: items[0].subject === subject,
        parentIdMatch: parentId ? items[0].parent_id === parentId : items[0].parent_id === null
      });
    }

    return items || [];
  } catch (error) {
    console.error('Error in getItems:', error);
    throw error;
  }
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