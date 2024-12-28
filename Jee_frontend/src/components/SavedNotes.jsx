import { motion } from 'framer-motion';

const SavedNotes = ({ subject }) => {
  // Simulated notes data
  const notes = [
    {
      id: 1,
      title: 'Important Concepts',
      content: 'Key points to remember...',
      date: '2024-12-27',
      tags: ['important', 'review']
    },
    {
      id: 2,
      title: 'Practice Problems',
      content: 'Problem-solving strategies...',
      date: '2024-12-26',
      tags: ['practice', 'problems']
    }
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Saved Notes - {subject}</h2>
      
      <div className="grid gap-4">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-6 rounded-lg"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{note.title}</h3>
              <span className="text-sm text-gray-400">{note.date}</span>
            </div>
            <p className="text-gray-300 mb-4">{note.content}</p>
            <div className="flex gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-400 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No saved notes yet. Start taking notes during your study sessions!</p>
        </div>
      )}
    </div>
  );
};

export default SavedNotes;
