// components/VirtualGrid.tsx
import React, { memo, useContext } from 'react';
import { Line } from 'react-konva';
import { PerformanceContext } from '@/context/PerformanceContext';

const VirtualGrid: React.FC = memo(function VirtualGrid() {
    const { viewport, scale, canvasBounds } = useContext(PerformanceContext);

    if (scale < 0.3) return null;

    const gridSize = 40;
    const gridOpacity = Math.min(0.5, scale * 0.5);

    const buffer = 50;
    const startX = Math.max(canvasBounds.x, Math.floor((viewport.x - buffer) / gridSize) * gridSize);
    const endX = Math.min(canvasBounds.x + canvasBounds.width, Math.ceil((viewport.x + viewport.width + buffer) / gridSize) * gridSize);
    const startY = Math.max(canvasBounds.y, Math.floor((viewport.y - buffer) / gridSize) * gridSize);
    const endY = Math.min(canvasBounds.y + canvasBounds.height, Math.ceil((viewport.y + viewport.height + buffer) / gridSize) * gridSize);

    const lines = [];
    const step = scale > 0.7 ? gridSize : gridSize * 2;

    for (let x = startX; x <= endX; x += step) {
        if (x >= canvasBounds.x && x <= canvasBounds.x + canvasBounds.width) {
            lines.push(
                <Line
                    key={`v-${x}`}
                    points={[x, Math.max(startY, canvasBounds.y), x, Math.min(endY, canvasBounds.y + canvasBounds.height)]}
                    stroke="#e2e8f0"
                    strokeWidth={0.75}
                    opacity={gridOpacity}
                    listening={false}
                />
            );
        }
    }

    for (let y = startY; y <= endY; y += step) {
        if (y >= canvasBounds.y && y <= canvasBounds.y + canvasBounds.height) {
            lines.push(
                <Line
                    key={`h-${y}`}
                    points={[Math.max(startX, canvasBounds.x), y, Math.min(endX, canvasBounds.x + canvasBounds.width), y]}
                    stroke="#e2e8f0"
                    strokeWidth={0.75}
                    opacity={gridOpacity}
                    listening={false}
                />
            );
        }
    }

    return <>{lines}</>;
});

export default VirtualGrid;