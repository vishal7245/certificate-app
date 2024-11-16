'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Placeholder, PlaceholderStyle } from '../types';

interface Position {
  x: number;
  y: number;
}



interface Props {
  placeholder: Placeholder;
  scale: number;
  onPositionChange: (id: string, position: Position) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function DraggablePlaceholder({
  placeholder,
  scale,
  onPositionChange,
  onSelect,
  isSelected,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const initialMousePos = useRef<Position | null>(null);
  const initialElementPos = useRef<Position | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const touch = 'touches' in e ? e.touches[0] : e;
    
    setIsDragging(true);
    initialMousePos.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    initialElementPos.current = {
      x: placeholder.position.x,
      y: placeholder.position.y
    };
  }, [placeholder.position]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !initialMousePos.current || !initialElementPos.current) return;

    e.preventDefault();
    const touch = 'touches' in e ? e.touches[0] : e;
    
    const deltaX = (touch.clientX - initialMousePos.current.x) / scale;
    const deltaY = (touch.clientY - initialMousePos.current.y) / scale;

    const newX = Math.round(initialElementPos.current.x + deltaX);
    const newY = Math.round(initialElementPos.current.y + deltaY);

    onPositionChange(placeholder.id, { x: newX, y: newY });
  }, [isDragging, scale, onPositionChange, placeholder.id]);

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    const touch = 'changedTouches' in e ? e.changedTouches[0] : e;
    
    if (initialMousePos.current) {
      // Calculate total movement distance
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - initialMousePos.current.x, 2) +
        Math.pow(touch.clientY - initialMousePos.current.y, 2)
      );
      
      // If movement was minimal (like a tap/click), trigger select
      if (moveDistance < 5 && onSelect) {
        onSelect(placeholder.id);
      }
    }

    setIsDragging(false);
    initialMousePos.current = null;
    initialElementPos.current = null;
  }, [onSelect, placeholder.id]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${placeholder.position.x * scale}px`,
    top: `${placeholder.position.y * scale}px`,
    transform: 'translate(-50%, -50%)',
    cursor: 'move',
    opacity: isDragging ? 0.8 : 1,
    touchAction: 'none',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    zIndex: isDragging ? 1000 : 1,
    fontFamily: placeholder.style.fontFamily,
    fontSize: `${placeholder.style.fontSize * scale}px`,
    color: placeholder.style.fontColor,
    fontWeight: placeholder.style.fontWeight,
    textAlign: placeholder.style.textAlign,
  };

  return (
    <div
      ref={ref}
      style={style}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      className={`bg-white shadow-sm transition-colors
                 ${isSelected ? 'border-2 border-blue-500 ring-2 ring-blue-300' : 'border border-black'}
                 text-black rounded px-1 text-2xl`}
    >
      {placeholder.name}
    </div>
  );
}