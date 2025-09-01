import React from 'react';
import LinkIcon from './icons/LinkIcon';
import SparklesIcon from './icons/SparklesIcon';

interface WatermarkDetectorProps {
  videoUrl: string;
  isUrlBased: boolean;
}

const WatermarkDetector: React.FC<WatermarkDetectorProps> = ({ videoUrl, isUrlBased }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="w-48 h-28 bg-slate-200 rounded-lg mb-6 overflow-hidden shadow-inner flex items-center justify-center">
        {videoUrl && !isUrlBased ? (
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
      <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
        <SparklesIcon className="h-6 w-6 mr-3 text-orange-500 animate-pulse" />
        Detecting Watermark...
      </h2>
      <p className="text-gray-600">Our Bear-Vision AI is analyzing your video and audio.</p>
       <div className="w-full max-w-sm bg-gray-200 rounded-full h-2.5 mt-6">
        <div className="bg-orange-500 h-2.5 rounded-full animate-pulse" style={{ width: '100%', animation: 'indeterminate-progress 2s infinite ease-in-out' }}></div>
      </div>
      <style>{`
        @keyframes indeterminate-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-pulse {
            position: relative;
            overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default WatermarkDetector;