import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface VideoFormData {
  title: string;
  description: string;
  category: string;
  privacy: 'public' | 'unlisted' | 'private';
  tags: string;
  language: string;
  scheduledAt?: string;
  ageRestriction: boolean;
  commentsEnabled: boolean;
  monetizationEnabled: boolean;
  allowEmbedding: boolean;
  showViewCount: boolean;
  allowLiveStreaming: boolean;
}

interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  privacy: string;
  tags: string;
  language: string;
  scheduledAt?: string;
  ageRestriction: boolean;
  commentsEnabled: boolean;
  monetizationEnabled: boolean;
  allowEmbedding: boolean;
  showViewCount: boolean;
  allowLiveStreaming: boolean;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export default function EditVideoPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<any>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    category: 'Entertainment',
    privacy: 'public',
    tags: '',
    language: 'en',
    scheduledAt: '',
    ageRestriction: false,
    commentsEnabled: true,
    monetizationEnabled: false,
    allowEmbedding: true,
    showViewCount: true,
    allowLiveStreaming: false
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

  // Check authentication and load video data
  useEffect(() => {
    const checkAuthAndLoadVideo = async () => {
      try {
        // Check authentication
        const authResponse = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (!authResponse.ok) {
          router.push('/auth');
          return;
        }
        
        const userData = await authResponse.json();
        setUser(userData.data);

        // Load video data
        if (id) {
          const videoResponse = await fetch(`/api/videos/${id}`, {
            credentials: 'include'
          });
          
          if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            const videoInfo = videoData.data;
            
            // Check if user owns this video
            if (videoInfo.channel.userId !== userData.data.id) {
              setError('You do not have permission to edit this video');
              return;
            }
            
            setVideo(videoInfo);
            
            // Parse metadata
            const metadata = typeof videoInfo.metadata === 'string' 
              ? JSON.parse(videoInfo.metadata) 
              : videoInfo.metadata || {};
            
            setFormData({
              title: videoInfo.title || '',
              description: videoInfo.description || '',
              category: videoInfo.category || 'Entertainment',
              privacy: videoInfo.privacy?.toLowerCase() || 'public',
              tags: metadata.tags ? metadata.tags.join(', ') : '',
              language: metadata.language || 'en',
              scheduledAt: videoInfo.scheduledAt ? new Date(videoInfo.scheduledAt).toISOString().slice(0, 16) : '',
              ageRestriction: metadata.ageRestriction || false,
              commentsEnabled: metadata.commentsEnabled !== false,
              monetizationEnabled: metadata.monetizationEnabled || false,
              allowEmbedding: metadata.allowEmbedding !== false,
              showViewCount: metadata.showViewCount !== false,
              allowLiveStreaming: metadata.allowLiveStreaming || false
            });
          } else {
            setError('Video not found');
          }
        }
      } catch (error) {
        console.error('Error loading video:', error);
        setError('Failed to load video data');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadVideo();
  }, [id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a video title');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Video updated successfully!');
        setTimeout(() => {
          router.push('/videos');
        }, 2000);
      } else {
        setError(result.error || 'Failed to update video');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      setError('An error occurred while updating the video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Video deleted successfully!');
        setTimeout(() => {
          router.push('/videos');
        }, 2000);
      } else {
        setError(result.error || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      setError('An error occurred while deleting the video');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !video) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">Error</div>
          <p className="text-gray-600">{error || 'Video not found'}</p>
          <button
            onClick={() => router.push('/videos')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center cursor-pointer">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">YouTube Clone</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/videos')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Browse Videos
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Edit Video</h2>
              <p className="text-gray-700 font-medium">Update your video details</p>
            </div>
          </div>
        </div>

        {/* Video Preview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-200 mb-6">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Video Preview</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl.startsWith('/uploads/') ? `/api/uploads/${video.thumbnailUrl.replace('/uploads/', '')}` : video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                    <div className="text-center text-white">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <p className="text-sm font-medium">Video Thumbnail</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{video.title}</h4>
                <p className="text-sm text-gray-600">{video.channel.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Views:</span>
                  <span className="ml-2 text-gray-600">{video.viewCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Likes:</span>
                  <span className="ml-2 text-gray-600">{video.likeCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Comments:</span>
                  <span className="ml-2 text-gray-600">{video.commentCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Duration:</span>
                  <span className="ml-2 text-gray-600">{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Uploaded:</span>
                <span className="ml-2 text-gray-600">{new Date(video.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Details Form - Same as upload form but for editing */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Video Details</h3>
          </div>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-200">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Basic Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium"
                  placeholder="Enter video title"
                  required
                />
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium resize-none"
                  placeholder="Tell viewers about your video"
                />
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  {formData.description.length}/5000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium"
                  placeholder="Enter tags separated by commas"
                />
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  Add tags to help people discover your video (max 15 tags)
                </p>
              </div>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-200">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Visibility</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Privacy
                  </label>
                  <select
                    name="privacy"
                    value={formData.privacy}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium"
                  >
                    <option value="public">Public - Anyone can search for and view</option>
                    <option value="unlisted">Unlisted - Anyone with the link can view</option>
                    <option value="private">Private - Only you can view</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Language
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium"
                />
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  Schedule your video to be published at a specific date and time
                </p>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-200">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Advanced Settings</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-sm font-bold text-gray-900">Age Restriction</label>
                    <p className="text-sm text-gray-700 font-medium">Restrict video to viewers 18 and older</p>
                  </div>
                  <input
                    type="checkbox"
                    name="ageRestriction"
                    checked={formData.ageRestriction}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-sm font-bold text-gray-900">Comments</label>
                    <p className="text-sm text-gray-700 font-medium">Allow viewers to comment on your video</p>
                  </div>
                  <input
                    type="checkbox"
                    name="commentsEnabled"
                    checked={formData.commentsEnabled}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-sm font-bold text-gray-900">Monetization</label>
                    <p className="text-sm text-gray-700 font-medium">Enable ads on your video</p>
                  </div>
                  <input
                    type="checkbox"
                    name="monetizationEnabled"
                    checked={formData.monetizationEnabled}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-sm font-bold text-gray-900">Allow Embedding</label>
                    <p className="text-sm text-gray-700 font-medium">Allow others to embed your video on their websites</p>
                  </div>
                  <input
                    type="checkbox"
                    name="allowEmbedding"
                    checked={formData.allowEmbedding}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-sm font-bold text-gray-900">Show View Count</label>
                    <p className="text-sm text-gray-700 font-medium">Display the number of views on your video</p>
                  </div>
                  <input
                    type="checkbox"
                    name="showViewCount"
                    checked={formData.showViewCount}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-sm font-bold text-gray-900">Live Streaming</label>
                    <p className="text-sm text-gray-700 font-medium">Enable live streaming features</p>
                  </div>
                  <input
                    type="checkbox"
                    name="allowLiveStreaming"
                    checked={formData.allowLiveStreaming}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-200">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Category</h4>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  Choose a category that best describes your video content
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl mb-8">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-xl mb-8">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{success}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleDelete}
            disabled={saving}
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {saving ? 'Processing...' : 'Delete Video'}
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/videos')}
              className="px-8 py-3 border-2 border-gray-300 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Changes</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
