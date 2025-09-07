"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  RotateCw,
  Settings,
  MapPin,
  Users,
  FileText,
  CheckCircle2,
  Calendar,
  Wrench,
  XCircle,
  Coffee,
  WashingMachine,
  LogIn,
  LogOut,
  Crown,
  Sofa,
  Wine,
  TreePine,
  Lock,
  Info,
  TableProperties
} from "lucide-react";
import { useRestaurant } from "../context/RestaurantContext";
import { TableStatus, TableType } from "../types/restaurant";
import { TABLE_STATUS_COLORS } from "../utils/tableConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAtom } from "jotai";
import { lockAtom } from "@/atom/atom";

const statusConfig = {
  free: {
    icon: CheckCircle2,
    label: "Available",
    description: "Ready for guests",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20"
  },
  occupied: {
    icon: Users,
    label: "Occupied",
    description: "Currently in use",
    color: "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20"
  },
  reserved: {
    icon: Calendar,
    label: "Reserved",
    description: "Booking confirmed",
    color: "bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20"
  },
  maintenance: {
    icon: Wrench,
    label: "Maintenance",
    description: "Under repair",
    color: "bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20"
  },
  "out-of-service": {
    icon: XCircle,
    label: "Out of Service",
    description: "Temporarily unavailable",
    color: "bg-slate-500/10 text-slate-600 border-slate-200 hover:bg-slate-500/20"
  },
};

const tableTypeConfig = {
  regular: { icon: Users, label: "Regular Table", description: "Standard dining table" },
  vip: { icon: Crown, label: "VIP Table", description: "Premium experience" },
  booth: { icon: Sofa, label: "Booth Seating", description: "Private booth" },
  bar: { icon: Wine, label: "Bar Table", description: "Bar-height seating" },
  outdoor: { icon: TreePine, label: "Outdoor Table", description: "Patio/terrace seating" },
  private: { icon: Lock, label: "Private Dining", description: "Exclusive dining room" }
};

const getItemIcon = (type: string) => {
  if (type.startsWith("table-")) return Users;
  switch (type) {
    case "washroom": return WashingMachine;
    case "counter": return Coffee;
    case "entry-gate": return LogIn;
    case "exit-gate": return LogOut;
    default: return Users;
  }
};

const getItemDisplayName = (type: string) => {
  if (type.startsWith("table-")) {
    const seats = type.replace("table-", "");
    return `${seats} Seater Table`;
  }
  switch (type) {
    case "washroom": return "Washroom";
    case "counter": return "Service Counter";
    case "entry-gate": return "Entry Gate";
    case "exit-gate": return "Exit Gate";
    default: return type;
  }
};

const containerVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

export default function PropertiesPanel() {
  const { state, dispatch, getCurrentFloorTables } = useRestaurant();
  const [isLocked] = useAtom(lockAtom);

  const selectedTable = getCurrentFloorTables().find(
    (table) => table.id === state.selectedTable
  );

  const [formData, setFormData] = useState({
    tableNumber: "",
    description: "",
    tableType: "regular" as TableType,
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (selectedTable) {
      setFormData({
        tableNumber: selectedTable.tableNumber || "",
        description: selectedTable.description || "",
        tableType: selectedTable.tableType || "regular",
      });
      setPosition({ x: selectedTable.x, y: selectedTable.y });
      setRotation(selectedTable.rotation);
    }
  }, [selectedTable]);

  const handleClose = () => {
    dispatch({ type: "SELECT_TABLE", payload: { tableId: null } });
  };

  const handleInputChange = (field: string, value: string) => {
    if (isLocked) return; // Lock all input changes

    setFormData(prev => ({ ...prev, [field]: value }));
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        tableId: selectedTable!.id,
        updates: { [field]: value },
      },
    });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    if (isLocked) return; // Lock position changes

    const numValue = parseInt(value) || 0;
    setPosition(prev => ({ ...prev, [axis]: numValue }));
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        tableId: selectedTable!.id,
        updates: { [axis]: numValue },
      },
    });
  };

  const handleRotationChange = (value: string) => {
    if (isLocked) return; // Lock rotation changes

    const numValue = parseInt(value) || 0;
    setRotation(numValue);
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        tableId: selectedTable!.id,
        updates: { rotation: numValue },
      },
    });
  };

  const handleStatusChange = (status: TableStatus) => {
    // Status changes are NOT locked - always allowed
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        tableId: selectedTable!.id,
        updates: { status },
      },
    });
  };

  const handleTableTypeChange = (tableType: TableType) => {
    if (isLocked) return; // Lock table type changes

    setFormData(prev => ({ ...prev, tableType }));
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        tableId: selectedTable!.id,
        updates: { tableType },
      },
    });
  };

  const handleRotate = () => {
    if (isLocked) return; // Lock rotation button

    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    dispatch({
      type: "UPDATE_TABLE",
      payload: {
        tableId: selectedTable!.id,
        updates: { rotation: newRotation },
      },
    });
  };

  const handleDelete = () => {
    if (isLocked) return; // Lock delete action

    dispatch({
      type: "DELETE_TABLE",
      payload: { tableId: selectedTable!.id },
    });
  };

  const isTable = selectedTable?.type.startsWith("table-");
  const ItemIcon = selectedTable ? getItemIcon(selectedTable.type) : Users;

  if (!selectedTable) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-b from-background to-muted/20 border-l border-border w-80 h-full flex flex-col"
      >
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            variants={itemVariants}
            className="text-center space-y-6"
          >
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center border border-primary/20">
                <Settings className="w-10 h-10 text-primary/60" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                No Item Selected
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Select a table or item from the canvas to view and edit its properties
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const statuses: TableStatus[] = [
    "free",
    "occupied",
    "reserved",
    "maintenance",
    "out-of-service"
  ];

  const tableTypes: TableType[] = [
    "regular",
    "vip",
    "booth",
    "bar",
    "outdoor",
    "private"
  ];

  return (
    <TooltipProvider>
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTable.id}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-gradient-to-b from-background to-muted/10 border-l border-border w-80 h-full flex flex-col relative overflow-hidden"
        >
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-3xl" />

          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="relative p-6 border-b border-border/50 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center border border-primary/20">
                    <TableProperties className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Properties
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {getItemDisplayName(selectedTable.type)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <div className="p-6 space-y-4 pb-24">
              {/* Basic Information */}
              <motion.div variants={itemVariants}>
                <Card className={`border-border/50 bg-gradient-to-br from-card to-card/80 shadow-sm ${isLocked ? 'opacity-70' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      Basic Information
                      {isLocked && <Lock className="w-4 h-4 text-amber-600 ml-auto" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="tableNumber" className="text-sm font-medium">
                        {isTable ? "Table Number" : "Item Label"}
                      </Label>
                      <Input
                        id="tableNumber"
                        value={formData.tableNumber}
                        onChange={(e) => handleInputChange("tableNumber", e.target.value)}
                        placeholder={isTable ? "e.g., T-001" : "Enter label"}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                        disabled={isLocked}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Item Type</Label>
                      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                        <ItemIcon className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{getItemDisplayName(selectedTable.type)}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {isTable ? `${selectedTable.type.replace("table-", "")} seats` : "Facility"}
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                        Description
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add notes or special requirements</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder={isTable ? "Special notes, dietary requirements, etc." : "Enter description..."}
                        rows={3}
                        className="resize-none transition-all focus:ring-2 focus:ring-primary/20"
                        disabled={isLocked}
                      />
                    </div>

                    {/* Table Type for tables */}
                    {isTable && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Table Category</Label>
                        <Select
                          value={formData.tableType}
                          onValueChange={handleTableTypeChange}
                          disabled={isLocked}
                        >
                          <SelectTrigger className={`transition-all focus:ring-2 focus:ring-primary/20 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tableTypes.map((type) => {
                              const config = tableTypeConfig[type];
                              return (
                                <SelectItem key={type} value={type}>
                                  <div className="flex items-center gap-2 cursor-pointer">
                                    <config.icon className="w-4 h-4" />
                                    <span>{config.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Position & Rotation */}
              <motion.div variants={itemVariants}>
                <Card className={`border-border/50 bg-gradient-to-br from-card to-card/80 shadow-sm ${isLocked ? 'opacity-70' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                      </div>
                      Position & Transform
                      {isLocked && <Lock className="w-4 h-4 text-amber-600 ml-auto" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="positionX" className="text-sm font-medium">X- Position</Label>
                        <Input
                          id="positionX"
                          type="number"
                          value={Math.round(position.x)}
                          onChange={(e) => handlePositionChange('x', e.target.value)}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          disabled={isLocked}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="positionY" className="text-sm font-medium">Y- Position</Label>
                        <Input
                          id="positionY"
                          type="number"
                          value={Math.round(position.y)}
                          onChange={(e) => handlePositionChange('y', e.target.value)}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          disabled={isLocked}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rotation" className="text-sm font-medium">Rotation (degrees)</Label>
                      <div className="flex gap-3 justify-center items-center">
                        <Input
                          id="rotation"
                          type="number"
                          value={rotation}
                          onChange={(e) => handleRotationChange(e.target.value)}
                          min="0"
                          max="359"
                          className="flex-1 transition-all focus:ring-2 focus:ring-primary/20"
                          placeholder="0-359"
                          disabled={isLocked}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRotate}
                          className={`hover:bg-primary/10 hover:border-primary/30 transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          disabled={isLocked}
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enhanced Status - Only for tables - NOT LOCKED */}
              {isTable && (
                <motion.div variants={itemVariants}>
                  <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        </div>
                        Table Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {statuses.map((status, index) => {
                          const config = statusConfig[status];
                          const isSelected = selectedTable.status === status;

                          return (
                            <motion.div
                              key={status}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: index * 0.05,
                                type: "spring",
                                stiffness: 300,
                                damping: 25
                              }}
                            >
                              <Button
                                variant={isSelected ? "default" : "outline"}
                                className={`
                                  w-full justify-start h-auto p-4 transition-all duration-300 ease-out cursor-pointer
                                  ${!isSelected ? config.color : "bg-primary text-primary-foreground shadow-lg"}
                                  hover:scale-[1.02] active:scale-[0.98]
                                  ${isSelected ? "ring-2 ring-primary/20" : ""}
                                `}
                                onClick={() => handleStatusChange(status)}
                              >
                                <div className="flex items-center gap-4 w-full">
                                  <div className={`
                                    p-2 rounded-lg transition-colors duration-300
                                    ${isSelected ? "bg-primary-foreground/20" : "bg-background/50"}
                                  `}>
                                    <config.icon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <div className="font-medium">{config.label}</div>
                                    <div className={`text-xs transition-colors duration-300 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                                      }`}>
                                      {config.description}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: TABLE_STATUS_COLORS[status] }}
                                    />
                                  )}
                                </div>
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>

          {/* Enhanced Footer Actions */}
          <motion.div
            variants={itemVariants}
            className="absolute bottom-0 left-0 right-0 p-6 border-t border-border/50 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-sm"
          >
            <Button
              variant="destructive"
              className={`w-full h-12 transition-all duration-300 font-medium shadow-lg 
               bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white 
               ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:from-red-600 hover:via-red-700 hover:to-red-800'}`}
              onClick={handleDelete}
              disabled={isLocked}
            >
              <Trash2 className="w-5 h-5 mr-3" />
              {isLocked ? 'Delete Locked' : `Delete ${isTable ? "Table" : "Item"}`}
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}