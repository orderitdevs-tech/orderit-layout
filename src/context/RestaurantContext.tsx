"use client";

import React, { createContext, useContext, useReducer, useCallback, useRef, useMemo } from "react";
import { RestaurantLayout, LayoutItem, Floor, ExportRestaurantLayout } from "../types/restaurant";
import { MockBackendService } from "../lib/mockBackendService";
import { LayoutImporter } from "@/utils/layoutImport";



interface RestaurantState {
  layout: RestaurantLayout;
  selectedItem: string | null;
  tool: "select" | "pan";
  availableFloors: { id: string; name: string }[];
  currentFloorId: string | null;
  isLoadingFloor: boolean;
  loadingFloorId: string | null;
  error: string | null;
  isSaving: boolean;
  originalFloorData: Floor | null;
  hasUnsavedChanges: boolean;
}

type RestaurantAction =
  | { type: "ADD_ITEM"; payload: { item: Omit<LayoutItem, "id"> } }
  | { type: "UPDATE_ITEM"; payload: { itemId: string; updates: Partial<LayoutItem> } }
  | { type: "DELETE_ITEM"; payload: { itemId: string } }
  | { type: "SELECT_ITEM"; payload: { itemId: string | null } }
  | { type: "SET_TOOL"; payload: { tool: "select" | "pan" } }
  | { type: "LOAD_FLOOR_DATA"; payload: { floorData: Floor; floorId: string } }
  | { type: "SET_AVAILABLE_FLOORS"; payload: { floors: { id: string; name: string }[] } }
  | { type: "SET_LOADING_FLOOR"; payload: { isLoading: boolean; floorId?: string | null } }
  | { type: "SET_SAVING"; payload: { isSaving: boolean } }
  | { type: "SET_ERROR"; payload: { error: string | null } }
  | { type: "UPDATE_FLOOR_DIMENSIONS"; payload: { dimensions: { width: number; height: number } } }
  | { type: "CLEAR_CURRENT_FLOOR" }
  | { type: "TOGGLE_FLOOR_LOCK"; payload: { isLocked: boolean } }
  | { type: "ADD_FLOOR"; payload: { floorId: string; name: string } }
  | { type: "DELETE_FLOOR"; payload: { floorId: string } }
  | { type: "RENAME_FLOOR"; payload: { floorId: string; name: string } }
  | { type: "SWITCH_FLOOR"; payload: { floorId: string } }
  | { type: "SET_ORIGINAL_FLOOR_DATA"; payload: { floorData: Floor | null } }
  | { type: "SET_UNSAVED_CHANGES"; payload: { hasUnsavedChanges: boolean } }
  | { type: "RESET_UNSAVED_CHANGES" };

const initialState: RestaurantState = {
  layout: {
    id: "default",
    name: "My Restaurant",
    floor: {
      id: "",
      name: "",
      layoutItems: [],
      width: 1600,
      height: 1200,
      version: 1,
      isLocked: false
    },
  },
  selectedItem: null,
  tool: "select",
  availableFloors: [],
  currentFloorId: null,
  isLoadingFloor: false,
  loadingFloorId: null,
  error: null,
  isSaving: false,
  originalFloorData: null,
  hasUnsavedChanges: false,
};

function restaurantReducer(state: RestaurantState, action: RestaurantAction): RestaurantState {
  switch (action.type) {
    case "ADD_ITEM": {
      if (state.layout.floor.isLocked) {
        return { ...state, error: "Cannot add item: Floor is locked" };
      }

      const newItem: LayoutItem = {
        ...action.payload.item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...state.layout.floor,
            layoutItems: [...state.layout.floor.layoutItems, newItem]
          },
        },
        error: null,
        hasUnsavedChanges: true,
      };
    }

    case "UPDATE_ITEM": {
      if (state.layout.floor.isLocked) {
        return { ...state, error: "Cannot update item: Floor is locked" };
      }

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...state.layout.floor,
            layoutItems: state.layout.floor.layoutItems.map((item) =>
              item.id === action.payload.itemId
                ? { ...item, ...action.payload.updates }
                : item
            ),
          },
        },
        error: null,
        hasUnsavedChanges: true,
      };
    }

    case "DELETE_ITEM": {
      if (state.layout.floor.isLocked) {
        return { ...state, error: "Cannot delete item: Floor is locked" };
      }

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...state.layout.floor,
            layoutItems: state.layout.floor.layoutItems.filter((item) => item.id !== action.payload.itemId),
          },
        },
        selectedItem: state.selectedItem === action.payload.itemId ? null : state.selectedItem,
        error: null,
        hasUnsavedChanges: true,
      };
    }

    case "SELECT_ITEM": {
      return {
        ...state,
        selectedItem: action.payload.itemId,
      };
    }

    case "SET_TOOL": {
      return {
        ...state,
        tool: action.payload.tool,
        selectedItem: null,
      };
    }

    case "LOAD_FLOOR_DATA": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floor: action.payload.floorData,
        },
        currentFloorId: action.payload.floorId,
        selectedItem: null,
        isLoadingFloor: false,
        loadingFloorId: null, // ← ADD THIS to reset loading ID
        error: null,
        originalFloorData: action.payload.floorData,
        hasUnsavedChanges: false,
      };
    }

    case "SET_AVAILABLE_FLOORS": {
      return {
        ...state,
        availableFloors: action.payload.floors,
        error: null,
      };
    }

    case "SET_LOADING_FLOOR": {
      return {
        ...state,
        isLoadingFloor: action.payload.isLoading,
        loadingFloorId: action.payload.floorId !== undefined
          ? action.payload.floorId
          : state.loadingFloorId
      };
    }

    case "SET_SAVING": {
      return {
        ...state,
        isSaving: action.payload.isSaving,
      };
    }

    case "SET_ERROR": {
      return {
        ...state,
        error: action.payload.error,
        isLoadingFloor: false,
        isSaving: false,
      };
    }

    case "CLEAR_CURRENT_FLOOR": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            id: "",
            name: "",
            layoutItems: [],
            width: 1600,
            height: 1200,
            isLocked: false,
            version: 1
          },
        },
        currentFloorId: null,
        selectedItem: null,
        error: null,
        originalFloorData: null,
      };
    }

    case "UPDATE_FLOOR_DIMENSIONS": {
      if (state.layout.floor.isLocked) {
        return { ...state, error: "Cannot update dimensions: Floor is locked" };
      }

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...state.layout.floor,
            width: action.payload.dimensions.width,
            height: action.payload.dimensions.height,
          },
        },
        error: null,
      };
    }

    case "TOGGLE_FLOOR_LOCK": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...state.layout.floor,
            isLocked: action.payload.isLocked,
          },
        },
      };
    }

    case "ADD_FLOOR": {
      return {
        ...state,
        availableFloors: [
          ...state.availableFloors,
          { id: action.payload.floorId, name: action.payload.name }
        ],
      };
    }

    case "DELETE_FLOOR": {
      const { floorId } = action.payload;
      const newAvailableFloors = state.availableFloors.filter(f => f.id !== floorId);

      let newCurrentFloorId = state.currentFloorId;

      if (state.currentFloorId === floorId) {
        // If deleting current floor, switch to another one
        newCurrentFloorId = newAvailableFloors.length > 0 ? newAvailableFloors[0].id : null;
      }

      return {
        ...state,
        availableFloors: newAvailableFloors,
        currentFloorId: newCurrentFloorId,
        // The useEffect will automatically load the new floor if currentFloorId changed
        selectedItem: state.currentFloorId === floorId ? null : state.selectedItem
      };
    }

    case "RENAME_FLOOR": {
      return {
        ...state,
        availableFloors: state.availableFloors.map(floor =>
          floor.id === action.payload.floorId
            ? { ...floor, name: action.payload.name }
            : floor
        ),
        layout: state.currentFloorId === action.payload.floorId
          ? {
            ...state.layout,
            floor: {
              ...state.layout.floor,
              name: action.payload.name
            }
          }
          : state.layout
      };
    }

    case "SWITCH_FLOOR": {
      return {
        ...state,
        currentFloorId: action.payload.floorId,
        // The useEffect will handle loading the actual floor data
      };
    }

    case "SET_ORIGINAL_FLOOR_DATA": {
      return {
        ...state,
        originalFloorData: action.payload.floorData,
        hasUnsavedChanges: false,
      };
    }

    case "SET_UNSAVED_CHANGES": {
      return {
        ...state,
        hasUnsavedChanges: action.payload.hasUnsavedChanges,
      };
    }

    case "RESET_UNSAVED_CHANGES": {
      return {
        ...state,
        hasUnsavedChanges: false,
      };
    }

    default:
      return state;
  }
}

interface RestaurantContextValue {
  state: RestaurantState;
  dispatch: React.Dispatch<RestaurantAction>;
  getCurrentFloorItems: () => LayoutItem[];
  loadFloorData: (floorId: string) => Promise<void>;
  importLayout: (file: File) => Promise<ExportRestaurantLayout>;
  exportLayout: () => string;
  saveCurrentFloorToBackend: () => Promise<void>;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
  toggleFloorLock: (isLocked: boolean) => void;
  isFloorLocked: boolean;
  addFloor: (name: string) => Promise<void>;
  deleteFloor: (floorId: string) => Promise<void>;
  renameFloor: (floorId: string, name: string) => Promise<void>;
  switchFloor: (floorId: string) => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(restaurantReducer, initialState);
  const lastOperationRef = useRef<() => Promise<void> | null>(null);

  const isFloorLocked = useMemo(() => state.layout.floor.isLocked, [state.layout.floor.isLocked]);

  const getCurrentFloorItems = useCallback(() => {
    return state.layout.floor.layoutItems || [];
  }, [state.layout.floor.layoutItems]);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: { error: null } });
  }, []);

  const retryLastOperation = useCallback(async () => {
    if (lastOperationRef.current) {
      await lastOperationRef.current();
    }
  }, []);

  const toggleFloorLock = useCallback((isLocked: boolean) => {
    dispatch({ type: "TOGGLE_FLOOR_LOCK", payload: { isLocked } });
  }, []);

  // Load floor data from backend
  const loadFloorData = useCallback(async (floorId: string) => {
    const operation = async () => {
      try {
        dispatch({ type: "SET_LOADING_FLOOR", payload: { isLoading: true } });
        dispatch({ type: "SET_ERROR", payload: { error: null } });

        const floorData = await MockBackendService.getFloorData(floorId);

        dispatch({
          type: "LOAD_FLOOR_DATA",
          payload: { floorData, floorId }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load floor data';
        console.error("❌ Load floor error:", errorMessage);
        dispatch({
          type: "SET_ERROR",
          payload: { error: `Load Error: ${errorMessage}` }
        });
      }
    };

    lastOperationRef.current = operation;
    await operation();
  }, []);

  // Save current floor to backend
  const saveCurrentFloorToBackend = useCallback(async () => {
    if (!state.currentFloorId) {
      dispatch({
        type: "SET_ERROR",
        payload: { error: "Save Error: No floor is currently loaded" }
      });
      return;
    }

    const operation = async () => {
      try {
        dispatch({ type: "SET_SAVING", payload: { isSaving: true } });
        dispatch({ type: "SET_ERROR", payload: { error: null } });

        await MockBackendService.saveFloorData(state.currentFloorId!, state.layout.floor);

        dispatch({ type: "SET_SAVING", payload: { isSaving: false } });
        dispatch({ type: "SET_ORIGINAL_FLOOR_DATA", payload: { floorData: state.layout.floor } });
        // hasUnsavedChanges will be set to false by the SET_ORIGINAL_FLOOR_DATA action

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save floor data';
        console.error("❌ Save floor error:", errorMessage);
        dispatch({
          type: "SET_ERROR",
          payload: { error: `Save Error: ${errorMessage}` }
        });
      }
    };

    lastOperationRef.current = operation;
    await operation();
  }, [state.currentFloorId, state.layout.floor]);


  // Floor management functions
  const addFloor = useCallback(async (name: string) => {
    const operation = async () => {
      try {
        dispatch({ type: "SET_ERROR", payload: { error: null } });

        const newFloor = await MockBackendService.createFloor(name);

        dispatch({ type: "ADD_FLOOR", payload: { floorId: newFloor.id, name: newFloor.name } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create floor';
        dispatch({ type: "SET_ERROR", payload: { error: `Create Error: ${errorMessage}` } });
      }
    };

    lastOperationRef.current = operation;
    await operation();
  }, []);

  const deleteFloor = useCallback(async (floorId: string) => {
    const operation = async () => {
      try {
        dispatch({ type: "SET_ERROR", payload: { error: null } });

        await MockBackendService.deleteFloor(floorId);

        dispatch({ type: "DELETE_FLOOR", payload: { floorId } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete floor';
        dispatch({ type: "SET_ERROR", payload: { error: `Delete Error: ${errorMessage}` } });
      }
    };

    lastOperationRef.current = operation;
    await operation();
  }, []);

  const renameFloor = useCallback(async (floorId: string, name: string) => {
    const operation = async () => {
      try {
        dispatch({ type: "SET_ERROR", payload: { error: null } });

        await MockBackendService.renameFloor(floorId, name);

        dispatch({ type: "RENAME_FLOOR", payload: { floorId, name } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to rename floor';
        dispatch({ type: "SET_ERROR", payload: { error: `Rename Error: ${errorMessage}` } });
      }
    };

    lastOperationRef.current = operation;
    await operation();
  }, []);

  const switchFloor = useCallback(async (floorId: string) => {
    const switchAction = async () => {
      try {
        // Check for unsaved changes
        if (state.currentFloorId && state.hasUnsavedChanges) {
          const confirmed = window.confirm(
            "You have unsaved changes. Are you sure you want to switch floors without saving?"
          );

          if (!confirmed) {
            return; // User cancelled
          }
        }

        // Just set the current floor ID - useEffect will handle loading
        dispatch({ type: "SWITCH_FLOOR", payload: { floorId } });

      } catch (error) {
        console.error("❌ Floor switch error:", error);
      }
    };

    lastOperationRef.current = switchAction;
    await switchAction();
  }, [state.currentFloorId, state.hasUnsavedChanges]);

  const importLayout = useCallback(async (file: File): Promise<ExportRestaurantLayout> => {
    try {
      dispatch({ type: "SET_LOADING_FLOOR", payload: { isLoading: true } });
      dispatch({ type: "SET_ERROR", payload: { error: null } });

      // Read and validate the file
      const importedLayout = await LayoutImporter.readFile(file);

      // Use the floor data directly (it already contains layoutItems)
      const floorData = importedLayout.floor;

      // Check if this floor already exists
      const floorExists = state.availableFloors.some(f => f.id === floorData.id);

      if (floorExists) {
        // Ask user if they want to overwrite
        const shouldOverwrite = window.confirm(
          `Floor "${floorData.name}" already exists. Do you want to import the layout data into your current workspace? This will update the floor with the imported data.`
        );

        if (!shouldOverwrite) {
          dispatch({ type: "SET_LOADING_FLOOR", payload: { isLoading: false } });
          // Return the existing layout instead of undefined
          return {
            id: state.layout.id,
            name: state.layout.name,
            floor: state.layout.floor
          };
        }

        // User confirmed - IMPORT THE DATA INTO CURRENT STATE
        // Update the existing floor with imported data
        dispatch({
          type: "LOAD_FLOOR_DATA",
          payload: {
            floorData: floorData,
            floorId: floorData.id
          }
        });

        console.log('✅ Imported layout data into existing floor:', floorData.name);
        return importedLayout;
      }

      // Add the imported floor to available floors
      const newFloorInfo = {
        id: floorData.id,
        name: floorData.name
      };

      dispatch({
        type: "SET_AVAILABLE_FLOORS",
        payload: { floors: [...state.availableFloors, newFloorInfo] }
      });

      // Load the imported floor with all its layoutItems
      dispatch({
        type: "LOAD_FLOOR_DATA",
        payload: {
          floorData: floorData,
          floorId: floorData.id
        }
      });

      // Log metadata for debugging/info
      if (importedLayout.metadata) {
        console.log('Imported layout metadata:', importedLayout.metadata);
      }

      return importedLayout;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import layout';
      dispatch({
        type: "SET_ERROR",
        payload: { error: `Import Error: ${errorMessage}` }
      });
      dispatch({ type: "SET_LOADING_FLOOR", payload: { isLoading: false } });

      // Throw the error instead of returning undefined
      throw error;
    }
  }, [state.availableFloors, state.layout]);

  const exportLayout = useCallback(() => {
    if (!state.currentFloorId) {
      throw new Error('No floor to export');
    }

    // Export in the exact same format that we import, with metadata
    const exportData: ExportRestaurantLayout = {
      id: state.layout.id,
      name: state.layout.name,
      floor: state.layout.floor,
      metadata: {
        "application_name": "orderit",
        exportedAt: new Date().toISOString(),
        // exportedBy: 'user-name', // If you have user authentication
        floorCount: state.availableFloors.length,
        itemCount: state.layout.floor.layoutItems.length,
      }
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.currentFloorId, state.layout, state.availableFloors.length]);

  // Initialize available floors on mount
  React.useEffect(() => {
    const fetchAvailableFloors = async () => {
      const operation = async () => {
        try {
          dispatch({ type: "SET_ERROR", payload: { error: null } });

          const floors = await MockBackendService.getAvailableFloors();
          dispatch({ type: "SET_AVAILABLE_FLOORS", payload: { floors } });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch available floors';
          console.error("❌ Fetch floors error:", errorMessage);
          dispatch({
            type: "SET_ERROR",
            payload: { error: `Initialization Error: ${errorMessage}` }
          });
        }
      };

      lastOperationRef.current = operation;
      await operation();
    };

    fetchAvailableFloors();
  }, []);

  // In RestaurantProvider.tsx - Add this useEffect
  React.useEffect(() => {
    let isCurrent = true; // Flag to track if this effect is still relevant

    const loadFloorOnChange = async () => {
      const targetFloorId = state.currentFloorId;

      if (targetFloorId && targetFloorId !== state.layout.floor.id) {
        try {
          // Set loading state for THIS specific floor
          dispatch({
            type: "SET_LOADING_FLOOR",
            payload: { isLoading: true, floorId: targetFloorId }
          });

          const floorData = await MockBackendService.getFloorData(targetFloorId);

          // Only update if this effect is still relevant and for the current floor
          if (isCurrent && state.currentFloorId === targetFloorId) {
            dispatch({
              type: "LOAD_FLOOR_DATA",
              payload: { floorData, floorId: targetFloorId }
            });
          }
        } catch (error) {
          // Only handle error if this effect is still relevant
          if (isCurrent && state.currentFloorId === targetFloorId) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load floor data';
            dispatch({
              type: "SET_ERROR",
              payload: { error: `Load Error: ${errorMessage}` }
            });
            // Reset loading state
            dispatch({
              type: "SET_LOADING_FLOOR",
              payload: { isLoading: false, floorId: null }
            });
          }
        }
      }
    };

    loadFloorOnChange();

    // Cleanup function - runs when effect re-runs or component unmounts
    return () => {
      isCurrent = false; // Mark this effect as outdated
    };
  }, [state.currentFloorId, state.layout.floor.id]); // Run when currentFloorId changes 

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    getCurrentFloorItems,
    loadFloorData,
    importLayout,
    exportLayout,
    saveCurrentFloorToBackend,
    clearError,
    retryLastOperation,
    toggleFloorLock,
    isFloorLocked,
    addFloor,
    deleteFloor,
    renameFloor,
    switchFloor,
  }), [
    state,
    dispatch,
    getCurrentFloorItems,
    loadFloorData,
    importLayout,
    exportLayout,
    saveCurrentFloorToBackend,
    clearError,
    retryLastOperation,
    toggleFloorLock,
    isFloorLocked,
    addFloor,
    deleteFloor,
    renameFloor,
    switchFloor,
  ]);

  return (
    <RestaurantContext.Provider value={contextValue}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}