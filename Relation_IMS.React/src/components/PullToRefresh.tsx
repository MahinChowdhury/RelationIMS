import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

interface PullToRefreshProps {
    children: ReactNode;
    scrollRef?: React.RefObject<HTMLElement>;
}

export default function PullToRefresh({ children, scrollRef }: PullToRefreshProps) {
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const pullThreshold = 120; // Distance needed to trigger refresh
    const maxPull = 160;

    const getClientY = (e: TouchEvent | MouseEvent) => {
        if ('touches' in e) {
            return e.touches[0].clientY;
        }
        return (e as MouseEvent).clientY;
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onTouchStart = (e: TouchEvent | MouseEvent) => {
            // Check scroll position from provided ref or from window/document
            const scrollElement = scrollRef?.current;
            const scrollTop = scrollElement ? scrollElement.scrollTop : window.scrollY;

            // Only allow pull if we are at the top
            if (scrollTop <= 5) {
                setStartY(getClientY(e));
                setIsPulling(true);
                setCurrentY(0);
            }
        };

        const onTouchMove = (e: TouchEvent | MouseEvent) => {
            if (!isPulling || refreshing) return;

            const scrollElement = scrollRef?.current;
            const scrollTop = scrollElement ? scrollElement.scrollTop : window.scrollY;

            if (scrollTop > 5) {
                setIsPulling(false);
                setCurrentY(0);
                return;
            }

            const y = getClientY(e);
            const distance = y - startY;

            if (distance > 0) {
                // Apply friction
                const pullDistance = Math.min(distance * 0.4, maxPull);
                setCurrentY(pullDistance);

                // Prevent default scrolling when pulling down
                if (e.cancelable) {
                    e.preventDefault();
                }
            } else {
                setCurrentY(0);
            }
        };

        const onTouchEnd = () => {
            if (!isPulling || refreshing) return;
            setIsPulling(false);

            if (currentY >= pullThreshold) {
                setRefreshing(true);
                // Snap to threshold and reload
                setCurrentY(pullThreshold);
                
                // Add a small delay for the spinner animation to show before reloading
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                // Snap back
                setCurrentY(0);
            }
        };

        // Add passive: false to allow e.preventDefault()
        container.addEventListener('touchstart', onTouchStart, { passive: true });
        container.addEventListener('touchmove', onTouchMove, { passive: false });
        container.addEventListener('touchend', onTouchEnd);
        
        container.addEventListener('mousedown', onTouchStart);
        window.addEventListener('mousemove', onTouchMove, { passive: false });
        window.addEventListener('mouseup', onTouchEnd);

        return () => {
            container.removeEventListener('touchstart', onTouchStart);
            container.removeEventListener('touchmove', onTouchMove);
            container.removeEventListener('touchend', onTouchEnd);
            
            container.removeEventListener('mousedown', onTouchStart);
            window.removeEventListener('mousemove', onTouchMove);
            window.removeEventListener('mouseup', onTouchEnd);
        };
    }, [isPulling, startY, refreshing, currentY, scrollRef]);

    return (
        <div ref={containerRef} className="relative w-full h-full flex flex-col">
            {/* Refresh Indicator */}
            <div 
                className="absolute top-0 left-0 right-0 flex justify-center z-50 transition-all duration-200"
                style={{ 
                    transform: `translateY(${refreshing ? 20 : currentY - 50}px)`,
                    opacity: currentY > 20 || refreshing ? 1 : 0,
                    // If not pulling, add a transition to smoothly return to top
                    transitionTimingFunction: isPulling ? 'linear' : 'ease-out',
                    transitionDuration: isPulling ? '0ms' : '300ms'
                }}
            >
                <div className="bg-white dark:bg-[#1a2e22] rounded-full shadow-lg p-2.5 flex items-center justify-center border border-gray-100 dark:border-[#2a4032] z-50">
                    <span 
                        className={`material-symbols-outlined text-[26px] text-primary ${refreshing ? 'animate-spin' : ''}`}
                        style={{ transform: `rotate(${currentY * 2.5}deg)` }}
                    >
                        refresh
                    </span>
                </div>
            </div>

            {/* Content wrapper */}
            <div 
                className="w-full h-full"
                style={{ 
                    transform: `translateY(${refreshing ? 60 : currentY}px)`,
                    transitionProperty: 'transform',
                    transitionTimingFunction: isPulling ? 'linear' : 'ease-out',
                    transitionDuration: isPulling ? '0ms' : '300ms'
                }}
            >
                {children}
            </div>
        </div>
    );
}
