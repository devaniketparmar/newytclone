import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import UniversalLayout from '../../components/UniversalLayout';
import VideoCard from '../../components/VideoCard';
import LoadingPlaceholder from '../../components/LoadingPlaceholder';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
  };
  category?: {
    id: string;
    name: string;
  };
}

interface CategoryPageProps {
  user?: any;
}

export default function CategoryPage({ user }: CategoryPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  const categoryMap: { [key: string]: string } = {
    gaming: 'Gaming',
    music: 'Music',
    education: 'Education',
    news: 'News',
    sports: 'Sports',
    technology: 'Technology',
    entertainment: 'Entertainment',
    science: 'Science',
    comedy: 'Comedy',
    travel: 'Travel',
    food: 'Food'
  };

  useEffect(() => {
    if (id) {
      setCategoryName(categoryMap[id as string] || id as string);
      fetchVideos();
    }
  }, [id]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/videos?category=${id}&limit=20`);
      const data = await response.json();
      setVideos(data.data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalLayout user={user}>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-colors duration-200"
                >
                  <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900">
                    {categoryName}
                  </h1>
                  <p className="text-neutral-600">
                    Explore {categoryName.toLowerCase()} videos and discover new content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <LoadingPlaceholder key={index} />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  {categoryName} Videos
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={{
                    ...video,
                    views: video.viewCount,
                    likes: video.likeCount,
                    channel: {
                      ...video.channel,
                      subscribers: video.channel.subscriberCount
                    }
                  }} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No {categoryName.toLowerCase()} videos found
              </h3>
              <p className="text-neutral-600">
                There are no videos available in this category at the moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Try to get user data from cookies
    let user = null;
    const token = context.req.cookies.token;

    if (token) {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/me`, {
          headers: {
            'Cookie': `token=${token}`,
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            user = data.data.user;
          }
        }
      } catch (error) {
        console.log('User authentication failed:', error);
      }
    }

    return {
      props: {
        user
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        user: null
      }
    };
  }
};
