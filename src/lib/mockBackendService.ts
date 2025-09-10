import { Floor } from "../types/restaurant";

export class MockBackendService {
    private static floors = new Map<string, Floor>([
        ['floor-1', {
            id: 'floor-1',
            name: 'Ground Floor',
            width: 1600,
            height: 1200,
            version: 1,
            isLocked: false,
            layoutItems: [
                {
                    id: 'table-1',
                    type: 'table-4',
                    x: 100,
                    y: 100,
                    rotation: 0,
                    width: 120,
                    height: 80,
                    tableNumber: 'T1',
                    capacity: 4,
                    status: 'free',
                    tableType: 'regular'
                },
                {
                    id: 'table-2',
                    type: 'table-2',
                    x: 300,
                    y: 150,
                    rotation: 0,
                    width: 80,
                    height: 60,
                    tableNumber: 'T2',
                    capacity: 2,
                    status: 'occupied',
                    tableType: 'regular'
                }
            ]
        }],
        ['floor-2', {
            id: 'floor-2',
            name: 'First Floor',
            width: 1400,
            height: 1000,
            version: 1,
            isLocked: true,
            layoutItems: [
                {
                    id: 'table-3',
                    type: 'table-6',
                    x: 200,
                    y: 200,
                    rotation: 0,
                    width: 140,
                    height: 100,
                    tableNumber: 'T3',
                    capacity: 6,
                    status: 'reserved',
                    tableType: 'vip'
                }
            ]
        }],
        ['floor-3', {
            id: 'floor-3',
            name: 'Rooftop',
            width: 1200,
            height: 800,
            version: 1,
            isLocked: false,
            layoutItems: [
                {
                    id: 'table-4',
                    type: 'table-8',
                    x: 150,
                    y: 120,
                    rotation: 45,
                    width: 160,
                    height: 120,
                    tableNumber: 'T4',
                    capacity: 8,
                    status: 'free',
                    tableType: 'outdoor'
                }
            ]
        }]
    ]);

    static async getAvailableFloors(): Promise<{ id: string; name: string }[]> {
        await this.delay(500);

        if (Math.random() < 0.1) {
            throw new Error('Network error: Failed to fetch available floors');
        }

        return Array.from(this.floors.values()).map(floor => ({
            id: floor.id,
            name: floor.name
        }));
    }

    static async getFloorData(floorId: string): Promise<Floor> {
        await this.delay(800);

        if (Math.random() < 0.15) {
            throw new Error(`Network error: Failed to load floor data for ${floorId}`);
        }

        const floorData = this.floors.get(floorId);
        if (!floorData) {
            throw new Error(`Floor not found: ${floorId}`);
        }

        return { ...floorData };
    }

    static async saveFloorData(floorId: string, floorData: Floor): Promise<void> {
        await this.delay(600);

        this.floors.set(floorId, { ...floorData });
        console.log(`✅ Floor ${floorId} saved successfully`);
    }

    static async createFloor(name: string): Promise<{ id: string; name: string }> {
        await this.delay(500);

        if (Math.random() < 0.1) {
            throw new Error('Network error: Failed to create floor');
        }

        const newFloorId = `floor-${Date.now()}`;
        const newFloor: Floor = {
            id: newFloorId,
            name,
            width: 1600,
            height: 1200,
            layoutItems: [],
            isLocked: false,
            version: 1
        };

        this.floors.set(newFloorId, newFloor);
        return { id: newFloorId, name };
    }

    static async deleteFloor(floorId: string): Promise<void> {
        await this.delay(400);

        if (Math.random() < 0.1) {
            throw new Error('Network error: Failed to delete floor');
        }

        if (!this.floors.has(floorId)) {
            throw new Error(`Floor not found: ${floorId}`);
        }

        this.floors.delete(floorId);
    }

    static async renameFloor(floorId: string, name: string): Promise<void> {
        await this.delay(300);

        if (Math.random() < 0.1) {
            throw new Error('Network error: Failed to rename floor');
        }

        const floor = this.floors.get(floorId);
        if (!floor) {
            throw new Error(`Floor not found: ${floorId}`);
        }

        this.floors.set(floorId, { ...floor, name });
    }

    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}