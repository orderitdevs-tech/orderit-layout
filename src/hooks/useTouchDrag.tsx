// Create this file: src/hooks/useTouchDrag.ts (or wherever your hooks are located)

import { useState, useRef, useCallback } from 'react';
import { LAYOUT_ITEM_CONFIGS } from '../utils/tableConfig';

interface TouchDragConfig {
    type: string;
    tableType: keyof typeof LAYOUT_ITEM_CONFIGS;
    config: any;
}

interface UseTouchDragReturn {
    isDragging: boolean;
    dragPreview: { x: number; y: number; config: TouchDragConfig } | null;
    handleTouchStart: (config: TouchDragConfig) => (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: (onDrop: (config: TouchDragConfig, position: { x: number; y: number }) => void) => (e: React.TouchEvent) => void;
}

export function useTouchDrag(): UseTouchDragReturn {
    const [isDragging, setIsDragging] = useState(false);
    const [dragPreview, setDragPreview] = useState<{ x: number; y: number; config: TouchDragConfig } | null>(null);
    const dragConfigRef = useRef<TouchDragConfig | null>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTouchStart = useCallback((config: TouchDragConfig) => (e: React.TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];

        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        dragConfigRef.current = config;

        // Clear any existing timeout
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
        }

        // Add a small delay to distinguish between tap and drag
        dragTimeoutRef.current = setTimeout(() => {
            if (dragConfigRef.current && touchStartRef.current) {
                setIsDragging(true);
                setDragPreview({
                    x: touch.clientX,
                    y: touch.clientY,
                    config
                });
            }
        }, 150);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging || !dragConfigRef.current) {
            // If we're not dragging yet, check if we should start
            if (dragConfigRef.current && touchStartRef.current) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
                const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

                // If moved more than 10px, start dragging immediately
                if (deltaX > 10 || deltaY > 10) {
                    if (dragTimeoutRef.current) {
                        clearTimeout(dragTimeoutRef.current);
                    }
                    setIsDragging(true);
                    setDragPreview({
                        x: touch.clientX,
                        y: touch.clientY,
                        config: dragConfigRef.current
                    });
                }
            }
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];

        setDragPreview(prev => prev ? {
            ...prev,
            x: touch.clientX,
            y: touch.clientY
        } : null);
    }, [isDragging]);

    const handleTouchEnd = useCallback((onDrop: (config: TouchDragConfig, position: { x: number; y: number }) => void) => (e: React.TouchEvent) => {
        // Clear timeout if drag didn't start yet
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }

        if (!isDragging || !dragConfigRef.current) {
            // Reset state even if we weren't dragging
            setIsDragging(false);
            setDragPreview(null);
            dragConfigRef.current = null;
            touchStartRef.current = null;
            return;
        }

        e.preventDefault();
        const touch = e.changedTouches[0];

        // Call the drop handler
        onDrop(dragConfigRef.current, { x: touch.clientX, y: touch.clientY });

        // Reset state
        setIsDragging(false);
        setDragPreview(null);
        dragConfigRef.current = null;
        touchStartRef.current = null;
    }, [isDragging]);

    return {
        isDragging,
        dragPreview,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    };
}