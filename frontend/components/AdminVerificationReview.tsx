'use client';

import { useState, useEffect } from 'react';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

type VerificationDocument = {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  documentType: string;
  frontImage: string;
  backImage?: string;
  additionalInfo?: string;
  status: VerificationStatus;
  submittedAt: string;
  reviewedBy?: { name: string };
  reviewedAt?: string;
  rejectionReason?: string;
};

export default function AdminVerificationReview() {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<VerificationDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | VerificationStatus>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? '/api/id-verification/admin/all'
        : `/api/id-verification/admin/pending?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || data);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  const reviewDocument = async (documentId: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/id-verification/admin/review/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined
        })
      });

      if (response.ok) {
        setDocuments(documents.filter(d => d._id !== documentId));
        setSelectedDoc(null);
        setRejectionReason('');
      }
    } catch (err) {
      console.error('Failed to review document', err);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Documents List */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">ID Verification Queue</h2>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[600px]">
          {documents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No documents to review</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {documents.map(doc => (
                <div
                  key={doc._id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedDoc?._id === doc._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{doc.user.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{doc.user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1">{getDocumentTypeLabel(doc.documentType)}</p>
                  <p className="text-xs text-gray-500">
                    Submitted {new Date(doc.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Review */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {selectedDoc ? (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{getDocumentTypeLabel(selectedDoc.documentType)}</h2>
                  <p className="text-gray-600 dark:text-gray-400">Review ID verification document</p>
                </div>
                <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedDoc.status)}`}>
                  {selectedDoc.status}
                </span>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium">{selectedDoc.user.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium">{selectedDoc.user.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Submitted</p>
                    <p className="font-medium">{new Date(selectedDoc.submittedAt).toLocaleString()}</p>
                  </div>
                  {selectedDoc.reviewedAt && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Reviewed</p>
                      <p className="font-medium">{new Date(selectedDoc.reviewedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Images */}
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Document Front</h3>
                <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={selectedDoc.frontImage}
                    alt="Front"
                    className="w-full cursor-pointer hover:opacity-90"
                    onClick={() => setShowImageModal(selectedDoc.frontImage)}
                  />
                </div>
              </div>

              {selectedDoc.backImage && (
                <div>
                  <h3 className="font-semibold mb-2">Document Back</h3>
                  <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={selectedDoc.backImage}
                      alt="Back"
                      className="w-full cursor-pointer hover:opacity-90"
                      onClick={() => setShowImageModal(selectedDoc.backImage!)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            {selectedDoc.additionalInfo && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Additional Information</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm">{selectedDoc.additionalInfo}</p>
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {selectedDoc.status === 'rejected' && selectedDoc.rejectionReason && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Rejection Reason</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{selectedDoc.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Review Actions */}
            {selectedDoc.status === 'pending' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a detailed reason for rejection..."
                    rows={3}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => reviewDocument(selectedDoc._id, 'approved')}
                    disabled={processing}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => reviewDocument(selectedDoc._id, 'rejected')}
                    disabled={processing || !rejectionReason.trim()}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a document to review</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(null)}
        >
          <div className="max-w-5xl max-h-screen p-4">
            <img src={showImageModal} alt="Full size" className="max-w-full max-h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
