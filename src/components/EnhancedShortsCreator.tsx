import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

interface ShortsCreatorProps {
  onClose?: () => void;
  onUpload?: (videoData: any) => void;
  enableFilters?: boolean;
  enableMusic?: boolean;
  enableTextOverlay?: boolean;
}

export default function EnhancedShortsCreator({ 
  onClose, 
  onUpload,
  enableFilters = true,
  enableMusic = true,
  enableTextOverlay = true
}: ShortsCreatorProps) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [textOverlays, setTextOverlays] = useState<Array<{id: string, text: string, x: number, y: number, fontSize: number, color: string}>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [cameraMode, setCameraMode] = useState<'front' | 'back'>('front');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [recordingMode, setRecordingMode] = useState<'normal' | 'slow' | 'fast'>('normal');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const filters = [
    { id: 'none', name: 'None', preview: '🎬' },
    { id: 'vintage', name: 'Vintage', preview: '📷' },
    { id: 'blackwhite', name: 'B&W', preview: '⚫' },
    { id: 'sepia', name: 'Sepia', preview: '🟤' },
    { id: 'cool', name: 'Cool', preview: '❄️' },
    { id: 'warm', name: 'Warm', preview: '🔥' },
    { id: 'dramatic', name: 'Dramatic', preview: '🎭' },
    { id: 'bright', name: 'Bright', preview: '☀️' }
  ];

  const musicTracks = [
    { id: 'trending1', name: 'Trending Beat', duration: '0:30', genre: 'Hip Hop' },
    { id: 'trending2', name: 'Viral Sound', duration: '0:15', genre: 'Pop' },
    { id: 'trending3', name: 'Dance Hit', duration: '0:45', genre: 'Electronic' },
    { id: 'trending4', name: 'Chill Vibes', duration: '0:60', genre: 'Ambient' },
    { id: 'trending5', name: 'Epic Moment', duration: '0:20', genre: 'Cinematic' }
  ];

  const startRecording = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: { 
          width: { ideal: 720 },
          height: { ideal: 1280 },
          facingMode: cameraMode === 'front' ? 'user' : 'environment'
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Apply filter
        if (selectedFilter !== 'none') {
          applyFilter(selectedFilter);
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideo(videoUrl);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= 60) { // Max 60 seconds for shorts
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }, [cameraMode, selectedFilter]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const applyFilter = useCallback((filterId: string) => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    video.style.filter = getFilterCSS(filterId);
  }, []);

  const getFilterCSS = (filterId: string) => {
    const filters: { [key: string]: string } = {
      'none': 'none',
      'vintage': 'sepia(0.5) contrast(1.2) brightness(0.9)',
      'blackwhite': 'grayscale(100%)',
      'sepia': 'sepia(100%)',
      'cool': 'hue-rotate(180deg) saturate(1.2)',
      'warm': 'hue-rotate(30deg) saturate(1.3)',
      'dramatic': 'contrast(1.5) brightness(0.8)',
      'bright': 'brightness(1.3) contrast(1.1)'
    };
    return filters[filterId] || 'none';
  };

  const addTextOverlay = useCallback(() => {
    const newOverlay = {
      id: Date.now().toString(),
      text: 'Tap to edit',
      x: 50,
      y: 50,
      fontSize: 24,
      color: '#ffffff'
    };
    setTextOverlays(prev => [...prev, newOverlay]);
  }, []);

  const updateTextOverlay = useCallback((id: string, updates: Partial<typeof textOverlays[0]>) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  }, []);

  const removeTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
  }, []);

  const toggleCameraMode = useCallback(() => {
    setCameraMode(prev => prev === 'front' ? 'back' : 'front');
  }, []);

  const toggleFlashMode = useCallback(() => {
    setFlashMode(prev => {
      switch (prev) {
        case 'off': return 'on';
        case 'on': return 'auto';
        case 'auto': return 'off';
        default: return 'off';
      }
    });
  }, []);

  const retakeVideo = useCallback(() => {
    setRecordedVideo(null);
    setDuration(0);
    setTitle('');
    setDescription('');
    setHashtags([]);
    setHashtagInput('');
    setTextOverlays([]);
    setSelectedFilter('none');
    setSelectedMusic(null);
  }, []);

  const addHashtag = useCallback(() => {
    const hashtag = hashtagInput.trim().replace('#', '');
    if (hashtag && !hashtags.includes(hashtag) && hashtags.length < 10) {
      setHashtags(prev => [...prev, hashtag]);
      setHashtagInput('');
    }
  }, [hashtagInput, hashtags]);

  const removeHashtag = useCallback((hashtagToRemove: string) => {
    setHashtags(prev => prev.filter(hashtag => hashtag !== hashtagToRemove));
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addHashtag();
    }
  }, [addHashtag]);

  const uploadShort = useCallback(async () => {
    if (!recordedVideo || !title.trim()) {
      alert('Please add a title and record a video');
      return;
    }

    try {
      setIsUploading(true);

      // Convert blob to file
      const response = await fetch(recordedVideo);
      const blob = await response.blob();
      const file = new File([blob], 'short-video.webm', { type: 'video/webm' });

      // Create form data
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('hashtags', JSON.stringify(hashtags));
      formData.append('isShort', 'true');
      formData.append('filter', selectedFilter);
      formData.append('music', selectedMusic || '');
      formData.append('musicVolume', musicVolume.toString());
      formData.append('textOverlays', JSON.stringify(textOverlays));
      formData.append('recordingMode', recordingMode);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        if (onUpload) {
          onUpload(result);
        } else {
          alert('Short video uploaded successfully!');
          router.push(`/video/${result.videoId}`);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading short:', error);
      alert('Failed to upload short video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [recordedVideo, title, description, hashtags, selectedFilter, selectedMusic, musicVolume, textOverlays, recordingMode, onUpload, router]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-md mx-auto bg-black flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-white text-lg font-semibold">Create Short</h1>
          <div className="w-8" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {!recordedVideo ? (
            <>
              {/* Camera View */}
              <div className="flex-1 relative bg-neutral-900">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                
                {/* Recording Overlay */}
                {isRecording && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-8 h-8 bg-white rounded"></div>
                    </div>
                  </div>
                )}

                {/* Text Overlays */}
                {textOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="absolute text-white font-bold pointer-events-none"
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      fontSize: `${overlay.fontSize}px`,
                      color: overlay.color,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {overlay.text}
                  </div>
                ))}

                {/* Duration Display */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                  {formatDuration(duration)}
                </div>

                {/* Camera Controls */}
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  <button
                    onClick={toggleCameraMode}
                    className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={toggleFlashMode}
                    className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                </div>

                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                  {/* Filter Button */}
                  {enableFilters && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <span className="text-white text-lg">{filters.find(f => f.id === selectedFilter)?.preview || '🎬'}</span>
                    </button>
                  )}
                  
                  {/* Music Button */}
                  {enableMusic && (
                    <button
                      onClick={() => setShowMusic(!showMusic)}
                      className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Text Overlay Button */}
                  {enableTextOverlay && (
                    <button
                      onClick={() => setShowTextEditor(!showTextEditor)}
                      className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Record Button */}
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                    >
                      <div className="w-8 h-8 bg-white rounded"></div>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-neutral-200 transition-colors"
                    >
                      <div className="w-6 h-6 bg-red-600 rounded"></div>
                    </button>
                  )}
                </div>

                {/* Instructions */}
                {!isRecording && (
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
                    <p className="text-white text-sm">Tap to start recording</p>
                    <p className="text-white/60 text-xs">Maximum 60 seconds</p>
                    <div className="flex items-center justify-center space-x-4 mt-2">
                      <span className="text-white/60 text-xs">Camera: {cameraMode}</span>
                      <span className="text-white/60 text-xs">Flash: {flashMode}</span>
                      <span className="text-white/60 text-xs">Mode: {recordingMode}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Preview and Edit */}
              <div className="flex-1 relative bg-neutral-900">
                <video
                  src={recordedVideo}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                />
                
                {/* Retake Button */}
                <button
                  onClick={retakeVideo}
                  className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm hover:bg-black/70 transition-colors"
                >
                  Retake
                </button>
              </div>

              {/* Edit Form */}
              <div className="p-4 bg-neutral-900 border-t border-neutral-800">
                <div className="space-y-4">
                  {/* Filters Section */}
                  {enableFilters && (
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Filters
                      </label>
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {filters.map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedFilter === filter.id
                                ? 'bg-red-600 text-white'
                                : 'bg-neutral-800 text-white/70 hover:text-white'
                            }`}
                          >
                            <span className="mr-1">{filter.preview}</span>
                            {filter.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Music Section */}
                  {enableMusic && (
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Background Music
                      </label>
                      <div className="space-y-2">
                        <select
                          value={selectedMusic || ''}
                          onChange={(e) => setSelectedMusic(e.target.value || null)}
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">No music</option>
                          {musicTracks.map((track) => (
                            <option key={track.id} value={track.id}>
                              {track.name} - {track.duration} ({track.genre})
                            </option>
                          ))}
                        </select>
                        {selectedMusic && (
                          <div className="flex items-center space-x-2">
                            <span className="text-white/70 text-sm">Volume:</span>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={musicVolume}
                              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-white/70 text-sm">{Math.round(musicVolume * 100)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Text Overlays Section */}
                  {enableTextOverlay && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-white text-sm font-medium">
                          Text Overlays
                        </label>
                        <button
                          onClick={addTextOverlay}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Add Text
                        </button>
                      </div>
                      {textOverlays.map((overlay) => (
                        <div key={overlay.id} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={overlay.text}
                            onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                            className="flex-1 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                          />
                          <input
                            type="color"
                            value={overlay.color}
                            onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                            className="w-8 h-8 rounded border border-neutral-700"
                          />
                          <button
                            onClick={() => removeTextOverlay(overlay.id)}
                            className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Add a title..."
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      maxLength={100}
                    />
                    <p className="text-neutral-400 text-xs mt-1">
                      {title.length}/100 characters
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell viewers about your short..."
                      rows={3}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      maxLength={500}
                    />
                    <p className="text-neutral-400 text-xs mt-1">
                      {description.length}/500 characters
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Hashtags
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add hashtag..."
                        className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        onClick={addHashtag}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    
                    {/* Hashtag List */}
                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {hashtags.map((hashtag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-sm rounded-full"
                          >
                            #{hashtag}
                            <button
                              onClick={() => removeHashtag(hashtag)}
                              className="ml-1 hover:text-red-200"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-neutral-400 text-xs mt-1">
                      {hashtags.length}/10 hashtags
                    </p>
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={uploadShort}
                    disabled={isUploading || !title.trim()}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Upload Short</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

