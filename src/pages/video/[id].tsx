import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import UniversalLayout from '@/components/UniversalLayout';
import VideoPlayer from '@/components/VideoPlayer';
import VideoCard from '@/components/VideoCard';
import Comments from '@/components/Comments';

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
  const [isDisliked, setIsDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [dislikeCount, setDislikeCount] = useState(video.dislikeCount);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(video.channel.subscriberCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load user's like and subscription status
    if (user) {
      loadUserInteractionStatus();
    }
  }, [user, video.id]);

  const loadUserInteractionStatus = async () => {
    try {
      // Load like/dislike status
      const likeResponse = await fetch(`/api/videos/${video.id}/like`, {
        credentials: 'include'
      });

      if (likeResponse.ok) {
        const likeData = await likeResponse.json();
        if (likeData.success) {
          setIsLiked(likeData.data.liked);
          setIsDisliked(likeData.data.disliked);
          setLikeCount(likeData.data.likeCount);
          setDislikeCount(likeData.data.dislikeCount);
        }
      }

      // Load subscription status
      const subResponse = await fetch(`/api/channels/${video.channel.id}/subscribe`, {
        credentials: 'include'
      });

      if (subResponse.ok) {
        const subData = await subResponse.json();
        if (subData.success) {
          setIsSubscribed(subData.data.subscribed);
          setSubscriberCount(subData.data.subscriberCount);
        }
      }
    } catch (error) {
      console.error('Error loading user interaction status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${video.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type: 'like' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsLiked(data.data.liked);
          setIsDisliked(data.data.disliked);
          setLikeCount(data.data.likeCount);
          setDislikeCount(data.data.dislikeCount);
        }
      }
    } catch (error) {
      console.error('Error liking video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${video.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type: 'dislike' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsLiked(data.data.liked);
          setIsDisliked(data.data.disliked);
          setLikeCount(data.data.likeCount);
          setDislikeCount(data.data.dislikeCount);
        }
      }
    } catch (error) {
      console.error('Error disliking video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    try {
      const method = isSubscribed ? 'DELETE' : 'POST';
      const response = await fetch(`/api/channels/${video.channel.id}/subscribe`, {
        method,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsSubscribed(data.data.subscribed);
          setSubscriberCount(data.data.subscriberCount);
        }
      }
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <div className="bg-black rounded-xl overflow-hidden mb-6 shadow-2xl">
              <VideoPlayer
                videoUrl={video.videoUrl}
                thumbnailUrl={video.thumbnailUrl}
                title={video.title}
                className="w-full"
              />
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-neutral-200">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{video.title}</h1>
              
              {/* Video Stats */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6 text-sm text-gray-700">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{formatViewCount(video.viewCount)} views</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatTimeAgo(video.publishedAt)}</span>
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={handleLike}
                      disabled={loading}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-l-full transition-all duration-200 ${
                        isLiked 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span className="font-medium">{formatViewCount(likeCount)}</span>
                    </button>
                    
                    <button 
                      onClick={handleDislike}
                      disabled={loading}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-r-full border-l border-neutral-300 transition-all duration-200 ${
                        isDisliked 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg className="w-5 h-5" fill={isDisliked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                    </button>
                  </div>
                  
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-all duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span className="font-medium">Share</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-all duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span className="font-medium">Save</span>
                  </button>
                </div>
              </div>

              {/* Channel Info */}
              <div className="flex items-center justify-between py-4 border-t border-neutral-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {video.channel.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{video.channel.name}</h3>
                    <p className="text-sm text-gray-700">{formatViewCount(subscriberCount)} subscribers</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleSubscribe}
                  disabled={loading}
                  className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                    isSubscribed 
                      ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Description */}
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Description</h4>
                  <button className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                    Show more
                  </button>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{video.description}</p>
              </div>

              {/* Comments Section */}
              <Comments 
                videoId={video.id}
                user={user}
                commentCount={video.commentCount}
                videoOwnerId={video.channel.userId}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Related Videos</span>
                </h3>
                <div className="space-y-4">
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