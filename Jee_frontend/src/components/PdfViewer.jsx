import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useParams,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import { message, Modal } from 'antd';
import {
  ArrowLeftOutlined,
  CameraOutlined,
  CheckOutlined,
  RedoOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { saveFlashCard } from '../interceptors/services';
import SelectionPopup from './SelectionPopup';
import AreaSelector from './AreaSelector';
import { useSelection } from '../hooks/useSelection';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

const PdfViewer = ({ pdfUrl: propsPdfUrl, subject: propsSubject, onBack }) => {
  const { pdfUrl: encodedUrl, subject: routeSubject } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isChatOpen, isSidebarOpen, setIsChatOpen } = useOutletContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { handleTextSelection } = useSelection();
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [viewerContainerRef, setViewerContainerRef] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Refs
  const selectionTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Add state for page range
  const [visiblePageRange, setVisiblePageRange] = useState({ start: 0, end: 3 });

  // Memoized selection handler
  const handleSelection = useCallback(
    (e) => {
      // Don't handle selection if clicking on controls or during loading
      if (
        loading ||
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLInputElement ||
        e.target.closest('.rpv-core__viewer-navigation') ||
        e.target.closest('.rpv-core__viewer-toolbar') ||
        isAreaSelecting
      ) {
        return;
      }

      // Clear any existing timer
      if (selectionTimerRef.current) {
        clearTimeout(selectionTimerRef.current);
      }

      // Set a new timer to handle the selection
      selectionTimerRef.current = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString()?.trim();

        // Ignore if selection is too short or too long
        if (
          !selectedText ||
          selectedText.length < 2 ||
          selectedText.length > 1000
        ) {
          return;
        }

        // Process mathematical notation
        let processedText = selectedText
          .replace(/÷/g, '\\div')
          .replace(/×/g, '\\times')
          .replace(/√/g, '\\sqrt')
          .replace(/∞/g, '\\infty')
          .replace(/≠/g, '\\neq')
          .replace(/≤/g, '\\leq')
          .replace(/≥/g, '\\geq')
          .replace(/±/g, '\\pm')
          .replace(/∓/g, '\\mp')
          .replace(/∑/g, '\\sum')
          .replace(/∏/g, '\\prod')
          .replace(/∫/g, '\\int')
          .replace(/∂/g, '\\partial')
          .replace(/∇/g, '\\nabla')
          .replace(/∆/g, '\\Delta')
          .replace(/π/g, '\\pi')
          .replace(/θ/g, '\\theta')
          .replace(/α/g, '\\alpha')
          .replace(/β/g, '\\beta')
          .replace(/γ/g, '\\gamma')
          .replace(/δ/g, '\\delta')
          .replace(/ε/g, '\\epsilon')
          .replace(/ζ/g, '\\zeta')
          .replace(/η/g, '\\eta')
          .replace(/λ/g, '\\lambda')
          .replace(/μ/g, '\\mu')
          .replace(/ν/g, '\\nu')
          .replace(/ξ/g, '\\xi')
          .replace(/ρ/g, '\\rho')
          .replace(/σ/g, '\\sigma')
          .replace(/τ/g, '\\tau')
          .replace(/φ/g, '\\phi')
          .replace(/χ/g, '\\chi')
          .replace(/ψ/g, '\\psi')
          .replace(/ω/g, '\\omega')
          // Process fractions
          .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
          // Process superscripts
          .replace(/\^(\d+)/g, '^{$1}')
          // Process subscripts
          .replace(/_(\d+)/g, '_{$1}');

        // Wrap in math delimiters if it contains math symbols
        if (processedText.match(/[+\-*/=<>≠≤≥±∓∑∏∫∂∇∆π\\]/)) {
          processedText = `$${processedText}$`;
        }

        handleTextSelection(e, processedText);
      }, 250); // Increased debounce time for better control
    },
    [loading, isAreaSelecting, handleTextSelection]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (selectionTimerRef.current) {
        clearTimeout(selectionTimerRef.current);
      }
    };
  }, []);

  // Get the actual URL from props, state, or params
  const pdfUrl =
    propsPdfUrl ||
    location.state?.pdfUrl ||
    decodeURIComponent(encodedUrl || '');
  const subject = propsSubject || routeSubject;
  const pdfTitle = decodeURIComponent(
    pdfUrl.split('/').pop().replace('.pdf', '')
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check PDF URL and load document
  useEffect(() => {
    if (!pdfUrl) {
      setError('PDF URL not found');
      message.error('PDF URL not found');
      navigate(`/dashboard/${subject}/books`);
    } else {
      setLoading(true);
      fetch(pdfUrl, { method: 'HEAD' })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
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

  const handleAskAI = (text, source) => {
    setIsChatOpen(true);

    // Ensure chat is open before dispatching event
    setTimeout(() => {
      const eventData = {
        detail: {
          question: text,
          source: source || `PDF: ${pdfTitle}`,
        },
      };

      window.dispatchEvent(new CustomEvent('setAIQuestion', eventData));
    }, 100); // Short delay to ensure chat is open
  };

  const handleAreaSelected = async (rect) => {
    if (!viewerContainerRef) return;

    try {
      // Get the PDF container element
      const pdfContainer =
        viewerContainerRef.querySelector('.rpv-core__viewer');
      if (!pdfContainer) {
        message.error('Could not find PDF content');
        return;
      }

      // Calculate the actual position relative to the PDF container
      const containerRect = pdfContainer.getBoundingClientRect();
      const captureRect = {
        x: rect.x - containerRect.left,
        y: rect.y - containerRect.top,
        width: rect.width,
        height: rect.height,
      };

      // Capture the selected area
      const canvas = await html2canvas(pdfContainer, {
        x: captureRect.x,
        y: captureRect.y,
        width: captureRect.width,
        height: captureRect.height,
        backgroundColor: null,
        scale: window.devicePixelRatio,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Create a smaller canvas for preview
      const previewCanvas = document.createElement('canvas');
      const maxPreviewWidth = 200; // Maximum width for preview
      const maxPreviewHeight = 150; // Maximum height for preview

      // Calculate preview dimensions maintaining aspect ratio
      let previewWidth = canvas.width;
      let previewHeight = canvas.height;

      if (previewWidth > maxPreviewWidth) {
        previewWidth = maxPreviewWidth;
        previewHeight = (canvas.height * maxPreviewWidth) / canvas.width;
      }
      if (previewHeight > maxPreviewHeight) {
        previewHeight = maxPreviewHeight;
        previewWidth = (canvas.width * maxPreviewHeight) / canvas.height;
      }

      previewCanvas.width = previewWidth;
      previewCanvas.height = previewHeight;

      // Draw resized image
      const ctx = previewCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, 0, previewWidth, previewHeight);

      // Store captured image data
      setCapturedImage({
        imageData: canvas.toDataURL('image/png'),
        previewImageData: previewCanvas.toDataURL('image/png'),
        width: previewWidth,
        height: previewHeight,
      });

      // Show confirmation dialog
      setShowConfirmation(true);
    } catch (err) {
      console.error('Error capturing area:', err);
      message.error('Failed to capture the selected area');
    } finally {
      setIsAreaSelecting(false);
    }
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    setIsChatOpen(true);
    setTimeout(() => {
      const eventData = {
        detail: {
          source: `PDF: ${pdfTitle}`,
          imageData: capturedImage.imageData,
          previewImageData: capturedImage.previewImageData,
          imageWidth: capturedImage.width,
          imageHeight: capturedImage.height,
        },
      };
      window.dispatchEvent(new CustomEvent('setAIQuestion', eventData));
    }, 100);

    setShowConfirmation(false);
    setCapturedImage(null);
    message.success('Image captured - Ask your question in the chat');
  };

  const handleReselect = () => {
    setShowConfirmation(false);
    setCapturedImage(null);
    setIsAreaSelecting(true);
  };

  const handleCancelAreaSelection = () => {
    setIsAreaSelecting(false);
  };

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const toolbarPluginInstance = toolbarPlugin();

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    renderPage: ({ canvasLayer, textLayer, annotationLayer }) => {
      return (
        <div
          style={{
            margin: '0 auto',
            maxWidth: '900px',
            position: 'relative',
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow:
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden',
            contain: 'paint',  // Add paint containment
          }}
        >
          <div style={{ position: 'absolute', inset: 0, contain: 'paint' }}>
            {canvasLayer.children}
          </div>
          <div style={{ position: 'absolute', inset: 0, contain: 'paint' }}>
            {textLayer.children}
          </div>
          <div style={{ position: 'absolute', inset: 0, contain: 'paint' }}>
            {annotationLayer.children}
          </div>
        </div>
      );
    },
    renderLoader: (percentages) => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading PDF... {Math.round(percentages)}%</p>
        </div>
      </div>
    ),
    toolbarPlugin: {
      ...toolbarPluginInstance,
      fullScreenPlugin: {
        onEnterFullScreen: (zoom) => zoom(SpecialZoomLevel.PageFit),
        onExitFullScreen: (zoom) => zoom(SpecialZoomLevel.PageWidth),
      },
    },
  });

  // Add scroll handler for dynamic page loading
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;

    // Calculate which pages should be visible
    const totalHeight = scrollHeight;
    const pageHeight = totalHeight / (visiblePageRange.end - visiblePageRange.start + 1);
    const currentPage = Math.floor(scrollTop / pageHeight);
    
    // Load 2 pages before and after the current page
    const newStart = Math.max(0, currentPage - 2);
    const newEnd = currentPage + 2;

    if (newStart !== visiblePageRange.start || newEnd !== visiblePageRange.end) {
      setVisiblePageRange({ start: newStart, end: newEnd });
    }
  }, [visiblePageRange]);

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  if (!pdfUrl) return null;

  return (
    <div
      className="fixed bg-[#0f172a] transition-all duration-300 ease-in-out"
      style={{
        top: isMobile ? '0' : '64px',
        left: isMobile ? '0' : isSidebarOpen ? '256px' : '0',
        right: isMobile ? '0' : isChatOpen ? '450px' : '0',
        bottom: '0',
      }}
      ref={setViewerContainerRef}
    >
      {/* Modern Toolbar */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 bg-[#1e293b] border-b border-white/10">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              onBack ? onBack() : navigate(`/dashboard/${subject}/books`)
            }
            className="flex items-center gap-2 px-4 py-2 text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <ArrowLeftOutlined className="text-lg" />
            <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
              Back
            </span>
          </button>
        </div>

        {/* Center Section - PDF Title */}
        <div className="hidden md:block">
          <h1 className="text-white/90 font-medium truncate max-w-[400px]">
            {pdfTitle}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAreaSelecting) {
                handleCancelAreaSelection();
              } else {
                setIsAreaSelecting(true);
              }
            }}
            className={`
              group relative px-4 py-2 rounded-lg transition-all duration-200
              ${
                isAreaSelecting
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300'
              }
              border border-white/10
            `}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center">
                {isAreaSelecting ? (
                  <CloseOutlined className="text-lg" />
                ) : (
                  <CameraOutlined className="text-lg" />
                )}
              </span>
              <span className="font-medium">
                {isAreaSelecting ? 'Cancel' : 'Capture'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Area Selector */}
      {isAreaSelecting && (
        <div
          className="fixed inset-0"
          style={{
            zIndex: 40,
            backgroundColor: 'transparent',
          }}
        >
          <AreaSelector
            onAreaSelected={handleAreaSelected}
            onCancel={handleCancelAreaSelection}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[110] w-full max-w-md">
          <div className="mx-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-300/90 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-auto bg-[#0f172a] scroll-smooth"
        style={{
          top: '64px',
          padding: '2rem',
          willChange: 'transform',  // Optimize for animations
          transform: 'translateZ(0)',  // Force GPU acceleration
        }}
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
      >
        <Worker 
          workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js"
          workerOptions={{
            workerSrc: "https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js",
            maxImageSize: 1024 * 1024 * 32,  // Increase max image size to 32MB
            isOffscreenCanvasSupported: true,  // Enable offscreen canvas if supported
          }}
        >
          <Viewer
            fileUrl={pdfUrl}
            defaultScale={
              isMobile ? SpecialZoomLevel.PageFit : SpecialZoomLevel.PageWidth
            }
            theme={{
              theme: 'dark',
              background: '#0f172a',
            }}
            className={`h-full ${isAreaSelecting ? 'pointer-events-none' : ''}`}
            renderMode="canvas"
            plugins={[
              defaultLayoutPluginInstance,
              pageNavigationPluginInstance,
              toolbarPluginInstance,
            ]}
            onDocumentLoad={() => setLoading(false)}
            characterMap={{
              isCompressed: true,
              useSystemFonts: true,
            }}
            renderInteractionMode="custom"
            pageLayout={{
              transformScale: 0.8,
              viewportScale: Math.min(1.5, window.devicePixelRatio), // Limit viewport scale
              renderQuality: 1.0,  // Reduce render quality slightly for better performance
              enableOptimization: true,
              enableCache: true,
              lazyLoading: true,
              pageGap: 24,
              visiblePages: visiblePageRange,  // Only render visible pages
              unloadInvisiblePages: true,  // Unload invisible pages to save memory
            }}
            renderPageProps={{
              enableOptimizedRendering: true,
              enableFastRendering: true,
              enableLazyLoading: true,
            }}
          />
        </Worker>
      </div>

      {/* Selection Popup */}
      <SelectionPopup
        onSaveToFlashCard={handleSaveToFlashCard}
        onAskAI={handleAskAI}
      />

      {/* Confirmation Modal */}
      <Modal
        title={null}
        open={showConfirmation}
        footer={null}
        closable={false}
        centered
        className="confirmation-modal"
        width={500}
      >
        <div className="p-2">
          <h3 className="text-lg font-medium text-gray-200 mb-4">
            Confirm Selection
          </h3>
          {capturedImage && (
            <div className="relative rounded-xl overflow-hidden bg-gray-800/50 p-3 mb-4">
              <img
                src={capturedImage.imageData}
                alt="Selected area"
                className="w-full h-auto rounded-lg"
                style={{
                  maxHeight: '300px',
                  objectFit: 'contain',
                  maxWidth: '100%',
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleReselect}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RedoOutlined /> Reselect
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500/80 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <CheckOutlined /> Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

PdfViewer.propTypes = {
  pdfUrl: PropTypes.string,
  subject: PropTypes.string,
  onBack: PropTypes.func,
};

export default PdfViewer;
