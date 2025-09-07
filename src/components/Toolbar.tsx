"use client";

import React, { useState } from "react";
import {
  Move,
  MousePointer,
  Plus,
  Save,
  FolderOpen,
  Layers,
  Edit3,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useRestaurant } from "../context/RestaurantContext";
import { TABLE_CONFIGS } from "../utils/tableConfig";
import { Floor } from "../types/restaurant";
import { useTouchDrag } from "../hooks/useTouchDrag"; // Import the hook
import { motion } from "framer-motion";

interface PlaceItemProps {
  floor: Floor;
  isActive: boolean;
  onSwitch: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function PlaceItem({
  floor,
  isActive,
  onSwitch,
  onRename,
  onDelete,
  canDelete,
}: PlaceItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(floor.name);

  const handleSave = () => {
    if (editName.trim()) {
      onRename(editName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(floor.name);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 p-2 bg-primary-light border border-primary rounded-md">
        <Layers size={14} className="text-primary flex-shrink-0" />
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 px-2 py-1 text-sm border border-custom rounded text-custom focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="p-1 text-primary hover:bg-primary-lighter rounded"
          title="Save"
        >
          <Check size={12} />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-custom hover:bg-accent rounded"
          title="Cancel"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 p-2 rounded-md text-sm transition-colors ${isActive
          ? "bg-primary-light text-primary border border-primary"
          : "bg-accent text-custom hover:bg-primary-lighter border border-custom"
        }`}
    >
      <button
        onClick={onSwitch}
        className="flex items-center gap-2 flex-1 text-left"
      >
        <Layers size={14} />
        <span className="truncate">{floor.name}</span>
      </button>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 opacity-60 hover:text-primary hover:bg-primary-lighter hover:opacity-100 rounded transition-all"
        title="Rename"
      >
        <Edit3 size={12} />
      </button>
      {canDelete && (
        <button
          onClick={onDelete}
          className="p-1 opacity-60 hover:text-secondary hover:bg-secondary-lighter hover:opacity-100 rounded transition-all"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

interface ToolbarProps {
  onAddFloor: () => void;
  onSaveLayout: () => void;
  onLoadLayout: () => void;
  onTouchDrop: (config: any, position: { x: number; y: number }) => void; // Add this prop
}

export default function Toolbar({
  onAddFloor,
  onSaveLayout,
  onLoadLayout,
  onTouchDrop, // Add this prop
}: ToolbarProps) {
  const { state, dispatch } = useRestaurant();
  const { isDragging, dragPreview, handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchDrag();

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
  ] as const;

  return (
    <>
      <div className="bg-custom border-r border-custom w-64 h-full flex flex-col">
        {/* Tools Section */}
        <div className="p-4 border-b border-custom">
          <h3 className="text-sm font-semibold text-custom mb-3">Tools</h3>
          <div className="flex gap-1">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() =>
                    dispatch({ type: "SET_TOOL", payload: { tool: tool.id } })
                  }
                  className={`p-2 rounded-md border transition-colors ${state.tool === tool.id
                      ? "bg-primary-light border-primary text-primary"
                      : "bg-accent border-custom text-custom hover:bg-primary-lighter"
                    }`}
                  title={tool.label}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Items Section */}
        <div
          className="p-4 border-b border-custom max-h-140 overflow-y-auto"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd(onTouchDrop)}
        >
          <h3 className="text-sm font-semibold text-custom mb-3">Drag Items</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TABLE_CONFIGS).map(([type, config]) => (
              <div
                key={type}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, type as keyof typeof TABLE_CONFIGS)
                }
                onTouchStart={handleTouchStart({
                  type: "TABLE",
                  tableType: type as keyof typeof TABLE_CONFIGS,
                  config: config
                })}
                className={`aspect-square bg-gradient-to-br from-accent to-primary-lighter rounded-lg border border-custom cursor-grab hover:from-primary-lighter hover:to-primary-light hover:shadow-md hover:border-primary transition-all duration-200 drag-item no-select flex items-center justify-center p-2 ${isDragging ? 'touch-none' : ''
                  }`}
              >
                <motion.img
                  src={config.image}
                  alt={`${type} preview`}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Places Management */}
        <div className="p-4 border-b border-custom max-h-60 overflow-y-auto">
          <h3 className="text-sm font-semibold text-custom mb-3">Places</h3>
          <div className="space-y-2">
            {state.layout.floors.map((floor) => (
              <PlaceItem
                key={floor.id}
                floor={floor}
                isActive={state.layout.currentFloor === floor.id}
                onSwitch={() =>
                  dispatch({
                    type: "SWITCH_FLOOR",
                    payload: { floorId: floor.id },
                  })
                }
                onRename={(newName) =>
                  dispatch({
                    type: "RENAME_FLOOR",
                    payload: { floorId: floor.id, name: newName },
                  })
                }
                onDelete={() =>
                  dispatch({
                    type: "DELETE_FLOOR",
                    payload: { floorId: floor.id },
                  })
                }
                canDelete={state.layout.floors.length > 1}
              />
            ))}
            <button
              onClick={onAddFloor}
              className="w-full p-2 rounded-md text-sm bg-primary-light text-primary border border-primary hover:bg-primary-lighter transition-colors"
            >
              <Plus size={14} className="inline mr-2" />
              Add Place
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 mt-auto">
          <div className="space-y-2">
            <button
              onClick={onSaveLayout}
              className="w-full p-2 rounded-md text-sm bg-primary-light text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Save size={14} className="inline mr-2" />
              Save Layout
            </button>
            <button
              onClick={onLoadLayout}
              className="w-full p-2 rounded-md text-sm bg-accent text-custom border border-custom hover:bg-primary-lighter transition-colors"
            >
              <FolderOpen size={14} className="inline mr-2" />
              Load Layout
            </button>
          </div>
        </div>
      </div>

      {/* Touch Drag Preview */}
      {dragPreview && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPreview.x - 50,
            top: dragPreview.y - 50,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-accent to-primary-lighter rounded-lg border-2 border-primary shadow-lg opacity-80 flex items-center justify-center p-2">
            <motion.img
              src={dragPreview.config.config.image}
              alt="Drag preview"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}