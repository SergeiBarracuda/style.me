'use client';

import { useState, useRef } from 'react';

type DocumentType = 'government_id' | 'business_license' | 'professional_certification' | 'proof_of_address' | 'insurance_certificate';

type UploadedDocument = {
  type: DocumentType;
  frontImage: File | null;
  backImage: File | null;
  additionalInfo?: string;
};

type IDVerificationUploadProps = {
  onComplete?: () => void;
  requiredDocuments?: DocumentType[];
};

const DOCUMENT_CONFIG: Record<DocumentType, { name: string; description: string; requiresBack: boolean }> = {
  government_id: {
    name: 'Government-Issued ID',
    description: 'Driver\'s license, passport, or national ID card',
    requiresBack: true
  },
  business_license: {
    name: 'Business License',
    description: 'Valid business registration or operating license',
    requiresBack: false
  },
  professional_certification: {
    name: 'Professional Certification',
    description: 'Relevant certifications for your services (cosmetology license, etc.)',
    requiresBack: false
  },
  proof_of_address: {
    name: 'Proof of Address',
    description: 'Utility bill, bank statement, or lease agreement (within last 3 months)',
    requiresBack: false
  },
  insurance_certificate: {
    name: 'Insurance Certificate',
    description: 'Professional liability or business insurance',
    requiresBack: false
  }
};

export default function IDVerificationUpload({ onComplete, requiredDocuments = ['government_id', 'business_license'] }: IDVerificationUploadProps) {
  const [documents, setDocuments] = useState<Map<DocumentType, UploadedDocument>>(new Map());
  const [currentStep, setCurrentStep] = useState<DocumentType>(requiredDocuments[0]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const currentDoc = documents.get(currentStep) || {
    type: currentStep,
    frontImage: null,
    backImage: null,
    additionalInfo: ''
  };

  const handleFileSelect = (side: 'front' | 'back', file: File | null) => {
    if (file && !file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    if (file && file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError('');
    const updated = new Map(documents);
    const doc = updated.get(currentStep) || { type: currentStep, frontImage: null, backImage: null };

    if (side === 'front') {
      doc.frontImage = file;
    } else {
      doc.backImage = file;
    }

    updated.set(currentStep, doc);
    setDocuments(updated);
  };

  const handleInfoChange = (info: string) => {
    const updated = new Map(documents);
    const doc = updated.get(currentStep) || { type: currentStep, frontImage: null, backImage: null };
    doc.additionalInfo = info;
    updated.set(currentStep, doc);
    setDocuments(updated);
  };

  const canProceed = () => {
    const doc = documents.get(currentStep);
    if (!doc || !doc.frontImage) return false;
    const config = DOCUMENT_CONFIG[currentStep];
    if (config.requiresBack && !doc.backImage) return false;
    return true;
  };

  const handleNext = () => {
    const currentIndex = requiredDocuments.indexOf(currentStep);
    if (currentIndex < requiredDocuments.length - 1) {
      setCurrentStep(requiredDocuments[currentIndex + 1]);
    } else {
      submitVerification();
    }
  };

  const handleBack = () => {
    const currentIndex = requiredDocuments.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(requiredDocuments[currentIndex - 1]);
    }
  };

  const submitVerification = async () => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();

      documents.forEach((doc, type) => {
        if (doc.frontImage) {
          formData.append(`${type}_front`, doc.frontImage);
        }
        if (doc.backImage) {
          formData.append(`${type}_back`, doc.backImage);
        }
        if (doc.additionalInfo) {
          formData.append(`${type}_info`, doc.additionalInfo);
        }
      });

      const response = await fetch('/api/id-verification/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Upload failed');
      }

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const currentIndex = requiredDocuments.indexOf(currentStep);
  const config = DOCUMENT_CONFIG[currentStep];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Step {currentIndex + 1} of {requiredDocuments.length}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(((currentIndex + 1) / requiredDocuments.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / requiredDocuments.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Document Upload Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{config.name}</h2>
          <p className="text-gray-600 dark:text-gray-400">{config.description}</p>
        </div>

        {/* Front Image Upload */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              {config.requiresBack ? 'Front Side' : 'Document'} *
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 transition-colors">
              {currentDoc.frontImage ? (
                <div className="space-y-3">
                  <img
                    src={URL.createObjectURL(currentDoc.frontImage)}
                    alt="Front preview"
                    className="max-h-64 mx-auto rounded"
                  />
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <span className="text-sm truncate">{currentDoc.frontImage.name}</span>
                    <button
                      onClick={() => handleFileSelect('front', null)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4">
                    <button
                      onClick={() => frontInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Choose File
                    </button>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect('front', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Back Image Upload (if required) */}
          {config.requiresBack && (
            <div>
              <label className="block text-sm font-medium mb-2">Back Side *</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 transition-colors">
                {currentDoc.backImage ? (
                  <div className="space-y-3">
                    <img
                      src={URL.createObjectURL(currentDoc.backImage)}
                      alt="Back preview"
                      className="max-h-64 mx-auto rounded"
                    />
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <span className="text-sm truncate">{currentDoc.backImage.name}</span>
                      <button
                        onClick={() => handleFileSelect('back', null)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <button
                        onClick={() => backInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Choose File
                      </button>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                    <input
                      ref={backInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect('back', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Information (Optional)
            </label>
            <textarea
              value={currentDoc.additionalInfo || ''}
              onChange={(e) => handleInfoChange(e.target.value)}
              placeholder="ID number, expiration date, or any relevant details..."
              rows={3}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed() || uploading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : currentIndex === requiredDocuments.length - 1 ? 'Submit for Review' : 'Next'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Verification Process</p>
            <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
              <li>All documents are encrypted and stored securely</li>
              <li>Verification typically takes 1-3 business days</li>
              <li>You'll receive an email once your verification is complete</li>
              <li>Make sure images are clear and all information is visible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
