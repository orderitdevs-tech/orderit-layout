"use client";

import dynamic from "next/dynamic";

interface CanvasProps {
  width: number;
  height: number;
}

const DynamicCanvas = dynamic(() => import("./Canvas"), {
  ssr: false,
  loading: () => (
    <div
      className="bg-gray-100 flex items-center justify-center"
      style={{ width: 800, height: 600 }}
    >
      <div className="text-gray-500">Loading canvas...</div>
    </div>
  ),
});

export default function DynamicCanvasWrapper({ width, height }: CanvasProps) {
  return <DynamicCanvas width={width} height={height} />;
}
