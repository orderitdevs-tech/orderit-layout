"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import { RestaurantLayout, TableItem, Floor } from "../types/restaurant";

interface RestaurantState {
  layout: RestaurantLayout & { floorDimensions?: { width: number; height: number } };
  selectedTable: string | null;
  tool: "select" | "pan";
}

type RestaurantAction =
  | { type: "ADD_TABLE"; payload: { table: Omit<TableItem, "id"> } }
  | { type: "UPDATE_TABLE"; payload: { tableId: string; updates: Partial<TableItem> } }
  | { type: "DELETE_TABLE"; payload: { tableId: string } }
  | { type: "SELECT_TABLE"; payload: { tableId: string | null } }
  | { type: "SET_TOOL"; payload: { tool: "select" | "pan" } }
  | { type: "ADD_FLOOR"; payload: { name: string } }
  | { type: "DELETE_FLOOR"; payload: { floorId: string } }
  | { type: "SWITCH_FLOOR"; payload: { floorId: string } }
  | { type: "RENAME_FLOOR"; payload: { floorId: string; name: string } }
  | { type: "LOAD_LAYOUT"; payload: { layout: any } }
  | { type: "UPDATE_FLOOR_DIMENSIONS"; payload: { dimensions: { width: number; height: number } } };

const initialState: RestaurantState = {
  layout: {
    id: "default",
    name: "My Restaurant",
    floors: [
      {
        id: "floor-1",
        name: "Main Floor",
        tables: [],
      },
    ],
    currentFloor: "floor-1",
    floorDimensions: { width: 1600, height: 1200 }, // Default dimensions
  },
  selectedTable: null,
  tool: "select",
};

function restaurantReducer(state: RestaurantState, action: RestaurantAction): RestaurantState {
  switch (action.type) {
    case "ADD_TABLE": {
      const newTable: TableItem = {
        ...action.payload.table,
        id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      return {
        ...state,
        layout: {
          ...state.layout,
          floors: state.layout.floors.map((floor) =>
            floor.id === state.layout.currentFloor
              ? { ...floor, tables: [...floor.tables, newTable] }
              : floor
          ),
        },
      };
    }

    case "UPDATE_TABLE": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floors: state.layout.floors.map((floor) =>
            floor.id === state.layout.currentFloor
              ? {
                ...floor,
                tables: floor.tables.map((table) =>
                  table.id === action.payload.tableId
                    ? { ...table, ...action.payload.updates }
                    : table
                ),
              }
              : floor
          ),
        },
      };
    }

    case "DELETE_TABLE": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floors: state.layout.floors.map((floor) =>
            floor.id === state.layout.currentFloor
              ? {
                ...floor,
                tables: floor.tables.filter((table) => table.id !== action.payload.tableId),
              }
              : floor
          ),
        },
        selectedTable: state.selectedTable === action.payload.tableId ? null : state.selectedTable,
      };
    }

    case "SELECT_TABLE": {
      return {
        ...state,
        selectedTable: action.payload.tableId,
      };
    }

    case "SET_TOOL": {
      return {
        ...state,
        tool: action.payload.tool,
        selectedTable: null,
      };
    }

    case "ADD_FLOOR": {
      const newFloor: Floor = {
        id: `floor-${Date.now()}`,
        name: action.payload.name,
        tables: [],
      };

      return {
        ...state,
        layout: {
          ...state.layout,
          floors: [...state.layout.floors, newFloor],
          currentFloor: newFloor.id,
        },
        selectedTable: null,
      };
    }

    case "DELETE_FLOOR": {
      const remainingFloors = state.layout.floors.filter((f) => f.id !== action.payload.floorId);
      const newCurrentFloor =
        state.layout.currentFloor === action.payload.floorId
          ? remainingFloors[0]?.id || state.layout.floors[0]?.id
          : state.layout.currentFloor;

      return {
        ...state,
        layout: {
          ...state.layout,
          floors: remainingFloors,
          currentFloor: newCurrentFloor,
        },
        selectedTable: null,
      };
    }

    case "SWITCH_FLOOR": {
      return {
        ...state,
        layout: {
          ...state.layout,
          currentFloor: action.payload.floorId,
        },
        selectedTable: null,
      };
    }

    case "RENAME_FLOOR": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floors: state.layout.floors.map((floor) =>
            floor.id === action.payload.floorId
              ? { ...floor, name: action.payload.name }
              : floor
          ),
        },
      };
    }

    case "LOAD_LAYOUT": {
      const layout = action.payload.layout;

      return {
        ...state,
        layout: {
          ...layout,
          // Preserve or set default floor dimensions if not present
          floorDimensions: layout.floorDimensions || { width: 1600, height: 1200 },
        },
        selectedTable: null,
        tool: "select",
      };
    }

    case "UPDATE_FLOOR_DIMENSIONS": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floorDimensions: action.payload.dimensions,
        },
      };
    }

    default:
      return state;
  }
}

const RestaurantContext = createContext<{
  state: RestaurantState;
  dispatch: React.Dispatch<RestaurantAction>;
  getCurrentFloorTables: () => TableItem[];
  exportLayoutWithDimensions: () => any;
} | null>(null);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(restaurantReducer, initialState);

  const getCurrentFloorTables = useCallback(() => {
    const currentFloor = state.layout.floors.find((f) => f.id === state.layout.currentFloor);
    return currentFloor?.tables || [];
  }, [state.layout.floors, state.layout.currentFloor]);

  const exportLayoutWithDimensions = useCallback(() => {
    return {
      ...state.layout,
      exportedAt: new Date().toISOString(),
      version: "1.1", // Version with floor dimensions support
    };
  }, [state.layout]);

  return (
    <RestaurantContext.Provider
      value={{
        state,
        dispatch,
        getCurrentFloorTables,
        exportLayoutWithDimensions
      }}
    >
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