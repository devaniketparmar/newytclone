import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import SearchHeader from '@/components/SearchHeader';
import UniversalLayout from '@/components/UniversalLayout';
import CategoryBar from '@/components/CategoryBar';

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

  // Ensure user is defined
  const currentUser = user || null;

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setLoading(true);

    try {
      // Make API call with category filter
      const params = new URLSearchParams();
      if (categoryId !== 'all') {
        params.append('category', categoryId);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/videos?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredVideos(data.data || []);
      } else {
        // Fallback to client-side filtering if API fails
        const clientFiltered = (videos || []).filter(video => {
          const matchesSearch = searchQuery === '' ||
            video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.channel.name.toLowerCase().includes(searchQuery.toLowerCase());

          const videoCategory = getVideoCategory(video);
          const matchesCategory = categoryId === 'all' || videoCategory === categoryId;

          return matchesSearch && matchesCategory;
        });
        setFilteredVideos(clientFiltered);
      }
    } catch (error) {
      console.error('Error fetching videos by category:', error);
      // Fallback to client-side filtering
      const clientFiltered = (videos || []).filter(video => {
        const matchesSearch = searchQuery === '' ||
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.channel.name.toLowerCase().includes(searchQuery.toLowerCase());

        const videoCategory = getVideoCategory(video);
        const matchesCategory = categoryId === 'all' || videoCategory === categoryId;

        return matchesSearch && matchesCategory;
      });
      setFilteredVideos(clientFiltered);
    } finally {
      setLoading(false);
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
    setLoading(true);

    try {
      // Make API call with search and category filters
      const params = new URLSearchParams();
      if (query) {
        params.append('search', query);
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/videos?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredVideos(data.data || []);
      } else {
        // Fallback to client-side filtering
        const clientFiltered = (videos || []).filter(video => {
          const matchesSearch = query === '' ||
            video.title.toLowerCase().includes(query.toLowerCase()) ||
            video.description.toLowerCase().includes(query.toLowerCase()) ||
            video.channel.name.toLowerCase().includes(query.toLowerCase());

          const videoCategory = getVideoCategory(video);
          const matchesCategory = selectedCategory === 'all' || videoCategory === selectedCategory;

          return matchesSearch && matchesCategory;
        });
        setFilteredVideos(clientFiltered);
      }
    } catch (error) {
      console.error('Error searching videos:', error);
      // Fallback to client-side filtering
      const clientFiltered = (videos || []).filter(video => {
        const matchesSearch = query === '' ||
          video.title.toLowerCase().includes(query.toLowerCase()) ||
          video.description.toLowerCase().includes(query.toLowerCase()) ||
          video.channel.name.toLowerCase().includes(query.toLowerCase());

        const videoCategory = getVideoCategory(video);
        const matchesCategory = selectedCategory === 'all' || videoCategory === selectedCategory;

        return matchesSearch && matchesCategory;
      });
      setFilteredVideos(clientFiltered);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading videos...</p>
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
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' 
            : 'space-y-4'
          }>
            {filteredVideos.map((video) => (
              <div 
                key={video.id} 
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden border border-neutral-100"
                onClick={() => router.push(`/video/${video.id}`)}
              >
                <div className="relative aspect-video bg-neutral-200 overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl.startsWith('/uploads/') ? `/api/uploads/${video.thumbnailUrl.replace('/uploads/', '')}` : video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
                      <div className="text-center text-white">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <p className="text-sm font-medium">Processing...</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                  </div>
                  
                  {video.status === 'PROCESSING' && (
                    <div className="absolute top-2 left-2 bg-warning-500 text-white text-xs px-2 py-1 rounded">
                      Processing
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight">
                    {video.title}
                  </h3>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 bg-neutral-200 rounded-full flex-shrink-0 overflow-hidden">
                      <img
                        src={video.channel.avatarUrl || '/api/placeholder/36/36'}
                        alt={video.channel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {video.channel.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-neutral-500 mt-1">
                        <span>{formatViewCount(video.viewCount)} views</span>
                        <span>•</span>
                        <span>{formatTimeAgo(video.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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