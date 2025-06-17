import { NativeModules } from 'react-native';

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
export interface DeviceCommand {
    [key: string]: any;
}

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

export interface PairingDiagnostics {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    issues: Array<{
        type: 'error' | 'warning' | 'info';
        message: string;
        suggestion?: string;
    }>;
    recommendations: string[];
    networkInfo: any;
    systemInfo: any;
}

export interface DeviceScene {
    id: string;
    name: string;
    deviceId: string;
    actions: DeviceCommand[];
    description?: string;
    icon?: string;
    createdAt: Date;
    isActive: boolean;
}

export interface ScheduledAction {
    id: string;
    deviceId: string;
    name: string;
    commands: DeviceCommand;
    schedule: {
        time: string;
        days: string[];
        enabled: boolean;
        repeat: boolean;
    };
    createdAt: Date;
    lastExecuted?: Date;
}

export interface DeviceMetrics {
    deviceId: string;
    powerConsumption: number;
    dailyUsage: number;
    monthlyUsage: number;
    cost: number;
    efficiency: number;
    signalStrength: number;
    lastUpdate: Date;
    recommendations: string[];
}

export interface MockDeviceConfig {
    name: string;
    type: 'switch' | 'light' | 'sensor' | 'plug' | 'fan' | 'thermostat';
    category: string;
    online: boolean;
    features: string[];
    initialState?: { [key: string]: any };
}

interface SmartLifeModuleInterface {
    initSDK(appKey: string, secretKey: string): Promise<string>;
    loginWithEmail(countryCode: string, email: string, password: string): Promise<TuyaUser>;
    logout(): Promise<string>;
    registerWithEmail(email: string, password: string, countryCode: string): Promise<TuyaUser>;

    getHomeList(): Promise<TuyaHome[]>;
    getDeviceList(homeId: number): Promise<TuyaDevice[]>;
    createHome(homeName: string, geoName: string, lat: number, lon: number): Promise<TuyaHome>;

    startDevicePairingEZ(homeId: number, ssid: string, password: string, timeout: number): Promise<TuyaDevice>;
    startDevicePairingAP(homeId: number, ssid: string, password: string, timeout: number): Promise<TuyaDevice>;
    stopDevicePairing(): Promise<string>;
    validatePairingConditions(ssid: string, password: string, homeId: number, timeout: number, mode: string): Promise<PairingValidationResult>;

    getCurrentWifiSSID(): Promise<string>;
    removeDevice(deviceId: string, homeId: number): Promise<string>;
    addTestDevice(homeId: number, deviceName: string, deviceType: string): Promise<TuyaDevice>;
    clearAllTestDevices(): Promise<string>;
    destroy(): Promise<string>;
}

const { SmartLifeModule } =NativeModules as unknown as {
    SmartLifeModule: SmartLifeModuleInterface;
};

class SmartLifeService {
    private isInitialized: boolean = false;
    private pairingInProgress: boolean = false;
    private pairingTimer: NodeJS.Timeout | null = null;

    private localTestDevices: TuyaDevice[] = [];
    private deviceScenes: Map<string, DeviceScene[]> = new Map();
    private deviceMetrics: Map<string, DeviceMetrics> = new Map();

    async initSDK(appKey: string, secretKey: string): Promise<string> {
        try {
            const result = await SmartLifeModule.initSDK(appKey, secretKey);
            this.isInitialized = true;
            console.log('✅ Smart Life SDK initialized:', result);
            return result;
        } catch (error) {
            console.error('❌ Error initializing Smart Life SDK:', error);
            throw error;
        }
    }

    async registerWithEmail(email: string, password: string, countryCode: string = '593'): Promise<TuyaUser> {
        try {
            console.log('📧 Registering user with email:', email);

            if (!email || !email.trim()) {
                throw new Error('Email es requerido');
            }

            if (!password || password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            const cleanEmail = email.trim().toLowerCase();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanEmail)) {
                throw new Error('Formato de email inválido');
            }

            console.log('🔄 Calling native module for registration...');

            const user = await SmartLifeModule.registerWithEmail(
                cleanEmail,
                password,
                countryCode
            );

            console.log('✅ User registered successfully:', {
                uid: user.uid,
                email: user.email,
                username: user.username
            });

            return user;

        } catch (error) {
            console.error('❌ Error in registerWithEmail:', error);

            const errorMessage = (error as Error).message.toLowerCase();

            if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
                throw new Error('Este email ya está registrado. Intenta con otro email o inicia sesión.');
            }

            if (errorMessage.includes('invalid email') || errorMessage.includes('email format')) {
                throw new Error('El formato del email no es válido.');
            }

            if (errorMessage.includes('weak password') || errorMessage.includes('password too short')) {
                throw new Error('La contraseña es muy débil. Debe tener al menos 8 caracteres con mayúsculas, minúsculas y números.');
            }

            if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                throw new Error('Error de conexión. Verifica tu internet e intenta nuevamente.');
            }

            if (errorMessage.includes('server') || errorMessage.includes('service')) {
                throw new Error('Error del servidor. Intenta más tarde.');
            }

            throw error;
        }
    }

    async loginWithEmail(email: string, password: string, countryCode: string = '593'): Promise<TuyaUser> {
        try {
            console.log('🔑 Logging in with email:', email);

            if (!email || !email.trim()) {
                throw new Error('Email es requerido');
            }

            if (!password) {
                throw new Error('Contraseña es requerida');
            }

            const cleanEmail = email.trim().toLowerCase();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanEmail)) {
                throw new Error('Formato de email inválido');
            }

            console.log('🔄 Calling native module for login...');

            const user = await SmartLifeModule.loginWithEmail(
                countryCode,
                cleanEmail,
                password
            );

            console.log('✅ Login successful:', {
                uid: user.uid,
                email: user.email,
                username: user.username
            });

            return user;

        } catch (error) {
            console.error('❌ Login error:', error);

            const errorMessage = (error as Error).message.toLowerCase();

            if (errorMessage.includes('invalid credentials') ||
                errorMessage.includes('wrong password') ||
                errorMessage.includes('incorrect password')) {
                throw new Error('Email o contraseña incorrectos.');
            }

            if (errorMessage.includes('user not found') ||
                errorMessage.includes('not registered') ||
                errorMessage.includes('no account')) {
                throw new Error('No existe una cuenta con este email. Regístrate primero.');
            }

            if (errorMessage.includes('account locked') ||
                errorMessage.includes('too many attempts')) {
                throw new Error('Cuenta bloqueada por muchos intentos fallidos. Intenta más tarde.');
            }

            if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                throw new Error('Error de conexión. Verifica tu internet e intenta nuevamente.');
            }

            throw error;
        }
    }

    async logout(): Promise<string> {
        try {
            const result = await SmartLifeModule.logout();
            console.log('✅ Logout successful');
            this.clearAllLocalData();
            return result;
        } catch (error) {
            console.error('❌ Logout error:', error);
            throw error;
        }
    }

    async getHomeList(): Promise<TuyaHome[]> {
        try {
            console.log('🏠 Getting home list...');
            const homes = await SmartLifeModule.getHomeList();
            console.log('✅ Home list retrieved:', homes.length, 'homes');
            return homes;
        } catch (error) {
            console.error('❌ Error getting home list:', error);
            throw error;
        }
    }

    async createHome(homeName: string, geoName: string, lat: number, lon: number): Promise<TuyaHome> {
        try {
            console.log('🏠 Creating home:', homeName);
            const home = await SmartLifeModule.createHome(homeName, geoName, lat, lon);
            console.log('✅ Home created successfully:', home.name);
            return home;
        } catch (error) {
            console.error('❌ Error creating home:', error);
            throw error;
        }
    }

    async getDeviceList(homeId: number): Promise<TuyaDevice[]> {
        try {
            console.log('📱 Getting device list for home:', homeId);

            let realDevices: TuyaDevice[] = [];

            try {
                realDevices = await SmartLifeModule.getDeviceList(homeId);
                console.log('📱 Real devices retrieved:', realDevices.length);
            } catch (error) {
                console.warn('⚠️ Error getting real devices, continuing with test devices only:', error);
            }

            const testDevices = this.localTestDevices.filter(device =>
                device.devId.includes('test_') || device.devId.includes('mock_')
            );

            const allDevices = [...realDevices, ...testDevices];

            console.log('📊 Total devices retrieved:', {
                real: realDevices.length,
                test: testDevices.length,
                total: allDevices.length
            });

            return allDevices;
        } catch (error) {
            console.error('❌ Error getting device list:', error);
            return this.localTestDevices;
        }
    }

    async removeDevice(deviceId: string, homeId: number): Promise<string> {
        try {
            console.log('🗑️ Removing device:', deviceId);

            if (this.isTestDevice(deviceId)) {
                const index = this.localTestDevices.findIndex(d => d.devId === deviceId);
                if (index !== -1) {
                    this.localTestDevices.splice(index, 1);
                    console.log('✅ Test device removed locally');
                    return 'Test device removed successfully';
                } else {
                    throw new Error('Test device not found');
                }
            }

            const result = await SmartLifeModule.removeDevice(deviceId, homeId);
            console.log('✅ Device removed successfully');
            return result;
        } catch (error) {
            console.error('❌ Error removing device:', error);
            throw error;
        }
    }

    async validatePairingConditions(
        ssid: string,
        password: string,
        homeId: number = 0,
        timeout: number = 120,
        mode: string = 'AUTO'
    ): Promise<PairingValidationResult> {
        try {
            console.log('🔍 Validating pairing conditions:', {
                ssid: ssid ? ssid.substring(0, 8) + '...' : 'empty',
                passwordLength: password?.length || 0,
                homeId,
                timeout,
                mode
            });

            const result = await SmartLifeModule.validatePairingConditions(
                ssid, password, homeId, timeout, mode
            );

            console.log('✅ Validation result:', {
                canProceed: result.canProceed,
                status: result.status,
                errorsCount: result.errors?.length || 0,
                warningsCount: result.warnings?.length || 0
            });

            return result;
        } catch (error) {
            console.error('❌ Error validating pairing conditions:', error);

            return {
                canProceed: false,
                status: 'error',
                errors: [`Validation error: ${(error as Error).message}`],
                warnings: [],
                ssid: ssid || '',
                homeId: homeId || 0,
                timeout: timeout || 120,
                mode: mode || 'AUTO',
                passwordProvided: !!password,
                validSSID: false,
                validPassword: false,
                validHomeId: false,
                validTimeout: false,
                validMode: false,
                wifiConnected: false,
                locationPermissionGranted: false,
                locationServicesEnabled: false,
                pairingAvailable: false,
                currentSSID: '',
                alreadyOnTargetNetwork: false
            };
        }
    }

    async startDevicePairingEZ(
        homeId: number,
        ssid: string,
        password: string,
        timeout: number = 120
    ): Promise<TuyaDevice> {
        console.log('🔗 Starting ENHANCED EZ device pairing');
        console.log('Parameters:', {
            homeId,
            ssid: ssid.substring(0, 8) + '...',
            passwordLength: password.length,
            timeout
        });

        try {
            const validation = await this.validatePairingConditions(ssid, password, homeId, timeout, 'EZ');

            if (!validation.canProceed) {
                const errorMsg = validation.errors.length > 0
                    ? validation.errors.join('; ')
                    : 'Condiciones de emparejamiento no válidas';
                throw new Error(`EZ Pairing validation failed: ${errorMsg}`);
            }

            if (validation.warnings.length > 0) {
                console.warn('⚠️ EZ Pairing warnings:', validation.warnings);
            }

            console.log('✅ EZ Pairing validation passed, starting real pairing...');
            this.pairingInProgress = true;

            const device = await SmartLifeModule.startDevicePairingEZ(homeId, ssid, password, timeout);

            console.log('🎉 EZ Pairing successful:', {
                deviceId: device.devId,
                deviceName: device.name,
                isOnline: device.isOnline
            });

            this.pairingInProgress = false;
            return device;

        } catch (error) {
            this.pairingInProgress = false;
            console.error('❌ EZ Pairing failed:', error);

            const errorMessage = (error as Error).message;
            let enhancedError = errorMessage;

            if (errorMessage.includes('TIMEOUT') || errorMessage.includes('timeout')) {
                enhancedError = 'EZ Pairing timeout: El dispositivo no respondió. Verifica que esté en modo de emparejamiento y cerca del router.';
            } else if (errorMessage.includes('NETWORK') || errorMessage.includes('network')) {
                enhancedError = 'Error de red EZ: Verifica tu conexión WiFi y que uses una red de 2.4GHz.';
            } else if (errorMessage.includes('PASSWORD') || errorMessage.includes('password')) {
                enhancedError = 'Error de contraseña EZ: Verifica que la contraseña WiFi sea correcta.';
            } else if (errorMessage.includes('DEVICE_NOT_FOUND')) {
                enhancedError = 'Dispositivo no encontrado EZ: Asegúrate de que esté en modo de emparejamiento (LED parpadeando rápido).';
            }

            throw new Error(enhancedError);
        }
    }

    async startDevicePairingAP(
        homeId: number,
        ssid: string,
        password: string,
        timeout: number = 120
    ): Promise<TuyaDevice> {
        console.log('📡 Starting ENHANCED AP device pairing');
        console.log('Parameters:', {
            homeId,
            ssid: ssid.substring(0, 8) + '...',
            passwordLength: password.length,
            timeout
        });

        try {
            const validation = await this.validatePairingConditions(ssid, password, homeId, timeout, 'AP');

            if (!validation.canProceed) {
                const errorMsg = validation.errors.length > 0
                    ? validation.errors.join('; ')
                    : 'Condiciones de emparejamiento no válidas';
                throw new Error(`AP Pairing validation failed: ${errorMsg}`);
            }

            if (validation.warnings.length > 0) {
                console.warn('⚠️ AP Pairing warnings:', validation.warnings);
            }

            console.log('✅ AP Pairing validation passed, starting real pairing...');
            this.pairingInProgress = true;

            const device = await SmartLifeModule.startDevicePairingAP(homeId, ssid, password, timeout);

            console.log('🎉 AP Pairing successful:', {
                deviceId: device.devId,
                deviceName: device.name,
                isOnline: device.isOnline
            });

            this.pairingInProgress = false;
            return device;

        } catch (error) {
            this.pairingInProgress = false;
            console.error('❌ AP Pairing failed:', error);

            const errorMessage = (error as Error).message;
            let enhancedError = errorMessage;

            if (errorMessage.includes('TIMEOUT') || errorMessage.includes('timeout')) {
                enhancedError = 'AP Pairing timeout: El dispositivo no respondió. Verifica que esté en modo AP (LED parpadeando lento).';
            } else if (errorMessage.includes('NETWORK') || errorMessage.includes('network')) {
                enhancedError = 'Error de red AP: No se pudo conectar al punto de acceso del dispositivo. Verifica que esté disponible en la configuración WiFi.';
            } else if (errorMessage.includes('PASSWORD') || errorMessage.includes('password')) {
                enhancedError = 'Error de contraseña AP: Verifica que la contraseña WiFi para tu red principal sea correcta.';
            } else if (errorMessage.includes('DEVICE_NOT_FOUND')) {
                enhancedError = 'Dispositivo no encontrado AP: No se encontró la red del dispositivo. Verifica que esté en modo AP.';
            }

            throw new Error(enhancedError);
        }
    }

    async pairDeviceWithRetries(
        homeId: number,
        ssid: string,
        password: string,
        options: PairingOptions = {}
    ): Promise<PairingResult> {
        const {
            mode = 'AUTO',
            maxRetries = 3,
            timeout = 120,
            autoFallback = true,
            onProgress,
            onValidationWarning
        } = options;

        console.log('🔄 Starting device pairing with enhanced retry logic:', {
            homeId,
            mode,
            maxRetries,
            timeout,
            autoFallback
        });

        const startTime = Date.now();
        let totalAttempts = 0;
        let lastError: Error | null = null;

        try {
            onProgress?.('Validando condiciones de emparejamiento...');
            const validation = await this.validatePairingConditions(ssid, password, homeId, timeout, mode);

            if (!validation.canProceed) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            if (validation.warnings.length > 0) {
                console.warn('⚠️ Pairing warnings:', validation.warnings);

                if (onValidationWarning) {
                    const shouldContinue = onValidationWarning(validation.warnings);
                    if (!shouldContinue) {
                        throw new Error('Pairing cancelled due to validation warnings');
                    }
                }
            }

            const methodsToTry: ('EZ' | 'AP')[] = [];

            if (mode === 'EZ') {
                methodsToTry.push('EZ');
            } else if (mode === 'AP') {
                methodsToTry.push('AP');
            } else {
                methodsToTry.push('EZ');
                if (autoFallback) {
                    methodsToTry.push('AP');
                }
            }

            for (const method of methodsToTry) {
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    totalAttempts++;

                    try {
                        onProgress?.(`Intento ${attempt}/${maxRetries} usando modo ${method}...`);
                        console.log(`🔧 Attempt ${attempt}/${maxRetries} using ${method} mode`);

                        let device: TuyaDevice;

                        if (method === 'EZ') {
                            device = await this.startDevicePairingEZ(homeId, ssid, password, timeout);
                        } else {
                            device = await this.startDevicePairingAP(homeId, ssid, password, timeout);
                        }

                        const duration = Date.now() - startTime;

                        console.log(`🎉 Device paired successfully using ${method} mode after ${totalAttempts} attempt(s) in ${duration}ms`);

                        return {
                            success: true,
                            device,
                            mode: method,
                            attempts: totalAttempts,
                            duration
                        };

                    } catch (error) {
                        lastError = error as Error;
                        console.warn(`❌ ${method} mode attempt ${attempt} failed:`, error);

                        try {
                            await this.stopDevicePairing();
                        } catch (stopError) {
                            console.warn('Warning stopping pairing between retries:', stopError);
                        }

                        if (attempt < maxRetries || method !== methodsToTry[methodsToTry.length - 1]) {
                            onProgress?.(`Reintentando en 3 segundos...`);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        }
                    }
                }
            }

            const duration = Date.now() - startTime;
            const errorMsg = `Device pairing failed after ${totalAttempts} attempts. Last error: ${lastError?.message || 'Unknown error'}`;

            return {
                success: false,
                attempts: totalAttempts,
                duration,
                error: errorMsg
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                attempts: totalAttempts,
                duration,
                error: (error as Error).message
            };
        }
    }

    async smartDevicePairing(
        homeId: number,
        ssid: string,
        password: string,
        options: PairingOptions = {}
    ): Promise<PairingResult> {
        console.log('🤖 Starting SMART device pairing with AI-like logic');

        try {
            const validation = await this.validatePairingConditions(ssid, password, homeId, 120, 'AUTO');

            let recommendedMode: 'EZ' | 'AP' = 'EZ';
            let recommendedTimeout = 120;

            if (validation.debugInfo) {
                const { currentNetwork, targetNetwork, networkType } = validation.debugInfo;

                if (currentNetwork === targetNetwork) {
                    recommendedMode = 'EZ';
                    recommendedTimeout = 90;
                } else if (networkType === '5ghz') {
                    recommendedMode = 'AP';
                    recommendedTimeout = 180;
                } else {
                    recommendedMode = 'EZ';
                }
            }

            console.log('🧠 Smart pairing analysis:', {
                recommendedMode,
                recommendedTimeout,
                networkInfo: validation.debugInfo
            });

            return await this.pairDeviceWithRetries(homeId, ssid, password, {
                ...options,
                mode: recommendedMode,
                timeout: recommendedTimeout,
                maxRetries: 2,
                autoFallback: true
            });

        } catch (error) {
            console.error('❌ Smart pairing failed:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    async runPairingDiagnostics(): Promise<PairingDiagnostics> {
        console.log('🔍 Running comprehensive pairing diagnostics...');

        try {
            const issues: any[] = [];
            const recommendations: string[] = [];
            let score = 100;

            if (!this.getInitializationStatus()) {
                issues.push({
                    type: 'error',
                    message: 'SDK no inicializado',
                    suggestion: 'Inicializa el SDK antes de intentar emparejamiento'
                });
                score -= 30;
            }

            let currentSSID = '';
            try {
                currentSSID = await this.getCurrentWifiSSID();
                if (!currentSSID) {
                    issues.push({
                        type: 'error',
                        message: 'No se detectó conexión WiFi',
                        suggestion: 'Conecta tu dispositivo a una red WiFi'
                    });
                    score -= 25;
                }
            } catch (error) {
                issues.push({
                    type: 'warning',
                    message: 'No se pudo verificar la conexión WiFi',
                    suggestion: 'Verifica los permisos de la aplicación'
                });
                score -= 15;
            }

            if (currentSSID.toLowerCase().includes('5g')) {
                issues.push({
                    type: 'warning',
                    message: 'Red de 5GHz detectada',
                    suggestion: 'Cambia a una red de 2.4GHz para mejor compatibilidad'
                });
                score -= 10;
            }

            if (this.isPairingInProgress()) {
                issues.push({
                    type: 'warning',
                    message: 'Emparejamiento en progreso',
                    suggestion: 'Espera a que termine el emparejamiento actual'
                });
                score -= 5;
            }

            if (score >= 90) {
                recommendations.push('Sistema listo para emparejamiento óptimo');
                recommendations.push('Recomendado: Usar modo EZ para máxima velocidad');
            } else if (score >= 70) {
                recommendations.push('Sistema en buen estado para emparejamiento');
                recommendations.push('Recomendado: Usar modo AUTO para mejor compatibilidad');
            } else if (score >= 50) {
                recommendations.push('Sistema funcional pero con limitaciones');
                recommendations.push('Recomendado: Resolver problemas antes de continuar');
            } else {
                recommendations.push('Sistema requiere configuración antes del emparejamiento');
                recommendations.push('Crítico: Resolver todos los errores listados');
            }

            let overall: 'excellent' | 'good' | 'fair' | 'poor';
            if (score >= 90) overall = 'excellent';
            else if (score >= 70) overall = 'good';
            else if (score >= 50) overall = 'fair';
            else overall = 'poor';

            const result = {
                overall,
                score,
                issues,
                recommendations,
                networkInfo: {
                    currentSSID,
                    detectedType: currentSSID.toLowerCase().includes('5g') ? '5GHz' : '2.4GHz',
                    isConnected: !!currentSSID
                },
                systemInfo: {
                    sdkInitialized: this.getInitializationStatus(),
                    pairingInProgress: this.isPairingInProgress(),
                    deviceCount: this.getDeviceStats().total
                }
            };

            console.log('📊 Diagnostics completed:', {
                overall,
                score,
                issuesCount: issues.length
            });

            return result;

        } catch (error) {
            console.error('❌ Error running diagnostics:', error);
            return {
                overall: 'poor',
                score: 0,
                issues: [{
                    type: 'error',
                    message: 'Error ejecutando diagnósticos',
                    suggestion: 'Reinicia la aplicación e intenta nuevamente'
                }],
                recommendations: ['Reinicia la aplicación', 'Verifica la conexión a internet'],
                networkInfo: {},
                systemInfo: {}
            };
        }
    }

    getPairingInstructions(mode: 'EZ' | 'AP' | 'QR'): {
        title: string;
        steps: string[];
        tips: string[];
        troubleshooting: string[];
    } {
        switch (mode) {
            case 'EZ':
                return {
                    title: 'Instrucciones Modo EZ',
                    steps: [
                        '1. Enciende tu dispositivo y espera que entre en modo de emparejamiento',
                        '2. El LED debe parpadear rápidamente (generalmente azul)',
                        '3. Si no parpadea rápidamente, mantén presionado el botón de reset por 5-10 segundos',
                        '4. Asegúrate de que tu teléfono esté conectado a la red WiFi de 2.4GHz',
                        '5. Toca "Iniciar Emparejamiento EZ" y espera',
                        '6. Mantén el dispositivo cerca del router (menos de 3 metros)'
                    ],
                    tips: [
                        'El modo EZ es más rápido y funciona con la mayoría de dispositivos',
                        'Asegúrate de que la red WiFi sea de 2.4GHz, no 5GHz',
                        'El proceso puede tomar entre 30 segundos y 2 minutos'
                    ],
                    troubleshooting: [
                        'Si falla: Reinicia el dispositivo y vuelve a intentar',
                        'Verifica que la contraseña WiFi sea correcta',
                        'Acerca el dispositivo al router',
                        'Desactiva temporalmente el firewall del router'
                    ]
                };

            case 'AP':
                return {
                    title: 'Instrucciones Modo AP',
                    steps: [
                        '1. Enciende tu dispositivo y ponlo en modo AP',
                        '2. El LED debe parpadear lentamente (generalmente azul)',
                        '3. En la configuración WiFi de tu teléfono, busca una red que comience con "SmartLife" o similar',
                        '4. Conéctate a esa red (puede no tener contraseña)',
                        '5. Regresa a esta aplicación y toca "Iniciar Emparejamiento AP"',
                        '6. El dispositivo se conectará a tu red WiFi principal'
                    ],
                    tips: [
                        'El modo AP es más confiable para dispositivos que no soportan EZ',
                        'Temporalmente te desconectarás de tu WiFi principal',
                        'El proceso puede tomar hasta 3 minutos'
                    ],
                    troubleshooting: [
                        'Si no ves la red del dispositivo: Reinicia el dispositivo',
                        'Si no puedes conectarte: Verifica que el dispositivo esté en modo AP',
                        'Si la app pierde conexión: Reconéctate a la red del dispositivo',
                        'Algunos teléfonos pueden cambiar automáticamente de red'
                    ]
                };

            default:
                return {
                    title: 'Modo Desconocido',
                    steps: [],
                    tips: [],
                    troubleshooting: []
                };
        }
    }

    async stopDevicePairing(): Promise<string> {
        try {
            this.pairingInProgress = false;

            if (SmartLifeModule.stopDevicePairing) {
                const result = await SmartLifeModule.stopDevicePairing();
                console.log('✅ Device pairing stopped');
                return result;
            } else {
                console.log('✅ Device pairing stopped (local)');
                return 'Pairing stopped successfully';
            }
        } catch (error) {
            console.error('❌ Error stopping device pairing:', error);
            this.pairingInProgress = false;
            throw error;
        }
    }

    async getCurrentWifiSSID(): Promise<string> {
        try {
            const ssid = await SmartLifeModule.getCurrentWifiSSID();
            console.log('📶 Current WiFi SSID:', ssid);
            return ssid;
        } catch (error) {
            console.error('❌ Error getting WiFi SSID:', error);
            throw error;
        }
    }

    async addTestDevice(
        homeId: number,
        deviceName: string,
        deviceType: 'switch' | 'light' | 'sensor' | 'plug' | 'fan' | 'thermostat' = 'switch'
    ): Promise<TuyaDevice> {
        try {
            console.log('🧪 Adding test device:', { homeId, deviceName, deviceType });

            const mockDevice = this.createLocalMockDevice(deviceName, deviceType);
            this.localTestDevices.push(mockDevice);

            console.log('✅ Test device created locally:', mockDevice.name);
            return mockDevice;
        } catch (error) {
            console.error('❌ Error adding test device:', error);
            throw error;
        }
    }

    async createPresetTestDevices(homeId: number): Promise<TuyaDevice[]> {
        try {
            console.log('🏭 Creating preset test devices for home:', homeId);

            const presets = [
                {
                    name: 'Luz Sala Principal',
                    type: 'light' as const,
                    initialState: {
                        switch_1: true,
                        bright_value: 200,
                        work_mode: 'white',
                        temp_value: 500
                    }
                },
                {
                    name: 'Switch Cocina',
                    type: 'switch' as const,
                    initialState: {
                        switch_1: true,
                        switch_2: false,
                        switch_3: false
                    }
                },
                {
                    name: 'Sensor Habitación',
                    type: 'sensor' as const,
                    initialState: {
                        temp_current: 24,
                        humidity_value: 42,
                        battery_percentage: 78
                    }
                },
                {
                    name: 'Enchufe TV',
                    type: 'plug' as const,
                    initialState: {
                        switch_1: true,
                        cur_power: 85,
                        cur_voltage: 220
                    }
                }
            ];

            const createdDevices: TuyaDevice[] = [];

            for (const preset of presets) {
                try {
                    const device = await this.createMockDevice(homeId, {
                        name: preset.name,
                        type: preset.type,
                        category: preset.type,
                        online: true,
                        features: this.getFunctionsForType(preset.type),
                        initialState: preset.initialState
                    });

                    createdDevices.push(device);
                    console.log(`✅ Preset device created: ${preset.name}`);

                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`❌ Error creating preset device ${preset.name}:`, error);
                }
            }

            console.log(`🎉 Created ${createdDevices.length} preset devices successfully`);
            return createdDevices;
        } catch (error) {
            console.error('❌ Error creating preset test devices:', error);
            throw error;
        }
    }

    async createMockDevice(homeId: number, config: MockDeviceConfig): Promise<TuyaDevice> {
        try {
            console.log('🏭 Creating mock device:', config.name);

            const mockDevice: TuyaDevice = {
                devId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: config.name,
                iconUrl: this.getIconForDeviceType(config.type),
                isOnline: config.online,
                productId: `mock_product_${config.type}`,
                supportedFunctions: config.features,
                category: config.category,
                productName: `Mock ${config.type}`,
                isLocalOnline: config.online,
                isSub: false,
                isShare: false,
                status: config.initialState || this.getDefaultStateForType(config.type)
            };

            this.localTestDevices.push(mockDevice);
            console.log('✅ Mock device created locally:', mockDevice.name);
            return mockDevice;
        } catch (error) {
            console.error('❌ Error creating mock device:', error);
            throw error;
        }
    }

    async clearAllTestDevices(): Promise<string> {
        try {
            const count = this.localTestDevices.length;
            this.localTestDevices = [];

            this.deviceScenes.clear();
            this.deviceMetrics.clear();

            console.log(`✅ ${count} test devices cleared`);
            return `${count} test devices cleared successfully`;
        } catch (error) {
            console.error('❌ Error clearing test devices:', error);
            throw error;
        }
    }

    private isTestDevice(deviceId: string): boolean {
        return deviceId.startsWith('test_') || deviceId.startsWith('mock_');
    }

    private createLocalMockDevice(name: string, type: string): TuyaDevice {
        const deviceId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const baseDevice: TuyaDevice = {
            devId: deviceId,
            name: name,
            iconUrl: this.getIconForDeviceType(type),
            isOnline: true,
            productId: `test_${type}`,
            supportedFunctions: this.getFunctionsForType(type),
            category: type,
            productName: `Test ${type}`,
            isLocalOnline: true,
            isSub: false,
            isShare: false,
            status: this.getDefaultStateForType(type)
        };

        return baseDevice;
    }

    private getIconForDeviceType(type: string): string {
        const icons: { [key: string]: string } = {
            'switch': 'https://images.tuyacn.com/smart/icon/switch.png',
            'light': 'https://images.tuyacn.com/smart/icon/light.png',
            'sensor': 'https://images.tuyacn.com/smart/icon/sensor.png',
            'plug': 'https://images.tuyacn.com/smart/icon/plug.png',
            'fan': 'https://images.tuyacn.com/smart/icon/fan.png',
            'thermostat': 'https://images.tuyacn.com/smart/icon/thermostat.png'
        };
        return icons[type] || icons['switch'];
    }

    private getFunctionsForType(type: string): string[] {
        const functions: { [key: string]: string[] } = {
            'switch': ['switch_1', 'switch_2', 'switch_3'],
            'light': ['switch_1', 'bright_value', 'temp_value', 'colour_data'],
            'sensor': ['temp_current', 'humidity_value', 'battery_percentage'],
            'plug': ['switch_1', 'cur_power', 'cur_voltage'],
            'fan': ['switch_1', 'fan_speed', 'mode'],
            'thermostat': ['switch_1', 'temp_set', 'temp_current', 'mode']
        };
        return functions[type] || ['switch_1'];
    }

    private getDefaultStateForType(type: string): { [key: string]: any } {
        const states: { [key: string]: { [key: string]: any } } = {
            'switch': {
                'switch_1': false,
                'switch_2': false,
                'switch_3': false
            },
            'light': {
                'switch_1': false,
                'bright_value': 255,
                'temp_value': 500,
                'work_mode': 'white'
            },
            'sensor': {
                'temp_current': 22,
                'humidity_value': 45,
                'battery_percentage': 85
            },
            'plug': {
                'switch_1': false,
                'cur_power': 0,
                'cur_voltage': 220
            },
            'fan': {
                'switch_1': false,
                'fan_speed': 1,
                'mode': 'straight_wind'
            },
            'thermostat': {
                'switch_1': false,
                'temp_set': 23,
                'temp_current': 22,
                'mode': 'auto'
            }
        };
        return states[type] || { 'switch_1': false };
    }

    getInitializationStatus(): boolean {
        return this.isInitialized;
    }

    isPairingInProgress(): boolean {
        return this.pairingInProgress;
    }

    async getCurrentLocation(): Promise<{lat: number, lon: number}> {
        console.log('📍 Using default location: Quito, Ecuador');

        const ecuadorLocations = {
            quito: { lat: -0.1807, lon: -78.4678, name: 'Quito' },
            guayaquil: { lat: -2.1709, lon: -79.9224, name: 'Guayaquil' },
            cuenca: { lat: -2.8963, lon: -79.0058, name: 'Cuenca' },
            ambato: { lat: -1.2544, lon: -78.6267, name: 'Ambato' },
            machala: { lat: -3.2581, lon: -79.9553, name: 'Machala' },
            manta: { lat: -0.9677, lon: -80.7089, name: 'Manta' },
            portoviejo: { lat: -1.0548, lon: -80.4545, name: 'Portoviejo' },
            loja: { lat: -3.9927, lon: -79.2071, name: 'Loja' }
        };

        return Promise.resolve(ecuadorLocations.quito);
    }

    getDeviceStats(): {
        total: number;
        online: number;
        offline: number;
        testDevices: number;
        realDevices: number;
    } {
        const total = this.localTestDevices.length;
        const online = this.localTestDevices.filter(d => d.isOnline).length;
        const offline = total - online;
        const testDevices = this.localTestDevices.length;
        const realDevices = 0;

        return {
            total,
            online,
            offline,
            testDevices,
            realDevices
        };
    }

    clearAllLocalData(): void {
        this.localTestDevices = [];
        this.deviceScenes.clear();
        this.deviceMetrics.clear();
        console.log('🧹 All local data cleared');
    }

}

export default new SmartLifeService();
