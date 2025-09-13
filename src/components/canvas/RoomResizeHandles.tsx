import React, { useRef, useCallback, memo } from 'react';
import { Group, Rect, Circle } from 'react-konva';
import { RoomItem } from '@/types/restaurant';

interface RoomResizeHandlesProps {
    room: RoomItem;
    isSelected: boolean;
    isLocked: boolean;
    scale: number;
    onResize: (width: number, height: number) => void;
}

const RoomResizeHandles: React.FC<RoomResizeHandlesProps> = memo(function RoomResizeHandles({
    room,
    isSelected,
    isLocked,
    scale,
    onResize
}) {
    const resizeStartRef = useRef<{
        startWidth: number;
        startHeight: number;
        startPointerX: number;
        startPointerY: number;
    } | null>(null);

    const isResizingRef = useRef<'right' | 'bottom' | 'corner' | null>(null);

    const handleResizeStart = useCallback((direction: 'right' | 'bottom' | 'corner', e: any) => {
        // Aggressively prevent all event propagation
        e.evt.stopPropagation();
        e.evt.stopImmediatePropagation();
        e.evt.preventDefault();

        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        // Store initial dimensions and pointer position
        resizeStartRef.current = {
            startWidth: room.width,
            startHeight: room.height,
            startPointerX: pointerPos.x,
            startPointerY: pointerPos.y
        };

        isResizingRef.current = direction;

        // Completely disable stage dragging during resize
        stage.draggable(false);

        // Find the room group and disable its draggable property
        const roomGroup = e.target.getParent()?.getParent();
        if (roomGroup && roomGroup.draggable) {
            roomGroup.draggable(false);
        }

        // Set a flag on the stage to indicate we're resizing
        stage.setAttr('isResizing', true);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            // Prevent all default mouse behaviors during resize
            moveEvent.preventDefault();
            moveEvent.stopPropagation();

            if (!resizeStartRef.current || !isResizingRef.current || !stage) return;

            const currentPointer = stage.getPointerPosition();
            if (!currentPointer) return;

            // Calculate the raw pixel difference
            const deltaX = currentPointer.x - resizeStartRef.current.startPointerX;
            const deltaY = currentPointer.y - resizeStartRef.current.startPointerY;

            // Convert pixel delta to canvas coordinates (account for zoom)
            const canvasDeltaX = deltaX / scale;
            const canvasDeltaY = deltaY / scale;

            let newWidth = resizeStartRef.current.startWidth;
            let newHeight = resizeStartRef.current.startHeight;

            // Apply resize based on direction - keeping top-left corner fixed
            if (isResizingRef.current === 'right' || isResizingRef.current === 'corner') {
                newWidth = Math.max(300, resizeStartRef.current.startWidth + canvasDeltaX);
            }

            if (isResizingRef.current === 'bottom' || isResizingRef.current === 'corner') {
                newHeight = Math.max(200, resizeStartRef.current.startHeight + canvasDeltaY);
            }

            // Only call onResize with the new dimensions
            // The room's position (x, y) should remain unchanged
            onResize(newWidth, newHeight);
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            // Prevent event propagation on mouse up too
            upEvent.preventDefault();
            upEvent.stopPropagation();

            // Clear resize state
            resizeStartRef.current = null;
            isResizingRef.current = null;

            // Clear the resizing flag
            stage.setAttr('isResizing', false);

            // Re-enable dragging after a longer delay to ensure resize is complete
            setTimeout(() => {
                if (stage) {
                    stage.draggable(true);
                }

                // Re-enable room group dragging if it exists
                const roomGroup = e.target.getParent()?.getParent();
                if (roomGroup) {
                    roomGroup.draggable(true);
                }
            }, 100);

            // Remove event listeners
            document.removeEventListener('mousemove', handleMouseMove, { capture: true });
            document.removeEventListener('mouseup', handleMouseUp, { capture: true });
        };

        // Add event listeners with capture to intercept all mouse events
        document.addEventListener('mousemove', handleMouseMove, { capture: true, passive: false });
        document.addEventListener('mouseup', handleMouseUp, { capture: true, passive: false });
    }, [room.width, room.height, scale, onResize]);

    // Don't render handles if not selected, locked, or zoomed out too far
    if (!isSelected || isLocked || scale < 0.3) {
        return null;
    }

    // Calculate handle size based on zoom level
    const handleSize = Math.max(8, Math.min(12, 12 / scale));

    return (
        <Group>
            {/* Right handle */}
            <Rect
                x={room.width - handleSize / 2}
                y={room.height / 2 - handleSize}
                width={handleSize}
                height={handleSize * 2}
                fill="rgba(59, 130, 246, 0.8)"
                stroke="#1d4ed8"
                strokeWidth={1}
                cornerRadius={2}
                cursor="ew-resize"
                onMouseDown={(e) => handleResizeStart('right', e)}
                onTouchStart={(e) => handleResizeStart('right', e)}
            />

            {/* Bottom handle */}
            <Rect
                x={room.width / 2 - handleSize}
                y={room.height - handleSize / 2}
                width={handleSize * 2}
                height={handleSize}
                fill="rgba(59, 130, 246, 0.8)"
                stroke="#1d4ed8"
                strokeWidth={1}
                cornerRadius={2}
                cursor="ns-resize"
                onMouseDown={(e) => handleResizeStart('bottom', e)}
                onTouchStart={(e) => handleResizeStart('bottom', e)}
            />

            {/* Corner handle */}
            <Circle
                x={room.width}
                y={room.height}
                radius={handleSize}
                fill="rgba(59, 130, 246, 0.9)"
                stroke="#1d4ed8"
                strokeWidth={1}
                cursor="nwse-resize"
                onMouseDown={(e) => handleResizeStart('corner', e)}
                onTouchStart={(e) => handleResizeStart('corner', e)}
            />
        </Group>
    );
});

export default RoomResizeHandles;