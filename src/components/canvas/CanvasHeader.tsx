// components/CanvasHeader.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeaderProps } from '@/types/canvas';
import LockButton from '@/components/LockButton';
import {
    Settings,
    Ruler,
    ZoomIn,
    Table,
    Eye,
    Edit3,
    EyeOff
} from 'lucide-react';

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
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            whileHover={{ y: isHovered ? 0 : -5 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="absolute top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-2xl border-b border-slate-200/60 flex items-center justify-between px-4 md:px-6 z-10 shadow-sm"
        >
            {/* Left Section */}
            <div className="flex items-center gap-3">
                <motion.div
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="hidden md:flex h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 items-center justify-center">
                        <Ruler className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">Restaurant Floor Plan</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <motion.div
                                className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100/80 px-2 py-1 rounded-full font-medium"
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(226, 232, 240, 0.9)" }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <Ruler className="h-3 w-3" />
                                <span>{floorDimensions.width} × {floorDimensions.height}m</span>
                            </motion.div>
                            <motion.div
                                className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50/80 px-2 py-1 rounded-full font-medium"
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(219, 234, 254, 0.9)" }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <ZoomIn className="h-3 w-3" />
                                <span>{(viewScale * 100).toFixed(0)}%</span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                <motion.div
                    className="hidden md:flex flex-col items-end mr-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                        <Table className="h-3.5 w-3.5" />
                        <span>{tablesCount} tables</span>
                        <span className="text-slate-400">•</span>
                        <Eye className="h-3.5 w-3.5" />
                        <span>{visibleTablesCount} visible</span>
                    </div>
                    <motion.div
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full mt-1 ${isLocked
                            ? 'text-red-600 bg-red-50'
                            : 'text-green-600 bg-green-50'
                            }`}
                        animate={{
                            scale: isLocked ? [1, 1.05, 1] : 1,
                            transition: { duration: 0.5 }
                        }}
                    >
                        {isLocked ? (
                            <>
                                <EyeOff className="h-3 w-3" />
                                <span>View Only</span>
                            </>
                        ) : (
                            <>
                                <Edit3 className="h-3 w-3" />
                                <span>Edit Mode</span>
                            </>
                        )}
                    </motion.div>
                </motion.div>

                <LockButton isLocked={isLocked} onToggle={onToggleLock} />

                <motion.button
                    onClick={onToggleSettings}
                    className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-medium transition-all duration-200 ${showSettings
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700'
                        }`}
                    whileHover={{
                        scale: 1.05,
                        boxShadow: showSettings ? "0 10px 25px -5px rgba(249, 115, 22, 0.3)" : "0 5px 15px -5px rgba(0,0,0,0.1)"
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                </motion.button>
            </div>
        </motion.div>
    );
};

export default CanvasHeader;