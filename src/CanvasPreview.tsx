import React, { useRef, useEffect } from 'react';
import { useStore } from './store';
import { renderPhotoBorder } from './render';

const CanvasPreview: React.FC = () => {
  const { state } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = state.images.find(img => img.id === state.activeImageId);
  const config = state.config;

  // [REQ-REND-04] Re-run the render pipeline whenever the active image or config changes
  useEffect(() => {
    if (!activeImage || !canvasRef.current || !config) return;

    const img = new Image();
    img.src = activeImage.objectUrl;

    const draw = () => {
      if (!canvasRef.current) return;
      if (config.logo.dataUrl) {
        const logo = new Image();
        logo.src = config.logo.dataUrl;
        
        let logoDrawn = false;
        const drawWithLogo = () => {
          if (logoDrawn || !canvasRef.current) return;
          logoDrawn = true;
          renderPhotoBorder(canvasRef.current, activeImage, img, config, logo);
        };

        logo.onload = drawWithLogo;
        if (logo.complete) {
          drawWithLogo();
        }
      } else {
        renderPhotoBorder(canvasRef.current, activeImage, img, config, null);
      }
    };

    if (img.complete) {
      draw();
    } else {
      img.onload = draw;
    }
  }, [activeImage, config]);

  return (
    <div ref={containerRef} className="canvas-stage-inner">
      <canvas ref={canvasRef} className="preview-canvas" />
    </div>
  );
};

export default CanvasPreview;
