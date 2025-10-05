import React, { useState } from 'react';

interface HashtagReportButtonProps {
  hashtagId: string;
  hashtagName: string;
  className?: string;
}

const HashtagReportButton: React.FC<HashtagReportButtonProps> = ({
  hashtagId,
  hashtagName,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportReasons = [
    { value: 'SPAM', label: 'Spam', description: 'Repetitive or irrelevant content' },
    { value: 'HARASSMENT', label: 'Harassment', description: 'Bullying or threatening behavior' },
    { value: 'HATE_SPEECH', label: 'Hate Speech', description: 'Content promoting hatred or discrimination' },
    { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content', description: 'Content not suitable for all audiences' },
    { value: 'COPYRIGHT_VIOLATION', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted material' },
    { value: 'MISINFORMATION', label: 'Misinformation', description: 'False or misleading information' },
    { value: 'VIOLENCE', label: 'Violence', description: 'Content promoting or depicting violence' },
    { value: 'OTHER', label: 'Other', description: 'Other violation not listed above' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hashtags/moderation?action=report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashtagId,
          reason: selectedReason,
          description: description.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            setIsOpen(false);
            setSuccess(false);
            setSelectedReason('');
            setDescription('');
          }, 2000);
        } else {
          setError(data.error || 'Failed to submit report');
        }
      } else {
        setError('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('An error occurred while submitting the report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedReason('');
    setDescription('');
    setError(null);
    setSuccess(false);
  };

  return (
    <>
      {/* Report Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>Report</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Report Hashtag</h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Report <span className="font-semibold text-gray-900">#{hashtagName}</span> for violating our community guidelines.
                </p>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted</h4>
                  <p className="text-gray-600">Thank you for helping keep our community safe!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Reason Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for reporting *
                    </label>
                    <div className="space-y-2">
                      {reportReasons.map((reason) => (
                        <label
                          key={reason.value}
                          className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={reason.value}
                            checked={selectedReason === reason.value}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="mt-1 text-red-600 focus:ring-red-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{reason.label}</div>
                            <div className="text-xs text-gray-600">{reason.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional details (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide additional context about why you're reporting this hashtag..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {description.length}/500 characters
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !selectedReason}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit Report'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HashtagReportButton;
