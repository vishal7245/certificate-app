import { useCallback, useEffect, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { ImageOff } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Style {
  Width: number;
  Height: number;
}

interface Signature {
  id: string;
  imageUrl?: string;
  position: Position;
  style: Style;
}

interface Props {
  signature: Signature;
  scale: number;
  onPositionChange: (id: string, position: Position) => void;
  onResize: (id: string, style: Style) => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

interface DragItem {
  id: string;
  type: string;
  initialPosition: Position;
}

export function ResizableDraggableSignature({
  signature,
  scale,
  onPositionChange,
  onResize,
  onSelect,
  isSelected,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const initialSize = useRef<Style | null>(null);
  const initialMousePos = useRef<Position | null>(null);

  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: 'signature',
    item: {
      id: signature.id,
      type: 'signature',
      initialPosition: signature.position,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isResizing,
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        const newX = Math.round(item.initialPosition.x + delta.x / scale);
        const newY = Math.round(item.initialPosition.y + delta.y / scale);
        onPositionChange(item.id, { x: newX, y: newY });
      }
    },
  }), [signature.id, signature.position, scale, isResizing]);

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !initialMousePos.current || !initialSize.current || !ref.current) return;

    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = (clientX - initialMousePos.current.x) / scale;
    const deltaY = (clientY - initialMousePos.current.y) / scale;

    // Maintain aspect ratio during resize
    const aspectRatio = initialSize.current.Width / initialSize.current.Height;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    let newWidth: number;
    let newHeight: number;

    if (absDeltaX > absDeltaY) {
      newWidth = Math.max(50, initialSize.current.Width + deltaX);
      newHeight = newWidth / aspectRatio;
    } else {
      newHeight = Math.max(50, initialSize.current.Height + deltaY);
      newWidth = newHeight * aspectRatio;
    }

    onResize(signature.id, {
      Width: Math.round(newWidth),
      Height: Math.round(newHeight),
    });
  }, [isResizing, scale, onResize, signature.id]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    initialMousePos.current = null;
    initialSize.current = null;
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsResizing(true);
    initialMousePos.current = { x: clientX, y: clientY };
    initialSize.current = {
      Width: signature.style.Width,
      Height: signature.style.Height,
    };
  }, [signature.style]);

  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleTouchMove = (e: TouchEvent) => handleResizeMove(e);
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleResizeEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleResizeEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  }, [onSelect]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    onResize(signature.id, { Width: 200, Height: 100 });
  }, [signature.id, onResize]);

  drag(ref);

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="absolute shadow-sm bg-white transition-colors"
      style={{
        left: `${signature.position.x * scale}px`,
        top: `${signature.position.y * scale}px`,
        width: `${signature.style.Width * scale}px`,
        height: `${signature.style.Height * scale}px`,
        transform: 'translate(-50%, -50%)',
        cursor: isResizing ? 'nwse-resize' : 'move',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging || isResizing ? 1000 : 1,
        border: isSelected ? '2px solid blue' : '1px solid transparent',
      }}
    >
      {!signature.imageUrl || imageError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <ImageOff className="w-8 h-8 text-gray-400" />
        </div>
      ) : (
        <img
          src={signature.imageUrl}
          alt="Signature"
          className="w-full h-full object-contain pointer-events-none"
          onError={handleImageError}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            onResize(signature.id, {
              Width: img.naturalWidth,
              Height: img.naturalHeight,
            });
          }}
        />
      )}

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize rounded-full"
        style={{
          transform: 'translate(50%, 50%)',
          touchAction: 'none',
        }}
      />
    </div>
  );
}