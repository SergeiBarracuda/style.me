'use client';

import { useState, useEffect, useRef } from 'react';

type DisputeCategory =
  | 'service_not_provided'
  | 'service_incomplete'
  | 'service_quality'
  | 'late_arrival'
  | 'no_show'
  | 'pricing_issue'
  | 'professionalism'
  | 'health_safety'
  | 'cancellation_issue'
  | 'other';

type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'closed';

type DisputeResponse = {
  _id: string;
  user: { _id: string; name: string };
  userType: 'client' | 'provider' | 'admin';
  message: string;
  attachments: Array<{ url: string; filename: string }>;
  createdAt: string;
};

type Dispute = {
  _id: string;
  booking: { _id: string; service: string };
  category: DisputeCategory;
  subject: string;
  description: string;
  status: DisputeStatus;
  responses: DisputeResponse[];
  createdAt: string;
  updatedAt: string;
};

const DISPUTE_CATEGORIES: Record<DisputeCategory, { name: string; icon: string }> = {
  service_not_provided: { name: 'Service Not Provided', icon: '❌' },
  service_incomplete: { name: 'Service Incomplete', icon: '⚠️' },
  service_quality: { name: 'Service Quality Issue', icon: '⭐' },
  late_arrival: { name: 'Late Arrival', icon: '⏰' },
  no_show: { name: 'No Show', icon: '🚫' },
  pricing_issue: { name: 'Pricing Dispute', icon: '💰' },
  professionalism: { name: 'Professionalism Concern', icon: '👔' },
  health_safety: { name: 'Health & Safety', icon: '🏥' },
  cancellation_issue: { name: 'Cancellation Issue', icon: '🔄' },
  other: { name: 'Other', icon: '📝' }
};

export default function DisputeResolution({ bookingId }: { bookingId?: string }) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create Dispute Form State
  const [newDispute, setNewDispute] = useState({
    category: 'service_quality' as DisputeCategory,
    subject: '',
    description: ''
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedDispute?.responses]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDisputes = async () => {
    setLoading(true);
    setError('');

    try {
      const url = bookingId
        ? `/api/disputes?bookingId=${bookingId}`
        : '/api/disputes/my-disputes';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch disputes');
      }

      const data = await response.json();
      setDisputes(data.disputes || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const createDispute = async () => {
    if (!newDispute.subject.trim() || !newDispute.description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!bookingId) {
      setError('Booking ID is required');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId,
          category: newDispute.category,
          subject: newDispute.subject,
          description: newDispute.description
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create dispute');
      }

      const data = await response.json();
      setDisputes([data.dispute, ...disputes]);
      setSelectedDispute(data.dispute);
      setShowCreateModal(false);
      setNewDispute({ category: 'service_quality', subject: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dispute');
    } finally {
      setSending(false);
    }
  };

  const sendResponse = async () => {
    if (!message.trim() && attachments.length === 0) {
      setError('Please enter a message or attach a file');
      return;
    }

    if (!selectedDispute) return;

    setSending(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('message', message);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch(`/api/disputes/${selectedDispute._id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send response');
      }

      const data = await response.json();
      setSelectedDispute(data.dispute);
      setMessage('');
      setAttachments([]);

      // Update in list
      setDisputes(disputes.map(d => d._id === data.dispute._id ? data.dispute : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments([...attachments, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: DisputeStatus) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'in_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Disputes List */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Disputes</h2>
          {bookingId && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
            >
              New Dispute
            </button>
          )}
        </div>

        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {disputes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No disputes found</p>
              {bookingId && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-blue-600 hover:underline text-sm"
                >
                  Create a dispute
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {disputes.map(dispute => (
                <div
                  key={dispute._id}
                  onClick={() => setSelectedDispute(dispute)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedDispute?._id === dispute._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{DISPUTE_CATEGORIES[dispute.category].icon}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{dispute.subject}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {dispute.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dispute Thread */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
        {selectedDispute ? (
          <>
            {/* Header */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">{selectedDispute.subject}</h2>
                <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(selectedDispute.status)}`}>
                  {selectedDispute.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{DISPUTE_CATEGORIES[selectedDispute.category].icon}</span>
                <span>{DISPUTE_CATEGORIES[selectedDispute.category].name}</span>
                <span>•</span>
                <span>{selectedDispute.booking.service}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Initial Description */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Initial Report</p>
                <p className="text-sm">{selectedDispute.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(selectedDispute.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Responses */}
              {selectedDispute.responses.map((response, i) => {
                const isAdmin = response.userType === 'admin';
                const isCurrentUser = response.user._id === localStorage.getItem('userId'); // Simplified

                return (
                  <div
                    key={i}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-lg p-4 ${
                      isAdmin
                        ? 'bg-purple-100 dark:bg-purple-900/20'
                        : isCurrentUser
                        ? 'bg-blue-100 dark:bg-blue-900/20'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold">{response.user.name}</span>
                        {isAdmin && (
                          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {response.userType}
                        </span>
                      </div>
                      <p className="text-sm">{response.message}</p>
                      {response.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {response.attachments.map((att, j) => (
                            <a
                              key={j}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              📎 {att.filename}
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(response.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedDispute.status !== 'closed' && (
              <div className="p-4 border-t dark:border-gray-700">
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button onClick={() => removeAttachment(i)} className="text-red-600 hover:text-red-700">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="mb-2 text-red-600 text-sm">{error}</div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && sendResponse()}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
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
                    onClick={sendResponse}
                    disabled={sending}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a dispute to view details</p>
          </div>
        )}
      </div>

      {/* Create Dispute Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Create Dispute</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={newDispute.category}
                  onChange={(e) => setNewDispute({ ...newDispute, category: e.target.value as DisputeCategory })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(DISPUTE_CATEGORIES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.icon} {value.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={newDispute.subject}
                  onChange={(e) => setNewDispute({ ...newDispute, subject: e.target.value })}
                  placeholder="Brief summary of the issue"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newDispute.description}
                  onChange={(e) => setNewDispute({ ...newDispute, description: e.target.value })}
                  placeholder="Provide detailed information about the issue..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={createDispute}
                  disabled={sending}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                >
                  {sending ? 'Creating...' : 'Create Dispute'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
