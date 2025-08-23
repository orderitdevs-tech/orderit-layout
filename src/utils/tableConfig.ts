import { DragItem, TableStatus } from "../types/restaurant";

export const TABLE_CONFIGS: Record<string, DragItem> = {
  "table-2": {
    type: "table-2",
    width: 80,
    height: 60,
    image: "/tables/table-2.svg",
  },
  "table-4": {
    type: "table-4",
    width: 100,
    height: 80,
    image: "/tables/table-4.svg",
  },
  "table-6": {
    type: "table-6",
    width: 120,
    height: 100,
    image: "/tables/table-6.svg",
  },
  "table-8": {
    type: "table-8",
    width: 140,
    height: 120,
    image: "/tables/table-8.svg",
  },
  "table-12": {
    type: "table-12",
    width: 180,
    height: 140,
    image: "/tables/table-12.svg",
  },
  "washroom": {
    type: "washroom",
    width: 100,
    height: 80,
    image: "/tables/washroom.svg",
  },
  "counter": {
    type: "counter",
    width: 200,
    height: 60,
    image: "/tables/counter.svg",
  },
  "entry-gate": {
    type: "entry-gate",
    width: 120,
    height: 40,
    image: "/tables/entry-gate.svg",
  },
  "exit-gate": {
    type: "exit-gate",
    width: 120,
    height: 40,
    image: "/tables/exit-gate.svg",
  },
};

export const TABLE_STATUS_COLORS: Record<TableStatus, string> = {
  free: "#22c55e", // green
  occupied: "#ef4444", // red
  reserved: "#f59e0b", // yellow
  maintenance: "#6b7280", // gray
};

export const generateTableId = (): string => {
  return `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateFloorId = (): string => {
  return `floor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
