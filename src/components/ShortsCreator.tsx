import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import UniversalLayout from './UniversalLayout';
import PageHeader from './PageHeader';

interface ShortsUploadFormData {
  title: string;
  description: string;
  hashtags: string[];
  privacy: 'public' | 'unlisted' | 'private';
  category: string;
  language: string;
  ageRestriction: boolean;
  contentRating: 'general' | 'teen' | 'mature';
  commentsEnabled: boolean;
  monetizationEnabled: boolean;
  allowEmbedding: boolean;
  showViewCount: boolean;
  notifySubscribers: boolean;
  notifySocialMedia: boolean;
}

export default function ShortsUploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<'upload' | 'details' | 'publish'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ShortsUploadFormData>({
    title: '',
    description: '',
    hashtags: [],
    privacy: 'public',
    category: 'Entertainment',
    language: 'en',
    ageRestriction: false,
    contentRating: 'general',
    commentsEnabled: true,
    monetizationEnabled: false,
    allowEmbedding: true,
    showViewCount: true,
    notifySubscribers: true,
    notifySocialMedia: false
  });

  const categories = [
    'Entertainment',
    'Gaming',
    'Music',
    'Education',
    'News & Politics',
    'How-to & Style',
    'Science & Technology',
    'Sports',
    'Travel & Events',
    'Autos & Vehicles',
    'Comedy',
    'Film & Animation',
    'People & Blogs',
    'Pets & Animals',
    'Nonprofits & Activism'
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];

  // Validation functions
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid video file (MP4, WebM, OGG, AVI, MOV)';
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return 'File size must be less than 500MB';
    }

    if (file.name.length > 255) {
      return 'File name is too long (max 255 characters)';
    }

    return null;
  };

  const validateVideoDuration = (duration: number): string | null => {
    if (duration > 60) {
      return 'Shorts videos must be 60 seconds or less';
    }
    return null;
  };

  const validateFormField = (field: string, value: any): string | null => {
    switch (field) {
      case 'title':
        if (!value || value.trim().length === 0) {
          return 'Title is required';
        }
        if (value.trim().length < 3) {
          return 'Title must be at least 3 characters long';
        }
        if (value.trim().length > 100) {
          return 'Title must be less than 100 characters';
        }
        break;
      case 'description':
        if (value && value.length > 5000) {
          return 'Description must be less than 5000 characters';
        }
        break;
      case 'hashtags':
        if (value && value.length > 10) {
          return 'Maximum 10 hashtags allowed';
        }
        break;
    }
    return null;
  };

  // Check authentication
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.data);
        } else {
          router.push('/auth');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Cleanup preview URLs
  React.useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setValidationErrors({ file: validationError });
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    const videoUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(videoUrl);
    
    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      setVideoDuration(duration);
      
      const durationError = validateVideoDuration(duration);
      if (durationError) {
        setError(durationError);
        setValidationErrors(prev => ({ ...prev, duration: durationError }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.duration;
          return newErrors;
        });
      }
    };
    video.src = videoUrl;
    
    // Auto-fill title if empty
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({
        ...prev,
        title: fileName
      }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a video title');
      return;
    }

    const durationError = validateVideoDuration(videoDuration);
    if (durationError) {
      setError(durationError);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append('video', selectedFile);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('category', formData.category);
      uploadData.append('privacy', formData.privacy);
      uploadData.append('hashtags', JSON.stringify(formData.hashtags));
      uploadData.append('language', formData.language);
      uploadData.append('ageRestriction', formData.ageRestriction.toString());
      uploadData.append('contentRating', formData.contentRating);
      uploadData.append('commentsEnabled', formData.commentsEnabled.toString());
      uploadData.append('monetizationEnabled', formData.monetizationEnabled.toString());
      uploadData.append('allowEmbedding', formData.allowEmbedding.toString());
      uploadData.append('showViewCount', formData.showViewCount.toString());
      uploadData.append('notifySubscribers', formData.notifySubscribers.toString());
      uploadData.append('notifySocialMedia', formData.notifySocialMedia.toString());
      uploadData.append('videoType', 'shorts');
      uploadData.append('duration', videoDuration.toString());

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setSuccess('Short uploaded successfully!');
              setUploadProgress(100);
              setTimeout(() => {
                router.push('/shorts');
              }, 2000);
            } else {
              setError(response.error || 'Upload failed');
            }
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            setError('Upload completed but response was invalid');
          }
        } else {
          console.error('Upload failed with status:', xhr.status, xhr.responseText);
          setError(`Upload failed with status ${xhr.status}. Please try again.`);
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        setError('Upload failed. Please check your connection and try again.');
        setUploading(false);
      });

      xhr.open('POST', '/api/videos/upload');
      xhr.withCredentials = true;
      xhr.send(uploadData);

    } catch (error) {
      console.error('Upload error:', error);
      setError('An error occurred during upload. Please try again.');
      setUploading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 'upload' && selectedFile && !validationErrors.file && !validationErrors.duration) {
      setCurrentStep('details');
    } else if (currentStep === 'details' && formData.title.trim()) {
      setCurrentStep('publish');
    }
  };

  const prevStep = () => {
    if (currentStep === 'details') {
      setCurrentStep('upload');
    } else if (currentStep === 'publish') {
      setCurrentStep('details');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (uploading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-6">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-black mb-2">Uploading Short</h2>
              <p className="text-black">Please don't close this page while uploading</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-black">Progress</span>
                <span className="text-sm font-bold text-black">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
            
            {selectedFile && (
              <div className="text-sm text-black">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-gray-600">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <UniversalLayout 
      user={user}
      pageHeader={
        <PageHeader
          title="Create Short"
          subtitle="Upload a short video (max 60 seconds) for mobile viewing"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          iconColor="bg-gradient-to-r from-purple-500 to-pink-500"
        />
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {[
                { id: 'upload', title: 'Upload', description: 'Select video file' },
                { id: 'details', title: 'Details', description: 'Title & description' },
                { id: 'publish', title: 'Publish', description: 'Settings & publish' }
              ].map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : index < ['upload', 'details', 'publish'].indexOf(currentStep)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      currentStep === step.id ? 'text-purple-600' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {index < 2 && (
                    <div className={`w-16 h-px ml-6 ${
                      index < ['upload', 'details', 'publish'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Step Content */}
            <div className="p-8">
              {/* Step 1: Upload */}
              {currentStep === 'upload' && (
                <div className="space-y-6">
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                      dragActive
                        ? 'border-purple-500 bg-purple-50'
                        : selectedFile
                        ? 'border-green-500 bg-green-50'
                        : validationErrors.file || validationErrors.duration
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {selectedFile ? (
                      <div className="space-y-6">
                        {/* Video Preview */}
                        {videoPreviewUrl && (
                          <div className="max-w-md mx-auto">
                            <video
                              src={videoPreviewUrl}
                              controls
                              className="w-full h-64 object-cover rounded-lg"
                              poster={selectedFile.name}
                            />
                          </div>
                        )}
                        
                        {/* File Info */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-black">{selectedFile.name}</h3>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-sm text-black font-medium">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                <span className="text-sm text-green-600 font-medium">✓ Ready for Shorts</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedFile(null);
                                setVideoDuration(0);
                                if (videoPreviewUrl) {
                                  URL.revokeObjectURL(videoPreviewUrl);
                                  setVideoPreviewUrl(null);
                                }
                                setValidationErrors({});
                              }}
                              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Duration Info */}
                        {videoDuration > 0 && (
                          <div className={`p-4 rounded-lg border ${
                            videoDuration > 60
                              ? 'bg-red-50 border-red-200'
                              : 'bg-green-50 border-green-200'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                videoDuration > 60 ? 'bg-red-500' : 'bg-green-500'
                              }`}>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0114 0z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-black">
                                  Video Duration: {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toFixed(0).padStart(2, '0')}
                                </h4>
                                <p className={`text-sm ${
                                  videoDuration > 60 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {videoDuration > 60
                                    ? '⚠️ This video exceeds the 60-second limit for Shorts'
                                    : '✅ Perfect for Shorts!'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-black">Upload a Short</h3>
                          <p className="text-sm text-black">Drag and drop your short video here, or click to browse</p>
                          <p className="text-xs text-black mt-1">MP4, WebM, OGG, AVI, MOV (max 60 seconds, 500MB)</p>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
                        >
                          Select File
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Validation Errors */}
                  {(validationErrors.file || validationErrors.duration) && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">
                          {validationErrors.file || validationErrors.duration}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Details */}
              {currentStep === 'details' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-black ${
                        validationErrors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter short title"
                      required
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-black">
                        {formData.title.length}/100 characters
                      </p>
                      {validationErrors.title && (
                        <p className="text-xs text-red-600 font-medium">
                          {validationErrors.title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none text-black ${
                        validationErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Describe your short..."
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-black">
                        {formData.description.length}/5000 characters
                      </p>
                      {validationErrors.description && (
                        <p className="text-xs text-red-600 font-medium">
                          {validationErrors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Hashtags
                    </label>
                    <input
                      type="text"
                      name="hashtags"
                      value={formData.hashtags.join(' ')}
                      onChange={(e) => {
                        const hashtags = e.target.value.split(' ').map(tag => tag.replace('#', '')).filter(tag => tag);
                        setFormData(prev => ({ ...prev, hashtags }));
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-black ${
                        validationErrors.hashtags ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Add hashtags (separated by spaces)"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Add relevant hashtags to help viewers discover your short
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Publish */}
              {currentStep === 'publish' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Privacy
                    </label>
                    <select
                      name="privacy"
                      value={formData.privacy}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-black"
                    >
                      <option value="public">Public - Anyone can search for and view</option>
                      <option value="unlisted">Unlisted - Anyone with the link can view</option>
                      <option value="private">Private - Only you can view</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-black"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black">Settings</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-black">Enable Comments</label>
                        <p className="text-xs text-gray-600">Allow viewers to comment on your short</p>
                      </div>
                      <input
                        type="checkbox"
                        name="commentsEnabled"
                        checked={formData.commentsEnabled}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-black">Show View Count</label>
                        <p className="text-xs text-gray-600">Display the number of views publicly</p>
                      </div>
                      <input
                        type="checkbox"
                        name="showViewCount"
                        checked={formData.showViewCount}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-black">Notify Subscribers</label>
                        <p className="text-xs text-gray-600">Send notification to your subscribers</p>
                      </div>
                      <input
                        type="checkbox"
                        name="notifySubscribers"
                        checked={formData.notifySubscribers}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mx-8 mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mx-8 mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{success}</span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 'upload'}
                className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Previous
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/shorts')}
                  className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                
                {currentStep === 'publish' ? (
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {uploading ? 'Uploading...' : 'Publish Short'}
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    disabled={
                      (currentStep === 'upload' && (!selectedFile || validationErrors.file || validationErrors.duration)) ||
                      (currentStep === 'details' && !formData.title.trim())
                    }
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UniversalLayout>
  );
}