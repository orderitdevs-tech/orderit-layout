// hooks/useResponsiveCanvas.ts
import { useState, useEffect, useCallback } from 'react';

interface UseResponsiveCanvasProps {
    width: number;
    height: number;
}

export function useResponsiveCanvas({ width, height }: UseResponsiveCanvasProps) {
    const [dimensions, setDimensions] = useState({
        width: width,
        height: height,
        isMobile: false,
        isTablet: false,
        isDesktop: false
    });

    const updateDimensions = useCallback(() => {
        const newWidth = width;
        const newHeight = height;

        const isMobile = newWidth < 768;
        const isTablet = newWidth >= 768 && newWidth < 1024;
        const isDesktop = newWidth >= 1024;

        setDimensions({
            width: newWidth,
            height: newHeight,
            isMobile,
            isTablet,
            isDesktop
        });
    }, [width, height]);

    useEffect(() => {
        updateDimensions();
    }, [updateDimensions]);

    const getResponsiveHeaderHeight = useCallback(() => {
        if (dimensions.isMobile) return 56; // Smaller header on mobile
        if (dimensions.isTablet) return 60;
        return 64; // Full header on desktop
    }, [dimensions]);

    const getResponsiveControlsWidth = useCallback(() => {
        if (dimensions.isMobile) return Math.min(320, dimensions.width - 32);
        if (dimensions.isTablet) return 360;
        return 400;
    }, [dimensions]);

    const getResponsivePadding = useCallback(() => {
        if (dimensions.isMobile) return 16;
        if (dimensions.isTablet) return 24;
        return 32;
    }, [dimensions]);

    return {
        dimensions,
        getResponsiveHeaderHeight,
        getResponsiveControlsWidth,
        getResponsivePadding
    };
}