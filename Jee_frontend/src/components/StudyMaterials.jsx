import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { message } from 'antd';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  TrashIcon,
  FolderIcon,
  PencilIcon,
  FolderPlusIcon,
  ChevronRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import {
  createFolder,
  uploadFiles,
  getStudyMaterials,
  deleteStudyMaterial,
  renameStudyMaterial,
  getFileDownloadUrl
} from '../interceptors/services';

const StudyMaterials = () => {
  const { subject } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState({
    id: null,
    path: []
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Fetch items when folder changes
  useEffect(() => {
    fetchItems();
  }, [currentFolder.id]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await getStudyMaterials(currentFolder.id);
      setItems(response.data);
    } catch (error) {
      message.error(error.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  // Get current folder's items
  const getCurrentFolderItems = () => {
    return items;
  };

  // Navigate to folder
  const navigateToFolder = (folderId) => {
    if (!folderId) {
      setCurrentFolder({ id: null, path: [] });
      return;
    }

    const buildPath = (itemId) => {
      const item = items.find(i => i.id === itemId);
      if (!item) return [];
      
      if (!item.parent_id) {
        return [{ id: item.id, name: item.name }];
      }

      return [...buildPath(item.parent_id), { id: item.id, name: item.name }];
    };

    const path = buildPath(folderId);
    setCurrentFolder({ id: folderId, path });
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await createFolder({
        name: newFolderName,
        parentId: currentFolder.id
      });

      message.success('Folder created successfully');
      await fetchItems();
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      message.error(error.message || 'Failed to create folder');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    try {
      const response = await uploadFiles(files, currentFolder.id);
      message.success('File uploaded successfully');
      await fetchItems();
    } catch (error) {
      message.error(error.message || 'Failed to upload file');
    }

    if (event.target) {
      event.target.value = '';
    }
  };

  // Delete item and its children
  const handleDelete = async (itemId) => {
    try {
      await deleteStudyMaterial(itemId);
      message.success('Item deleted successfully');
      await fetchItems();
    } catch (error) {
      message.error(error.message || 'Failed to delete item');
    }
  };

  // Rename item
  const handleRename = async (itemId, newName) => {
    if (!newName.trim()) return;
    
    try {
      await renameStudyMaterial(itemId, newName);
      message.success('Item renamed successfully');
      await fetchItems();
      setEditingItem(null);
    } catch (error) {
      message.error(error.message || 'Failed to rename item');
    }
  };

  // Handle file download
  const handleFileDownload = async (item) => {
    if (item.type !== 'file') return;

    try {
      const response = await getFileDownloadUrl(item.id);
      window.open(response.data.signedUrl, '_blank');
    } catch (error) {
      message.error(error.message || 'Failed to download file');
    }
  };

  // Render breadcrumb navigation
  const renderBreadcrumbs = () => (
    <div className="flex items-center space-x-2 text-sm mb-4 text-white">
      <button
        onClick={() => navigateToFolder(null)}
        className="p-1 hover:bg-gray-800 rounded"
      >
        <HomeIcon className="w-4 h-4" />
      </button>
      {currentFolder.path.map((item, index) => (
        <div key={item.id} className="flex items-center">
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => navigateToFolder(item.id)}
            className={`px-2 py-1 rounded hover:bg-gray-800 ${
              index === currentFolder.path.length - 1 
                ? 'font-medium text-blue-400' 
                : 'text-gray-300'
            }`}
          >
            {item.name}
          </button>
        </div>
      ))}
    </div>
  );

  // Render file/folder list
  const renderItems = () => {
    const currentItems = getCurrentFolderItems();

    if (loading) {
      return <div className="text-white text-center py-4">Loading...</div>;
    }

    if (!currentItems.length) {
      return <div className="text-gray-400 text-center py-4">No items found</div>;
    }

    return (
      <div className="space-y-1">
        {currentItems.map(item => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg group"
          >
            <div 
              className="flex items-center space-x-3 flex-1 text-white cursor-pointer"
              onClick={() => item.type === 'folder' ? navigateToFolder(item.id) : handleFileDownload(item)}
            >
              {item.type === 'folder' ? (
                <FolderIcon className="w-5 h-5 text-blue-400" />
              ) : (
                <DocumentIcon className="w-5 h-5 text-gray-400" />
              )}
              
              {editingItem?.id === item.id ? (
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  onBlur={() => handleRename(item.id, editingItem.name)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(item.id, editingItem.name)}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                  autoFocus
                />
              ) : (
              <div>
                  <p className="font-medium">{item.name}</p>
                  {item.type === 'file' && (
                    <p className="text-sm text-gray-400">
                      {(item.file_size / (1024 * 1024)).toFixed(1)} MB • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
              <button 
                onClick={() => setEditingItem({ id: item.id, name: item.name })}
                className="p-1 hover:bg-gray-700 rounded text-gray-300"
                title="Rename"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(item.id)}
                className="p-1 hover:bg-gray-700 rounded text-gray-300"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg">
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white capitalize">{subject} Study Materials</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="p-2 hover:bg-gray-800 rounded text-gray-300"
              title="Create Folder"
            >
              <FolderPlusIcon className="w-5 h-5" />
            </button>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            <label 
              htmlFor="file-upload"
              className="p-2 hover:bg-gray-800 rounded cursor-pointer text-gray-300"
              title="Upload Files"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
            </label>
          </div>
        </div>

        {renderBreadcrumbs()}
        
        {isCreatingFolder && (
          <div className="mt-2 flex items-center space-x-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New Folder"
              className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <button
              onClick={handleCreateFolder}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
              className="px-3 py-1 border border-gray-700 rounded hover:bg-gray-800 text-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {renderItems()}
      </div>
    </div>
  );
};

export default StudyMaterials;
