import React, { useState, useMemo } from 'react';
import { WatermarkConfig, WatermarkPosition } from '../types';
import LinkIcon from './icons/LinkIcon';

interface WatermarkEditorProps {
  videoUrl: string;
  initialConfig: WatermarkConfig;
  onApply: (config: WatermarkConfig) => void;
  onBack: () => void;
  isUrlBased: boolean;
}

const WatermarkEditor: React.FC<WatermarkEditorProps> = ({ videoUrl, initialConfig, onApply, onBack, isUrlBased }) => {
  const [config, setConfig] = useState<WatermarkConfig>(initialConfig);

  const handleApply = () => {
    onApply(config);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setConfig({ ...config, imageUrl: event.target.result as string });
            }
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const positionClasses: Record<WatermarkPosition, string> = useMemo(() => ({
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'center-left': 'top-1/2 left-4 -translate-y-1/2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'center-right': 'top-1/2 right-4 -translate-y-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  }), []);

  const positions: WatermarkPosition[] = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-3/5">
        <div className="w-full bg-black rounded-lg overflow-hidden shadow-xl relative aspect-video">
          {isUrlBased ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                <LinkIcon className="h-16 w-16 mb-4" />
                <h3 className="text-lg font-semibold text-white">Video from Link</h3>
                <p className="text-sm text-center">This is a placeholder for the video.</p>
            </div>
          ) : (
            <video src={videoUrl} controls className="w-full h-full"></video>
          )}
          {config.imageUrl && (
            <img
              src={config.imageUrl}
              alt="Watermark preview"
              className={`absolute ${positionClasses[config.position]} pointer-events-none transition-all duration-200`}
              style={{
                opacity: config.opacity,
                width: `${config.size}%`,
                height: 'auto',
              }}
            />
          )}
        </div>
      </div>
      <div className="lg:w-2/5 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Customize Watermark</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="watermark-image-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Watermark Image
            </label>
            <div className="flex items-center gap-4">
              {config.imageUrl && (
                <img src={config.imageUrl} alt="Current watermark" className="w-16 h-16 object-cover rounded-md border p-1" />
              )}
              <label htmlFor="watermark-image-upload" className="cursor-pointer bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-colors">
                Change Image
              </label>
              <input
                id="watermark-image-upload"
                type="file"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {positions.map(pos => (
                <button
                  key={pos}
                  onClick={() => setConfig({ ...config, position: pos })}
                  className={`p-3 border rounded-lg flex justify-center items-center transition-colors ${config.position === pos ? 'bg-orange-500 border-orange-500' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}
                  title={pos}
                >
                  <div className={`w-4 h-4 rounded-full ${config.position === pos ? 'bg-white' : 'bg-gray-400'}`}></div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="watermark-size" className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <div className="flex items-center gap-4">
              <input
                id="watermark-size"
                type="range"
                min="5" max="50" step="1"
                value={config.size}
                onChange={(e) => setConfig({ ...config, size: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className="text-sm font-medium text-gray-600 w-12 text-center bg-gray-100 py-1 rounded-md">{config.size}%</span>
            </div>
          </div>
          <div>
            <label htmlFor="watermark-opacity" className="block text-sm font-medium text-gray-700 mb-1">Opacity</label>
            <div className="flex items-center gap-4">
              <input
                id="watermark-opacity"
                type="range"
                min="0.1" max="1" step="0.05"
                value={config.opacity}
                onChange={(e) => setConfig({ ...config, opacity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className="text-sm font-medium text-gray-600 w-12 text-center bg-gray-100 py-1 rounded-md">{Math.round(config.opacity * 100)}%</span>
            </div>
          </div>
        </div>
        <div className="mt-auto pt-6 flex gap-4">
          <button onClick={onBack} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors">
            Back
          </button>
          <button onClick={handleApply} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
            Apply Watermark
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatermarkEditor;