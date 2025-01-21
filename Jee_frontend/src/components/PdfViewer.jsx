import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import { message, Popover } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { saveFlashCard } from '../interceptors/services';
import SelectionPopup from './SelectionPopup';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const PdfViewer = () => {
  const { subject, pdfUrl: encodedUrl } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [popoverVisible, setPopoverVisible] = useState(false);
  const { setSelectedText: setChatSelectedText, setIsChatOpen } =
    useOutletContext();

  // Get the actual URL from either state or params
  const pdfUrl = location.state?.pdfUrl || decodeURIComponent(encodedUrl);
  const pdfTitle = decodeURIComponent(
    pdfUrl.split('/').pop().replace('.pdf', '')
  );

  // Initialize plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (!pdfUrl) {
      setError('PDF URL not found');
      message.error('PDF URL not found');
      navigate(`/dashboard/${subject}/books`);
    } else {
      setLoading(true);

      // Check if the PDF URL is accessible
      fetch(pdfUrl, {
        method: 'HEAD',
        headers: {
          Accept: 'application/pdf',
        },
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error checking PDF URL:', err);
          setError(`Failed to access PDF: ${err.message}`);
          setLoading(false);
        });
    }
  }, [pdfUrl, navigate, subject]);

  useEffect(() => {
    let isSelecting = false;
    // Get reference to the PDF viewer container
    const pdfContainer = document.querySelector('.rpv-core__viewer');

    const handleMouseDown = (event) => {
      // Only handle selections within the PDF viewer
      if (event.target.closest('.rpv-core__viewer')) {
        isSelecting = true;
        setPopoverVisible(false);
      }
    };

    const handleTextSelection = (event) => {
      if (!isSelecting || !event.target.closest('.rpv-core__viewer')) return;

      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text) {
        try {
          setSelectedText(text);
          setPopoverVisible(true);
        } catch (error) {
          console.error('Selection error:', error);
          setPopoverVisible(false);
        }
      }

      isSelecting = false;
    };

    const handleClickOutside = (event) => {
      // Don't close if clicking inside popover or if there's selected text in PDF viewer
      if (
        !event.target.closest('.ant-popover') &&
        !event.target.closest('.rpv-core__viewer')
      ) {
        setPopoverVisible(false);
      }
    };

    if (pdfContainer) {
      pdfContainer.addEventListener('mousedown', handleMouseDown);
      pdfContainer.addEventListener('mouseup', handleTextSelection);
      document.addEventListener('click', handleClickOutside);

      return () => {
        pdfContainer.removeEventListener('mousedown', handleMouseDown);
        pdfContainer.removeEventListener('mouseup', handleTextSelection);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, []);

  const handleSaveToFlashCard = async () => {
    const hide = message.loading('Saving to flash cards...', 0);
    try {
      await saveFlashCard({
        subject,
        topic: pdfTitle,
        content: selectedText,
        source: pdfTitle,
      });
      hide();
      message.success({
        content: 'Successfully saved to flash cards!',
        icon: <SaveOutlined style={{ color: '#52c41a' }} />,
        duration: 3,
      });
      setPopoverVisible(false);
    } catch (error) {
      hide();
      console.error('Error saving flashcard:', error);
      message.error({
        content: 'Failed to save to flash cards',
        duration: 3,
      });
    }
  };

  const handleAskAI = () => {
    setChatSelectedText(selectedText);
    setIsChatOpen(true);
    setPopoverVisible(false);
  };

  if (!pdfUrl) {
    return null;
  }

  const handleError = (e) => {
    console.error('Error loading PDF:', e);
    setError(`Failed to load PDF: ${e.message}`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="flex items-center p-4 bg-gray-800">
        <button
          onClick={() => navigate(`/dashboard/${subject}/books`)}
          className="flex items-center text-white hover:text-blue-500 transition-colors"
        >
          <ArrowLeftOutlined className="mr-2" />
          Back to Books
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-500 bg-red-100 border border-red-400 rounded p-4 m-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <p className="mt-2 text-sm">URL: {pdfUrl}</p>
        </div>
      )}

      {/* Loading Display */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Selection Popup */}
      <Popover
        open={popoverVisible}
        onOpenChange={setPopoverVisible}
        content={
          <SelectionPopup
            selectedText={selectedText}
            onSaveToFlashCard={handleSaveToFlashCard}
            onAskAI={handleAskAI}
          />
        }
        trigger="click"
        // destroyTooltipOnHide
        overlayInnerStyle={{
          padding: '12px',
        }}
        overlayStyle={{
          position: 'absolute',
          left: '50%',
          top: '40%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
        }}
        arrow={false}
      />

      {/* PDF Viewer */}
      {!loading && !error && (
        <div className="w-full h-[calc(100vh-64px)] bg-white">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js">
            <Viewer
              fileUrl={pdfUrl}
              plugins={[defaultLayoutPluginInstance]}
              onError={handleError}
              defaultScale={1}
              theme={{
                theme: 'dark',
              }}
              renderLoader={(percentages) => (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-500">
                      Loading PDF... {Math.round(percentages)}%
                    </p>
                  </div>
                </div>
              )}
            />
          </Worker>
        </div>
      )}
    </div>
  );
};

export default PdfViewer; 