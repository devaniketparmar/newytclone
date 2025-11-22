import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import UniversalLayout from '../components/UniversalLayout';
import PageHeader from '../components/PageHeader';
import VerticalShortsFeed from '../components/VerticalShortsFeed';
import ShortsDiscovery from '../components/ShortsDiscovery';

interface ShortsVideo {
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
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    verified: boolean;
  };
  hashtags?: string[];
}

interface ShortsPageProps {
  user: any;
  initialVideos: ShortsVideo[];
}

export default function ShortsPage({ user, initialVideos }: ShortsPageProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<ShortsVideo[]>(initialVideos);
  const [currentVideo, setCurrentVideo] = useState<ShortsVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'discovery' | 'feed'>('discovery');

  useEffect(() => {
    if (initialVideos.length > 0) {
      setCurrentVideo(initialVideos[0]);
    }
  }, [initialVideos]);

  const handleVideoChange = (video: ShortsVideo) => {
    setCurrentVideo(video);
  };

  const handleCreateShort = () => {
    router.push('/shorts/create');
  };

  const handleAnalytics = () => {
    router.push('/shorts/analytics');
  };

  if (activeTab === 'discovery') {
    return <ShortsDiscovery user={user} />;
  }

  return (
    <UniversalLayout 
      user={user}
      pageHeader={
        <PageHeader
          title="Shorts"
          subtitle="Discover and create short-form vertical videos"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          iconColor="bg-gradient-to-r from-purple-500 to-pink-500"
          actions={
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('discovery')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'discovery'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Discovery
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'feed'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Feed
              </button>
              <button
                onClick={handleCreateShort}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Create Short
              </button>
              <button
                onClick={handleAnalytics}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          }
        />
      }
    >
      <div className="min-h-screen bg-black">
        {videos.length > 0 ? (
          <VerticalShortsFeed
            user={user}
            initialVideos={videos}
            onVideoChange={handleVideoChange}
            autoPlay={true}
            showControls={false}
          />
        ) : (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">Welcome to Shorts</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create and discover short-form vertical videos that are perfect for mobile viewing
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleCreateShort}
                  className="block w-full max-w-xs mx-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Create Your First Short
                </button>
                <button
                  onClick={() => setActiveTab('discovery')}
                  className="block w-full max-w-xs mx-auto px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Discover Shorts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Check authentication
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/me`, {
      headers: {
        cookie: context.req.headers.cookie || ''
      }
    });

    if (!response.ok) {
      return {
        redirect: {
          destination: '/auth',
          permanent: false
        }
      };
    }

    const userData = await response.json();
    const user = userData.data;

    // Fetch initial Shorts videos
    const shortsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/shorts?page=1&limit=10`, {
      headers: {
        cookie: context.req.headers.cookie || ''
      }
    });

    let initialVideos: ShortsVideo[] = [];
    if (shortsResponse.ok) {
      const shortsData = await shortsResponse.json();
      initialVideos = shortsData.data || [];
    }

    return {
      props: {
        user,
        initialVideos
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/auth',
        permanent: false
      }
    };
  }
};