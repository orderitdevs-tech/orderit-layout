import { useState, useCallback } from 'react';
import { useSession } from '@/context/SessionContext';

import { toast } from 'sonner';
import { Floor, LayoutItem } from '@/types/restaurant';

// API Response wrapper
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface FloorListItem {
  id: string
  name: string
  version: number
}

export interface RestaurantInfo {
  id: string
  name: string
}

export interface FloorResponse {
  restaurant: RestaurantInfo
  floors: FloorListItem[]
}

export interface FloorSaveRequest {
    name: string;
    width: number;
    height: number;
    version: number;
    layoutItems: LayoutItem[];
}
// Hook state types
interface FloorActions {
    creating: boolean;
    updating: Record<string, boolean>;
    deleting: Record<string, boolean>;
    locking: Record<string, boolean>;
    unlocking: Record<string, boolean>;
    saving: Record<string, boolean>;
    createError: string | null;
    updateErrors: Record<string, string>;
    deleteErrors: Record<string, string>;
    lockErrors: Record<string, string>;
    saveErrors: Record<string, string>;
}

// Create floor data
interface CreateFloorData {
    name: string;
    width: number;
    height: number;
    background?: string;
}

// Lock response data
interface LockResponse {
    isLocked: boolean;
    expiresAt: Date;
}

// Save response data
interface SaveResponse {
    saveResult: {
        id: string;
        version: number;
        exportedAt: Date;
    };
    updatedLayout?: Floor;
}

export const useFloors = (restaurantId: string) => {
    const { api } = useSession();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [actions, setActions] = useState<FloorActions>({
        creating: false,
        updating: {},
        deleting: {},
        locking: {},
        unlocking: {},
        saving: {},
        createError: null,
        updateErrors: {},
        deleteErrors: {},
        lockErrors: {},
        saveErrors: {}
    });

    // Clear all errors
    const clearErrors = useCallback(() => {
        setError(null);
        setActions(prev => ({
            ...prev,
            createError: null,
            updateErrors: {},
            deleteErrors: {},
            lockErrors: {},
            saveErrors: {}
        }));
    }, []);

    // Fetch all floors for restaurant
    const fetchFloors = useCallback(async (): Promise<FloorResponse> => {
        if (!restaurantId) throw new Error('Restaurant ID is required');

        try {
            setLoading(true);
            setError(null);

            const response = await api.get<ApiResponse<FloorResponse>>(
                `/api/restaurants/${restaurantId}/floors`
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch floors');
            }

            return response.data.data;
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;

            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch floors';
            setError(errorMessage);

            toast.error(errorMessage);

            throw err;
        } finally {
            setLoading(false);
        }
    }, [restaurantId, api]);

    // Fetch floor layout
    const fetchFloorLayout = useCallback(async (floorId: string): Promise<Floor> => {
        if (!restaurantId || !floorId) throw new Error('Restaurant ID and Floor ID are required');

        try {
            setLoading(true);
            setError(null);

            const response = await api.get<ApiResponse<Floor>>(
                `/api/restaurants/${restaurantId}/floors/${floorId}/layout`
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch floor layout');
            }

            return response.data.data;
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;

            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch floor layout';
            setError(errorMessage);

            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [restaurantId, api]);

    // Create floor
    const createFloor = useCallback(async (data: CreateFloorData): Promise<FloorListItem> => {
        if (!restaurantId) throw new Error('Restaurant ID is required');

        try {
            setActions(prev => ({ ...prev, creating: true, createError: null }));

            const response = await api.post<ApiResponse<FloorListItem>>(
                `/api/restaurants/${restaurantId}/floors`,
                data
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create floor');
            }

            setActions(prev => ({ ...prev, creating: false }));

            toast.success("Floor created successfully");

            return response.data.data;
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;

            const errorMessage = err.response?.data?.message || err.message || 'Failed to create floor';
            setActions(prev => ({ ...prev, creating: false, createError: errorMessage }));

            toast.error(errorMessage);

            throw err;
        }
    }, [restaurantId, api]);

    // Delete floor
    const deleteFloor = useCallback(async (floorId: string): Promise<void> => {
        if (!restaurantId || !floorId) throw new Error('Restaurant ID and Floor ID are required');

        try {
            setActions(prev => ({
                ...prev,
                deleting: { ...prev.deleting, [floorId]: true },
                deleteErrors: { ...prev.deleteErrors, [floorId]: '' }
            }));

            const response = await api.delete<ApiResponse<null>>(
                `/api/restaurants/${restaurantId}/floors/${floorId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete floor');
            }

            setActions(prev => ({
                ...prev,
                deleting: { ...prev.deleting, [floorId]: false },
                deleteErrors: { ...prev.deleteErrors, [floorId]: '' }
            }));

            toast.success("Floor deleted successfully");
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;

            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete floor';
            setActions(prev => ({
                ...prev,
                deleting: { ...prev.deleting, [floorId]: false },
                deleteErrors: { ...prev.deleteErrors, [floorId]: errorMessage }
            }));

            toast.error(errorMessage);
            throw err;
        }
    }, [restaurantId, api]);

    // Acquire floor lock
    const acquireFloorLock = useCallback(async (floorId: string): Promise<LockResponse> => {
        if (!restaurantId || !floorId) throw new Error('Restaurant ID and Floor ID are required');

        try {
            setActions(prev => ({
                ...prev,
                locking: { ...prev.locking, [floorId]: true },
                lockErrors: { ...prev.lockErrors, [floorId]: '' }
            }));

            const response = await api.post<ApiResponse<LockResponse>>(
                `/api/restaurants/${restaurantId}/floors/${floorId}/lock`
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to acquire floor lock');
            }

            setActions(prev => ({
                ...prev,
                locking: { ...prev.locking, [floorId]: false },
                lockErrors: { ...prev.lockErrors, [floorId]: '' }
            }));

            return response.data.data;
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;

            const errorMessage = err.response?.data?.message || err.message || 'Failed to acquire floor lock';
            setActions(prev => ({
                ...prev,
                locking: { ...prev.locking, [floorId]: false },
                lockErrors: { ...prev.lockErrors, [floorId]: errorMessage }
            }));

            toast.error(errorMessage);

            throw err;
        }
    }, [restaurantId, api]);

    // Release floor lock
    const releaseFloorLock = useCallback(async (floorId: string): Promise<void> => {
        if (!restaurantId || !floorId) throw new Error('Restaurant ID and Floor ID are required');

        try {
            setActions(prev => ({
                ...prev,
                unlocking: { ...prev.unlocking, [floorId]: true },
                lockErrors: { ...prev.lockErrors, [floorId]: '' }
            }));

            const response = await api.delete<ApiResponse<null>>(
                `/api/restaurants/${restaurantId}/floors/${floorId}/lock`
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to release floor lock');
            }

            setActions(prev => ({
                ...prev,
                unlocking: { ...prev.unlocking, [floorId]: false },
                lockErrors: { ...prev.lockErrors, [floorId]: '' }
            }));
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;

            const errorMessage = err.response?.data?.message || err.message || 'Failed to release floor lock';
            setActions(prev => ({
                ...prev,
                unlocking: { ...prev.unlocking, [floorId]: false },
                lockErrors: { ...prev.lockErrors, [floorId]: errorMessage }
            }));

            toast.error(errorMessage);

            throw err;
        }
    }, [restaurantId, api]);

    // Save floor layout
    const saveFloorLayout = useCallback(async (floorId: string, data: FloorSaveRequest): Promise<SaveResponse> => {
        if (!restaurantId || !floorId) throw new Error('Restaurant ID and Floor ID are required');

        try {
            setActions(prev => ({
                ...prev,
                saving: { ...prev.saving, [floorId]: true },
                saveErrors: { ...prev.saveErrors, [floorId]: '' }
            }));

            const response = await api.put<ApiResponse<SaveResponse>>(
                `/api/restaurants/${restaurantId}/floors/${floorId}/layout`,
                data
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to save floor layout');
            }

            setActions(prev => ({
                ...prev,
                saving: { ...prev.saving, [floorId]: false },
                saveErrors: { ...prev.saveErrors, [floorId]: '' }
            }));

            toast.success("Floor layout saved successfully");

            return response.data.data;
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;

            const errorMessage = err.response?.data?.message || err.message || 'Failed to save floor layout';
            setActions(prev => ({
                ...prev,
                saving: { ...prev.saving, [floorId]: false },
                saveErrors: { ...prev.saveErrors, [floorId]: errorMessage }
            }));

            toast.error(errorMessage);

            throw err;
        }
    }, [restaurantId, api]);


    // Helper functions for checking states
    const isCreating = useCallback(() => actions.creating, [actions.creating]);
    const isUpdating = useCallback((id: string) => actions.updating[id] || false, [actions.updating]);
    const isDeleting = useCallback((id: string) => actions.deleting[id] || false, [actions.deleting]);
    const isLocking = useCallback((id: string) => actions.locking[id] || false, [actions.locking]);
    const isUnlocking = useCallback((id: string) => actions.unlocking[id] || false, [actions.unlocking]);
    const isSaving = useCallback((id: string) => actions.saving[id] || false, [actions.saving]);

    const getCreateError = useCallback(() => actions.createError, [actions.createError]);
    const getUpdateError = useCallback((id: string) => actions.updateErrors[id] || null, [actions.updateErrors]);
    const getDeleteError = useCallback((id: string) => actions.deleteErrors[id] || null, [actions.deleteErrors]);
    const getLockError = useCallback((id: string) => actions.lockErrors[id] || null, [actions.lockErrors]);
    const getSaveError = useCallback((id: string) => actions.saveErrors[id] || null, [actions.saveErrors]);

    return {
        // Loading states
        loading,
        isCreating,
        isUpdating,
        isDeleting,
        isLocking,
        isUnlocking,
        isSaving,

        // Errors
        error,
        getCreateError,
        getUpdateError,
        getDeleteError,
        getLockError,
        getSaveError,

        // Floor management actions
        fetchFloors,
        fetchFloorLayout,
        createFloor,
        deleteFloor,

        // Floor lock management
        acquireFloorLock,
        releaseFloorLock,

        // Floor layout save
        saveFloorLayout,

        // Utils
        clearErrors,

        // Computed values
        hasError: !!error || !!actions.createError ||
            Object.values(actions.updateErrors).some(Boolean) ||
            Object.values(actions.deleteErrors).some(Boolean) ||
            Object.values(actions.lockErrors).some(Boolean) ||
            Object.values(actions.saveErrors).some(Boolean),
    };
};