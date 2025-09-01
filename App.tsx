
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, WatermarkConfig, WatermarkArea } from './types';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import VideoProcessor from './components/VideoProcessor';
import ResultDisplay from './components/ResultDisplay';
import ActionSelector from './components/ActionSelector';
import WatermarkEditor from './components/WatermarkEditor';
import WatermarkSelector from './components/WatermarkSelector';
import WatermarkDetector from './components/WatermarkDetector';
import { getWatermarkTips, detectWatermark, analyzeAudioForWatermarks, removeWatermarkFromFrame } from './services/geminiService';
import { userPhotoBase64 } from './assets/user-photo';
import { sampleVideoFile } from './assets/sample-video';

const sampleUrl = URL.createObjectURL(sampleVideoFile);

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.DEMO);
  const [mode, setMode] = useState<'remove' | 'add' | null>('remove');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('Initializing...');
  const [aiTips, setAiTips] = useState<string>('');
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUrlBased, setIsUrlBased] = useState(false);
  const [watermarkArea, setWatermarkArea] = useState<WatermarkArea | null>({ x: 75, y: 78, width: 22, height: 12 });
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [audioWatermarkDetected, setAudioWatermarkDetected] = useState<boolean | null>(null);
  const [processedFrameUrl, setProcessedFrameUrl] = useState<string | null>(null);
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
    imageUrl: userPhotoBase64,
    position: 'bottom-right',
    opacity: 0.8,
    size: 20,
  });

  const processingMessages = {
    remove: [
      'Calibrating bear-vision AI...',
      'Analyzing user-defined watermark area...',
      'Isolating watermark layer...',
      'Generating inpainting mask...',
      'Reconstructing background with generative fill...',
      'Finalizing render and compressing...',
    ],
    add: [
      'Preparing video canvas...',
      'Calibrating watermark position...',
      'Rendering image layer...',
      'Applying opacity and size filters...',
      'Merging layers...',
      'Finalizing and compressing...',
    ]
  };

  const handleActionSelect = (selectedMode: 'remove' | 'add') => {
    setMode(selectedMode);
    setAppState(AppState.UPLOAD);
  };

  const handleFileSelect = (file: File) => {
    const videoDurationLimit = 30 * 60;
    const videoSizeLimit = 2 * 1024 * 1024 * 1024;

    if (file.size > videoSizeLimit) {
      setError('File is too large. Please select a video under 2GB.');
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > videoDurationLimit) {
        setError('Video is too long. Please select a video under 30 minutes.');
      } else {
        setError(null);
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setIsUrlBased(false);
        if (mode === 'add') {
          setAppState(AppState.EDITOR);
        } else {
          setAppState(AppState.DETECTING_WATERMARK);
        }
      }
    };
    video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        setError('Unsupported file format or corrupted video. Please try a different file.');
    };
    video.src = URL.createObjectURL(file);
  };

  const handleUrlSubmit = () => {
    setError(null);
    setVideoFile(null);
    setVideoUrl('');
    setIsUrlBased(true);
    if (mode === 'add') {
      setAppState(AppState.EDITOR);
    } else {
      setAppState(AppState.DETECTING_WATERMARK);
    }
  };
  
  const handleApplyWatermark = (config: WatermarkConfig) => {
    setWatermarkConfig(config);
    setAppState(AppState.PROCESSING);
  };

  const handleWatermarkAreaSelect = (area: WatermarkArea) => {
    setWatermarkArea(area);
    setAppState(AppState.PROCESSING);
  };

  const handleDemoConfirm = (area: WatermarkArea) => {
    setWatermarkArea(area);
    setVideoFile(sampleVideoFile);
    setVideoUrl(sampleUrl);
    setIsUrlBased(false);
    setAppState(AppState.PROCESSING);
  };

  const fetchAITips = useCallback(async () => {
    setIsLoadingTips(true);
    try {
      const tips = await getWatermarkTips();
      setAiTips(tips);
    } catch (err) {
      console.error(err);
      setAiTips('Could not fetch AI tips at the moment. Please try again later.');
    } finally {
      setIsLoadingTips(false);
    }
  }, []);

  const extractFrame = useCallback((videoUrlToProcess: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = "anonymous";
      video.src = videoUrlToProcess;
      video.currentTime = 0.1; // Seek to a very early frame

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      };
      video.onerror = (e) => {
        console.error("Video error:", video.error);
        reject(new Error('Failed to load video for frame extraction.'));
      }
    });
  }, []);
  
  const drawSelectionOnFrame = useCallback((base64Frame: string, area: WatermarkArea): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `data:image/jpeg;base64,${base64Frame}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));

            ctx.drawImage(img, 0, 0);

            const x = (area.x / 100) * canvas.width;
            const y = (area.y / 100) * canvas.height;
            const width = (area.width / 100) * canvas.width;
            const height = (area.height / 100) * canvas.height;
            
            ctx.strokeStyle = '#FF0000'; // Bright Red
            ctx.lineWidth = Math.max(2, Math.min(canvas.width, canvas.height) * 0.005);
            ctx.strokeRect(x, y, width, height);

            resolve(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]);
        };
        img.onerror = () => reject(new Error('Failed to load image for drawing.'));
    });
  }, []);

  useEffect(() => {
    if (appState === AppState.DETECTING_WATERMARK && mode === 'remove') {
      const runDetection = async () => {
        setDetectionError(null);
        setAudioWatermarkDetected(null);

        const audioAnalysis = analyzeAudioForWatermarks(videoFile);
        let visualAnalysis: Promise<WatermarkArea | null>;

        if (isUrlBased) {
          visualAnalysis = new Promise(resolve => {
            setTimeout(() => resolve({ x: 75, y: 80, width: 20, height: 15 }), 2500);
          });
        } else {
          visualAnalysis = extractFrame(videoUrl).then(detectWatermark);
        }

        try {
          const [audioResult, visualResult] = await Promise.all([audioAnalysis, visualAnalysis]);
          setAudioWatermarkDetected(audioResult);
          setWatermarkArea(visualResult);
        } catch (err) {
          console.error(err);
          setDetectionError('AI detection failed. Please select the area manually.');
          setWatermarkArea(null);
          setAudioWatermarkDetected(null);
        } finally {
          setAppState(AppState.SELECT_WATERMARK_AREA);
        }
      };
      runDetection();
    }
  }, [appState, mode, videoUrl, videoFile, isUrlBased, extractFrame]);


  useEffect(() => {
    if (appState !== AppState.PROCESSING) return;

    setProgress(0);
    setProcessingMessage('Initializing...');
    if (!aiTips) fetchAITips();

    const isDemo = videoFile === sampleVideoFile;

    // Demo or "Add Watermark" mode uses a simulated progress interval
    if (isDemo || mode === 'add') {
      const messages = isDemo ? processingMessages.remove : processingMessages.add;
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1;
          if (newProgress >= 100) {
            clearInterval(interval);
            if (isDemo) {
              setProcessedFrameUrl(null); // Ensures the blur fallback is used for demo
            }
            setAppState(AppState.RESULT);
            return 100;
          }
          const messageIndex = Math.floor((newProgress / 100) * messages.length);
          setProcessingMessage(messages[messageIndex] || 'Finalizing...');
          return newProgress;
        });
      }, 120);
      return () => clearInterval(interval);
    }

    // Real "Remove Watermark" mode for user-uploaded files
    if (mode === 'remove' && watermarkArea && videoUrl) {
      const processFrame = async () => {
        try {
          setProcessingMessage('Extracting video frame...');
          const frame = await extractFrame(videoUrl);
          setProgress(15);

          setProcessingMessage('Marking watermark area...');
          const markedFrame = await drawSelectionOnFrame(frame, watermarkArea);
          setProgress(30);

          setProcessingMessage('Asking AI to remove watermark...');
          const cleanFrame = await removeWatermarkFromFrame(markedFrame);
          setProgress(85);

          if (cleanFrame) {
            setProcessedFrameUrl(`data:image/jpeg;base64,${cleanFrame}`);
          } else {
            console.error("AI did not return a clean frame.");
            setProcessedFrameUrl(null);
          }
          
          setProcessingMessage('Finalizing...');
          setProgress(100);
          setAppState(AppState.RESULT);
        } catch (err) {
          const rawMessage = err instanceof Error ? err.message : 'An unknown error occurred';
          console.error('Error during watermark removal processing:', err);

          let userFriendlyError = 'An unexpected error occurred during processing. Please try again.';
          const lowerCaseMessage = rawMessage.toLowerCase();
          
          if (lowerCaseMessage.includes('rate limiting') || lowerCaseMessage.includes('429') || lowerCaseMessage.includes('resource_exhausted')) {
            userFriendlyError = 'AI Service Busy: The AI is currently experiencing high demand. Please try again in a few moments.';
          } else if (lowerCaseMessage.includes('frame extraction') || lowerCaseMessage.includes('corrupted')) {
            userFriendlyError = 'Video Processing Error: We were unable to read from your video file. It may be in an unsupported format or corrupted. Please try a different file.';
          } else if (lowerCaseMessage.includes('non-recoverable')) {
            userFriendlyError = 'AI Analysis Failed: The AI model could not process the selected area. This can happen with complex backgrounds. Please try selecting a slightly different area or use another video.';
          } else if (lowerCaseMessage.includes('ai service') || lowerCaseMessage.includes('gemini')) {
            userFriendlyError = 'AI Connection Error: A problem occurred while communicating with the AI. Please check your network connection and try again.';
          }

          setError(userFriendlyError);
          setAppState(AppState.SELECT_WATERMARK_AREA);
        }
      };
      processFrame();
    }
  }, [appState, fetchAITips, mode, watermarkArea, videoFile, videoUrl, extractFrame, drawSelectionOnFrame, aiTips, processingMessages]);


  const handleReset = () => {
    // We don't revoke the sampleUrl as it's static
    if (videoUrl && videoUrl !== sampleUrl) URL.revokeObjectURL(videoUrl);
    setAppState(AppState.SELECT_ACTION);
    setMode(null);
    setVideoFile(null);
    setVideoUrl('');
    setProgress(0);
    setError(null);
    setIsUrlBased(false);
    setWatermarkArea(null);
    setDetectionError(null);
    setProcessedFrameUrl(null);
    setAudioWatermarkDetected(null);
    setAiTips('');
  };
  
  const handleBack = () => {
    if (appState === AppState.UPLOAD) {
        setAppState(AppState.SELECT_ACTION);
        return;
    }
    if (appState === AppState.EDITOR || appState === AppState.DETECTING_WATERMARK || appState === AppState.SELECT_WATERMARK_AREA) {
        if(isUrlBased) {
            setAppState(AppState.UPLOAD);
        } else {
            if(videoUrl && videoUrl !== sampleUrl) URL.revokeObjectURL(videoUrl);
            setVideoFile(null);
            setVideoUrl('');
            setAppState(AppState.UPLOAD);
        }
    }
  }

  const renderContent = () => {
    switch (appState) {
      case AppState.DEMO:
        return <WatermarkSelector
            videoUrl={sampleUrl}
            initialArea={watermarkArea}
            onConfirm={handleDemoConfirm}
            onBack={handleReset}
            isUrlBased={false}
            detectionError={null}
            instructionText="This is a demo video. The AI has detected a watermark. Adjust the selection or confirm to see the magic!"
            confirmButtonText="Remove Watermark"
        />;
      case AppState.UPLOAD:
        return <FileUpload mode={mode!} onFileSelect={handleFileSelect} onUrlSubmit={handleUrlSubmit} error={error} onClearError={() => setError(null)} onBack={handleBack} />;
      case AppState.EDITOR:
        return <WatermarkEditor videoUrl={videoUrl} initialConfig={watermarkConfig} onApply={handleApplyWatermark} onBack={handleBack} isUrlBased={isUrlBased} />;
      case AppState.DETECTING_WATERMARK:
        return <WatermarkDetector videoUrl={videoUrl} isUrlBased={isUrlBased} />;
      case AppState.SELECT_WATERMARK_AREA:
        return <WatermarkSelector videoUrl={videoUrl} initialArea={watermarkArea} onConfirm={handleWatermarkAreaSelect} onBack={handleBack} isUrlBased={isUrlBased} detectionError={detectionError} />;
      case AppState.PROCESSING:
        return <VideoProcessor progress={progress} message={processingMessage} videoUrl={videoUrl} mode={mode!} />;
      case AppState.RESULT:
        return <ResultDisplay mode={mode!} videoUrl={videoUrl} videoFile={videoFile} aiTips={aiTips} isLoadingTips={isLoadingTips} onReset={handleReset} isUrlBased={isUrlBased} watermarkConfig={watermarkConfig} watermarkArea={watermarkArea} audioWatermarkDetected={audioWatermarkDetected} processedFrameUrl={processedFrameUrl} />;
      case AppState.SELECT_ACTION:
      default:
        return <ActionSelector onSelect={handleActionSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main className="mt-8 bg-white rounded-2xl shadow-lg p-6 md:p-10 transition-all duration-300 ease-in-out">
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Watermark Bear. All Rights Reserved.</p>
            <p className="mt-1">A demonstration app showcasing React, Tailwind, and Gemini API.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
