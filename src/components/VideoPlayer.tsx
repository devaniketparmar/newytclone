import React, { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  thumbnailUrl?: string;
  className?: string;
  playlistId?: string;
  playlistIndex?: number;
  playlistVideos?: Array<{
    id: string;
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
  }>;
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
}

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  thumbnailUrl, 
  className = '',
  playlistId,
  playlistIndex,
  playlistVideos,
  onNextVideo,
  onPreviousVideo
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const qualityOptions = ['Auto', '1080p', '720p', '480p', '360p', '240p'];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => setVolume(video.volume);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleEnterPictureInPicture = () => setIsPictureInPicture(true);
    const handleLeavePictureInPicture = () => setIsPictureInPicture(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('enterpictureinpicture', handleEnterPictureInPicture);
    video.addEventListener('leavepictureinpicture', handleLeavePictureInPicture);

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== video) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyT':
          e.preventDefault();
          toggleTheaterMode();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('enterpictureinpicture', handleEnterPictureInPicture);
      video.removeEventListener('leavepictureinpicture', handleLeavePictureInPicture);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const seek = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = Math.max(0, Math.min(1, video.volume + delta));
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPictureInPicture) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Picture-in-picture error:', error);
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const changeQuality = (quality: string) => {
    setCurrentQuality(quality);
    setShowQualityMenu(false);
    // In a real implementation, you would change the video source here
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      setShowControls(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden group ${isTheaterMode ? 'theater-mode' : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-full aspect-video">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          poster={thumbnailUrl}
          onClick={togglePlay}
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Loading Spinner */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Play Button Overlay */}
        {!isPlaying && !isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <button
              onClick={togglePlay}
              className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-2xl"
            >
              <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Top Controls */}
        {showControls && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 via-transparent to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleTheaterMode}
                  className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Theater mode (T)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePictureInPicture}
                  className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Picture-in-picture"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V2a1 1 0 011-1h8z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer progress-slider"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
                  }}
                />
                <div className="absolute top-1/2 transform -translate-y-1/2 left-0 w-full h-1 bg-white/20 rounded-lg pointer-events-none"></div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>

                {/* Skip Backward */}
                <button
                  onClick={() => seek(-10)}
                  className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Skip backward 10s (←)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.333 4z" />
                  </svg>
                </button>

                {/* Skip Forward */}
                <button
                  onClick={() => seek(10)}
                  className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Skip forward 10s (→)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6L14.6 7.2A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                  </svg>
                </button>

                {/* Playlist Navigation */}
                {playlistVideos && playlistVideos.length > 1 && (
                  <>
                    {/* Previous Video */}
                    <button
                      onClick={onPreviousVideo}
                      className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                      title="Previous video"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Next Video */}
                    <button
                      onClick={onNextVideo}
                      className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                      title="Next video"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Volume */}
                <div className="flex items-center space-x-2 relative">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    {isMuted || volume === 0 ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
                  
                  {showVolumeSlider && (
                    <div className="absolute bottom-12 left-0 bg-black/90 rounded-lg p-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer volume-slider"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) 100%)`
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Time Display */}
                <div className="text-white text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Quality */}
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="text-white hover:text-gray-300 transition-colors text-sm font-medium px-3 py-1 rounded hover:bg-white/10"
                    title="Quality"
                  >
                    {currentQuality}
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-8 right-0 bg-black/90 rounded-lg p-2 min-w-32">
                      {qualityOptions.map((quality) => (
                        <button
                          key={quality}
                          onClick={() => changeQuality(quality)}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/20 ${
                            currentQuality === quality ? 'text-red-500 font-medium' : 'text-white'
                          }`}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Playback Speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:text-gray-300 transition-colors text-sm font-medium px-3 py-1 rounded hover:bg-white/10"
                    title="Playback speed"
                  >
                    {playbackRate}x
                  </button>
                  {showSettings && (
                    <div className="absolute bottom-8 right-0 bg-black/90 rounded-lg p-2 min-w-32">
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/20 ${
                            playbackRate === rate ? 'text-red-500 font-medium' : 'text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Fullscreen (F)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .progress-slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .progress-slider:hover::-webkit-slider-thumb {
          opacity: 1;
        }
        
        .progress-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .progress-slider:hover::-moz-range-thumb {
          opacity: 1;
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .theater-mode {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
}