import { useCallback } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { LayoutItem } from "../types/restaurant";

export function useItemOperations() {
    const { dispatch, isFloorLocked } = useRestaurant();
    // REMOVE setHasUnsavedChanges from here

    const addItem = useCallback((item: Omit<LayoutItem, "id">) => {
        if (isFloorLocked) {
            dispatch({
                type: "SET_ERROR",
                payload: { error: "Cannot add item: Floor is locked" }
            });
            return false;
        }

        dispatch({ type: "ADD_ITEM", payload: { item } });
        // The reducer automatically sets hasUnsavedChanges to true
        return true;
    }, [dispatch, isFloorLocked]);

    const updateItem = useCallback((itemId: string, updates: Partial<LayoutItem>) => {
        if (isFloorLocked) {
            dispatch({
                type: "SET_ERROR",
                payload: { error: "Cannot update item: Floor is locked" }
            });
            return false;
        }

        dispatch({ type: "UPDATE_ITEM", payload: { itemId, updates } });
        // The reducer automatically sets hasUnsavedChanges to true
        return true;
    }, [dispatch, isFloorLocked]); 

    const deleteItem = useCallback((itemId: string) => {
        if (isFloorLocked) {
            dispatch({
                type: "SET_ERROR",
                payload: { error: "Cannot delete item: Floor is locked" }
            });
            return false;
        }

        dispatch({ type: "DELETE_ITEM", payload: { itemId } });
        // The reducer automatically sets hasUnsavedChanges to true
        return true;
    }, [dispatch, isFloorLocked]); 

    return {
        addItem,
        updateItem,
        deleteItem,
        isFloorLocked,
    };
}