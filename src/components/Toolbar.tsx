"use client";

import React from "react";
import {
  Move,
  MousePointer,
  RotateCw,
  Plus,
  Save,
  FolderOpen,
  Layers,
} from "lucide-react";
import { useRestaurant } from "../context/RestaurantContext";
import { TABLE_CONFIGS } from "../utils/tableConfig";

interface ToolbarProps {
  onAddFloor: () => void;
  onSaveLayout: () => void;
  onLoadLayout: () => void;
}

export default function Toolbar({
  onAddFloor,
  onSaveLayout,
  onLoadLayout,
}: ToolbarProps) {
  const { state, dispatch } = useRestaurant();

  const handleDragStart = (
    e: React.DragEvent,
    tableType: keyof typeof TABLE_CONFIGS
  ) => {
    console.log("Drag start:", tableType);
    const data = {
      type: "TABLE",
      tableType: tableType,
      config: TABLE_CONFIGS[tableType],
    };
    console.log("Setting drag data:", data);
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "copy";
  };

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "pan", icon: Move, label: "Pan" },
    { id: "rotate", icon: RotateCw, label: "Rotate" },
  ] as const;

  return (
    <div className="bg-white border-r border-gray-200 w-64 h-full flex flex-col">
      {/* Tools Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tools</h3>
        <div className="flex gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() =>
                  dispatch({ type: "SET_TOOL", payload: { tool: tool.id } })
                }
                className={`p-2 rounded-md border transition-colors ${
                  state.tool === tool.id
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
                title={tool.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Tables Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tables</h3>
        <div className="space-y-2">
          {Object.entries(TABLE_CONFIGS).map(([type, config]) => {
            const getItemLabel = (itemType: string) => {
              if (itemType === "washroom") return "Washroom";
              if (itemType === "counter") return "Service Counter";
              if (itemType === "entry-gate") return "Entry Gate";
              if (itemType === "exit-gate") return "Exit Gate";
              return `${itemType.replace("table-", "")} Seater Table`;
            };

            const getIconContent = (itemType: string) => {
              if (itemType === "washroom") return "🚻";
              if (itemType === "counter") return "🍴";
              if (itemType === "entry-gate") return "🚪";
              if (itemType === "exit-gate") return "🚪";
              return itemType.split("-")[1];
            };

            return (
              <div
                key={type}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, type as keyof typeof TABLE_CONFIGS)
                }
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors drag-item no-select"
              >
                <div className="w-8 h-8 bg-gray-300 rounded border flex items-center justify-center text-xs font-medium">
                  {getIconContent(type)}
                </div>
                <span className="text-sm text-gray-700 capitalize">
                  {getItemLabel(type)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floor Management */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Floors</h3>
        <div className="space-y-2">
          {state.layout.floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() =>
                dispatch({
                  type: "SWITCH_FLOOR",
                  payload: { floorId: floor.id },
                })
              }
              className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                state.layout.currentFloor === floor.id
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Layers size={14} className="inline mr-2" />
              {floor.name}
            </button>
          ))}
          <button
            onClick={onAddFloor}
            className="w-full p-2 rounded-md text-sm bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
          >
            <Plus size={14} className="inline mr-2" />
            Add Floor
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 mt-auto">
        <div className="space-y-2">
          <button
            onClick={onSaveLayout}
            className="w-full p-2 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <Save size={14} className="inline mr-2" />
            Save Layout
          </button>
          <button
            onClick={onLoadLayout}
            className="w-full p-2 rounded-md text-sm bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <FolderOpen size={14} className="inline mr-2" />
            Load Layout
          </button>
        </div>
      </div>
    </div>
  );
}
