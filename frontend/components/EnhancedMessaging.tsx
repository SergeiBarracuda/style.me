'use client';

import { useState, useEffect, useRef } from 'react';

type MessageType = 'text' | 'image' | 'video' | 'document' | 'audio' | 'location';

type MediaItem = {
  type: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
};

type Reaction = {
  user: string;
  emoji: string;
  createdAt: string;
};

type Message = {
  _id: string;
  conversationId: string;
  sender: { _id: string; name: string };
  receiver: { _id: string; name: string };
  content: string;
  messageType: MessageType;
  media?: MediaItem[];
  readStatus: boolean;
  readAt?: string;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: Message;
  reactions: Reaction[];
  createdAt: string;
};

type Conversation = {
  _id: string;
  otherUser: { _id: string; name: string; avatar?: string };
  lastMessage: Message;
  unreadCount: number;
};

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function EnhancedMessaging({ conversationId }: { conversationId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showMediaPreview, setShowMediaPreview] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = localStorage.getItem('userId'); // Simplified

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
      markConversationAsRead(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (conversationId) {
          const conv = data.find((c: Conversation) => c._id === conversationId);
          if (conv) setSelectedConversation(conv);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const response = await fetch(`/api/messages/conversation/${convId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const markConversationAsRead = async (convId: string) => {
    try {
      await fetch(`/api/messages/conversation/${convId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;
    if (!selectedConversation) return;

    setSending(true);

    try {
      const formData = new FormData();
      formData.append('receiverId', selectedConversation.otherUser._id);
      formData.append('content', messageText);
      if (replyingTo) {
        formData.append('replyTo', replyingTo._id);
      }

      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('media', file);
        });

        const response = await fetch('/api/messages/send-with-media', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          setMessages([...messages, data.message]);
        }
      } else {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            receiverId: selectedConversation.otherUser._id,
            content: messageText,
            replyTo: replyingTo?._id
          })
        });

        if (response.ok) {
          const data = await response.json();
          setMessages([...messages, data.message]);
        }
      }

      setMessageText('');
      setSelectedFiles([]);
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setSelectedFiles(files);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(messages.map(m => m._id === messageId ? data.message : m));
      }
    } catch (err) {
      console.error('Failed to add reaction', err);
    } finally {
      setShowEmojiPicker(null);
    }
  };

  const renderMedia = (media: MediaItem) => {
    if (media.type.startsWith('image')) {
      return (
        <img
          src={media.url}
          alt={media.filename}
          className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
          onClick={() => setShowMediaPreview(media)}
        />
      );
    } else if (media.type.startsWith('video')) {
      return (
        <video controls className="max-w-xs rounded-lg">
          <source src={media.url} type={media.mimeType} />
        </video>
      );
    } else {
      return (
        <a
          href={media.url}
          download={media.filename}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-sm">
            <p className="font-medium">{media.filename}</p>
            <p className="text-xs text-gray-500">{(media.size / 1024).toFixed(1)} KB</p>
          </div>
        </a>
      );
    }
  };

  const renderReactions = (message: Message) => {
    if (message.reactions.length === 0) return null;

    const groupedReactions: Record<string, number> = {};
    message.reactions.forEach(r => {
      groupedReactions[r.emoji] = (groupedReactions[r.emoji] || 0) + 1;
    });

    return (
      <div className="flex gap-1 mt-1">
        {Object.entries(groupedReactions).map(([emoji, count]) => (
          <span key={emoji} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {emoji} {count}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
      {/* Conversations List */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>

        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {conversations.map(conv => (
            <div
              key={conv._id}
              onClick={() => setSelectedConversation(conv)}
              className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedConversation?._id === conv._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">{conv.otherUser.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold truncate">{conv.otherUser.name}</h3>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {conv.lastMessage.content || '📎 Media'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="font-bold">{selectedConversation.otherUser.name[0]}</span>
                </div>
                <div>
                  <h2 className="font-bold">{selectedConversation.otherUser.name}</h2>
                  <p className="text-xs text-gray-500">Active now</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, i) => {
                const isOwnMessage = message.sender._id === currentUserId;
                const showAvatar = i === 0 || messages[i - 1].sender._id !== message.sender._id;

                return (
                  <div key={message._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Reply Context */}
                      {message.replyTo && (
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-t-lg text-xs border-l-2 border-blue-500 mb-1">
                          <p className="font-semibold">{message.replyTo.sender.name}</p>
                          <p className="text-gray-600 dark:text-gray-400 truncate">{message.replyTo.content}</p>
                        </div>
                      )}

                      <div className={`rounded-lg p-3 ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {message.content && <p className="text-sm break-words">{message.content}</p>}

                        {message.media && message.media.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.media.map((media, j) => (
                              <div key={j}>{renderMedia(media)}</div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isOwnMessage && (
                            <span>
                              {message.deliveryStatus === 'read' ? '✓✓' : message.deliveryStatus === 'delivered' ? '✓' : '○'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reactions */}
                      {renderReactions(message)}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => setShowEmojiPicker(message._id)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          React
                        </button>
                      </div>

                      {/* Emoji Picker */}
                      {showEmojiPicker === message._id && (
                        <div className="flex gap-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 mt-1">
                          {EMOJI_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(message._id, emoji)}
                              className="text-xl hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t dark:border-gray-700">
              {replyingTo && (
                <div className="mb-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-semibold">Replying to {replyingTo.sender.name}</span>
                    <p className="text-gray-600 dark:text-gray-400 truncate">{replyingTo.content}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-gray-700">
                    ×
                  </button>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="preview" className="h-16 w-16 object-cover rounded" />
                      ) : (
                        <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-xs">{file.name.split('.').pop()}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
                >
                  📎
                </button>
                <button
                  onClick={sendMessage}
                  disabled={sending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* Media Preview Modal */}
      {showMediaPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setShowMediaPreview(null)}>
          <div className="max-w-4xl max-h-screen p-4">
            <img src={showMediaPreview.url} alt={showMediaPreview.filename} className="max-w-full max-h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
