import api from './api';

// Message service for handling message operations
class MessageService {
  // Send message
  async sendMessage(receiverId, content, mediaUrl = null, relatedBookingId = null) {
    try {
      const response = await api.post('/messages', {
        receiverId,
        content,
        mediaUrl,
        relatedBookingId
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to send message');
    }
  }

  // Get conversation with user
  async getConversation(userId) {
    try {
      const response = await api.get(`/messages/conversation/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get conversation');
    }
  }

  // Get conversations list
  async getConversationsList() {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get conversations');
    }
  }

  // Mark messages as read
  async markAsRead(messageIds) {
    try {
      const response = await api.put('/messages/read', { messageIds });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to mark messages as read');
    }
  }
}

export default new MessageService();
