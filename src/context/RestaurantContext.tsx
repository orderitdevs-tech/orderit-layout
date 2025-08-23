"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  RestaurantLayout,
  Floor,
  TableItem,
  TableStatus,
} from "../types/restaurant";
import { generateTableId, generateFloorId } from "../utils/tableConfig";

interface RestaurantState {
  layout: RestaurantLayout;
  selectedTable: string | null;
  isDragging: boolean;
  tool: "select" | "pan" | "rotate";
}

type RestaurantAction =
  | { type: "ADD_TABLE"; payload: { table: Omit<TableItem, "id"> } }
  | {
      type: "UPDATE_TABLE";
      payload: { tableId: string; updates: Partial<TableItem> };
    }
  | { type: "DELETE_TABLE"; payload: { tableId: string } }
  | { type: "SELECT_TABLE"; payload: { tableId: string | null } }
  | { type: "ADD_FLOOR"; payload: { name: string } }
  | { type: "SWITCH_FLOOR"; payload: { floorId: string } }
  | { type: "RENAME_FLOOR"; payload: { floorId: string; name: string } }
  | { type: "DELETE_FLOOR"; payload: { floorId: string } }
  | { type: "SET_DRAGGING"; payload: { isDragging: boolean } }
  | { type: "SET_TOOL"; payload: { tool: "select" | "pan" | "rotate" } }
  | { type: "LOAD_LAYOUT"; payload: { layout: RestaurantLayout } };

const initialFloor: Floor = {
  id: generateFloorId(),
  name: "Main Floor",
  tables: [],
};

const initialState: RestaurantState = {
  layout: {
    id: "restaurant_1",
    name: "My Restaurant",
    floors: [initialFloor],
    currentFloor: initialFloor.id,
  },
  selectedTable: null,
  isDragging: false,
  tool: "select",
};

function restaurantReducer(
  state: RestaurantState,
  action: RestaurantAction
): RestaurantState {
  switch (action.type) {
    case "ADD_TABLE": {
      const newTable: TableItem = {
        ...action.payload.table,
        id: generateTableId(),
        floor: state.layout.currentFloor,
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
          floors: state.layout.floors.map((floor) => ({
            ...floor,
            tables: floor.tables.map((table) =>
              table.id === action.payload.tableId
                ? { ...table, ...action.payload.updates }
                : table
            ),
          })),
        },
      };
    }

    case "DELETE_TABLE": {
      return {
        ...state,
        layout: {
          ...state.layout,
          floors: state.layout.floors.map((floor) => ({
            ...floor,
            tables: floor.tables.filter(
              (table) => table.id !== action.payload.tableId
            ),
          })),
        },
        selectedTable:
          state.selectedTable === action.payload.tableId
            ? null
            : state.selectedTable,
      };
    }

    case "SELECT_TABLE": {
      return {
        ...state,
        selectedTable: action.payload.tableId,
      };
    }

    case "ADD_FLOOR": {
      const newFloor: Floor = {
        id: generateFloorId(),
        name: action.payload.name,
        tables: [],
      };

      return {
        ...state,
        layout: {
          ...state.layout,
          floors: [...state.layout.floors, newFloor],
        },
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

    case "DELETE_FLOOR": {
      const remainingFloors = state.layout.floors.filter(
        (floor) => floor.id !== action.payload.floorId
      );
      const newCurrentFloor =
        remainingFloors.length > 0 ? remainingFloors[0].id : "";

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

    case "SET_DRAGGING": {
      return {
        ...state,
        isDragging: action.payload.isDragging,
      };
    }

    case "SET_TOOL": {
      return {
        ...state,
        tool: action.payload.tool,
        selectedTable:
          action.payload.tool !== "select" ? null : state.selectedTable,
      };
    }

    case "LOAD_LAYOUT": {
      return {
        ...state,
        layout: action.payload.layout,
        selectedTable: null,
      };
    }

    default:
      return state;
  }
}

interface RestaurantContextType {
  state: RestaurantState;
  dispatch: React.Dispatch<RestaurantAction>;
  getCurrentFloor: () => Floor | undefined;
  getCurrentFloorTables: () => TableItem[];
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(
  undefined
);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(restaurantReducer, initialState);

  const getCurrentFloor = () => {
    return state.layout.floors.find(
      (floor) => floor.id === state.layout.currentFloor
    );
  };

  const getCurrentFloorTables = () => {
    const currentFloor = getCurrentFloor();
    return currentFloor ? currentFloor.tables : [];
  };

  return (
    <RestaurantContext.Provider
      value={{
        state,
        dispatch,
        getCurrentFloor,
        getCurrentFloorTables,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
