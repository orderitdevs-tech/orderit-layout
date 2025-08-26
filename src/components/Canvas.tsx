"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Group,
  Image as KonvaImage,
} from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useRestaurant } from "../context/RestaurantContext";
import { TABLE_CONFIGS, TABLE_STATUS_COLORS } from "../utils/tableConfig";
import { TableItem } from "../types/restaurant";
import useImage from "use-image";

interface CanvasProps {
  width: number;
  height: number;
}

// Table Component
function Table({
  table,
  isSelected,
  onClick,
  onDragEnd,
}: {
  table: TableItem;
  isSelected: boolean;
  onClick: () => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
}) {
  const [image] = useImage(TABLE_CONFIGS[table.type].image);
  const groupRef = useRef<any>(null);

  return (
    <Group
      ref={groupRef}
      x={table.x}
      y={table.y}
      rotation={table.rotation}
      draggable={true}
      onDragStart={(e) => {
        // While dragging a table, ensure stage is not draggable
        const stage = e.target.getStage();
        if (stage) stage.draggable(false);
      }}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={onDragEnd}
      onDragEndCapture={(e: KonvaEventObject<DragEvent>) => {
        // Restore stage draggable based on current tool
        const stage = e.target.getStage();
        if (stage) {
          // Stage draggability will be controlled by prop; ensure it's not stuck true after Konva internal state
          stage.draggable(false);
        }
      }}
    >
      {/* Table Image */}
      {image && (
        <KonvaImage
          image={image}
          width={table.width}
          height={table.height}
          offsetX={table.width / 2}
          offsetY={table.height / 2}
        />
      )}

      {/* Fallback Rectangle if image doesn't load */}
      {!image && (
        <Rect
          width={table.width}
          height={table.height}
          offsetX={table.width / 2}
          offsetY={table.height / 2}
          fill="#e5e7eb"
          stroke="#9ca3af"
          strokeWidth={1}
          cornerRadius={8}
        />
      )}

      {/* Status Indicator - Centered Circle (only for tables, not for washroom/counter/gates) */}
      {table.type.startsWith("table-") && (
        <Rect
          x={-8}
          y={-8}
          width={16}
          height={16}
          fill={TABLE_STATUS_COLORS[table.status]}
          cornerRadius={8}
          stroke="#ffffff"
          strokeWidth={2}
        />
      )}

      {/* Table Number */}
      {table.tableNumber && (
        <Text
          x={-table.width / 2}
          y={table.height / 2 + 5}
          width={table.width}
          height={20}
          text={table.tableNumber}
          fontSize={12}
          fontFamily="Arial"
          fill="#374151"
          align="center"
          verticalAlign="middle"
        />
      )}

      {/* Selection Border */}
      {isSelected && (
        <Rect
          width={table.width + 4}
          height={table.height + 4}
          offsetX={(table.width + 4) / 2}
          offsetY={(table.height + 4) / 2}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[5, 5]}
          fill="transparent"
        />
      )}
    </Group>
  );
}

export default function Canvas({ width, height }: CanvasProps) {
  const { state, dispatch, getCurrentFloorTables } = useRestaurant();
  const stageRef = useRef<any>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [isHoldScrollActive, setIsHoldScrollActive] = useState(false);

  const tables = getCurrentFloorTables();

  // Handle dropping items onto canvas
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("handleDrop called");

      if (!stageRef.current) {
        console.log("No stage ref");
        return;
      }

      const stage = stageRef.current;
      const container = stage.container();
      const rect = container.getBoundingClientRect();

      // Simple coordinate calculation
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Account for stage transformation
      const stageX = (clientX - stagePos.x) / stageScale;
      const stageY = (clientY - stagePos.y) / stageScale;

      console.log("Drop coordinates:", {
        clientX,
        clientY,
        stageX,
        stageY,
        stagePos,
        stageScale,
      });

      try {
        const data = JSON.parse(e.dataTransfer.getData("application/json"));
        console.log("Drop data:", data);

        if (data.type === "TABLE") {
          const config = data.config;
          const newTable = {
            type: data.tableType,
            x: stageX,
            y: stageY,
            rotation: 0,
            status: "free" as const,
            width: config.width,
            height: config.height,
            tableNumber: `T${tables.length + 1}`,
          };

          console.log("Adding new table:", newTable);
          dispatch({ type: "ADD_TABLE", payload: { table: newTable } });
        }
      } catch (error) {
        console.error("Error parsing drop data:", error);
      }
    },
    [dispatch, stagePos.x, stagePos.y, stageScale, tables.length]
  );

  // Handle table drag end
  const handleTableDragEnd = useCallback(
    (tableId: string) => (e: KonvaEventObject<DragEvent>) => {
      const newPos = e.target.position();
      dispatch({
        type: "UPDATE_TABLE",
        payload: {
          tableId,
          updates: { x: newPos.x, y: newPos.y },
        },
      });
    },
    [dispatch]
  );

  // Handle table selection
  const handleTableClick = useCallback(
    (tableId: string) => {
      if (state.tool === "select") {
        dispatch({ type: "SELECT_TABLE", payload: { tableId } });
      }
    },
    [dispatch, state.tool]
  );

  // Handle stage click (deselect)
  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        dispatch({ type: "SELECT_TABLE", payload: { tableId: null } });
      }
    },
    [dispatch]
  );

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;

      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.1;
      const newScale = Math.max(
        0.1,
        Math.min(3, direction > 0 ? oldScale * factor : oldScale / factor)
      );

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setStageScale(newScale);
      setStagePos(newPos);
    },
    [stageScale, stagePos]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && state.selectedTable) {
        dispatch({
          type: "DELETE_TABLE",
          payload: { tableId: state.selectedTable },
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedTable, dispatch]);

  // Reset view to defaults
  const resetView = useCallback(() => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
    const stage = stageRef.current?.getStage?.();
    if (stage) {
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      stage.batchDraw();
    }
  }, []);

  // Toggle hold scroll mode
  const toggleHoldScroll = useCallback(() => {
    setIsHoldScrollActive((prev) => !prev);
  }, []);

  return (
    <div
      className="bg-custom relative overflow-hidden"
      style={{ width, height }}
      onDrop={(e) => {
        handleDrop(e);
        setIsDragOver(false);
        setDragCounter(0);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragEnter={() => {
        setDragCounter((c) => {
          const next = c + 1;
          if (next === 1) setIsDragOver(true);
          return next;
        });
      }}
      onDragLeave={() => {
        setDragCounter((c) => {
          const next = Math.max(0, c - 1);
          if (next === 0) setIsDragOver(false);
          return next;
        });
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={(isHoldScrollActive || state.tool === "pan") && !isDragOver}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          const stage = e.target.getStage();
          // Only update canvas position if the Stage itself was dragged
          if (stage && e.target === stage) {
            const newPos = stage.position();
            setStagePos(newPos);
          }
        }}
      >
        <Layer>
          {/* Grid Background */}
          {Array.from({ length: Math.ceil(width / 50) + 1 }).map((_, i) => (
            <React.Fragment key={`v-${i}`}>
              <Rect
                x={i * 50}
                y={0}
                width={1}
                height={height * 2}
                fill="#e5e7eb"
                opacity={0.5}
              />
            </React.Fragment>
          ))}
          {Array.from({ length: Math.ceil(height / 50) + 1 }).map((_, i) => (
            <React.Fragment key={`h-${i}`}>
              <Rect
                x={0}
                y={i * 50}
                width={width * 2}
                height={1}
                fill="#e5e7eb"
                opacity={0.5}
              />
            </React.Fragment>
          ))}

          {/* Tables */}
          {tables.map((table) => (
            <Table
              key={table.id}
              table={table}
              isSelected={state.selectedTable === table.id}
              onClick={() => handleTableClick(table.id)}
              onDragEnd={handleTableDragEnd(table.id)}
            />
          ))}
        </Layer>
      </Stage>

      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Canvas Info */}
        <div className="bg-accent/90 backdrop-blur px-2.5 py-1.5 rounded-full shadow-sm text-xs text-custom border border-primary/20">
          Zoom: {Math.round(stageScale * 100)}% | Tool: {state.tool}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleHoldScroll}
            className={`px-3 py-1.5 rounded-full text-xs backdrop-blur border border-primary/20 hover:bg-accent shadow-sm transition-colors ${
              isHoldScrollActive
                ? "bg-primary text-white border-primary"
                : "bg-accent/90 text-custom"
            }`}
            title={
              isHoldScrollActive
                ? "Click to disable canvas dragging"
                : "Click to enable canvas dragging with any tool"
            }
          >
            {isHoldScrollActive ? "Drag ON" : "Hold Drag"}
          </button>

          <button
            type="button"
            onClick={resetView}
            className="px-3 py-1.5 rounded-full text-xs bg-accent/90 backdrop-blur text-custom border border-primary/20 hover:bg-accent shadow-sm transition-colors"
            title="Reset view position and zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Drag Over Indicator (non-layout-affecting overlay) */}
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-dashed border-blue-400/70" />
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded shadow">
            Drop table here
          </div>
        </div>
      )}
    </div>
  );
}
