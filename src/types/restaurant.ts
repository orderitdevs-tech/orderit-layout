// ====================
// Shared basics
// ====================
export interface BaseItem {
  id: string;
  x: number;        // relative if inside room, absolute if in main dining
  y: number;
  rotation: number;
  width: number;
  height: number;
}

export type SeatingStatus =
  | "available"      // free, can be assigned
  | "occupied"       // currently in use
  | "reserved"       // booked in advance
  | "maintenance"    // being cleaned or repaired
  | "out-of-service"; // temporarily or permanently unavailable


// ====================
// Room item
// ====================
export type RoomType =
  | "booth_area"      // very common in casual dining
  | "family_section"  // families are frequent customers
  | "cafe_corner"     // small tables, popular in cafes
  | "bar_area"        // bar seating
  | "outdoor_patio"   // seasonal but common
  | "rooftop"         // less common, trendy spots
  | "banquet"         // used for events, not everyday
  | "private"         // premium/private dining
  | "vip";            // rarest, special guests only


export interface RoomItem extends BaseItem {
  type: "room";
  roomType: RoomType;
  name: string;
  description: string;
  price?: number;
  status: SeatingStatus;
  containedItems: string[]; // IDs of items (tables/utilities) inside this room
  background?: string;
}

// ====================
// Table item
// ====================

export interface TableItem extends BaseItem {
  type: "table-2" | "table-4" | "table-6" | "table-8" | "table-10" | "table-12";
  tableNumber: string;
  status: SeatingStatus;
  capacity: number;
  roomId?: string; // If inside a room
}

// ====================
// Utility item
// ====================
export interface UtilityItem extends BaseItem {
  type: "washroom" | "counter" | "entry-gate" | "exit-gate" | "elevator" | "stair";
  name?: string;
  description?: string;
  roomId?: string; // Utility can also be inside a room
}

// ====================
// Union for rendering
// ====================
export type LayoutItem = RoomItem | TableItem | UtilityItem;

// ====================
// Floor & restaurant
// ====================
export interface Floor {
  id: string;
  name: string;
  width: number;
  height: number;
  layoutItems: LayoutItem[]; // contains rooms, tables, and utilities
  background?: string;
  isLocked: boolean;
  version: number;
}

export interface RestaurantLayout {
  id: string;
  name: string;
  floor: Floor;
}


export interface DragItem {
  type:
  | "table-2"
  | "table-4"
  | "table-6"
  | "table-8"
  | "table-10"
  | "table-12"
  | "washroom"
  | "counter"
  | "entry-gate"
  | "exit-gate"
  | "room"
  | "elevator"
  | "stair";
  width: number;
  height: number;
  image: string;
}

export interface ExportRestaurantLayout {
  id: string;
  name: string;
  floor: Floor;
  metadata?: {
    exportedAt?: string;
    exportedBy?: string;
    [key: string]: any; // Allow additional metadata
  };
}