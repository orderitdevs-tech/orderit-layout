"use client";

import React, { useState } from "react";
import {
  Move,
  MousePointer,
  Plus,
  Save,
  Layers,
  Edit3,
  Trash2,
  Loader2,
  Upload,
  Download
} from "lucide-react";
import { useRestaurant } from "../context/RestaurantContext";
import { LAYOUT_ITEM_CONFIGS } from "../utils/tableConfig";
import { useTouchDrag } from "../hooks/useTouchDrag";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import RenameModal from "./RenameModal";
import { FileInput } from "./FileInput";
import AddFloorModal from "./AddFloorModal";

interface PlaceItemProps {
  floor: { id: string; name: string };
  isActive: boolean;
  isLoading: boolean;
  onSwitch: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  canDelete: boolean;
  isLocked: boolean;
}

export function PlaceItem({
  floor,
  isActive,
  isLoading,
  onSwitch,
  onRename,
  onDelete,
  canDelete,
  isLocked,
}: PlaceItemProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const handleSave = (newName: string) => {
    if (!isLocked && newName.trim()) {
      onRename(newName.trim());
      setIsRenameOpen(false);
    }
  };

  return (
    <>
      {/* Row layout */}
      <Card
        className={`flex flex-row items-center justify-between gap-2 p-1 px-2 text-sm cursor-pointer transition-all duration-200 ${isActive
          ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 shadow-md"
          : "hover:bg-orange-50 hover:border-orange-200 shadow-sm"
          } ${isLoading ? "opacity-70" : ""}`}
      >
        {/* Switchable button (icon + name) */}
        <button
          onClick={onSwitch}
          disabled={isLoading}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <Layers
            size={16}
            className={`flex-shrink-0 ${isActive ? "text-orange-600" : "text-gray-500"
              }`}
          />
          <span className="truncate font-medium">
            {floor.name}
            {isLoading && " (Loading...)"}
          </span>
          {isLoading && (
            <Loader2 size={14} className="animate-spin text-orange-600 ml-1" />
          )}
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => !isLocked && setIsRenameOpen(true)}
            disabled={isLocked || isLoading}
            className="h-7 w-7 p-0 text-gray-500 hover:text-orange-600 hover:bg-orange-100 transition-colors duration-200 cursor-pointer"
          >
            <Edit3 size={12} />
          </Button>
          {canDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={!isLocked && !isLoading ? onDelete : undefined}
              disabled={isLocked || isLoading}
              className="h-7 w-7 p-0 text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors duration-200"
            >
              <Trash2 size={12} />
            </Button>
          )}
        </div>
      </Card>

      {/* Reused modal for renaming */}
      <RenameModal
        open={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        defaultValue={floor.name}
        onSave={handleSave}
      />
    </>
  );
}

interface ToolbarProps {
  onTouchDrop: (config: any, position: { x: number; y: number }) => void;
}

export default function Toolbar({ onTouchDrop }: ToolbarProps) {
  const {
    state,
    dispatch,
    switchFloor,
    renameFloor,
    deleteFloor,
    addFloor,
    saveCurrentFloorToBackend,
    importLayout,
    exportLayout
  } = useRestaurant();

  const { isDragging, dragPreview, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useTouchDrag();
  const isLocked = state.layout.floor.isLocked;
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);

  const handleDragStart = (
    e: React.DragEvent,
    tableType: keyof typeof LAYOUT_ITEM_CONFIGS
  ) => {
    if (isLocked) return;
    const data = {
      type: "TABLE",
      tableType,
      config: LAYOUT_ITEM_CONFIGS[tableType],
    };
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "copy";
  };

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "pan", icon: Move, label: "Pan" },
  ] as const;

  // Function to handle adding a new floor
  const handleAddFloor = async (name: string) => {

    try {
      await addFloor(name);

      // Switch to the new floor after creation
      const newFloor = state.availableFloors[state.availableFloors.length - 1];
      if (newFloor) {
        await switchFloor(newFloor.id);
      }
    } catch (error) {
      console.error("Failed to add floor:", error);
    }
  };

  const handleImportLayout = async (file: File) => {
    try {
      // You'll need to add importLayout to your context
      await importLayout(file);
    } catch (error) {
      console.error('Failed to import layout:', error);
      // Error is already handled by the context
    }
  };

  const handleExportLayout = () => {
    try {
      // You'll need to add exportLayout to your context
      const exportData = exportLayout();

      // Create download link
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${state.layout.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.json`;

      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to export layout:', error);
    }
  };

  return (
    <>
      <div className="bg-white border-r border-gray-200 w-64 h-full flex flex-col shadow-lg min-h-screen">
        {/* Tools Section */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-orange-600 mb-3">Tools</h3>
          <div className="flex items-center gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const disabled =
                isLocked && !(tool.id === "select" || tool.id === "pan");

              return (
                <Button
                  key={tool.id}
                  disabled={disabled}
                  variant={state.tool === tool.id ? "default" : "ghost"}
                  onClick={() => {
                    if (!disabled) {
                      dispatch({ type: "SET_TOOL", payload: { tool: tool.id } })
                    }
                  }}
                  size="sm"
                  className={`flex items-center justify-center h-10 w-10 ${state.tool === tool.id
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                    : "hover:bg-orange-50"
                    }`}
                  title={tool.label}
                >
                  <Icon size={16} />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Items Section */}
        <div
          className="p-4 border-b border-gray-200 min-h-64 overflow-y-auto"
          onTouchMove={!isLocked ? handleTouchMove : undefined}
          onTouchEnd={!isLocked ? handleTouchEnd(onTouchDrop) : undefined}
        >
          <h3 className="text-sm font-semibold text-orange-600 mb-3">
            Drag Items
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(LAYOUT_ITEM_CONFIGS).map(([type, config]) => (
              <div
                key={type}
                draggable={!isLocked}
                onDragStart={
                  !isLocked
                    ? (e: React.DragEvent<HTMLDivElement>) =>
                      handleDragStart(e, type as keyof typeof LAYOUT_ITEM_CONFIGS)
                    : undefined
                }
                onTouchStart={
                  !isLocked
                    ? () =>
                      handleTouchStart({
                        type: "TABLE",
                        tableType: type as keyof typeof LAYOUT_ITEM_CONFIGS,
                        config,
                      })
                    : undefined
                }
                className={`aspect-square bg-gradient-to-br from-orange-100 to-orange-200 
              rounded-lg border border-orange-300 cursor-${isLocked ? "not-allowed" : "grab"
                  } 
              flex items-center justify-center p-2 
              transition-transform duration-200 ease-in-out
              ${!isLocked
                    ? "hover:scale-105 active:scale-95 shadow-md"
                    : "opacity-50"
                  }
              ${isDragging ? "touch-none opacity-70" : ""}`}
              >
                <motion.img
                  src={config.image}
                  alt={`${type} preview`}
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Places Management */}
        <div className="p-4 border-b border-gray-200 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold text-orange-600 mb-3">Places</h3>
          <div className="space-y-2">
            {state.availableFloors.map((floor) => (
              <PlaceItem
                key={floor.id}
                floor={floor}
                isActive={state.currentFloorId === floor.id}
                isLoading={state.loadingFloorId === floor.id}
                onSwitch={() => switchFloor(floor.id)}
                onRename={(newName) => renameFloor(floor.id, newName)}
                onDelete={() => deleteFloor(floor.id)}
                canDelete={state.availableFloors.length > 1}
                isLocked={isLocked}
              />
            ))}
            <Button
              onClick={() => { setShowAddFloorModal(x => !x) }}
              disabled={state.isSaving}
              size="sm"
              className="w-full mt-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-sm"
            >
              <Plus size={14} className="mr-2" />
              Add Place
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2 flex-shrink-0">
          <Button
            onClick={saveCurrentFloorToBackend}
            disabled={isLocked || !state.currentFloorId || state.isSaving}
            size="sm"
            className="w-full h-9 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-sm transition-all duration-200"
          >
            {state.isSaving ? (
              <Loader2 size={14} className="animate-spin mr-2" />
            ) : (
              <Save size={14} className="mr-2" />
            )}
            {state.isSaving ? "Saving..." : "Save Layout"}
          </Button>
          <FileInput
            onFileSelect={handleImportLayout}
            accept=".json"
            disabled={isLocked || state.isLoadingFloor}
          >
            {state.isLoadingFloor ? (
              <Loader2 size={14} className="animate-spin mr-2" />
            ) : (
              <Upload size={14} className="mr-2" />
            )}
            {state.isLoadingFloor ? "Importing..." : "Import Layout"}
          </FileInput>

          <Button
            onClick={handleExportLayout}
            disabled={isLocked || !state.currentFloorId}
            size="sm"
            className="w-full h-9 hover:bg-orange-50 border-orange-200 text-orange-700 transition-all duration-200"
            variant="outline"
          >
            <Download size={14} className="mr-2" />
            Export Layout
          </Button>
        </div>
      </div>

      {/* Touch Drag Preview */}
      {dragPreview && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPreview.x - 50,
            top: dragPreview.y - 50,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg border-2 border-orange-500 shadow-lg opacity-80 flex items-center justify-center p-2">
            <motion.img
              src={dragPreview.config.config.image}
              alt="Drag preview"
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>
      )}
      {/* Modals */}
      <AddFloorModal
        isOpen={showAddFloorModal}
        onClose={() => setShowAddFloorModal(false)}
        onConfirm={handleAddFloor}
      />
    </>
  );
}