"use client";

import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";

export default function HelpTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Help & Instructions"
      >
        <HelpCircle size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Quick Help</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3 text-sm text-gray-600">
        <div>
          <strong className="text-gray-900">Adding Tables:</strong>
          <p>Drag table types from the left toolbar onto the canvas</p>
        </div>

        <div>
          <strong className="text-gray-900">Moving Tables:</strong>
          <p>Select a table and drag it to a new position</p>
        </div>

        <div>
          <strong className="text-gray-900">Editing Tables:</strong>
          <p>Select a table to edit its properties in the right panel</p>
        </div>

        <div>
          <strong className="text-gray-900">Canvas Navigation:</strong>
          <p>Use mouse wheel to zoom, Pan tool to move around</p>
        </div>

        <div>
          <strong className="text-gray-900">Keyboard Shortcuts:</strong>
          <p>Delete key - Remove selected table</p>
        </div>

        <div>
          <strong className="text-gray-900">Floors:</strong>
          <p>Create multiple floors and switch between them</p>
        </div>
      </div>
    </div>
  );
}
