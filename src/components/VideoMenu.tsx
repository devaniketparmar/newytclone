import React, { useState, useEffect } from 'react';

interface Playlist {
  id: string;
  name: string;
  videoCount: number;
}

interface VideoMenuProps {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  size?: 'sm' | 'md' | 'lg';
  onVideoAdded?: (playlistId: string) => void;
}

export default function VideoMenu({ 
  videoId, 
  videoTitle,
  videoUrl,
  size = 'md',
  onVideoAdded 
}: VideoMenuProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  useEffect(() => {
    if (showMenu) {
      fetchPlaylists();
      checkWatchLaterStatus();
    }
  }, [showMenu]);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.data || []);
      } else {
        setError('Failed to load playlists');
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists');
    }
  };

  const checkWatchLaterStatus = async () => {
    try {
      const response = await fetch(`/api/library/watch-later/${videoId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsInWatchLater(data.data?.isInWatchLater || false);
      }
    } catch (error) {
      console.error('Error checking watch later status:', error);
    }
  };

  const handleAddToWatchLater = async () => {
    setLoading(true);
    setError(null);

    try {
      const method = isInWatchLater ? 'DELETE' : 'POST';
      const response = await fetch(`/api/library/watch-later/${videoId}`, {
        method,
        credentials: 'include',
      });

      if (response.ok) {
        setIsInWatchLater(!isInWatchLater);
        setShowMenu(false);
        alert(isInWatchLater ? 'Removed from Watch Later' : 'Added to Watch Later');
      } else {
        setError('Failed to update Watch Later');
      }
    } catch (error) {
      console.error('Error updating watch later:', error);
      setError('Failed to update Watch Later');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      setError('Please select a playlist');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlists/${selectedPlaylistId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowPlaylistModal(false);
        setSelectedPlaylistId('');
        setShowMenu(false);
        onVideoAdded?.(selectedPlaylistId);
        alert('Video added to playlist successfully!');
      } else {
        setError(data.error || 'Failed to add video to playlist');
      }
    } catch (error) {
      console.error('Error adding video to playlist:', error);
      setError('Failed to add video to playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/video/${videoId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: videoTitle,
          text: `Check out this video: ${videoTitle}`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        // Fallback: show prompt
        prompt('Copy this link:', shareUrl);
      }
    }
    setShowMenu(false);
  };

  const handleDownload = () => {
    // For now, we'll just open the video URL in a new tab
    // In a real app, you'd implement proper download functionality
    window.open(videoUrl, '_blank');
    setShowMenu(false);
  };

  const handleCreatePlaylist = () => {
    window.location.href = '/playlists/create';
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`
            ${sizeClasses[size]}
            flex items-center justify-center
            rounded-full
            transition-all duration-200
            bg-black/70 text-white hover:bg-black/90
            hover:scale-105
          `}
          title="More options"
        >
          <svg 
            className={iconSizes[size]} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="py-2">
              {/* Watch Later */}
              <button
                onClick={handleAddToWatchLater}
                disabled={loading}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-900">
                  {isInWatchLater ? 'Remove from Watch Later' : 'Save to Watch Later'}
                </span>
              </button>

              {/* Add to Playlist */}
              <button
                onClick={() => setShowPlaylistModal(true)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-gray-900">Add to Playlist</span>
              </button>

              <div className="border-t border-gray-100 my-1"></div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="text-gray-900">Share</span>
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-900">Download</span>
              </button>

              <div className="border-t border-gray-100 my-1"></div>

              {/* Create Playlist */}
              <button
                onClick={handleCreatePlaylist}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-gray-900">Create Playlist</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Playlist Selection Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add to Playlist</h3>
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {playlists.map((playlist) => (
                  <label
                    key={playlist.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="playlist"
                      value={playlist.id}
                      checked={selectedPlaylistId === playlist.id}
                      onChange={(e) => setSelectedPlaylistId(e.target.value)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{playlist.name}</div>
                      <div className="text-sm text-gray-500">{playlist.videoCount} videos</div>
                    </div>
                  </label>
                ))}
              </div>

              {playlists.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No playlists yet</h4>
                  <p className="text-gray-600 mb-4">Create a playlist first to add videos.</p>
                  <button
                    onClick={handleCreatePlaylist}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Create Playlist
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToPlaylist}
                  disabled={loading || !selectedPlaylistId}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Add to Playlist'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
}
