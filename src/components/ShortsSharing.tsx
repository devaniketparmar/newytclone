import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';

interface ShortVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl: string;
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}

interface ShortsSharingProps {
  video: ShortVideo;
  onClose?: () => void;
  enableStories?: boolean;
  enableReels?: boolean;
  enableSocialMedia?: boolean;
}

export default function ShortsSharing({
  video,
  onClose,
  enableStories = true,
  enableReels = true,
  enableSocialMedia = true
}: ShortsSharingProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [shareMethod, setShareMethod] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const videoUrl = `${window.location.origin}/video/${video.id}`;
  const shareText = customMessage || `Check out this amazing short video: ${video.title}`;

  const socialPlatforms = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: 'bg-blue-500',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(videoUrl)}`
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      url: `https://www.instagram.com/`
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: 'bg-black',
      url: `https://www.tiktok.com/`
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: '🤖',
      color: 'bg-orange-500',
      url: `https://reddit.com/submit?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(shareText)}`
    }
  ];

  const storyTemplates = [
    {
      id: 'trending',
      name: 'Trending Now',
      background: 'bg-gradient-to-r from-red-500 to-pink-500',
      textColor: 'text-white'
    },
    {
      id: 'viral',
      name: 'Going Viral',
      background: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      textColor: 'text-white'
    },
    {
      id: 'funny',
      name: 'Funny Moment',
      background: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      textColor: 'text-black'
    },
    {
      id: 'epic',
      name: 'Epic Moment',
      background: 'bg-gradient-to-r from-gray-800 to-gray-900',
      textColor: 'text-white'
    }
  ];

  const suggestedHashtags = [
    '#shorts', '#viral', '#trending', '#fyp', '#foryou',
    '#funny', '#dance', '#music', '#comedy', '#epic',
    '#amazing', '#incredible', '#wow', '#mindblown', '#fire'
  ];

  const handleShare = useCallback(async (platform: string, url?: string) => {
    try {
      setIsSharing(true);
      setShareMethod(platform);

      if (platform === 'copy') {
        await navigator.clipboard.writeText(videoUrl);
        alert('Video link copied to clipboard!');
      } else if (platform === 'native') {
        if (navigator.share) {
          await navigator.share({
            title: video.title,
            text: shareText,
            url: videoUrl,
          });
        } else {
          await navigator.clipboard.writeText(videoUrl);
          alert('Video link copied to clipboard!');
        }
      } else if (url) {
        window.open(url, '_blank', 'width=600,height=400');
      }

      // Track share event
      await fetch(`/api/videos/${video.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          method: 'social'
        }),
      });

    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share video. Please try again.');
    } finally {
      setIsSharing(false);
      setShareMethod(null);
    }
  }, [video.id, video.title, videoUrl, shareText]);

  const handleStoryShare = useCallback(async (template: string) => {
    try {
      setIsSharing(true);
      setShareMethod(`story-${template}`);

      // Create story data
      const storyData = {
        videoId: video.id,
        template,
        message: shareText,
        hashtags: selectedHashtags,
        timestamp: Date.now()
      };

      // Save story data (for internal stories feature)
      await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      // Track story share
      await fetch(`/api/videos/${video.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'stories',
          method: 'story',
          template
        }),
      });

      alert('Story created successfully!');

    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story. Please try again.');
    } finally {
      setIsSharing(false);
      setShareMethod(null);
    }
  }, [video.id, shareText, selectedHashtags]);

  const handleReelsShare = useCallback(async () => {
    try {
      setIsSharing(true);
      setShareMethod('reels');

      // Create reels data
      const reelsData = {
        videoId: video.id,
        message: shareText,
        hashtags: selectedHashtags,
        timestamp: Date.now()
      };

      // Save reels data
      await fetch('/api/reels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reelsData),
      });

      // Track reels share
      await fetch(`/api/videos/${video.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'reels',
          method: 'reels'
        }),
      });

      alert('Added to Reels successfully!');

    } catch (error) {
      console.error('Error adding to reels:', error);
      alert('Failed to add to reels. Please try again.');
    } finally {
      setIsSharing(false);
      setShareMethod(null);
    }
  }, [video.id, shareText, selectedHashtags]);

  const toggleHashtag = useCallback((hashtag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag) 
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Share Short</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
          >
            <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Video Preview */}
          <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
            <img
              src={video.thumbnailUrl || '/api/placeholder/60/60'}
              alt={video.title}
              className="w-15 h-15 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-neutral-900 truncate">{video.title}</h3>
              <p className="text-sm text-neutral-600 truncate">{video.channel.name}</p>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Add a message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add your message..."
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              maxLength={280}
            />
            <p className="text-xs text-neutral-500 mt-1">
              {customMessage.length}/280 characters
            </p>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Add hashtags
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestedHashtags.map((hashtag) => (
                <button
                  key={hashtag}
                  onClick={() => toggleHashtag(hashtag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedHashtags.includes(hashtag)
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {hashtag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Share Options */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Quick Share</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShare('native')}
                disabled={isSharing}
                className="flex items-center justify-center space-x-2 p-3 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="text-sm font-medium">Share</span>
              </button>
              
              <button
                onClick={() => handleShare('copy')}
                disabled={isSharing}
                className="flex items-center justify-center space-x-2 p-3 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Copy Link</span>
              </button>
            </div>
          </div>

          {/* Social Media Platforms */}
          {enableSocialMedia && (
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Share to Social Media</h3>
              <div className="grid grid-cols-3 gap-3">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handleShare(platform.id, platform.url)}
                    disabled={isSharing}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg text-white transition-colors disabled:opacity-50 ${platform.color}`}
                  >
                    <span className="text-lg mb-1">{platform.icon}</span>
                    <span className="text-xs font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stories */}
          {enableStories && (
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Create Story</h3>
              <div className="grid grid-cols-2 gap-3">
                {storyTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleStoryShare(template.id)}
                    disabled={isSharing}
                    className={`flex items-center justify-center p-3 rounded-lg transition-colors disabled:opacity-50 ${template.background}`}
                  >
                    <span className={`text-sm font-medium ${template.textColor}`}>
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reels */}
          {enableReels && (
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Add to Reels</h3>
              <button
                onClick={handleReelsShare}
                disabled={isSharing}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16M9 8v8M15 8v8" />
                </svg>
                <span className="font-medium">Add to Reels</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isSharing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <svg className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-neutral-600">
                {shareMethod?.startsWith('story-') ? 'Creating story...' :
                 shareMethod === 'reels' ? 'Adding to reels...' :
                 'Sharing...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

