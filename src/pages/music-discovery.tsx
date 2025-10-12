import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import LoadingPlaceholder from '../components/LoadingPlaceholder';

interface MusicVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  likes: number;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscribers: number;
  };
  artist: string;
  genre: string;
  album?: string;
  year?: number;
}

interface Genre {
  id: string;
  name: string;
  description: string;
  videoCount: number;
  color: string;
}

const genres: Genre[] = [
  { id: 'pop', name: 'Pop', description: 'Popular music hits', videoCount: 1250, color: 'bg-pink-500' },
  { id: 'rock', name: 'Rock', description: 'Rock and alternative music', videoCount: 980, color: 'bg-gray-600' },
  { id: 'hip-hop', name: 'Hip-Hop', description: 'Hip-hop and rap music', videoCount: 1100, color: 'bg-purple-600' },
  { id: 'electronic', name: 'Electronic', description: 'Electronic and dance music', videoCount: 750, color: 'bg-blue-500' },
  { id: 'classical', name: 'Classical', description: 'Classical and orchestral music', videoCount: 450, color: 'bg-yellow-600' },
  { id: 'jazz', name: 'Jazz', description: 'Jazz and blues music', videoCount: 320, color: 'bg-orange-500' },
  { id: 'country', name: 'Country', description: 'Country and folk music', videoCount: 680, color: 'bg-green-600' },
  { id: 'rnb', name: 'R&B', description: 'Rhythm and blues', videoCount: 520, color: 'bg-red-500' }
];

export default function MusicDiscoveryPage() {
  const [musicVideos, setMusicVideos] = useState<MusicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  useEffect(() => {
    fetchMusicVideos();
  }, [selectedGenre]);

  const fetchMusicVideos = async () => {
    try {
      setLoading(true);
      // Use regular videos endpoint and filter for music category
      const response = await fetch('/api/videos?category=music&limit=20');
      const data = await response.json();
      
      // Transform regular videos to music videos
      const musicVideos = (data.data || []).map((video: any) => ({
        ...video,
        artist: video.channel.name,
        genre: selectedGenre || 'pop',
        album: `Album ${Math.floor(Math.random() * 10) + 1}`,
        year: 2020 + Math.floor(Math.random() * 4)
      }));
      
      setMusicVideos(musicVideos);
    } catch (error) {
      console.error('Error fetching music videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Music Discovery
              </h1>
            </div>
            <p className="text-neutral-600">
              Find new music, artists, and discover your next favorite song
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Genre Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Browse by Genre
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
                className={`p-4 rounded-lg text-center transition-all duration-200 ${
                  selectedGenre === genre.id
                    ? 'ring-2 ring-purple-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${genre.color} flex items-center justify-center`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="font-medium text-neutral-900 text-sm mb-1">
                  {genre.name}
                </h3>
                <p className="text-xs text-neutral-500">
                  {formatCount(genre.videoCount)} videos
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Music Videos */}
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
                {selectedGenre 
                  ? `${genres.find(g => g.id === selectedGenre)?.name} Music Videos`
                  : 'All Music Videos'
                }
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {musicVideos.map((video) => (
                <div key={video.id} className="relative group">
                  <VideoCard video={video} />
                  
                  {/* Music Badge */}
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded font-medium">
                    MUSIC
                  </div>
                  
                  {/* Additional Music Info */}
                  {video.artist && (
                    <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.artist}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No music videos found
            </h3>
            <p className="text-neutral-600">
              {selectedGenre 
                ? `No ${genres.find(g => g.id === selectedGenre)?.name.toLowerCase()} music videos available.`
                : 'There are no music videos available at the moment.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
