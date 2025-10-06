import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import UniversalLayout from '@/components/UniversalLayout';
import VideoCard from '@/components/VideoCard';
import VideoMenu from '@/components/VideoMenu';

interface PlaylistVideo {
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
    avatarUrl?: string;
    subscriberCount: number;
  };
  position: number;
  addedAt: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  videoCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  videos: PlaylistVideo[];
}

interface PlaylistPageProps {
  user?: any;
  playlist: Playlist;
}

export default function PlaylistPage({ user, playlist: initialPlaylist }: PlaylistPageProps) {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist>(initialPlaylist);
  const [loading, setLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [editForm, setEditForm] = useState({
    name: playlist.name,
    description: playlist.description || '',
    privacy: playlist.privacy
  });
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);

  const isOwner = user && user.id === playlist.user.id;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Playlist player functions
  const handlePlayAll = () => {
    if (playlist.videos.length === 0) return;
    setCurrentVideoIndex(0);
    setIsPlaying(true);
    // Navigate to first video
    router.push(`/video/${playlist.videos[0].id}?playlist=${playlist.id}&index=0`);
  };

  const handleShuffle = () => {
    setShuffleMode(!shuffleMode);
    if (!shuffleMode && playlist.videos.length > 0) {
      // Start shuffle mode
      const randomIndex = Math.floor(Math.random() * playlist.videos.length);
      setCurrentVideoIndex(randomIndex);
      setIsPlaying(true);
      router.push(`/video/${playlist.videos[randomIndex].id}?playlist=${playlist.id}&index=${randomIndex}&shuffle=true`);
    }
  };

  const getNextVideo = () => {
    if (shuffleMode) {
      return Math.floor(Math.random() * playlist.videos.length);
    }
    return (currentVideoIndex + 1) % playlist.videos.length;
  };

  const getPreviousVideo = () => {
    if (shuffleMode) {
      return Math.floor(Math.random() * playlist.videos.length);
    }
    return currentVideoIndex === 0 ? playlist.videos.length - 1 : currentVideoIndex - 1;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        setPlaylist(prev => ({
          ...prev,
          name: data.data.name,
          description: data.data.description,
          privacy: data.data.privacy
        }));
        setShowEditForm(false);
      } else {
        console.error('Failed to update playlist:', data.error);
      }
    } catch (error) {
      console.error('Error updating playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/library');
      } else {
        console.error('Failed to delete playlist');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <UniversalLayout user={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                {/* Playlist Thumbnail */}
                <div className="w-56 h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden flex-shrink-0 shadow-xl border-2 border-white/50">
                  {playlist.thumbnailUrl ? (
                    <img src={playlist.thumbnailUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white relative">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="relative z-10 text-center">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-sm font-medium">Playlist</p>
                      </div>
                    </div>
                  )}
                  {/* Video Count Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm">
                    {playlist.videoCount} videos
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{playlist.name}</h1>
                    {playlist.privacy === 'PRIVATE' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Private</span>
                      </span>
                    )}
                    {playlist.privacy === 'UNLISTED' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span>Unlisted</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{playlist.videoCount} videos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="font-medium">{formatViewCount(playlist.viewCount)} views</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Created {isHydrated ? formatTimeAgo(playlist.createdAt) : 'recently'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-3">
                      {playlist.user.avatarUrl ? (
                        <img
                          src={playlist.user.avatarUrl}
                          alt={playlist.user.username}
                          className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                          <span className="text-sm font-bold text-gray-600">
                            {playlist.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {playlist.user.firstName && playlist.user.lastName 
                            ? `${playlist.user.firstName} ${playlist.user.lastName}`
                            : playlist.user.username
                          }
                        </p>
                        <p className="text-sm text-gray-500">Playlist Creator</p>
                      </div>
                    </div>
                  </div>

                  {playlist.description && (
                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200/50">
                      <p className="text-gray-700 leading-relaxed">{playlist.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isOwner && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowEditForm(!showEditForm)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDeletePlaylist}
                    disabled={loading}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 disabled:opacity-50 font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Edit Form */}
          {showEditForm && isOwner && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Playlist</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
                  <select
                    value={editForm.privacy}
                    onChange={(e) => setEditForm(prev => ({ ...prev, privacy: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="UNLISTED">Unlisted</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Videos */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Videos ({playlist.videos.length})</span>
              </h3>
              {playlist.videos.length > 0 && (
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Total: {Math.floor(playlist.videos.reduce((acc, video) => acc + video.duration, 0) / 60)}m</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{playlist.videos.reduce((acc, video) => acc + video.viewCount, 0).toLocaleString()} total views</span>
                  </div>
                </div>
              )}
            </div>

            {/* Playlist Controls */}
            {playlist.videos.length > 0 && (
              <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-gray-50/50 to-white rounded-xl border border-gray-200/50">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={handlePlayAll}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={playlist.videos.length === 0}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span>Play All</span>
                  </button>
                  <button 
                    onClick={handleShuffle}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                      shuffleMode 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={playlist.videos.length === 0}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{shuffleMode ? 'Shuffle On' : 'Shuffle'}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <option>Date Added</option>
                    <option>Title</option>
                    <option>Duration</option>
                    <option>Views</option>
                  </select>
                </div>
              </div>
            )}
            
            {playlist.videos.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">No videos in this playlist</h4>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">Add videos to this playlist to get started. You can add videos from any video page using the three-dots menu.</p>
                <button
                  onClick={() => router.push('/videos')}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Browse Videos
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {playlist.videos.map((video, index) => (
                  <div key={video.id} className="group relative">
                    <div className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 border border-gray-200/50 hover:border-gray-300/50 hover:-translate-y-0.5">
                      {/* Position Number */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow duration-200">
                          {index + 1}
                        </div>
                      </div>

                      {/* Video Thumbnail */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-200">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl.startsWith('/uploads/') ? `/api/uploads/${video.thumbnailUrl.replace('/uploads/', '')}` : video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.src = '/api/placeholder/320/180';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* Duration Badge */}
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center rounded-lg">
                          <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100">
                            <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <div className="space-y-2">
                          {/* Title */}
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors duration-200 leading-tight">
                            {video.title}
                          </h4>
                          
                          {/* Channel Info */}
                          <div className="flex items-center space-x-2">
                            {video.channel.avatarUrl ? (
                              <img
                                src={video.channel.avatarUrl}
                                alt={video.channel.name}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {video.channel.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-600 font-medium">{video.channel.name}</span>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>{formatViewCount(video.viewCount)} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>{formatViewCount(video.likeCount)} likes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{isHydrated ? formatTimeAgo(video.publishedAt) : 'recently'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        {/* Add to Watch Later */}
                        <button
                          onClick={() => {
                            // Add to watch later functionality
                            console.log('Add to watch later:', video.id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="Add to Watch Later"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        {/* Three Dots Menu */}
                        <VideoMenu 
                          videoId={video.id}
                          videoTitle={video.title}
                          videoUrl={video.videoUrl}
                          size="sm"
                        />

                        {/* Remove from Playlist (if owner) */}
                        {isOwner && (
                          <button
                            onClick={() => {
                              // Remove from playlist functionality
                              console.log('Remove from playlist:', video.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                            title="Remove from Playlist"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Added Date */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-gray-400 mb-1">
                          Added {isHydrated ? formatTimeAgo(video.addedAt) : 'recently'}
                        </div>
                        <div className="text-xs text-gray-300">
                          #{video.position}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { id } = context.params as { id: string };
    
    // Try to get user data from cookies
    let user = null;
    const token = context.req.cookies.token;
    
    if (token) {
      try {
        const protocol = context.req.headers['x-forwarded-proto'] || 'http';
        const host = context.req.headers.host;
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com' 
          : `${protocol}://${host}`;

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

    // Fetch playlist data
    try {
      const protocol = context.req.headers['x-forwarded-proto'] || 'http';
      const host = context.req.headers.host;
      const baseUrl = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : `${protocol}://${host}`;

      const res = await fetch(`${baseUrl}/api/playlists/${id}`, { 
        headers: { 
          cookie: context.req.headers.cookie || '',
          'Authorization': token ? `Bearer ${token}` : ''
        } 
      });
      
      if (res.ok) {
        const data = await res.json();
        return { props: { playlist: data.data, user } };
      } else if (res.status === 404) {
        return {
          notFound: true,
        };
      } else if (res.status === 403) {
        return {
          redirect: {
            destination: '/auth',
            permanent: false,
          },
        };
      }
    } catch (e) {
      console.log('Could not fetch playlist data:', e);
    }

    return {
      notFound: true,
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
};
