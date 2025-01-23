import { useState, useEffect, useCallback } from 'react';
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
import { Document, Page, pdfjs } from 'react-pdf';
import { useSelection } from '../hooks/useSelection';
import SelectionPopup from './SelectionPopup';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [numPages, setNumPages] = useState(null); // for PDF viewer
  const { handleTextSelection } = useSelection();
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

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
  const navigateToFolder = (folderId) => {
    if (!folderId) {
      setCurrentFolder({ id: null, path: [] });
      return;
    }

    const buildPath = (itemId) => {
      const item = items.find((i) => i.id === itemId);
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
        <Document
          file={file.url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          className="w-full"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              className="mb-4"
              width={window.innerWidth * 0.7}
            />
          ))}
        </Document>
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
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!currentItems.length) {
      return (
        <div className="text-gray-400 text-center py-4">No items found</div>
      );
    }

    return (
      <div className="space-y-1">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg group"
          >
            <div
              className="flex items-center space-x-3 flex-1 text-white cursor-pointer"
              onClick={async () => {
                if (item.type === 'folder') {
                  navigateToFolder(item.id);
                } else {
                  try {
                    const response = await getFileDownloadUrl(item.id);
                    setSelectedFile({
                      url: response.data.signedUrl,
                      name: item.name,
                      type: item.mime_type || item.type, // Use mime_type if available
                    });
                  } catch (error) {
                    message.error(error.message || 'Failed to load file');
                  }
                }
              }}
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
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  onBlur={() => handleRename(item.id, editingItem.name)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleRename(item.id, editingItem.name)
                  }
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                  autoFocus
                />
              ) : (
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.type === 'file' && (
                    <p className="text-sm text-gray-400">
                      {(item.file_size / (1024 * 1024)).toFixed(1)} MB •{' '}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {loadingItems.has(item.id) ? (
                <div className="flex items-center text-blue-400">
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
                  {item.type === 'folder'
                    ? 'Processing folder...'
                    : 'Processing file...'}
                </div>
              ) : (
                <div className="opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() =>
                      setEditingItem({ id: item.id, name: item.name })
                    }
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white capitalize">
              {subject} Study Materials
            </h2>
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
    </>
  );
};

export default StudyMaterials;