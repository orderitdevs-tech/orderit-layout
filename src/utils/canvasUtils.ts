// utils/canvasUtils.ts
import { CanvasBounds } from '@/types/canvas';
import { LayoutItem, RoomItem, TableItem, UtilityItem } from '@/types/restaurant';

// Boundary constraint utility
export const constrainCenteredItem = (
    position: { x: number; y: number },
    size: { width: number; height: number },
    canvasBounds: CanvasBounds
) => {
    const halfWidth = size.width * 0.5;
    const halfHeight = size.height * 0.5;

    return {
        x: Math.max(
            canvasBounds.x + halfWidth,
            Math.min(canvasBounds.x + canvasBounds.width - halfWidth, position.x)
        ),
        y: Math.max(
            canvasBounds.y + halfHeight,
            Math.min(canvasBounds.y + canvasBounds.height - halfHeight, position.y)
        )
    };
};

export const constrainTopLeftItem = (
    position: { x: number; y: number },
    size: { width: number; height: number },
    canvasBounds: CanvasBounds
) => {
    return {
        x: Math.max(
            canvasBounds.x,
            Math.min(canvasBounds.x + canvasBounds.width - size.width, position.x)
        ),
        y: Math.max(
            canvasBounds.y,
            Math.min(canvasBounds.y + canvasBounds.height - size.height, position.y)
        )
    };
};

// SVG dimensions calculator with caching
const svgDimensionsCache = new Map<string, { width: number; height: number }>();

export const getViewBoxDimensions = (viewBox: string) => {
    if (svgDimensionsCache.has(viewBox)) {
        return svgDimensionsCache.get(viewBox)!;
    }

    const [, , width, height] = viewBox.split(' ').map(Number);
    const dimensions = { width, height };
    svgDimensionsCache.set(viewBox, dimensions);
    return dimensions;
};

// Auto-fit calculation utility
export const calculateAutoFit = (
    stageWidth: number,
    stageHeight: number,
    floorDimensions: { width: number; height: number },
    restaurantFloorBounds: CanvasBounds
) => {
    const padding = 100;
    const adjustedStageHeight = stageHeight - 64; // Account for header

    const scaleX = (stageWidth - padding * 2) / floorDimensions.width;
    const scaleY = (adjustedStageHeight - padding * 2) / floorDimensions.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const scaledWidth = floorDimensions.width * scale;
    const scaledHeight = floorDimensions.height * scale;

    return {
        x: (stageWidth - scaledWidth) * 0.5 - restaurantFloorBounds.x * scale,
        y: (adjustedStageHeight - scaledHeight) * 0.5 - restaurantFloorBounds.y * scale,
        scale: scale
    };
};

export function constrainToRoom(
    position: { x: number; y: number },
    size: { width: number; height: number },
    room: RoomItem
): { x: number; y: number } {
    // Room interior padding (8px from edges)
    const padding = 8;

    // For centered items inside rooms (tables, etc.)
    const halfWidth = size.width * 0.5;
    const halfHeight = size.height * 0.5;

    const minX = padding + halfWidth;
    const maxX = room.width - size.width - padding + halfWidth;
    const minY = padding + halfHeight;
    const maxY = room.height - size.height - padding + halfHeight;

    return {
        x: Math.max(minX, Math.min(maxX, position.x)),
        y: Math.max(minY, Math.min(maxY, position.y))
    };
}

// Helper function to generate item number based on type and room
export const generateItemNumber = (
    componentType: string,
    existingItems: LayoutItem[],
    roomId?: string
): string => {
    const diningTableTypes = ["table-2", "table-4", "table-6", "table-8", "table-10", "table-12"];

    // Filter items by scope (room-aware if roomId provided)
    const scopedItems = existingItems.filter(item =>
        roomId ? "roomId" in item && item.roomId === roomId : !("roomId" in item && item.roomId)
    );

    // Helper function to get item identifier based on type
    const getItemIdentifier = (item: LayoutItem): string => {
        if (item.type.startsWith("table-")) {
            return (item as TableItem).tableNumber;
        } else if (item.type === "room") {
            return (item as RoomItem).name;
        } else {
            return (item as UtilityItem).name || "";
        }
    };

    // Helper function to extract number from identifier and find max for specific prefix
    const getNextNumber = (items: LayoutItem[], prefix: string): number => {
        const numbers = items
            .map(item => {
                const identifier = getItemIdentifier(item);
                if (!identifier) return 0;

                // Only match our specific prefix patterns (T, WR, C, ENTRY, etc.)
                const match = identifier.match(new RegExp(`^${prefix}(\\d+)$`));
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => num > 0);

        return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    };

    // For dining tables
    if (diningTableTypes.includes(componentType)) {
        const diningItems = scopedItems.filter(item => diningTableTypes.includes(item.type));
        const nextNumber = getNextNumber(diningItems, "T");
        return `T${nextNumber}`;
    }

    // Filter items of the same type in scope
    const sameTypeItems = scopedItems.filter(item => item.type === componentType);

    switch (componentType) {
        case "washroom": {
            const nextNumber = getNextNumber(sameTypeItems, "WR");
            return `WR${nextNumber}`;
        }
        case "counter": {
            const nextNumber = getNextNumber(sameTypeItems, "C");
            return `C${nextNumber}`;
        }
        case "entry-gate": {
            const nextNumber = getNextNumber(sameTypeItems, "ENTRY");
            return `ENTRY${nextNumber}`;
        }
        case "exit-gate": {
            const nextNumber = getNextNumber(sameTypeItems, "EXIT");
            return `EXIT${nextNumber}`;
        }
        case "room": {
            // rooms stay global - check all items, not just scoped
            const allRoomItems = existingItems.filter(item => item.type === "room");
            const nextNumber = getNextNumber(allRoomItems, "AREA");
            return `AREA${nextNumber}`;
        }
        case "elevator": {
            const nextNumber = getNextNumber(sameTypeItems, "LIFT");
            return `LIFT${nextNumber}`;
        }
        case "stair": {
            const nextNumber = getNextNumber(sameTypeItems, "STAIR");
            return `STAIR${nextNumber}`;
        }
        default: {
            const prefix = componentType.toUpperCase();
            const nextNumber = getNextNumber(sameTypeItems, prefix);
            return `${prefix}${nextNumber}`;
        }
    }
};