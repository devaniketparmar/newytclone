import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import VideoCard from '../components/VideoCard';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import HashtagVideoFeed from '../components/HashtagVideoFeed';
import HashtagFollowButton from '../components/HashtagFollowButton';
import UniversalLayout from '../components/UniversalLayout';
import PageHeader from '../components/PageHeader';

interface Hashtag {
  id: string;
  name: string;
  description?: string;
  videoCount?: number;
  followers?: number;
  isFollowing?: boolean;
  trending?: boolean;
  trendingScore?: number;
  createdAt?: string;
  category?: string;
}

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
  hashtags: string[];
}

type SortOption = 'trending' | 'popular' | 'recent' | 'alphabetical';
type FilterOption = 'all' | 'following' | 'trending' | 'popular';

interface HashtagsPageProps {
  user?: any;
}

export default function HashtagsPage({ user }: HashtagsPageProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScrollingToVideos, setIsScrollingToVideos] = useState(false);

  useEffect(() => {
    fetchHashtags();
    fetchTrendingVideos();
  }, [sortBy, filterBy]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      fetchHashtagSuggestions(searchQuery);
    } else {
      setHashtagSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const fetchHashtags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: 'trending',
        limit: '50'
      });
      
      const response = await fetch(`/api/hashtags?${params}`);
      const data = await response.json();
      
      if (data.success) {
        let hashtagsData = data.data?.hashtags || [];
        
        // Apply sorting
        hashtagsData = sortHashtags(hashtagsData, sortBy);
        
        // Apply filtering
        if (filterBy === 'following') {
          hashtagsData = hashtagsData.filter((h: Hashtag) => h.isFollowing);
        } else if (filterBy === 'trending') {
          hashtagsData = hashtagsData.filter((h: Hashtag) => h.trending);
        }
        
        setHashtags(hashtagsData);
      }
    } catch (error) {
      console.error('Error fetching hashtags:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingVideos = async () => {
    try {
      const response = await fetch('/api/videos?limit=20');
      const data = await response.json();
      setVideos(data.data || []);
    } catch (error) {
      console.error('Error fetching trending videos:', error);
    }
  };

  const fetchHashtagSuggestions = async (query: string) => {
    try {
      const response = await fetch(`/api/hashtags?action=suggestions&query=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setHashtagSuggestions(data.data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching hashtag suggestions:', error);
    }
  };

  const sortHashtags = (hashtags: Hashtag[], sortOption: SortOption): Hashtag[] => {
    switch (sortOption) {
      case 'trending':
        return [...hashtags].sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
      case 'popular':
        return [...hashtags].sort((a, b) => (b.followers || 0) - (a.followers || 0));
      case 'recent':
        return [...hashtags].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      case 'alphabetical':
        return [...hashtags].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return hashtags;
    }
  };

  const handleHashtagClick = (hashtagName: string) => {
    setSelectedHashtag(hashtagName);
    setIsScrollingToVideos(true);
    
    // Scroll to videos section after a short delay to ensure state update
    setTimeout(() => {
      const videosSection = document.getElementById('hashtag-videos-section');
      if (videosSection) {
        videosSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        
        // Reset scrolling state after animation completes
        setTimeout(() => {
          setIsScrollingToVideos(false);
        }, 1000);
      } else {
        setIsScrollingToVideos(false);
      }
    }, 100);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleHashtagClick(searchQuery.trim());
    }
  };

  const handleFollowChange = (hashtagName: string, isFollowing: boolean, newFollowerCount: number) => {
    setHashtags(prev => prev.map(h => 
      h.name === hashtagName 
        ? { ...h, isFollowing, followers: newFollowerCount }
        : h
    ));
  };

  const formatCount = (count: number | undefined | null) => {
    if (count === undefined || count === null || isNaN(count)) {
      return '0';
    }
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getTrendingBadge = (hashtag: Hashtag) => {
    if (!hashtag.trending) return null;
    
    const score = hashtag.trendingScore || 0;
    let badgeText = 'Trending';
    let badgeColor = 'bg-red-100 text-red-600';
    
    if (score > 80) {
      badgeText = '🔥 Hot';
      badgeColor = 'bg-orange-100 text-orange-600';
    } else if (score > 60) {
      badgeText = '📈 Rising';
      badgeColor = 'bg-blue-100 text-blue-600';
    }
    
    return (
      <span className={`${badgeColor} text-xs px-2 py-1 rounded-full font-medium`}>
        {badgeText}
      </span>
    );
  };

  return (
    <UniversalLayout 
      user={user}
      pageHeader={
        <PageHeader
          title="Hashtags"
          subtitle="Explore trending hashtags and discover new content"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          }
          iconColor="bg-blue-600"
        />
      }
    >
      <div className="min-h-screen bg-neutral-50">

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search hashtags..."
                    className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </form>

                {/* Search Suggestions */}
                {showSuggestions && hashtagSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {hashtagSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSuggestions(false);
                          handleHashtagClick(suggestion);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
                      >
                        <span className="text-blue-600 font-medium">#{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters and Sort */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-neutral-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="trending">Trending</option>
                    <option value="popular">Popular</option>
                    <option value="recent">Recent</option>
                    <option value="alphabetical">A-Z</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-neutral-700">Filter:</label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Hashtags</option>
                    <option value="following">Following</option>
                    <option value="trending">Trending Only</option>
                    <option value="popular">Popular Only</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 ml-auto">
                  <span className="text-sm text-neutral-600">
                    {hashtags.length} hashtags found
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hashtags Grid */}
          <div id="hashtags-grid-section" className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">
                {filterBy === 'following' ? 'Following' : 
                 filterBy === 'trending' ? 'Trending Hashtags' :
                 filterBy === 'popular' ? 'Popular Hashtags' : 'All Hashtags'}
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-neutral-600">Live updates</span>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <LoadingPlaceholder key={index} />
                ))}
              </div>
            ) : hashtags.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {hashtags.map((hashtag) => (
                  <div
                    key={hashtag.id}
                    className="bg-white rounded-xl p-6 border border-neutral-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-blue-600 font-bold text-xl group-hover:text-blue-700 transition-colors">
                          #{hashtag.name}
                        </h3>
                        {hashtag.description && (
                          <p className="text-neutral-600 text-sm mt-1 line-clamp-2">
                            {hashtag.description}
                          </p>
                        )}
                      </div>
                      {getTrendingBadge(hashtag)}
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Videos</span>
                        <span className="font-semibold text-neutral-900">
                          {formatCount(hashtag.videoCount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Followers</span>
                        <span className="font-semibold text-neutral-900">
                          {formatCount(hashtag.followers)}
                        </span>
                      </div>
                      {hashtag.trendingScore && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-500">Trend Score</span>
                          <span className="font-semibold text-orange-600">
                            {Math.round(hashtag.trendingScore)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleHashtagClick(hashtag.name)}
                        disabled={isScrollingToVideos}
                        className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                          isScrollingToVideos 
                            ? 'bg-blue-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isScrollingToVideos ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>View Videos</span>
                          </>
                        )}
                      </button>
                      <HashtagFollowButton
                        hashtag={hashtag.name}
                        initialFollowStatus={hashtag.isFollowing}
                        followerCount={hashtag.followers}
                        onFollowChange={(isFollowing, newFollowerCount) => 
                          handleFollowChange(hashtag.name, isFollowing, newFollowerCount)
                        }
                        size="sm"
                        showFollowerCount={false}
                      />
                    </div>
                  </div>
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
                  No hashtags found
                </h3>
                <p className="text-neutral-600">
                  {filterBy === 'following' 
                    ? "You're not following any hashtags yet. Start following hashtags to see them here!"
                    : "Try adjusting your search or filters to find hashtags."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Videos Section */}
          {selectedHashtag ? (
            <div 
              id="hashtag-videos-section" 
              className={`mb-8 transition-all duration-500 ${
                isScrollingToVideos ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">
                        Videos tagged with #{selectedHashtag}
                      </h2>
                      <p className="text-neutral-600 text-sm">
                        Discover videos using this hashtag
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedHashtag(null);
                      // Scroll back to top of hashtags section
                      setTimeout(() => {
                        const hashtagsSection = document.getElementById('hashtags-grid-section');
                        if (hashtagsSection) {
                          hashtagsSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start',
                            inline: 'nearest'
                          });
                        }
                      }, 100);
                    }}
                    className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <HashtagVideoFeed hashtag={selectedHashtag} maxVideos={10} />
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">
                        Trending Videos
                      </h2>
                      <p className="text-neutral-600 text-sm">
                        Popular videos across all hashtags
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-neutral-600">Live</span>
                  </div>
                </div>
                
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
            </div>
          )}

          {/* Hashtag Analytics Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Hashtag Insights
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Total Hashtags</p>
                      <p className="text-2xl font-bold text-blue-600">{hashtags.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Trending Now</p>
                      <p className="text-2xl font-bold text-green-600">
                        {hashtags.filter(h => h.trending).length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Following</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {hashtags.filter(h => h.isFollowing).length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Check if user is authenticated
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

    // Fetch user data to pass to the component
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : `${protocol}://${host}`;

    let user = null;
    try {
      const userResponse = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Cookie': `token=${token}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        user = userData.data;
      }
    } catch (error) {
      console.log('Could not fetch user data:', error);
    }

    return {
      props: {
        user
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    };
  }
};
