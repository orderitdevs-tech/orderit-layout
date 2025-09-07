// components/DragIndicator.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CanvasBounds, ViewState } from '@/types/canvas';

interface DragIndicatorProps {
    isDragOver: boolean;
    isLocked: boolean;
    restaurantFloorBounds: CanvasBounds;
    viewState: ViewState;
}

const DragIndicator: React.FC<DragIndicatorProps> = ({
    isDragOver,
    isLocked,
    restaurantFloorBounds,
    viewState
}) => {
    return (
        <AnimatePresence>
            {isDragOver && !isLocked && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 pointer-events-none z-30"
                >
                    {/* Main drop zone highlight */}
                    <motion.div
                        className="absolute border-2 border-dashed border-orange-400/80 bg-orange-50/40 rounded-3xl backdrop-blur-sm"
                        style={{
                            left: `${restaurantFloorBounds.x * viewState.scale + viewState.x}px`,
                            top: `${restaurantFloorBounds.y * viewState.scale + viewState.y + 64}px`,
                            width: `${restaurantFloorBounds.width * viewState.scale}px`,
                            height: `${restaurantFloorBounds.height * viewState.scale}px`,
                            boxShadow: `0 0 40px rgba(251,146,60,0.4)`,
                        }}
                        animate={{
                            borderColor: [
                                'rgba(251,146,60,0.8)',
                                'rgba(251,146,60,0.4)',
                                'rgba(251,146,60,0.8)'
                            ],
                            boxShadow: [
                                '0 0 40px rgba(251,146,60,0.4)',
                                '0 0 60px rgba(251,146,60,0.6)',
                                '0 0 40px rgba(251,146,60,0.4)'
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Animated background glow */}
                    <motion.div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            left: `${restaurantFloorBounds.x * viewState.scale + viewState.x - 100}px`,
                            top: `${restaurantFloorBounds.y * viewState.scale + viewState.y - 100 + 64}px`,
                            width: `${restaurantFloorBounds.width * viewState.scale + 200}px`,
                            height: `${restaurantFloorBounds.height * viewState.scale + 200}px`,
                            background: "radial-gradient(circle, rgba(251,191,36,0.15), transparent 70%)",
                        }}
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />

                    {/* Drop message */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <motion.div
                            className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 text-white px-8 py-3 rounded-2xl font-bold text-base shadow-2xl tracking-wide"
                            animate={{
                                y: [0, -8, 0],
                                boxShadow: [
                                    '0 20px 40px rgba(251,146,60,0.3)',
                                    '0 25px 50px rgba(251,146,60,0.4)',
                                    '0 20px 40px rgba(251,146,60,0.3)'
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            ✨ Drop table on restaurant floor
                        </motion.div>
                    </motion.div>

                    
                </motion.div>
            )}

            {/* Locked state indicator */}
            {isDragOver && isLocked && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none z-30"
                >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                            className="bg-gradient-to-r from-red-500 via-pink-400 to-red-600 text-white px-8 py-3 rounded-2xl font-bold text-base shadow-2xl tracking-wide"
                            animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 1, -1, 0]
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            🔒 Layout is locked - Unlock to edit
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DragIndicator;
