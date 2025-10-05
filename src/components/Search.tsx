import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface SearchResult {
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
  status: string;
  channel: {
    id: string;
    name: string;
    avatarUrl?: string;
    subscriberCount: number;
    userId: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

interface SearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export default function Search({ onSearch, placeholder = "Search", showFilters = true, compact = false }: SearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{type: string, text: string}>>([]);
  const [filters, setFilters] = useState({
    category: 'all',
    duration: 'all',
    uploadDate: 'all',
    sort: 'relevance'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: '1', label: 'Entertainment' },
    { value: '2', label: 'Gaming' },
    { value: '3', label: 'Music' },
    { value: '4', label: 'Education' },
    { value: '5', label: 'News & Politics' },
    { value: '6', label: 'How-to & Style' },
    { value: '7', label: 'Science & Technology' },
    { value: '8', label: 'Sports' },
    { value: '9', label: 'Travel & Events' },
    { value: '10', label: 'Autos & Vehicles' },
    { value: '11', label: 'Comedy' },
    { value: '12', label: 'Film & Animation' },
    { value: '13', label: 'People & Blogs' },
    { value: '14', label: 'Pets & Animals' },
    { value: '15', label: 'Nonprofits & Activism' }
  ];

  const durationOptions = [
    { value: 'all', label: 'Any Duration' },
    { value: '1', label: 'Under 4 minutes' },
    { value: '2', label: '4-20 minutes' },
    { value: '3', label: 'Over 20 minutes' }
  ];

  const uploadDateOptions = [
    { value: 'all', label: 'Any Time' },
    { value: 'hour', label: 'Last Hour' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Upload Date' },
    { value: 'rating', label: 'Rating' },
    { value: 'viewCount', label: 'View Count' },
    { value: 'duration', label: 'Duration' }
  ];

  // Perform search
  const performSearch = async (searchQuery: string, pageNum: number = 1, reset: boolean = true) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: pageNum.toString(),
        limit: '20',
        ...filters
      });

      const response = await fetch(`/api/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          if (reset) {
            setResults(data.data.videos);
          } else {
            setResults(prev => [...prev, ...data.data.videos]);
          }
          setHasMore(data.data.pagination.page < data.data.pagination.pages);
          setSuggestions(data.data.suggestions || []);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setPage(1);
      performSearch(query, 1, true);
      setShowResults(true);
      if (onSearch) {
        onSearch(query);
      }
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      // Show suggestions as user types
      performSearch(value, 1, true);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: {type: string, text: string}) => {
    setQuery(suggestion.text);
    setPage(1);
    performSearch(suggestion.text, 1, true);
    setShowResults(true);
    if (onSearch) {
      onSearch(suggestion.text);
    }
  };

  // Handle filter change
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    if (query.trim()) {
      setPage(1);
      performSearch(query, 1, true);
    }
  };

  // Load more results
  const loadMore = () => {
    if (hasMore && !loading && query.trim()) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(query, nextPage, false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format view count
  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className={`w-full ${compact ? 'max-w-xl' : 'max-w-4xl'} mx-auto`} ref={searchRef}>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 ${compact ? 'pl-3' : 'pl-4'} flex items-center pointer-events-none`}>
            <svg className={`h-4 w-4 ${compact ? 'text-neutral-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`w-full pl-${compact ? '10' : '12'} pr-4 ${compact ? 'py-2 text-sm' : 'py-3'} border border-neutral-300 rounded-l-full rounded-r-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900`}
          />
          <button
            type="submit"
            className={`absolute right-0 top-0 bottom-0 ${compact ? 'px-4' : 'px-6'} bg-neutral-100 border border-l-0 border-neutral-300 rounded-r-full hover:bg-neutral-200 transition-colors`}
          >
            <svg className={`w-4 h-4 ${compact ? 'text-gray-700' : 'text-gray-800'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-800">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-700">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="border-b border-neutral-200 p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggestions</h4>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <span className="font-medium">{suggestion.text}</span>
                        <span className="ml-2 text-xs text-gray-600">
                          {suggestion.type === 'video' ? 'Video' : 'Channel'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              <div className="p-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Search Results ({results.length})
                </h4>
                <div className="space-y-3">
                  {results.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => router.push(`/video/${video.id}`)}
                      className="flex space-x-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      <div className="relative w-32 h-20 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {video.title}
                        </h5>
                        <p className="text-xs text-gray-700 mb-1">
                          {video.channel.name} • {formatViewCount(video.viewCount)} views • {formatTimeAgo(video.publishedAt)}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {video.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-3 pt-3 border-t border-neutral-200">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Search Filters */}
      {showFilters && showResults && (
        <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Duration</label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
              >
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Upload Date</label>
              <select
                value={filters.uploadDate}
                onChange={(e) => handleFilterChange('uploadDate', e.target.value)}
                className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
              >
                {uploadDateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
