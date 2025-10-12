import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import UniversalLayout from '../components/UniversalLayout';
import VideoCard from '../components/VideoCard';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import { JWTUtils } from '../utils/auth';
import { prisma } from '../lib/prisma';

interface LikedVideo {
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
  likedAt: string;
}

interface LikedVideosPageProps {
  user: any;
  initialVideos: LikedVideo[];
  totalCount: number;
}

export default function LikedVideosPage({ user, initialVideos, totalCount }: LikedVideosPageProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<LikedVideo[]>(initialVideos);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialVideos.length < totalCount);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'popular'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  const loadMoreVideos = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/liked-videos?page=${page + 1}&sort=${sortBy}&filter=${filterBy}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(prev => [...prev, ...data.videos]);
        setPage(prev => prev + 1);
        setHasMore(data.videos.length === 20); // Assuming 20 videos per page
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = async (newSort: 'recent' | 'oldest' | 'popular') => {
    setSortBy(newSort);
    setPage(1);
    setLoading(true);

    try {
      const response = await fetch(`/api/liked-videos?page=1&sort=${newSort}&filter=${filterBy}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos);
        setHasMore(data.videos.length === 20);
      }
    } catch (error) {
      console.error('Error sorting videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (newFilter: 'all' | 'today' | 'week' | 'month' | 'year') => {
    setFilterBy(newFilter);
    setPage(1);
    setLoading(true);

    try {
      const response = await fetch(`/api/liked-videos?page=1&sort=${sortBy}&filter=${newFilter}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos);
        setHasMore(data.videos.length === 20);
      }
    } catch (error) {
      console.error('Error filtering videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUnliked = (videoId: string) => {
    setVideos(prev => prev.filter(video => video.id !== videoId));
  };

  if (!user) {
    return (
      <UniversalLayout user={null}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
            <p className="text-gray-600 mb-6">You need to be signed in to view your liked videos.</p>
            <button
              onClick={() => router.push('/auth')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </UniversalLayout>
    );
  }

  return (
    <UniversalLayout user={user}>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Liked Videos</h1>
                <p className="text-gray-600 mt-1">
                  {totalCount} {totalCount === 1 ? 'video' : 'videos'} liked
                </p>
              </div>
              
              {/* Sort and Filter Controls */}
              <div className="flex items-center space-x-4">
                {/* Filter Dropdown */}
                <div className="relative">
                  <select
                    value={filterBy}
                    onChange={(e) => handleFilterChange(e.target.value as any)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                    <option value="year">This year</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as any)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="recent">Most recent</option>
                    <option value="oldest">Oldest first</option>
                    <option value="popular">Most popular</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No liked videos yet</h2>
              <p className="text-gray-600 mb-6">
                Videos you like will appear here. Start exploring and like some videos!
              </p>
              <button
                onClick={() => router.push('/videos')}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Explore Videos
              </button>
            </div>
          ) : (
            <>
              {/* Video Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    user={user}
                    layout="grid"
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMoreVideos}
                    disabled={loading}
                    className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const token = context.req.cookies.token;
    if (!token) {
      return {
        redirect: {
          destination: '/auth',
          permanent: false,
        },
      };
    }

    const decoded = JWTUtils.verifyToken(token);
    if (!decoded) {
      return {
        redirect: {
          destination: '/auth',
          permanent: false,
        },
      };
    }

    const userId = decoded.userId;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return {
        redirect: {
          destination: '/auth',
          permanent: false,
        },
      };
    }

    // Get liked videos
    const page = parseInt(context.query.page as string) || 1;
    const sort = (context.query.sort as string) || 'recent';
    const filter = (context.query.filter as string) || 'all';
    const limit = 20;
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    let dateFilter = {};
    if (filter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (filter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      dateFilter = {
        createdAt: {
          gte: startDate,
        },
      };
    }

    // Build order by clause
    let orderBy = {};
    switch (sort) {
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = { video: { viewCount: 'desc' } };
        break;
    }

    // Get liked videos with video details
    const likedVideos = await prisma.like.findMany({
      where: {
        userId,
        videoId: { not: null },
        type: 'LIKE',
        ...dateFilter,
      },
      include: {
        video: {
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                subscriberCount: true,
                userId: true,
              },
            },
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.like.count({
      where: {
        userId,
        videoId: { not: null },
        type: 'LIKE',
        ...dateFilter,
      },
    });

    // Transform the data
    const videos: LikedVideo[] = likedVideos
      .filter(like => like.video) // Filter out any null videos
      .map(like => ({
        id: like.video!.id,
        title: like.video!.title,
        description: like.video!.description || '',
        thumbnailUrl: like.video!.thumbnailUrl,
        videoUrl: like.video!.videoUrl,
        duration: like.video!.duration,
        viewCount: Number(like.video!.viewCount),
        likeCount: like.video!.likeCount,
        commentCount: like.video!.commentCount,
        createdAt: like.video!.createdAt.toISOString(),
        publishedAt: like.video!.publishedAt?.toISOString() || like.video!.createdAt.toISOString(),
        status: like.video!.status,
        channel: like.video!.channel,
        likedAt: like.createdAt.toISOString(),
      }));

    return {
      props: {
        user,
        initialVideos: videos,
        totalCount,
      },
    };
  } catch (error) {
    console.error('Error in liked videos page:', error);
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    };
  }
};
