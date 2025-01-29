import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { message } from 'antd';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  TrashIcon,
  FolderIcon,
  PencilIcon,
  FolderPlusIcon,
  ChevronRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import {
  createFolder,
  uploadFiles,
  getStudyMaterials,
  deleteStudyMaterial,
  renameStudyMaterial,
  getFileDownloadUrl,
} from '../interceptors/services';
import { useSelection } from '../hooks/useSelection';
import SelectionPopup from './SelectionPopup';
import PdfViewer from './PdfViewer';

const StudyMaterials = () => {
  const { subject } = useParams();
  const { setIsChatOpen } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState({
    id: null,
    path: [],
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const { handleTextSelection } = useSelection();
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Define fetchItems with useCallback before using it in useEffect
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getStudyMaterials(currentFolder.id, subject);
      setItems(response.data);
    } catch (error) {
      message.error(error.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [currentFolder.id, subject]);

  // Now we can use fetchItems in useEffect
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Get current folder's items
  const getCurrentFolderItems = () => {
    return items;
  };

  // Navigate to folder
  const navigateToFolder = async (folderId) => {
    if (isNavigating) return; // Prevent multiple clicks
    setIsNavigating(true);

    try {
      // Clear selected file when navigating
      setSelectedFile(null);

      if (!folderId) {
        setCurrentFolder({ id: null, path: [] });
        setItems([]); // Clear items when going to root
        const response = await getStudyMaterials(null, subject);
        setItems(response.data);
        return;
      }

      const response = await getStudyMaterials(folderId, subject);
      const folderItems = response.data;

      // Find the current folder in the items
      const currentFolderItem = items.find((item) => item.id === folderId);

      if (currentFolderItem) {
        // Going into a child folder
        setCurrentFolder((prev) => ({
          id: folderId,
          path: [...prev.path, { id: folderId, name: currentFolderItem.name }],
        }));
      } else {
        // Going back through breadcrumb
        const pathIndex = currentFolder.path.findIndex(
          (item) => item.id === folderId
        );
        if (pathIndex !== -1) {
          setCurrentFolder((prev) => ({
            id: folderId,
            path: prev.path.slice(0, pathIndex + 1),
          }));
        }
      }

      setItems(folderItems);
    } catch (error) {
      console.error('Navigation error:', error);
      message.error('Failed to navigate to folder');
    } finally {
      // Add a small delay before allowing next navigation
      setTimeout(() => setIsNavigating(false), 500);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder({
        name: newFolderName,
        parentId: currentFolder.id,
        subject: subject,
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

    setIsUploading(true);
    const progressObj = {};
    files.forEach((file) => {
      progressObj[file.name] = 0;
    });
    setUploadProgress(progressObj);

    // Simulate progress updates with random increments
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = {};
        let allNearComplete = true;
        Object.keys(prev).forEach((fileName) => {
          const currentProgress = prev[fileName];
          if (currentProgress < 90) {
            allNearComplete = false;
            // Random increment between 2 and 15
            const increment = Math.floor(Math.random() * 13) + 2;
            // Slower progress as we get closer to 90%
            const factor = Math.max(0.1, 1 - currentProgress / 100);
            const adjustedIncrement = increment * factor;
            newProgress[fileName] = Math.min(
              currentProgress + adjustedIncrement,
              90
            );
          } else {
            newProgress[fileName] = currentProgress;
          }
        });
        if (allNearComplete) {
          clearInterval(progressInterval);
        }
        return newProgress;
      });
    }, 300); // Slightly slower interval for more realistic feeling

    try {
      await uploadFiles(files, currentFolder.id, subject);

      // Simulate final progress to 100% with a slight delay
      const finalizeProgress = async () => {
        // First set to 95%
        setUploadProgress((prev) => {
          const almostComplete = {};
          Object.keys(prev).forEach((fileName) => {
            almostComplete[fileName] = 95;
          });
          return almostComplete;
        });

        // Wait a moment then set to 100%
        await new Promise((resolve) => setTimeout(resolve, 400));

        setUploadProgress((prev) => {
          const complete = {};
          Object.keys(prev).forEach((fileName) => {
            complete[fileName] = 100;
          });
          return complete;
        });

        // Wait a moment to show 100% completion
        await new Promise((resolve) => setTimeout(resolve, 500));

        setIsUploading(false);
        setUploadProgress({});
      };

      await finalizeProgress();
      message.success('File uploaded successfully');
      await fetchItems();
    } catch (error) {
      message.error(error.message || 'Failed to upload file');
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress({});
    } finally {
      clearInterval(progressInterval);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Delete item and its children
  const handleDelete = async (itemId) => {
    try {
      setLoadingItems((prev) => new Set(prev).add(itemId));
      await deleteStudyMaterial(itemId);
      message.success('Item deleted successfully');
      await fetchItems();
    } catch (error) {
      message.error(error.message || 'Failed to delete item');
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Rename item
  const handleRename = async (itemId, newName) => {
    if (!newName.trim()) return;

    try {
      setLoadingItems((prev) => new Set(prev).add(itemId));
      await renameStudyMaterial(itemId, newName);
      message.success('Item renamed successfully');
      await fetchItems();
      setEditingItem(null);
    } catch (error) {
      message.error(error.message || 'Failed to rename item');
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Function to render different file types
  const renderFilePreview = (file) => {
    const fileType = file.type?.toLowerCase() || '';

    // Image files
    if (fileType.startsWith('image/')) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full h-auto rounded"
        />
      );
    }

    // PDF files
    if (fileType === 'application/pdf') {
      return (
        <div className="h-full w-full">
          <PdfViewer
            pdfUrl={file.url}
            subject={subject}
            onBack={() => setSelectedFile(null)}
          />
        </div>
      );
    }

    // Video files
    if (fileType.startsWith('video/')) {
      return (
        <video controls className="w-full h-auto">
          <source src={file.url} type={file.type} />
          Your browser does not support the video tag.
        </video>
      );
    }

    // Audio files
    if (fileType.startsWith('audio/')) {
      return (
        <audio controls className="w-full mt-4">
          <source src={file.url} type={file.type} />
          Your browser does not support the audio tag.
        </audio>
      );
    }

    // Text files
    if (fileType === 'text/plain') {
      return (
        <iframe
          src={file.url}
          className="w-full h-full bg-white p-4"
          title={file.name}
        />
      );
    }

    // Default viewer for other file types
    return (
      <div className="text-center p-4">
        <p className="text-gray-300 mb-4">
          This file type ({file.type || 'unknown'}) cannot be previewed
          directly.
        </p>
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Download File
        </a>
      </div>
    );
  };

  // Render breadcrumb navigation
  const renderBreadcrumbs = () => (
    <nav className="flex items-center space-x-1 text-sm mb-4 text-white overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      <button
        onClick={() => navigateToFolder(null)}
        className="flex items-center p-1.5 hover:bg-gray-800 rounded-lg transition-colors duration-200 group min-w-fit"
        title="Home"
      >
        <HomeIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
      </button>

      {currentFolder.path.map((item, index) => (
        <div key={item.id} className="flex items-center min-w-fit">
          <ChevronRightIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <button
            onClick={() => navigateToFolder(item.id)}
            className={`
              px-2 py-1.5 rounded-lg transition-all duration-200
              hover:bg-gray-800 flex items-center gap-1 group
              ${
                index === currentFolder.path.length - 1
                  ? 'bg-gray-800/50 font-medium text-blue-400'
                  : 'text-gray-300 hover:text-white'
              }
            `}
            title={item.name}
          >
            <span className="truncate max-w-[150px]">{item.name}</span>
          </button>
        </div>
      ))}
    </nav>
  );

  // Simplified click handler
  const handleItemClick = async (item) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id);
    } else {
      try {
        const response = await getFileDownloadUrl(item.id);
        const fileUrl = response.data.signedUrl;

        // Verify the URL is valid before setting it
        const urlCheck = await fetch(fileUrl, { method: 'HEAD' });
        if (!urlCheck.ok) {
          throw new Error('Unable to access the file');
        }

        setSelectedFile({
          url: fileUrl,
          name: item.name,
          type: item.mime_type || item.type,
        });
      } catch (error) {
        message.error(error.message || 'Failed to load file');
      }
    }
  };

  // Update renderItems
  const renderItems = () => {
    const currentItems = getCurrentFolderItems();

    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!currentItems.length) {
      return (
        <div className="flex flex-col items-center justify-center text-center mt-10 sm:mt-20 px-4">
          <FolderIcon className="w-16 h-16 text-gray-600 mb-4" />
          <p className="text-lg mb-2">No items found in this folder</p>
          <p className="text-sm text-gray-500 mb-6">
            Get started by creating a folder or uploading files
          </p>

          <div className="flex items-center gap-4 flex-col sm:flex-row w-full sm:w-auto">
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white w-full sm:w-auto justify-center"
            >
              <FolderPlusIcon className="w-5 h-5" />
              <span>Create Folder</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white w-full sm:w-auto justify-center cursor-pointer"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              <span>Upload Files</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1 px-2 sm:px-0">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg group flex-wrap gap-2 item-click-effect"
            onClick={() => handleItemClick(item)}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center space-x-3 text-white min-w-0 flex-1">
              {item.type === 'folder' ? (
                <FolderIcon className="w-5 h-5 text-blue-400" />
              ) : (
                <DocumentIcon className="w-5 h-5 text-gray-400" />
              )}

              <div className="min-w-0">
                {editingItem?.id === item.id ? (
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename(item.id, editingItem.name);
                      } else if (e.key === 'Escape') {
                        setEditingItem(null);
                      }
                    }}
                    onBlur={() => handleRename(item.id, editingItem.name)}
                    className="bg-gray-700 text-white px-2 py-1 rounded w-full"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p className="font-medium truncate">{item.name}</p>
                )}
                {item.type === 'file' && (
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {(item.file_size / (1024 * 1024)).toFixed(1)} MB •{' '}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              {loadingItems.has(item.id) ? (
                <div className="flex items-center text-blue-400 text-sm">
                  <svg
                    className="animate-spin h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {item.type === 'folder'
                      ? 'Processing folder...'
                      : 'Processing file...'}
                  </span>
                </div>
              ) : (
                <div className="flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem({ id: item.id, name: item.name });
                    }}
                    className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                    title="Rename"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 hover:bg-gray-700 rounded text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Add this helper function for downloading
  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      message.error(error.message || 'Failed to download file');
    }
  };

  const handleSaveToFlashCard = (text) => {
    // Implement flash card saving logic
    console.log('Save to flash card:', text);
  };

  const handleAskAI = (text) => {
    setIsChatOpen(true);
    // Add a small delay to ensure chat is open before setting message
    setTimeout(() => {
      // You'll need to implement a way to communicate with ChatBot
      window.dispatchEvent(
        new CustomEvent('setAIQuestion', {
          detail: { question: text },
        })
      );
    }, 100);
  };

  // Update the renderUploadProgress function
  const renderUploadProgress = () => {
    if (!isUploading) return null;

    return (
      <div className="fixed bottom-24 right-4 bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg w-80 border border-gray-800">
        <div className="text-sm text-white mb-2 flex justify-between items-center">
          <span className="font-medium">Uploading Files</span>
          <button
            onClick={() => {
              setIsUploading(false);
              setUploadProgress({});
            }}
            className="text-gray-400 hover:text-white text-sm"
          >
            ×
          </button>
        </div>
        {Object.entries(uploadProgress).map(([fileName, progress]) => (
          <div key={fileName} className="mb-1.5 last:mb-0">
            <div className="text-xs text-gray-300 mb-1 flex justify-between items-center">
              <span className="truncate max-w-[180px]">{fileName}</span>
              <span className="text-xs font-medium ml-2">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-1">
              <div
                className="bg-blue-500/80 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        className="h-full flex flex-col bg-black rounded-lg"
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center mb-4 flex-col sm:flex-row gap-4 sm:gap-0">
            <h2 className="text-xl font-bold text-white capitalize">
              My {subject} Study Materials
            </h2>
            {getCurrentFolderItems().length > 0 && (
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 hover:shadow-lg group flex-1 sm:flex-initial justify-center"
                  title="Create Folder"
                >
                  <FolderPlusIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-medium">New Folder</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 text-white border border-blue-500 hover:border-blue-400 hover:shadow-lg group flex-1 sm:flex-initial justify-center"
                  title="Upload Files"
                >
                  <CloudArrowUpIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-medium">Upload</span>
                </button>
              </div>
            )}
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
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white">{selectedFile.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      downloadFile(selectedFile.url, selectedFile.name)
                    }
                    className="text-gray-300 hover:text-white px-3 py-1 rounded hover:bg-gray-800"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => {
                      const fileItem = items.find(
                        (item) => item.name === selectedFile.name
                      );
                      if (fileItem) {
                        handleDelete(fileItem.id);
                        setSelectedFile(null);
                      }
                    }}
                    className="text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-gray-800"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-300 hover:text-white px-3 py-1 rounded hover:bg-gray-800"
                  >
                    Back to Files
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-gray-800 rounded p-4">
                {renderFilePreview(selectedFile)}
              </div>
            </div>
          ) : (
            renderItems()
          )}
        </div>
      </div>
      <SelectionPopup
        onSaveToFlashCard={handleSaveToFlashCard}
        onAskAI={handleAskAI}
      />
      {renderUploadProgress()}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
      />
    </>
  );
};

export default StudyMaterials;
