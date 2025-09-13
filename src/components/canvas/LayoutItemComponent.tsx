// components/LayoutItemComponent.tsx
import React, { useRef, useCallback, useMemo, useContext, memo } from 'react';
import { Group, Rect, Text, Path, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { LayoutItemComponentProps } from '@/types/canvas';
import { PerformanceContext } from '@/context/PerformanceContext';
import { LAYOUT_ITEM_CONFIGS, TABLE_STATUS_COLORS } from '@/utils/tableConfig';
import { LAYOUT_ITEM_SVG_PATHS } from "@/utils/compoents";
import { getBackgroundColorForItemType } from '@/lib/colorCode';
import { constrainCenteredItem, constrainTopLeftItem, constrainToRoom, getViewBoxDimensions } from '@/utils/canvasUtils';
import { TableItem, UtilityItem, RoomItem, SeatingStatus } from '@/types/restaurant';
import RoomResizeHandles from './RoomResizeHandles';
import { useRestaurant } from '@/context/RestaurantContext';

// Type guard functions
const isTableItem = (item: any): item is TableItem => {
    return item.type.startsWith("table-");
};

const isUtilityItem = (item: any): item is UtilityItem => {
    return ['washroom', 'counter', 'entry-gate', 'exit-gate', 'elevator', 'stair'].includes(item.type);
};

const isRoomItem = (item: any): item is RoomItem => {
    return item.type === "room";
};

const getLodLevel = (scale: number) => {
    if (scale > 0.8) return 'high';     // Full detail
    if (scale > 0.5) return 'medium';   // Reduced detail
    if (scale > 0.2) return 'low';      // Basic shapes
    return 'minimal';                   // Outlines only
};

const LayoutItemComponent: React.FC<LayoutItemComponentProps> = memo(function LayoutItemComponent({
    layoutItem: item,
    isSelected,
    isLocked,
    onSelect,
    onUpdate,
    rooms = [],
}) {
    const { scale, canvasBounds } = useContext(PerformanceContext);
    const { dispatch } = useRestaurant();
    const groupRef = useRef<any>(null);
    const isDraggingRef = useRef(false);
    const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
    const initialPosRef = useRef<{ x: number; y: number } | null>(null);

    // Determine if this is a table (show SVG) or other item (show image)
    const isTable = isTableItem(item);
    const isRoom = isRoomItem(item);

    // Import the image hook for non-table items
    const [image] = useImage(
        (isTable || isRoom) ? "" : LAYOUT_ITEM_CONFIGS[item.type]?.image || ""
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

    // Get LOD level based on scale
    const lodLevel = getLodLevel(scale);

    const handleMouseDown = useCallback((e: any) => {
        // Check if we're currently resizing - if so, don't handle this event
        const stage = e.target.getStage();
        if (stage?.getAttr('isResizing')) {
            return;
        }

        e.evt.preventDefault();
        e.evt.stopPropagation();

        // Always allow selection, even when locked
        onSelect();

        // If locked, don't allow dragging
        if (isLocked) return;

        const pointer = stage?.getPointerPosition();

        if (pointer && groupRef.current) {
            mouseDownPosRef.current = { x: pointer.x, y: pointer.y };

            // Get current position based on whether item is in a room or not
            const currentPos = groupRef.current.position();
            initialPosRef.current = { x: currentPos.x, y: currentPos.y };

            isDraggingRef.current = false;

            // Disable stage dragging
            if (stage) stage.draggable(false);

            // Add mouse move and up listeners to window
            const handleMouseMove = () => {
                // Double check we're not resizing during mouse move
                if (stage?.getAttr('isResizing')) {
                    return;
                }

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

                    // Use the appropriate constraint based on item type
                    let constrainedPos;

                    if (item.type === "room") {
                        // Rooms use top-left constraint
                        constrainedPos = constrainTopLeftItem(
                            newPos,
                            { width: item.width, height: item.height },
                            canvasBounds
                        );
                    } else if (item.roomId) {
                        // ITEMS INSIDE ROOMS - CONSTRAIN TO ROOM BOUNDARIES
                        // Find the parent room
                        const parentRoom = rooms.find(room => room.id === item.roomId);
                        if (parentRoom) {
                            // Convert absolute position to relative room position
                            const relativePos = {
                                x: newPos.x - parentRoom.x,
                                y: newPos.y - parentRoom.y
                            };

                            // Constrain within room boundaries
                            const constrainedRelativePos = constrainToRoom(
                                relativePos,
                                { width: item.width, height: item.height },
                                parentRoom
                            );

                            // Convert back to absolute position for visual dragging
                            constrainedPos = {
                                x: parentRoom.x + constrainedRelativePos.x,
                                y: parentRoom.y + constrainedRelativePos.y
                            };
                        } else {
                            // Fallback: centered constraint
                            constrainedPos = constrainCenteredItem(
                                newPos,
                                { width: item.width, height: item.height },
                                canvasBounds
                            );
                        }
                    } else {
                        // Items outside rooms use centered constraint
                        constrainedPos = constrainCenteredItem(
                            newPos,
                            { width: item.width, height: item.height },
                            canvasBounds
                        );
                    }

                    groupRef.current.position(constrainedPos);
                }
            };

            const handleMouseUp = () => {
                // Check one more time if we're resizing
                if (stage?.getAttr('isResizing')) {
                    // Clean up but don't update position
                    isDraggingRef.current = false;
                    mouseDownPosRef.current = null;
                    initialPosRef.current = null;
                    return;
                }

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
    }, [item, onSelect, onUpdate, scale, canvasBounds, isLocked, rooms]); // Added rooms to dependencies

    // Cursor style based on lock state
    const cursorStyle = isLocked ? 'pointer' : 'move';

    // Get display text based on item type
    const getDisplayText = () => {
        if (isTableItem(item)) {
            return item.tableNumber;
        } else if (isRoomItem(item) || isUtilityItem(item)) {
            return item.name || '';
        }
        return '';
    };

    const handleRoomResize = useCallback((width: number, height: number) => {
        dispatch({
            type: "RESIZE_ITEM",
            payload: {
                itemId: item.id,
                width,
                height
            }
        });
    }, [item.id, dispatch]);

    // Special rendering for rooms
    if (isRoom) {
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
                {/* Room background with LOD */}
                {lodLevel !== 'minimal' && (
                    <Rect
                        width={item.width}
                        height={item.height}
                        fill={lodLevel === 'high' ? "rgba(255, 245, 235, 0.7)" : "rgba(255, 245, 235, 0.4)"}
                        stroke={isSelected ? "#3b82f6" : "#fdba74"}
                        strokeWidth={isSelected ? 2 : 1}
                        cornerRadius={6}
                        dash={lodLevel === 'high' ? [4, 4] : [6, 3]}
                    />
                )}

                {/* Room outline for minimal zoom */}
                {lodLevel === 'minimal' && (
                    <Rect
                        width={item.width}
                        height={item.height}
                        fill="rgba(255, 247, 237, 0.2)"
                        stroke="#fdba74"
                        strokeWidth={1}
                        dash={[8, 4]}
                    />
                )}

                {/* Room name - BOTTOM CENTER FIXED */}
                {lodLevel !== 'minimal' && lodLevel !== 'low' && (
                    <Text
                        x={item.width / 2} // Center horizontally
                        y={item.height + 8} // Position below the room
                        width={item.width}
                        height={18}
                        text={item.name || 'Room'}
                        fontSize={Math.max(10, Math.min(12, item.width / 10))}
                        fontFamily="Arial"
                        fontStyle="bold"
                        fill="#7c2d12"
                        align="center"
                        verticalAlign="middle"
                        offsetX={item.width / 2} // This centers the text properly
                        listening={false} // Prevent text from blocking clicks
                    />
                )}

                {/* Selection border */}
                {isSelected && lodLevel !== 'minimal' && (
                    <Rect
                        width={item.width}
                        height={item.height}
                        stroke={isLocked ? "#ef4444" : "#3b82f6"}
                        strokeWidth={2}
                        dash={isLocked ? [3, 3] : [6, 3]}
                        fill="transparent"
                        cornerRadius={6}
                    />
                )}

                {/* Lock indicator - only at high detail */}
                {isLocked && isSelected && lodLevel === 'high' && (
                    <Rect
                        x={item.width - 24}
                        y={6}
                        width={16}
                        height={16}
                        fill="#ef4444"
                        cornerRadius={8}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                    />
                )}

                <RoomResizeHandles
                    room={item as RoomItem}
                    isSelected={isSelected}
                    isLocked={isLocked}
                    scale={scale}
                    onResize={handleRoomResize}
                />
            </Group>
        );
    }
    // Regular item rendering with LOD
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
            {/* Render based on LOD level */}
            {isTable ? (
                // TABLE RENDERING
                <>
                    {/* High detail: Full SVG */}
                    {lodLevel === 'high' && svgConfig && (
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

                    {/* Medium detail: Colored rectangle */}
                    {lodLevel === 'medium' && (
                        <Rect
                            width={item.width}
                            height={item.height}
                            fill={getBackgroundColorForItemType(item.type)}
                            cornerRadius={6}
                            offsetX={item.width / 2}
                            offsetY={item.height / 2}
                        />
                    )}

                    {/* Low detail: Smaller rectangle */}
                    {lodLevel === 'low' && (
                        <Rect
                            width={item.width * 0.7}
                            height={item.height * 0.7}
                            fill={getBackgroundColorForItemType(item.type)}
                            cornerRadius={4}
                            offsetX={item.width * 0.35}
                            offsetY={item.height * 0.35}
                        />
                    )}

                    {/* Minimal detail: Tiny dot */}
                    {lodLevel === 'minimal' && (
                        <Rect
                            width={item.width * 0.4}
                            height={item.height * 0.4}
                            fill={getBackgroundColorForItemType(item.type)}
                            cornerRadius={2}
                            offsetX={item.width * 0.2}
                            offsetY={item.height * 0.2}
                        />
                    )}

                    {/* Status indicator - only at high detail */}
                    {lodLevel === 'high' && isTableItem(item) && item.status && (
                        <Rect
                            x={-6}
                            y={-6}
                            width={12}
                            height={12}
                            fill={TABLE_STATUS_COLORS[item.status as SeatingStatus]}
                            cornerRadius={6}
                            stroke="#ffffff"
                            strokeWidth={1.5}
                        />
                    )}
                </>
            ) : (
                // NON-TABLE RENDERING
                <>
                    {/* High detail: Image */}
                    {lodLevel === 'high' && image && (
                        <KonvaImage
                            image={image}
                            width={item.width}
                            height={item.height}
                            offsetX={item.width / 2}
                            offsetY={item.height / 2}
                        />
                    )}

                    {/* Medium to minimal detail: Colored shapes */}
                    {lodLevel !== 'high' && (
                        <Rect
                            width={item.width * (lodLevel === 'medium' ? 0.9 : lodLevel === 'low' ? 0.6 : 0.4)}
                            height={item.height * (lodLevel === 'medium' ? 0.9 : lodLevel === 'low' ? 0.6 : 0.4)}
                            fill={getBackgroundColorForItemType(item.type)}
                            cornerRadius={lodLevel === 'medium' ? 6 : 4}
                            offsetX={item.width * (lodLevel === 'medium' ? 0.45 : lodLevel === 'low' ? 0.3 : 0.2)}
                            offsetY={item.height * (lodLevel === 'medium' ? 0.45 : lodLevel === 'low' ? 0.3 : 0.2)}
                        />
                    )}
                </>
            )}

            {/* Item label - visible at medium zoom and higher */}
            {lodLevel !== 'minimal' && lodLevel !== 'low' && getDisplayText() && (
                <Text
                    x={-item.width * 0.5}
                    y={item.height * 0.5 + 4}
                    width={item.width}
                    height={16}
                    text={getDisplayText()}
                    fontSize={Math.max(10, Math.min(12, item.width / 8))}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill="#374151"
                    align="center"
                    verticalAlign="middle"
                />
            )}

            {/* Selection border - visible at all LOD levels except minimal */}
            {isSelected && lodLevel !== 'minimal' && (
                <Rect
                    width={item.width}
                    height={item.height}
                    offsetX={item.width * 0.5}
                    offsetY={item.height * 0.5}
                    stroke={isLocked ? "#ef4444" : "#3b82f6"}
                    strokeWidth={lodLevel === 'high' ? 2.5 : 1.5}
                    dash={isLocked ? [3, 3] : [6, 3]}
                    fill="transparent"
                />
            )}

            {item.roomId && isDraggingRef.current && (
                <Rect
                    x={-item.width * 0.5}
                    y={-item.height * 0.5}
                    width={item.width}
                    height={item.height}
                    stroke="#10b981"
                    strokeWidth={1}
                    dash={[2, 2]}
                    fill="rgba(16, 185, 129, 0.1)"
                />
            )}


            {/* Lock indicator - only at high detail */}
            {isLocked && isSelected && lodLevel === 'high' && (
                <Rect
                    x={item.width * 0.5 - 10}
                    y={-item.height * 0.5 - 10}
                    width={20}
                    height={20}
                    fill="#ef4444"
                    cornerRadius={10}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                />
            )}
        </Group>
    );
});

export default LayoutItemComponent;