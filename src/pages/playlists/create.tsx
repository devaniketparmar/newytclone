import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import UniversalLayout from '@/components/UniversalLayout';

interface CreatePlaylistPageProps {
  user?: any;
}

export default function CreatePlaylistPage({ user }: CreatePlaylistPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'PUBLIC' as 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Playlist name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the created playlist
        router.push(`/playlist/${data.data.id}`);
      } else {
        setError(data.error || 'Failed to create playlist');
      }
    } catch (err) {
      setError('An error occurred while creating the playlist');
      console.error('Error creating playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalLayout user={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Create Playlist
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Organize your favorite videos into playlists
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Playlist Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-3">
                  Playlist Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter playlist name"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-gray-900 bg-gray-50/50 hover:bg-white"
                    maxLength={200}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full opacity-0 transition-opacity duration-200" 
                         style={{ opacity: formData.name.length > 0 ? 1 : 0 }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    {formData.name.length}/200 characters
                  </p>
                  <div className="text-xs text-gray-400">
                    {formData.name.length > 0 ? '✓ Required field completed' : 'Required field'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-3">
                  Description
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your playlist (optional)"
                    rows={4}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 resize-none text-gray-900 bg-gray-50/50 hover:bg-white"
                    maxLength={5000}
                  />
                  <div className="absolute top-4 right-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    {formData.description.length}/5000 characters
                  </p>
                  <div className="text-xs text-gray-400">
                    {formData.description.length > 0 ? '✓ Description added' : 'Optional field'}
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <label htmlFor="privacy" className="block text-sm font-semibold text-gray-800 mb-3">
                  Privacy Settings
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'PUBLIC', label: 'Public', desc: 'Anyone can find and view', icon: '🌍', color: 'green' },
                    { value: 'UNLISTED', label: 'Unlisted', desc: 'Only people with the link', icon: '🔗', color: 'yellow' },
                    { value: 'PRIVATE', label: 'Private', desc: 'Only you can view', icon: '🔒', color: 'gray' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.privacy === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value={option.value}
                        checked={formData.privacy === option.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-semibold text-gray-900">{option.label}</span>
                        {formData.privacy === option.value && (
                          <div className={`w-2 h-2 bg-${option.color}-500 rounded-full`}></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{option.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-red-800 mb-1">Error</h3>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Playlist...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Playlist</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-2xl p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-blue-900 mb-4">About Playlists</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-blue-900">Public playlists</p>
                        <p className="text-sm text-blue-700">Can be discovered by anyone and appear in search results</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-blue-900">Unlisted playlists</p>
                        <p className="text-sm text-blue-700">Can only be viewed by people who have the direct link</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-blue-900">Private playlists</p>
                        <p className="text-sm text-blue-700">Are only visible to you</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-blue-900">Easy management</p>
                        <p className="text-sm text-blue-700">Add videos, reorder, and manage anytime</p>
                      </div>
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

    // If no user is authenticated, redirect to auth page
    if (!user) {
      return {
        redirect: {
          destination: '/auth',
          permanent: false,
        },
      };
    }

    return { props: { user } };
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
