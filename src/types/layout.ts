import { Floor, LayoutItem } from "./restaurant";

export type LayoutAction =
    | { type: "INIT"; payload: { name: string, id: string } }
    // --- ITEM CRUD (works for TableItem, UtilityItem, RoomItem) ---
    | { type: "ADD_ITEM"; payload: { item: Omit<LayoutItem, "id">; roomId?: string } }
    | { type: "UPDATE_ITEM"; payload: { itemId: string; updates: Partial<LayoutItem> } }
    | { type: "DELETE_ITEM"; payload: { itemId: string; roomId?: string } }

    // --- ITEM INTERACTION ---
    | { type: "SELECT_ITEM"; payload: { itemId: string | null } }
    | { type: "MOVE_ITEM"; payload: { itemId: string; x: number; y: number; roomId?: string } }
    | { type: "ROTATE_ITEM"; payload: { itemId: string; rotation: number; roomId?: string } }
    | { type: "RESIZE_ITEM"; payload: { itemId: string; width: number; height: number; roomId?: string } }

    // // --- TOOL STATE ---
    // | { type: "SET_TOOL"; payload: { tool: "select" | "pan" } }

    // --- FLOOR MANAGEMENT ---
    | { type: "LOAD_FLOOR_DATA"; payload: { floorData: Floor; floorId: string } }
    | { type: "SET_AVAILABLE_FLOORS"; payload: { floors: { id: string; name: string }[] } }
    | { type: "SET_LOADING_FLOOR"; payload: { isLoading: boolean; floorId?: string | null } }
    | { type: "CLEAR_CURRENT_FLOOR" }
    | { type: "ADD_FLOOR"; payload: { floorId: string; name: string } }
    | { type: "DELETE_FLOOR"; payload: { floorId: string } }
    | { type: "RENAME_FLOOR"; payload: { floorId: string; name: string } }
    | { type: "SWITCH_FLOOR"; payload: { floorId: string } }
    | { type: "UPDATE_FLOOR_DIMENSIONS"; payload: { dimensions: { width: number; height: number } } }
    | { type: "TOGGLE_FLOOR_LOCK"; payload: { isLocked: boolean } }

    // --- SAVE & CHANGE TRACKING ---
    | { type: "SET_SAVING"; payload: { isSaving: boolean } }
    | { type: "SET_ORIGINAL_FLOOR_DATA"; payload: { floorData: Floor } }
    | { type: "SET_UNSAVED_CHANGES"; payload: { hasUnsavedChanges: boolean } }
    | { type: "RESET_UNSAVED_CHANGES" }

    // --- ERROR HANDLING ---
    | { type: "SET_ERROR"; payload: { error: string | null } };
