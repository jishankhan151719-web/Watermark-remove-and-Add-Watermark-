import React from 'react';
import DownloadIcon from './icons/DownloadIcon';
import LinkIcon from './icons/LinkIcon';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { WatermarkConfig, WatermarkPosition, WatermarkArea } from '../types';
import VideoPlayer from './VideoPlayer';

interface ResultDisplayProps {
  mode: 'add' | 'remove';
  videoUrl: string;
  videoFile: File | null;
  aiTips: string;
  isLoadingTips: boolean;
  onReset: () => void;
  isUrlBased: boolean;
  watermarkConfig: WatermarkConfig;
  watermarkArea: WatermarkArea | null;
  audioWatermarkDetected: boolean | null;
  processedFrameUrl: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  mode,
  videoUrl,
  videoFile,
  aiTips,
  isLoadingTips,
  onReset,
  isUrlBased,
  watermarkConfig,
  watermarkArea,
  audioWatermarkDetected,
  processedFrameUrl,
}) => {
  const formattedTips = aiTips.split('\n\n').filter(tip => tip.trim() !== '');

  const title = mode === 'add' ? 'Watermark Applied!' : 'Your Video is Ready!';
  
  const positionClasses: Record<WatermarkPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'center-left': 'top-1/2 left-4 -translate-y-1/2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'center-right': 'top-1/2 right-4 -translate-y-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  const WatermarkOverlay = () => {
    if (!watermarkConfig.imageUrl) return null;

    return (
      <img
        src={watermarkConfig.imageUrl}
        alt="Watermark"
        className={`absolute ${positionClasses[watermarkConfig.position]} pointer-events-none`}
        style={{
          opacity: watermarkConfig.opacity,
          width: `${watermarkConfig.size}%`,
          height: 'auto',
        }}
        aria-hidden="true"
      />
    );
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold text-green-600 mb-4 text-center">
        {title}
      </h2>
      <div className="w-full max-w-xl bg-black rounded-lg overflow-hidden shadow-xl mb-6 relative aspect-video">
        {isUrlBased ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
            <LinkIcon className="h-16 w-16 mb-4" />
            <h3 className="text-lg font-semibold text-white">Video from Link Processed</h3>
            <p className="text-sm text-center">This is a placeholder for the processed video.</p>
          </div>
        ) : (
          <VideoPlayer src={videoUrl}>
            {mode === 'add' && <WatermarkOverlay />}

            {mode === 'remove' && watermarkArea && (
              processedFrameUrl ? (
                // AI-powered patch overlay for a much better simulation
                <div
                  aria-hidden="true"
                  title="AI-powered watermark removal area"
                  className="absolute pointer-events-none overflow-hidden"
                  style={{
                    left: `${watermarkArea.x}%`,
                    top: `${watermarkArea.y}%`,
                    width: `${watermarkArea.width}%`,
                    height: `${watermarkArea.height}%`,
                  }}
                >
                  <img
                    src={processedFrameUrl}
                    alt="Inpainted video area"
                    className="absolute"
                    style={{
                      width: `${10000 / watermarkArea.width}%`,
                      height: 'auto',
                      top: `-${(watermarkArea.y / watermarkArea.height) * 100}%`,
                      left: `-${(watermarkArea.x / watermarkArea.width) * 100}%`,
                      maxWidth: 'none',
                    }}
                  />
                </div>
              ) : (
                // Fallback blur effect if AI processing failed
                <div
                  className="absolute bg-white/10 backdrop-blur-md rounded-md pointer-events-none"
                  aria-hidden="true"
                  title="Simulated watermark removal area"
                  style={{
                      top: `${watermarkArea.y}%`,
                      left: `${watermarkArea.x}%`,
                      width: `${watermarkArea.width}%`,
                      height: `${watermarkArea.height}%`,
                  }}
                ></div>
              )
            )}
          </VideoPlayer>
        )}
      </div>

      {mode === 'remove' && audioWatermarkDetected !== null && (
        <div className="w-full max-w-xl mb-6">
          <div
            className={`flex items-center p-4 rounded-lg ${
              audioWatermarkDetected
                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}
          >
            {audioWatermarkDetected ? (
              <SpeakerWaveIcon className="h-6 w-6 mr-3 flex-shrink-0" />
            ) : (
              <CheckCircleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-bold">Audio Analysis</h4>
              <p className="text-sm">
                {audioWatermarkDetected
                  ? 'A potential audio watermark was detected and has been suppressed in this preview.'
                  : 'No audio watermarks were detected. The audio track is clean.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-6 text-center max-w-lg">
        {mode === 'add' 
          ? "We've applied your custom watermark to the video preview. The downloaded file will be your original, unaltered video."
          : (processedFrameUrl && !isUrlBased
            ? "Success! We've used AI to remove the watermark in this preview. The downloaded file remains your unaltered original video."
            : (isUrlBased
              ? "To demonstrate the removal process, we've simulated a blur effect over the area you selected on the video placeholder."
              : "To demonstrate the removal process, we've simulated a blur effect over the area you selected. The downloaded file remains your unaltered original video.")
          )
        }
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center">
        {!isUrlBased && videoFile && (
          <a
            href={videoUrl}
            download={videoFile.name || 'processed-video.mp4'}
            className="flex items-center justify-center w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
          >
            <DownloadIcon className="h-5 w-5 mr-2" />
            Download Video
          </a>
        )}
        <button
          onClick={onReset}
          className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Process Another Video
        </button>
      </div>

      <div className="w-full mt-10 pt-8 border-t border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">
          <span role="img" aria-label="lightbulb">💡</span> AI-Powered Tips from the Bear
        </h3>
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-6 rounded-lg">
          {isLoadingTips ? (
            <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="ml-3">Fetching tips...</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {formattedTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-500 font-bold mr-3">✓</span>
                  <p>{tip}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;