// components/FloorControls.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ChevronsLeft, ChevronsRight, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloorControlsProps } from '@/types/canvas';

const FloorControls: React.FC<FloorControlsProps> = ({
    floorDimensions,
    onWidthChange,
    onHeightChange,
    showSettings,
    itemsCount,
    visibleItemsCount,
    viewScale
}) => {
    const widthProgress = ((floorDimensions.width - 800) / (3000 - 800)) * 100;
    const heightProgress = ((floorDimensions.height - 600) / (2400 - 600)) * 100;

    return (
        <AnimatePresence>
            {showSettings && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute top-20 right-6 bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-200/50 w-96 z-20"
                >
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-base font-bold text-slate-800 text-center tracking-wide"
                        >
                            Floor Dimensions
                        </motion.div>

                        {/* Width Control */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700 font-semibold">Width</span>
                                <motion.span
                                    className="text-sm text-orange-600 font-mono bg-orange-50 px-3 py-1.5 rounded-lg shadow-sm"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    {floorDimensions.width}px
                                </motion.span>
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onWidthChange(-100)}
                                    disabled={floorDimensions.width <= 800}
                                    className="rounded-full h-10 w-10 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 shadow-sm disabled:opacity-50"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onWidthChange(-50)}
                                    disabled={floorDimensions.width <= 800}
                                    className="rounded-full h-10 w-10 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 shadow-sm disabled:opacity-50"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-3 mx-4">
                                    <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                                            style={{ width: `${widthProgress}%` }}
                                            animate={{ width: `${widthProgress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onWidthChange(50)}
                                    disabled={floorDimensions.width >= 3000}
                                    className="rounded-full h-10 w-10 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 shadow-sm disabled:opacity-50"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onWidthChange(100)}
                                    disabled={floorDimensions.width >= 3000}
                                    className="rounded-full h-10 w-10 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 shadow-sm disabled:opacity-50"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>

                        {/* Height Control */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700 font-semibold">Height</span>
                                <motion.span
                                    className="text-sm text-emerald-600 font-mono bg-emerald-50 px-3 py-1.5 rounded-lg shadow-sm"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    {floorDimensions.height}px
                                </motion.span>
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onHeightChange(-100)}
                                    disabled={floorDimensions.height <= 600}
                                    className="rounded-full h-10 w-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm disabled:opacity-50"
                                >
                                    <ChevronsUp className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onHeightChange(-50)}
                                    disabled={floorDimensions.height <= 600}
                                    className="rounded-full h-10 w-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm disabled:opacity-50"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-3 mx-4">
                                    <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                            style={{ width: `${heightProgress}%` }}
                                            animate={{ width: `${heightProgress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onHeightChange(50)}
                                    disabled={floorDimensions.height >= 2400}
                                    className="rounded-full h-10 w-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm disabled:opacity-50"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onHeightChange(100)}
                                    disabled={floorDimensions.height >= 2400}
                                    className="rounded-full h-10 w-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm disabled:opacity-50"
                                >
                                    <ChevronsDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>

                        {/* Stats Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <hr className="border-slate-200/70" />
                            <div className="text-xs text-slate-600 space-y-2 text-center mt-4">
                                <motion.div
                                    className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="font-semibold text-slate-700 mb-1">Performance Stats</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white/60 px-2 py-1 rounded-md">
                                            <strong>Rendered:</strong> {visibleItemsCount}/{itemsCount}
                                        </div>
                                        <div className="bg-white/60 px-2 py-1 rounded-md">
                                            <strong>Scale:</strong> {(viewScale * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FloorControls;