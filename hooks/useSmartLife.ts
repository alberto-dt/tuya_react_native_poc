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
    loginWithPhone: (phone: string, password: string, countryCode?: string) => Promise<void>;
    logout: () => Promise<void>;
    loadHomes: () => Promise<void>;
    loadDevices: (homeId: number) => Promise<void>;
    selectHome: (home: TuyaHome) => Promise<void>;
    controlDevice: (deviceId: string, commands: any) => Promise<void>;
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

    const loginWithPhone = useCallback(async (
        phone: string,
        password: string,
        countryCode: string = '1'
    ) => {
        try {
            setLoading(true);
            setError(null);
            const user = await SmartLifeService.loginWithPhone(phone, password, countryCode);
            updateState({
                isLoggedIn: true,
                user
            });
            await loadHomes();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Phone login failed';
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

    const controlDevice = useCallback(async (deviceId: string, commands: any) => {
        try {
            setError(null);
            await SmartLifeService.controlDevice(deviceId, commands);

            if (stateRef.current.selectedHome) {
                await loadDevices(stateRef.current.selectedHome.homeId);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to control device';
            setError(errorMessage);
            throw error;
        }
    }, [setError, loadDevices]);

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
        loginWithPhone,
        logout,
        loadHomes,
        loadDevices,
        selectHome,
        controlDevice,
        refreshDevices,
        clearError,
    };
};

// Hook específico para controlar dispositivos
export const useDeviceControl = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleSwitch = useCallback(async (deviceId: string, switchNumber: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            await SmartLifeService.toggleSwitch(deviceId, switchNumber);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to toggle switch';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const setBrightness = useCallback(async (deviceId: string, brightness: number) => {
        try {
            setLoading(true);
            setError(null);
            await SmartLifeService.setBrightness(deviceId, brightness);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to set brightness';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const setColorTemperature = useCallback(async (deviceId: string, temperature: number) => {
        try {
            setLoading(true);
            setError(null);
            await SmartLifeService.setColorTemperature(deviceId, temperature);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to set color temperature';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const setRGBColor = useCallback(async (deviceId: string, hexColor: string) => {
        try {
            setLoading(true);
            setError(null);
            await SmartLifeService.setRGBColor(deviceId, hexColor);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to set RGB color';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loading,
        error,
        toggleSwitch,
        setBrightness,
        setColorTemperature,
        setRGBColor,
        clearError,
    };
};
