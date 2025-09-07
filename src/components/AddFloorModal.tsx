"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Building, Sparkles } from "lucide-react";

interface AddFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export default function AddFloorModal({
  isOpen,
  onClose,
  onConfirm,
}: AddFloorModalProps) {
  const [floorName, setFloorName] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (floorName.trim()) {
      onConfirm(floorName.trim());
      setFloorName("");
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-orange-500 to-amber-700/60 p-6">
              <div className="absolute top-4 right-4">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-1.5 flex justify-center items-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="p-2.5 bg-white/20 rounded-full"
                >
                  <Building className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Add New Floor</h2>
                  <p className="text-blue-100 text-sm mt-1">Create a new floor for your restaurant</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Floor Name
                </label>
                <motion.div
                  animate={{
                    boxShadow: isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.15)" : "none",
                    borderColor: isFocused ? "rgb(59, 130, 246)" : "rgb(226, 232, 240)"
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative flex items-center border rounded-lg overflow-hidden bg-slate-50/50"
                >
                  <div className="pl-3 text-slate-400">
                    <Sparkles size={16} />
                  </div>
                  <input
                    type="text"
                    value={floorName}
                    onChange={(e) => setFloorName(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full px-3 py-3 bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
                    placeholder="e.g., Ground Floor, First Floor"
                    autoFocus
                  />
                </motion.div>
                <p className="text-xs text-slate-500 mt-2">
                  Give your floor a descriptive name
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={!floorName.trim()}
                  whileHover={floorName.trim() ? { scale: 1.02 } : {}}
                  whileTap={floorName.trim() ? { scale: 0.98 } : {}}
                  className="px-4 py-2.5 text-sm font-medium text-white 
             bg-gradient-to-r from-orange-500 to-red-600 
             hover:from-orange-600 hover:to-red-700 
             disabled:from-slate-300 disabled:to-slate-400 
             disabled:cursor-not-allowed rounded-lg 
             transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  Add Floor
                </motion.button>

              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}