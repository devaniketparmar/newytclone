import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import MobileShortsPlayer from '../components/MobileShortsPlayer';
import LoadingPlaceholder from '../components/LoadingPlaceholder';

interface ShortVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    userId: string;
  };
  hashtags: string[];
  isShort: boolean;
  aspectRatio: string;
  category: string;
  engagement: number;
  trendingScore: number;
}

export default function YouTubeShortsPage() {
  const router = useRouter();
  const [shortVideos, setShortVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchShortVideos();
  }, []);

  const fetchShortVideos = async () => {
    try {
      setLoading(true);
      
      // Fetch trending shorts
      const response = await fetch('/api/shorts?action=trending&limit=50&duration=60');
      const data = await response.json();

      if (data.success) {
        setShortVideos(data.data?.videos || []);
      }
    } catch (error) {
      console.error('Error fetching short videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoChange = (video: ShortVideo, index: number) => {
    setCurrentVideoIndex(index);
    
    // Track video view
    trackVideoView(video.id);
  };

  const trackVideoView = async (videoId: string) => {
    try {
      await fetch(`/api/videos/${videoId}/watchtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchTime: 1, // Track as viewed
        }),
      });
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setLikedVideos(prev => {
          const newSet = new Set(prev);
          if (newSet.has(videoId)) {
            newSet.delete(videoId);
          } else {
            newSet.add(videoId);
          }
          return newSet;
        });

        // Update the video's like count in the state
        setShortVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, likeCount: likedVideos.has(videoId) ? video.likeCount - 1 : video.likeCount + 1 }
            : video
        ));
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleComment = (videoId: string) => {
    router.push(`/video/${videoId}?tab=comments`);
  };

  const handleShare = async (videoId: string) => {
    try {
      const videoUrl = `${window.location.origin}/video/${videoId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this short video!',
          text: 'Watch this amazing short video',
          url: videoUrl,
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(videoUrl);
        alert('Video link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  const handleSubscribe = async (channelId: string) => {
    try {
      const response = await fetch(`/api/channels/${channelId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSubscribedChannels(prev => {
          const newSet = new Set(prev);
          if (newSet.has(channelId)) {
            newSet.delete(channelId);
          } else {
            newSet.add(channelId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error subscribing to channel:', error);
    }
  };

  const handleLoadMore = async () => {
    try {
      const response = await fetch(`/api/shorts?action=discover&limit=20&offset=${shortVideos.length}&duration=60`);
      const data = await response.json();

      if (data.success) {
        setShortVideos(prev => [...prev, ...(data.data?.videos || [])]);
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-700 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16M9 8v8M15 8v8" />
            </svg>
          </div>
          <p className="text-white text-lg font-medium">Loading Shorts...</p>
          <p className="text-neutral-400">Getting the latest short videos</p>
        </div>
      </div>
    );
  }

  if (shortVideos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-neutral-700 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16M9 8v8M15 8v8" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">No Shorts Available</h3>
          <p className="text-neutral-400 mb-6">There are no short videos available at the moment.</p>
          <button
            onClick={() => router.push('/upload')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Create Your First Short
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black">
      <MobileShortsPlayer
        videos={shortVideos}
        initialIndex={currentVideoIndex}
        onVideoChange={handleVideoChange}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onSubscribe={handleSubscribe}
      />
      
      {/* Load More Button (hidden, triggered by scroll) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 pointer-events-none">
        <button
          onClick={handleLoadMore}
          className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
        >
          Load More Shorts
        </button>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const token = req.cookies.token;

  if (!token) {
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
