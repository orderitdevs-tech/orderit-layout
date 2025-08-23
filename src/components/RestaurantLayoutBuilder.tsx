"use client";

import React, { useState, useEffect } from "react";
import {
  RestaurantProvider,
  useRestaurant,
} from "../context/RestaurantContext";
import Toolbar from "./Toolbar";
import DynamicCanvasWrapper from "./DynamicCanvas";
import PropertiesPanel from "./PropertiesPanel";
import AddFloorModal from "./AddFloorModal";
import HelpTooltip from "./HelpTooltip";

function RestaurantLayoutContent() {
  const { state, dispatch } = useRestaurant();
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
    const layoutData = JSON.stringify(state.layout, null, 2);
    const blob = new Blob([layoutData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.layout.name.replace(/\s+/g, "_")}_layout.json`;
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
            dispatch({ type: "LOAD_LAYOUT", payload: { layout } });
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

  return (
    <div className="h-screen flex bg-gray-50">
      <Toolbar
        onAddFloor={() => setShowAddFloorModal(true)}
        onSaveLayout={handleSaveLayout}
        onLoadLayout={handleLoadLayout}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {state.layout.name}
              </h1>
              <p className="text-sm text-gray-600">
                {state.layout.floors.find(
                  (f) => f.id === state.layout.currentFloor
                )?.name || "No floor selected"}
              </p>
            </div>
            <div className="text-sm text-gray-500">
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
