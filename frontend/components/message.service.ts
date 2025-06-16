import api from './api';
import {
  Message,
  Conversation,
  MessageResponse,
  ConversationResponse,
  ConversationsListResponse
} from '../types/message.types';

// Message service for handling message operations
class MessageService {
  // Send message
  async sendMessage(
    receiverId: number,
    content: string,
    mediaUrl: string | null = null,
    relatedBookingId: number | null = null
  ): Promise<MessageResponse> {
    try {
      const response = await api.post('/messages', {
        receiverId,
        content,
        mediaUrl,
        relatedBookingId
      });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to send message');
    }
  }

  // Get conversation with user
  async getConversation(userId: number): Promise<ConversationResponse> {
    try {
      const response = await api.get(`/messages/conversation/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get conversation');
    }
  }

  // Get conversations list
  async getConversationsList(): Promise<ConversationsListResponse> {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get conversations');
    }
  }

  // Mark messages as read
  async markAsRead(messageIds: number[]): Promise<{ success: boolean }> {
    try {
      const response = await api.put('/messages/read', { messageIds });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to mark messages as read');
    }
  }
}

export default new MessageService();
