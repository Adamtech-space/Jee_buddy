import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { message, Modal } from 'antd';
import {
  ArrowLeftOutlined,
  CameraOutlined,
  CheckOutlined,
  RedoOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { saveFlashCard } from '../interceptors/services';
import SelectionPopup from './SelectionPopup';
import AreaSelector from './AreaSelector';
import { useSelection } from '../hooks/useSelection';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';

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
          onClick={() =>
            onBack ? onBack() : navigate(`/dashboard/${subject}/books`)
          }
          className="flex items-center gap-1 px-3 py-1.5 text-white hover:text-blue-500 transition-colors bg-gray-800/80 backdrop-blur rounded-lg"
        >
          <ArrowLeftOutlined />
          <span className={isMobile ? 'text-sm' : ''}>Back</span>
        </button>
      </div>

      {/* Desktop Capture Button (Top Right) */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 md:flex hidden">
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
            group relative px-4 py-2 rounded-xl transition-all duration-300 ease-in-out
            ${
              isAreaSelecting
                ? 'bg-red-500/90 hover:bg-red-600/90 shadow-lg shadow-red-500/30'
                : 'bg-gray-800/90 hover:bg-gray-700/90'
            }
            backdrop-blur-sm border border-white/10
          `}
        >
          <div className="relative flex items-center gap-3">
            <span
              className={`flex items-center justify-center ${isAreaSelecting ? 'text-white' : 'text-blue-400'}`}
            >
              {isAreaSelecting ? (
                <CloseOutlined className="text-base" />
              ) : (
                <div className="relative">
                  <CameraOutlined className="text-base" />
                  <div className="absolute -right-1 -bottom-1 text-[10px] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform duration-300">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 5L21 12M21 12L14 19M21 12H3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </span>
            <span
              className={`text-sm font-medium flex items-center gap-1 ${isAreaSelecting ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}
            >
              {isAreaSelecting ? (
                'Cancel'
              ) : (
                <>
                  Drag to capture
                  <span className="text-[10px] opacity-60 bg-white/10 px-1.5 py-0.5 rounded">
                    Click
                  </span>
                </>
              )}
            </span>
          </div>
        </button>
      </div>

      {/* Mobile Capture Button (Bottom) */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
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
            group relative px-4 py-2 rounded-full transition-all duration-300 ease-in-out
            ${
              isAreaSelecting
                ? 'bg-red-500/90 hover:bg-red-600/90 shadow-lg shadow-red-500/30'
                : 'bg-gray-800/90 hover:bg-gray-700/90'
            }
            backdrop-blur-sm border border-white/10 shadow-lg
          `}
        >
          <div className="relative flex items-center gap-3">
            <span
              className={`flex items-center justify-center ${isAreaSelecting ? 'text-white' : 'text-blue-400'}`}
            >
              {isAreaSelecting ? (
                <CloseOutlined className="text-lg" />
              ) : (
                <div className="relative">
                  <CameraOutlined className="text-lg" />
                  <div className="absolute -right-1 -bottom-1 text-xs group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform duration-300">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 5L21 12M21 12L14 19M21 12H3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </span>
            <span
              className={`text-sm font-medium flex items-center gap-1 ${isAreaSelecting ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}
            >
              {isAreaSelecting ? (
                'Cancel'
              ) : (
                <>
                  Drag to capture
                  <span className="text-[10px] opacity-60 bg-white/10 px-1.5 py-0.5 rounded">
                    Click
                  </span>
                </>
              )}
            </span>
          </div>
        </button>
      </div>

      {/* Area Selector */}
      {isAreaSelecting && (
        <div className="fixed inset-0" style={{ zIndex: 40 }}>
          <AreaSelector
            onAreaSelected={handleAreaSelected}
            onCancel={handleCancelAreaSelection}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-[72px] left-4 right-4 z-[110] text-red-500 bg-red-100 border border-red-400 rounded p-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
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

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Selection"
        open={showConfirmation}
        footer={null}
        closable={false}
        centered
        className="confirmation-modal"
      >
        <div className="space-y-4">
          {capturedImage && (
            <div className="relative bg-gray-800/50 rounded-lg p-2">
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
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleReselect}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <RedoOutlined /> Reselect
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
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