// components/RoomDropIndicator.tsx
import React from 'react';
import { Group, Rect } from 'react-konva';

interface RoomDropIndicatorProps {
    room: any;
    isVisible: boolean;
}

const RoomDropIndicator: React.FC<RoomDropIndicatorProps> = ({ room, isVisible }) => {
    if (!isVisible) return null;

    return (
        <Group>
            {/* Room drop zone highlight */}
            <Rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                stroke="#10b981"
                strokeWidth={3}
                dash={[8, 4]}
                fill="rgba(16, 185, 129, 0.15)"
                cornerRadius={8}
                listening={false}
            />
            
            {/* Animated pulsing effect */}
            <Rect
                x={room.x + 2}
                y={room.y + 2}
                width={room.width - 4}
                height={room.height - 4}
                stroke="#22c55e"
                strokeWidth={1.5}
                dash={[4, 4]}
                fill="transparent"
                cornerRadius={6}
                listening={false}
                // Add simple animation by changing dash offset
                dashOffset={Date.now() / 50} // This will create moving dashes
            />
            
            {/* Drop hint text */}
            <Rect
                x={room.x + room.width / 2 - 30}
                y={room.y - 25}
                width={60}
                height={20}
                fill="#10b981"
                cornerRadius={10}
                listening={false}
            />
        </Group>
    );
};

export default RoomDropIndicator;