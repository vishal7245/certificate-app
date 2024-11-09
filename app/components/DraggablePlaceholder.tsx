'use client';

import { useDrag } from 'react-dnd';
import { Placeholder } from '@/app/types';
import { useRef, useLayoutEffect } from 'react';

type Props = {
  placeholder: Placeholder;
  scale: number;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
};

export function DraggablePlaceholder({ placeholder, scale, onPositionChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [{ isDragging, initialOffset, differenceFromInitialOffset }, drag] = useDrag({
    type: 'placeholder',
    item: { id: placeholder.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      initialOffset: monitor.getInitialClientOffset(),
      differenceFromInitialOffset: monitor.getDifferenceFromInitialOffset(),
    }),
  });

  useLayoutEffect(() => {
    if (isDragging && differenceFromInitialOffset && ref.current) {
      const newX =
        placeholder.position.x + differenceFromInitialOffset.x / scale;
      const newY =
        placeholder.position.y + differenceFromInitialOffset.y / scale;
      onPositionChange(placeholder.id, { x: newX, y: newY });
    }
  }, [isDragging, differenceFromInitialOffset]);

  drag(ref);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: placeholder.position.x * scale,
    top: placeholder.position.y * scale,
    transform: 'translate(-50%, -50%)', // Center the placeholder
    cursor: 'move',
  };

  return (
    <div
      ref={ref}
      style={style}
      className="bg-white border border-black text-black rounded px-4 py-2 text-2xl shadow-sm"
    >
      {placeholder.name}
    </div>
  );
}
