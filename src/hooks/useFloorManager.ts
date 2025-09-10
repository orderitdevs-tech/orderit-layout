import { useRestaurant } from "@/context/RestaurantContext";
import { useCallback } from "react";


export function useFloorManager() {
    const {
        state, // ← hasUnsavedChanges is now in state
        clearError,
        retryLastOperation,
        toggleFloorLock,
        switchFloor,
        addFloor,
        deleteFloor,
        renameFloor,
    } = useRestaurant();

    const safeDeleteFloor = useCallback(async (floorId: string) => {
        // Manual confirmation since promptBeforeAction is gone
        const confirmed = window.confirm(
            "Are you sure you want to delete this floor? This action cannot be undone."
        );

        if (confirmed) {
            await deleteFloor(floorId);
        }
    }, [deleteFloor]);

    return {
        availableFloors: state.availableFloors,
        currentFloorId: state.currentFloorId,
        isLoadingFloor: state.isLoadingFloor,
        isSaving: state.isSaving,
        error: state.error,
        isFloorLocked: state.layout.floor.isLocked,
        hasUnsavedChanges: state.hasUnsavedChanges, // ← Now from state
        switchFloor,
        clearError,
        retryLastOperation,
        toggleFloorLock,
        addFloor,
        deleteFloor: safeDeleteFloor,
        renameFloor,
    };
}