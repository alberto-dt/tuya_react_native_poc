// Interfaces principales
export interface TuyaUser {
    uid: string;
    username: string;
    email: string;
    avatarUrl?: string;
    headPic?: string;
    nickName?: string;
    phoneCode?: string;
    mobile?: string;
    timezoneId?: string;
    phoneNumber?: string;
}

export interface TuyaHome {
    homeId: number;
    name: string;
    geoName: string;
    lon: number;
    lat: number;
    address: string;
}

export interface TuyaDevice {
    devId: string;
    name: string;
    iconUrl: string;
    isOnline: boolean;
    productId: string;
    supportedFunctions: string[];
    uuid?: string;
    category?: string;
    productName?: string;
    isLocalOnline?: boolean;
    isSub?: boolean;
    isShare?: boolean;
    status?: { [key: string]: any };
}

// Interfaces para configuración
export interface TuyaCredentials {
    appKey: string;
    appSecret: string;
}

export interface TuyaPlatformConfig {
    ios: TuyaCredentials;
    android: TuyaCredentials;
}

// Interfaces para comandos de dispositivos
export interface DeviceCommand {
    [key: string]: any;
}

// Interfaces para el resultado de inicialización
export interface TuyaInitResult {
    success: boolean;
    message: string;
    platform: 'ios' | 'android';
    sdkVersion?: string;
}

// Interfaces para respuestas del SDK
export interface TuyaResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Interfaces para pairing de dispositivos
export interface PairingValidationResult {
    canProceed: boolean;
    status: 'ready' | 'not_ready' | 'error';
    errors: string[];
    warnings: string[];
    ssid: string;
    homeId: number;
    timeout: number;
    mode: string;
    passwordProvided: boolean;
    validSSID: boolean;
    validPassword: boolean;
    validHomeId: boolean;
    validTimeout: boolean;
    validMode: boolean;
    wifiConnected: boolean;
    locationPermissionGranted: boolean;
    locationServicesEnabled: boolean;
    pairingAvailable: boolean;
    currentSSID: string;
    alreadyOnTargetNetwork: boolean;
    debugInfo?: {
        currentNetwork: string;
        targetNetwork: string;
        recommendedMode: string;
        networkType: string;
    };
}

export interface PairingOptions {
    mode?: 'EZ' | 'AP' | 'AUTO';
    maxRetries?: number;
    timeout?: number;
    autoFallback?: boolean;
    onProgress?: (step: string, details?: any) => void;
    onValidationWarning?: (warnings: string[]) => boolean;
}

export interface PairingResult {
    success: boolean;
    device?: TuyaDevice;
    mode?: string;
    attempts?: number;
    duration?: number;
    error?: string;
}

// Types para métodos del módulo nativo
export interface SmartLifeModuleInterface {
    // Inicialización
    initSDK(appKey: string, secretKey: string): Promise<string>;
    testConnection(): Promise<string>;

    // Gestión de usuarios
    loginWithEmail(countryCode: string, email: string, password: string): Promise<TuyaUser>;
    logout(): Promise<string>;
    registerWithEmail(email: string, password: string, countryCode: string): Promise<TuyaUser>;

    // Gestión de hogares
    getHomeList(): Promise<TuyaHome[]>;
    getDeviceList(homeId: number): Promise<TuyaDevice[]>;
    createHome(homeName: string, geoName: string, lat: number, lon: number): Promise<TuyaHome>;

    // Gestión de dispositivos
    startDevicePairingEZ(homeId: number, ssid: string, password: string, timeout: number): Promise<TuyaDevice>;
    startDevicePairingAP(homeId: number, ssid: string, password: string, timeout: number): Promise<TuyaDevice>;
    stopDevicePairing(): Promise<string>;
    validatePairingConditions(ssid: string, password: string, homeId: number, timeout: number, mode: string): Promise<PairingValidationResult>;

    // Utilidades
    getCurrentWifiSSID(): Promise<string>;
    removeDevice(deviceId: string, homeId: number): Promise<string>;
}

// Types para componentes React
export type AppScreen = 'login' | 'register' | 'home' | 'homeList' | 'addHome' | 'deviceList' | 'addDevice';

export interface AppUIState {
    currentScreen: AppScreen;
    user: TuyaUser | null;
    selectedHome: TuyaHome | null;
    isLoading: boolean;
}
