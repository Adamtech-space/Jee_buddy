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
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import {
  createFolder,
  uploadFiles,
  getStudyMaterials,
  deleteStudyMaterial,
  renameStudyMaterial,
  getFileDownloadUrl,
  checkUserAccess,
  updateProfileCache,
  getCurrentPlanName,
  getRemainingTokens,
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [remainingTokens, setRemainingTokens] = useState(1000);
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [hasAccess, setHasAccess] = useState(true);

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

  // Add useEffect to check access and update token info
  useEffect(() => {
    const checkAccess = async () => {
      try {
        await updateProfileCache();
        const access = checkUserAccess();
        const tokens = getRemainingTokens();
        const plan = getCurrentPlanName();

        setHasAccess(access);
        setRemainingTokens(tokens);
        setCurrentPlan(plan);
      } catch (error) {
        console.error('Error checking access:', error);
      }
    };

    checkAccess();
  }, []);

  // Add UpgradeModal component
  const UpgradeModal = () => {
    if (!showUpgradeModal) return null;

    const plans = [
      {
        name: 'Basic',
        color: 'from-blue-500 to-blue-600',
        icon: '⚡',
        features: [
          'Access to Basic AI Features',
          'Limited Queries',
          'Email Support',
        ],
        gradient: 'from-blue-500/10 to-blue-600/10',
        border: 'border-blue-500/20',
        planId: 'plan_PhmnKiiVXD3B1M',
      },
      {
        name: 'Pro',
        color: 'from-purple-500 to-purple-600',
        icon: '🚀',
        features: [
          'All Basic Features +',
          'Unlimited Queries',
          'Priority Support',
        ],
        gradient: 'from-purple-500/10 to-purple-600/10',
        border: 'border-purple-500/20',
        planId: 'plan_PhmnlqjWH24hwy',
      },
      {
        name: 'Premium',
        color: 'from-amber-500 to-amber-600',
        icon: '👑',
        features: [
          'Unlimited AI Usage',
          'Advanced Study Materials',
          'AI Generated Question Bank',
          'Performance Analytics',
          'Priority Support',
        ],
        gradient: 'from-amber-500/10 to-amber-600/10',
        border: 'border-amber-500/20',
        planId: 'plan_Phmo9yOZAKb0P8',
      },
    ];

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-xl p-6 max-w-xl w-full mx-4 shadow-2xl border border-gray-800">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {remainingTokens === 0
                ? 'Free Trial Limit Reached'
                : 'Upgrade Your Plan'}
            </h3>
            <p className="text-gray-400 text-sm">
              {remainingTokens === 0
                ? "You've used all your free tokens. Upgrade to continue using Study Materials."
                : `You have ${remainingTokens} tokens remaining. Upgrade now for unlimited access!`}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-gradient-to-r ${plan.gradient} border ${plan.border} p-4 rounded-lg transition-transform hover:scale-[1.02] cursor-pointer`}
                onClick={() =>
                  (window.location.href = `/settings?plan=${plan.planId}`)
                }
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{plan.icon}</span>
                      <h4
                        className={`font-medium bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}
                      >
                        {plan.name} Plan
                      </h4>
                    </div>
                  </div>
                  {currentPlan === plan.name && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      Current Plan
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <span
                        className={`w-1 h-1 rounded-full bg-gradient-to-r ${plan.color}`}
                      ></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = '/settings')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-all duration-200"
            >
              View Plans & Upgrade
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modify handleCreateFolder to check access
  const handleCreateFolder = async () => {
    if (!hasAccess) {
      setShowUpgradeModal(true);
      return;
    }

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

      // Update token count after action
      await updateProfileCache();
      const tokens = getRemainingTokens();
      setRemainingTokens(tokens);

      // Check if tokens are exhausted
      if (tokens === 0 && currentPlan === 'Free') {
        setHasAccess(false);
        setShowUpgradeModal(true);
      }
    } catch (error) {
      message.error(error.message || 'Failed to create folder');
    }
  };

  // Modify handleFileUpload to check access
  const handleFileUpload = async (event) => {
    if (!hasAccess) {
      setShowUpgradeModal(true);
      return;
    }

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

      // Update token count after successful upload
      await updateProfileCache();
      const tokens = getRemainingTokens();
      setRemainingTokens(tokens);

      // Check if tokens are exhausted
      if (tokens === 0 && currentPlan === 'Free') {
        setHasAccess(false);
        setShowUpgradeModal(true);
      }
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
    const originalItem = items.find((item) => item.id === itemId);
    let finalName = newName;

    // Preserve extension for files
    if (originalItem.type === 'file') {
      const originalExtension = originalItem.name.split('.').pop();
      finalName = `${newName.split('.')[0]}.${originalExtension}`;
    }

    if (!finalName.trim()) return;

    try {
      setLoadingItems((prev) => new Set(prev).add(itemId));
      await renameStudyMaterial(itemId, finalName);
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
                    value={
                      item.type === 'file'
                        ? editingItem.name.split('.').slice(0, -1).join('.')
                        : editingItem.name
                    }
                    onChange={(e) => {
                      const newName =
                        item.type === 'file'
                          ? `${e.target.value}.${item.name.split('.').pop()}`
                          : e.target.value;

                      setEditingItem({ ...editingItem, name: newName });
                    }}
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

  const handleSaveToFlashCard = () => {
    // Implement flash card saving logic
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
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white capitalize">
                My {subject} Study Materials
              </h2>
              {currentPlan === 'Free' && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    <span className="text-blue-400">{remainingTokens}</span>{' '}
                    tokens remaining
                  </span>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Upgrade
                  </button>
                </div>
              )}
            </div>

            {getCurrentFolderItems().length > 0 && (
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={() =>
                    hasAccess
                      ? setIsCreatingFolder(true)
                      : setShowUpgradeModal(true)
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border text-sm font-medium justify-center flex-1 sm:flex-initial
                    ${
                      hasAccess
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700 hover:border-gray-600 hover:shadow-lg'
                        : 'bg-gray-800/50 text-gray-500 border-gray-800 cursor-not-allowed'
                    }`}
                  title={
                    hasAccess ? 'Create Folder' : 'Upgrade to create folders'
                  }
                >
                  <FolderPlusIcon className="w-5 h-5" />
                  <span>New Folder</span>
                </button>
                <button
                  onClick={() =>
                    hasAccess
                      ? fileInputRef.current?.click()
                      : setShowUpgradeModal(true)
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border text-sm font-medium justify-center flex-1 sm:flex-initial
                    ${
                      hasAccess
                        ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 hover:border-blue-400 hover:shadow-lg'
                        : 'bg-blue-900/20 text-blue-300/50 border-blue-900/50 cursor-not-allowed'
                    }`}
                  title={hasAccess ? 'Upload Files' : 'Upgrade to upload files'}
                >
                  <CloudArrowUpIcon className="w-5 h-5" />
                  <span>Upload</span>
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
      <UpgradeModal />
    </>
  );
};

export default StudyMaterials;
