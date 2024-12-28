import { useState } from 'react';
import { motion } from 'framer-motion';

const FlashCard = ({ front, back }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      className="relative w-full h-64 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6 }}
      style={{ perspective: 1000 }}
    >
      <div
        className={`absolute w-full h-full bg-gray-800 rounded-lg p-6 backface-hidden transform 
                   ${isFlipped ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <h3 className="text-xl font-semibold mb-2">Question:</h3>
          <p className="text-center">{front}</p>
        </div>
      </div>
      <div
        className={`absolute w-full h-full bg-blue-900 rounded-lg p-6 backface-hidden transform 
                   ${isFlipped ? 'opacity-100 rotate-y-180' : 'opacity-0'}`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <h3 className="text-xl font-semibold mb-2">Answer:</h3>
          <p className="text-center">{back}</p>
        </div>
      </div>
    </motion.div>
  );
};

const FlashCards = ({ subject }) => {
  const [currentCategory, setCurrentCategory] = useState('all');

  const flashcardsData = {
    physics: [
      {
        category: 'Mechanics',
        cards: [
          { front: "What is Newton's First Law?", back: "An object remains at rest or in uniform motion unless acted upon by an external force." },
          { front: "Define momentum", back: "Momentum is the product of mass and velocity of an object (p = mv)." }
        ]
      },
      {
        category: 'Thermodynamics',
        cards: [
          { front: "State the First Law of Thermodynamics", back: "Energy can neither be created nor destroyed, only transformed from one form to another." },
          { front: "What is entropy?", back: "Entropy is a measure of disorder or randomness in a system." }
        ]
      }
    ],
    chemistry: [
      {
        category: 'Organic Chemistry',
        cards: [
          { front: "What is a functional group?", back: "A specific group of atoms within molecules that is responsible for the characteristic chemical reactions of those molecules." },
          { front: "Define hybridization", back: "The mixing of atomic orbitals to form new hybrid orbitals suitable for chemical bonding." }
        ]
      },
      {
        category: 'Physical Chemistry',
        cards: [
          { front: "What is Le Chatelier's Principle?", back: "When a system at equilibrium is subjected to change, it readjusts to counteract the effect of the change." },
          { front: "Define molarity", back: "The number of moles of solute per liter of solution." }
        ]
      }
    ],
    mathematics: [
      {
        category: 'Calculus',
        cards: [
          { front: "What is a derivative?", back: "Rate of change of a function with respect to a variable." },
          { front: "Define integration", back: "The process of finding the function whose derivative is the given function." }
        ]
      },
      {
        category: 'Algebra',
        cards: [
          { front: "What is a quadratic equation?", back: "An equation of the form ax² + bx + c = 0, where a ≠ 0" },
          { front: "Define matrices", back: "A rectangular array of numbers arranged in rows and columns." }
        ]
      }
    ]
  };

  const categories = (flashcardsData[subject] || []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 capitalize">{subject} Flash Cards</h2>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCurrentCategory('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Cards
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setCurrentCategory(cat.category)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentCategory === cat.category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      {/* Flash Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          (currentCategory === 'all' || currentCategory === category.category) && (
            category.cards.map((card, index) => (
              <motion.div
                key={`${category.category}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FlashCard front={card.front} back={card.back} />
              </motion.div>
            ))
          )
        ))}
      </div>
    </div>
  );
};

export default FlashCards;