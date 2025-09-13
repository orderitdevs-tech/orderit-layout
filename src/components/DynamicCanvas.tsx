"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

interface CanvasProps {
  width: number;
  height: number;
  onTouchDropReady?: (handler: (config: any, position: { x: number; y: number }) => void) => void;
}

const DynamicCanvas = dynamic(() => import("./Canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <div className="relative w-full h-full rounded-xl border border-slate-200/60 shadow-lg bg-white/80 overflow-hidden">
        {/* Floor Title Skeleton */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <Skeleton className="h-7 w-40 bg-gradient-to-r from-blue-200 to-cyan-200" />
        </div>

        {/* Grid Background */}
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Loading Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-3 bg-white/90 px-4 py-2 rounded-full border border-slate-200/60 shadow-sm">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-slate-600">Loading canvas...</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/30 overflow-hidden rounded-b-xl">
          <div className="h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 animate-pulse"></div>
        </div>
      </div>
    </div>
  ),

});

export default function DynamicCanvasWrapper({ width, height, onTouchDropReady }: CanvasProps) {
  return (
    <div
      className="w-full h-full min-w-0 min-h-0"
      style={{ width, height }}
    >
      <DynamicCanvas
        width={width}
        height={height}
        onTouchDropReady={onTouchDropReady}
      />
    </div>
  );
}