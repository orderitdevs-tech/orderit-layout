import { useMemo } from 'react';
import {CanvasBounds } from '@/types/canvas';
import { constrainToCanvas } from '../utils/canvasUtils';
import { LayoutItem } from '@/types/restaurant';

interface UseTableManagerProps {
    layoutItems: LayoutItem[];
    canvasBounds: CanvasBounds;
    dispatch: (action: any) => void;
    isLocked: boolean;
}

export function useLayoutItemManager({ layoutItems, canvasBounds, dispatch, isLocked }: UseTableManagerProps) {
    return useMemo(() => {
        const selectHandlers = new Map<string, () => void>();
        const updateHandlers = new Map<string, (pos: { x: number; y: number }) => void>();

        layoutItems.forEach(item => {
            selectHandlers.set(item.id, () => {
                dispatch({ type: "SELECT_TABLE", payload: { tableId: item.id } });
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
                    type: "UPDATE_TABLE",
                    payload: { tableId: item.id, updates: constrainedPosition }
                });
            });
        });

        return { selectHandlers, updateHandlers };
    }, [layoutItems, dispatch, canvasBounds, isLocked]);
}