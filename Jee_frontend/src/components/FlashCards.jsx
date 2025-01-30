import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFlashCards, deleteFlashCard, updateFlashCard } from '../interceptors/services';

const FlashCards = () => {
  const { subject } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ content: '', topic: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchFlashCards();
  }, [subject]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const fetchFlashCards = async () => {
    try {
      setLoading(true);
      const response = await getFlashCards(subject);
      setFlashcards(response.data);
    } catch {
      showNotification('Failed to fetch flash cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (card) => {
    setSelectedCard(card);
    setIsDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    try {
      await deleteFlashCard(selectedCard.id);
      showNotification('Flash card deleted successfully');
      setIsDeleteModalVisible(false);
      fetchFlashCards();
    } catch {
      showNotification('Failed to delete flash card', 'error');
    }
  };

  const handleEdit = (card) => {
    setSelectedCard(card);
    setEditForm({ content: card.content, topic: card.topic });
    setIsEditModalVisible(true);
  };

  const handleView = (card) => {
    setSelectedCard(card);
    setIsViewModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      await updateFlashCard(selectedCard.id, editForm);
      showNotification('Flash card updated successfully');
      setIsEditModalVisible(false);
      fetchFlashCards();
    } catch {
      showNotification('Failed to update flash card', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="text-gray-300 mb-4">No flash cards found for {subject}</div>
          <div className="text-gray-400 text-sm">Create some by selecting text from books!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-black min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 text-white capitalize">
        {subject} Flash Cards
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flashcards.map((card) => (
          <div
            key={card.id}
            className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:shadow-2xl transition-all duration-300"
          >
            <div className="p-6 bg-gray-800">
              <h3 className="text-white text-lg font-semibold mb-3">{card.topic}</h3>
              <div className="text-gray-300 h-24 overflow-hidden">
                {card.content.length > 150
                  ? `${card.content.substring(0, 150)}...`
                  : card.content}
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Source: {card.source}
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-800 border-t border-gray-700 flex justify-end space-x-2">
              <button
                onClick={() => handleView(card)}
                className="p-2 rounded-lg bg-gray-700 text-blue-400 hover:bg-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => handleEdit(card)}
                className="p-2 rounded-lg bg-gray-700 text-green-400 hover:bg-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteClick(card)}
                className="p-2 rounded-lg bg-gray-700 text-red-400 hover:bg-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {isViewModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-3xl shadow-2xl border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">{selectedCard?.topic}</h3>
              <button
                onClick={() => setIsViewModalVisible(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-gray-300 whitespace-pre-wrap">{selectedCard?.content}</div>
              <div className="mt-4 text-sm text-gray-400">
                Source: {selectedCard?.source}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-3xl shadow-2xl border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">Edit Flash Card</h3>
              <button
                onClick={() => setIsEditModalVisible(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
                  <input
                    type="text"
                    value={editForm.topic}
                    onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                    className="w-full rounded-lg bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={6}
                    className="w-full rounded-lg bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 px-4 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">Confirm Delete</h3>
              <button
                onClick={() => setIsDeleteModalVisible(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-gray-300">
                Are you sure you want to delete this flash card?
                <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                  <div className="font-semibold">{selectedCard?.topic}</div>
                  <div className="text-sm mt-1 text-gray-400">
                    {selectedCard?.content.length > 100
                      ? `${selectedCard?.content.substring(0, 100)}...`
                      : selectedCard?.content}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashCards;