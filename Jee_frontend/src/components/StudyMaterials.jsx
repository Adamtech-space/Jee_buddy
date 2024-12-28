import { motion } from 'framer-motion';

const StudyMaterials = ({ subject }) => {
  // Simulated study materials data
  const materials = {
    physics: [
      {
        id: 1,
        title: 'Mechanics Formula Sheet',
        type: 'PDF',
        size: '2.4 MB',
        lastModified: '2024-12-27'
      },
      {
        id: 2,
        title: 'Wave Optics Notes',
        type: 'PDF',
        size: '1.8 MB',
        lastModified: '2024-12-26'
      }
    ],
    chemistry: [
      {
        id: 3,
        title: 'Organic Chemistry Mechanisms',
        type: 'PDF',
        size: '3.1 MB',
        lastModified: '2024-12-27'
      },
      {
        id: 4,
        title: 'Periodic Table Properties',
        type: 'PDF',
        size: '1.5 MB',
        lastModified: '2024-12-26'
      }
    ],
    mathematics: [
      {
        id: 5,
        title: 'Integration Techniques',
        type: 'PDF',
        size: '2.7 MB',
        lastModified: '2024-12-27'
      },
      {
        id: 6,
        title: 'Coordinate Geometry Formulas',
        type: 'PDF',
        size: '1.9 MB',
        lastModified: '2024-12-26'
      }
    ]
  };

  const subjectMaterials = materials[subject] || [];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Study Materials - {subject}</h2>
      
      <div className="grid gap-4">
        {subjectMaterials.map((material) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-6 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">{material.title}</h3>
                <div className="flex space-x-4 text-sm text-gray-400">
                  <span>{material.type}</span>
                  <span>{material.size}</span>
                  <span>{material.lastModified}</span>
                </div>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
              Download
            </button>
          </motion.div>
        ))}
      </div>

      {subjectMaterials.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No study materials available for this subject yet.</p>
        </div>
      )}
    </div>
  );
};

export default StudyMaterials;
