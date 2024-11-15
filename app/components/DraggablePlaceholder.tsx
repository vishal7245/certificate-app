'use client';

import { useDrag } from 'react-dnd';
import { Placeholder } from '@/app/types';
import { useRef, useState } from 'react';

type Props = {
  placeholder: Placeholder;
  scale: number;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onSelect?: () => void;
  isSelected?: boolean;
};

export function DraggablePlaceholder({ 
  placeholder, 
  scale, 
  onPositionChange, 
  onSelect,
  isSelected 
}: Props) {
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

        const handleTouchEnd = (endEvent: TouchEvent) => {
          setIsDraggingTouch(false);
          initialTouchRef.current = null;
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);

          // Only trigger select if it was a tap (no significant movement)
          if (endEvent.changedTouches[0]) {
            const endTouch = endEvent.changedTouches[0];
            const moveDistance = Math.sqrt(
              Math.pow(endTouch.clientX - touch.clientX, 2) +
              Math.pow(endTouch.clientY - touch.clientY, 2)
            );
            
            if (moveDistance < 5 && onSelect) { // 5px threshold for tap
              onSelect();
            }
          }
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
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
    fontFamily: placeholder.style.fontFamily,
    // Only scale the display size in the editor
    fontSize: `${placeholder.style.fontSize * scale}px`,
    color: placeholder.style.fontColor,
    fontWeight: placeholder.style.fontWeight,
    textAlign: placeholder.style.textAlign,
  };

  return (
    <div
      ref={ref}
      style={style}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className={`bg-white border ${isSelected ? 'border-blue-500 border-2' : 'border-black'} 
                 text-black rounded px-4 py-2 text-2xl shadow-sm
                 ${isSelected ? 'ring-2 ring-blue-300' : ''}`}
    >
      {placeholder.name}
    </div>
  );
}