// components/LockButton.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LockButtonProps } from '../types/canvas';

const LockButton: React.FC<LockButtonProps> = ({ isLocked, onToggle }) => {
    return (
        <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <Button
                onClick={onToggle}
                variant={isLocked ? "destructive" : "default"}
                size="sm"
                className={`
          flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300
          ${isLocked
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                    }
        `}
            >
                <motion.div
                    animate={{ rotate: isLocked ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                >
                    {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </motion.div>
                <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
            </Button>
        </motion.div>
    );
};

export default LockButton;