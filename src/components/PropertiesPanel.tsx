"use client";

import React, { useState } from "react";
import { X, Trash2, RotateCw } from "lucide-react";
import { useRestaurant } from "../context/RestaurantContext";
import { TableStatus } from "../types/restaurant";
import { TABLE_STATUS_COLORS } from "../utils/tableConfig";

export default function PropertiesPanel() {
  const { state, dispatch, getCurrentFloorTables } = useRestaurant();

  const selectedTable = getCurrentFloorTables().find(
    (table) => table.id === state.selectedTable
  );

  const [tableNumber, setTableNumber] = useState(
    selectedTable?.tableNumber || ""
  );

  if (!selectedTable) {
    return (
      <div className="bg-custom border-l border-custom w-64 h-full p-4">
        <div className="text-center text-custom/60 mt-20">
          <div className="text-lg mb-2">🍽️</div>
          <p className="text-sm">Select a table to edit properties</p>
        </div>
      </div>
    );
  }

  const handleStatusChange = (status: TableStatus) => {
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        tableId: selectedTable.id,
        updates: { status },
      },
    });
  };

  const handleTableNumberChange = (value: string) => {
    setTableNumber(value);
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        tableId: selectedTable.id,
        updates: { tableNumber: value },
      },
    });
  };

  const handleRotate = () => {
    const newRotation = (selectedTable.rotation + 90) % 360;
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        tableId: selectedTable.id,
        updates: { rotation: newRotation },
      },
    });
  };

  const handleDelete = () => {
    dispatch({
      type: "DELETE_TABLE",
      payload: { tableId: selectedTable.id },
    });
  };

  const statuses: TableStatus[] = [
    "free",
    "occupied",
    "reserved",
    "maintenance",
  ];

  return (
    <div className="bg-custom border-l border-custom w-64 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-custom flex items-center justify-between">
        <h3 className="text-sm font-semibold text-custom">
          {selectedTable.type.startsWith("table-")
            ? "Table Properties"
            : "Item Properties"}
        </h3>
        <button
          onClick={() =>
            dispatch({ type: "SELECT_TABLE", payload: { tableId: null } })
          }
          className="p-1 rounded-md hover:bg-accent text-custom/60 hover:text-custom"
        >
          <X size={16} />
        </button>
      </div>

      {/* Table Info */}
      <div className="p-4 border-b border-custom">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-custom mb-1">
              {selectedTable.type.startsWith("table-")
                ? "Table Number"
                : "Item Label"}
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => handleTableNumberChange(e.target.value)}
              className="w-full px-3 py-2 border border-custom rounded-md text-sm text-custom bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={
                selectedTable.type.startsWith("table-")
                  ? "Enter table number"
                  : "Enter label"
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-custom mb-1">
              Item Type
            </label>
            <div className="px-3 py-2 bg-accent border border-custom rounded-md text-sm text-custom/80">
              {selectedTable.type === "washroom"
                ? "Washroom"
                : selectedTable.type === "counter"
                ? "Service Counter"
                : selectedTable.type === "entry-gate"
                ? "Entry Gate"
                : selectedTable.type === "exit-gate"
                ? "Exit Gate"
                : `${selectedTable.type.replace("table-", "")} Seater Table`}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-custom mb-1">
              Position
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={Math.round(selectedTable.x)}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_TABLE",
                    payload: {
                      tableId: selectedTable.id,
                      updates: { x: parseInt(e.target.value) || 0 },
                    },
                  })
                }
                className="flex-1 px-2 py-1 border border-custom rounded text-xs text-custom bg-accent"
                placeholder="X"
              />
              <input
                type="number"
                value={Math.round(selectedTable.y)}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_TABLE",
                    payload: {
                      tableId: selectedTable.id,
                      updates: { y: parseInt(e.target.value) || 0 },
                    },
                  })
                }
                className="flex-1 px-2 py-1 border border-custom rounded text-xs text-custom bg-accent"
                placeholder="Y"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-custom mb-1">
              Rotation
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={selectedTable.rotation}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_TABLE",
                    payload: {
                      tableId: selectedTable.id,
                      updates: { rotation: parseInt(e.target.value) || 0 },
                    },
                  })
                }
                className="flex-1 px-2 py-1 border border-custom rounded text-xs text-custom bg-accent"
                placeholder="Degrees"
                min="0"
                max="359"
              />
              <button
                onClick={handleRotate}
                className="p-2 rounded-md hover:bg-accent text-custom/60 hover:text-custom"
                title="Rotate 90°"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status - Only show for tables */}
      {selectedTable.type.startsWith("table-") && (
        <div className="p-4 border-b border-custom">
          <label className="block text-xs font-medium text-custom mb-3">
            Status
          </label>
          <div className="space-y-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`w-full p-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                  selectedTable.status === status
                    ? "bg-primary-light text-primary border border-primary"
                    : "bg-accent text-custom hover:bg-primary-lighter border border-custom"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TABLE_STATUS_COLORS[status] }}
                />
                <span className="capitalize">{status}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 mt-auto">
        <button
          onClick={handleDelete}
          className="w-full p-2 rounded-md text-sm bg-secondary-light text-secondary border border-secondary hover:bg-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={14} />
          Delete {selectedTable.type.startsWith("table-") ? "Table" : "Item"}
        </button>
      </div>
    </div>
  );
}
