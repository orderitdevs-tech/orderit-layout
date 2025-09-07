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
import TableComponent from './canvas/TableComponent';
import { PerformanceContext } from '../context/PerformanceContext';
import { useTableManager } from '../hooks/useTableManager';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { constrainToCanvas, calculateAutoFit } from '../utils/canvasUtils';
import { TableItem, TableType } from "@/types/restaurant";
import { useAtom } from "jotai";
import { lockAtom } from "@/atom/atom";

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
      return "bar";
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

// Helper function to generate table number based on type
const generateTableNumber = (componentType: string, existingTables: TableItem[]): string => {
  // For dining tables, use T prefix with sequential numbering
  const diningTableTypes = ["table-2", "table-4", "table-6", "table-8", "table-12"];

  if (diningTableTypes.includes(componentType)) {
    // Count existing dining tables
    const diningTables = existingTables.filter(table =>
      diningTableTypes.includes(table.type)
    );
    return `T${diningTables.length + 1}`;
  }

  // For other components, use component-specific prefixes
  const componentCounts = existingTables.filter(table => table.type === componentType).length;

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

export default function EnhancedRestaurantCanvas({ width, height, onTouchDropReady }: CanvasProps) {
  const { state, dispatch, getCurrentFloorTables } = useRestaurant();
  const stageRef = useRef<any>(null);

  // Responsive canvas hook
  const { getResponsiveHeaderHeight } = useResponsiveCanvas({ width, height });

  // Lock state - main new feature
  const [isLocked, setIsLocked] = useAtom(lockAtom);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Floor dimensions
  const floorDimensions = useMemo(() =>
    state.layout.floorDimensions || { width: 1600, height: 1200 }
    , [state.layout.floorDimensions]);

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

  const tables = getCurrentFloorTables();

  // Use the table manager hook with lock state
  const { selectHandlers, updateHandlers } = useTableManager({
    tables,
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

  // Table visibility
  const isTableVisible = useCallback((table: TableItem) => {
    const buffer = 100;
    return (
      table.x > viewport.x - buffer &&
      table.x < viewport.x + viewport.width + buffer &&
      table.y > viewport.y - buffer &&
      table.y < viewport.y + viewport.height + buffer
    );
  }, [viewport]);

  const visibleTables = useMemo(() => tables.filter(isTableVisible), [tables, isTableVisible]);

  // Performance context value
  const performanceContextValue = useMemo(() => ({
    viewport,
    scale: viewState.scale,
    isTableVisible,
    canvasBounds: restaurantFloorBounds,
  }), [viewport, viewState.scale, isTableVisible, restaurantFloorBounds]);

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

  // Enhanced table creation function
  const createNewTable = useCallback((tableType: string, config: any, constrainedPos: { x: number; y: number }) => {
    const tableNumber = generateTableNumber(tableType, tables);
    const tableTypeCategory = getTableTypeFromComponentType(tableType);
    const capacity = getCapacityFromComponentType(tableType);

    const newTable: Omit<TableItem, "id"> = {
      type: tableType as any,
      x: constrainedPos.x,
      y: constrainedPos.y,
      rotation: 0,
      status: "free" as const,
      width: config.width,
      height: config.height,
      tableNumber,
      tableType: tableTypeCategory,
      capacity,
      description: undefined,
    };
    dispatch({ type: "ADD_TABLE", payload: { table: newTable } });
  }, [tables, dispatch]);

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
        const tableType = data.tableType;

        if (stageX >= restaurantFloorBounds.x &&
          stageX <= restaurantFloorBounds.x + restaurantFloorBounds.width &&
          stageY >= restaurantFloorBounds.y &&
          stageY <= restaurantFloorBounds.y + restaurantFloorBounds.height) {

          const constrainedPos = constrainToCanvas(
            { x: stageX, y: stageY },
            { width: config.width, height: config.height },
            restaurantFloorBounds
          );

          createNewTable(tableType, config, constrainedPos);
        }
      }
    } catch (error) {
      console.error("Drop parsing error:", error);
    }
  }, [dispatch, viewState, restaurantFloorBounds, isLocked, createNewTable]);

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      dispatch({ type: "SELECT_TABLE", payload: { tableId: null } });
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
    const currentDimensions = state.layout.floorDimensions || { width: 1600, height: 1200 };
    const newWidth = Math.max(800, Math.min(3000, currentDimensions.width + delta));
    dispatch({
      type: "UPDATE_FLOOR_DIMENSIONS",
      payload: { dimensions: { ...currentDimensions, width: newWidth } }
    });
  }, [state.layout.floorDimensions, dispatch, isLocked]);

  const adjustFloorHeight = useCallback((delta: number) => {
    if (isLocked) return; // Prevent changes when locked
    const currentDimensions = state.layout.floorDimensions || { width: 1600, height: 1200 };
    const newHeight = Math.max(600, Math.min(2400, currentDimensions.height + delta));
    dispatch({
      type: "UPDATE_FLOOR_DIMENSIONS",
      payload: { dimensions: { ...currentDimensions, height: newHeight } }
    });
  }, [state.layout.floorDimensions, dispatch, isLocked]);

  // Touch drop handler - enhanced with new table creation logic
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

      createNewTable(config.tableType, config.config, constrainedPos);
    }
  }, [viewState, restaurantFloorBounds, isLocked, createNewTable]);

  // Enhanced keyboard shortcuts including lock toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete table (only when unlocked)
      if (e.key === "Delete" && state.selectedTable && !isLocked) {
        dispatch({ type: "DELETE_TABLE", payload: { tableId: state.selectedTable } });
      }
      // Toggle lock with Ctrl+L
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setIsLocked(!isLocked);
      }
      // Escape to clear selection
      if (e.key === "Escape") {
        dispatch({ type: "SELECT_TABLE", payload: { tableId: null } });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedTable, dispatch, isLocked]);

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
          tablesCount={tables.length}
          visibleTablesCount={visibleTables.length}
          isLocked={isLocked}
          onToggleLock={() => setIsLocked(!isLocked)}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
        />

        {/* Enhanced Floor Controls (disabled when locked) */}
        <FloorControls
          floorDimensions={floorDimensions}
          onWidthChange={adjustFloorWidth}
          onHeightChange={adjustFloorHeight}
          showSettings={showSettings}
          tablesCount={tables.length}
          visibleTablesCount={visibleTables.length}
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

              {/* Enhanced Tables with Lock State */}
              {visibleTables.map((table) => (
                <TableComponent
                  key={table.id}
                  table={table}
                  isSelected={state.selectedTable === table.id}
                  isLocked={isLocked}
                  onSelect={selectHandlers.get(table.id)!}
                  onUpdate={updateHandlers.get(table.id)!}
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