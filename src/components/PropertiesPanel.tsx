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
  Lock,
  Info,
  TableProperties,
  Home,
  Building,
  Shield,
  Sun,
  Mountain,
  Baby,
  AlertTriangle,
} from "lucide-react";
import { useRestaurant } from "../context/RestaurantContext";
import { SeatingStatus, RoomType, LayoutItem, TableItem, UtilityItem, RoomItem } from "../types/restaurant";
import { TABLE_STATUS_COLORS } from "../utils/tableConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gi3dStairs, GiElevator } from "react-icons/gi";

const statusConfig = {
  available: {
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
    description: "Unavailable",
    color: "bg-slate-500/10 text-slate-600 border-slate-200 hover:bg-slate-500/20"
  },
};

const areaTypeConfig = {
  booth_area: { icon: Sofa, label: "Booth Area", description: "Cozy booth seating section" },
  family_section: { icon: Baby, label: "Family Section", description: "Family-friendly dining area" },
  cafe_corner: { icon: Coffee, label: "Cafe Corner", description: "Casual coffee area with small tables" },
  bar_area: { icon: Wine, label: "Bar Area", description: "Bar and lounge space" },
  outdoor_patio: { icon: Sun, label: "Outdoor Patio", description: "Open-air dining area" },
  rooftop: { icon: Mountain, label: "Rooftop", description: "Elevated outdoor space" },
  banquet: { icon: Building, label: "Banquet Hall", description: "Large event space" },
  private: { icon: Shield, label: "Private Dining", description: "Exclusive dining area" },
  vip: { icon: Crown, label: "VIP Area", description: "Premium dining section" }
};

const getItemIcon = (type: string) => {
  if (type.startsWith("table-")) return Users;
  if (type === "room") return Home;
  switch (type) {
    case "washroom": return WashingMachine;
    case "counter": return Coffee;
    case "entry-gate": return LogIn;
    case "exit-gate": return LogOut;
    case "elevator": return GiElevator;
    case "stair": return Gi3dStairs;
    default: return Users;
  }
};

const getItemDisplayName = (item: LayoutItem) => {
  if (item.type.startsWith("table-")) {
    const seats = item.type.replace("table-", "");
    return `${seats} Seater Table`;
  }
  if (item.type === "room") {
    const roomItem = item as RoomItem;
    return roomItem.name || areaTypeConfig[roomItem.roomType]?.label || "Area";
  }
  switch (item.type) {
    case "washroom": return "Washroom";
    case "counter": return "Service Counter";
    case "entry-gate": return "Entry Gate";
    case "exit-gate": return "Exit Gate";
    case "elevator": return "Elevator";
    case "stair": return "Staircase";
    default: return item.type;
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
  const { state, dispatch, getItemById } = useRestaurant();
  const isLocked = state.layout.floor.isLocked;

  // Get the selected item using state.selectedItem
  const selectedItem = state.selectedItem ? getItemById(state.selectedItem) : null;

  const [formData, setFormData] = useState({
    tableNumber: "",
    name: "",
    description: "",
    roomType: "booth_area" as RoomType,
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [invalidStatusAttempt, setInvalidStatusAttempt] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem) {
      // Handle different item types
      if (selectedItem.type.startsWith("table-")) {
        const tableItem = selectedItem as TableItem;
        setFormData({
          tableNumber: tableItem.tableNumber || "",
          name: "",
          description: "",
          roomType: "booth_area",
        });
      } else if (selectedItem.type === "room") {
        const roomItem = selectedItem as RoomItem;
        setFormData({
          tableNumber: "",
          name: roomItem.name || "",
          description: roomItem.description || "",
          roomType: roomItem.roomType || "booth_area",
        });
      } else {
        const utilityItem = selectedItem as UtilityItem;
        setFormData({
          tableNumber: "",
          name: utilityItem.name || "",
          description: utilityItem.description || "",
          roomType: "booth_area",
        });
      }

      setPosition({ x: selectedItem.x, y: selectedItem.y });
      setRotation(selectedItem.rotation || 0);
    }
  }, [selectedItem]);

  // Validation functions
  const validateTableNumber = (value: string): string | null => {
    if (!value) return "Table number is required";

    // Ensure it starts with 'T'
    if (!value.startsWith('T')) {
      return "Table number must start with 'T'";
    }

    // Check for duplicates
    const isDuplicate = state.layout.floor.layoutItems.some(item =>
      item.id !== selectedItem?.id &&
      item.type.startsWith("table-") &&
      (item as TableItem).tableNumber === value
    );

    if (isDuplicate) {
      return "This table number already exists";
    }

    return null;
  };

  const validateRoomName = (value: string): string | null => {
    if (!value.trim()) return "Area name is required";

    // Check for duplicates
    const isDuplicate = state.layout.floor.layoutItems.some(item =>
      item.id !== selectedItem?.id &&
      item.type === "room" &&
      (item as RoomItem).name?.toLowerCase().trim() === value.toLowerCase().trim()
    );

    if (isDuplicate) {
      return "This area name already exists";
    }

    return null;
  };

  const validateUtilityName = (value: string): string | null => {
    if (!value.trim()) return "Item name is required";

    // Check for duplicates
    const isDuplicate = state.layout.floor.layoutItems.some(item =>
      item.id !== selectedItem?.id &&
      !item.type.startsWith("table-") &&
      item.type !== "room" &&
      (item as UtilityItem).name?.toLowerCase().trim() === value.toLowerCase().trim()
    );

    if (isDuplicate) {
      return "This item name already exists";
    }

    return null;
  };

  const handleClose = () => {
    dispatch({ type: "SELECT_ITEM", payload: { itemId: null } });
  };

  const handleInputChange = (field: string, value: string) => {
    if (isLocked || !selectedItem) return;

    // Clear validation error when user starts typing
    setValidationError(null);

    // Handle table number special case
    if (field === "tableNumber") {
      // Ensure 'T' prefix is preserved
      if (value && !value.startsWith('T')) {
        value = 'T' + value.replace(/^T*/g, ''); // Remove any existing T's and add one
      }

      setFormData(prev => ({ ...prev, [field]: value }));

      const error = validateTableNumber(value);
      if (error) {
        setValidationError(error);
        return; // Don't update the store if validation fails
      }
    } else if (field === "name") {
      setFormData(prev => ({ ...prev, [field]: value }));

      let error = null;
      if (selectedItem.type === "room") {
        error = validateRoomName(value);
      } else {
        error = validateUtilityName(value);
      }

      if (error) {
        setValidationError(error);
        return; // Don't update the store if validation fails
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Update the store only if validation passes
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        itemId: selectedItem.id,
        updates: { [field]: value },
      },
    });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    if (isLocked || !selectedItem) return;

    const numValue = parseInt(value) || 0;
    setPosition(prev => ({ ...prev, [axis]: numValue }));
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        itemId: selectedItem.id,
        updates: { [axis]: numValue },
      },
    });
  };

  const handleRotationChange = (value: string) => {
    if (isLocked || !selectedItem) return;

    const numValue = parseInt(value) || 0;
    setRotation(numValue);
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        itemId: selectedItem.id,
        updates: { rotation: numValue },
      },
    });
  };

  const handleStatusChange = (status: SeatingStatus) => {
    if (!selectedItem) return;

    const isTable = selectedItem.type.startsWith("table-");
    const isArea = selectedItem.type === "room";

    if (!isTable && !isArea) return;

    // Validation logic for table status changes
    if (isTable) {
      const tableItem = selectedItem as TableItem;

      // If table is inside an area, check area status restrictions
      if (tableItem.roomId) {
        const containingArea = getItemById(tableItem.roomId) as RoomItem;

        if (containingArea && containingArea.status !== "available") {
          // If area is not available, table can only be set to same status or more restrictive
          const restrictiveOrder = ["available", "reserved", "occupied", "maintenance", "out-of-service"];
          const areaIndex = restrictiveOrder.indexOf(containingArea.status);
          const newStatusIndex = restrictiveOrder.indexOf(status);

          if (newStatusIndex < areaIndex && status !== containingArea.status) {
            // Show visual feedback for invalid change
            setInvalidStatusAttempt(status);
            setTimeout(() => setInvalidStatusAttempt(null), 2000);
            return;
          }
        }
      }
    }

    // Clear any previous invalid attempts
    setInvalidStatusAttempt(null);

    // Status changes are NOT locked - always allowed with validation
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        itemId: selectedItem.id,
        updates: { status },
      },
    });

    // If this is an area, propagate status to all contained tables
    if (isArea) {
      const areaItem = selectedItem as RoomItem;
      areaItem.containedItems.forEach(containedItemId => {
        const containedItem = getItemById(containedItemId);
        if (containedItem && containedItem.type.startsWith("table-")) {
          // Only change table status if new area status is more restrictive or same
          const currentTableStatus = (containedItem as TableItem).status;
          const restrictiveOrder = ["available", "reserved", "occupied", "maintenance", "out-of-service"];
          const currentIndex = restrictiveOrder.indexOf(currentTableStatus);
          const newIndex = restrictiveOrder.indexOf(status);

          // Apply area status to table if area status is more restrictive or if area becomes available
          if (status === "available" || newIndex >= currentIndex) {
            dispatch({
              type: "UPDATE_ITEM",
              payload: {
                itemId: containedItemId,
                updates: { status },
              },
            });
          }
        }
      });
    }
  };

  const handleAreaTypeChange = (roomType: RoomType) => {
    if (isLocked || !selectedItem || selectedItem.type !== "room") return;

    setFormData(prev => ({ ...prev, roomType }));
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        itemId: selectedItem.id,
        updates: { roomType },
      },
    });
  };

  const handleRotate = () => {
    if (isLocked || !selectedItem) return;

    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        itemId: selectedItem.id,
        updates: { rotation: newRotation },
      },
    });
  };

  const handleDelete = () => {
    if (isLocked || !selectedItem) return;

    dispatch({
      type: "DELETE_ITEM",
      payload: { itemId: selectedItem.id },
    });
  };

  const isTable = selectedItem?.type.startsWith("table-");
  const isArea = selectedItem?.type === "room";
  const ItemIcon = selectedItem ? getItemIcon(selectedItem.type) : Users;

  if (!selectedItem) {
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
                Select a table, area, or utility item from the canvas to view and edit its properties
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const statuses: SeatingStatus[] = [
    "available",
    "occupied",
    "reserved",
    "maintenance",
    "out-of-service"
  ];

  const areaTypes: RoomType[] = [
    "booth_area",
    "family_section",
    "cafe_corner",
    "bar_area",
    "outdoor_patio",
    "rooftop",
    "banquet",
    "private",
    "vip"
  ];

  return (
    <TooltipProvider>
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedItem.id}
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
                    {getItemDisplayName(selectedItem)}
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
            <div className="p-6 space-y-4 pb-32">
              {/* Validation Error */}
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="p-3 bg-red-500/10 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-medium">Validation Error</p>
                        <p className="text-xs text-red-500">{validationError}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    {/* Table Number / Name field */}
                    <div className="space-y-2">
                      <Label htmlFor="itemIdentifier" className="text-sm font-medium">
                        {isTable ? "Table Number" : isArea ? "Area Name" : "Item Name"}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="itemIdentifier"
                        value={isTable ? formData.tableNumber : formData.name}
                        onChange={(e) => handleInputChange(isTable ? "tableNumber" : "name", e.target.value)}
                        placeholder={
                          isTable ? "e.g., T-001" :
                            isArea ? "e.g., VIP Lounge" :
                              "Enter name"
                        }
                        className={`transition-all focus:ring-2 focus:ring-primary/20 ${validationError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                          }`}
                        disabled={isLocked}
                      />
                      {isTable && (
                        <p className="text-xs text-muted-foreground">
                          {`Table number must start with 'T' and be unique`}
                        </p>
                      )}
                    </div>

                    {/* Item Type Display */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Item Type</Label>
                      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                        <ItemIcon className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{getItemDisplayName(selectedItem)}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {isTable
                            ? `${selectedItem.type.replace("table-", "")} seats`
                            : isArea
                              ? "Area"
                              : "Utility"
                          }
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
                        placeholder={
                          isTable ? "Special notes, dietary requirements, etc." :
                            isArea ? "Area description and features..." :
                              "Enter description..."
                        }
                        rows={3}
                        className="resize-none transition-all focus:ring-2 focus:ring-primary/20"
                        disabled={isLocked}
                      />
                    </div>

                    {/* Area Type for areas */}
                    {isArea && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Area Type</Label>
                        <Select
                          value={formData.roomType}
                          onValueChange={handleAreaTypeChange}
                          disabled={isLocked}
                        >
                          <SelectTrigger className={`transition-all focus:ring-2 focus:ring-primary/20 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {areaTypes.map((type) => {
                              const config = areaTypeConfig[type];
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

                    {/* Area Info for areas */}
                    {isArea && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Contained Items</Label>
                        <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
                          <Badge variant="outline" className="text-xs">
                            {(selectedItem as RoomItem).containedItems.length} items inside
                          </Badge>
                          {isArea && (selectedItem as RoomItem).containedItems.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Status changes will apply to all contained tables
                            </p>
                          )}
                        </div>
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
                        <Label htmlFor="positionX" className="text-sm font-medium">X Position</Label>
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
                        <Label htmlFor="positionY" className="text-sm font-medium">Y Position</Label>
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

              {/* Enhanced Status - For tables and areas - NOT LOCKED */}
              {(isTable || isArea) && (
                <motion.div variants={itemVariants}>
                  <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        </div>
                        {isArea ? "Area Status" : "Table Status"}
                        {isArea && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-muted-foreground ml-1" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Changes will apply to all tables in this area</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[400px] overflow-hidden">
                      {/* Invalid Status Attempt Notification */}
                      <AnimatePresence>
                        {invalidStatusAttempt && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="mb-4 p-3 bg-red-500/10 border border-red-200 rounded-lg"
                          >
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <div>
                                <p className="text-sm font-medium">Invalid Status Change</p>
                                <p className="text-xs text-red-500">
                                  {`Cannot set table to "${statusConfig[invalidStatusAttempt as SeatingStatus]?.label}" - area status restricts this change.`}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Show area context for tables */}
                      {isTable && (selectedItem as TableItem).roomId && (
                        <div className="mb-4 p-3 bg-blue-500/5 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-600">
                            <Home className="w-4 h-4" />
                            <div>
                              <p className="text-sm font-medium">Inside Area</p>
                              <p className="text-xs text-blue-500">
                                {(() => {
                                  const area = getItemById((selectedItem as TableItem).roomId!) as RoomItem;
                                  return area ? `${area.name || 'Area'} (${statusConfig[area.status]?.label})` : 'Unknown Area';
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-3">
                        {statuses.map((status, index) => {
                          const config = statusConfig[status];
                          const currentStatus = (selectedItem as TableItem | RoomItem).status;
                          const isSelected = currentStatus === status;

                          // Check if status is disabled for table inside area
                          let isDisabled = false;
                          let disabledReason = "";

                          if (isTable && (selectedItem as TableItem).roomId) {
                            const containingArea = getItemById((selectedItem as TableItem).roomId!) as RoomItem;
                            if (containingArea && containingArea.status !== "available") {
                              const restrictiveOrder = ["available", "reserved", "occupied", "maintenance", "out-of-service"];
                              const areaIndex = restrictiveOrder.indexOf(containingArea.status);
                              const statusIndex = restrictiveOrder.indexOf(status);

                              if (statusIndex < areaIndex && status !== containingArea.status) {
                                isDisabled = true;
                                disabledReason = `Area is ${statusConfig[containingArea.status]?.label}`;
                              }
                            }
                          }

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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={isSelected ? "default" : "outline"}
                                    className={`
                                      w-full justify-start h-auto p-4 transition-all duration-300 ease-out
                                      ${isDisabled
                                        ? 'opacity-50 cursor-not-allowed bg-muted/50 hover:bg-muted/50 hover:scale-100'
                                        : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                                      }
                                      ${!isSelected && !isDisabled ? config.color : ""}
                                      ${isSelected ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20" : ""}
                                      ${invalidStatusAttempt === status ? "animate-pulse ring-2 ring-red-500/50" : ""}
                                    `}
                                    onClick={() => !isDisabled && handleStatusChange(status)}
                                    disabled={isDisabled}
                                  >
                                    <div className="flex items-center gap-4 w-full">
                                      <div className={`
                                        p-2 rounded-lg transition-colors duration-300
                                        ${isSelected ? "bg-primary-foreground/20" : "bg-background/50"}
                                        ${isDisabled ? "opacity-70" : ""}
                                      `}>
                                        <config.icon className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 text-left">
                                        <div className="font-medium">{config.label}</div>
                                        <div className={`text-xs transition-colors duration-300 ${isSelected ? "text-primary-foreground/70" :
                                          isDisabled ? "text-muted-foreground/70" : "text-muted-foreground"
                                          }`}>
                                          {config.description}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: TABLE_STATUS_COLORS[status] || TABLE_STATUS_COLORS.available }}
                                        />
                                      )}
                                      {isDisabled && (
                                        <Lock className="w-3 h-3 text-muted-foreground/70" />
                                      )}
                                    </div>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isDisabled ? (
                                    <p>{disabledReason}</p>
                                  ) : (
                                    <p>Set status to {config.label}</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
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
              {isLocked ? 'Delete Locked' : `Delete ${isArea ? 'Area' : isTable ? 'Table' : 'Item'}`}
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}