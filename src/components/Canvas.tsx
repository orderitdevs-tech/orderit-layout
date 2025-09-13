"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect
} from "react";
import {
  Stage,
  Layer,
  Rect,
  Group,
} from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { motion } from "framer-motion";

// Import existing context and utilities
import { useRestaurant } from "@/context/RestaurantContext";
import { CanvasProps } from "@/types/canvas";

// Import all the new components we created
import CanvasHeader from './canvas/CanvasHeader';
import FloorControls from './canvas/FloorControls';
import DragIndicator from './canvas/DragIndicator';
import VirtualGrid from './canvas/VirtualGrid';
import LayoutItemComponent from './canvas/LayoutItemComponent';
import RoomDropIndicator from './canvas/RoomDropIndicator';
import { PerformanceContext } from '../context/PerformanceContext';
import { useLayoutItemManager } from '../hooks/useLayoutItemManager';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { constrainCenteredItem, calculateAutoFit, constrainTopLeftItem, generateItemNumber } from '../utils/canvasUtils';
import { LayoutItem, RoomItem, TableItem, UtilityItem } from "@/types/restaurant";

// Helper function to determine capacity based on component type
const getCapacityFromComponentType = (componentType: string): number => {
  switch (componentType) {
    case "table-2":
      return 2;
    case "table-4":
      return 4;
    case "table-6":
      return 6;
    case "table-8":
      return 8;
    case "table-10":
      return 10;
    case "table-12":
      return 12;
    default:
      return 4;
  }
};

// Type guard functions
const isTableItem = (item: LayoutItem): item is TableItem => {
  return ['table-2', 'table-4', 'table-6', 'table-8', "table-10", 'table-12'].includes(item.type);
};

const isUtilityItem = (item: LayoutItem): item is UtilityItem => {
  return ['washroom', 'counter', 'entry-gate', 'exit-gate', 'elevator', 'stair'].includes(item.type);
};

const isRoomItem = (item: LayoutItem): item is RoomItem => {
  return item.type === 'room';
};

const getRoomId = (item: LayoutItem): string | undefined => {
  if (isTableItem(item) || isUtilityItem(item)) {
    return item.roomId;
  }
  return undefined;
};

export default function RestaurantCanvas({ width, height, onTouchDropReady }: CanvasProps) {
  const { state, dispatch, getCurrentFloorItems, toggleFloorLock, getItemsInRoom } = useRestaurant();
  const stageRef = useRef<any>(null);

  // Responsive canvas hook
  const { getResponsiveHeaderHeight } = useResponsiveCanvas({ width, height });

  // Lock state - main new feature
  const isLocked = state.layout.floor.isLocked;
  const [showSettings, setShowSettings] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const dragOverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Floor dimensions - now from the floor object
  const floorDimensions = useMemo(() => ({
    width: state.layout.floor.width,
    height: state.layout.floor.height
  }), [state.layout.floor.width, state.layout.floor.height]);

  const headerHeight = getResponsiveHeaderHeight();

  // Restaurant floor bounds
  const restaurantFloorBounds = useMemo(() => {
    const padding = 10;
    return {
      x: padding,
      y: padding,
      width: floorDimensions.width - (padding * 2),
      height: floorDimensions.height - (padding * 2)
    };
  }, [floorDimensions]);

  // Auto-fit calculation
  const calculateAutoFitForCanvas = useCallback(() => {
    return calculateAutoFit(width, height, floorDimensions, restaurantFloorBounds);
  }, [width, height, floorDimensions, restaurantFloorBounds]);

  // View state
  const [viewState, setViewState] = useState(() => ({ x: 0, y: 0, scale: 1 }));

  const items = getCurrentFloorItems();

  // Convert readonly array to mutable array for calculations
  const mutableItems = useMemo(() => [...items], [items]);

  // Separate items by type
  const { rooms, outsideItems, roomItemsMap } = useMemo(() => {
    const rooms = mutableItems.filter(isRoomItem);
    const outsideItems = mutableItems.filter(item => !getRoomId(item) && !isRoomItem(item));

    const roomItemsMap: Record<string, LayoutItem[]> = {};
    rooms.forEach(room => {
      roomItemsMap[room.id] = [...getItemsInRoom(room.id)];
    });

    return { rooms, outsideItems, roomItemsMap };
  }, [mutableItems, getItemsInRoom]);

  // Use the item manager hook with lock state
  const { selectHandlers, updateHandlers } = useLayoutItemManager({
    layoutItems: mutableItems,
    canvasBounds: restaurantFloorBounds,
    dispatch,
    isLocked
  });

  // Auto-fit on dimension changes
  useLayoutEffect(() => {
    setViewState(calculateAutoFitForCanvas());
  }, [calculateAutoFitForCanvas]);

  // Viewport calculation
  const viewport = useMemo(() => ({
    x: -viewState.x / viewState.scale,
    y: -viewState.y / viewState.scale,
    width: width / viewState.scale,
    height: (height - headerHeight) / viewState.scale,
  }), [viewState, width, height, headerHeight]);

  // Item visibility
  const isLayoutItemVisible = useCallback((item: LayoutItem) => {
    const buffer = 100;
    return (
      item.x > viewport.x - buffer &&
      item.x < viewport.x + viewport.width + buffer &&
      item.y > viewport.y - buffer &&
      item.y < viewport.y + viewport.height + buffer
    );
  }, [viewport]);

  // Special handling for room items - they should always be visible with their room
  const isRoomItemVisible = useCallback((room: RoomItem) => {
    // Room items are visible if their parent room is visible
    const roomBuffer = 100 * (1 / viewState.scale);
    const roomVisible = (
      room.x + room.width > viewport.x - roomBuffer &&
      room.x < viewport.x + viewport.width + roomBuffer &&
      room.y + room.height > viewport.y - roomBuffer &&
      room.y < viewport.y + viewport.height + roomBuffer
    );

    return roomVisible;
  }, [viewport, viewState.scale]);

  // Performance context value
  const performanceContextValue = useMemo(() => ({
    viewport,
    scale: viewState.scale,
    isLayoutItemVisible,
    canvasBounds: restaurantFloorBounds,
  }), [viewport, viewState.scale, isLayoutItemVisible, restaurantFloorBounds]);

  // Event handlers
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - viewState.x) / viewState.scale,
      y: (pointer.y - viewState.y) / viewState.scale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.05;
    const newScale = Math.max(0.1, Math.min(3, direction > 0 ? viewState.scale * factor : viewState.scale / factor));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setViewState({ x: newPos.x, y: newPos.y, scale: newScale });
  }, [viewState]);

  // Room drop detection
  const detectHoveredRoom = useCallback((clientX: number, clientY: number) => {
    if (!stageRef.current) return null;

    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();
    const stageX = ((clientX - rect.left) - viewState.x) / viewState.scale;
    const stageY = ((clientY - rect.top) - viewState.y) / viewState.scale;

    return rooms.find(room =>
      stageX >= room.x &&
      stageX <= room.x + room.width &&
      stageY >= room.y &&
      stageY <= room.y + room.height
    );
  }, [viewState, rooms]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
      dragOverTimeoutRef.current = null;
    }

    setIsDragOver(true);
  }, [isLocked]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isLocked) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.dataTransfer.dropEffect = 'copy';

    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
      dragOverTimeoutRef.current = null;
    }

    setIsDragOver(true);

    const hoveredRoom = detectHoveredRoom(e.clientX, e.clientY);
    setHoveredRoom(hoveredRoom?.id || null);
  }, [isLocked, detectHoveredRoom]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
    }

    dragOverTimeoutRef.current = setTimeout(() => {
      setIsDragOver(false);
      setHoveredRoom(null);
      dragOverTimeoutRef.current = null;
    }, 100);
  }, []);

  const createNewItem = useCallback((itemType: string, config: any, dropPosition: { x: number; y: number }) => {
    const capacity = getCapacityFromComponentType(itemType);

    const containingRoom = mutableItems.find(item =>
      item.type === "room" &&
      dropPosition.x >= item.x &&
      dropPosition.x <= item.x + item.width &&
      dropPosition.y >= item.y &&
      dropPosition.y <= item.y + item.height
    ) as RoomItem | undefined;

    const itemNumber = generateItemNumber(itemType, mutableItems, containingRoom?.id);
    let finalPosition = dropPosition;

    if (containingRoom && itemType !== "room") {
      finalPosition = {
        x: dropPosition.x - containingRoom.x,
        y: dropPosition.y - containingRoom.y
      };
    }

    let newItem: Omit<LayoutItem, "id">;

    if (itemType.startsWith("table-")) {
      newItem = {
        type: itemType as TableItem['type'],
        x: finalPosition.x,
        y: finalPosition.y,
        rotation: 0,
        width: config.width,
        height: config.height,
        tableNumber: itemNumber,
        status: containingRoom?.status || "available",
        capacity,
        roomId: containingRoom?.id,
      } as Omit<TableItem, "id">;
    } else if (itemType === "room") {
      newItem = {
        type: "room",
        x: finalPosition.x,
        y: finalPosition.y,
        rotation: 0,
        width: config.width,
        height: config.height,
        roomType: "booth_area",
        name: itemNumber,
        description: "",
        price: 0,
        status: "available",
        containedItems: [],
      } as Omit<RoomItem, "id">;
    } else {
      newItem = {
        type: itemType as UtilityItem['type'],
        x: finalPosition.x,
        y: finalPosition.y,
        rotation: 0,
        width: config.width,
        height: config.height,
        name: itemNumber,
        description: "",
        roomId: containingRoom?.id,
      } as Omit<UtilityItem, "id">;
    }

    dispatch({
      type: "ADD_ITEM",
      payload: {
        item: newItem,
        roomId: containingRoom?.id
      }
    });
  }, [mutableItems, dispatch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
      dragOverTimeoutRef.current = null;
    }

    setIsDragOver(false);
    setHoveredRoom(null);

    if (isLocked) return;

    if (!stageRef.current) return;

    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();
    const stageX = ((e.clientX - rect.left) - viewState.x) / viewState.scale;
    const stageY = ((e.clientY - rect.top) - viewState.y) / viewState.scale;

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "TABLE") {
        const config = data.config;
        const itemType = data.tableType;

        if (stageX >= restaurantFloorBounds.x &&
          stageX <= restaurantFloorBounds.x + restaurantFloorBounds.width &&
          stageY >= restaurantFloorBounds.y &&
          stageY <= restaurantFloorBounds.y + restaurantFloorBounds.height) {

          let constrainedPos;

          if (itemType === "room") {
            constrainedPos = constrainTopLeftItem(
              { x: stageX, y: stageY },
              { width: config.width, height: config.height },
              restaurantFloorBounds
            );
          } else {
            constrainedPos = constrainCenteredItem(
              { x: stageX, y: stageY },
              { width: config.width, height: config.height },
              restaurantFloorBounds
            );
          }

          createNewItem(itemType, config, constrainedPos);
        }
      }
    } catch (error) {
      console.error("Drop parsing error:", error);
    }
  }, [viewState, restaurantFloorBounds, isLocked, createNewItem]);

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      dispatch({ type: "SELECT_ITEM", payload: { itemId: null } });
    }
  }, [dispatch]);

  const handleStageDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (stage && e.target === stage) {
      const pos = stage.position();
      setViewState(prev => ({ ...prev, x: pos.x, y: pos.y }));
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (dragOverTimeoutRef.current) {
        clearTimeout(dragOverTimeoutRef.current);
      }
    };
  }, []);

  // Floor dimension controls
  const adjustFloorWidth = useCallback((delta: number) => {
    if (isLocked) return;
    const currentWidth = state.layout.floor.width;
    const newWidth = Math.max(800, Math.min(3000, currentWidth + delta));
    dispatch({
      type: "UPDATE_FLOOR_DIMENSIONS",
      payload: { dimensions: { width: newWidth, height: state.layout.floor.height } }
    });
  }, [state.layout.floor.width, state.layout.floor.height, dispatch, isLocked]);

  const adjustFloorHeight = useCallback((delta: number) => {
    if (isLocked) return;
    const currentHeight = state.layout.floor.height;
    const newHeight = Math.max(600, Math.min(2400, currentHeight + delta));
    dispatch({
      type: "UPDATE_FLOOR_DIMENSIONS",
      payload: { dimensions: { width: state.layout.floor.width, height: newHeight } }
    });
  }, [state.layout.floor.width, state.layout.floor.height, dispatch, isLocked]);

  // Touch drop handler
  const handleTouchDrop = useCallback((config: any, clientPosition: { x: number; y: number }) => {
    if (isLocked || !stageRef.current) return;

    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();
    const stageX = ((clientPosition.x - rect.left) - viewState.x) / viewState.scale;
    const stageY = ((clientPosition.y - rect.top) - viewState.y) / viewState.scale;

    if (stageX >= restaurantFloorBounds.x &&
      stageX <= restaurantFloorBounds.x + restaurantFloorBounds.width &&
      stageY >= restaurantFloorBounds.y &&
      stageY <= restaurantFloorBounds.y + restaurantFloorBounds.height) {

      let constrainedPos;

      if (config.tableType === "room") {
        constrainedPos = constrainTopLeftItem(
          { x: stageX, y: stageY },
          { width: config.config.width, height: config.config.height },
          restaurantFloorBounds
        );
      } else {
        constrainedPos = constrainCenteredItem(
          { x: stageX, y: stageY },
          { width: config.config.width, height: config.config.height },
          restaurantFloorBounds
        );
      }

      createNewItem(config.tableType, config.config, constrainedPos);
    }
  }, [viewState, restaurantFloorBounds, isLocked, createNewItem]);

  // Enhanced keyboard shortcuts including lock toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && state.selectedItem && !isLocked) {
        dispatch({ type: "DELETE_ITEM", payload: { itemId: state.selectedItem } });
      }
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        toggleFloorLock(!isLocked)
      }
      if (e.key === "Escape") {
        dispatch({ type: "SELECT_ITEM", payload: { itemId: null } });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedItem, dispatch, isLocked, toggleFloorLock]);

  // Register touch drop handler
  useEffect(() => {
    if (onTouchDropReady) {
      onTouchDropReady(handleTouchDrop);
    }
  }, [onTouchDropReady, handleTouchDrop]);

  return (
    <PerformanceContext.Provider value={performanceContextValue}>
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
        style={{ width, height }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CanvasHeader
          floorDimensions={floorDimensions}
          viewScale={viewState.scale}
          itemsCount={mutableItems.length}
          visibleItemsCount={mutableItems.filter(isLayoutItemVisible).length}
          isLocked={isLocked}
          onToggleLock={() => toggleFloorLock(!isLocked)}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
        />

        <FloorControls
          floorDimensions={floorDimensions}
          onWidthChange={adjustFloorWidth}
          onHeightChange={adjustFloorHeight}
          showSettings={showSettings}
          itemsCount={mutableItems.length}
          visibleItemsCount={mutableItems.filter(isLayoutItemVisible).length}
          viewScale={viewState.scale}
          onToggleSettings={() => setShowSettings(!showSettings)}
        />

        <div className="pt-16 h-full transition-all duration-300 cursor-grab active:cursor-grabbing">
          <Stage
            ref={stageRef}
            width={width}
            height={height - headerHeight}
            x={viewState.x}
            y={viewState.y}
            scaleX={viewState.scale}
            scaleY={viewState.scale}
            draggable={true}
            onClick={handleStageClick}
            onWheel={handleWheel}
            onDragEnd={handleStageDragEnd}
          >
            <Layer>
              <Rect
                x={restaurantFloorBounds.x}
                y={restaurantFloorBounds.y}
                width={restaurantFloorBounds.width}
                height={restaurantFloorBounds.height}
                fill="white"
                stroke={isLocked ? "#ef4444" : "#F97316"} // Red border when locked
                strokeWidth={isLocked ? 6 : 4}
                cornerRadius={12}
                shadowColor={isLocked ? "rgba(239,68,68,0.2)" : "rgba(0,0,0,0.15)"}
                shadowBlur={8}
                shadowOffset={{ x: 2, y: 2 }}
                listening={false}
              />

              <VirtualGrid />

              <Group>
                {outsideItems.filter(isLayoutItemVisible).map(item => (
                  <LayoutItemComponent
                    key={item.id}
                    layoutItem={item}
                    isSelected={state.selectedItem === item.id}
                    isLocked={isLocked}
                    onSelect={selectHandlers.get(item.id)!}
                    onUpdate={updateHandlers.get(item.id)!}
                  />
                ))}
              </Group>

              {rooms.filter(isLayoutItemVisible).map(room => {
                const roomScaleVisibility = viewState.scale > 0.3; // Show room items when zoomed in enough

                return <Group key={room.id} draggable={false}>
                  <LayoutItemComponent
                    key={`${room.id}-container`}
                    layoutItem={room}
                    isSelected={state.selectedItem === room.id}
                    isLocked={isLocked}
                    onSelect={selectHandlers.get(room.id)!}
                    onUpdate={updateHandlers.get(room.id)!}
                  />

                  {roomScaleVisibility && roomItemsMap[room.id]?.filter(() =>
                    isRoomItemVisible(room)).map(item => (
                      <LayoutItemComponent
                        key={item.id}
                        layoutItem={{
                          ...item,
                          x: room.x + item.x,
                          y: room.y + item.y
                        }}
                        isSelected={state.selectedItem === item.id}
                        isLocked={isLocked}
                        onSelect={selectHandlers.get(item.id)!}
                        onUpdate={(position) => {
                          updateHandlers.get(item.id)!({
                            x: position.x - room.x,
                            y: position.y - room.y
                          });
                        }}
                        rooms={rooms}
                      />
                    ))}
                </Group>
              })}

              {/* Room Drop Indicator */}
              {isDragOver && hoveredRoom && (
                <RoomDropIndicator
                  room={rooms.find(r => r.id === hoveredRoom)}
                  isVisible={true}
                />
              )}
            </Layer>
          </Stage>
        </div>

        <DragIndicator
          isDragOver={isDragOver}
          isLocked={isLocked}
          restaurantFloorBounds={restaurantFloorBounds}
          viewState={viewState}
        />

        {isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-4 left-4 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm"
          >
            🔒 Layout Locked - Pan/Zoom still enabled - Press Ctrl+L to unlock
          </motion.div>
        )}
      </motion.div>
    </PerformanceContext.Provider>
  );
}