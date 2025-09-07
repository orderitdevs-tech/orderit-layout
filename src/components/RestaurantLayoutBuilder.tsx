"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  RestaurantProvider,
  useRestaurant,
} from "../context/RestaurantContext";
import Toolbar from "./Toolbar";
import DynamicCanvasWrapper from "./DynamicCanvas";
import PropertiesPanel from "./PropertiesPanel";
import AddFloorModal from "./AddFloorModal";
import HelpTooltip from "./HelpTooltip";

// Touch drag interface
interface TouchDragConfig {
  type: string;
  tableType: any;
  config: any;
}

function RestaurantLayoutContent() {
  const { state, dispatch, exportLayoutWithDimensions } = useRestaurant();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);

  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const toolbar = 256; // 64 * 4 (w-64 = 16rem = 256px)
      const properties = 256;
      const padding = 32;

      const width = window.innerWidth - toolbar - properties - padding;
      const height = window.innerHeight - 100; // Account for potential header/padding

      setCanvasSize({
        width: Math.max(600, width),
        height: Math.max(400, height),
      });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const handleAddFloor = (name: string) => {
    dispatch({ type: "ADD_FLOOR", payload: { name } });
  };

  const handleSaveLayout = () => {
    const layoutData = JSON.stringify(exportLayoutWithDimensions(), null, 2);
    const blob = new Blob([layoutData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.layout.name.replace(/\s+/g, "_")}_layout_v${state.layout.floorDimensions ? '1.1' : '1.0'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadLayout = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const layout = JSON.parse(event.target?.result as string);
            
            // Handle both old and new layout formats
            if (layout.version === "1.1" || layout.floorDimensions) {
              dispatch({ type: "LOAD_LAYOUT", payload: { layout } });
            } else {
              // Old format - add default floor dimensions
              const updatedLayout = {
                ...layout,
                floorDimensions: { width: 1600, height: 1200 },
                version: "1.1"
              };
              dispatch({ type: "LOAD_LAYOUT", payload: { layout: updatedLayout } });
            }
          } catch (error) {
            alert("Error loading layout file. Please check the file format.");
            console.error("Error parsing layout:", error);
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  };

  const canvasHandlerRef = useRef<((config: any, position: { x: number; y: number }) => void) | null>(null);

  const handleCanvasTouchDropReady = useCallback((handler: (config: any, position: { x: number; y: number }) => void) => {
    canvasHandlerRef.current = handler;
  }, []);

  const handleTouchDrop = useCallback((config: TouchDragConfig, clientPosition: { x: number; y: number }) => {
    if (canvasHandlerRef.current) {
      canvasHandlerRef.current(config, clientPosition);
    }
  }, []);

  return (
    <div className="h-screen flex bg-custom">
      <Toolbar
        onAddFloor={() => setShowAddFloorModal(true)}
        onSaveLayout={handleSaveLayout}
        onLoadLayout={handleLoadLayout}
        onTouchDrop={handleTouchDrop}
      />

      <div className="flex-1 flex flex-col">
        {/* Header with improved floor dimension display */}
        <div className="bg-custom border-b border-custom px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-custom">
                {state.layout.name}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-custom/80">
                  {state.layout.floors.find(
                    (f) => f.id === state.layout.currentFloor
                  )?.name || "No floor selected"}
                </p>
                {state.layout.floorDimensions && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-mono">
                    Floor: {state.layout.floorDimensions.width}×{state.layout.floorDimensions.height}px
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-custom/60">
              Tables:{" "}
              {state.layout.floors.find(
                (f) => f.id === state.layout.currentFloor
              )?.tables.length || 0}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex">
          <DynamicCanvasWrapper
            width={canvasSize.width}
            height={canvasSize.height}
            onTouchDropReady={handleCanvasTouchDropReady}
          />
          <PropertiesPanel />
        </div>
      </div>

      <AddFloorModal
        isOpen={showAddFloorModal}
        onClose={() => setShowAddFloorModal(false)}
        onConfirm={handleAddFloor}
      />

      <HelpTooltip />
    </div>
  );
}

export default function RestaurantLayoutBuilder() {
  return (
    <RestaurantProvider>
      <RestaurantLayoutContent />
    </RestaurantProvider>
  );
}