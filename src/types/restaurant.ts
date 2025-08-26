export type TableStatus = "free" | "occupied" | "reserved" | "maintenance";

export interface TableItem {
  id: string;
  type:
    | "table-2"
    | "table-4"
    | "table-6"
    | "table-8"
    | "table-12"
    | "washroom"
    | "counter"
    | "entry-gate"
    | "exit-gate";
  x: number;
  y: number;
  rotation: number;
  status: TableStatus;
  tableNumber?: string;
  floor?: string;
  width: number;
  height: number;
}

export interface Floor {
  id: string;
  name: string;
  tables: TableItem[];
  background?: string;
}

export interface RestaurantLayout {
  id: string;
  name: string;
  floors: Floor[];
  currentFloor: string;
}

export interface DragItem {
  type:
    | "table-2"
    | "table-4"
    | "table-6"
    | "table-8"
    | "table-12"
    | "washroom"
    | "counter"
    | "entry-gate"
    | "exit-gate";
  width: number;
  height: number;
  image: string;
}
