import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const FloatingReplyButton = ({ selectedText, onReply }) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={() => onReply(selectedText)}
      className="fixed bg-blue-500 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg hover:bg-blue-600 transition-colors"
      style={{ 
        left: window.getSelection().getRangeAt(0).getBoundingClientRect().left,
        top: window.getSelection().getRangeAt(0).getBoundingClientRect().bottom + window.scrollY + 10
      }}
    >
      <ChatBubbleLeftIcon className="w-5 h-5" />
      <span>Ask about this</span>
    </motion.button>
  );
};

FloatingReplyButton.propTypes = {
  selectedText: PropTypes.string.isRequired,
  onReply: PropTypes.func.isRequired
};

const TopicContent = () => {
  const { subject, topicId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [showReplyButton, setShowReplyButton] = useState(false);

  // Custom event for chat communication
  const askQuestion = useCallback((text) => {
    const event = new CustomEvent('askAboutSelection', { 
      detail: { text }
    });
    window.dispatchEvent(event);
    setShowReplyButton(false);
  }, []);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text.length > 0) {
        setSelectedText(text);
        setShowReplyButton(true);
      } else {
        setShowReplyButton(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  useEffect(() => {
    // Simulated content based on subject and topic
    const topicContent = {
      physics: {
        kinematics: {
          title: 'Kinematics',
          content: `
            # Introduction to Kinematics

            Kinematics is the branch of mechanics that deals with the motion of objects without consideration of the forces causing the motion.

            ## Key Concepts

            1. Distance and Displacement
            - Distance is a scalar quantity
            - Displacement is a vector quantity

            2. Speed and Velocity
            - Speed is the rate of change of distance
            - Velocity is the rate of change of displacement

            3. Acceleration
            - Rate of change of velocity
            - Can be positive, negative, or zero

            ## Important Formulas

            1. v = u + at
            2. s = ut + (1/2)at²
            3. v² = u² + 2as

            Where:
            v = final velocity
            u = initial velocity
            a = acceleration
            t = time
            s = displacement
          `,
          formulas: [
            { name: 'Final Velocity', equation: 'v = u + at' },
            { name: 'Displacement', equation: 's = ut + ½at²' },
            { name: 'Velocity-Time', equation: 'v² = u² + 2as' }
          ],
          examples: [
            {
              question: 'A car accelerates uniformly from rest to 72 km/h in 5 seconds. Calculate its acceleration.',
              solution: `
                Given:
                - Initial velocity (u) = 0 m/s
                - Final velocity (v) = 72 km/h = 20 m/s
                - Time (t) = 5 s

                Using v = u + at:
                20 = 0 + a(5)
                a = 4 m/s²
              `
            }
          ]
        }
      }
    };

    setContent(topicContent[subject]?.[topicId] || null);
  }, [subject, topicId]);

  if (!content) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl text-red-500">Topic not found</h2>
        <button
          onClick={() => navigate(`/dashboard/${subject}/books`)}
          className="mt-4 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Books
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl relative"
      >
        <h1 className="text-3xl font-bold mb-8">{content.title}</h1>

        <div className="prose prose-invert max-w-none">
          <div className="formatted-content">
            {content.content.split('\n').map((line, index) => {
              if (line.startsWith('#')) {
                const level = line.match(/^#+/)[0].length;
                const text = line.replace(/^#+\s*/, '');
                const Tag = `h${level + 1}`;
                return <Tag key={index} className="font-bold mb-4">{text}</Tag>;
              }
              if (line.startsWith('-')) {
                return <li key={index} className="ml-4">{line.slice(2)}</li>;
              }
              if (line.trim() === '') {
                return <br key={index} />;
              }
              return <p key={index} className="mb-4">{line}</p>;
            })}
          </div>
        </div>

        {/* Floating Reply Button */}
        <AnimatePresence>
          {showReplyButton && (
            <FloatingReplyButton 
              selectedText={selectedText}
              onReply={askQuestion}
            />
          )}
        </AnimatePresence>

        {content.formulas && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Important Formulas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.formulas.map((formula, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 p-4 rounded-lg"
                >
                  <h3 className="font-medium mb-2">{formula.name}</h3>
                  <p className="text-blue-400 font-mono">{formula.equation}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {content.examples && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Example Problems</h2>
            {content.examples.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-800 p-6 rounded-lg mt-4"
              >
                <h3 className="font-medium mb-4">Problem:</h3>
                <p className="mb-6">{example.question}</p>
                <h3 className="font-medium mb-4">Solution:</h3>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                  {example.solution}
                </pre>
              </motion.div>
            ))}
          </section>
        )}
      </motion.div>
    </div>
  );
};

export default TopicContent;