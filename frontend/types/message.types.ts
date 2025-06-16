export interface Message {
  id: string;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachment?: {
    type: 'image' | 'document';
    url: string;
    name: string;
  };
}

export interface Conversation {
  id: string;
  participants: {
    id: number;
    name: string;
    photo: string;
    role: 'provider' | 'client';
  }[];
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: number;
  };
  unreadCount: number;
}

export interface SendMessageRequest {
  receiverId: number;
  content: string;
  mediaUrl?: string | null;
  relatedBookingId?: number | null;
}

export interface MessageResponse {
  message: Message;
  success: boolean;
}

export interface ConversationResponse {
  messages: Message[];
  success: boolean;
}

export interface ConversationsListResponse {
  conversations: Conversation[];
  success: boolean;
}
