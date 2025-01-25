import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { message } from 'antd';
import {
  ArrowLeftOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { saveFlashCard } from '../interceptors/services';
import SelectionPopup from './SelectionPopup';
import AreaSelector from './AreaSelector';
import { useSelection } from '../hooks/useSelection';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';

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
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [viewerContainerRef, setViewerContainerRef] = useState(null);

  // Initialize MathJax
  useEffect(() => {
    // Configure MathJax
    window.MathJax = {
      tex: {
        inlineMath: [
          ['$', '$'],
          ['\\(', '\\)'],
        ],
        displayMath: [
          ['$$', '$$'],
          ['\\[', '\\]'],
        ],
        processEscapes: true,
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
      },
      startup: {
        typeset: false, // Prevent automatic typesetting on startup
      },
    };

    // Load MathJax script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize zoom plugin with custom levels
  const zoomPluginInstance = zoomPlugin({
    levels: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3],
  });
  const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;

  // Get the actual URL from either state or params
  const pdfUrl = location.state?.pdfUrl || decodeURIComponent(encodedUrl);
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

      // Convert to base64
      const imageData = canvas.toDataURL('image/png'); // Original size for AI
      const previewImageData = previewCanvas.toDataURL('image/png'); // Preview size for chat

      // Open chat with the image
      setIsChatOpen(true);
      setTimeout(() => {
        const eventData = {
          detail: {
            source: `PDF: ${pdfTitle}`,
            imageData: imageData, // Full size for AI processing
            previewImageData: previewImageData, // Small size for chat display
            imageWidth: previewWidth,
            imageHeight: previewHeight,
          },
        };
        window.dispatchEvent(new CustomEvent('setAIQuestion', eventData));
      }, 100);

      message.success('Image captured - Ask your question in the chat');
    } catch (err) {
      console.error('Error capturing area:', err);
      message.error('Failed to capture the selected area');
    } finally {
      setIsAreaSelecting(false);
    }
  };

  const handleCancelAreaSelection = () => {
    setIsAreaSelecting(false);
  };

  // Enhanced text selection handler
  const handleSelection = (e) => {
    // Don't handle selection if clicking on controls or during loading
    if (
      loading ||
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLInputElement ||
      e.target.closest('.rpv-core__viewer-navigation') ||
      e.target.closest('.rpv-core__viewer-toolbar')
    ) {
      return;
    }

    // Use requestAnimationFrame to ensure selection is complete
    requestAnimationFrame(() => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) return;

      let selectedText = selection.toString().trim();

      // Process mathematical notation
      if (selectedText) {
        // Replace common math symbols with LaTeX notation
        selectedText = selectedText
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

        // Wrap the text in math delimiters if it contains math symbols
        if (selectedText.match(/[+\-*/=<>≠≤≥±∓∑∏∫∂∇∆π\\]/)) {
          selectedText = `$${selectedText}$`;
        }
      }

      handleTextSelection(e, selectedText);
    });
  };

  if (!pdfUrl) return null;

  return (
    <div
      className="fixed bg-gray-900 transition-all duration-300 ease-in-out"
      style={{
        top: isMobile ? '0' : '64px',
        left: isMobile ? '0' : isSidebarOpen ? '256px' : '0',
        right: isMobile ? '0' : isChatOpen ? '450px' : '0',
        bottom: '0',
      }}
      onMouseUp={handleSelection}
      onTouchEnd={handleSelection}
      ref={setViewerContainerRef}
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

      {/* Zoom and Screenshot controls - Right side */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsAreaSelecting(true)}
          className="p-1.5 text-white hover:text-blue-500 transition-colors bg-gray-800/80 backdrop-blur rounded-lg"
          title="Select area to ask about"
        >
          <CameraOutlined className={isMobile ? 'text-sm' : ''} />
        </button>

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
              <span className={isMobile ? 'text-sm' : ''}>
                {Math.round(props.scale * 100)}%
              </span>
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

      {/* Area Selector */}
      {isAreaSelecting && (
        <AreaSelector
          onAreaSelected={handleAreaSelected}
          onCancel={handleCancelAreaSelection}
        />
      )}

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
      <div
        className="absolute inset-0 bg-gray-900"
        style={{ top: isMobile ? '56px' : 0 }}
      >
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            defaultScale={isMobile ? 1 : 'PageWidth'}
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

PdfViewer.propTypes = {
  onClick: PropTypes.func,
  scale: PropTypes.number,
};

export default PdfViewer; 