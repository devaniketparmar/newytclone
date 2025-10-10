import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface PageTransitionProgressProps {
  className?: string;
}

export default function PageTransitionProgress({ className = '' }: PageTransitionProgressProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let completeTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;

    const handleRouteChangeStart = (url: string) => {
      setIsLoading(true);
      setIsVisible(true);
      setProgress(0);
      
      // Initial progress boost
      setTimeout(() => setProgress(10), 50);
      
      // Simulate realistic progress increment
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev; // Stop at 85% until route change completes
          
          // Slower progress as it gets closer to completion
          const remaining = 85 - prev;
          const increment = remaining > 50 ? 
            Math.random() * 8 + 3 : // 3-11% for first half
            Math.random() * 3 + 1; // 1-4% for second half
          
          return Math.min(prev + increment, 85);
        });
      }, 150);
    };

    const handleRouteChangeComplete = () => {
      clearInterval(progressTimer);
      
      // Complete the progress bar
      setProgress(100);
      
      // Hide after a short delay
      completeTimer = setTimeout(() => {
        setIsVisible(false);
        
        // Reset after animation completes
        hideTimer = setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }, 150);
    };

    const handleRouteChangeError = () => {
      clearInterval(progressTimer);
      clearTimeout(completeTimer);
      clearTimeout(hideTimer);
      setIsLoading(false);
      setIsVisible(false);
      setProgress(0);
    };

    // Add event listeners
    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    // Cleanup
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
      clearInterval(progressTimer);
      clearTimeout(completeTimer);
      clearTimeout(hideTimer);
    };
  }, []); // Empty dependency array - only run once on mount

  if (!isLoading) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      {/* Main Progress Bar */}
      <div 
        className={`h-1 bg-gray-100 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Fill */}
        <div
          className="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 transition-all duration-200 ease-out relative overflow-hidden"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
          }}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          
          {/* Moving Highlight */}
          <div 
            className="absolute top-0 right-0 w-8 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12"
            style={{
              animation: 'shimmer 1.5s infinite linear',
            }}
          />
        </div>
      </div>
      
      {/* Glow Effect */}
      <div
        className={`absolute top-0 h-1 bg-gradient-to-r from-red-400 to-red-500 opacity-60 blur-sm transition-all duration-200 ease-out ${
          isVisible ? 'opacity-60' : 'opacity-0'
        }`}
        style={{
          width: `${progress}%`,
        }}
      />
      
      {/* CSS Animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
      `}</style>
    </div>
  );
}
