// components/LayoutItemComponent.tsx
import React, { useRef, useCallback, useMemo, useContext, memo } from 'react';
import { Group, Rect, Text, Path, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { LayoutItemComponentProps } from '@/types/canvas';
import { PerformanceContext } from '@/context/PerformanceContext';
import { LAYOUT_ITEM_CONFIGS, TABLE_STATUS_COLORS } from '@/utils/tableConfig';
import { LAYOUT_ITEM_SVG_PATHS } from "@/utils/compoents";
import { getBackgroundColorForItemType } from '@/lib/colorCode';
import { constrainToCanvas, getViewBoxDimensions } from '@/utils/canvasUtils';

const LayoutItemComponent: React.FC<LayoutItemComponentProps> = memo(function LayoutItemComponent({
    layoutItem: item,
    isSelected,
    isLocked,
    onSelect,
    onUpdate,
}) {
    const { isLayoutItemVisible, scale, canvasBounds } = useContext(PerformanceContext);
    const groupRef = useRef<any>(null);
    const isDraggingRef = useRef(false);
    const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
    const initialPosRef = useRef<{ x: number; y: number } | null>(null);

    // Determine if this is a table (show SVG) or other item (show image)
    const isTable = item.type.startsWith("table-");

    // Import the image hook for non-table items
    const [image] = useImage(
        isTable ? "" : LAYOUT_ITEM_CONFIGS[item.type]?.image || ""
    );

    // SVG config for tables only
    const svgConfig = useMemo(() => {
        if (!isTable) return null;

        const svgData = LAYOUT_ITEM_SVG_PATHS[item.type];
        if (!svgData) return null;

        const viewBoxDims = getViewBoxDimensions(svgData.viewBox);
        const scaleX = item.width / viewBoxDims.width;
        const scaleY = item.height / viewBoxDims.height;
        const svgScale = Math.min(scaleX, scaleY) * 0.8;

        return { svgData, viewBoxDims, svgScale };
    }, [item.type, item.width, item.height, isTable]);

    const handleMouseDown = useCallback((e: any) => {
        e.evt.preventDefault();
        e.evt.stopPropagation();

        // Always allow selection, even when locked
        onSelect();

        // If locked, don't allow dragging
        if (isLocked) return;

        const stage = e.target.getStage();
        const pointer = stage?.getPointerPosition();

        if (pointer && groupRef.current) {
            mouseDownPosRef.current = { x: pointer.x, y: pointer.y };
            initialPosRef.current = { x: item.x, y: item.y };
            isDraggingRef.current = false;

            // Disable stage dragging
            if (stage) stage.draggable(false);

            // Add mouse move and up listeners to window
            const handleMouseMove = () => {
                if (!mouseDownPosRef.current || !initialPosRef.current || !groupRef.current) return;

                const currentPointer = stage?.getPointerPosition();
                if (!currentPointer) return;

                const deltaX = currentPointer.x - mouseDownPosRef.current.x;
                const deltaY = currentPointer.y - mouseDownPosRef.current.y;

                // Only start dragging if moved more than 3 pixels
                if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                    isDraggingRef.current = true;

                    const newPos = {
                        x: initialPosRef.current.x + deltaX / scale,
                        y: initialPosRef.current.y + deltaY / scale
                    };

                    const constrainedPos = constrainToCanvas(
                        newPos,
                        { width: item.width, height: item.height },
                        canvasBounds
                    );

                    groupRef.current.position(constrainedPos);
                }
            };

            const handleMouseUp = () => {
                if (isDraggingRef.current && groupRef.current) {
                    // Update position only if we actually dragged
                    const finalPos = groupRef.current.position();
                    onUpdate(finalPos);
                }

                // Clean up
                isDraggingRef.current = false;
                mouseDownPosRef.current = null;
                initialPosRef.current = null;

                // Re-enable stage dragging
                if (stage) {
                    setTimeout(() => stage.draggable(true), 50);
                }

                // Remove listeners
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
    }, [item, onSelect, onUpdate, scale, canvasBounds, isLocked]);

    // Early return after all hooks have been called
    if (!isLayoutItemVisible(item)) return null;

    const showDetails = scale > 0.7;
    const showText = scale > 0.5;
    const showSVG = scale > 0.4;
    const showBackground = scale < 0.4;

    // Cursor style based on lock state
    const cursorStyle = isLocked ? 'pointer' : 'move';

    return (
        <Group
            ref={groupRef}
            x={item.x}
            y={item.y}
            rotation={item.rotation}
            draggable={false}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            cursor={cursorStyle}
        >
            {/* Conditional Rendering: SVG for tables, Image for others */}
            {isTable ? (
                // TABLE RENDERING WITH SVG
                <>
                    {/* Background for SVG - Always visible until 10% zoom */}
                    {showBackground && (
                        <Rect
                            width={item.width * 0.9}
                            height={item.height * 0.9}
                            offsetX={item.width * 0.45}
                            offsetY={item.height * 0.45}
                            fill={getBackgroundColorForItemType(item.type)}
                            cornerRadius={8}
                            shadowColor="rgba(0,0,0,0.1)"
                            shadowBlur={4}
                            shadowOffset={{ x: 1, y: 1 }}
                        />
                    )}

                    {/* SVG Icon */}
                    {showSVG && svgConfig && (
                        <Path
                            data={svgConfig.svgData.path}
                            fill={svgConfig.svgData.fill}
                            stroke={svgConfig.svgData.stroke}
                            strokeWidth={1}
                            scaleX={svgConfig.svgScale}
                            scaleY={svgConfig.svgScale}
                            offsetX={svgConfig.viewBoxDims.width * 0.5}
                            offsetY={svgConfig.viewBoxDims.height * 0.5}
                        />
                    )}

                    {/* Status Indicator for tables */}
                    {showDetails && item.status && (
                        <Rect
                            x={-8}
                            y={-8}
                            width={16}
                            height={16}
                            fill={TABLE_STATUS_COLORS[item.status]}
                            cornerRadius={8}
                            stroke="#ffffff"
                            strokeWidth={2}
                        />
                    )}
                </>
            ) : (
                // NON-TABLE RENDERING WITH IMAGE
                <>
                    {/* Background for non-table items - visible at low zoom */}
                    {showBackground && (
                        <Rect
                            width={item.width * 0.9}
                            height={item.height * 0.9}
                            offsetX={item.width * 0.45}
                            offsetY={item.height * 0.45}
                            fill={getBackgroundColorForItemType(item.type)}
                            cornerRadius={8}
                            shadowColor="rgba(0,0,0,0.1)"
                            shadowBlur={4}
                            shadowOffset={{ x: 1, y: 1 }}
                        />
                    )}

                    {/* Image for non-table items - visible at higher zoom levels */}
                    {!showBackground && image ? (
                        <KonvaImage
                            image={image}
                            width={item.width}
                            height={item.height}
                            offsetX={item.width / 2}
                            offsetY={item.height / 2}
                            opacity={showSVG ? 1 : 0.8}
                        />
                    ) : !showBackground && !image && (
                        // Fallback rectangle if image doesn't load
                        <Rect
                            width={item.width}
                            height={item.height}
                            offsetX={item.width / 2}
                            offsetY={item.height / 2}
                            fill="#e5e7eb"
                            stroke="#9ca3af"
                            strokeWidth={1}
                            cornerRadius={8}
                        />
                    )}
                </>
            )}

            {/* Item Label (for tables and other items with labels) */}
            {showText && (item.tableNumber) && (
                <Text
                    x={-item.width * 0.5}
                    y={item.height * 0.5 + 5}
                    width={item.width}
                    height={20}
                    text={item.tableNumber || ''}
                    fontSize={Math.max(10, Math.min(14, item.width / 6))}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill="#374151"
                    align="center"
                    verticalAlign="middle"
                />
            )}

            {/* Selection Border */}
            {isSelected && (
                <Rect
                    width={item.width}
                    height={item.height}
                    offsetX={item.width * 0.5}
                    offsetY={item.height * 0.5}
                    stroke={isLocked ? "#ef4444" : "#3b82f6"}
                    strokeWidth={3}
                    dash={isLocked ? [4, 4] : [8, 4]}
                    fill="transparent"
                />
            )}

            {/* Lock Indicator */}
            {isLocked && isSelected && (
                <Rect
                    x={item.width * 0.5 - 12}
                    y={-item.height * 0.5 - 12}
                    width={24}
                    height={24}
                    fill="#ef4444"
                    cornerRadius={12}
                    stroke="#ffffff"
                    strokeWidth={2}
                />
            )}
        </Group>
    );
});

export default LayoutItemComponent;