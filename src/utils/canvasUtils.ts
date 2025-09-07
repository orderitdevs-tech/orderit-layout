// utils/canvasUtils.ts
import { CanvasBounds } from '@/types/canvas';

// Boundary constraint utility
export const constrainToCanvas = (
    position: { x: number; y: number },
    tableSize: { width: number; height: number },
    canvasBounds: CanvasBounds
) => {
    const halfWidth = tableSize.width * 0.5;
    const halfHeight = tableSize.height * 0.5;

    return {
        x: Math.max(
            canvasBounds.x + halfWidth,
            Math.min(canvasBounds.x + canvasBounds.width - halfWidth, position.x)
        ),
        y: Math.max(
            canvasBounds.y + halfHeight,
            Math.min(canvasBounds.y + canvasBounds.height - halfHeight, position.y)
        )
    };
};

// SVG dimensions calculator with caching
const svgDimensionsCache = new Map<string, { width: number; height: number }>();

export const getViewBoxDimensions = (viewBox: string) => {
    if (svgDimensionsCache.has(viewBox)) {
        return svgDimensionsCache.get(viewBox)!;
    }

    const [, , width, height] = viewBox.split(' ').map(Number);
    const dimensions = { width, height };
    svgDimensionsCache.set(viewBox, dimensions);
    return dimensions;
};

// Auto-fit calculation utility
export const calculateAutoFit = (
    stageWidth: number,
    stageHeight: number,
    floorDimensions: { width: number; height: number },
    restaurantFloorBounds: CanvasBounds
) => {
    const padding = 100;
    const adjustedStageHeight = stageHeight - 64; // Account for header

    const scaleX = (stageWidth - padding * 2) / floorDimensions.width;
    const scaleY = (adjustedStageHeight - padding * 2) / floorDimensions.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const scaledWidth = floorDimensions.width * scale;
    const scaledHeight = floorDimensions.height * scale;

    return {
        x: (stageWidth - scaledWidth) * 0.5 - restaurantFloorBounds.x * scale,
        y: (adjustedStageHeight - scaledHeight) * 0.5 - restaurantFloorBounds.y * scale,
        scale: scale
    };
};