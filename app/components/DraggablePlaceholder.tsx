'use client';

import { useDrag } from 'react-dnd';
import { Placeholder } from '@/app/types';
import { useRef, useState } from 'react';

type Props = {
  placeholder: Placeholder;
  scale: number;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
};

export function DraggablePlaceholder({ placeholder, scale, onPositionChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);
  const initialTouchRef = useRef<{ x: number; y: number } | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'placeholder',
    item: { id: placeholder.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const element = ref.current;
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement?.getBoundingClientRect();
      
      if (parentRect) {
        // Store the initial position difference
        initialTouchRef.current = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        };
        setIsDraggingTouch(true);

        const handleTouchMove = (moveEvent: TouchEvent) => {
          moveEvent.preventDefault();
          const moveTouch = moveEvent.touches[0];
          
          if (initialTouchRef.current) {
            // Calculate new position considering the initial touch offset
            const newX = (moveTouch.clientX - parentRect.left - initialTouchRef.current.x) / scale;
            const newY = (moveTouch.clientY - parentRect.top - initialTouchRef.current.y) / scale;
            
            onPositionChange(placeholder.id, { 
              x: newX + (initialTouchRef.current.x / scale),
              y: newY + (initialTouchRef.current.y / scale)
            });
          }
        };

        const handleTouchEnd = () => {
          setIsDraggingTouch(false);
          initialTouchRef.current = null;
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
      }
    }
  };

  drag(ref);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${placeholder.position.x * scale}px`,
    top: `${placeholder.position.y * scale}px`,
    transform: 'translate(-50%, -50%)',
    cursor: 'move',
    opacity: isDragging || isDraggingTouch ? 0.8 : 1,
    touchAction: 'none',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    zIndex: isDragging || isDraggingTouch ? 1000 : 1,
  };

  return (
    <div
      ref={ref}
      style={style}
      onTouchStart={handleTouchStart}
      className="bg-white border border-black text-black rounded px-4 py-2 text-2xl shadow-sm"
    >
      {placeholder.name}
    </div>
  );
}