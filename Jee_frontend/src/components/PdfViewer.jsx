import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { message, Popover } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, RobotOutlined } from '@ant-design/icons';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { saveFlashCard } from '../interceptors/services';
import PropTypes from 'prop-types';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const SelectionPopup = ({ selectedText, onSaveToFlashCard, onAskAI }) => (
  <div className="flex flex-col space-y-2 p-2">
    <div className="text-sm text-gray-500 mb-2 max-w-xs overflow-hidden text-ellipsis">
      {selectedText.length > 100 ? `${selectedText.substring(0, 100)}...` : selectedText}
    </div>
    <button
      onClick={onSaveToFlashCard}
      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      <SaveOutlined className="mr-2" />
      Save to Flash Cards
    </button>
    <button
      onClick={onAskAI}
      className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
    >
      <RobotOutlined className="mr-2" />
      Ask AI
    </button>
  </div>
);

SelectionPopup.propTypes = {
  selectedText: PropTypes.string.isRequired,
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired
};

const PdfViewer = () => {
  const { subject, pdfUrl: encodedUrl } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Get the actual URL from either state or params
  const pdfUrl = location.state?.pdfUrl || decodeURIComponent(encodedUrl);
  const pdfTitle = decodeURIComponent(pdfUrl.split('/').pop().replace('.pdf', ''));

  // Initialize plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (!pdfUrl) {
      setError('PDF URL not found');
      message.error('PDF URL not found');
      navigate(`/dashboard/${subject}/books`);
    } else {
      setLoading(true);
      console.log('Attempting to load PDF from:', pdfUrl);

      // Check if the PDF URL is accessible
      fetch(pdfUrl, { 
        method: 'HEAD',
        headers: {
          'Accept': 'application/pdf'
        }
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        console.log('PDF URL is accessible');
        setLoading(false);
      })
      .catch(err => {
        console.error('Error checking PDF URL:', err);
        setError(`Failed to access PDF: ${err.message}`);
        setLoading(false);
      });
    }
  }, [pdfUrl, navigate, subject]);

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text) {
        setSelectedText(text);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMousePosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setPopoverVisible(true);
      } else {
        setPopoverVisible(false);
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, []);

  const handleSaveToFlashCard = async () => {
    try {
      await saveFlashCard({
        subject,
        topic: pdfTitle,
        content: selectedText,
        source: pdfTitle
      });
      message.success('Saved to flash cards');
      setPopoverVisible(false);
    } catch (error) {
      message.error('Failed to save to flash cards');
    }
  };

  const handleAskAI = () => {
    // This will be handled by the chat component
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
        destroyTooltipOnHide
        visible={popoverVisible}
        overlayStyle={{
          position: 'fixed',
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -100%)'
        }}
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
                    <p className="text-gray-500">Loading PDF... {Math.round(percentages)}%</p>
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