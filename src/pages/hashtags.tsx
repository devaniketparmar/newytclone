import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import HashtagFeed from '../components/HashtagFeed';

interface Hashtag {
  id: string;
  name: string;
  description: string;
  videoCount: number;
  followers: number;
  isFollowing: boolean;
  trending: boolean;
}

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  likes: number;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscribers: number;
  };
  hashtags: string[];
}

export default function HashtagsPage() {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  useEffect(() => {
    fetchHashtags();
    fetchTrendingVideos();
  }, []);

  const fetchHashtags = async () => {
    try {
      const response = await fetch('/api/hashtags?action=trending&limit=20');
      const data = await response.json();
      setHashtags(data.data?.hashtags || []);
    } catch (error) {
      console.error('Error fetching hashtags:', error);
    }
  };

  const fetchTrendingVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos?limit=20');
      const data = await response.json();
      setVideos(data.data || []);
    } catch (error) {
      console.error('Error fetching trending videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (hashtagName: string) => {
    setSelectedHashtag(hashtagName);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Hashtags
              </h1>
            </div>
            <p className="text-neutral-600">
              Explore trending hashtags and discover new content
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trending Hashtags */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Trending Hashtags
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {hashtags.map((hashtag) => (
              <div
                key={hashtag.id}
                onClick={() => handleHashtagClick(hashtag.name)}
                className="bg-white rounded-lg p-4 border border-neutral-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-600 font-semibold text-lg group-hover:text-blue-700">
                    #{hashtag.name}
                  </span>
                  {hashtag.trending && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                      Trending
                    </span>
                  )}
                </div>
                
                <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                  {hashtag.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{formatCount(hashtag.videoCount)} videos</span>
                  <span>{formatCount(hashtag.followers)} followers</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Videos Section */}
        {selectedHashtag ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">
                Videos tagged with #{selectedHashtag}
              </h2>
              <button
                onClick={() => setSelectedHashtag(null)}
                className="text-neutral-500 hover:text-neutral-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <HashtagFeed hashtag={selectedHashtag} />
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Trending Videos
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <LoadingPlaceholder key={index} />
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No trending videos available
                </h3>
                <p className="text-neutral-600">
                  There are no trending videos available at the moment.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
