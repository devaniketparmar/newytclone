import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import UniversalLayout from '@/components/UniversalLayout';
import VideoPlayer from '@/components/VideoPlayer';
import VideoCard from '@/components/VideoCard';

interface Video {
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
}

interface VideoPageProps {
  video: Video;
  relatedVideos: Video[];
  user?: any;
}

export default function VideoPage({ video, relatedVideos, user }: VideoPageProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load user's like and subscription status
    if (user) {
      // This would typically come from an API call
      setIsLiked(false);
      setIsSubscribed(false);
    }
  }, [user]);

  const handleLike = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      setLoading(true);
      // API call to like/unlike video
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      setLoading(true);
      // API call to subscribe/unsubscribe
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatViewCount = (count: number | undefined | null) => {
    if (!count || count === 0) {
      return '0';
    }
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatTimeAgo = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'Unknown';
    }
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  if (!video) {
    return (
      <UniversalLayout user={user}>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Video Not Found</h3>
            <p className="text-neutral-600 mb-6">
              The video you're looking for doesn't exist or has been removed.
            </p>
            <button 
              onClick={() => router.push('/videos')}
              className="professional-button professional-button-primary"
            >
              Browse Videos
            </button>
          </div>
        </div>
      </UniversalLayout>
    );
  }

  return (
    <UniversalLayout user={user}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              <VideoPlayer
                videoUrl={video.videoUrl}
                thumbnailUrl={video.thumbnailUrl}
                title={video.title}
              />
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-neutral-900 mb-4">{video.title}</h1>
              
              {/* Video Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-6 text-sm text-neutral-600">
                  <span>{formatViewCount(video.viewCount)} views</span>
                  <span>{formatTimeAgo(video.publishedAt)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      isLiked 
                        ? 'bg-primary-100 text-primary-700' 
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                    </svg>
                    <span>{formatViewCount(video.likeCount)}</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Channel Info */}
              <div className="flex items-center justify-between py-4 border-t border-neutral-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-neutral-300 rounded-full">
                    <img
                      src={video.channel.avatarUrl || '/api/placeholder/48/48'}
                      alt={video.channel.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{video.channel.name}</h3>
                    <p className="text-sm text-neutral-600">{formatViewCount(video.channel.subscriberCount)} subscribers</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleSubscribe}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    isSubscribed 
                      ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300' 
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Description */}
              <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                <p className="text-neutral-800 whitespace-pre-wrap">{video.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Related Videos</h3>
              {relatedVideos.map((relatedVideo) => (
                <VideoCard
                  key={relatedVideo.id}
                  video={relatedVideo}
                  user={user}
                  layout="list"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps = async (context: any) => {
  try {
    const { id } = context.params;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';

    // Fetch video data
    const videoResponse = await fetch(`${baseUrl}/api/videos/${id}`);
    let video = null;
    
    if (videoResponse.ok) {
      const videoData = await videoResponse.json();
      video = videoData.data;
    }

    // Fetch related videos
    const relatedResponse = await fetch(`${baseUrl}/api/videos`);
    let relatedVideos = [];
    
    if (relatedResponse.ok) {
      const relatedData = await relatedResponse.json();
      relatedVideos = (relatedData.data || []).filter((v: any) => v.id !== id).slice(0, 10);
    }

    // Try to get user data from cookies
    let user = null;
    const token = context.req.cookies.token;
    
    if (token) {
      try {
        const userResponse = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            'Cookie': `token=${token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          user = userData.data.user;
        }
      } catch (error) {
        console.log('Could not fetch user data:', error);
      }
    }

    return {
      props: {
        video,
        relatedVideos,
        user
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        video: null,
        relatedVideos: [],
        user: null
      }
    };
  }
};