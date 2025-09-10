"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  RestaurantProvider,
  useRestaurant,
} from "../context/RestaurantContext";
import Toolbar from "./Toolbar";
import DynamicCanvasWrapper from "./DynamicCanvas";
import PropertiesPanel from "./PropertiesPanel";
import HelpTooltip from "./HelpTooltip";
import RestaurantHeader from "./RestaurantHeader";

// Touch drag interface
interface TouchDragConfig {
  type: string;
  tableType: any;
  config: any;
}

function RestaurantLayoutContent() {
  const { state } = useRestaurant();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  

  // Update canvas size on window resize with correct dimensions
  useEffect(() => {
    const updateCanvasSize = () => {
      const toolbar = 256; // Toolbar width (w-64 = 256px)
      const properties = 320; // Properties panel width (w-80 = 320px)  
      const padding = 32; // General padding
      const headerHeight = 80; // Header height

      const width = window.innerWidth - toolbar - properties - padding;
      const height = window.innerHeight - headerHeight - padding;

      setCanvasSize({
        width: Math.max(600, width),
        height: Math.max(400, height),
      });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);


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
    <div className="h-screen w-full flex bg-background">
      {/* Toolbar - Fixed width */}
      <div className="w-64 flex-shrink-0">
        <Toolbar
          onTouchDrop={handleTouchDrop}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with improved floor dimension display */}
        <RestaurantHeader
          layout={state.layout}
          userData={{
            name: "John Doe",
            email: "john@restaurant.com",
            role: "Manager",
          }}
          notifications={[
            {
              id: "1",
              title: "New Reservation",
              description: "Party of 4 at 7:30 PM",
              time: "2 hours ago",
              read: false,
              type: "info"
            },
            {
              id: "2",
              title: "Table Moved",
              description: "Table 5 was moved to a new position",
              time: "1 day ago",
              read: true,
              type: "success"
            }
          ]}
        />

        {/* Canvas and Properties Panel Container */}
        <div className="flex-1 flex min-h-0">
          {/* Canvas Area - Flexible width */}
          <div className="flex-1 min-w-0 bg-muted/30">
            <DynamicCanvasWrapper
              width={canvasSize.width}
              height={canvasSize.height}
              onTouchDropReady={handleCanvasTouchDropReady}
            />
          </div>

          {/* Properties Panel - Fixed width */}
          <div className="w-80 flex-shrink-0">
            <PropertiesPanel />
          </div>
        </div>
      </div>

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