// "use client";

// import React, {
//   useRef,
//   useEffect,
//   useState,
//   useCallback,
//   useMemo,
//   memo,
//   createContext,
//   useContext,
//   useLayoutEffect
// } from "react";
// import {
//   Stage,
//   Layer,
//   Rect,
//   Text,
//   Group,
//   Line,
//   Path,
//   Image as KonvaImage
// } from "react-konva";
// import { KonvaEventObject } from "konva/lib/Node";
// import { useRestaurant } from "../context/RestaurantContext";
// import { TABLE_CONFIGS, TABLE_STATUS_COLORS } from "../utils/tableConfig";
// import { TableItem } from "../types/restaurant";
// import { Minus, Plus, ChevronsLeft, ChevronsRight, ChevronsDown, ChevronsUp } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { TABLE_SVG_PATHS } from "@/utils/compoents";
// import { getBackgroundColorForTableType } from "@/lib/colorCode";
// import useImage from "use-image";

// interface CanvasProps {
//   width: number;
//   height: number;
//   onTouchDropReady?: (handler: (config: any, position: { x: number; y: number }) => void) => void;
// }

// // Performance Context
// const PerformanceContext = createContext<{
//   viewport: { x: number; y: number; width: number; height: number };
//   scale: number;
//   isTableVisible: (table: TableItem) => boolean;
//   canvasBounds: { x: number; y: number; width: number; height: number };
// }>({
//   viewport: { x: 0, y: 0, width: 0, height: 0 },
//   scale: 1,
//   isTableVisible: () => true,
//   canvasBounds: { x: 0, y: 0, width: 0, height: 0 },
// });

// // Boundary constraint utility
// const constrainToCanvas = (
//   position: { x: number; y: number },
//   tableSize: { width: number; height: number },
//   canvasBounds: { x: number; y: number; width: number; height: number }
// ) => {
//   const halfWidth = tableSize.width * 0.5;
//   const halfHeight = tableSize.height * 0.5;

//   return {
//     x: Math.max(
//       canvasBounds.x + halfWidth,
//       Math.min(canvasBounds.x + canvasBounds.width - halfWidth, position.x)
//     ),
//     y: Math.max(
//       canvasBounds.y + halfHeight,
//       Math.min(canvasBounds.y + canvasBounds.height - halfHeight, position.y)
//     )
//   };
// };

// // SVG dimensions calculator with caching
// const svgDimensionsCache = new Map<string, { width: number; height: number }>();

// const getViewBoxDimensions = (viewBox: string) => {
//   if (svgDimensionsCache.has(viewBox)) {
//     return svgDimensionsCache.get(viewBox)!;
//   }

//   const [, , width, height] = viewBox.split(' ').map(Number);
//   const dimensions = { width, height };
//   svgDimensionsCache.set(viewBox, dimensions);
//   return dimensions;
// };

// // Simple Table Component - fixed drag vs click issue with distance-based detection
// const TableComponent = memo(function TableComponent({
//   table,
//   isSelected,
//   onSelect,
//   onUpdate,
// }: {
//   table: TableItem;
//   isSelected: boolean;
//   onSelect: () => void;
//   onUpdate: (position: { x: number; y: number }) => void;
// }) {
//   const { isTableVisible, scale, canvasBounds } = useContext(PerformanceContext);
//   const groupRef = useRef<any>(null);
//   const isDraggingRef = useRef(false);
//   const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
//   const initialPosRef = useRef<{ x: number; y: number } | null>(null);

//   // Import the image hook for non-table items
//   const [image] = useImage(
//     table.type.startsWith("table-") ? "" : TABLE_CONFIGS[table.type]?.image || ""
//   );

//   if (!isTableVisible(table)) return null;

//   const showDetails = scale > 0.7;
//   const showText = scale > 0.5;
//   const showSVG = scale > 0.4;
//   const showBackground = scale < 0.4

//   // Determine if this is a table (show SVG) or other item (show image)
//   const isTable = table.type.startsWith("table-");

//   // SVG config
//   // SVG config for tables only
//   const svgConfig = useMemo(() => {
//     if (!isTable) return null;

//     const svgData = TABLE_SVG_PATHS[table.type];
//     if (!svgData) return null;

//     const viewBoxDims = getViewBoxDimensions(svgData.viewBox);
//     const scaleX = table.width / viewBoxDims.width;
//     const scaleY = table.height / viewBoxDims.height;
//     const svgScale = Math.min(scaleX, scaleY) * 0.8;

//     return { svgData, viewBoxDims, svgScale };
//   }, [table.type, table.width, table.height, isTable]);

//   const handleMouseDown = useCallback((e: any) => {
//     e.evt.preventDefault();
//     e.evt.stopPropagation();

//     const stage = e.target.getStage();
//     const pointer = stage?.getPointerPosition();

//     if (pointer && groupRef.current) {
//       mouseDownPosRef.current = { x: pointer.x, y: pointer.y };
//       initialPosRef.current = { x: table.x, y: table.y };
//       isDraggingRef.current = false;

//       // Disable stage dragging
//       if (stage) stage.draggable(false);

//       // Add mouse move and up listeners to window
//       const handleMouseMove = (e: MouseEvent) => {
//         if (!mouseDownPosRef.current || !initialPosRef.current || !groupRef.current) return;

//         const currentPointer = stage?.getPointerPosition();
//         if (!currentPointer) return;

//         const deltaX = currentPointer.x - mouseDownPosRef.current.x;
//         const deltaY = currentPointer.y - mouseDownPosRef.current.y;

//         // Only start dragging if moved more than 3 pixels
//         if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
//           isDraggingRef.current = true;

//           const newPos = {
//             x: initialPosRef.current.x + deltaX / scale,
//             y: initialPosRef.current.y + deltaY / scale
//           };

//           const constrainedPos = constrainToCanvas(
//             newPos,
//             { width: table.width, height: table.height },
//             canvasBounds
//           );

//           groupRef.current.position(constrainedPos);
//         }
//       };

//       const handleMouseUp = () => {
//         if (isDraggingRef.current && groupRef.current) {
//           // Update position only if we actually dragged
//           const finalPos = groupRef.current.position();
//           onUpdate(finalPos);
//         } else {
//           // Just a click - select the table
//           onSelect();
//         }

//         // Clean up
//         isDraggingRef.current = false;
//         mouseDownPosRef.current = null;
//         initialPosRef.current = null;

//         // Re-enable stage dragging
//         if (stage) {
//           setTimeout(() => stage.draggable(true), 50);
//         }

//         // Remove listeners
//         window.removeEventListener('mousemove', handleMouseMove);
//         window.removeEventListener('mouseup', handleMouseUp);
//       };

//       window.addEventListener('mousemove', handleMouseMove);
//       window.addEventListener('mouseup', handleMouseUp);
//     }
//   }, [table, onSelect, onUpdate, scale, canvasBounds]);

//   return (
//     <Group
//       ref={groupRef}
//       x={table.x}
//       y={table.y}
//       rotation={table.rotation}
//       draggable={false} // Disable Konva's built-in dragging
//       onMouseDown={handleMouseDown}
//       onTouchStart={handleMouseDown} // Handle touch events similarly
//     >
//       {/* Conditional Rendering: SVG for tables, Image for others */}
//       {isTable ? (
//         // TABLE RENDERING WITH SVG
//         <>
//           {/* Background for SVG - Always visible until 10% zoom */}
//           {showBackground && (
//             <Rect
//               width={table.width * 0.9}
//               height={table.height * 0.9}
//               offsetX={table.width * 0.45}
//               offsetY={table.height * 0.45}
//               fill={getBackgroundColorForTableType(table.type)}
//               cornerRadius={8}
//               shadowColor="rgba(0,0,0,0.1)"
//               shadowBlur={4}
//               shadowOffset={{ x: 1, y: 1 }}
//             />
//           )}

//           {/* SVG Icon */}
//           {showSVG && svgConfig && (
//             <Path
//               data={svgConfig.svgData.path}
//               fill={svgConfig.svgData.fill}
//               stroke={svgConfig.svgData.stroke}
//               strokeWidth={1}
//               scaleX={svgConfig.svgScale}
//               scaleY={svgConfig.svgScale}
//               offsetX={svgConfig.viewBoxDims.width * 0.5}
//               offsetY={svgConfig.viewBoxDims.height * 0.5}
//             />
//           )}

//           {/* Status Indicator for tables */}
//           {showDetails && (
//             <Rect
//               x={-8}
//               y={-8}
//               width={16}
//               height={16}
//               fill={TABLE_STATUS_COLORS[table.status]}
//               cornerRadius={8}
//               stroke="#ffffff"
//               strokeWidth={2}
//             />
//           )}
//         </>
//       ) : (
//         // NON-TABLE RENDERING WITH IMAGE
//         <>
//           {/* Background for non-table items - visible at low zoom */}
//           {showBackground && (
//             <Rect
//               width={table.width * 0.9}
//               height={table.height * 0.9}
//               offsetX={table.width * 0.45}
//               offsetY={table.height * 0.45}
//               fill={getBackgroundColorForTableType(table.type)}
//               cornerRadius={8}
//               shadowColor="rgba(0,0,0,0.1)"
//               shadowBlur={4}
//               shadowOffset={{ x: 1, y: 1 }}
//             />
//           )}

//           {/* Image for non-table items - visible at higher zoom levels */}
//           {!showBackground && image ? (
//             <KonvaImage
//               image={image}
//               width={table.width}
//               height={table.height}
//               offsetX={table.width / 2}
//               offsetY={table.height / 2}
//               opacity={showSVG ? 1 : 0.8} // Slight fade at very low zoom
//             />
//           ) : !showBackground && !image && (
//             // Fallback rectangle if image doesn't load
//             <Rect
//               width={table.width}
//               height={table.height}
//               offsetX={table.width / 2}
//               offsetY={table.height / 2}
//               fill="#e5e7eb"
//               stroke="#9ca3af"
//               strokeWidth={1}
//               cornerRadius={8}
//             />
//           )}
//         </>
//       )}

//       {/* Table Number (only for tables) */}
//       {showText && table.tableNumber && isTable && (
//         <Text
//           x={-table.width * 0.5}
//           y={table.height * 0.5 + 5}
//           width={table.width}
//           height={20}
//           text={table.tableNumber}
//           fontSize={Math.max(10, Math.min(14, table.width / 6))}
//           fontFamily="Arial"
//           fontStyle="bold"
//           fill="#374151"
//           align="center"
//           verticalAlign="middle"
//         />
//       )}

//       {/* Selection Border */}
//       {isSelected && (
//         <Rect
//           width={table.width}
//           height={table.height}
//           offsetX={table.width * 0.5}
//           offsetY={table.height * 0.5}
//           stroke="#3b82f6"
//           strokeWidth={3}
//           dash={[8, 4]}
//           fill="transparent"
//         />
//       )}
//     </Group>
//   );
// });

// // Simple Grid Component
// const VirtualGrid = memo(function VirtualGrid() {
//   const { viewport, scale, canvasBounds } = useContext(PerformanceContext);

//   if (scale < 0.3) return null;

//   const gridSize = 40;
//   const gridOpacity = Math.min(0.5, scale * 0.5);

//   const buffer = 50;
//   const startX = Math.max(canvasBounds.x, Math.floor((viewport.x - buffer) / gridSize) * gridSize);
//   const endX = Math.min(canvasBounds.x + canvasBounds.width, Math.ceil((viewport.x + viewport.width + buffer) / gridSize) * gridSize);
//   const startY = Math.max(canvasBounds.y, Math.floor((viewport.y - buffer) / gridSize) * gridSize);
//   const endY = Math.min(canvasBounds.y + canvasBounds.height, Math.ceil((viewport.y + viewport.height + buffer) / gridSize) * gridSize);

//   const lines = [];
//   const step = scale > 0.7 ? gridSize : gridSize * 2;

//   for (let x = startX; x <= endX; x += step) {
//     if (x >= canvasBounds.x && x <= canvasBounds.x + canvasBounds.width) {
//       lines.push(
//         <Line
//           key={`v-${x}`}
//           points={[x, Math.max(startY, canvasBounds.y), x, Math.min(endY, canvasBounds.y + canvasBounds.height)]}
//           stroke="#e2e8f0"
//           strokeWidth={0.75}
//           opacity={gridOpacity}
//         />
//       );
//     }
//   }

//   for (let y = startY; y <= endY; y += step) {
//     if (y >= canvasBounds.y && y <= canvasBounds.y + canvasBounds.height) {
//       lines.push(
//         <Line
//           key={`h-${y}`}
//           points={[Math.max(startX, canvasBounds.x), y, Math.min(endX, canvasBounds.x + canvasBounds.width), y]}
//           stroke="#e2e8f0"
//           strokeWidth={0.75}
//           opacity={gridOpacity}
//         />
//       );
//     }
//   }

//   return <>{lines}</>;
// });

// // Table Manager Hook
// function useTableManager(tables: TableItem[], canvasBounds: any) {
//   const { dispatch } = useRestaurant();

//   return useMemo(() => {
//     const selectHandlers = new Map<string, () => void>();
//     const updateHandlers = new Map<string, (pos: { x: number; y: number }) => void>();

//     tables.forEach(table => {
//       selectHandlers.set(table.id, () => {
//         dispatch({ type: "SELECT_TABLE", payload: { tableId: table.id } });
//       });

//       updateHandlers.set(table.id, (position) => {
//         const constrainedPosition = constrainToCanvas(
//           position,
//           { width: table.width, height: table.height },
//           canvasBounds
//         );
//         dispatch({
//           type: "UPDATE_TABLE",
//           payload: { tableId: table.id, updates: constrainedPosition }
//         });
//       });
//     });

//     return { selectHandlers, updateHandlers };
//   }, [tables, dispatch, canvasBounds]);
// }

// // Main Canvas Component
// export default function ProductionCanvas({ width, height, onTouchDropReady }: CanvasProps) {
//   const { state, dispatch, getCurrentFloorTables } = useRestaurant();
//   const stageRef = useRef<any>(null);

//   // Floor dimensions
//   const floorDimensions = useMemo(() =>
//     state.layout.floorDimensions || { width: 1600, height: 1200 }
//     , [state.layout.floorDimensions]);

//   const [showSettings, setShowSettings] = useState(false);
//   const [isDragOver, setIsDragOver] = useState(false);

//   // Restaurant floor bounds
//   const restaurantFloorBounds = useMemo(() => {
//     const padding = 50;
//     return {
//       x: padding,
//       y: padding,
//       width: floorDimensions.width,
//       height: floorDimensions.height
//     };
//   }, [floorDimensions]);

//   // Auto-fit calculation
//   const calculateAutoFit = useCallback(() => {
//     const stageWidth = width;
//     const stageHeight = height - 48;
//     const padding = 100;

//     const scaleX = (stageWidth - padding * 2) / floorDimensions.width;
//     const scaleY = (stageHeight - padding * 2) / floorDimensions.height;
//     const scale = Math.min(scaleX, scaleY, 1);

//     const scaledWidth = floorDimensions.width * scale;
//     const scaledHeight = floorDimensions.height * scale;

//     return {
//       x: (stageWidth - scaledWidth) * 0.5 - restaurantFloorBounds.x * scale,
//       y: (stageHeight - scaledHeight) * 0.5 - restaurantFloorBounds.y * scale,
//       scale: scale
//     };
//   }, [width, height, floorDimensions, restaurantFloorBounds]);

//   // View state
//   const [viewState, setViewState] = useState(() => ({ x: 0, y: 0, scale: 1 }));

//   const tables = getCurrentFloorTables();
//   const { selectHandlers, updateHandlers } = useTableManager(tables, restaurantFloorBounds);

//   // Auto-fit on dimension changes
//   useLayoutEffect(() => {
//     setViewState(calculateAutoFit());
//   }, [calculateAutoFit]);

//   // Viewport calculation
//   const viewport = useMemo(() => ({
//     x: -viewState.x / viewState.scale,
//     y: -viewState.y / viewState.scale,
//     width: width / viewState.scale,
//     height: (height - 48) / viewState.scale,
//   }), [viewState, width, height]);

//   // Table visibility
//   const isTableVisible = useCallback((table: TableItem) => {
//     const buffer = 100;
//     return (
//       table.x > viewport.x - buffer &&
//       table.x < viewport.x + viewport.width + buffer &&
//       table.y > viewport.y - buffer &&
//       table.y < viewport.y + viewport.height + buffer
//     );
//   }, [viewport]);

//   const visibleTables = useMemo(() => tables.filter(isTableVisible), [tables, isTableVisible]);

//   // Performance context
//   const performanceContextValue = useMemo(() => ({
//     viewport,
//     scale: viewState.scale,
//     isTableVisible,
//     canvasBounds: restaurantFloorBounds,
//   }), [viewport, viewState.scale, isTableVisible, restaurantFloorBounds]);

//   // Zoom handler
//   const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
//     e.evt.preventDefault();

//     const stage = e.target.getStage();
//     if (!stage) return;

//     const pointer = stage.getPointerPosition();
//     if (!pointer) return;

//     const mousePointTo = {
//       x: (pointer.x - viewState.x) / viewState.scale,
//       y: (pointer.y - viewState.y) / viewState.scale,
//     };

//     const direction = e.evt.deltaY > 0 ? -1 : 1;
//     const factor = 1.05;
//     const newScale = Math.max(0.1, Math.min(3, direction > 0 ? viewState.scale * factor : viewState.scale / factor));

//     const newPos = {
//       x: pointer.x - mousePointTo.x * newScale,
//       y: pointer.y - mousePointTo.y * newScale,
//     };

//     setViewState({ x: newPos.x, y: newPos.y, scale: newScale });
//   }, [viewState]);

//   // Drop handler
//   const handleDrop = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragOver(false);

//     if (!stageRef.current) return;

//     const stage = stageRef.current;
//     const rect = stage.container().getBoundingClientRect();

//     const stageX = ((e.clientX - rect.left) - viewState.x) / viewState.scale;
//     const stageY = ((e.clientY - rect.top) - viewState.y) / viewState.scale;

//     try {
//       const data = JSON.parse(e.dataTransfer.getData("application/json"));
//       if (data.type === "TABLE") {
//         const config = data.config;

//         if (stageX >= restaurantFloorBounds.x &&
//           stageX <= restaurantFloorBounds.x + restaurantFloorBounds.width &&
//           stageY >= restaurantFloorBounds.y &&
//           stageY <= restaurantFloorBounds.y + restaurantFloorBounds.height) {

//           const constrainedPos = constrainToCanvas(
//             { x: stageX, y: stageY },
//             { width: config.width, height: config.height },
//             restaurantFloorBounds
//           );

//           const newTable = {
//             type: data.tableType,
//             x: constrainedPos.x,
//             y: constrainedPos.y,
//             rotation: 0,
//             status: "free" as const,
//             width: config.width,
//             height: config.height,
//             tableNumber: `T${tables.length + 1}`,
//           };

//           dispatch({ type: "ADD_TABLE", payload: { table: newTable } });
//         }
//       }
//     } catch (error) {
//       console.error("Drop parsing error:", error);
//     }
//   }, [dispatch, viewState, tables.length, restaurantFloorBounds]);

//   // Touch drop handler
//   const handleTouchDrop = useCallback((config: any, clientPosition: { x: number; y: number }) => {
//     if (!stageRef.current) return;

//     const stage = stageRef.current;
//     const rect = stage.container().getBoundingClientRect();

//     const stageX = ((clientPosition.x - rect.left) - viewState.x) / viewState.scale;
//     const stageY = ((clientPosition.y - rect.top) - viewState.y) / viewState.scale;

//     if (stageX >= restaurantFloorBounds.x &&
//       stageX <= restaurantFloorBounds.x + restaurantFloorBounds.width &&
//       stageY >= restaurantFloorBounds.y &&
//       stageY <= restaurantFloorBounds.y + restaurantFloorBounds.height) {

//       const constrainedPos = constrainToCanvas(
//         { x: stageX, y: stageY },
//         { width: config.config.width, height: config.config.height },
//         restaurantFloorBounds
//       );

//       const newTable = {
//         type: config.tableType,
//         x: constrainedPos.x,
//         y: constrainedPos.y,
//         rotation: 0,
//         status: "free" as const,
//         width: config.config.width,
//         height: config.config.height,
//         tableNumber: `T${tables.length + 1}`,
//       };

//       dispatch({ type: "ADD_TABLE", payload: { table: newTable } });
//     }
//   }, [dispatch, viewState, tables.length, restaurantFloorBounds]);

//   // Stage click handler
//   const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
//     if (e.target === e.target.getStage()) {
//       dispatch({ type: "SELECT_TABLE", payload: { tableId: null } });
//     }
//   }, [dispatch]);

//   const handleStageDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
//     const stage = e.target.getStage();
//     if (stage && e.target === stage) {
//       const pos = stage.position();
//       setViewState(prev => ({ ...prev, x: pos.x, y: pos.y }));
//     }
//   }, []);

//   // Floor dimension controls
//   const adjustFloorWidth = useCallback((delta: number) => {
//     const currentDimensions = state.layout.floorDimensions || { width: 1600, height: 1200 };
//     const newWidth = Math.max(800, Math.min(3000, currentDimensions.width + delta));

//     dispatch({
//       type: "UPDATE_FLOOR_DIMENSIONS",
//       payload: { dimensions: { ...currentDimensions, width: newWidth } }
//     });
//   }, [state.layout.floorDimensions, dispatch]);

//   const adjustFloorHeight = useCallback((delta: number) => {
//     const currentDimensions = state.layout.floorDimensions || { width: 1600, height: 1200 };
//     const newHeight = Math.max(600, Math.min(2400, currentDimensions.height + delta));

//     dispatch({
//       type: "UPDATE_FLOOR_DIMENSIONS",
//       payload: { dimensions: { ...currentDimensions, height: newHeight } }
//     });
//   }, [state.layout.floorDimensions, dispatch]);

//   // Keyboard shortcuts
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Delete" && state.selectedTable) {
//         dispatch({ type: "DELETE_TABLE", payload: { tableId: state.selectedTable } });
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [state.selectedTable, dispatch]);

//   // Register touch drop handler
//   useEffect(() => {
//     if (onTouchDropReady) {
//       onTouchDropReady(handleTouchDrop);
//     }
//   }, [onTouchDropReady, handleTouchDrop]);

//   return (
//     <PerformanceContext.Provider value={performanceContextValue}>
//       <div
//         className="relative overflow-hidden bg-slate-100"
//         style={{ width, height }}
//         onDrop={handleDrop}
//         onDragOver={(e) => {
//           e.preventDefault();
//           e.dataTransfer.dropEffect = "copy";
//         }}
//         onDragEnter={() => setIsDragOver(true)}
//         onDragLeave={() => setIsDragOver(false)}
//       >
//         {/* Header */}
//         <div className="absolute top-0 left-0 right-0 h-12 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-4 z-10">
//           <div className="flex items-center gap-3">
//             <span className="text-sm font-medium text-slate-700">Restaurant Floor Plan</span>
//             <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
//               {floorDimensions.width} × {floorDimensions.height}
//             </span>
//             <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
//               Scale: {(viewState.scale * 100).toFixed(0)}%
//             </span>
//           </div>
//           <div className="flex items-center gap-3">
//             <span className="text-xs text-slate-500">{tables.length} tables ({visibleTables.length} visible)</span>
//             <button
//               onClick={() => setShowSettings(!showSettings)}
//               className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
//             >
//               Floor Size
//             </button>
//           </div>
//         </div>

//         {/* Floor Size Controls */}
//         {showSettings && (
//           <div className="absolute top-16 right-4 bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-slate-200/80 w-80 z-20">
//             <div className="space-y-6">
//               <div className="text-sm font-semibold text-slate-800 text-center tracking-wide">Floor Dimensions</div>

//               {/* Width Control */}
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-xs text-slate-600 font-medium">Width</span>
//                   <span className="text-xs text-orange-600 font-mono bg-orange-50 px-2 py-1 rounded-md">
//                     {floorDimensions.width}px
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-center gap-2">
//                   <Button
//                     size="icon"
//                     variant="outline"
//                     onClick={() => adjustFloorWidth(-100)}
//                     disabled={floorDimensions.width <= 800}
//                     className="rounded-full h-9 w-9 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200"
//                   >
//                     <ChevronsLeft className="h-4 w-4" />
//                   </Button>

//                   <Button
//                     size="icon"
//                     variant="outline"
//                     onClick={() => adjustFloorWidth(-50)}
//                     disabled={floorDimensions.width <= 800}
//                     className="rounded-full h-9 w-9 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200"
//                   >
//                     <Minus className="h-4 w-4" />
//                   </Button>

//                   <div className="flex items-center gap-2 mx-3">
//                     <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
//                         style={{ width: `${((floorDimensions.width - 800) / (3000 - 800)) * 100}%` }}
//                       />
//                     </div>
//                   </div>

//                   <Button
//                     size="icon"
//                     variant="outline"
//                     onClick={() => adjustFloorWidth(50)}
//                     disabled={floorDimensions.width >= 3000}
//                     className="rounded-full h-9 w-9 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200"
//                   >
//                     <Plus className="h-4 w-4" />
//                   </Button>

//                   <Button
//                     size="icon"
//                     variant="outline"
//                     onClick={() => adjustFloorWidth(100)}
//                     disabled={floorDimensions.width >= 3000}
//                     className="rounded-full h-9 w-9 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200"
//                   >
//                     <ChevronsRight className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>

//               {/* Height Control */}
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-xs text-slate-600 font-medium">Height</span>
//                   <span className="text-xs text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded-md">
//                     {floorDimensions.height}px
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-center gap-2">
//                   <Button
//                     size="icon"
//                     variant="outline"
//                     onClick={() => adjustFloorHeight(-100)}
//                     disabled={floorDimensions.height <= 600}
//                     className="rounded-full h-9 w-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200"
//                   >
//                     <ChevronsUp className="h-4 w-4" />
//                   </Button>

//                   <Button
//                     size="icon"
//                     variant="outline"
//                     onClick={() => adjustFloorHeight(-50)}
//                     disabled={floorDimensions.height <= 600}
//                     className="rounded-full h-9 w-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200"
//                   >
//                     <Minus className="h-4 w-4" />
//                   </Button>

//                   <div className="flex items-center gap-2 mx-3">
//                     <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
//                         style={{ width: `${((floorDimensions.height - 600) / (2400 - 600)) * 100}%` }}
//                       />
//                     </div>
//                   </div>

//                   <Button
//                     size="icon"
//                     variant="outline"
//                     onClick={() => adjustFloorHeight(50)}
//                     disabled={floorDimensions.height >= 2400}
//                     className="rounded-full h-9 w-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200"
//                   >
//                     <Plus className="h-4 w-4" />
//                   </Button>

//                   <Button
//                     size="icon"
//                     variant="outline"
//                     onClick={() => adjustFloorHeight(100)}
//                     disabled={floorDimensions.height >= 2400}
//                     className="rounded-full h-9 w-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200"
//                   >
//                     <ChevronsDown className="h-4 w-4" />
//                   </Button>

//                 </div>
//               </div>
//               <hr className="border-slate-200/70" />
//               <div className="text-xs text-slate-500 space-y-1 text-center">
//                 <div><strong>Performance:</strong> {visibleTables.length}/{tables.length} rendered</div>
//                 <div><strong>Scale:</strong> {(viewState.scale * 100).toFixed(1)}% zoom</div>
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="pt-12 h-full">
//           <Stage
//             ref={stageRef}
//             width={width}
//             height={height - 48}
//             x={viewState.x}
//             y={viewState.y}
//             scaleX={viewState.scale}
//             scaleY={viewState.scale}
//             draggable={true}
//             onClick={handleStageClick}
//             onWheel={handleWheel}
//             onDragEnd={handleStageDragEnd}
//           >
//             <Layer>
//               {/* Restaurant Floor Canvas */}
//               <Rect
//                 x={restaurantFloorBounds.x}
//                 y={restaurantFloorBounds.y}
//                 width={restaurantFloorBounds.width}
//                 height={restaurantFloorBounds.height}
//                 fill="white"
//                 stroke="#F97316"
//                 strokeWidth={4}
//                 cornerRadius={12}
//                 shadowColor="rgba(0,0,0,0.15)"
//                 shadowBlur={8}
//                 shadowOffset={{ x: 2, y: 2 }}
//                 listening={false}
//               />

//               {/* Grid */}
//               <VirtualGrid />

//               {/* Tables */}
//               {visibleTables.map((table) => (
//                 <TableComponent
//                   key={table.id}
//                   table={table}
//                   isSelected={state.selectedTable === table.id}
//                   onSelect={selectHandlers.get(table.id)!}
//                   onUpdate={updateHandlers.get(table.id)!}
//                 />
//               ))}
//             </Layer>
//           </Stage>
//         </div>

//         {/* Drag Indicator */}
//         {isDragOver && (
//           <div className="absolute inset-0 pointer-events-none">
//             <div
//               className="absolute border-2 border-dashed border-orange-400/80 bg-orange-50/50 rounded-2xl backdrop-blur-sm transition-all duration-200"
//               style={{
//                 left: `${restaurantFloorBounds.x * viewState.scale + viewState.x}px`,
//                 top: `${restaurantFloorBounds.y * viewState.scale + viewState.y + 48}px`,
//                 width: `${restaurantFloorBounds.width * viewState.scale}px`,
//                 height: `${restaurantFloorBounds.height * viewState.scale}px`,
//                 boxShadow: `0 0 25px rgba(251,146,60,0.5)`,
//               }}
//             />

//             <div
//               className="absolute rounded-full pointer-events-none opacity-50"
//               style={{
//                 left: `${restaurantFloorBounds.x * viewState.scale + viewState.x - 100}px`,
//                 top: `${restaurantFloorBounds.y * viewState.scale + viewState.y - 100 + 48}px`,
//                 width: `${restaurantFloorBounds.width * viewState.scale + 200}px`,
//                 height: `${restaurantFloorBounds.height * viewState.scale + 200}px`,
//                 background: "radial-gradient(circle, rgba(251,191,36,0.15), transparent 70%)",
//               }}
//             />

//             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//               <div className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 text-white px-6 py-2 rounded-full font-semibold text-sm shadow-xl tracking-wide animate-pulse">
//                 Drop table on restaurant floor
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </PerformanceContext.Provider>
//   );
// }