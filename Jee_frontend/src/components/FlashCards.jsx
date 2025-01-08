import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const FlashCard = ({ card, onFlip }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip();
  };

  return (
    <div 
      className="relative w-full h-64 cursor-pointer perspective-1000"
      onClick={handleClick}
    >
      <div className={`absolute inset-0 w-full h-full transition-transform duration-500 preserve-3d 
                      ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front of card */}
        <div className={`absolute w-full h-full backface-hidden bg-gray-800 rounded-xl p-6
                        flex flex-col items-center justify-center text-center`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Question:</h3>
          <p className="text-white text-xl">{card.question}</p>
        </div>
        
        {/* Back of card */}
        <div className={`absolute w-full h-full backface-hidden bg-blue-900 rounded-xl p-6
                        flex flex-col items-center justify-center text-center rotate-y-180`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Answer:</h3>
          <p className="text-white text-xl">{card.answer}</p>
        </div>
      </div>
    </div>
  );
};

const FlashCards = () => {
  const { subject } = useParams();
  const [cards, setCards] = useState([
    {
      id: 1,
      question: "What is Newton's First Law?",
      answer: "An object remains at rest or in uniform motion unless acted upon by an external force.",
      category: "Mechanics"
    },
    {
      id: 2,
      question: "What is the SI unit of force?",
      answer: "Newton (N)",
      category: "Mechanics"
    }
  ]);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ question: '', answer: '', category: '' });
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get unique categories
  const categories = ['all', ...new Set(cards.map(card => card.category))];

  // Filter cards by category
  const filteredCards = selectedCategory === 'all' 
    ? cards 
    : cards.filter(card => card.category === selectedCategory);

  const handlePrevCard = () => {
    setCurrentCardIndex((prev) => 
      prev === 0 ? filteredCards.length - 1 : prev - 1
    );
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prev) => 
      prev === filteredCards.length - 1 ? 0 : prev + 1
    );
  };

  const handleAddCard = () => {
    if (newCard.question.trim() && newCard.answer.trim() && newCard.category.trim()) {
      setCards(prev => [...prev, { ...newCard, id: Date.now() }]);
      setNewCard({ question: '', answer: '', category: '' });
      setShowAddCard(false);
    }
  };

  const handleDeleteCard = (cardId) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
    setCurrentCardIndex(0);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white capitalize">{subject} Flash Cards</h2>
        <button
          onClick={() => setShowAddCard(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Card
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setCurrentCardIndex(0);
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Flash Card Display */}
      {filteredCards.length > 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl mb-8">
            <FlashCard card={filteredCards[currentCardIndex]} />
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevCard}
              className="p-2 text-gray-400 hover:text-white"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <span className="text-gray-400">
              {currentCardIndex + 1} / {filteredCards.length}
            </span>
            <button
              onClick={handleNextCard}
              className="p-2 text-gray-400 hover:text-white"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          No flash cards available in this category.
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add New Flash Card</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Category</label>
                <input
                  type="text"
                  value={newCard.category}
                  onChange={(e) => setNewCard(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                  placeholder="e.g., Mechanics"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Question</label>
                <textarea
                  value={newCard.question}
                  onChange={(e) => setNewCard(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                  rows={3}
                  placeholder="Enter your question"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Answer</label>
                <textarea
                  value={newCard.answer}
                  onChange={(e) => setNewCard(prev => ({ ...prev, answer: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                  rows={3}
                  placeholder="Enter the answer"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddCard(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCard}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashCards;