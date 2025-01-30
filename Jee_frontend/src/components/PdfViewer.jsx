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
  const { handleTextSelection } = useSelection();
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [viewerContainerRef, setViewerContainerRef] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [visiblePageRange, setVisiblePageRange] = useState({
    start: 0,
    end: 3,
  });
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const [initialZoomSet, setInitialZoomSet] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  // Refs
  const selectionTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Update screen size detection
  useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth < 768;
      setIsSmallScreen(smallScreen);

      // Reset zoom when screen size changes
      if (!initialZoomSet) {
        setInitialZoomSet(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, [initialZoomSet]);

  // Handle chat opening in mobile view
  const handleOpenChat = useCallback(() => {
    if (isSmallScreen) {
      // Reset any active states
      setIsAreaSelecting(false);
      setShowConfirmation(false);
      setSelectedText('');

      // Hide PDF viewer in mobile when chat is open
      document.body.style.overflow = 'hidden';

      // Force chat to open
      requestAnimationFrame(() => {
        setIsChatOpen(true);
      });
    } else {
      setIsChatOpen(true);
    }
  }, [isSmallScreen, setIsChatOpen]);

  // Cleanup body style on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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

        // Store the selected text
        setSelectedText(processedText);

        // Call the text selection handler
        handleTextSelection(e, processedText);
      }, 250);
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

  const handleAskAI = useCallback(
    (text, source) => {
      // Ensure we have text to send
      if (!text) return;

      // Open chat first and wait for it to be ready
      handleOpenChat();

      // Clear selection after a short delay
      setTimeout(() => {
        window.getSelection()?.removeAllRanges();
        setSelectedText('');

        // Dispatch the question event after chat is open
        const eventData = {
          detail: {
            question: text,
            source: source || `PDF: ${pdfTitle}`,
          },
        };
        window.dispatchEvent(new CustomEvent('setAIQuestion', eventData));
      }, 300); // Increased delay to ensure chat is open
    },
    [handleOpenChat, pdfTitle]
  );

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

    handleOpenChat();
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

  // Custom toolbar plugin
  const customToolbarPlugin = toolbarPlugin({
    renderDefaultToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const {
            CurrentPageInput,
            Download,
            EnterFullScreen,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            Print,
            ZoomIn,
            ZoomOut,
          } = slots;
          return (
            <div className="flex flex-wrap items-center justify-center gap-1 px-2">
              <div className="flex items-center gap-1">
                <GoToPreviousPage />
                <CurrentPageInput />
                <span className="text-white">/</span>
                <NumberOfPages />
                <GoToNextPage />
              </div>
              <div className="flex items-center gap-1">
                <ZoomOut />
                <ZoomIn />
              </div>
              <div className="flex items-center gap-1">
                <Download />
                <Print />
                <EnterFullScreen />
              </div>
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    renderPage: ({ canvasLayer, textLayer, annotationLayer }) => {
      return (
        <div
          style={{
            margin: '0 auto',
            maxWidth: isSmallScreen ? '100%' : '900px',
            position: 'relative',
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: isSmallScreen ? '0' : '8px',
            boxShadow: isSmallScreen
              ? 'none'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden',
            contain: 'paint',
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
    toolbarPlugin: customToolbarPlugin,
  });

  // Update scroll handler
  const handleScroll = useCallback(
    (e) => {
      const container = e.target;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;

      // Calculate which pages should be visible
      const totalHeight = scrollHeight;
      const pageHeight =
        totalHeight / (visiblePageRange.end - visiblePageRange.start + 1);
      const currentPage = Math.floor(scrollTop / pageHeight);

      // Load 2 pages before and after the current page
      const newStart = Math.max(0, currentPage - 2);
      const newEnd = currentPage + 2;

      if (
        newStart !== visiblePageRange.start ||
        newEnd !== visiblePageRange.end
      ) {
        setVisiblePageRange({ start: newStart, end: newEnd });
      }
    },
    [visiblePageRange]
  );

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
        top: isSmallScreen ? '0' : '64px',
        left: isSmallScreen ? '0' : isSidebarOpen ? '256px' : '0',
        right: isSmallScreen ? '0' : isChatOpen ? '450px' : '0',
        bottom: '0',
        zIndex: isSmallScreen ? '50' : 'auto',
        display: isSmallScreen && isChatOpen ? 'none' : 'block', // Hide PDF viewer when chat is open on mobile
      }}
      ref={setViewerContainerRef}
    >
      {/* Modern Toolbar */}
      <div
        className={`
        absolute top-0 left-0 right-0 
        ${isSmallScreen ? 'h-14' : 'h-16'} 
        flex items-center justify-between px-3 sm:px-6 z-50 
        bg-[#1e293b] border-b border-white/10
        ${isSmallScreen ? 'safe-area-top' : ''}
      `}
      >
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onBack ? onBack() : navigate(`/dashboard/${subject}/books`)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <ArrowLeftOutlined
              className={isSmallScreen ? 'w-4 h-4' : 'w-5 h-5'}
            />
            <span className={`font-medium ${isSmallScreen ? 'text-sm' : ''}`}>
              Back
            </span>
          </button>
        </div>

        {/* Center Section - PDF Title */}
        <div className={`hidden ${isSmallScreen ? '' : 'md:block'}`}>
          <h1 className="text-white/90 font-medium truncate max-w-[200px] sm:max-w-[400px]">
            {pdfTitle}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
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
              group relative px-3 py-1.5 rounded-lg transition-all duration-200
              ${
                isAreaSelecting
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300'
              }
              border border-white/10
              ${isSmallScreen ? 'text-sm' : ''}
            `}
          >
            <div className="flex items-center gap-1.5">
              <span className="flex items-center justify-center">
                {isAreaSelecting ? (
                  <CloseOutlined
                    className={isSmallScreen ? 'w-4 h-4' : 'w-5 h-5'}
                  />
                ) : (
                  <CameraOutlined
                    className={isSmallScreen ? 'w-4 h-4' : 'w-5 h-5'}
                  />
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
          top: isSmallScreen ? '56px' : '64px',
          padding: isSmallScreen ? '0.5rem' : '2rem',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
      >
        <Worker
          workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js"
          workerOptions={{
            workerSrc:
              'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js',
            maxImageSize: 1024 * 1024 * 32,
            isOffscreenCanvasSupported: true,
          }}
        >
          <Viewer
            fileUrl={pdfUrl}
            defaultScale={
              isSmallScreen
                ? SpecialZoomLevel.PageFit
                : SpecialZoomLevel.PageWidth
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
              customToolbarPlugin,
            ]}
            onDocumentLoad={() => setLoading(false)}
            characterMap={{
              isCompressed: true,
              useSystemFonts: true,
            }}
            renderInteractionMode="custom"
            pageLayout={{
              transformScale: isSmallScreen ? 1 : 0.8,
              viewportScale: Math.min(window.devicePixelRatio, 2),
              renderQuality: 1.0,
              enableOptimization: true,
              enableCache: true,
              lazyLoading: true,
              pageGap: isSmallScreen ? 12 : 24,
              visiblePages: visiblePageRange,
              unloadInvisiblePages: true,
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
        selectedText={selectedText}
      />

      {/* Confirmation Modal */}
      <Modal
        title={null}
        open={showConfirmation}
        footer={null}
        closable={false}
        centered
        className="confirmation-modal"
        width={isSmallScreen ? '90%' : 500}
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
                  maxHeight: isSmallScreen ? '200px' : '300px',
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
