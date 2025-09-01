import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WatermarkArea } from '../types';
import LinkIcon from './icons/LinkIcon';

interface WatermarkSelectorProps {
  videoUrl: string;
  initialArea: WatermarkArea | null;
  detectionError: string | null;
  onConfirm: (area: WatermarkArea) => void;
  onBack: () => void;
  isUrlBased: boolean;
  instructionText?: string;
  confirmButtonText?: string;
}

type Handle = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface InteractionState {
  mode: 'draw' | 'move' | 'resize';
  handle?: Handle;
  startPoint: { x: number; y: number };
  startSelection: WatermarkArea;
}

const WatermarkSelector: React.FC<WatermarkSelectorProps> = ({ 
  videoUrl, 
  initialArea, 
  onConfirm, 
  onBack, 
  isUrlBased, 
  detectionError,
  instructionText,
  confirmButtonText,
}) => {
  const [selection, setSelection] = useState<WatermarkArea | null>(initialArea);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setSelection(initialArea);
  }, [initialArea]);

  const getRelativeCoords = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // Clamp coordinates between 0 and 100
    return { 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, mode: 'draw' | 'move' | 'resize', handle?: Handle) => {
    e.stopPropagation();
    const startPoint = getRelativeCoords(e);
    
    if (mode === 'draw') {
      const newSelection = { x: startPoint.x, y: startPoint.y, width: 0, height: 0 };
      setSelection(newSelection);
      setInteraction({ mode, startPoint, startSelection: newSelection });
    } else if (selection) {
      setInteraction({ mode, handle, startPoint, startSelection: selection });
    }
  }, [getRelativeCoords, selection]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!interaction) return;
      e.preventDefault();

      const { mode, handle, startPoint, startSelection } = interaction;
      const currentPoint = getRelativeCoords(e);
      const deltaX = currentPoint.x - startPoint.x;
      const deltaY = currentPoint.y - startPoint.y;

      let newSelection = { ...startSelection };

      if (mode === 'draw') {
        newSelection = {
          x: Math.min(startPoint.x, currentPoint.x),
          y: Math.min(startPoint.y, currentPoint.y),
          width: Math.abs(deltaX),
          height: Math.abs(deltaY),
        };
      } else if (mode === 'move') {
        newSelection.x = startSelection.x + deltaX;
        newSelection.y = startSelection.y + deltaY;
      } else if (mode === 'resize' && handle) {
        let { x, y, width, height } = { ...startSelection };

        if (handle.includes('right')) width += deltaX;
        if (handle.includes('left')) { x += deltaX; width -= deltaX; }
        if (handle.includes('bottom')) height += deltaY;
        if (handle.includes('top')) { y += deltaY; height -= deltaY; }
        
        // Handle flipping (when a handle is dragged past the opposite edge)
        if (width < 0) { x += width; width = Math.abs(width); }
        if (height < 0) { y += height; height = Math.abs(height); }
        newSelection = { x, y, width, height };
      }
      
      // Clamp to boundaries (0-100)
      const minSize = 2; // 2% minimum size
      newSelection.x = Math.max(0, newSelection.x);
      newSelection.y = Math.max(0, newSelection.y);
      newSelection.width = Math.min(100 - newSelection.x, Math.max(minSize, newSelection.width));
      newSelection.height = Math.min(100 - newSelection.y, Math.max(minSize, newSelection.height));

      setSelection(newSelection);
    };
    
    const handleMouseUp = () => {
      // If a user just clicks or draws a tiny box, revert to the initial AI selection
      if (interaction?.mode === 'draw' && selection && (selection.width < 2 || selection.height < 2)) {
        setSelection(initialArea);
      }
      setInteraction(null);
    };

    if (interaction) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, getRelativeCoords, initialArea, selection]);


  const handleConfirm = () => {
    if (selection && selection.width > 1 && selection.height > 1) {
      onConfirm(selection);
    } else if (initialArea) {
      onConfirm(initialArea);
    }
  };
  
  const effectiveInstructionText = instructionText || (initialArea 
    ? "AI has detected a watermark. Move, resize, or confirm the selection."
    : "Click and drag on the video to draw a box around the watermark.");

  const effectiveConfirmText = confirmButtonText || 'Confirm Selection';

  const handles: { name: Handle; cursor: string; position: React.CSSProperties }[] = [
    { name: 'top-left', cursor: 'cursor-nwse-resize', position: { top: -6, left: -6 } },
    { name: 'top-center', cursor: 'cursor-ns-resize', position: { top: -6, left: '50%', transform: 'translateX(-50%)' } },
    { name: 'top-right', cursor: 'cursor-nesw-resize', position: { top: -6, right: -6 } },
    { name: 'center-left', cursor: 'cursor-ew-resize', position: { top: '50%', left: -6, transform: 'translateY(-50%)' } },
    { name: 'center-right', cursor: 'cursor-ew-resize', position: { top: '50%', right: -6, transform: 'translateY(-50%)' } },
    { name: 'bottom-left', cursor: 'cursor-nwse-resize', position: { bottom: -6, left: -6 } },
    { name: 'bottom-center', cursor: 'cursor-ns-resize', position: { bottom: -6, left: '50%', transform: 'translateX(-50%)' } },
    { name: 'bottom-right', cursor: 'cursor-nesw-resize', position: { bottom: -6, right: -6 } },
  ];

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2">Select Watermark Area</h2>
      <p className="text-gray-600 mb-4 text-center">{effectiveInstructionText}</p>
      
      {detectionError && (
        <div className="w-full bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <p>{detectionError}</p>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full max-w-xl bg-black rounded-lg overflow-hidden shadow-xl relative cursor-crosshair aspect-video touch-none"
        onMouseDown={(e) => handleMouseDown(e, 'draw')}
      >
        {isUrlBased ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 pointer-events-none">
            <LinkIcon className="h-16 w-16 mb-4" />
            <h3 className="text-lg font-semibold text-white">Video from Link</h3>
            <p className="text-sm text-center">This is a placeholder for the video.</p>
          </div>
        ) : (
          <video src={videoUrl} muted loop autoPlay playsInline className="w-full h-full pointer-events-none"></video>
        )}

        {selection && selection.width > 0 && selection.height > 0 && (
          <div
            className="absolute bg-orange-500/20 border-2 border-dashed border-orange-500 cursor-move"
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            style={{
              left: `${selection.x}%`,
              top: `${selection.y}%`,
              width: `${selection.width}%`,
              height: `${selection.height}%`,
            }}
          >
            {handles.map(({ name, cursor, position }) => (
                <div
                    key={name}
                    onMouseDown={(e) => handleMouseDown(e, 'resize', name)}
                    className={`absolute w-3 h-3 bg-white rounded-full border-2 border-orange-500 hover:scale-125 transition-transform ${cursor}`}
                    style={position}
                    aria-label={`resize ${name}`}
                />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 w-full max-w-xl flex flex-col sm:flex-row gap-4">
        <button onClick={onBack} className="w-full sm:w-auto flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors">
          Back
        </button>
        <button 
          onClick={handleConfirm} 
          disabled={!selection || selection.width < 1 || selection.height < 1}
          className="w-full sm:w-auto flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:bg-orange-300 disabled:cursor-not-allowed"
        >
          {effectiveConfirmText}
        </button>
      </div>
    </div>
  );
};

export default WatermarkSelector;