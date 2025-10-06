import React, { useState, useEffect } from 'react';

interface Playlist {
  id: string;
  name: string;
  videoCount: number;
}

interface AddToPlaylistButtonProps {
  videoId: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onVideoAdded?: (playlistId: string) => void;
}

export default function AddToPlaylistButton({ 
  videoId, 
  size = 'md',
  showText = false,
  onVideoAdded 
}: AddToPlaylistButtonProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  useEffect(() => {
    if (showModal) {
      fetchPlaylists();
    }
  }, [showModal]);

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
        setShowModal(false);
        setSelectedPlaylistId('');
        onVideoAdded?.(selectedPlaylistId);
        // Show success message
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

  const handleOpenModal = () => {
    if (playlists.length === 0) {
      alert('You need to create a playlist first!');
      return;
    }
    setShowModal(true);
    setError(null);
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          bg-black/70 text-white hover:bg-black/90
          hover:scale-105
          ${showText ? 'px-3 py-2 rounded-lg' : ''}
        `}
        title="Add to Playlist"
      >
        <svg 
          className={iconSizes[size]} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
          />
        </svg>
        {showText && (
          <span className="ml-2 text-sm font-medium">
            Add to Playlist
          </span>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add to Playlist</h3>
                <button
                  onClick={() => setShowModal(false)}
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
                    onClick={() => {
                      setShowModal(false);
                      window.location.href = '/playlists/create';
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Create Playlist
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
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
    </>
  );
}
