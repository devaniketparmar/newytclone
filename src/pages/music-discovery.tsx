import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import VideoCard from '../components/VideoCard';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import UniversalLayout from '../components/UniversalLayout';
import PageHeader from '../components/PageHeader';

interface MusicVideo {
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
  artist: string;
  genre: string;
  album: string;
  year: number;
  mood: string;
  decade: number;
}

interface Genre {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface Artist {
  id: string;
  name: string;
  avatarUrl?: string;
  subscriberCount: number;
  videoCount: number;
  createdAt: string;
  isVerified: boolean;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  trackCount: number;
  duration: number;
  genre: string;
}

type SortOption = 'trending' | 'newest' | 'oldest' | 'popular' | 'liked' | 'duration';
type ViewMode = 'discover' | 'trending' | 'artists' | 'albums' | 'recommendations';

interface MusicDiscoveryPageProps {
  user?: any;
}

const moods = [
  { id: 'happy', name: 'Happy', color: 'bg-yellow-400', icon: '😊' },
  { id: 'sad', name: 'Sad', color: 'bg-blue-400', icon: '😢' },
  { id: 'chill', name: 'Chill', color: 'bg-green-400', icon: '😌' },
  { id: 'party', name: 'Party', color: 'bg-purple-400', icon: '🎉' },
  { id: 'romantic', name: 'Romantic', color: 'bg-pink-400', icon: '💕' },
  { id: 'intense', name: 'Intense', color: 'bg-red-400', icon: '🔥' }
];

const decades = [
  { id: '2020', name: '2020s', color: 'bg-indigo-500' },
  { id: '2010', name: '2010s', color: 'bg-purple-500' },
  { id: '2000', name: '2000s', color: 'bg-blue-500' },
  { id: '1990', name: '1990s', color: 'bg-green-500' },
  { id: '1980', name: '1980s', color: 'bg-yellow-500' },
  { id: '1970', name: '1970s', color: 'bg-orange-500' }
];

export default function MusicDiscoveryPage({ user }: MusicDiscoveryPageProps) {
  const router = useRouter();
  const [musicVideos, setMusicVideos] = useState<MusicVideo[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewMode>('discover');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedDecade, setSelectedDecade] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);

  useEffect(() => {
    fetchGenres();
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchMusicVideos();
    } else if (activeTab === 'artists') {
      fetchArtists();
    } else if (activeTab === 'albums') {
      fetchAlbums();
    } else if (activeTab === 'recommendations') {
      fetchRecommendations();
    }
  }, [activeTab, selectedGenre, selectedMood, selectedDecade, sortBy, searchQuery]);

  useEffect(() => {
    if (activeTab === 'discover' && page > 1) {
      fetchMusicVideos(page, true);
    }
  }, [page]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMusicVideos(),
        fetchArtists(),
        fetchAlbums()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMusicVideos = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.append('action', 'discover');
      params.append('limit', '20');
      params.append('offset', String((pageNum - 1) * 20));
      params.append('sort', sortBy);
      
      if (selectedGenre) params.append('genre', selectedGenre);
      if (selectedMood) params.append('mood', selectedMood);
      if (selectedDecade) params.append('decade', selectedDecade);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/music?${params}`);
      const data = await response.json();

      if (data.success) {
        const videosData = data.data?.videos || [];
        
        if (append) {
          setMusicVideos(prev => [...prev, ...videosData]);
        } else {
          setMusicVideos(videosData);
        }

        if (data.data?.pagination) {
          setHasMore(data.data.pagination.hasMore || false);
          setTotalVideos(data.data.pagination.total || videosData.length);
        } else {
          setHasMore(false);
          setTotalVideos(videosData.length);
        }
        
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching music videos:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/music?action=genres');
      const data = await response.json();
      
      if (data.success) {
        setGenres(data.data?.genres || []);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/music?action=artists&limit=20');
      const data = await response.json();
      
      if (data.success) {
        setArtists(data.data?.artists || []);
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/music?action=albums&limit=20');
      const data = await response.json();
      
      if (data.success) {
        setAlbums(data.data?.albums || []);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/music?action=recommendations&limit=20');
      const data = await response.json();
      
      if (data.success) {
        setMusicVideos(data.data?.videos || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && activeTab === 'discover') {
      fetchMusicVideos(page + 1, true);
    }
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/video/${videoId}`);
  };

  const handleArtistClick = (artistId: string) => {
    router.push(`/channel/${artistId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('discover');
      setPage(1);
      fetchMusicVideos();
    }
  };

  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedMood('');
    setSelectedDecade('');
    setSearchQuery('');
    setPage(1);
    fetchMusicVideos();
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <UniversalLayout 
      user={user}
      pageHeader={
        <PageHeader
          title="Music Discovery"
          subtitle="Find new music, artists, and discover your next favorite song"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          }
          iconColor="bg-gradient-to-r from-purple-500 to-pink-500"
          variant="glass"
        >
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs, artists, albums..."
              className="block w-full pl-12 pr-4 py-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white/50 backdrop-blur-sm"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <svg className="h-5 w-5 text-purple-500 hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>
          
          {/* Tabs */}
          <div className="flex space-x-1 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'discover'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Discover Music
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'trending'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'artists'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Artists
            </button>
            <button
              onClick={() => setActiveTab('albums')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'albums'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Albums
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'recommendations'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              For You
            </button>
          </div>
        </PageHeader>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters for Discover Music */}
          {activeTab === 'discover' && (
            <div className="mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-neutral-200 p-6">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-neutral-700">Genre:</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                    >
                      <option value="">All Genres</option>
                      {genres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-neutral-700">Mood:</label>
                    <select
                      value={selectedMood}
                      onChange={(e) => setSelectedMood(e.target.value)}
                      className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                    >
                      <option value="">All Moods</option>
                      {moods.map((mood) => (
                        <option key={mood.id} value={mood.id}>
                          {mood.icon} {mood.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-neutral-700">Decade:</label>
                    <select
                      value={selectedDecade}
                      onChange={(e) => setSelectedDecade(e.target.value)}
                      className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                    >
                      <option value="">All Decades</option>
                      {decades.map((decade) => (
                        <option key={decade.id} value={decade.id}>
                          {decade.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-neutral-700">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                    >
                      <option value="trending">Trending</option>
                      <option value="newest">Newest</option>
                      <option value="popular">Most Popular</option>
                      <option value="liked">Most Liked</option>
                      <option value="duration">Longest</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 ml-auto">
                    <span className="text-sm text-neutral-600">
                      {totalVideos} songs found
                    </span>
                    {(selectedGenre || selectedMood || selectedDecade || searchQuery) && (
                      <button
                        onClick={clearFilters}
                        className="px-3 py-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Genre Selection for Discover */}
          {activeTab === 'discover' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Browse by Genre
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(selectedGenre === genre.id ? '' : genre.id)}
                    className={`p-4 rounded-xl text-center transition-all duration-200 ${
                      selectedGenre === genre.id
                        ? 'ring-2 ring-purple-500 shadow-lg bg-white'
                        : 'hover:shadow-md bg-white/50 backdrop-blur-sm'
                    }`}
                  >
                    <div className="text-2xl mb-2">{genre.icon}</div>
                    <h3 className="font-medium text-neutral-900 text-sm mb-1">
                      {genre.name}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {genre.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'discover' || activeTab === 'trending' || activeTab === 'recommendations' ? (
            <>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <LoadingPlaceholder key={index} />
                  ))}
                </div>
              ) : musicVideos.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                      {activeTab === 'discover' ? 'Discover Music' : 
                       activeTab === 'trending' ? 'Trending Music' : 
                       'Recommended for You'}
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {musicVideos.map((video) => (
                      <div key={video.id} className="relative group">
                        <VideoCard video={video} />
                        
                        {/* Music Badge */}
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                          🎵 MUSIC
                        </div>
                        
                        {/* Music Info Overlay */}
                        <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium truncate">{video.artist}</p>
                              <p className="text-neutral-300 truncate">{video.album}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-neutral-300">{video.year}</p>
                              <p className="text-neutral-400">{video.genre}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {activeTab === 'discover' && hasMore && !loadingMore && (
                    <div className="text-center mt-8">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Load More Songs</span>
                      </button>
                    </div>
                  )}

                  {/* Loading More Indicator */}
                  {loadingMore && (
                    <div className="flex justify-center mt-8">
                      <div className="flex items-center space-x-2 text-purple-600">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium">Loading more songs...</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    No music found
                  </h3>
                  <p className="text-neutral-600">
                    {searchQuery ? `No results found for "${searchQuery}"` : 'No music available at the moment.'}
                  </p>
                </div>
              )}
            </>
          ) : activeTab === 'artists' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  Popular Artists
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {artists.map((artist) => (
                  <div 
                    key={artist.id} 
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    onClick={() => handleArtistClick(artist.id)}
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        <img
                          src={artist.avatarUrl || '/api/placeholder/80/80'}
                          alt={artist.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        {artist.isVerified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate group-hover:text-purple-600 transition-colors duration-200">
                          {artist.name}
                        </h3>
                        <p className="text-sm text-neutral-600 truncate">
                          {formatCount(artist.subscriberCount)} subscribers
                        </p>
                        <p className="text-xs text-neutral-500">
                          {artist.videoCount} songs
                        </p>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200">
                      View Artist
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : activeTab === 'albums' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  Featured Albums
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {albums.map((album) => (
                  <div key={album.id} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 group">
                    <div className="mb-4">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-purple-600 transition-colors duration-200">
                        {album.title}
                      </h3>
                      <p className="text-sm text-neutral-600 mb-2">{album.artist}</p>
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{album.year}</span>
                        <span>{album.trackCount} tracks</span>
                        <span>{formatDuration(album.duration)}</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200">
                      Play Album
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
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
