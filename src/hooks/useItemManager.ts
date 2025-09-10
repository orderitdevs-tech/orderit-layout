// hooks/useItemManager.ts
import { useMemo } from 'react';
import { CanvasBounds } from '@/types/canvas';
import { constrainToCanvas } from '../utils/canvasUtils';
import { LayoutItem } from '@/types/restaurant';

interface UseItemManagerProps {
    items: LayoutItem[];
    canvasBounds: CanvasBounds;
    dispatch: (action: any) => void;
    isLocked: boolean;
}

export function useItemManager({ items, canvasBounds, dispatch, isLocked }: UseItemManagerProps) {
    return useMemo(() => {
        const selectHandlers = new Map<string, () => void>();
        const updateHandlers = new Map<string, (pos: { x: number; y: number }) => void>();

        items.forEach(item => {
            selectHandlers.set(item.id, () => {
                dispatch({ type: "SELECT_ITEM", payload: { itemId: item.id } });
            });

            updateHandlers.set(item.id, (position) => {
                // Don't update position if locked
                if (isLocked) return;

                const constrainedPosition = constrainToCanvas(
                    position,
                    { width: item.width, height: item.height },
                    canvasBounds
                );
                dispatch({
                    type: "UPDATE_ITEM",
                    payload: { itemId: item.id, updates: constrainedPosition }
                });
            });
        });

        return { selectHandlers, updateHandlers };
    }, [items, dispatch, canvasBounds, isLocked]);
}