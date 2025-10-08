import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import SmartHashtagInput from '@/components/SmartHashtagInput';
import UniversalLayout from '@/components/UniversalLayout';

// Reusable Video Preview Component
interface VideoPreviewProps {
  videoUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  title?: string;
  subtitle?: string;
  height?: 'sm' | 'md' | 'lg';
  showOverlay?: boolean;
  context?: 'preview' | 'reference';
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  fileName,
  fileSize,
  fileType,
  title = "Video Preview",
  subtitle,
  height = 'lg',
  showOverlay = true,
  context = 'preview'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const heightClasses = {
    sm: 'h-48',
    md: 'h-64', 
    lg: 'h-80'
  };

  const contextColors = {
    preview: {
      icon: 'text-red-500',
      badge: 'bg-green-100 text-green-700',
      dot: 'bg-green-500',
      status: 'Ready'
    },
    reference: {
      icon: 'text-red-500',
      badge: 'bg-gray-100 text-gray-700',
      dot: 'bg-gray-500',
      status: 'Reference'
    }
  };

  const colors = contextColors[context];

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-black flex items-center">
          <svg className={`w-5 h-5 mr-2 ${colors.icon} animate-pulse`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {title}
        </h4>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 ${colors.badge} rounded-full text-sm font-medium animate-pulse`}>
            <div className={`w-2 h-2 ${colors.dot} rounded-full animate-ping`}></div>
            <span>{colors.status}</span>
          </div>
          {context === 'preview' && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>HD</span>
            </div>
          )}
          {context === 'reference' && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Playable</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={`relative bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-600 transform hover:scale-[${context === 'preview' ? '1.02' : '1.01'}] transition-all duration-300 group`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10"></div>
        
        {/* Video Loading State */}
        {isLoading && (
          <div className="absolute inset-0 z-5 flex items-center justify-center bg-gray-800">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-white text-sm font-medium">Loading preview...</p>
            </div>
          </div>
        )}

        {/* Video Error State */}
        {hasError && (
          <div className="absolute inset-0 z-5 flex items-center justify-center bg-gray-800">
            <div className="text-center space-y-3">
              <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white text-sm font-medium">Failed to load video</p>
              <p className="text-gray-400 text-xs">Please try again</p>
            </div>
          </div>
        )}
        
        {/* Professional Video Player */}
        <div className={`relative w-full ${heightClasses[height]} bg-black rounded-2xl overflow-hidden`}>
          <video
            src={videoUrl}
            controls
            className={`w-full h-full object-contain relative z-20 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            preload="metadata"
            playsInline
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
            style={{
              backgroundColor: 'black'
            }}
          >
            Your browser does not support the video tag.
          </video>
          
          {showOverlay && !isLoading && !hasError && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              {/* Top Controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{title}</span>
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs font-medium">
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>HD</span>
                    </span>
                  </div>
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs font-medium">
                    <span className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Ready</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Bottom Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/10">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex-1">
                      <p className="text-sm font-semibold truncate">{fileName}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-300">{(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-300">{fileType}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-300">{subtitle || 'Click to play'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Valid</span>
                      </div>
                      <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UploadFormData {
  title: string;
  description: string;
  category: string;
  privacy: 'public' | 'unlisted' | 'private' | 'scheduled' | 'premiere';
  hashtags: string[];
  language: string;
  scheduledAt?: string;
  premiereAt?: string;
  ageRestriction: boolean;
  contentRating: 'general' | 'teen' | 'mature';
  commentsEnabled: boolean;
  commentModeration: 'none' | 'basic' | 'strict';
  monetizationEnabled: boolean;
  adPlacement: 'before' | 'during' | 'after' | 'all';
  revenueSharing: number; // percentage
  allowEmbedding: boolean;
  showViewCount: boolean;
  allowLiveStreaming: boolean;
  // Video Elements
  endScreenEnabled: boolean;
  endScreenTemplate: 'subscribe' | 'video' | 'playlist' | 'website';
  cardsEnabled: boolean;
  cardsCount: number;
  chaptersEnabled: boolean;
  // Accessibility
  captionsEnabled: boolean;
  subtitlesEnabled: boolean;
  autoCaptions: boolean;
  // Advanced Settings
  videoQuality: 'auto' | '1080p' | '720p' | '480p' | '360p';
  processingSpeed: 'standard' | 'fast';
  thumbnailTime: number; // seconds for auto thumbnail
  // SEO & Discovery
  tags: string[];
  location?: string;
  recordingDate?: string;
  // Notifications
  notifySubscribers: boolean;
  notifySocialMedia: boolean;
}

type WizardStep = 'upload' | 'details' | 'thumbnail' | 'visibility' | 'monetization' | 'elements' | 'accessibility' | 'advanced';

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customThumbnailFile, setCustomThumbnailFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    category: 'Entertainment',
    privacy: 'public',
    hashtags: [],
    language: 'en',
    scheduledAt: '',
    premiereAt: '',
    ageRestriction: false,
    contentRating: 'general',
    commentsEnabled: true,
    commentModeration: 'basic',
    monetizationEnabled: false,
    adPlacement: 'before',
    revenueSharing: 100,
    allowEmbedding: true,
    showViewCount: true,
    allowLiveStreaming: false,
    // Video Elements
    endScreenEnabled: false,
    endScreenTemplate: 'subscribe',
    cardsEnabled: false,
    cardsCount: 0,
    chaptersEnabled: false,
    // Accessibility
    captionsEnabled: false,
    subtitlesEnabled: false,
    autoCaptions: true,
    // Advanced Settings
    videoQuality: 'auto',
    processingSpeed: 'standard',
    thumbnailTime: 0,
    // SEO & Discovery
    tags: [],
    location: '',
    recordingDate: '',
    // Notifications
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

  const wizardSteps = [
    { id: 'upload', title: 'Upload Video', description: 'Select your video file' },
    { id: 'details', title: 'Details', description: 'Title, description & hashtags' },
    { id: 'thumbnail', title: 'Thumbnail', description: 'Choose thumbnail image' },
    { id: 'visibility', title: 'Visibility', description: 'Privacy & audience settings' },
    { id: 'monetization', title: 'Monetization', description: 'Ads & revenue settings' },
    { id: 'elements', title: 'Video Elements', description: 'End screens, cards & chapters' },
    { id: 'accessibility', title: 'Accessibility', description: 'Captions & subtitles' },
    { id: 'advanced', title: 'Advanced', description: 'Quality & processing options' }
  ] as const;

  const getCurrentStepIndex = () => {
    return wizardSteps.findIndex(step => step.id === currentStep);
  };

  const canProceedToNext = () => {
    // Check basic requirements without triggering validation state updates
    switch (currentStep) {
      case 'upload':
        return selectedFile !== null && !validationErrors.file;
      case 'details':
        return formData.title.trim().length > 0 && !validationErrors.title && !validationErrors.description && !validationErrors.hashtags;
      case 'thumbnail':
        return !validationErrors.thumbnail; // Thumbnail is optional
      case 'visibility':
        return !validationErrors.scheduledAt && !validationErrors.premiereAt;
      case 'monetization':
        return !validationErrors.revenueSharing;
      case 'elements':
        return !validationErrors.cardsCount;
      case 'accessibility':
        return true; // No validation needed
      case 'advanced':
        return !validationErrors.tags && !validationErrors.location && !validationErrors.recordingDate && !validationErrors.thumbnailTime;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < wizardSteps.length - 1 && canProceedToNext()) {
      setCurrentStep(wizardSteps[currentIndex + 1].id as WizardStep);
      setError(null);
      setValidationErrors({}); // Clear validation errors when moving to next step
    } else if (!canProceedToNext()) {
      // Only validate if there are no current errors to avoid infinite loops
      if (Object.keys(validationErrors).length === 0) {
        validateStep(currentStep);
      }
    }
  };

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(wizardSteps[currentIndex - 1].id as WizardStep);
      setError(null);
    }
  };

  const goToStep = (step: WizardStep) => {
    const targetIndex = wizardSteps.findIndex(s => s.id === step);
    const currentIndex = getCurrentStepIndex();
    
    // Allow going back to previous steps or current step
    if (targetIndex <= currentIndex) {
      setCurrentStep(step);
      setError(null);
    }
  };

  // Validation functions
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid video file (MP4, WebM, OGG, AVI, MOV)';
    }

    // Check file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return 'File size must be less than 500MB';
    }

    // Check file name length
    if (file.name.length > 255) {
      return 'File name is too long (max 255 characters)';
    }

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const hasSuspiciousExtension = suspiciousExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    if (hasSuspiciousExtension) {
      return 'Invalid file type. Please select a video file.';
    }

    return null;
  };

  const validateThumbnail = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, GIF, WebP)';
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Thumbnail file size must be less than 5MB';
    }

    // Check file name length
    if (file.name.length > 255) {
      return 'Thumbnail file name is too long (max 255 characters)';
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
        // Check for suspicious characters
        const suspiciousChars = /[<>{}[\]\\|`~!@#$%^&*()+=]/;
        if (suspiciousChars.test(value)) {
          return 'Title contains invalid characters';
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
        if (value) {
          const invalidHashtags = value.filter((tag: string) => 
            !/^[a-zA-Z0-9_]+$/.test(tag) || tag.length > 30
          );
          if (invalidHashtags.length > 0) {
            return 'Hashtags can only contain letters, numbers, and underscores (max 30 characters)';
          }
        }
        break;

      case 'tags':
        if (value && value.length > 15) {
          return 'Maximum 15 tags allowed';
        }
        if (value) {
          const invalidTags = value.filter((tag: string) => 
            tag.length > 30 || tag.includes(',')
          );
          if (invalidTags.length > 0) {
            return 'Tags cannot contain commas and must be less than 30 characters each';
          }
        }
        break;

      case 'scheduledAt':
        if (value) {
          const scheduledDate = new Date(value);
          const now = new Date();
          const maxFutureDate = new Date();
          maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1); // 1 year from now

          if (scheduledDate <= now) {
            return 'Scheduled date must be in the future';
          }
          if (scheduledDate > maxFutureDate) {
            return 'Scheduled date cannot be more than 1 year in the future';
          }
        }
        break;

      case 'premiereAt':
        if (value) {
          const premiereDate = new Date(value);
          const now = new Date();
          const maxFutureDate = new Date();
          maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);

          if (premiereDate <= now) {
            return 'Premiere date must be in the future';
          }
          if (premiereDate > maxFutureDate) {
            return 'Premiere date cannot be more than 1 year in the future';
          }
        }
        break;

      case 'revenueSharing':
        if (value < 0 || value > 100) {
          return 'Revenue sharing must be between 0 and 100';
        }
        break;

      case 'cardsCount':
        if (value < 0 || value > 5) {
          return 'Number of cards must be between 0 and 5';
        }
        break;

      case 'thumbnailTime':
        if (value < 0 || value > 300) {
          return 'Thumbnail time must be between 0 and 300 seconds';
        }
        break;

      case 'location':
        if (value && value.length > 100) {
          return 'Location must be less than 100 characters';
        }
        break;

      case 'recordingDate':
        if (value) {
          const recordingDate = new Date(value);
          const now = new Date();
          const maxPastDate = new Date();
          maxPastDate.setFullYear(maxPastDate.getFullYear() - 10); // 10 years ago

          if (recordingDate > now) {
            return 'Recording date cannot be in the future';
          }
          if (recordingDate < maxPastDate) {
            return 'Recording date cannot be more than 10 years ago';
          }
        }
        break;
    }

    return null;
  };

  const validateStep = (step: WizardStep): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 'upload':
        if (!selectedFile) {
          errors.file = 'Please select a video file';
        } else {
          const fileError = validateFile(selectedFile);
          if (fileError) {
            errors.file = fileError;
          }
        }
        break;

      case 'details':
        const titleError = validateFormField('title', formData.title);
        if (titleError) errors.title = titleError;

        const descriptionError = validateFormField('description', formData.description);
        if (descriptionError) errors.description = descriptionError;

        const hashtagsError = validateFormField('hashtags', formData.hashtags);
        if (hashtagsError) errors.hashtags = hashtagsError;
        break;

      case 'thumbnail':
        if (customThumbnailFile) {
          const thumbnailError = validateThumbnail(customThumbnailFile);
          if (thumbnailError) errors.thumbnail = thumbnailError;
        }
        break;

      case 'visibility':
        if (formData.privacy === 'scheduled' && formData.scheduledAt) {
          const scheduledError = validateFormField('scheduledAt', formData.scheduledAt);
          if (scheduledError) errors.scheduledAt = scheduledError;
        }

        if (formData.privacy === 'premiere' && formData.premiereAt) {
          const premiereError = validateFormField('premiereAt', formData.premiereAt);
          if (premiereError) errors.premiereAt = premiereError;
        }
        break;

      case 'monetization':
        const revenueError = validateFormField('revenueSharing', formData.revenueSharing);
        if (revenueError) errors.revenueSharing = revenueError;
        break;

      case 'elements':
        const cardsError = validateFormField('cardsCount', formData.cardsCount);
        if (cardsError) errors.cardsCount = cardsError;
        break;

      case 'accessibility':
        // No specific validation needed for accessibility step
        break;

      case 'advanced':
        const tagsError = validateFormField('tags', formData.tags);
        if (tagsError) errors.tags = tagsError;

        const locationError = validateFormField('location', formData.location);
        if (locationError) errors.location = locationError;

        const recordingDateError = validateFormField('recordingDate', formData.recordingDate);
        if (recordingDateError) errors.recordingDate = recordingDateError;

        const thumbnailTimeError = validateFormField('thumbnailTime', formData.thumbnailTime);
        if (thumbnailTimeError) errors.thumbnailTime = thumbnailTimeError;
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearValidationError = useCallback((field: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

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

  // Cleanup preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, [videoPreviewUrl, thumbnailPreviewUrl]);

  // Debounced validation effect to prevent excessive validation calls
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only validate if we're not currently uploading and there are no existing errors
      if (!uploading && Object.keys(validationErrors).length === 0) {
        validateStep(currentStep);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData, selectedFile, customThumbnailFile, currentStep, uploading]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      clearValidationError(name);
    }
    
    // Real-time validation for certain fields (only if there's an error to avoid unnecessary updates)
    if (name === 'title' || name === 'description' || name === 'location') {
      const error = validateFormField(name, newValue);
      if (error && error !== validationErrors[name]) {
        setValidationErrors(prev => ({ ...prev, [name]: error }));
      }
    }
  }, [validationErrors, clearValidationError]);

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
    clearValidationError('file');
    
    // Create video preview URL
    const videoUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(videoUrl);
    
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

  const handleThumbnailSelect = (file: File) => {
    const validationError = validateThumbnail(file);
    if (validationError) {
      setError(validationError);
      setValidationErrors({ thumbnail: validationError });
      return;
    }

    setCustomThumbnailFile(file);
    setError(null);
    clearValidationError('thumbnail');
    
    // Create thumbnail preview URL
    const thumbnailUrl = URL.createObjectURL(file);
    setThumbnailPreviewUrl(thumbnailUrl);
  };

  const handleThumbnailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleThumbnailSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    // Validate current step only, not all steps to avoid infinite loops
    const currentStepValid = validateStep(currentStep);
    
    if (!currentStepValid) {
      setError('Please fix validation errors in the current step before uploading');
      return;
    }

    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a video title');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
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
      uploadData.append('commentModeration', formData.commentModeration);
      uploadData.append('monetizationEnabled', formData.monetizationEnabled.toString());
      uploadData.append('adPlacement', formData.adPlacement);
      uploadData.append('revenueSharing', formData.revenueSharing.toString());
      uploadData.append('allowEmbedding', formData.allowEmbedding.toString());
      uploadData.append('showViewCount', formData.showViewCount.toString());
      uploadData.append('allowLiveStreaming', formData.allowLiveStreaming.toString());
      
      // Video Elements
      uploadData.append('endScreenEnabled', formData.endScreenEnabled.toString());
      uploadData.append('endScreenTemplate', formData.endScreenTemplate);
      uploadData.append('cardsEnabled', formData.cardsEnabled.toString());
      uploadData.append('cardsCount', formData.cardsCount.toString());
      uploadData.append('chaptersEnabled', formData.chaptersEnabled.toString());
      
      // Accessibility
      uploadData.append('captionsEnabled', formData.captionsEnabled.toString());
      uploadData.append('subtitlesEnabled', formData.subtitlesEnabled.toString());
      uploadData.append('autoCaptions', formData.autoCaptions.toString());
      
      // Advanced Settings
      uploadData.append('videoQuality', formData.videoQuality);
      uploadData.append('processingSpeed', formData.processingSpeed);
      uploadData.append('thumbnailTime', formData.thumbnailTime.toString());
      
      // SEO & Discovery
      uploadData.append('tags', JSON.stringify(formData.tags));
      uploadData.append('location', formData.location || '');
      uploadData.append('recordingDate', formData.recordingDate || '');
      
      // Notifications
      uploadData.append('notifySubscribers', formData.notifySubscribers.toString());
      uploadData.append('notifySocialMedia', formData.notifySocialMedia.toString());
      
      if (formData.scheduledAt) {
        uploadData.append('scheduledAt', formData.scheduledAt);
      }
      
      if (formData.premiereAt) {
        uploadData.append('premiereAt', formData.premiereAt);
      }
      
      if (customThumbnailFile) {
        uploadData.append('customThumbnail', customThumbnailFile);
      }

      // Upload with progress tracking
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
              setSuccess('Video uploaded successfully!');
              setUploadProgress(100);
              setTimeout(() => {
                router.push('/videos');
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
      xhr.withCredentials = true; // Include cookies for authentication
      xhr.send(uploadData);

    } catch (error) {
      console.error('Upload error:', error);
      setError('An error occurred during upload. Please try again.');
      setUploading(false);
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

  // Custom header content for upload page
  const uploadHeaderContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Upload Video</h1>
          <p className="text-xs text-gray-500">Step {getCurrentStepIndex() + 1} of {wizardSteps.length}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => router.push('/videos')}
          className="px-3 py-1.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Browse Videos
        </button>
      </div>
    </div>
  );

  // Show focused upload state when uploading
  if (uploading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-6">
          <div className="text-center space-y-6">
            {/* Upload Icon */}
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            {/* Upload Text */}
            <div>
              <h2 className="text-2xl font-semibold text-black mb-2">Uploading Video</h2>
              <p className="text-black">Please don't close this page while uploading</p>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-black">Progress</span>
                <span className="text-sm font-bold text-black">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
            
            {/* File Info */}
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
      showHeader={true}
      headerContent={uploadHeaderContent}
      className="bg-gray-50"
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>

      {/* Minimalistic Progress */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Simple Progress Line */}
            <div className="flex-1 flex items-center">
              <div className="flex items-center space-x-2">
                {wizardSteps.map((step, index) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = getCurrentStepIndex() > index;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-red-500 scale-125' : isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      {index < wizardSteps.length - 1 && (
                        <div className={`w-8 h-px mx-2 transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Step Counter */}
            <div className="text-sm text-gray-500 font-medium">
              {getCurrentStepIndex() + 1} / {wizardSteps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Step Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Minimalistic Step Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-black">
              {wizardSteps.find(s => s.id === currentStep)?.title}
            </h2>
            <p className="text-sm text-black mt-1">
              {wizardSteps.find(s => s.id === currentStep)?.description}
            </p>
          </div>

          {/* Step Content */}
          <div className="p-6">
            {/* Step 1: Upload Video */}
            {currentStep === 'upload' && (
              <div className="space-y-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                    dragActive
                      ? 'border-red-500 bg-red-50'
                      : selectedFile
                      ? 'border-green-500 bg-green-50'
                      : validationErrors.file
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="space-y-6">
                      {/* Enhanced Video Preview */}
                      {videoPreviewUrl && (
                        <VideoPreview
                          videoUrl={videoPreviewUrl}
                          fileName={selectedFile.name}
                          fileSize={selectedFile.size}
                          fileType={selectedFile.type}
                          title="Video Preview"
                          subtitle="Click to play"
                          height="lg"
                          context="preview"
                        />
                      )}
                      
                      {/* Enhanced File Info */}
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
                              <span className="text-sm text-green-600 font-medium">✓ Upload Ready</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                              if (videoPreviewUrl) {
                                URL.revokeObjectURL(videoPreviewUrl);
                                setVideoPreviewUrl(null);
                              }
                            }}
                            className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-black">Upload a video</h3>
                        <p className="text-sm text-black">Drag and drop your video here, or click to browse</p>
                        <p className="text-xs text-black mt-1">MP4, WebM, OGG, AVI, MOV (max 500MB)</p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
                
                {/* File Validation Error */}
                {validationErrors.file && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">{validationErrors.file}</span>
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
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black ${
                      validationErrors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter video title"
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
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 resize-none text-black ${
                      validationErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Describe your video content..."
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
                  <div className={`${validationErrors.hashtags ? 'border border-red-500 bg-red-50 rounded-lg p-2' : ''}`}>
                    <SmartHashtagInput
                      value={formData.hashtags}
                      onChange={(hashtags) => {
                        setFormData(prev => ({ ...prev, hashtags }));
                        if (validationErrors.hashtags) {
                          clearValidationError('hashtags');
                        }
                      }}
                      placeholder="Add hashtags..."
                      maxHashtags={10}
                      showRecommendations={true}
                      videoContent={{
                        title: formData.title,
                        description: formData.description,
                        category: formData.category,
                        duration: 0,
                      }}
                      className="w-full"
                    />
                  </div>
                  {validationErrors.hashtags && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      {validationErrors.hashtags}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Thumbnail */}
            {currentStep === 'thumbnail' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Custom Thumbnail (Optional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailInputChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-black"
                    >
                      {customThumbnailFile ? customThumbnailFile.name : 'Choose thumbnail'}
                    </button>
                    {customThumbnailFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomThumbnailFile(null);
                          if (thumbnailPreviewUrl) {
                            URL.revokeObjectURL(thumbnailPreviewUrl);
                            setThumbnailPreviewUrl(null);
                          }
                        }}
                        className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-black mt-1">
                    Upload a custom thumbnail (1280x720 recommended)
                  </p>
                  {validationErrors.thumbnail && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      {validationErrors.thumbnail}
                    </p>
                  )}
                </div>

                {/* Enhanced Thumbnail Preview */}
                {thumbnailPreviewUrl && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-black flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Thumbnail Preview
                      </h4>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium animate-pulse">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                          <span>Selected</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Custom</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl overflow-hidden shadow-xl border border-gray-200 transform hover:scale-[1.02] transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent z-10"></div>
                      
                      {/* Thumbnail Loading State */}
                      <div className="absolute inset-0 z-5 flex items-center justify-center bg-gray-100">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-gray-600 text-sm font-medium">Loading thumbnail...</p>
                        </div>
                      </div>
                      
                      <img
                        src={thumbnailPreviewUrl}
                        alt="Thumbnail preview"
                        className="w-full h-72 object-cover relative z-0 opacity-0 transition-opacity duration-500"
                        onLoad={(e) => {
                          e.currentTarget.style.opacity = '1';
                          const loadingElement = e.currentTarget.previousElementSibling as HTMLElement;
                          if (loadingElement) {
                            loadingElement.style.display = 'none';
                          }
                        }}
                      />
                      
                      {/* Enhanced Thumbnail Info Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 z-20">
                        <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-black truncate">{customThumbnailFile?.name}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-gray-600">
                                  {customThumbnailFile ? ((customThumbnailFile.size / (1024 * 1024)).toFixed(2)) : '0'} MB
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-600">{customThumbnailFile?.type}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-600">1280×720</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 text-blue-600 rounded-lg text-xs font-medium">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Ready</span>
                              </div>
                              <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-600 rounded-lg text-xs font-medium">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>HD</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Thumbnail Quality Indicator */}
                      <div className="absolute top-4 right-4 z-20">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-gray-700 text-xs font-medium shadow-sm">
                          <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span>HD Thumbnail</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Video Preview (if available) */}
                {videoPreviewUrl && (
                  <VideoPreview
                    videoUrl={videoPreviewUrl}
                    fileName={selectedFile?.name || ''}
                    fileSize={selectedFile?.size || 0}
                    fileType={selectedFile?.type || ''}
                    title="Video Reference"
                    subtitle="Video Reference • Click to play"
                    height="md"
                    context="reference"
                  />
                )}
              </div>
            )}

            {/* Step 4: Visibility */}
            {currentStep === 'visibility' && (
              <div className="space-y-6">
                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Privacy & Publishing</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Visibility
                    </label>
                    <select
                      name="privacy"
                      value={formData.privacy}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black"
                    >
                      <option value="public">Public - Anyone can search for and view</option>
                      <option value="unlisted">Unlisted - Anyone with the link can view</option>
                      <option value="private">Private - Only you can view</option>
                      <option value="scheduled">Scheduled - Publish at a specific time</option>
                      <option value="premiere">Premiere - Live premiere event</option>
                    </select>
                  </div>

                  {formData.privacy === 'scheduled' && (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Schedule Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        name="scheduledAt"
                        value={formData.scheduledAt}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black ${
                          validationErrors.scheduledAt ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.scheduledAt && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          {validationErrors.scheduledAt}
                        </p>
                      )}
                    </div>
                  )}

                  {formData.privacy === 'premiere' && (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Premiere Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        name="premiereAt"
                        value={formData.premiereAt}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black ${
                          validationErrors.premiereAt ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-600">Viewers can join the premiere chat before it starts</p>
                        {validationErrors.premiereAt && (
                          <p className="text-xs text-red-600 font-medium">
                            {validationErrors.premiereAt}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audience Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Audience</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Language
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Content Rating
                    </label>
                    <select
                      name="contentRating"
                      value={formData.contentRating}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black"
                    >
                      <option value="general">General - Suitable for all audiences</option>
                      <option value="teen">Teen - Suitable for ages 13 and up</option>
                      <option value="mature">Mature - Suitable for ages 18 and up</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Age Restriction</label>
                      <p className="text-xs text-gray-600">Restrict video to viewers 18 and older</p>
                    </div>
                    <input
                      type="checkbox"
                      name="ageRestriction"
                      checked={formData.ageRestriction}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Comments Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Comments</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Enable Comments</label>
                      <p className="text-xs text-gray-600">Allow viewers to comment on your video</p>
                    </div>
                    <input
                      type="checkbox"
                      name="commentsEnabled"
                      checked={formData.commentsEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  {formData.commentsEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Comment Moderation
                      </label>
                      <select
                        name="commentModeration"
                        value={formData.commentModeration}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black"
                      >
                        <option value="none">None - All comments are approved automatically</option>
                        <option value="basic">Basic - Hold potentially inappropriate comments</option>
                        <option value="strict">Strict - Hold a broader set of comments for review</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Monetization */}
            {currentStep === 'monetization' && (
              <div className="space-y-6">
                {/* Monetization Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Monetization</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Enable Monetization</label>
                      <p className="text-xs text-gray-600">Enable ads on your video to earn revenue</p>
                    </div>
                    <input
                      type="checkbox"
                      name="monetizationEnabled"
                      checked={formData.monetizationEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  {formData.monetizationEnabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Ad Placement
                        </label>
                        <select
                          name="adPlacement"
                          value={formData.adPlacement}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black"
                        >
                          <option value="before">Before Video - Pre-roll ads only</option>
                          <option value="during">During Video - Mid-roll ads only</option>
                          <option value="after">After Video - Post-roll ads only</option>
                          <option value="all">All Positions - Maximum revenue</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Revenue Sharing: {formData.revenueSharing}%
                        </label>
                        <input
                          type="range"
                          name="revenueSharing"
                          min="0"
                          max="100"
                          value={formData.revenueSharing}
                          onChange={handleInputChange}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Creator: {formData.revenueSharing}%</span>
                          <span>Platform: {100 - formData.revenueSharing}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Embedding Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Distribution</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Allow Embedding</label>
                      <p className="text-xs text-gray-600">Allow others to embed your video on their websites</p>
                    </div>
                    <input
                      type="checkbox"
                      name="allowEmbedding"
                      checked={formData.allowEmbedding}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
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
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Video Elements */}
            {currentStep === 'elements' && (
              <div className="space-y-6">
                {/* End Screen Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">End Screen</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Enable End Screen</label>
                      <p className="text-xs text-gray-600">Add interactive elements at the end of your video</p>
                    </div>
                    <input
                      type="checkbox"
                      name="endScreenEnabled"
                      checked={formData.endScreenEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  {formData.endScreenEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        End Screen Template
                      </label>
                      <select
                        name="endScreenTemplate"
                        value={formData.endScreenTemplate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black"
                      >
                        <option value="subscribe">Subscribe Button</option>
                        <option value="video">Related Video</option>
                        <option value="playlist">Playlist</option>
                        <option value="website">Website Link</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Cards Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Cards</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Enable Cards</label>
                      <p className="text-xs text-gray-600">Add interactive cards during your video</p>
                    </div>
                    <input
                      type="checkbox"
                      name="cardsEnabled"
                      checked={formData.cardsEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  {formData.cardsEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Number of Cards: {formData.cardsCount}
                      </label>
                      <input
                        type="range"
                        name="cardsCount"
                        min="0"
                        max="5"
                        value={formData.cardsCount}
                        onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-xs text-gray-600 mt-1">Maximum 5 cards per video</p>
                    </div>
                  )}
                </div>

                {/* Chapters Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Chapters</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Enable Chapters</label>
                      <p className="text-xs text-gray-600">Add chapter markers to help viewers navigate</p>
                    </div>
                    <input
                      type="checkbox"
                      name="chaptersEnabled"
                      checked={formData.chaptersEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  {formData.chaptersEnabled && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Chapters will be automatically generated based on your video content, or you can add them manually after upload.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 7: Accessibility */}
            {currentStep === 'accessibility' && (
              <div className="space-y-6">
                {/* Captions Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Captions & Subtitles</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Enable Captions</label>
                      <p className="text-xs text-gray-600">Add captions for accessibility and better engagement</p>
                    </div>
                    <input
                      type="checkbox"
                      name="captionsEnabled"
                      checked={formData.captionsEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Enable Subtitles</label>
                      <p className="text-xs text-gray-600">Add subtitles in multiple languages</p>
                    </div>
                    <input
                      type="checkbox"
                      name="subtitlesEnabled"
                      checked={formData.subtitlesEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Auto-Generated Captions</label>
                      <p className="text-xs text-gray-600">Automatically generate captions using AI</p>
                    </div>
                    <input
                      type="checkbox"
                      name="autoCaptions"
                      checked={formData.autoCaptions}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  {(formData.captionsEnabled || formData.subtitlesEnabled) && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Accessibility:</strong> Captions and subtitles make your content accessible to viewers with hearing impairments and help with language barriers.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 8: Advanced */}
            {currentStep === 'advanced' && (
              <div className="space-y-6">
                {/* Category & SEO */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Category & SEO</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                        setFormData(prev => ({ ...prev, tags }));
                        if (validationErrors.tags) {
                          clearValidationError('tags');
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black ${
                        validationErrors.tags ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="gaming, tutorial, review"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-600">Add relevant tags to help viewers discover your video</p>
                      {validationErrors.tags && (
                        <p className="text-xs text-red-600 font-medium">
                          {validationErrors.tags}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black ${
                        validationErrors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="New York, NY"
                    />
                    {validationErrors.location && (
                      <p className="text-xs text-red-600 font-medium mt-1">
                        {validationErrors.location}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Recording Date
                    </label>
                    <input
                      type="date"
                      name="recordingDate"
                      value={formData.recordingDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black ${
                        validationErrors.recordingDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.recordingDate && (
                      <p className="text-xs text-red-600 font-medium mt-1">
                        {validationErrors.recordingDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Video Quality & Processing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Video Quality & Processing</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Video Quality
                    </label>
                    <select
                      name="videoQuality"
                      value={formData.videoQuality}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black"
                    >
                      <option value="auto">Auto - Best quality available</option>
                      <option value="1080p">1080p HD</option>
                      <option value="720p">720p HD</option>
                      <option value="480p">480p SD</option>
                      <option value="360p">360p</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Processing Speed
                    </label>
                    <select
                      name="processingSpeed"
                      value={formData.processingSpeed}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-black"
                    >
                      <option value="standard">Standard - Normal processing time</option>
                      <option value="fast">Fast - Faster processing, may affect quality</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Auto Thumbnail Time: {formData.thumbnailTime}s
                    </label>
                    <input
                      type="range"
                      name="thumbnailTime"
                      min="0"
                      max="300"
                      value={formData.thumbnailTime}
                      onChange={handleInputChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-600 mt-1">Set the time (in seconds) for automatic thumbnail generation</p>
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Notifications</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Notify Subscribers</label>
                      <p className="text-xs text-gray-600">Send notification to your subscribers when video is published</p>
                    </div>
                    <input
                      type="checkbox"
                      name="notifySubscribers"
                      checked={formData.notifySubscribers}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Social Media Sharing</label>
                      <p className="text-xs text-gray-600">Automatically share to connected social media accounts</p>
                    </div>
                    <input
                      type="checkbox"
                      name="notifySocialMedia"
                      checked={formData.notifySocialMedia}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Live Streaming */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Live Streaming</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-black">Enable Live Streaming</label>
                      <p className="text-xs text-gray-600">Enable live streaming features for this video</p>
                    </div>
                    <input
                      type="checkbox"
                      name="allowLiveStreaming"
                      checked={formData.allowLiveStreaming}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mx-6 mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mx-6 mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Minimalistic Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={getCurrentStepIndex() === 0}
              className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Previous
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/videos')}
                className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              
              {currentStep === 'advanced' ? (
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceedToNext()}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </UniversalLayout>
  );
}
