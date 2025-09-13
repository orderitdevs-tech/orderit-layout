import { useMemo } from 'react';
import { CanvasBounds } from '@/types/canvas';
import { constrainCenteredItem, constrainTopLeftItem , constrainToRoom } from '../utils/canvasUtils';
import { LayoutItem, RoomItem } from '@/types/restaurant';

interface UseLayoutItemManagerProps {
    layoutItems: readonly LayoutItem[];
    canvasBounds: CanvasBounds;
    dispatch: (action: any) => void;
    isLocked: boolean;
}

export function useLayoutItemManager({ layoutItems, canvasBounds, dispatch, isLocked }: UseLayoutItemManagerProps) {
    return useMemo(() => {
        const selectHandlers = new Map<string, () => void>();
        const updateHandlers = new Map<string, (pos: { x: number; y: number }) => void>();

        // Get all rooms for boundary checking
        const rooms = layoutItems.filter(item => item.type === "room") as RoomItem[];

        layoutItems.forEach(item => {
            selectHandlers.set(item.id, () => {
                dispatch({ type: "SELECT_ITEM", payload: { itemId: item.id } });
            });

            updateHandlers.set(item.id, (position) => {
                // Don't update position if locked
                if (isLocked) return;

                let constrainedPosition;

                if (item.type === "room") {
                    // Rooms use absolute positioning with canvas bounds
                    constrainedPosition = constrainTopLeftItem(
                        position,
                        { width: item.width, height: item.height },
                        canvasBounds
                    );
                } else if (item.roomId) {
                    // Items inside rooms use relative positioning with room bounds
                    const parentRoom = rooms.find(room => room.id === item.roomId);
                    if (parentRoom) {
                        constrainedPosition = constrainToRoom(
                            position,
                            { width: item.width, height: item.height },
                            parentRoom
                        );
                    } else {
                        // Fallback: if room not found, use canvas bounds
                        constrainedPosition = constrainCenteredItem(
                            position,
                            { width: item.width, height: item.height },
                            canvasBounds
                        );
                    }
                } else {
                    // Items outside rooms use absolute positioning with canvas bounds
                    constrainedPosition = constrainCenteredItem(
                        position,
                        { width: item.width, height: item.height },
                        canvasBounds
                    );
                }

                dispatch({
                    type: "MOVE_ITEM",
                    payload: {
                        itemId: item.id,
                        x: constrainedPosition.x,
                        y: constrainedPosition.y
                    }
                });
            });
        });

        return { selectHandlers, updateHandlers };
    }, [layoutItems, dispatch, canvasBounds, isLocked]);
}