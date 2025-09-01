import React, { useState, useCallback } from 'react';
import UploadIcon from './icons/UploadIcon';
import TikTokIcon from './icons/TikTokIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import InstagramIcon from './icons/InstagramIcon';


interface FileUploadProps {
  mode: 'add' | 'remove';
  onFileSelect: (file: File) => void;
  onUrlSubmit: () => void;
  error: string | null;
  onClearError: () => void;
  onBack: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ mode, onFileSelect, onUrlSubmit, error, onClearError, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);
  
  const handleUrlFetch = () => {
    if (url.trim() === '') return;
    onUrlSubmit();
  };

  const titleText = mode === 'add' ? 'Add a Watermark' : 'Remove a Watermark';
  const dropText = mode === 'add' ? 'Drop your video to watermark' : 'Drop your video here';

  return (
    <div className="flex flex-col items-center justify-center">
       <button onClick={onBack} className="self-start mb-4 text-sm font-medium text-gray-600 hover:text-orange-500 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Back
       </button>
       <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{titleText}</h2>

       {error && (
        <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <strong className="font-bold">Oops!</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <button onClick={onClearError} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </button>
        </div>
      )}
      <label
        htmlFor="video-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-300
        ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
      >
        <UploadIcon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">
          {dropText} or <span className="text-orange-500">browse</span>
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          Supports MP4, MOV, AVI, etc. (Max 30 min, 2GB)
        </p>
      </label>
      <input
        id="video-upload"
        type="file"
        className="hidden"
        accept="video/*"
        onChange={handleFileChange}
      />

      <div className="w-full my-8 flex items-center text-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500 font-semibold">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div className="w-full">
        <h3 className="text-xl font-semibold text-gray-700 text-center mb-4">
          Paste a video link
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tiktok.com/..."
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            aria-label="Video URL"
          />
          <button
            onClick={handleUrlFetch}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:bg-orange-300 disabled:cursor-not-allowed"
            disabled={!url.trim()}
          >
            Fetch Video
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          Works with TikTok, YouTube, Instagram & more!
        </p>
        <div className="flex justify-center items-center space-x-6 mt-4">
          <TikTokIcon className="h-8 w-8 text-gray-400" />
          <YouTubeIcon className="h-9 w-9 text-gray-400" />
          <InstagramIcon className="h-8 w-8 text-gray-400" />
        </div>
      </div>

      {mode === 'remove' && (
        <p className="text-xs text-gray-500 mt-8 text-center max-w-md">
          <strong>Disclaimer:</strong> This is a demonstration tool. It simulates the process but{' '}
          <span className="font-semibold">does not actually remove watermarks</span> from your video.
        </p>
      )}
    </div>
  );
};

export default FileUpload;
