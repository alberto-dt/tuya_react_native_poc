import { useState, useCallback, useRef } from 'react';
import SmartLifeService from '@/services/SmartLifeService';
import { TuyaUser, TuyaHome, TuyaDevice } from '@/types/SmartLifeTypes';

interface UseSmartLifeState {
    isInitialized: boolean;
    isLoggedIn: boolean;
    user: TuyaUser | null;
    homes: TuyaHome[];
    devices: TuyaDevice[];
    selectedHome: TuyaHome | null;
    loading: boolean;
    error: string | null;
}

interface UseSmartLifeActions {
    initializeSDK: (appKey: string, secretKey: string) => Promise<void>;
    login: (email: string, password: string, countryCode?: string) => Promise<void>;
    logout: () => Promise<void>;
    loadHomes: () => Promise<void>;
    loadDevices: (homeId: number) => Promise<void>;
    selectHome: (home: TuyaHome) => Promise<void>;
    refreshDevices: () => Promise<void>;
    clearError: () => void;
}

export const useSmartLife = (): UseSmartLifeState & UseSmartLifeActions => {
    const [state, setState] = useState<UseSmartLifeState>({
        isInitialized: false,
        isLoggedIn: false,
        user: null,
        homes: [],
        devices: [],
        selectedHome: null,
        loading: false,
        error: null,
    });

    const stateRef = useRef(state);
    stateRef.current = state;

    const updateState = useCallback((updates: Partial<UseSmartLifeState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const setLoading = useCallback((loading: boolean) => {
        updateState({ loading });
    }, [updateState]);

    const setError = useCallback((error: string | null) => {
        updateState({ error });
    }, [updateState]);

    const initializeSDK = useCallback(async (appKey: string, secretKey: string) => {
        try {
            setLoading(true);
            setError(null);
            await SmartLifeService.initSDK(appKey, secretKey);
            updateState({ isInitialized: true });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to initialize SDK';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, updateState]);

    const loadDevices = useCallback(async (homeId: number) => {
        try {
            setLoading(true);
            setError(null);
            const devices = await SmartLifeService.getDeviceList(homeId);
            updateState({ devices });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load devices';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, updateState]);

    const loadHomes = useCallback(async () => {
        try {
            setError(null);
            const homes = await SmartLifeService.getHomeList();
            updateState({ homes });

            if (homes.length > 0 && !stateRef.current.selectedHome) {
                const firstHome = homes[0];
                updateState({ selectedHome: firstHome });
                await loadDevices(firstHome.homeId);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load homes';
            setError(errorMessage);
            throw error;
        }
    }, [setError, updateState, loadDevices]);

    const login = useCallback(async (
        email: string,
        password: string,
        countryCode: string = '593'
    ) => {
        try {
            setLoading(true);
            setError(null);
            const user = await SmartLifeService.loginWithEmail(email, password, countryCode);
            updateState({
                isLoggedIn: true,
                user
            });
            await loadHomes();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, updateState, loadHomes]);

    const logout = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await SmartLifeService.logout();
            updateState({
                isLoggedIn: false,
                user: null,
                homes: [],
                devices: [],
                selectedHome: null,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Logout failed';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, updateState]);

    const selectHome = useCallback(async (home: TuyaHome) => {
        updateState({ selectedHome: home });
        await loadDevices(home.homeId);
    }, [updateState, loadDevices]);

    const refreshDevices = useCallback(async () => {
        if (stateRef.current.selectedHome) {
            await loadDevices(stateRef.current.selectedHome.homeId);
        }
    }, [loadDevices]);

    const clearError = useCallback(() => {
        setError(null);
    }, [setError]);

    return {
        ...state,
        initializeSDK,
        login,
        logout,
        loadHomes,
        loadDevices,
        selectHome,
        refreshDevices,
        clearError,
    };
};
