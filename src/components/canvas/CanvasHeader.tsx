// components/CanvasHeader.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { HeaderProps } from '@/types/canvas';
import LockButton from '@/components/LockButton';

const CanvasHeader: React.FC<HeaderProps> = ({
    floorDimensions,
    viewScale,
    tablesCount,
    visibleTablesCount,
    isLocked,
    onToggleLock,
    showSettings,
    onToggleSettings
}) => {
    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-6 z-10 shadow-sm"
        >
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">Restaurant Floor Plan</span>
                    <div className="flex items-center gap-3 mt-1">
                        <motion.span
                            className="text-xs text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full font-medium"
                            whileHover={{ scale: 1.05 }}
                        >
                            {floorDimensions.width} × {floorDimensions.height}
                        </motion.span>
                        <motion.span
                            className="text-xs text-blue-600 bg-blue-50/80 px-3 py-1 rounded-full font-medium"
                            whileHover={{ scale: 1.05 }}
                        >
                            Scale: {(viewScale * 100).toFixed(0)}%
                        </motion.span>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-600 font-medium">
                        {tablesCount} tables ({visibleTablesCount} visible)
                    </span>
                    <motion.span
                        className={`text-xs font-medium px-2 py-1 rounded-full mt-1 ${isLocked
                                ? 'text-red-600 bg-red-50'
                                : 'text-green-600 bg-green-50'
                            }`}
                        animate={{ scale: isLocked ? [1, 1.05, 1] : 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {isLocked ? 'View Only Mode' : 'Edit Mode'}
                    </motion.span>
                </div>

                <LockButton isLocked={isLocked} onToggle={onToggleLock} />

                <motion.button
                    onClick={onToggleSettings}
                    className={`text-xs px-4 py-2 rounded-full font-medium transition-all duration-200 ${showSettings
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700'
                        }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Floor Settings
                </motion.button>
            </div>
        </motion.div>
    );
};

export default CanvasHeader;