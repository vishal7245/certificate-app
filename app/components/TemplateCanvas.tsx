'use client';

import { useEffect, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { DraggablePlaceholder } from './DraggablePlaceholder';
import { Placeholder } from '@/app/types';

type Props = {
  imageUrl?: string;
  placeholders: Placeholder[];
  onPlaceholderMove: (id: string, position: { x: number; y: number }) => void;
  onPlaceholderSelect?: (id: string | null) => void;
  selectedPlaceholderId?: string | null;
};

export function TemplateCanvas({ 
  imageUrl, 
  placeholders, 
  onPlaceholderMove,
  onPlaceholderSelect,
  selectedPlaceholderId 
}: Props) {
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [, drop] = useDrop({
    accept: 'placeholder',
    drop: (item: { id: string }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (clientOffset && canvasRect) {
        const x = (clientOffset.x - canvasRect.left) / scale;
        const y = (clientOffset.y - canvasRect.top) / scale;
        onPlaceholderMove(item.id, { x, y });
      }
    },
  });

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

        setCanvasSize({
          width: img.width * newScale,
          height: img.height * newScale,
        });
        setScale(newScale);
      };
    }
  }, [imageUrl]);

  const setDropRef = (element: HTMLDivElement | null) => {
    if (element) {
      drop(element);
      canvasRef.current = element;
    }
  };

  // Handle canvas click to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onPlaceholderSelect) {
      onPlaceholderSelect(null);
    }
  };

  return (
    <div
      ref={setDropRef}
      onClick={handleCanvasClick}
      style={{
        position: 'relative',
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        border: '1px solid #ddd',
        backgroundColor: '#f9fafb',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {imageUrl ? (
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
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#aaa',
            fontSize: '18px',
          }}
        >
          No template image uploaded
        </div>
      )}
      {placeholders.map((placeholder) => (
        <DraggablePlaceholder
          key={placeholder.id}
          placeholder={placeholder}
          scale={scale}
          onPositionChange={onPlaceholderMove}
          onSelect={onPlaceholderSelect ? () => onPlaceholderSelect(placeholder.id) : undefined}
          isSelected={selectedPlaceholderId === placeholder.id}
        />
      ))}
    </div>
  );
}