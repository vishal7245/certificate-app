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
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });

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
      setTouchOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
      setIsDraggingTouch(true);

      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault();
        const moveTouch = moveEvent.touches[0];
        const parentRect = element.parentElement?.getBoundingClientRect();
        
        if (parentRect) {
          const x = (moveTouch.clientX - parentRect.left - touchOffset.x) / scale;
          const y = (moveTouch.clientY - parentRect.top - touchOffset.y) / scale;
          onPositionChange(placeholder.id, { x, y });
        }
      };

      const handleTouchEnd = () => {
        setIsDraggingTouch(false);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
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