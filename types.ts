export enum AppState {
  DEMO = 'DEMO',
  SELECT_ACTION = 'SELECT_ACTION',
  UPLOAD = 'UPLOAD',
  DETECTING_WATERMARK = 'DETECTING_WATERMARK',
  SELECT_WATERMARK_AREA = 'SELECT_WATERMARK_AREA',
  EDITOR = 'EDITOR',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
}

export type WatermarkPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkConfig {
  imageUrl: string | null;
  position: WatermarkPosition;
  opacity: number;
  size: number;
}

export interface WatermarkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}