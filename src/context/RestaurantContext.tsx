"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useMemo,
  useEffect
} from "react";
import {
  RestaurantLayout,
  LayoutItem,
  Floor,
  ExportRestaurantLayout,
  RoomItem,
} from "../types/restaurant";
// import { MockBackendService } from "../lib/mockBackendService";
import { LayoutImporter } from "@/utils/layoutImport";
import { LayoutAction } from "@/types/layout";
import { useFloors } from "@/hooks/useFloor";

// ==================== STATE INTERFACES ====================
interface RestaurantState {
  layout: RestaurantLayout;
  selectedItem: string | null;
  // tool: "select" | "pan";
  availableFloors: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  currentFloorId: string | null;
  isLoadingFloor: boolean;
  loadingFloorId: string | null;
  error: string | null;
  isSaving: boolean;
  originalFloorData: Floor | null;
  hasUnsavedChanges: boolean;
}

// ==================== INITIAL STATE ====================
const createInitialFloor = (): Floor => ({
  id: "",
  name: "",
  layoutItems: [],
  width: 1600,
  height: 1200,
  version: 1,
  isLocked: false
});

const initialState: RestaurantState = {
  layout: {
    id: "default",
    name: "My Restaurant",
    floor: createInitialFloor(),
  },
  selectedItem: null,
  // tool: "select",
  availableFloors: [],
  currentFloorId: null,
  isLoadingFloor: false,
  loadingFloorId: null,
  error: null,
  isSaving: false,
  originalFloorData: null,
  hasUnsavedChanges: false,
};

// ==================== REDUCER UTILITIES ====================
const generateItemId = (): string =>
  `item-${crypto.randomUUID()}`;

const updateLayoutItems = (
  items: LayoutItem[],
  itemId: string,
  updater: (item: LayoutItem) => LayoutItem
): LayoutItem[] => {
  return items.map(item => {
    if (item.id === itemId) {
      return updater(item);
    }
    return item;
  });
};

const removeItemFromRoom = (items: LayoutItem[], itemId: string): LayoutItem[] => {
  return items.map(item => {
    if (item.type === "room" && item.containedItems.includes(itemId)) {
      return {
        ...item,
        containedItems: item.containedItems.filter(id => id !== itemId)
      } as RoomItem;
    }
    return item;
  });
};

// ==================== REDUCER ====================
function restaurantReducer(state: RestaurantState, action: LayoutAction): RestaurantState {
  const { floor } = state.layout;

  // Lock check helper
  const isLocked = floor.isLocked;
  const lockError = "Cannot perform action: Floor is locked";

  switch (action.type) {

    case "INIT": {
      return {
        ...state,
        layout: {
          ...state.layout,
          id: action.payload.id,
          name: action.payload.name
        }
      }
    }
    // ==================== ITEM CRUD ====================
    case "ADD_ITEM": {
      if (isLocked) return { ...state, error: lockError };

      const itemWithId = {
        ...action.payload.item,
        id: generateItemId(),
      };

      // Type assertion based on the item type
      const newItem = itemWithId as LayoutItem;

      let updatedItems = [...floor.layoutItems, newItem];

      // If adding to a room, update the room's containedItems
      if (action.payload.roomId && newItem.type !== "room") {
        updatedItems = updatedItems.map(item => {
          if (item.type === "room" && item.id === action.payload.roomId) {
            return {
              ...item,
              containedItems: [...item.containedItems, newItem.id]
            } as RoomItem;
          }
          return item;
        });
      }

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...floor,
            layoutItems: updatedItems
          },
        },
        error: null,
        hasUnsavedChanges: true,
      };
    }

    case "UPDATE_ITEM": {
      if (isLocked) return { ...state, error: lockError };

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...floor,
            layoutItems: updateLayoutItems(
              floor.layoutItems,
              action.payload.itemId,
              item => ({ ...item, ...action.payload.updates } as LayoutItem)
            ),
          },
        },
        error: null,
        hasUnsavedChanges: true,
      };
    }

    case "DELETE_ITEM": {
      if (isLocked) return { ...state, error: lockError };

      let updatedItems = floor.layoutItems.filter(item => item.id !== action.payload.itemId);

      // Remove item from any room's containedItems
      updatedItems = removeItemFromRoom(updatedItems, action.payload.itemId);

      // If deleting a room, also delete all contained items
      const deletedItem = floor.layoutItems.find(item => item.id === action.payload.itemId);
      if (deletedItem?.type === "room") {
        updatedItems = updatedItems.filter(item =>
          !deletedItem.containedItems.includes(item.id)
        );
      }

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...floor,
            layoutItems: updatedItems,
          },
        },
        selectedItem: state.selectedItem === action.payload.itemId ? null : state.selectedItem,
        error: null,
        hasUnsavedChanges: true,
      };
    }

    // ==================== ITEM INTERACTION ====================
    case "SELECT_ITEM": {
      return {
        ...state,
        selectedItem: action.payload.itemId,
      };
    }

    case "MOVE_ITEM": {
      if (isLocked) return { ...state, error: lockError };

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...floor,
            layoutItems: updateLayoutItems(
              floor.layoutItems,
              action.payload.itemId,
              item => {
                const updatedItem = {
                  ...item,
                  x: action.payload.x,
                  y: action.payload.y,
                };
                // if (action.payload.roomId && item.type !== "room") {
                //   (updatedItem as TableItem | UtilityItem).roomId = action.payload.roomId;
                // }
                return updatedItem as LayoutItem;
              }
            ),
          },
        },
        error: null,
        hasUnsavedChanges: true,
      };
    }

    case "ROTATE_ITEM": {
      if (isLocked) return { ...state, error: lockError };

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...floor,
            layoutItems: updateLayoutItems(
              floor.layoutItems,
              action.payload.itemId,
              item => ({ ...item, rotation: action.payload.rotation } as LayoutItem)
            ),
          },
        },
        error: null,
        hasUnsavedChanges: true,
      };
    }

    case "RESIZE_ITEM": {
      if (isLocked) return { ...state, error: lockError };

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...floor,
            layoutItems: updateLayoutItems(
              floor.layoutItems,
              action.payload.itemId,
              item => ({
                ...item,
                width: Math.max(300, Math.min(state.layout.floor.width - 50, action.payload.width)),
                height: Math.max(200, Math.min(state.layout.floor.height - 50, action.payload.height))
              } as LayoutItem)
            ),
          },
        },
        error: null,
        hasUnsavedChanges: true,
      };
    }

    // ==================== TOOL STATE ====================
    // case "SET_TOOL": {
    //   return {
    //     ...state,
    //     tool: action.payload.tool,
    //     selectedItem: null,
    //   };
    // }

    // ==================== FLOOR MANAGEMENT ====================
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
        loadingFloorId: null,
        error: null,
        originalFloorData: action.payload.floorData,
        hasUnsavedChanges: false,
      };
    }

    case "SET_AVAILABLE_FLOORS": {
      return {
        ...state,
        availableFloors: Object.freeze(action.payload.floors.map(f => Object.freeze(f))),
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

    case "CLEAR_CURRENT_FLOOR": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floor: createInitialFloor(),
        },
        currentFloorId: null,
        selectedItem: null,
        error: null,
        originalFloorData: null,
        hasUnsavedChanges: false,
      };
    }

    case "ADD_FLOOR": {
      return {
        ...state,
        availableFloors: Object.freeze([
          ...state.availableFloors,
          Object.freeze({ id: action.payload.floorId, name: action.payload.name })
        ]),
      };
    }

    case "DELETE_FLOOR": {
      const { floorId } = action.payload;
      const newAvailableFloors = state.availableFloors.filter(f => f.id !== floorId);

      let newCurrentFloorId = state.currentFloorId;
      if (state.currentFloorId === floorId) {
        newCurrentFloorId = newAvailableFloors.length > 0 ? newAvailableFloors[0].id : null;
      }

      return {
        ...state,
        availableFloors: Object.freeze(newAvailableFloors),
        currentFloorId: newCurrentFloorId,
        selectedItem: state.currentFloorId === floorId ? null : state.selectedItem
      };
    }

    case "RENAME_FLOOR": {
      return {
        ...state,
        availableFloors: Object.freeze(
          state.availableFloors.map(floor =>
            floor.id === action.payload.floorId
              ? Object.freeze({ ...floor, name: action.payload.name })
              : floor
          )
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
      };
    }

    case "UPDATE_FLOOR_DIMENSIONS": {
      if (isLocked) return { ...state, error: lockError };

      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...floor,
            width: action.payload.dimensions.width,
            height: action.payload.dimensions.height,
          },
        },
        error: null,
        hasUnsavedChanges: true,
      };
    }

    case "TOGGLE_FLOOR_LOCK": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floor: {
            ...floor,
            isLocked: action.payload.isLocked,
          },
        },
      };
    }

    // ==================== SAVE & CHANGE TRACKING ====================
    case "SET_SAVING": {
      return {
        ...state,
        isSaving: action.payload.isSaving,
      };
    }

    case "SET_ORIGINAL_FLOOR_DATA": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floor: action.payload.floorData
        },
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

    // ==================== ERROR HANDLING ====================
    case "SET_ERROR": {
      return {
        ...state,
        error: action.payload.error,
        isLoadingFloor: action.payload.error ? false : state.isLoadingFloor,
        isSaving: action.payload.error ? false : state.isSaving,
      };
    }

    default:
      return state;
  }
}

// ==================== CONTEXT INTERFACE ====================
interface RestaurantContextValue {
  // State
  readonly state: RestaurantState;

  // Actions
  readonly dispatch: React.Dispatch<LayoutAction>;

  // Computed values
  readonly getCurrentFloorItems: () => ReadonlyArray<LayoutItem>;
  readonly isFloorLocked: boolean;
  readonly canModifyFloor: boolean;

  // Floor operations
  readonly loadFloorData: (floorId: string) => Promise<void>;
  readonly saveCurrentFloorToBackend: () => Promise<void>;
  readonly addFloor: (name: string) => Promise<void>;
  readonly deleteFloor: (floorId: string) => Promise<void>;
  readonly renameFloor: (floorId: string, name: string) => Promise<void>;
  readonly switchFloor: (floorId: string) => Promise<void>;

  // Import/Export
  readonly importLayout: (file: File) => Promise<ExportRestaurantLayout>;
  readonly exportLayout: () => string;

  // Utilities
  readonly clearError: () => void;
  readonly retryLastOperation: () => Promise<void>;
  readonly toggleFloorLock: (isLocked: boolean) => void;

  // Item operations
  readonly getItemById: (itemId: string) => LayoutItem | undefined;
  readonly getItemsInRoom: (roomId: string) => ReadonlyArray<LayoutItem>;
}

// ==================== CONTEXT ====================
const RestaurantContext = createContext<RestaurantContextValue | null>(null);

// ==================== PROVIDER ====================
export function RestaurantProvider({ children, restaurantId }: { children: React.ReactNode, restaurantId: string }) {
  const { fetchFloors, fetchFloorLayout, createFloor, deleteFloor: DeleteFloor, saveFloorLayout } = useFloors(restaurantId);
  const [state, dispatch] = useReducer(restaurantReducer, initialState);
  const lastOperationRef = useRef<(() => Promise<void>) | null>(null);

  // ==================== COMPUTED VALUES ====================
  const isFloorLocked = useMemo(() => state.layout.floor.isLocked, [state.layout.floor.isLocked]);
  const canModifyFloor = useMemo(() => !isFloorLocked && !state.isSaving, [isFloorLocked, state.isSaving]);

  const getCurrentFloorItems = useCallback((): ReadonlyArray<LayoutItem> => {
    return Object.freeze([...state.layout.floor.layoutItems]);
  }, [state.layout.floor.layoutItems]);

  const getItemById = useCallback((itemId: string): LayoutItem | undefined => {
    return state.layout.floor.layoutItems.find(item => item.id === itemId);
  }, [state.layout.floor.layoutItems]);

  const getItemsInRoom = useCallback((roomId: string): ReadonlyArray<LayoutItem> => {
    const room = state.layout.floor.layoutItems.find(item =>
      item.type === "room" && item.id === roomId
    );

    if (!room || room.type !== "room") return Object.freeze([]);

    return Object.freeze(
      state.layout.floor.layoutItems.filter(item =>
        room.containedItems.includes(item.id)
      )
    );
  }, [state.layout.floor.layoutItems]);

  // ==================== UTILITY FUNCTIONS ====================
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


  // ==================== ASYNC OPERATIONS ====================
  const createAsyncOperation = useCallback(<T extends any[]>(
    operation: (...args: T) => Promise<void>
  ) => {
    return async (...args: T) => {
      const wrappedOperation = () => operation(...args);
      lastOperationRef.current = wrappedOperation;
      await wrappedOperation();
    };
  }, []);

  const loadFloorData = useCallback(createAsyncOperation(async (floorId: string) => {
    try {
      dispatch({ type: "SET_LOADING_FLOOR", payload: { isLoading: true, floorId } });
      dispatch({ type: "SET_ERROR", payload: { error: null } });

      const floorData = await fetchFloorLayout(floorId);
      dispatch({ type: "LOAD_FLOOR_DATA", payload: { floorData, floorId } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load floor data';
      dispatch({ type: "SET_ERROR", payload: { error: `Load Error: ${errorMessage}` } });
    }
  }), [createAsyncOperation]);

  const saveCurrentFloorToBackend = useCallback(createAsyncOperation(async () => {
    if (!state.currentFloorId) {
      dispatch({ type: "SET_ERROR", payload: { error: "Save Error: No floor is currently loaded" } });
      return;
    }

    try {
      dispatch({ type: "SET_SAVING", payload: { isSaving: true } });
      dispatch({ type: "SET_ERROR", payload: { error: null } });

      const result = await saveFloorLayout(state.currentFloorId, state.layout.floor);

      dispatch({ type: "SET_SAVING", payload: { isSaving: false } });
      if (result.updatedLayout) {
        console.log(result.updatedLayout)
        dispatch({ type: "SET_ORIGINAL_FLOOR_DATA", payload: { floorData: result.updatedLayout! } });
      }
      dispatch({ type: "TOGGLE_FLOOR_LOCK", payload: { isLocked: true } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save floor data';
      dispatch({ type: "SET_ERROR", payload: { error: `Save Error: ${errorMessage}` } });
    }
  }), [createAsyncOperation, state.currentFloorId, state.layout.floor]);

  const addFloor = useCallback(createAsyncOperation(async (name: string) => {
    try {
      dispatch({ type: "SET_ERROR", payload: { error: null } });
      const newFloor = await createFloor({ name, width: 1600, height: 1200 });
      dispatch({ type: "ADD_FLOOR", payload: { floorId: newFloor.id, name: newFloor.name } });
      dispatch({ type: "SWITCH_FLOOR", payload: { floorId: newFloor.id } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create floor';
      dispatch({ type: "SET_ERROR", payload: { error: `Create Error: ${errorMessage}` } });
    }
  }), [createAsyncOperation]);

  const deleteFloor = useCallback(createAsyncOperation(async (floorId: string) => {
    try {
      dispatch({ type: "SET_ERROR", payload: { error: null } });
      await DeleteFloor(floorId);
      dispatch({ type: "DELETE_FLOOR", payload: { floorId } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete floor';
      dispatch({ type: "SET_ERROR", payload: { error: `Delete Error: ${errorMessage}` } });
    }
  }), [createAsyncOperation]);

  const renameFloor = useCallback(createAsyncOperation(async (floorId: string, name: string) => {
    try {
      dispatch({ type: "SET_ERROR", payload: { error: null } });
      dispatch({ type: "RENAME_FLOOR", payload: { floorId, name } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename floor';
      dispatch({ type: "SET_ERROR", payload: { error: `Rename Error: ${errorMessage}` } });
    }
  }), [createAsyncOperation]);

  const switchFloor = useCallback(createAsyncOperation(async (floorId: string) => {
    try {
      if (state.currentFloorId && state.hasUnsavedChanges) {
        const confirmed = window.confirm(
          "You have unsaved changes. Are you sure you want to switch floors without saving?"
        );
        if (!confirmed) return;
      }

      dispatch({ type: "SWITCH_FLOOR", payload: { floorId } });
    } catch (error) {
      console.error("❌ Floor switch error:", error);
    }
  }), [createAsyncOperation, state.currentFloorId, state.hasUnsavedChanges]);

  // ==================== IMPORT/EXPORT ====================
  const importLayout = useCallback(async (file: File): Promise<ExportRestaurantLayout> => {
    try {
      dispatch({ type: "SET_LOADING_FLOOR", payload: { isLoading: true } });
      dispatch({ type: "SET_ERROR", payload: { error: null } });

      const importedLayout = await LayoutImporter.readFile(file);
      const floorData = importedLayout.floor;

      const floorExists = state.availableFloors.some(f => f.id === floorData.id);

      if (floorExists) {
        const shouldOverwrite = window.confirm(
          `Floor "${floorData.name}" already exists. Do you want to import the layout data into your current workspace?`
        );

        if (!shouldOverwrite) {
          dispatch({ type: "SET_LOADING_FLOOR", payload: { isLoading: false } });
          return {
            id: state.layout.id,
            name: state.layout.name,
            floor: state.layout.floor
          };
        }

        dispatch({ type: "LOAD_FLOOR_DATA", payload: { floorData, floorId: floorData.id } });
        return importedLayout;
      }

      dispatch({
        type: "SET_AVAILABLE_FLOORS",
        payload: { floors: [...state.availableFloors, { id: floorData.id, name: floorData.name }] }
      });

      dispatch({ type: "LOAD_FLOOR_DATA", payload: { floorData, floorId: floorData.id } });

      return importedLayout;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import layout';
      dispatch({ type: "SET_ERROR", payload: { error: `Import Error: ${errorMessage}` } });
      dispatch({ type: "SET_LOADING_FLOOR", payload: { isLoading: false } });
      throw error;
    }
  }, [state.availableFloors, state.layout]);

  const exportLayout = useCallback((): string => {
    if (!state.currentFloorId) {
      throw new Error('No floor to export');
    }

    const exportData: ExportRestaurantLayout = {
      id: state.layout.id,
      name: state.layout.name,
      floor: state.layout.floor,
      metadata: {
        application_name: "orderit",
        exportedAt: new Date().toISOString(),
        floorCount: state.availableFloors.length,
        itemCount: state.layout.floor.layoutItems.length,
      }
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.currentFloorId, state.layout, state.availableFloors.length]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    const fetchAvailableFloors = createAsyncOperation(async () => {
      try {
        dispatch({ type: "SET_ERROR", payload: { error: null } });
        const result = await fetchFloors();
        dispatch({ type: "INIT", payload: { name: result.restaurant.name, id: result.restaurant.id } });
        dispatch({ type: "SET_AVAILABLE_FLOORS", payload: { floors: result.floors } });
        dispatch({ type: "SWITCH_FLOOR", payload: { floorId: result.floors[0].id } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch available floors';
        dispatch({ type: "SET_ERROR", payload: { error: `Initialization Error: ${errorMessage}` } });
      }
    });

    fetchAvailableFloors();
  }, [createAsyncOperation, loadFloorData, fetchFloors]);

  useEffect(() => {
    let isCurrent = true;

    const loadFloorOnChange = async () => {
      const targetFloorId = state.currentFloorId;

      if (targetFloorId && targetFloorId !== state.layout.floor.id) {
        try {
          dispatch({ type: "SET_LOADING_FLOOR", payload: { isLoading: true, floorId: targetFloorId } });

          const floorData = await fetchFloorLayout(targetFloorId);

          if (isCurrent && state.currentFloorId === targetFloorId) {
            dispatch({ type: "LOAD_FLOOR_DATA", payload: { floorData, floorId: targetFloorId } });
          }
        } catch (error) {
          if (isCurrent && state.currentFloorId === targetFloorId) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load floor data';
            dispatch({ type: "SET_ERROR", payload: { error: `Load Error: ${errorMessage}` } });
          }
        }
      }
    };

    loadFloorOnChange();

    return () => {
      isCurrent = false;
    };
  }, [state.currentFloorId, state.layout.floor.id, fetchFloorLayout]);

  // ==================== CONTEXT VALUE ====================
  const contextValue = useMemo((): RestaurantContextValue => ({
    // State
    state,

    // Actions
    dispatch,

    // Computed values
    getCurrentFloorItems,
    isFloorLocked,
    canModifyFloor,

    // Floor operations
    loadFloorData,
    saveCurrentFloorToBackend,
    addFloor,
    deleteFloor,
    renameFloor,
    switchFloor,

    // Import/Export
    importLayout,
    exportLayout,

    // Utilities
    clearError,
    retryLastOperation,
    toggleFloorLock,

    // Item operations
    getItemById,
    getItemsInRoom,
  }), [
    state,
    dispatch,
    getCurrentFloorItems,
    isFloorLocked,
    canModifyFloor,
    loadFloorData,
    saveCurrentFloorToBackend,
    addFloor,
    deleteFloor,
    renameFloor,
    switchFloor,
    importLayout,
    exportLayout,
    clearError,
    retryLastOperation,
    toggleFloorLock,
    getItemById,
    getItemsInRoom,
  ]);

  return (
    <RestaurantContext.Provider value={contextValue}>
      {children}
    </RestaurantContext.Provider>
  );
}

// ==================== HOOK ====================
export function useRestaurant(): RestaurantContextValue {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}