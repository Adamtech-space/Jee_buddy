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
import { useSelection } from '../context/SelectionContext';
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

  // Define fetchItems with useCallback before using it in useEffect
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getStudyMaterials(currentFolder.id);
      setItems(response.data);
    } catch (error) {
      message.error(error.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [currentFolder.id]);

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
      await uploadFiles(files, currentFolder.id);
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
      return <div className="text-white text-center py-4">Loading...</div>;
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
      window.dispatchEvent(new CustomEvent('setAIQuestion', { 
        detail: { question: text }
      }));
    }, 100);
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
    </>
  );
};

export default StudyMaterials;