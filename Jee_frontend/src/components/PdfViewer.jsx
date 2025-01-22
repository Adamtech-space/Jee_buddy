import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { message } from 'antd';
import { ArrowLeftOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { saveFlashCard } from '../interceptors/services';
import SelectionPopup from './SelectionPopup';
import { useSelection } from '../context/SelectionContext';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';

const PdfViewer = () => {
  const { pdfUrl: encodedUrl, subject } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isChatOpen, isSidebarOpen, setIsChatOpen } = useOutletContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { handleTextSelection } = useSelection();

  // Initialize zoom plugin with custom levels
  const zoomPluginInstance = zoomPlugin({
    levels: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3],
  });
  const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;

  // Get the actual URL from either state or params
  const pdfUrl = location.state?.pdfUrl || decodeURIComponent(encodedUrl);
  const pdfTitle = decodeURIComponent(pdfUrl.split('/').pop().replace('.pdf', ''));

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    console.log('PdfViewer - handleAskAI called with text:', text);
    console.log('PdfViewer - PDF Title:', pdfTitle);
    
    setIsChatOpen(true);
    setTimeout(() => {
      const eventData = {
        detail: { 
          question: text,
          source: `PDF: ${pdfTitle}`
        }
      };
      console.log('PdfViewer - Dispatching event with data:', eventData);
      window.dispatchEvent(new CustomEvent('setAIQuestion', eventData));
    }, 500); // Increased timeout to ensure chat is open
  };

  if (!pdfUrl) return null;

  return (
    <div 
      className="fixed bg-gray-900 transition-all duration-300 ease-in-out"
      style={{
        top: isMobile ? '0' : '64px',
        left: isMobile ? '0' : (isSidebarOpen ? '256px' : '0'),
        right: isMobile ? '0' : (isChatOpen ? '450px' : '0'),
        bottom: '0',
      }}
      onMouseUp={(e) => {
        // Only handle selection if not clicking on buttons or inputs
        if (!(e.target instanceof HTMLButtonElement) && 
            !(e.target instanceof HTMLInputElement)) {
          handleTextSelection(e);
        }
      }}
      onTouchEnd={(e) => {
        // Only handle selection if not touching buttons or inputs
        if (!(e.target instanceof HTMLButtonElement) && 
            !(e.target instanceof HTMLInputElement)) {
          handleTextSelection(e);
        }
      }}
    >
      {/* Back button - Left side */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate(`/dashboard/${subject}/books`)}
          className="flex items-center gap-1 px-3 py-1.5 text-white hover:text-blue-500 transition-colors bg-gray-800/80 backdrop-blur rounded-lg"
        >
          <ArrowLeftOutlined />
          <span className={isMobile ? 'text-sm' : ''}>Back</span>
        </button>
      </div>

      {/* Zoom controls - Right side */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <ZoomOutButton>
          {(props) => (
            <button
              className="p-1.5 text-white hover:text-blue-500 transition-colors bg-gray-800/80 backdrop-blur rounded-lg"
              onClick={props.onClick}
            >
              <ZoomOutOutlined className={isMobile ? 'text-sm' : ''} />
            </button>
          )}
        </ZoomOutButton>
        
        <ZoomPopover>
          {(props) => (
            <button className="px-3 py-1.5 text-white bg-gray-800/80 backdrop-blur rounded-lg hover:text-blue-500 transition-colors">
              <span className={isMobile ? 'text-sm' : ''}>{Math.round(props.scale * 100)}%</span>
            </button>
          )}
        </ZoomPopover>
        
        <ZoomInButton>
          {(props) => (
            <button
              className="p-1.5 text-white hover:text-blue-500 transition-colors bg-gray-800/80 backdrop-blur rounded-lg"
              onClick={props.onClick}
            >
              <ZoomInOutlined className={isMobile ? 'text-sm' : ''} />
            </button>
          )}
        </ZoomInButton>
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
      <div className="absolute inset-0 bg-gray-900" style={{ top: isMobile ? '56px' : 0 }}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            defaultScale={isMobile ? 1 : "PageWidth"}
            theme="dark"
            plugins={[zoomPluginInstance]}
            className="h-full"
            renderLoader={(percentages) => (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p>Loading PDF... {Math.round(percentages)}%</p>
                </div>
              </div>
            )}
          />
        </Worker>
      </div>

      {/* Selection Popup */}
      <SelectionPopup
        onSaveToFlashCard={handleSaveToFlashCard}
        onAskAI={handleAskAI}
      />
    </div>
  );
};

export default PdfViewer; 