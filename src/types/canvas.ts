// types/restaurant.ts
export interface TableItem {
    id: string;
    type: string;
    x: number;
    y: number;
    rotation: number;
    status: 'free' | 'occupied' | 'reserved' | 'maintenance';
    width: number;
    height: number;
    tableNumber?: string;
}

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

export interface PerformanceContextType {
    viewport: Viewport;
    scale: number;
    isTableVisible: (table: TableItem) => boolean;
    canvasBounds: CanvasBounds;
}

export interface CanvasProps {
    width: number;
    height: number;
    onTouchDropReady?: (handler: (config: any, position: { x: number; y: number }) => void) => void;
}

export interface TableComponentProps {
    table: TableItem;
    isSelected: boolean;
    isLocked: boolean;
    onSelect: () => void;
    onUpdate: (position: { x: number; y: number }) => void;
}

export interface FloorControlsProps {
    floorDimensions: FloorDimensions;
    onWidthChange: (delta: number) => void;
    onHeightChange: (delta: number) => void;
    showSettings: boolean;
    onToggleSettings: () => void;
    tablesCount: number;
    visibleTablesCount: number;
    viewScale: number;
}

export interface HeaderProps {
    floorDimensions: FloorDimensions;
    viewScale: number;
    tablesCount: number;
    visibleTablesCount: number;
    isLocked: boolean;
    onToggleLock: () => void;
    showSettings: boolean;
    onToggleSettings: () => void;
}

export interface LockButtonProps {
    isLocked: boolean;
    onToggle: () => void;
}