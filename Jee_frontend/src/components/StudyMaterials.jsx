import { useState } from 'react';
import { useParams } from 'react-router-dom';
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

const StudyMaterials = () => {
  const { subject } = useParams();
  const [items, setItems] = useState([
    { 
      id: '1', 
      type: 'folder',
      name: 'Important Notes',
      parentId: null
    },
    { 
      id: '2', 
      type: 'file',
      name: 'Chapter 1 Notes.pdf', 
      size: '1.1 MB', 
      date: new Date(),
      parentId: null
    }
  ]);

  const [currentFolder, setCurrentFolder] = useState({
    id: null,
    path: []
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Get current folder's items
  const getCurrentFolderItems = () => {
    return items.filter(item => item.parentId === currentFolder.id);
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
      
      if (!item.parentId) {
        return [{ id: item.id, name: item.name }];
      }

      return [...buildPath(item.parentId), { id: item.id, name: item.name }];
    };

    const path = buildPath(folderId);
    setCurrentFolder({ id: folderId, path });
  };

  // Create new folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder = {
      id: Date.now().toString(),
      type: 'folder',
      name: newFolderName,
      parentId: currentFolder.id
    };

    setItems(prev => [...prev, newFolder]);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files).map(file => ({
      id: Date.now().toString(),
      type: 'file',
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      date: new Date(),
      parentId: currentFolder.id
    }));

    setItems(prev => [...prev, ...files]);

    if (event.target) {
      event.target.value = '';
    }
  };

  // Delete item and its children
  const handleDelete = (itemId) => {
    const deleteItemAndChildren = (id) => {
      const childrenIds = items
        .filter(item => item.parentId === id)
        .map(item => item.id);
      
      childrenIds.forEach(childId => {
        deleteItemAndChildren(childId);
      });

      setItems(prev => prev.filter(item => item.id !== id));
    };

    deleteItemAndChildren(itemId);
  };

  // Rename item
  const handleRename = (itemId, newName) => {
    if (!newName.trim()) return;
    
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, name: newName } : item
    ));
    setEditingItem(null);
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

    return (
      <div className="space-y-1">
        {currentItems.map(item => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg group"
          >
            <div 
              className="flex items-center space-x-3 flex-1 text-white"
              onClick={() => item.type === 'folder' && navigateToFolder(item.id)}
              style={{ cursor: item.type === 'folder' ? 'pointer' : 'default' }}
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
                      {item.size} • {item.date.toLocaleDateString()}
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
              accept=".pdf,.doc,.docx,.txt"
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
