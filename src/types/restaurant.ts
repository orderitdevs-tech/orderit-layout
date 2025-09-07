export type TableStatus =
  | "free"
  | "occupied"
  | "reserved"
  | "maintenance"
  | "out-of-service";

export type TableType =
  | "regular"
  | "vip"
  | "booth"
  | "bar"
  | "outdoor"
  | "private";

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
  width: number;
  height: number;

  // Extra metadata
  status: TableStatus;
  tableNumber?: string;
  floor?: string;
  capacity?: number;
  description?: string;
  tableType?: TableType;
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
    | "table-3"
    | "table-4"
    | "table-5"
    | "table-6"
    | "table-7"
    | "table-8"
    | "table-9"
    | "table-10"
    | "table-12"
    | "washroom"
    | "counter"
    | "entry-gate"
    | "exit-gate";
  width: number;
  height: number;
  image: string;
}
