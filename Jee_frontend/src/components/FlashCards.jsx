import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, message, Spin, Empty, Modal } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { getFlashCards, deleteFlashCard, updateFlashCard } from '../interceptors/services';

const FlashCards = () => {
  const { subject } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ content: '', topic: '' });

  useEffect(() => {
    fetchFlashCards();
  }, [subject]);

  const fetchFlashCards = async () => {
    try {
      setLoading(true);
      const response = await getFlashCards(subject);
      setFlashcards(response.data);
    } catch {
      message.error('Failed to fetch flash cards');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cardId) => {
    try {
      await deleteFlashCard(cardId);
      message.success('Flash card deleted successfully');
      fetchFlashCards();
    } catch {
      message.error('Failed to delete flash card');
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
      message.success('Flash card updated successfully');
      setIsEditModalVisible(false);
      fetchFlashCards();
    } catch {
      message.error('Failed to update flash card');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Spin size="large" />
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Empty
          description={
            <span className="text-gray-300">
              No flash cards found for {subject}. Create some by selecting text from books!
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-white capitalize">
        {subject} Flash Cards
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flashcards.map((card) => (
          <Card
            key={card.id}
            className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow"
            style={{ borderRadius: '0.75rem' }}
            actions={[
              <Button 
                key="view"
                type="text" 
                icon={<EyeOutlined className="text-blue-400" />} 
                onClick={() => handleView(card)}
                className="text-gray-300 hover:text-blue-400"
              >
                View
              </Button>,
              <Button 
                key="edit"
                type="text" 
                icon={<EditOutlined className="text-green-400" />} 
                onClick={() => handleEdit(card)}
                className="text-gray-300 hover:text-green-400"
              >
                Edit
              </Button>,
              <Button 
                key="delete"
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => handleDelete(card.id)}
                className="hover:text-red-500"
              >
                Delete
              </Button>
            ]}
          >
            <Card.Meta
              title={<span className="text-white">{card.topic}</span>}
              description={
                <div className="h-24 overflow-hidden text-gray-300">
                  {card.content.length > 150
                    ? `${card.content.substring(0, 150)}...`
                    : card.content}
                </div>
              }
            />
            <div className="mt-4 text-sm text-gray-400">
              Source: {card.source}
            </div>
          </Card>
        ))}
      </div>

      {/* View Modal */}
      <Modal
        title={<span className="text-gray-200">{selectedCard?.topic}</span>}
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setIsViewModalVisible(false)}
            className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
          >
            Close
          </Button>
        ]}
        width={800}
        className="dark-modal"
        style={{
          backgroundColor: '#1f2937',
          color: '#fff'
        }}
      >
        <div className="whitespace-pre-wrap text-gray-300">{selectedCard?.content}</div>
        <div className="mt-4 text-sm text-gray-400">
          Source: {selectedCard?.source}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={<span className="text-gray-200">Edit Flash Card</span>}
        open={isEditModalVisible}
        onOk={handleUpdate}
        onCancel={() => setIsEditModalVisible(false)}
        width={800}
        className="dark-modal"
        style={{
          backgroundColor: '#1f2937',
          color: '#fff'
        }}
        okButtonProps={{
          className: 'bg-blue-500 text-white hover:bg-blue-600 border-none'
        }}
        cancelButtonProps={{
          className: 'bg-gray-700 text-white hover:bg-gray-600 border-gray-600'
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Topic</label>
            <input
              type="text"
              value={editForm.topic}
              onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Content</label>
            <textarea
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              rows={6}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FlashCards;