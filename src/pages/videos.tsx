import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import SearchHeader from '@/components/SearchHeader';
import UniversalLayout from '@/components/UniversalLayout';
import CategoryBar from '@/components/CategoryBar';
import LoadingPlaceholder from '@/components/LoadingPlaceholder';
import VideoCard from '@/components/VideoCard';

import { api } from '../lib/axios';
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
  category?: string;
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    userId: string;
  };
}

interface VideosPageProps {
  videos: Video[];
  user?: any;
}

export default function VideosPage({ videos, user }: VideosPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredVideos, setFilteredVideos] = useState(videos || []);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Ensure user is defined
  const currentUser = user || null;

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when changing category
    setFilteredVideos([]); // Clear existing videos
    await fetchVideos(categoryId, searchQuery, 1, true); // Reset = true
  };

  const fetchVideos = async (category: string = selectedCategory, search: string = searchQuery, page: number = currentPage, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Make API call with pagination
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10'); // 10 videos per page
      
      if (category !== 'all') {
        params.append('category', category);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await api.get(`/api/videos?${params.toString()}`);
      console.log('API Response:', response); // Debug log
      
      // Check if response exists and has the expected structure
      if (response && response.status === 200 && response.data && response.data.success) {
        const data = response.data;
        const newVideos = data.data || [];
        
        if (reset) {
          setFilteredVideos(newVideos);
        } else {
          setFilteredVideos(prev => [...prev, ...newVideos]);
        }
        
        // Check if there are more videos
        setHasMoreVideos(newVideos.length === 10);
      } else {
        console.warn('API response does not have expected structure:', response);
        // Fallback to client-side filtering if API fails
        const clientFiltered = (videos || []).filter(video => {
          const matchesSearch = search === '' ||
            video.title.toLowerCase().includes(search.toLowerCase()) ||
            video.description.toLowerCase().includes(search.toLowerCase()) ||
            video.channel.name.toLowerCase().includes(search.toLowerCase());

          const videoCategory = getVideoCategory(video);
          const matchesCategory = category === 'all' || videoCategory === category;

          return matchesSearch && matchesCategory;
        });
        
        // Client-side pagination
        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        const paginatedVideos = clientFiltered.slice(startIndex, endIndex);
        
        if (reset) {
          setFilteredVideos(paginatedVideos);
        } else {
          setFilteredVideos(prev => [...prev, ...paginatedVideos]);
        }
        
        setHasMoreVideos(endIndex < clientFiltered.length);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Fallback to client-side filtering
      const clientFiltered = (videos || []).filter(video => {
        const matchesSearch = search === '' ||
          video.title.toLowerCase().includes(search.toLowerCase()) ||
          video.description.toLowerCase().includes(search.toLowerCase()) ||
          video.channel.name.toLowerCase().includes(search.toLowerCase());

        const videoCategory = getVideoCategory(video);
        const matchesCategory = category === 'all' || videoCategory === category;

        return matchesSearch && matchesCategory;
      });
      
      // Client-side pagination
      const startIndex = (page - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedVideos = clientFiltered.slice(startIndex, endIndex);
      
      if (reset) {
        setFilteredVideos(paginatedVideos);
      } else {
        setFilteredVideos(prev => [...prev, ...paginatedVideos]);
      }
      
      setHasMoreVideos(endIndex < clientFiltered.length);
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Helper function to determine video category based on title/description
  const getVideoCategory = (video: Video): string => {
    if (video.category) {
      return video.category;
    }

    // Auto-categorize based on title and description keywords
    const text = `${video.title} ${video.description}`.toLowerCase();

    if (text.includes('music') || text.includes('song') || text.includes('audio')) return 'music';
    if (text.includes('game') || text.includes('gaming') || text.includes('play')) return 'gaming';
    if (text.includes('news') || text.includes('breaking') || text.includes('update')) return 'news';
    if (text.includes('sport') || text.includes('football') || text.includes('basketball')) return 'sports';
    if (text.includes('learn') || text.includes('tutorial') || text.includes('course')) return 'education';
    if (text.includes('funny') || text.includes('comedy') || text.includes('joke')) return 'comedy';
    if (text.includes('tech') || text.includes('programming') || text.includes('code')) return 'technology';
    if (text.includes('cook') || text.includes('recipe') || text.includes('food')) return 'cooking';
    if (text.includes('travel') || text.includes('trip') || text.includes('vacation')) return 'travel';
    if (text.includes('fitness') || text.includes('workout') || text.includes('exercise')) return 'fitness';
    if (text.includes('art') || text.includes('draw') || text.includes('paint')) return 'art';
    if (text.includes('science') || text.includes('research') || text.includes('experiment')) return 'science';
    if (text.includes('business') || text.includes('finance') || text.includes('money')) return 'business';

    return 'entertainment'; // Default category
  };

  const formatViewCount = (count: number | undefined | null) => {
    if (!count || count === 0) {
      return '0';
    }
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
    setFilteredVideos([]); // Clear existing videos
    await fetchVideos(selectedCategory, query, 1, true); // Reset = true
  };

  const loadMore = async () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchVideos(selectedCategory, searchQuery, nextPage, false); // Reset = false
  };

  // Load videos on component mount
  React.useEffect(() => {
    fetchVideos(selectedCategory, searchQuery, 1, true); // Reset = true
  }, []);

  return (
    <UniversalLayout 
      user={currentUser}
      showHeader={true}
      headerContent={
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewToggle={true}
        />
      }
    >
      <CategoryBar 
        onCategorySelect={handleCategorySelect}
        defaultCategory={selectedCategory}
      />
      
      <div className="p-6">
        {loading && (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
            : 'space-y-4'
          }>
            {Array.from({ length: 10 }).map((_, index) => (
              <LoadingPlaceholder key={index} type="video-card" />
            ))}
          </div>
        )}
        
        {!loading && filteredVideos.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {(videos || []).length === 0 ? 'No videos yet' : 'No videos found'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {(videos || []).length === 0 ? 'Be the first to upload a video!' : 'Try adjusting your search terms or category'}
            </p>
            {currentUser && (
              <button 
                onClick={() => router.push('/upload')}
                className="professional-button professional-button-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Upload Video
              </button>
            )}
          </div>
        )}
        
        {!loading && filteredVideos.length > 0 && (
          <>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
              : 'space-y-4'
            }>
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  user={currentUser}
                  layout={viewMode}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMoreVideos && !loading && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loadingMore ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Load More Videos</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Loading more videos...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Fetch videos from the API
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-domain.com'
      : `${protocol}://${host}`;

    const videosResponse = await fetch(`${baseUrl}/api/videos`);
    let videos = [];

    if (videosResponse.ok) {
      const videosData = await videosResponse.json();
      videos = videosData.data || [];
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
        videos,
        user
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        videos: [],
        user: null
      }
    };
  }
};