import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import { message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { saveFlashCard } from '../interceptors/services';
import { useSelection } from '../context/SelectionContext';
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
  const { setIsChatOpen } = useOutletContext();
  const { handleTextSelection } = useSelection();

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
      fetch(pdfUrl, { method: 'HEAD' })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error checking PDF URL:', err);
          setError(`Failed to access PDF: ${err.message}`);
          setLoading(false);
        });
    }
  }, [pdfUrl, navigate, subject]);

  const handleSaveToFlashCard = async (text) => {
    const hide = message.loading('Saving to flash cards...', 0);
    try {
      await saveFlashCard({
        subject,
        topic: pdfTitle,
        content: text,
        source: pdfTitle,
      });
      hide();
      message.success('Successfully saved to flash cards!');
    } catch (error) {
      hide();
      console.error('Error saving flashcard:', error);
      message.error('Failed to save to flash cards');
    }
  };

  const handleAskAI = (text) => {
    setIsChatOpen(true);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('setAIQuestion', { 
        detail: { 
          question: text,
          source: pdfTitle
        }
      }));
    }, 100);
  };

  if (!pdfUrl) return null;

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
        </div>
      )}

      {/* Loading Display */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* PDF Viewer */}
      {!loading && !error && (
        <div 
          className="w-full h-[calc(100vh-64px)] bg-white relative"
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
        >
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js">
            <Viewer
              fileUrl={pdfUrl}
              plugins={[defaultLayoutPluginInstance]}
              onError={(e) => {
                console.error('Error loading PDF:', e);
                setError(`Failed to load PDF: ${e.message}`);
                setLoading(false);
              }}
              defaultScale={1}
              theme={{ theme: 'dark' }}
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

      {/* Selection Popup */}
      <SelectionPopup
        onSaveToFlashCard={handleSaveToFlashCard}
        onAskAI={handleAskAI}
      />
    </div>
  );
};

export default PdfViewer; 