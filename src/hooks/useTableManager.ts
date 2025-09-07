// hooks/useTableManager.ts
import { useMemo } from 'react';
import {CanvasBounds } from '@/types/canvas';
import { constrainToCanvas } from '../utils/canvasUtils';
import { TableItem } from '@/types/restaurant';

interface UseTableManagerProps {
    tables: TableItem[];
    canvasBounds: CanvasBounds;
    dispatch: (action: any) => void;
    isLocked: boolean;
}

export function useTableManager({ tables, canvasBounds, dispatch, isLocked }: UseTableManagerProps) {
    return useMemo(() => {
        const selectHandlers = new Map<string, () => void>();
        const updateHandlers = new Map<string, (pos: { x: number; y: number }) => void>();

        tables.forEach(table => {
            selectHandlers.set(table.id, () => {
                dispatch({ type: "SELECT_TABLE", payload: { tableId: table.id } });
            });

            updateHandlers.set(table.id, (position) => {
                // Don't update position if locked
                if (isLocked) return;

                const constrainedPosition = constrainToCanvas(
                    position,
                    { width: table.width, height: table.height },
                    canvasBounds
                );
                dispatch({
                    type: "UPDATE_TABLE",
                    payload: { tableId: table.id, updates: constrainedPosition }
                });
            });
        });

        return { selectHandlers, updateHandlers };
    }, [tables, dispatch, canvasBounds, isLocked]);
}