// TemplateCanvas.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { DraggablePlaceholder } from './DraggablePlaceholder';
import { Placeholder } from '@/app/types';

type Props = {
  imageUrl?: string;
  placeholders: Placeholder[];
  onPlaceholderMove: (id: string, position: { x: number; y: number }) => void;
};

export function TemplateCanvas({ imageUrl, placeholders, onPlaceholderMove }: Props) {
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [scale, setScale] = useState(1);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [, drop] = useDrop({
    accept: 'placeholder',
    drop: (item: Placeholder, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (clientOffset && canvasRect) {
        const x = (clientOffset.x - canvasRect.left) / scale;
        const y = (clientOffset.y - canvasRect.top) / scale;
        onPlaceholderMove(item.id, { x, y });
      }
    },
  });

  const setDropRef = (element: HTMLDivElement | null) => {
    if (element) {
      drop(element);
      canvasRef.current = element;
    }
  };

  // Set canvas size to match scaled image size
  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image();
      img.src = imageUrl;
      img.onload = () => {
        const viewportWidth = window.innerWidth * 0.9;
        const viewportHeight = window.innerHeight * 0.8;
        const widthScale = viewportWidth / img.width;
        const heightScale = viewportHeight / img.height;
        const newScale = Math.min(widthScale, heightScale, 1);

        setCanvasSize({ width: img.width * newScale, height: img.height * newScale });
        setScale(newScale);
      };
    }
  }, [imageUrl]);

  return (
    <div
      ref={setDropRef}
      style={{
        position: 'relative',
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        border: '1px solid #ddd',
        backgroundColor: '#f9fafb',
        overflow: 'hidden',
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Certificate template"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      )}
      {placeholders.map((placeholder) => (
        <DraggablePlaceholder
          key={placeholder.id}
          placeholder={placeholder}
          scale={scale} // Pass scale to placeholder
          onPositionChange={(id, position) => {
            onPlaceholderMove(id, position);
          }}
        />
      ))}
    </div>
  );
}
