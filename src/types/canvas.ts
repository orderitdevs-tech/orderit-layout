// types/restaurant.ts

import { LayoutItem, RoomItem } from "./restaurant";

export interface FloorDimensions {
    width: number;
    height: number;
}

export interface ViewState {
    x: number;
    y: number;
    scale: number;
}

export interface Viewport {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CanvasBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

// In your types/canvas.ts file
export interface PerformanceContextType {
    viewport: Viewport;
    scale: number;
    isLayoutItemVisible: (layoutItem: LayoutItem) => boolean;
    canvasBounds: CanvasBounds;
}

export interface CanvasProps {
    width: number;
    height: number;
    onTouchDropReady?: (handler: (config: any, position: { x: number; y: number }) => void) => void;
}

export interface LayoutItemComponentProps {
    layoutItem: LayoutItem;
    isSelected: boolean;
    isLocked: boolean;
    onSelect: () => void;
    onUpdate: (position: { x: number; y: number }) => void;
    rooms?: RoomItem[];
}

export interface FloorControlsProps {
    floorDimensions: FloorDimensions;
    onWidthChange: (delta: number) => void;
    onHeightChange: (delta: number) => void;
    showSettings: boolean;
    onToggleSettings: () => void;
    itemsCount: number;
    visibleItemsCount: number;
    viewScale: number;
}

export interface HeaderProps {
    floorDimensions: { width: number; height: number };
    viewScale: number;
    itemsCount: number;
    visibleItemsCount: number;
    isLocked: boolean;
    onToggleLock: () => void;
    isLocking:boolean;
    showSettings: boolean;
    onToggleSettings: () => void;
}

export interface LockButtonProps {
    isLocked: boolean;
    onToggle: () => void;
    isLocking:boolean;
}