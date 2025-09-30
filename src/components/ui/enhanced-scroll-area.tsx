import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  viewportRef?: React.RefObject<HTMLDivElement>;
  orientation?: 'horizontal' | 'vertical';
  showScrollbar?: boolean;
  smoothScroll?: boolean;
}

export const EnhancedScrollArea = React.forwardRef<HTMLDivElement, EnhancedScrollAreaProps>(
  (
    {
      className,
      children,
      viewportRef,
      orientation = 'horizontal',
      showScrollbar = true,
      smoothScroll = true,
          ...props
    },
    ref
  ) => {
    const internalViewportRef = useRef<HTMLDivElement>(null);
    const activeViewportRef = viewportRef || internalViewportRef;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Enable drag-to-scroll on touch devices
    useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      let isDown = false;
      let startX: number;
      let startY: number;
      let scrollLeft: number;
      let scrollTop: number;

      const handleMouseDown = (e: MouseEvent | TouchEvent) => {
        isDown = true;
        scrollContainer.classList.add('active');

        if ('touches' in e) {
          startX = e.touches[0].pageX - scrollContainer.offsetLeft;
          startY = e.touches[0].pageY - scrollContainer.offsetTop;
        } else {
          startX = e.pageX - scrollContainer.offsetLeft;
          startY = e.pageY - scrollContainer.offsetTop;
        }

        scrollLeft = scrollContainer.scrollLeft;
        scrollTop = scrollContainer.scrollTop;
      };

      const handleMouseUp = () => {
        isDown = false;
        scrollContainer.classList.remove('active');
      };

      const handleMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDown) return;
        e.preventDefault();

        let x, y;
        if ('touches' in e) {
          x = e.touches[0].pageX - scrollContainer.offsetLeft;
          y = e.touches[0].pageY - scrollContainer.offsetTop;
        } else {
          x = e.pageX - scrollContainer.offsetLeft;
          y = e.pageY - scrollContainer.offsetTop;
        }

        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;

        if (orientation === 'horizontal') {
          scrollContainer.scrollLeft = scrollLeft - walkX;
        } else {
          scrollContainer.scrollTop = scrollTop - walkY;
        }
      };

      // Mouse events
      scrollContainer.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);

      // Touch events
      scrollContainer.addEventListener('touchstart', handleMouseDown);
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);

      return () => {
        scrollContainer.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousemove', handleMouseMove);

        scrollContainer.removeEventListener('touchstart', handleMouseDown);
        window.removeEventListener('touchend', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
      };
    }, [orientation]);

    return (
      <div
        ref={node => {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          if (scrollContainerRef) {
            scrollContainerRef.current = node;
          }
        }}
        className={cn(
          'relative',
          orientation === 'horizontal' ? 'w-full overflow-x-auto' : 'h-full overflow-y-auto',
          !showScrollbar && orientation === 'horizontal' && 'scrollbar-hide',
          !showScrollbar && orientation === 'vertical' && 'scrollbar-hide-vertical',
          smoothScroll && 'scroll-smooth',
          className
        )}
        {...props}
      >
        <div ref={activeViewportRef} className={orientation === 'horizontal' ? 'w-max' : 'h-max'}>
          {children}
        </div>
      </div>
    );
  }
);

EnhancedScrollArea.displayName = 'EnhancedScrollArea';
