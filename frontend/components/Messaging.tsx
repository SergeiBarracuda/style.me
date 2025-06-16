'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Message, Conversation } from '../types/message.types';

interface MessagingProps {
  userId: number;
  userRole: 'provider' | 'client';
}

export default function Messaging({ userId, userRole }: MessagingProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // In a real implementation, this would make an API call to fetch conversations
        // For now, we'll use mock data

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock conversations data
        const mockConversations: Conversation[] = [
          {
            id: 'conv-001',
            participants: [
              {
                id: 1,
                name: 'Sarah Johnson',
                photo: '/placeholder-profile.jpg',
                role: 'provider',
              },
              {
                id: 101,
                name: 'John Smith',
                photo: '/placeholder-profile.jpg',
                role: 'client',
              },
            ],            lastMessage: {
              content: 'Looking forward to seeing you tomorrow!',
              timestamp: '2025-04-26T14:30:00Z',
              senderId: 1,
            },
            unreadCount: 1,
          },
          {
            id: 'conv-002',
            participants: [
              {
                id: 2,
                name: 'Michael Chen',
                photo: '/placeholder-profile.jpg',
                role: 'provider',
              },
              {
                id: 101,
                name: 'John Smith',
                photo: '/placeholder-profile.jpg',
                role: 'client',
              },
            ],            lastMessage: {
              content: 'Do you have any specific areas you want me to focus on during the massage?',
              timestamp: '2025-04-25T11:15:00Z',
              senderId: 2,
            },
            unreadCount: 0,
          },
          {
            id: 'conv-003',
            participants: [
              {
                id: 3,
                name: 'Jessica Williams',
                photo: '/placeholder-profile.jpg',
                role: 'provider',
              },
              {
                id: 101,
                name: 'John Smith',
                photo: '/placeholder-profile.jpg',
                role: 'client',
              },
            ],
            lastMessage: {
              content: 'I have a few nail design options to show you. Would you like to see them before your appointment?',
              timestamp: '2025-04-24T16:45:00Z',
              senderId: 3,
            },
            unreadCount: 2,
          },
        ];

        setConversations(mockConversations);

        // Select first conversation by default if none is selected
        if (!selectedConversation && mockConversations.length > 0) {
          setSelectedConversation(mockConversations[0].id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userId, userRole, selectedConversation]);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      try {
        // In a real implementation, this would make an API call to fetch messages
        // For now, we'll use mock data

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock messages data
        const mockMessages: Message[] = [
          {
            id: 'msg-001',
            senderId: 101, // Client
            receiverId: 1, // Provider
            content: 'Hi Sarah, I\'d like to book an appointment for a haircut next week.',
            timestamp: '2025-04-25T10:00:00Z',
            isRead: true,
          },
          {
            id: 'msg-002',
            senderId: 1, // Provider
            receiverId: 101, // Client
            content: 'Hello John! I have availability on Tuesday at 2:30 PM or Thursday at 10:00 AM. Would either of those work for you?',
            timestamp: '2025-04-25T10:15:00Z',
            isRead: true,
          },
          {
            id: 'msg-003',
            senderId: 101, // Client
            receiverId: 1, // Provider
            content: 'Tuesday at 2:30 PM works perfectly for me.',
            timestamp: '2025-04-25T10:30:00Z',
            isRead: true,
          },
          {
            id: 'msg-004',
            senderId: 1, // Provider
            receiverId: 101, // Client
            content: 'Great! I\'ve booked you in for Tuesday at 2:30 PM. Do you have any specific style in mind?',
            timestamp: '2025-04-25T10:45:00Z',
            isRead: true,
          },
          {
            id: 'msg-005',
            senderId: 101, // Client
            receiverId: 1, // Provider
            content: 'I\'m thinking of trying a shorter style, maybe something like this:',
            timestamp: '2025-04-25T11:00:00Z',
            isRead: true,
            attachment: {
              type: 'image',
              url: '/placeholder-haircut.jpg',
              name: 'haircut-reference.jpg',
            },
          },
          {
            id: 'msg-006',
            senderId: 1, // Provider
            receiverId: 101, // Client
            content: 'That\'s a great style and would suit your face shape well! I can definitely do that for you.',
            timestamp: '2025-04-25T11:15:00Z',
            isRead: true,
          },
          {
            id: 'msg-007',
            senderId: 1, // Provider
            receiverId: 101, // Client
            content: 'Looking forward to seeing you tomorrow!',
            timestamp: '2025-04-26T14:30:00Z',
            isRead: false,
          },
        ];

        setMessages(mockMessages);

        // Mark conversation as read
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv.id === selectedConversation
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get other participant in conversation
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== userId) || conversation.participants[0];
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today, show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week, show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older, show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);

    try {
      // In a real implementation, this would make an API call to send the message
      // For now, we'll simulate it

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the selected conversation
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return;

      // Get the other participant
      const otherParticipant = getOtherParticipant(conversation);

      // Create new message
      const newMsg: Message = {
        id: `msg-${Date.now()}`,        senderId: userId,
        receiverId: otherParticipant.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      // Add message to list
      setMessages(prevMessages => [...prevMessages, newMsg]);

      // Update conversation last message
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === selectedConversation
            ? {
                ...conv,                lastMessage: {
                  content: newMessage,
                  timestamp: new Date().toISOString(),
                  senderId: userId,
                },
              }
            : conv
        )
      );

      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="flex h-[600px]">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="ml-3 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-600 dark:text-gray-300">No conversations yet.</p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(600px-64px)]">
              {conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const isSelected = selectedConversation === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 flex items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <Image
                          src={otherParticipant.photo || '/placeholder-profile.jpg'}
                          alt={otherParticipant.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">{conversation.unreadCount}</span>
                        </div>
                      )}
                    </div>

                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {otherParticipant.name}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(conversation.lastMessage.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        conversation.unreadCount > 0
                          ? 'font-medium text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {conversation.lastMessage.senderId === userId ? 'You: ' : ''}
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="w-2/3 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              {(() => {
                const conversation = conversations.find(c => c.id === selectedConversation);
                if (!conversation) return null;

                const otherParticipant = getOtherParticipant(conversation);

                return (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden">
                      <Image
                        src={otherParticipant.photo || '/placeholder-profile.jpg'}
                        alt={otherParticipant.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {otherParticipant.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {otherParticipant.role === 'provider' ? 'Service Provider' : 'Client'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Messages List */}              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && handleSendMessage(e)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}