import React, { useState, useRef, useEffect, useCallback } from 'react';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import VolumeUpIcon from './icons/VolumeUpIcon';
import VolumeOffIcon from './icons/VolumeOffIcon';

interface VideoPlayerProps {
  src: string;
  children?: React.ReactNode;
}

const formatTime = (timeInSeconds: number, totalDuration: number = timeInSeconds): string => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) timeInSeconds = 0;

  const showHours = totalDuration >= 3600;

  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  const minutesString = String(minutes).padStart(2, '0');
  const secondsString = String(seconds).padStart(2, '0');

  if (showHours) {
    return `${hours}:${minutesString}:${secondsString}`;
  }
  return `${minutesString}:${secondsString}`;
};


const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  const hideControls = useCallback(() => {
    if (isPlaying) {
      setIsControlsVisible(false);
    }
  }, [isPlaying]);

  const showControls = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(hideControls, 3000);
  }, [hideControls]);

  useEffect(() => {
    if (isPlaying) {
      showControls();
    } else {
      setIsControlsVisible(true); // Keep controls visible when paused
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || !isFinite(duration)) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onPause);
    video.addEventListener('volumechange', onVolumeChange);

    setIsMuted(video.muted);
    setVolume(video.volume);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);
  
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="w-full h-full relative"
      onMouseMove={showControls}
      onMouseLeave={hideControls}
    >
      <video
        ref={videoRef}
        src={src}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="w-full h-full object-contain"
        playsInline
      />
      
      {children}

      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!isControlsVisible}
      >
        <div 
            ref={progressRef}
            onClick={handleSeek}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Video progress"
            className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer group/progress mb-2"
        >
            <div 
                className="h-full bg-orange-500 rounded-full relative"
                style={{ width: `${progressPercent}%` }}
            >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-orange-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
            </div>
        </div>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className="hover:scale-110 transition-transform">
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className="hover:scale-110 transition-transform">
                    {isMuted || volume === 0 ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6" />}
                </button>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 sm:w-20 h-1 accent-orange-500 cursor-pointer opacity-0 group-hover/volume:opacity-100 group-hover/volume:w-20 transition-all duration-300"
                    aria-label="Volume"
                />
            </div>
          </div>
          <div className="text-sm font-mono" aria-label={`Time ${formatTime(currentTime, duration)} of ${formatTime(duration, duration)}`}>
            <span>{formatTime(currentTime, duration)}</span> / <span>{formatTime(duration, duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;