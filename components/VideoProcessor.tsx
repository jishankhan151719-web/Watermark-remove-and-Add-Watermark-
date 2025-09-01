import React from 'react';
import LinkIcon from './icons/LinkIcon';

interface VideoProcessorProps {
  progress: number;
  message: string;
  videoUrl: string;
  mode: 'add' | 'remove';
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({ progress, message, videoUrl, mode }) => {
  const title = mode === 'add' ? 'Applying watermark...' : 'Processing your video...';
  
  return (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="w-48 h-28 bg-slate-200 rounded-lg mb-6 overflow-hidden shadow-inner flex items-center justify-center">
          {videoUrl ? (
            <video
              src={videoUrl}
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-500">
                <LinkIcon className="h-12 w-12" />
                <span className="mt-1 text-sm font-semibold">Processing link</span>
            </div>
          )}
        </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {title}
      </h2>
      <p key={message} className="text-gray-600 mb-6 animate-fade-in">{message}</p>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className="bg-orange-500 h-4 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
           <div className="absolute top-0 left-0 h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>
      </div>
      <p className="text-orange-600 font-semibold mt-4">{progress}% Complete</p>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VideoProcessor;