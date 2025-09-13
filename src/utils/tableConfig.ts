import { DragItem, SeatingStatus } from "../types/restaurant";

export const LAYOUT_ITEM_CONFIGS: Record<string, DragItem> = {
  room: {
    type: "room",
    width: 300,
    height: 200,
    image: "/tables/room.png"
  },
  "table-2": {
    type: "table-2",
    width: 80,
    height: 60,
    image: "/tables/table-2.png",
  },
  "table-4": {
    type: "table-4",
    width: 100,
    height: 80,
    image: "/tables/table-4.png",
  },
  "table-6": {
    type: "table-6",
    width: 120,
    height: 100,
    image: "/tables/table-6.png",
  },
  "table-8": {
    type: "table-8",
    width: 140,
    height: 120,
    image: "/tables/table-8.png",
  },
  "table-10": {
    type: "table-10",
    width: 160,
    height: 130,
    image: "/tables/table-10.png",
  },
  "table-12": {
    type: "table-12",
    width: 180,
    height: 140,
    image: "/tables/table-12.png",
  },
  counter: {
    type: "counter",
    width: 200,
    height: 60,
    image: "/tables/counter.svg",
  },
  "entry-gate": {
    type: "entry-gate",
    width: 80,
    height: 100,
    image: "/tables/entrance_icon.svg",
  },
  "exit-gate": {
    type: "exit-gate",
    width: 80,
    height: 100,
    image: "/tables/exit_icon.svg",
  },
  "elevator": {
    type: "elevator",
    width: 80,
    height: 100,
    image: "/tables/elevator_icon.svg",
  },
  "stair": {
    type: "stair",
    width: 80,
    height: 100,
    image: "/tables/stairs_icon.svg",
  },
  washroom: {
    type: "washroom",
    width: 120,
    height: 100,
    image: "/tables/washroom.svg",
  },
};

export const TABLE_STATUS_COLORS: Record<SeatingStatus, string> = {
  available: "#22c55e",        // green
  occupied: "#ef4444",    // red
  reserved: "#f59e0b",    // yellow
  maintenance: "#6b7280", // gray
  "out-of-service": "#9333ea", // purple
};

export const generateTableId = (): string => {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateFloorId = (): string => {
  return `floor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
