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
import { PerformanceContext } from '../context/PerformanceContext';
import { useItemManager } from '../hooks/useItemManager';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { constrainToCanvas, calculateAutoFit } from '../utils/canvasUtils';
import { LayoutItem, TableType } from "@/types/restaurant";


// Helper function to determine table type based on component type
const getTableTypeFromComponentType = (componentType: string): TableType => {
  switch (componentType) {
    case "table-2":
    case "table-4":
    case "table-6":
    case "table-8":
    case "table-12":
      return "regular";
    case "counter":
      return "regular";
    case "washroom":
      return "regular"; // Default for non-table items
    case "entry-gate":
      return "regular";
    case "exit-gate":
      return "regular";
    default:
      return "regular";
  }
};

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
    case "table-12":
      return 12;
    case "counter":
      return 1;
    default:
      return 4;
  }
};

// Helper function to generate item number based on type
const generateItemNumber = (componentType: string, existingItems: LayoutItem[]): string => {
  // For dining tables, use T prefix with sequential numbering
  const diningTableTypes = ["table-2", "table-4", "table-6", "table-8", "table-12"];

  if (diningTableTypes.includes(componentType)) {
    // Count existing dining tables
    const diningItems = existingItems.filter(item =>
      diningTableTypes.includes(item.type)
    );
    return `T${diningItems.length + 1}`;
  }

  // For other components, use component-specific prefixes
  const componentCounts = existingItems.filter(item => item.type === componentType).length;

  switch (componentType) {
    case "washroom":
      return `WR${componentCounts + 1}`;
    case "counter":
      return `C${componentCounts + 1}`;
    case "entry-gate":
      return `ENTRY${componentCounts + 1}`;
    case "exit-gate":
      return `EXIT${componentCounts + 1}`;
    default:
      return `${componentType.toUpperCase()}${componentCounts + 1}`;
  }
};

export default function RestaurantCanvas({ width, height, onTouchDropReady }: CanvasProps) {
  const { state, dispatch, getCurrentFloorItems, toggleFloorLock } = useRestaurant();
  const stageRef = useRef<any>(null);

  // Responsive canvas hook
  const { getResponsiveHeaderHeight } = useResponsiveCanvas({ width, height });

  // Lock state - main new feature
  const isLocked = state.layout.floor.isLocked;
  const [showSettings, setShowSettings] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Floor dimensions - now from the floor object
  const floorDimensions = useMemo(() => ({
    width: state.layout.floor.width,
    height: state.layout.floor.height
  }), [state.layout.floor.width, state.layout.floor.height]);

  const headerHeight = getResponsiveHeaderHeight();

  // Restaurant floor bounds
  const restaurantFloorBounds = useMemo(() => {
    const padding = 50;
    return {
      x: padding,
      y: padding,
      width: floorDimensions.width,
      height: floorDimensions.height
    };
  }, [floorDimensions]);

  // Auto-fit calculation
  const calculateAutoFitForCanvas = useCallback(() => {
    return calculateAutoFit(width, height, floorDimensions, restaurantFloorBounds);
  }, [width, height, floorDimensions, restaurantFloorBounds]);

  // View state
  const [viewState, setViewState] = useState(() => ({ x: 0, y: 0, scale: 1 }));

  const items = getCurrentFloorItems();

  // Use the item manager hook with lock state
  const { selectHandlers, updateHandlers } = useItemManager({
    items,
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


  const visibleItems = useMemo(() => items.filter(isLayoutItemVisible), [items, isLayoutItemVisible]);

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

  // Enhanced item creation function
  const createNewItem = useCallback((itemType: string, config: any, constrainedPos: { x: number; y: number }) => {
    const itemNumber = generateItemNumber(itemType, items);
    const tableTypeCategory = getTableTypeFromComponentType(itemType);
    const capacity = getCapacityFromComponentType(itemType);

    const newItem: Omit<LayoutItem, "id"> = {
      type: itemType as any,
      x: constrainedPos.x,
      y: constrainedPos.y,
      rotation: 0,
      status: "free" as const,
      width: config.width,
      height: config.height,
      tableNumber: itemNumber,
      tableType: tableTypeCategory,
      capacity,
      description: undefined,
    };
    dispatch({ type: "ADD_ITEM", payload: { item: newItem } });
  }, [items, dispatch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Don't allow drops when locked
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

          const constrainedPos = constrainToCanvas(
            { x: stageX, y: stageY },
            { width: config.width, height: config.height },
            restaurantFloorBounds
          );

          createNewItem(itemType, config, constrainedPos);
        }
      }
    } catch (error) {
      console.error("Drop parsing error:", error);
    }
  }, [dispatch, viewState, restaurantFloorBounds, isLocked, createNewItem]);

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

  // Floor dimension controls - now with lock check
  const adjustFloorWidth = useCallback((delta: number) => {
    if (isLocked) return; // Prevent changes when locked
    const currentWidth = state.layout.floor.width;
    const newWidth = Math.max(800, Math.min(3000, currentWidth + delta));
    dispatch({
      type: "UPDATE_FLOOR_DIMENSIONS",
      payload: { dimensions: { width: newWidth, height: state.layout.floor.height } }
    });
  }, [state.layout.floor.width, state.layout.floor.height, dispatch, isLocked]);

  const adjustFloorHeight = useCallback((delta: number) => {
    if (isLocked) return; // Prevent changes when locked
    const currentHeight = state.layout.floor.height;
    const newHeight = Math.max(600, Math.min(2400, currentHeight + delta));
    dispatch({
      type: "UPDATE_FLOOR_DIMENSIONS",
      payload: { dimensions: { width: state.layout.floor.width, height: newHeight } }
    });
  }, [state.layout.floor.width, state.layout.floor.height, dispatch, isLocked]);

  // Touch drop handler - enhanced with new item creation logic
  const handleTouchDrop = useCallback((config: any, clientPosition: { x: number; y: number }) => {
    if (isLocked || !stageRef.current) return; // Don't allow when locked

    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();
    const stageX = ((clientPosition.x - rect.left) - viewState.x) / viewState.scale;
    const stageY = ((clientPosition.y - rect.top) - viewState.y) / viewState.scale;

    if (stageX >= restaurantFloorBounds.x &&
      stageX <= restaurantFloorBounds.x + restaurantFloorBounds.width &&
      stageY >= restaurantFloorBounds.y &&
      stageY <= restaurantFloorBounds.y + restaurantFloorBounds.height) {

      const constrainedPos = constrainToCanvas(
        { x: stageX, y: stageY },
        { width: config.config.width, height: config.config.height },
        restaurantFloorBounds
      );

      createNewItem(config.tableType, config.config, constrainedPos);
    }
  }, [viewState, restaurantFloorBounds, isLocked, createNewItem]);

  // Enhanced keyboard shortcuts including lock toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete item (only when unlocked)
      if (e.key === "Delete" && state.selectedItem && !isLocked) {
        dispatch({ type: "DELETE_ITEM", payload: { itemId: state.selectedItem } });
      }
      // Toggle lock with Ctrl+L
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        toggleFloorLock(!isLocked)
      }
      // Escape to clear selection
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
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = isLocked ? "none" : "copy"; // Visual feedback for locked state
        }}
        onDragEnter={() => !isLocked && setIsDragOver(true)} // Only show drag indicator when unlocked
        onDragLeave={() => setIsDragOver(false)}
      >
        {/* Enhanced Header with Lock Button */}
        <CanvasHeader
          floorDimensions={floorDimensions}
          viewScale={viewState.scale}
          itemsCount={items.length}
          visibleItemsCount={visibleItems.length}
          isLocked={isLocked}
          onToggleLock={() => toggleFloorLock(!isLocked)}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
        />

        {/* Enhanced Floor Controls (disabled when locked) */}
        <FloorControls
          floorDimensions={floorDimensions}
          onWidthChange={adjustFloorWidth}
          onHeightChange={adjustFloorHeight}
          showSettings={showSettings}
          itemsCount={items.length}
          visibleItemsCount={visibleItems.length}
          viewScale={viewState.scale}
          onToggleSettings={() => setShowSettings(!showSettings)}
        />

        {/* Main Canvas Area - Now always allows panning */}
        <div className="pt-16 h-full transition-all duration-300 cursor-grab active:cursor-grabbing">
          <Stage
            ref={stageRef}
            width={width}
            height={height - headerHeight}
            x={viewState.x}
            y={viewState.y}
            scaleX={viewState.scale}
            scaleY={viewState.scale}
            draggable={true} // ALWAYS DRAGGABLE - removed lock condition
            onClick={handleStageClick}
            onWheel={handleWheel}
            onDragEnd={handleStageDragEnd}
          >
            <Layer>
              {/* Restaurant Floor Canvas */}
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

              {/* Grid Component */}
              <VirtualGrid />

              {/* Enhanced Items with Lock State */}
              {visibleItems.map((item) => (
                <LayoutItemComponent
                  key={item.id}
                  layoutItem={item}
                  isSelected={state.selectedItem === item.id}
                  isLocked={isLocked}
                  onSelect={selectHandlers.get(item.id)!}
                  onUpdate={updateHandlers.get(item.id)!}
                />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Enhanced Drag Indicator with Lock State */}
        <DragIndicator
          isDragOver={isDragOver}
          isLocked={isLocked}
          restaurantFloorBounds={restaurantFloorBounds}
          viewState={viewState}
        />

        {/* Lock Status Indicator - Updated message */}
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