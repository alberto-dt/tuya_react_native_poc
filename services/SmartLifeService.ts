import { NativeModules } from 'react-native';

// ======================== INTERFACES PRINCIPALES ========================

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

export interface DeviceSchema {
    id: string;
    mode: string;
    code: string;
    name: string;
    type: string;
    values?: any;
    property?: any;
}

export interface DeviceCommand {
    [key: string]: any;
}

export interface ColorRGB {
    r: number;
    g: number;
    b: number;
}

export interface ColorHSV {
    h: number;
    s: number;
    v: number;
}

export interface CreateHomeParams {
    name: string;
    geoName: string;
    lat?: number;
    lon?: number;
}

export interface UpdateHomeParams {
    homeId: number;
    name: string;
    geoName: string;
    lat?: number;
    lon?: number;
}

export interface MockDeviceConfig {
    name: string;
    type: 'switch' | 'light' | 'sensor' | 'plug' | 'fan' | 'thermostat';
    category: string;
    online: boolean;
    features: string[];
    initialState?: { [key: string]: any };
}

// ======================== INTERFACES PARA ELIMINACIÓN ========================

export interface DeviceDeletionResult {
    success: boolean;
    message: string;
    deviceId: string;
}

export interface MultipleDeviceDeletionResult {
    successful: string[];
    failed: Array<{
        deviceId: string;
        error: string;
    }>;
    totalAttempted: number;
    totalSuccessful: number;
    totalFailed: number;
}

export interface DeviceDeletionStats {
    totalDevices: number;
    testDevices: number;
    realDevices: number;
    canDeleteTest: boolean;
    canDeleteReal: boolean;
}

// ======================== INTERFACES PARA FUNCIONALIDADES AVANZADAS ========================

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
        time: string; // "HH:MM"
        days: string[]; // ["monday", "tuesday", ...]
        enabled: boolean;
        repeat: boolean;
    };
    createdAt: Date;
    lastExecuted?: Date;
}

export interface DeviceMetrics {
    deviceId: string;
    powerConsumption: number; // watts
    dailyUsage: number; // hours
    monthlyUsage: number; // hours
    cost: number; // currency
    efficiency: number; // percentage
    signalStrength: number; // percentage
    lastUpdate: Date;
    recommendations: string[];
}

export interface OptimizationSuggestion {
    type: 'energy' | 'schedule' | 'maintenance' | 'upgrade';
    deviceId: string;
    title: string;
    description: string;
    potentialSavings?: number;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedImpact: 'low' | 'medium' | 'high';
    actionRequired: DeviceCommand;
}

// ======================== INTERFACE DEL MÓDULO NATIVO ========================

interface SmartLifeModuleInterface {
    initSDK(appKey: string, secretKey: string): Promise<string>;
    initSDKWithDataCenter(appKey: string, secretKey: string, endpoint: string): Promise<string>;

    loginWithEmail(countryCode: string, email: string, password: string): Promise<TuyaUser>;
    loginWithPhone(phone: string, password: string, countryCode: string): Promise<TuyaUser>;
    logout(): Promise<string>;

    registerWithEmail(email: string, password: string, countryCode: string): Promise<TuyaUser>;
    registerWithPhone(phone: string, password: string, countryCode: string): Promise<TuyaUser>;
    registerWithEmailVerification(email: string, password: string, verificationCode: string, countryCode: string): Promise<TuyaUser>;
    registerWithPhoneVerification(phone: string, password: string, verificationCode: string, countryCode: string): Promise<TuyaUser>;

    sendEmailVerificationCode(email: string, countryCode: string): Promise<string>;
    sendSMSVerificationCode(phone: string, countryCode: string): Promise<string>;
    verifyEmailCode(email: string, verificationCode: string, countryCode: string): Promise<string>;
    verifySMSCode(phone: string, verificationCode: string, countryCode: string): Promise<string>;

    listAvailableMethods(): Promise<string>;
    testBasicLogging(email: string, password: string): Promise<any>;
    testMultipleServers(email: string, password: string): Promise<any>;

    getHomeList(): Promise<TuyaHome[]>;
    getDeviceList(homeId: number): Promise<TuyaDevice[]>;
    controlDevice(deviceId: string, commands: string): Promise<string>;
    getDeviceSchema(deviceId: string): Promise<DeviceSchema[]>;

    createHome(homeName: string, geoName: string, lat: number, lon: number): Promise<TuyaHome>;
    updateHome(homeId: number, homeName: string, geoName: string, lat: number, lon: number): Promise<string>;
    deleteHome(homeId: number): Promise<string>;

    startDevicePairing(homeId: number, ssid: string, password: string, timeout: number): Promise<TuyaDevice>;
    startDevicePairingEZ(homeId: number, ssid: string, password: string, timeout: number): Promise<TuyaDevice>;
    stopDevicePairing(): Promise<string>;
    getCurrentWifiSSID(): Promise<string>;

    // Métodos de eliminación y testing
    removeDevice(deviceId: string, homeId: number): Promise<string>;
    removeTestDevice(deviceId: string): Promise<string>;
    removeRealDevice(deviceId: string, homeId: number): Promise<string>;
    clearAllTestDevices(): Promise<string>;
    getDeviceDeletionStats(): Promise<DeviceDeletionStats>;
    addTestDevice(homeId: number, deviceName: string, deviceType: string): Promise<TuyaDevice>;

    destroy(): void;
}

const { SmartLifeModule } = NativeModules as {
    SmartLifeModule: SmartLifeModuleInterface;
};

// ======================== SERVICIO PRINCIPAL REFACTORIZADO ========================

class SmartLifeService {
    private isInitialized: boolean = false;
    private pairingInProgress: boolean = false;
    private pairingTimer: NodeJS.Timeout | null = null;

    // Almacenamiento local para funcionalidades avanzadas
    private localTestDevices: TuyaDevice[] = [];
    private deviceScenes: Map<string, DeviceScene[]> = new Map();
    private deviceSchedules: ScheduledAction[] = [];
    private deviceMetrics: Map<string, DeviceMetrics> = new Map();

    // ======================== MÉTODOS BÁSICOS (REFACTORIZADOS) ========================

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

    async initSDKWithDataCenter(appKey: string, secretKey: string, endpoint: string): Promise<string> {
        try {
            const result = await SmartLifeModule.initSDKWithDataCenter(appKey, secretKey, endpoint);
            this.isInitialized = true;
            console.log('✅ Smart Life SDK initialized with data center:', result);
            return result;
        } catch (error) {
            console.error('❌ Error initializing Smart Life SDK with data center:', error);
            throw error;
        }
    }

    async loginWithEmail(email: string, password: string, countryCode: string = '593'): Promise<TuyaUser> {
        try {
            const user = await SmartLifeModule.loginWithEmail(countryCode, email, password);
            console.log('✅ Login successful:', user.username);
            return user;
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    async loginWithPhone(phone: string, password: string, countryCode: string = '593'): Promise<TuyaUser> {
        try {
            const user = await SmartLifeModule.loginWithPhone(phone, password, countryCode);
            console.log('✅ Phone login successful:', user.username);
            return user;
        } catch (error) {
            console.error('❌ Phone login error:', error);
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

    async registerWithEmail(email: string, password: string, countryCode: string = '593'): Promise<TuyaUser> {
        try {
            console.log('📝 Registering with email:', email, 'countryCode:', countryCode);
            const user = await SmartLifeModule.registerWithEmail(email, password, countryCode);
            console.log('✅ Email registration successful:', user.username);
            return user;
        } catch (error) {
            console.error('❌ Email registration error:', error);
            throw error;
        }
    }

    async registerWithPhone(phone: string, password: string, countryCode: string = '593'): Promise<TuyaUser> {
        try {
            console.log('📝 Registering with phone:', phone, 'countryCode:', countryCode);
            const user = await SmartLifeModule.registerWithPhone(phone, password, countryCode);
            console.log('✅ Phone registration successful:', user.username);
            return user;
        } catch (error) {
            console.error('❌ Phone registration error:', error);
            throw error;
        }
    }

    // ======================== GESTIÓN DE HOGARES ========================

    async getHomeList(): Promise<TuyaHome[]> {
        try {
            const homes = await SmartLifeModule.getHomeList();
            console.log('🏠 Homes retrieved:', homes.length);
            return homes;
        } catch (error) {
            console.error('❌ Error getting homes:', error);
            throw error;
        }
    }

    async createHome(params: CreateHomeParams): Promise<TuyaHome> {
        try {
            console.log('🏗️ Creating home:', params.name);
            const home = await SmartLifeModule.createHome(
                params.name,
                params.geoName,
                params.lat || 0,
                params.lon || 0
            );
            console.log('✅ Home created successfully:', home.name);
            return home;
        } catch (error) {
            console.error('❌ Error creating home:', error);
            throw error;
        }
    }

    async updateHome(params: UpdateHomeParams): Promise<string> {
        try {
            console.log('🔄 Updating home:', params.name);
            const result = await SmartLifeModule.updateHome(
                params.homeId,
                params.name,
                params.geoName,
                params.lat || 0,
                params.lon || 0
            );
            console.log('✅ Home updated successfully');
            return result;
        } catch (error) {
            console.error('❌ Error updating home:', error);
            throw error;
        }
    }

    async deleteHome(homeId: number): Promise<string> {
        try {
            console.log('🗑️ Deleting home:', homeId);
            const result = await SmartLifeModule.deleteHome(homeId);
            console.log('✅ Home deleted successfully');
            return result;
        } catch (error) {
            console.error('❌ Error deleting home:', error);
            throw error;
        }
    }

    // ======================== GESTIÓN DE DISPOSITIVOS ========================

    async getDeviceList(homeId: number): Promise<TuyaDevice[]> {
        try {
            console.log('📱 Getting device list for home:', homeId);

            let realDevices: TuyaDevice[] = [];

            // Intentar obtener dispositivos reales
            try {
                realDevices = await SmartLifeModule.getDeviceList(homeId);
                console.log('📱 Real devices retrieved:', realDevices.length);
            } catch (error) {
                console.warn('⚠️ Error getting real devices, continuing with test devices only:', error);
            }

            // Obtener dispositivos de prueba locales
            const testDevices = this.localTestDevices.filter(device =>
                device.devId.includes('test_') || device.devId.includes('mock_')
            );

            // Combinar dispositivos reales y de prueba
            const allDevices = [...realDevices, ...testDevices];

            console.log('📊 Total devices retrieved:', {
                real: realDevices.length,
                test: testDevices.length,
                total: allDevices.length
            });

            return allDevices;
        } catch (error) {
            console.error('❌ Error getting device list:', error);
            // En caso de error, devolver solo dispositivos de prueba
            return this.localTestDevices;
        }
    }

    async controlDevice(deviceId: string, commands: DeviceCommand): Promise<string> {
        try {
            console.log('🎮 === CONTROL DEVICE (ENHANCED) ===');
            console.log('📱 Device ID:', deviceId);
            console.log('⚙️ Commands:', commands);

            // Verificar si es un dispositivo de prueba
            if (this.isTestDevice(deviceId)) {
                return await this.controlTestDevice(deviceId, commands);
            }

            // Control de dispositivo real
            const commandsString = JSON.stringify(commands);
            const result = await SmartLifeModule.controlDevice(deviceId, commandsString);
            console.log('✅ Real device control result:', result);
            return result;
        } catch (error) {
            console.error('❌ Error controlling device:', error);
            throw error;
        }
    }

    async getDeviceSchema(deviceId: string): Promise<DeviceSchema[]> {
        try {
            console.log('📋 Getting device schema for:', deviceId);
            const schema = await SmartLifeModule.getDeviceSchema(deviceId);
            console.log('✅ Device schema retrieved:', schema.length, 'properties');
            return schema;
        } catch (error) {
            console.error('❌ Error getting device schema:', error);
            throw error;
        }
    }

    // ======================== GESTIÓN DE DISPOSITIVOS DE PRUEBA ========================

    async addTestDevice(
        homeId: number,
        deviceName: string,
        deviceType: 'switch' | 'light' | 'sensor' | 'plug' | 'fan' | 'thermostat' = 'switch'
    ): Promise<TuyaDevice> {
        try {
            console.log('🧪 Adding test device:', { homeId, deviceName, deviceType });

            // Crear dispositivo mock localmente
            const mockDevice = this.createLocalMockDevice(deviceName, deviceType);
            this.localTestDevices.push(mockDevice);

            console.log('✅ Test device created locally:', mockDevice.name);
            return mockDevice;
        } catch (error) {
            console.error('❌ Error adding test device:', error);
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

    async createPresetTestDevices(homeId: number): Promise<TuyaDevice[]> {
        const presets = [
            {
                name: 'Luz Sala Principal',
                type: 'light' as const,
                config: {
                    name: 'Luz Sala Principal',
                    type: 'light' as const,
                    category: 'light',
                    online: true,
                    features: ['switch_1', 'bright_value', 'temp_value', 'work_mode'],
                    initialState: { switch_1: true, bright_value: 200, work_mode: 'white' }
                }
            },
            {
                name: 'Switch Cocina',
                type: 'switch' as const,
                config: {
                    name: 'Switch Cocina',
                    type: 'switch' as const,
                    category: 'switch',
                    online: true,
                    features: ['switch_1', 'switch_2', 'switch_3'],
                    initialState: { switch_1: true, switch_2: false, switch_3: false }
                }
            },
            {
                name: 'Sensor Habitación',
                type: 'sensor' as const,
                config: {
                    name: 'Sensor Habitación',
                    type: 'sensor' as const,
                    category: 'sensor',
                    online: true,
                    features: ['temp_current', 'humidity_value', 'battery_percentage'],
                    initialState: { temp_current: 24, humidity_value: 42, battery_percentage: 78 }
                }
            },
            {
                name: 'Enchufe TV',
                type: 'plug' as const,
                config: {
                    name: 'Enchufe TV',
                    type: 'plug' as const,
                    category: 'plug',
                    online: true,
                    features: ['switch_1', 'cur_power', 'cur_voltage'],
                    initialState: { switch_1: true, cur_power: 85, cur_voltage: 220 }
                }
            }
        ];

        const createdDevices: TuyaDevice[] = [];

        for (const preset of presets) {
            try {
                const device = await this.createMockDevice(homeId, preset.config);
                createdDevices.push(device);
                console.log(`✅ Preset device created: ${preset.name}`);
            } catch (error) {
                console.error(`❌ Error creating preset device ${preset.name}:`, error);
            }
        }

        return createdDevices;
    }

    // ======================== ELIMINACIÓN DE DISPOSITIVOS ========================

    async removeDevice(deviceId: string, homeId: number): Promise<string> {
        try {
            console.log('🗑️ === REMOVE DEVICE ===');
            console.log('📱 Device ID:', deviceId);
            console.log('🏠 Home ID:', homeId);

            if (this.isTestDevice(deviceId)) {
                return await this.removeTestDevice(deviceId);
            } else {
                return await this.removeRealDevice(deviceId, homeId);
            }
        } catch (error) {
            console.error('❌ Error removing device:', error);
            throw error;
        }
    }

    async removeTestDevice(deviceId: string): Promise<string> {
        try {
            const index = this.localTestDevices.findIndex(device => device.devId === deviceId);
            if (index === -1) {
                throw new Error('Test device not found');
            }

            const removedDevice = this.localTestDevices.splice(index, 1)[0];

            // Limpiar datos relacionados
            this.deviceScenes.delete(deviceId);
            this.deviceSchedules = this.deviceSchedules.filter(s => s.deviceId !== deviceId);
            this.deviceMetrics.delete(deviceId);

            console.log('✅ Test device removed:', removedDevice.name);
            return 'Test device removed successfully';
        } catch (error) {
            console.error('❌ Error removing test device:', error);
            throw error;
        }
    }

    async removeRealDevice(deviceId: string, homeId: number): Promise<string> {
        try {
            console.log('🗑️ Removing real device:', deviceId, 'from home:', homeId);
            const result = await SmartLifeModule.removeRealDevice(deviceId, homeId);

            // Limpiar datos locales relacionados
            this.deviceScenes.delete(deviceId);
            this.deviceSchedules = this.deviceSchedules.filter(s => s.deviceId !== deviceId);
            this.deviceMetrics.delete(deviceId);

            return result;
        } catch (error) {
            console.error('❌ Error removing real device:', error);
            throw error;
        }
    }

    async removeMultipleTestDevices(deviceIds: string[]): Promise<MultipleDeviceDeletionResult> {
        const successful: string[] = [];
        const failed: { deviceId: string; error: string }[] = [];

        for (const deviceId of deviceIds) {
            try {
                if (this.isTestDevice(deviceId)) {
                    await this.removeTestDevice(deviceId);
                    successful.push(deviceId);
                } else {
                    failed.push({
                        deviceId,
                        error: 'Not a test device'
                    });
                }
            } catch (error) {
                failed.push({
                    deviceId,
                    error: (error as Error).message
                });
            }
        }

        return {
            successful,
            failed,
            totalAttempted: deviceIds.length,
            totalSuccessful: successful.length,
            totalFailed: failed.length
        };
    }

    async clearAllTestDevices(): Promise<string> {
        try {
            const count = this.localTestDevices.length;
            this.localTestDevices = [];

            // Limpiar datos relacionados
            this.deviceScenes.clear();
            this.deviceSchedules = [];
            this.deviceMetrics.clear();

            console.log(`✅ ${count} test devices cleared`);
            return `${count} test devices cleared successfully`;
        } catch (error) {
            console.error('❌ Error clearing test devices:', error);
            throw error;
        }
    }

    getDeviceDeletionStats(): DeviceDeletionStats {
        const testDevices = this.localTestDevices.length;
        const realDevices = 0; // Necesitarías obtener esto de la lista real

        return {
            totalDevices: testDevices + realDevices,
            testDevices,
            realDevices,
            canDeleteTest: testDevices > 0,
            canDeleteReal: false // Por ahora no soportamos eliminar dispositivos reales
        };
    }

    // ======================== EMPAREJAMIENTO DE DISPOSITIVOS ========================

    async startDevicePairing(homeId: number, ssid: string, password: string, timeout: number = 120): Promise<TuyaDevice> {
        try {
            console.log('🔗 Starting device pairing - AP mode');
            console.log('Parameters:', { homeId, ssid, passwordLength: password.length, timeout });

            this.pairingInProgress = true;

            const device = await SmartLifeModule.startDevicePairing(homeId, ssid, password, timeout);

            this.pairingInProgress = false;
            console.log('✅ Device paired successfully (AP mode):', device.name);
            return device;
        } catch (error) {
            this.pairingInProgress = false;
            console.error('❌ Device pairing (AP mode) failed:', error);
            throw error;
        }
    }
    async startDevicePairingEZ(homeId: number, ssid: string, password: string, timeout: number = 120): Promise<TuyaDevice> {
        try {
            console.log('🔗 Starting device pairing - EZ mode');
            console.log('Parameters:', { homeId, ssid, passwordLength: password.length, timeout });

            this.pairingInProgress = true;

            const device = await SmartLifeModule.startDevicePairingEZ(homeId, ssid, password, timeout);

            this.pairingInProgress = false;
            console.log('✅ Device paired successfully (EZ mode):', device.name);
            return device;
        } catch (error) {
            this.pairingInProgress = false;
            console.error('❌ Device pairing (EZ mode) failed:', error);
            throw error;
        }
    }
    async stopDevicePairing(): Promise<string> {
        try {
            const result = await SmartLifeModule.stopDevicePairing();
            this.pairingInProgress = false;

            if (this.pairingTimer) {
                clearTimeout(this.pairingTimer);
                this.pairingTimer = null;
            }

            console.log('✅ Device pairing stopped');
            return result;
        } catch (error) {
            console.error('❌ Error stopping device pairing:', error);
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

    async validatePairingConditions(ssid: string, password: string): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validar SSID
        if (!ssid || ssid.trim().length === 0) {
            errors.push('El SSID no puede estar vacío');
        }

        if (ssid.length > 32) {
            errors.push('El SSID no puede tener más de 32 caracteres');
        }

        // Validar contraseña
        if (!password || password.trim().length === 0) {
            errors.push('La contraseña no puede estar vacía');
        }

        if (password.length < 8) {
            warnings.push('Las contraseñas muy cortas pueden causar problemas');
        }

        if (password.length > 63) {
            errors.push('La contraseña no puede tener más de 63 caracteres');
        }

        // Validar caracteres especiales problemáticos
        const problematicChars = /[<>"/\\|?*]/;
        if (problematicChars.test(ssid)) {
            warnings.push('El SSID contiene caracteres que pueden causar problemas');
        }

        // Verificar si parece ser una red de 5GHz (común si contiene "5G" o "5ghz")
        if (ssid.toLowerCase().includes('5g') || ssid.toLowerCase().includes('5ghz')) {
            warnings.push('Esta parece ser una red de 5GHz. Los dispositivos IoT generalmente requieren 2.4GHz');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    async checkWiFiCompatibility(): Promise<{
        currentSSID: string;
        is24GHz: boolean | null;
        recommendations: string[];
    }> {
        try {
            const currentSSID = await this.getCurrentWifiSSID();
            const recommendations: string[] = [];

            // Heurística simple para detectar frecuencia
            let is24GHz: boolean | null = null;

            const ssidLower = currentSSID.toLowerCase();

            if (ssidLower.includes('5g') || ssidLower.includes('5ghz')) {
                is24GHz = false;
                recommendations.push('Cambia a la red de 2.4GHz para el emparejamiento');
            } else if (ssidLower.includes('2.4') || ssidLower.includes('24ghz')) {
                is24GHz = true;
                recommendations.push('Red de 2.4GHz detectada - compatible');
            } else {
                recommendations.push('Verifica que tu red sea de 2.4GHz para compatibilidad');
            }

            if (!currentSSID) {
                recommendations.push('No se pudo detectar la red WiFi actual');
                recommendations.push('Asegúrate de estar conectado a WiFi');
            }

            return {
                currentSSID,
                is24GHz,
                recommendations
            };
        } catch (error) {
            console.error('Error checking WiFi compatibility:', error);
            return {
                currentSSID: '',
                is24GHz: null,
                recommendations: [
                    'No se pudo verificar la compatibilidad WiFi',
                    'Asegúrate de usar una red de 2.4GHz'
                ]
            };
        }
    }

    async getPairingInstructions(mode: 'EZ' | 'AP'): Promise<{
        title: string;
        steps: string[];
        tips: string[];
        troubleshooting: string[];
    }> {
        if (mode === 'EZ') {
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
        } else {
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
        }
    }


    async pairDeviceWithRetries(
        homeId: number,
        ssid: string,
        password: string,
        options: {
            mode?: 'EZ' | 'AP' | 'AUTO';
            maxRetries?: number;
            timeout?: number;
            autoFallback?: boolean;
        } = {}
    ): Promise<TuyaDevice> {
        const {
            mode = 'AUTO',
            maxRetries = 3,
            timeout = 120,
            autoFallback = true
        } = options;

        console.log('🔄 Starting device pairing with retries:', {
            homeId,
            mode,
            maxRetries,
            timeout,
            autoFallback
        });

        // Validar condiciones
        const validation = await this.validatePairingConditions(ssid, password);
        if (!validation.isValid) {
            throw new Error(`Condiciones de emparejamiento inválidas: ${validation.errors.join(', ')}`);
        }

        let lastError: Error | null = null;
        let attemptedModes: string[] = [];

        // Determinar métodos a intentar
        const methodsToTry: ('EZ' | 'AP')[] = [];

        if (mode === 'EZ') {
            methodsToTry.push('EZ');
        } else if (mode === 'AP') {
            methodsToTry.push('AP');
        } else {
            // AUTO: intentar EZ primero, luego AP si falla
            methodsToTry.push('EZ');
            if (autoFallback) {
                methodsToTry.push('AP');
            }
        }

        for (const method of methodsToTry) {
            for (let retry = 0; retry < maxRetries; retry++) {
                try {
                    console.log(`🔧 Attempt ${retry + 1}/${maxRetries} using ${method} mode`);

                    let result: TuyaDevice;

                    if (method === 'EZ') {
                        result = await this.startDevicePairingEZ(homeId, ssid, password, timeout);
                    } else {
                        result = await this.startDevicePairing(homeId, ssid, password, timeout);
                    }

                    console.log(`✅ Device paired successfully using ${method} mode after ${retry + 1} attempt(s)`);
                    return result;

                } catch (error) {
                    lastError = error as Error;
                    attemptedModes.push(`${method}(${retry + 1})`);

                    console.warn(`❌ ${method} mode attempt ${retry + 1} failed:`, error);

                    // Pequeña pausa entre reintentos
                    if (retry < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
        }

        // Si llegamos aquí, todos los intentos fallaron
        throw new Error(
            `Device pairing failed after ${attemptedModes.length} attempts using modes: ${attemptedModes.join(', ')}. ` +
            `Last error: ${lastError?.message || 'Unknown error'}`
        );
    }


    async pairMultipleDevices(
        homeId: number,
        ssid: string,
        password: string,
        deviceCount: number,
        options: {
            timeout?: number;
            mode?: 'EZ' | 'AP';
            onProgress?: (current: number, total: number, device?: TuyaDevice) => void;
            onDevicePaired?: (device: TuyaDevice, index: number) => void;
        } = {}
    ): Promise<{
        successful: TuyaDevice[];
        failed: Array<{ index: number; error: string }>;
        totalAttempted: number;
    }> {
        const {
            timeout = 120,
            mode = 'EZ',
            onProgress,
            onDevicePaired
        } = options;

        console.log('🔗 Starting multiple device pairing:', {
            homeId,
            deviceCount,
            mode,
            timeout
        });

        const successful: TuyaDevice[] = [];
        const failed: Array<{ index: number; error: string }> = [];

        for (let i = 0; i < deviceCount; i++) {
            try {
                onProgress?.(i + 1, deviceCount);

                console.log(`🔧 Pairing device ${i + 1}/${deviceCount}`);

                let device: TuyaDevice;

                if (mode === 'EZ') {
                    device = await this.startDevicePairingEZ(homeId, ssid, password, timeout);
                } else {
                    device = await this.startDevicePairing(homeId, ssid, password, timeout);
                }

                successful.push(device);
                onDevicePaired?.(device, i);

                console.log(`✅ Device ${i + 1} paired successfully:`, device.name);

                // Pausa entre emparejamientos para evitar conflictos
                if (i < deviceCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

            } catch (error) {
                const errorMessage = (error as Error).message;
                failed.push({ index: i, error: errorMessage });
                console.error(`❌ Device ${i + 1} pairing failed:`, error);
            }
        }

        return {
            successful,
            failed,
            totalAttempted: deviceCount
        };
    }

    getPairingStatus(): {
        isInProgress: boolean;
        startTime?: Date;
        mode?: string;
        deviceCount?: number;
    } {
        return {
            isInProgress: this.pairingInProgress,
            // Podrías agregar más detalles del estado si los mantienes
        };
    }

    async runPairingDiagnostics(): Promise<{
        wifiInfo: any;
        networkCompatibility: any;
        sdkStatus: boolean;
        recommendations: string[];
    }> {
        try {
            const wifiInfo = await this.checkWiFiCompatibility();
            const sdkStatus = this.isInitialized;

            const recommendations: string[] = [];

            if (!sdkStatus) {
                recommendations.push('SDK no inicializado - ejecuta initSDK primero');
            }

            if (!wifiInfo.currentSSID) {
                recommendations.push('No se detectó conexión WiFi');
            }

            if (wifiInfo.is24GHz === false) {
                recommendations.push('Cambia a una red de 2.4GHz para mejor compatibilidad');
            }

            recommendations.push(...wifiInfo.recommendations);

            return {
                wifiInfo,
                networkCompatibility: wifiInfo,
                sdkStatus,
                recommendations
            };
        } catch (error) {
            console.error('Error running pairing diagnostics:', error);
            throw error;
        }
    }

    // ======================== GESTIÓN DE ESCENAS ========================

    async createDeviceScene(deviceId: string, sceneData: {
        name: string;
        actions: DeviceCommand[];
        description?: string;
        icon?: string;
    }): Promise<DeviceScene> {
        try {
            const scene: DeviceScene = {
                id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: sceneData.name,
                deviceId: deviceId,
                actions: sceneData.actions,
                description: sceneData.description,
                icon: sceneData.icon,
                createdAt: new Date(),
                isActive: true
            };

            const deviceScenes = this.deviceScenes.get(deviceId) || [];
            deviceScenes.push(scene);
            this.deviceScenes.set(deviceId, deviceScenes);

            console.log('✅ Device scene created:', scene.name);
            return scene;
        } catch (error) {
            console.error('❌ Error creating device scene:', error);
            throw error;
        }
    }

    async executeDeviceScene(sceneId: string): Promise<string> {
        try {
            console.log('🎬 Executing device scene:', sceneId);

            let targetScene: DeviceScene | null = null;
            let targetDeviceId: string | null = null;

            // Buscar la escena
            for (const [deviceId, scenes] of this.deviceScenes.entries()) {
                const scene = scenes.find(s => s.id === sceneId);
                if (scene) {
                    targetScene = scene;
                    targetDeviceId = deviceId;
                    break;
                }
            }

            if (!targetScene || !targetDeviceId) {
                throw new Error('Scene not found');
            }

            if (!targetScene.isActive) {
                throw new Error('Scene is not active');
            }

            // Ejecutar acciones secuencialmente
            for (const action of targetScene.actions) {
                await this.controlDevice(targetDeviceId, action);
                // Pequeño delay entre acciones
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log('✅ Device scene executed successfully:', targetScene.name);
            return `Scene "${targetScene.name}" executed successfully`;
        } catch (error) {
            console.error('❌ Error executing device scene:', error);
            throw error;
        }
    }

    getDeviceScenes(deviceId: string): DeviceScene[] {
        return this.deviceScenes.get(deviceId) || [];
    }

    async deleteDeviceScene(sceneId: string): Promise<boolean> {
        try {
            for (const [deviceId, scenes] of this.deviceScenes.entries()) {
                const sceneIndex = scenes.findIndex(s => s.id === sceneId);
                if (sceneIndex !== -1) {
                    scenes.splice(sceneIndex, 1);
                    this.deviceScenes.set(deviceId, scenes);
                    console.log('✅ Device scene deleted');
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('❌ Error deleting device scene:', error);
            throw error;
        }
    }

    // ======================== PROGRAMACIÓN TEMPORAL ========================

    async scheduleDeviceAction(schedule: Omit<ScheduledAction, 'id' | 'createdAt'>): Promise<ScheduledAction> {
        try {
            const scheduledAction: ScheduledAction = {
                id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...schedule,
                createdAt: new Date()
            };

            this.deviceSchedules.push(scheduledAction);
            console.log('⏰ Device action scheduled:', scheduledAction.name);
            return scheduledAction;
        } catch (error) {
            console.error('❌ Error scheduling device action:', error);
            throw error;
        }
    }

    getDeviceSchedules(deviceId?: string): ScheduledAction[] {
        if (deviceId) {
            return this.deviceSchedules.filter(s => s.deviceId === deviceId);
        }
        return this.deviceSchedules;
    }

    async executeScheduledAction(scheduleId: string): Promise<string> {
        try {
            const schedule = this.deviceSchedules.find(s => s.id === scheduleId);
            if (!schedule) {
                throw new Error('Scheduled action not found');
            }

            if (!schedule.schedule.enabled) {
                throw new Error('Scheduled action is disabled');
            }

            await this.controlDevice(schedule.deviceId, schedule.commands);

            // Actualizar última ejecución
            schedule.lastExecuted = new Date();

            console.log('✅ Scheduled action executed:', schedule.name);
            return `Scheduled action "${schedule.name}" executed successfully`;
        } catch (error) {
            console.error('❌ Error executing scheduled action:', error);
            throw error;
        }
    }

    async deleteScheduledAction(scheduleId: string): Promise<boolean> {
        try {
            const index = this.deviceSchedules.findIndex(s => s.id === scheduleId);
            if (index !== -1) {
                this.deviceSchedules.splice(index, 1);
                console.log('✅ Scheduled action deleted');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error deleting scheduled action:', error);
            throw error;
        }
    }

    async toggleScheduledAction(scheduleId: string): Promise<boolean> {
        try {
            const schedule = this.deviceSchedules.find(s => s.id === scheduleId);
            if (schedule) {
                schedule.schedule.enabled = !schedule.schedule.enabled;
                console.log('✅ Scheduled action toggled:', schedule.schedule.enabled ? 'enabled' : 'disabled');
                return schedule.schedule.enabled;
            }
            return false;
        } catch (error) {
            console.error('❌ Error toggling scheduled action:', error);
            throw error;
        }
    }

    // ======================== MÉTRICAS Y MONITOREO ========================

    async updateDeviceMetrics(deviceId: string, device: TuyaDevice): Promise<DeviceMetrics> {
        try {
            const currentMetrics = this.deviceMetrics.get(deviceId);
            const now = new Date();

            // Calcular nuevas métricas basadas en el estado del dispositivo
            const powerConsumption = this.calculatePowerConsumption(device);
            const dailyUsage = this.calculateDailyUsage(device, currentMetrics);
            const monthlyUsage = this.calculateMonthlyUsage(currentMetrics, dailyUsage);
            const cost = this.calculateEnergyCost(powerConsumption, dailyUsage);
            const efficiency = this.calculateEfficiency(device, currentMetrics);
            const signalStrength = this.calculateSignalStrength(device);
            const recommendations = this.generateRecommendations(device, currentMetrics);

            const metrics: DeviceMetrics = {
                deviceId,
                powerConsumption,
                dailyUsage,
                monthlyUsage,
                cost,
                efficiency,
                signalStrength,
                lastUpdate: now,
                recommendations
            };

            this.deviceMetrics.set(deviceId, metrics);
            console.log('📊 Device metrics updated for:', device.name);
            return metrics;
        } catch (error) {
            console.error('❌ Error updating device metrics:', error);
            throw error;
        }
    }

    getDeviceMetrics(deviceId: string): DeviceMetrics | null {
        return this.deviceMetrics.get(deviceId) || null;
    }

    getAllDeviceMetrics(): DeviceMetrics[] {
        return Array.from(this.deviceMetrics.values());
    }

    // ======================== OPTIMIZACIÓN INTELIGENTE ========================

    async generateOptimizationSuggestions(deviceId?: string): Promise<OptimizationSuggestion[]> {
        try {
            const suggestions: OptimizationSuggestion[] = [];
            const devicesToAnalyze = deviceId
                ? [this.getDeviceById(deviceId)].filter(Boolean) as TuyaDevice[]
                : this.localTestDevices;

            for (const device of devicesToAnalyze) {
                const metrics = this.getDeviceMetrics(device.devId);
                if (!metrics) continue;

                // Sugerencia de ahorro de energía
                if (metrics.powerConsumption > 100 && metrics.efficiency < 70) {
                    suggestions.push({
                        type: 'energy',
                        deviceId: device.devId,
                        title: 'Reducir consumo energético',
                        description: `${device.name} está consumiendo ${metrics.powerConsumption}W. Considera reducir el brillo o la velocidad.`,
                        potentialSavings: metrics.cost * 0.3,
                        difficulty: 'easy',
                        estimatedImpact: 'high',
                        actionRequired: device.category === 'light'
                            ? { bright_value: Math.floor((device.status?.bright_value || 255) * 0.7) }
                            : { fan_speed: Math.max(1, (device.status?.fan_speed || 1) - 1) }
                    });
                }

                // Sugerencia de programación
                if (metrics.dailyUsage > 12 && this.getDeviceSchedules(device.devId).length === 0) {
                    suggestions.push({
                        type: 'schedule',
                        deviceId: device.devId,
                        title: 'Programar horarios automáticos',
                        description: `${device.name} se usa ${metrics.dailyUsage.toFixed(1)} horas al día. Programa horarios para optimizar el uso.`,
                        difficulty: 'medium',
                        estimatedImpact: 'medium',
                        actionRequired: { switch_1: false } // Apagar automáticamente
                    });
                }

                // Sugerencia de mantenimiento
                if (metrics.signalStrength < 60) {
                    suggestions.push({
                        type: 'maintenance',
                        deviceId: device.devId,
                        title: 'Mejorar conectividad',
                        description: `${device.name} tiene señal débil (${metrics.signalStrength}%). Considera mover el router más cerca.`,
                        difficulty: 'hard',
                        estimatedImpact: 'medium',
                        actionRequired: {} // Acción manual requerida
                    });
                }
            }

            console.log('🤖 Generated', suggestions.length, 'optimization suggestions');
            return suggestions;
        } catch (error) {
            console.error('❌ Error generating optimization suggestions:', error);
            throw error;
        }
    }

    async applyOptimizationSuggestion(suggestionId: string, suggestions: OptimizationSuggestion[]): Promise<string> {
        try {
            const suggestion = suggestions.find(s =>
                s.deviceId + s.type === suggestionId || suggestions.indexOf(s).toString() === suggestionId
            );

            if (!suggestion) {
                throw new Error('Optimization suggestion not found');
            }

            if (Object.keys(suggestion.actionRequired).length > 0) {
                await this.controlDevice(suggestion.deviceId, suggestion.actionRequired);
                console.log('✅ Optimization applied:', suggestion.title);
                return `Optimization "${suggestion.title}" applied successfully`;
            } else {
                console.log('ℹ️ Manual action required for:', suggestion.title);
                return `Manual action required: ${suggestion.description}`;
            }
        } catch (error) {
            console.error('❌ Error applying optimization:', error);
            throw error;
        }
    }

    // ======================== CONTROL AVANZADO ========================

    async executeMultipleCommands(deviceId: string, commands: DeviceCommand[], delay: number = 1000): Promise<string> {
        try {
            console.log('🎯 Executing multiple commands for device:', deviceId);

            for (let i = 0; i < commands.length; i++) {
                const command = commands[i];
                console.log(`⚙️ Executing command ${i + 1}/${commands.length}:`, command);

                await this.controlDevice(deviceId, command);

                // Delay entre comandos (excepto el último)
                if (i < commands.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            console.log('✅ All commands executed successfully');
            return `Successfully executed ${commands.length} commands`;
        } catch (error) {
            console.error('❌ Error executing multiple commands:', error);
            throw error;
        }
    }

    async adaptiveBrightness(deviceId: string, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): Promise<string> {
        try {
            const brightnessMap = {
                morning: 800,    // 80% brillo para la mañana
                afternoon: 1000, // 100% brillo para la tarde
                evening: 600,    // 60% brillo para la noche
                night: 200       // 20% brillo para la noche
            };

            const brightness = brightnessMap[timeOfDay];
            await this.controlDevice(deviceId, {
                bright_value: brightness,
                switch_1: true
            });

            console.log('✅ Adaptive brightness applied:', timeOfDay, brightness);
            return `Brightness adjusted for ${timeOfDay} (${brightness}/1000)`;
        } catch (error) {
            console.error('❌ Error applying adaptive brightness:', error);
            throw error;
        }
    }

    async energySavingMode(deviceId: string, enable: boolean): Promise<string> {
        try {
            const device = this.getDeviceById(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }

            const commands: DeviceCommand = {};

            if (enable) {
                // Aplicar configuraciones de ahorro de energía según el tipo de dispositivo
                switch (device.category) {
                    case 'light':
                        commands.bright_value = 300; // Reducir brillo
                        commands.temp_value = 600;   // Luz más cálida
                        break;
                    case 'fan':
                        commands.fan_speed = 1;      // Velocidad mínima
                        commands.mode = 'sleep_wind'; // Modo silencioso
                        break;
                    case 'thermostat':
                        const currentTemp = device.status?.temp_set || 22;
                        commands.temp_set = currentTemp - 2; // Reducir 2 grados
                        break;
                }
            } else {
                // Restaurar configuraciones normales
                switch (device.category) {
                    case 'light':
                        commands.bright_value = 800;
                        commands.temp_value = 500;
                        break;
                    case 'fan':
                        commands.fan_speed = 3;
                        commands.mode = 'natural_wind';
                        break;
                    case 'thermostat':
                        const currentTemp = device.status?.temp_set || 22;
                        commands.temp_set = currentTemp + 2;
                        break;
                }
            }

            if (Object.keys(commands).length > 0) {
                await this.controlDevice(deviceId, commands);
            }

            console.log('✅ Energy saving mode:', enable ? 'enabled' : 'disabled');
            return `Energy saving mode ${enable ? 'enabled' : 'disabled'} for ${device.name}`;
        } catch (error) {
            console.error('❌ Error toggling energy saving mode:', error);
            throw error;
        }
    }

    // ======================== MÉTODOS DE UTILIDAD (REFACTORIZADOS) ========================

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

    getAvailableLocations(): Array<{lat: number, lon: number, name: string}> {
        return [
            { lat: -0.1807, lon: -78.4678, name: 'Quito' },
            { lat: -2.1709, lon: -79.9224, name: 'Guayaquil' },
            { lat: -2.8963, lon: -79.0058, name: 'Cuenca' },
            { lat: -1.2544, lon: -78.6267, name: 'Ambato' },
            { lat: -3.2581, lon: -79.9553, name: 'Machala' },
            { lat: -0.9677, lon: -80.7089, name: 'Manta' },
            { lat: -1.0548, lon: -80.4545, name: 'Portoviejo' },
            { lat: -3.9927, lon: -79.2071, name: 'Loja' }
        ];
    }

    async getLocationByName(cityName: string): Promise<{lat: number, lon: number}> {
        const locations = this.getAvailableLocations();
        const location = locations.find(loc =>
            loc.name.toLowerCase() === cityName.toLowerCase()
        );

        return location || { lat: -0.1807, lon: -78.4678 };
    }

    async toggleSwitch(deviceId: string, switchNumber: number = 1): Promise<string> {
        const device = this.getDeviceById(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }

        const switchKey = `switch_${switchNumber}`;
        const currentState = device.status?.[switchKey] || false;

        return this.controlDevice(deviceId, {
            [switchKey]: !currentState
        });
    }

    async setBrightness(deviceId: string, brightness: number): Promise<string> {
        if (brightness < 0 || brightness > 1000) {
            throw new Error('Brightness must be between 0 and 1000');
        }
        return this.controlDevice(deviceId, {
            bright_value: brightness
        });
    }

    async setColorTemperature(deviceId: string, temperature: number): Promise<string> {
        if (temperature < 0 || temperature > 1000) {
            throw new Error('Color temperature must be between 0 and 1000');
        }
        return this.controlDevice(deviceId, {
            temp_value: temperature
        });
    }

    async setRGBColor(deviceId: string, hexColor: string): Promise<string> {
        const rgb = this.hexToRgb(hexColor);
        if (!rgb) {
            throw new Error('Invalid hex color format');
        }

        const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);

        const colorData = {
            h: Math.round(hsv.h),
            s: Math.round(hsv.s * 10),
            v: Math.round(hsv.v * 10)
        };

        return this.controlDevice(deviceId, {
            colour_data: JSON.stringify(colorData),
            work_mode: 'colour'
        });
    }

    // ======================== MÉTODOS DE GESTIÓN DE DATOS ========================

    clearAllLocalData(): void {
        this.localTestDevices = [];
        this.deviceScenes.clear();
        this.deviceSchedules = [];
        this.deviceMetrics.clear();
        console.log('🧹 All local data cleared');
    }

    exportAllData(): {
        devices: TuyaDevice[];
        scenes: { [deviceId: string]: DeviceScene[] };
        schedules: ScheduledAction[];
        metrics: { [deviceId: string]: DeviceMetrics };
    } {
        const scenesObj: { [deviceId: string]: DeviceScene[] } = {};
        this.deviceScenes.forEach((scenes, deviceId) => {
            scenesObj[deviceId] = scenes;
        });

        const metricsObj: { [deviceId: string]: DeviceMetrics } = {};
        this.deviceMetrics.forEach((metrics, deviceId) => {
            metricsObj[deviceId] = metrics;
        });

        return {
            devices: this.localTestDevices,
            scenes: scenesObj,
            schedules: this.deviceSchedules,
            metrics: metricsObj
        };
    }

    importDeviceData(deviceId: string, data: {
        scenes?: DeviceScene[];
        schedules?: ScheduledAction[];
        metrics?: DeviceMetrics;
    }): void {
        if (data.scenes) {
            this.deviceScenes.set(deviceId, data.scenes);
        }

        if (data.schedules) {
            const deviceSchedules = data.schedules.filter(s => s.deviceId === deviceId);
            this.deviceSchedules.push(...deviceSchedules);
        }

        if (data.metrics) {
            this.deviceMetrics.set(deviceId, data.metrics);
        }
    }

    // ======================== MÉTODOS DE VERIFICACIÓN ========================

    async sendEmailVerificationCode(email: string, countryCode: string = '593'): Promise<string> {
        try {
            const result = await SmartLifeModule.sendEmailVerificationCode(email, countryCode);
            console.log('📧 Email verification code sent to:', email);
            return result;
        } catch (error) {
            console.error('❌ Error sending email verification code:', error);
            throw error;
        }
    }

    async sendSMSVerificationCode(phone: string, countryCode: string = '593'): Promise<string> {
        try {
            const result = await SmartLifeModule.sendSMSVerificationCode(phone, countryCode);
            console.log('📱 SMS verification code sent to:', phone);
            return result;
        } catch (error) {
            console.error('❌ Error sending SMS verification code:', error);
            throw error;
        }
    }

    async verifyEmailCode(email: string, verificationCode: string, countryCode: string = '593'): Promise<string> {
        try {
            const result = await SmartLifeModule.verifyEmailCode(email, verificationCode, countryCode);
            console.log('✅ Email verification code verified');
            return result;
        } catch (error) {
            console.error('❌ Error verifying email code:', error);
            throw error;
        }
    }

    async verifySMSCode(phone: string, verificationCode: string, countryCode: string = '593'): Promise<string> {
        try {
            const result = await SmartLifeModule.verifySMSCode(phone, verificationCode, countryCode);
            console.log('✅ SMS verification code verified');
            return result;
        } catch (error) {
            console.error('❌ Error verifying SMS code:', error);
            throw error;
        }
    }

    async registerWithEmailVerification(email: string, password: string, verificationCode: string, countryCode: string = '593'): Promise<TuyaUser> {
        try {
            const user = await SmartLifeModule.registerWithEmailVerification(email, password, verificationCode, countryCode);
            console.log('✅ Email verification registration successful:', user.username);
            return user;
        } catch (error) {
            console.error('❌ Email verification registration error:', error);
            throw error;
        }
    }

    async registerWithPhoneVerification(phone: string, password: string, verificationCode: string, countryCode: string = '593'): Promise<TuyaUser> {
        try {
            const user = await SmartLifeModule.registerWithPhoneVerification(phone, password, verificationCode, countryCode);
            console.log('✅ Phone verification registration successful:', user.username);
            return user;
        } catch (error) {
            console.error('❌ Phone verification registration error:', error);
            throw error;
        }
    }

    // ======================== MÉTODOS DE TESTING Y DEBUG ========================

    async listAvailableMethods(): Promise<string> {
        try {
            const methods = await SmartLifeModule.listAvailableMethods();
            console.log('📋 Available methods listed');
            return methods;
        } catch (error) {
            console.error('❌ Error listing available methods:', error);
            throw error;
        }
    }

    async testBasicLogging(email: string, password: string): Promise<any> {
        try {
            const result = await SmartLifeModule.testBasicLogging(email, password);
            console.log('🧪 Basic logging test completed');
            return result;
        } catch (error) {
            console.error('❌ Error in basic logging test:', error);
            throw error;
        }
    }

    async testMultipleServers(email: string, password: string): Promise<any> {
        try {
            const result = await SmartLifeModule.testMultipleServers(email, password);
            console.log('🌐 Multiple servers test completed');
            return result;
        } catch (error) {
            console.error('❌ Error in multiple servers test:', error);
            throw error;
        }
    }

    // ======================== MÉTODOS PRIVADOS AUXILIARES ========================

    private isTestDevice(deviceId: string): boolean {
        return deviceId.startsWith('test_') || deviceId.startsWith('mock_');
    }

    private async controlTestDevice(deviceId: string, commands: DeviceCommand): Promise<string> {
        try {
            console.log('🧪 Controlling test device:', deviceId, commands);

            const deviceIndex = this.localTestDevices.findIndex(d => d.devId === deviceId);
            if (deviceIndex === -1) {
                throw new Error('Test device not found');
            }

            const device = this.localTestDevices[deviceIndex];
            const newStatus = { ...device.status, ...commands };

            // Aplicar efectos secundarios realistas
            this.applyStateEffects(newStatus, commands, device.category || 'switch');

            // Actualizar dispositivo
            this.localTestDevices[deviceIndex] = {
                ...device,
                status: newStatus
            };

            console.log('✅ Test device controlled successfully');
            return 'Test device control successful';
        } catch (error) {
            console.error('❌ Error controlling test device:', error);
            throw error;
        }
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

    private applyStateEffects(
        status: { [key: string]: any },
        commands: DeviceCommand,
        deviceType: string
    ): void {
        Object.entries(commands).forEach(([key, value]) => {
            switch (deviceType) {
                case 'plug':
                    if (key === 'switch_1') {
                        if (!value) {
                            status.cur_power = 0;
                            status.cur_current = 0;
                        } else {
                            status.cur_power = Math.floor(Math.random() * 500) + 50;
                            status.cur_current = status.cur_power / (status.cur_voltage || 220);
                        }
                    }
                    break;

                case 'light':
                    if (key === 'work_mode') {
                        if (value === 'colour') {
                            status.temp_value = 0;
                        }
                    }
                    break;

                case 'fan':
                    if (key === 'switch_1' && !value) {
                        status.oscillation = false;
                    }
                    if (key === 'mode' && value === 'sleep_wind') {
                        status.fan_speed = Math.min(status.fan_speed || 1, 2);
                    }
                    break;

                case 'thermostat':
                    if (key === 'temp_set') {
                        const tempDiff = value - (status.temp_current || 20);
                        status.temp_current = status.temp_current + (tempDiff * 0.1);
                    }
                    break;

                case 'sensor':
                    if (key === 'temp_current') {
                        const tempChange = value - (status.temp_current || 20);
                        status.humidity_value = Math.max(0, Math.min(100,
                            (status.humidity_value || 50) - (tempChange * 2)
                        ));
                    }
                    break;
            }
        });
    }

    private calculatePowerConsumption(device: TuyaDevice): number {
        if (!device.isOnline || !device.status?.switch_1) return 0;

        const baseConsumption: { [key: string]: number } = {
            'light': 15,
            'fan': 75,
            'plug': device.status?.cur_power || 85,
            'thermostat': 150,
            'switch': 5,
            'sensor': 2
        };

        return baseConsumption[device.category || 'switch'] || 10;
    }

    private calculateDailyUsage(device: TuyaDevice, currentMetrics?: DeviceMetrics): number {
        const isOn = device.status?.switch_1 || false;
        const currentUsage = currentMetrics?.dailyUsage || 0;

        // Simular incremento de uso diario
        return isOn ? currentUsage + 0.1 : currentUsage;
    }

    private calculateMonthlyUsage(currentMetrics?: DeviceMetrics, dailyUsage: number = 0): number {
        return (currentMetrics?.monthlyUsage || 0) + (dailyUsage / 30);
    }

    private calculateEnergyCost(powerConsumption: number, dailyUsage: number): number {
        const costPerKWh = 0.12; // $0.12 por kWh (ajustable según la región)
        const dailyKWh = (powerConsumption * dailyUsage) / 1000;
        return dailyKWh * costPerKWh * 30; // Costo mensual
    }

    private calculateEfficiency(device: TuyaDevice, currentMetrics?: DeviceMetrics): number {
        const baseEfficiency = 85;
        const signalPenalty = device.isOnline ? 0 : 20;
        const usagePenalty = (currentMetrics?.dailyUsage || 0) > 12 ? 10 : 0;

        return Math.max(0, Math.min(100, baseEfficiency - signalPenalty - usagePenalty));
    }

    private calculateSignalStrength(device: TuyaDevice): number {
        if (!device.isOnline) return 0;

        // Simular fuerza de señal basada en el estado del dispositivo
        const baseStrength = device.isLocalOnline ? 85 : 65;
        const randomVariation = Math.floor(Math.random() * 20) - 10;

        return Math.max(0, Math.min(100, baseStrength + randomVariation));
    }

    private generateRecommendations(device: TuyaDevice, currentMetrics?: DeviceMetrics): string[] {
        const recommendations: string[] = [];

        if (!device.isOnline) {
            recommendations.push('Verificar conexión del dispositivo');
        }

        if (currentMetrics?.powerConsumption && currentMetrics.powerConsumption > 100) {
            recommendations.push('Reducir consumo energético durante horas pico');
        }

        if (currentMetrics?.dailyUsage && currentMetrics.dailyUsage > 12) {
            recommendations.push('Programar horarios automáticos para optimizar uso');
        }

        if (currentMetrics?.signalStrength && currentMetrics.signalStrength < 60) {
            recommendations.push('Mejorar ubicación del router WiFi');
        }

        return recommendations;
    }

    // ======================== MÉTODOS DE CONVERSIÓN DE COLOR ========================

    hexToRgb(hex: string): ColorRGB | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHsv(r: number, g: number, b: number): ColorHSV {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;

        let h = 0;
        const s = max === 0 ? 0 : diff / max;
        const v = max;

        if (diff !== 0) {
            switch (max) {
                case r:
                    h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / diff + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / diff + 4) / 6;
                    break;
            }
        }

        return {
            h: h * 360,
            s: s,
            v: v
        };
    }

    // ======================== MÉTODOS DE CONTROL PREDEFINIDOS ========================

    async applyPresetBrightness(deviceId: string, level: 'low' | 'medium' | 'high' | 'max'): Promise<string> {
        const brightnessMap = {
            low: 100,
            medium: 500,
            high: 800,
            max: 1000
        };

        const brightness = brightnessMap[level];
        await this.controlDevice(deviceId, { bright_value: brightness });
        return `Brightness adjusted to ${level} level (${brightness})`;
    }

    async applyPresetFanSpeed(deviceId: string, speed: 'silent' | 'low' | 'medium' | 'high' | 'max'): Promise<string> {
        const speedMap = {
            silent: 1,
            low: 2,
            medium: 3,
            high: 4,
            max: 5
        };

        const fanSpeed = speedMap[speed];
        const commands = [
            { fan_speed: fanSpeed },
            speed === 'silent' ? { mode: 'sleep_wind' } : { mode: 'natural_wind' }
        ];

        await this.executeMultipleCommands(deviceId, commands);
        return `Fan speed adjusted to ${speed} (${fanSpeed})`;
    }

    async applyPresetTemperature(deviceId: string, preset: 'cold' | 'comfortable' | 'warm' | 'eco'): Promise<string> {
        const tempMap = {
            cold: 18,
            comfortable: 22,
            warm: 26,
            eco: 20
        };

        const temperature = tempMap[preset];
        await this.controlDevice(deviceId, { temp_set: temperature });
        return `Temperature adjusted to ${preset} (${temperature}°C)`;
    }

    // ======================== MÉTODOS DE VALIDACIÓN ========================

    validateDeviceCommand(device: TuyaDevice, command: DeviceCommand): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Verificar si el dispositivo está en línea
        if (!device.isOnline) {
            errors.push('Device is offline');
        }

        // Verificar funciones soportadas
        Object.keys(command).forEach(key => {
            if (!device.supportedFunctions?.includes(key)) {
                errors.push(`Function '${key}' not supported by device`);
            }
        });

        // Validaciones específicas por tipo de comando
        Object.entries(command).forEach(([key, value]) => {
            switch (key) {
                case 'bright_value':
                    if (typeof value !== 'number' || value < 0 || value > 1000) {
                        errors.push('bright_value must be between 0 and 1000');
                    } else if (value < 50) {
                        warnings.push('Very low brightness, may be hard to see');
                    }
                    break;

                case 'temp_value':
                    if (typeof value !== 'number' || value < 0 || value > 1000) {
                        errors.push('temp_value must be between 0 and 1000');
                    }
                    break;

                case 'fan_speed':
                    if (typeof value !== 'number' || value < 1 || value > 5) {
                        errors.push('fan_speed must be between 1 and 5');
                    }
                    break;

                case 'temp_set':
                    if (typeof value !== 'number' || value < 16 || value > 30) {
                        errors.push('temp_set must be between 16 and 30°C');
                    }
                    break;

                case 'cur_voltage':
                    if (typeof value !== 'number' || value < 110 || value > 240) {
                        errors.push('cur_voltage must be between 110 and 240V');
                    }
                    break;
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    // ======================== MÉTODOS DE SIMULACIÓN AVANZADA ========================

    simulateDeviceResponse(deviceId: string, command: DeviceCommand): {
        success: boolean;
        response: string;
        newState: { [key: string]: any };
    } {
        const device = this.getDeviceById(deviceId);
        if (!device) {
            return {
                success: false,
                response: 'Device not found',
                newState: {}
            };
        }

        const validation = this.validateDeviceCommand(device, command);
        if (!validation.valid) {
            return {
                success: false,
                response: validation.errors.join(', '),
                newState: device.status || {}
            };
        }

        // Simular el nuevo estado
        const newState = { ...device.status, ...command };
        this.applyStateEffects(newState, command, device.category || 'switch');

        return {
            success: true,
            response: 'Command executed successfully',
            newState
        };
    }

    // ======================== MÉTODOS DE HISTÓRICO Y ANÁLISIS ========================

    getDeviceHistory(deviceId: string, hours: number = 24): Array<{
        timestamp: Date;
        action: string;
        command: DeviceCommand;
        success: boolean;
    }> {
        // En una implementación real, almacenarías el histórico
        return [
            {
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                action: 'Manual control',
                command: { switch_1: true },
                success: true
            },
            {
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
                action: 'Adaptive brightness',
                command: { bright_value: 300 },
                success: true
            }
        ];
    }

    getUsageAnalytics(deviceId: string): {
        dailyUsage: number;
        peakHours: string[];
        mostUsedFunctions: string[];
        efficiencyScore: number;
    } {
        const device = this.getDeviceById(deviceId);
        const metrics = this.getDeviceMetrics(deviceId);

        return {
            dailyUsage: metrics?.dailyUsage || 0,
            peakHours: ['18:00-20:00', '06:00-08:00'],
            mostUsedFunctions: device?.supportedFunctions?.slice(0, 3) || [],
            efficiencyScore: Math.floor(Math.random() * 40) + 60
        };
    }

    // ======================== MÉTODOS DE BACKUP Y RECUPERACIÓN ========================

    createBackup(): string {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            data: this.exportAllData()
        };

        return JSON.stringify(backupData, null, 2);
    }

    restoreFromBackup(backupString: string): boolean {
        try {
            const backup = JSON.parse(backupString);

            if (!backup.data) {
                throw new Error('Invalid backup format');
            }

            // Restaurar dispositivos
            if (backup.data.devices) {
                this.localTestDevices = backup.data.devices;
            }

            // Restaurar escenas
            if (backup.data.scenes) {
                this.deviceScenes.clear();
                Object.entries(backup.data.scenes).forEach(([deviceId, scenes]) => {
                    this.deviceScenes.set(deviceId, scenes as DeviceScene[]);
                });
            }

            // Restaurar programaciones
            if (backup.data.schedules) {
                this.deviceSchedules = backup.data.schedules;
            }

            // Restaurar métricas
            if (backup.data.metrics) {
                this.deviceMetrics.clear();
                Object.entries(backup.data.metrics).forEach(([deviceId, metrics]) => {
                    this.deviceMetrics.set(deviceId, metrics as DeviceMetrics);
                });
            }

            console.log('✅ Backup restored successfully');
            return true;
        } catch (error) {
            console.error('❌ Error restoring backup:', error);
            return false;
        }
    }

    // ======================== MÉTODOS DE ESTADÍSTICAS Y ESTADO ========================

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

    getDeviceById(deviceId: string): TuyaDevice | null {
        return this.localTestDevices.find(device => device.devId === deviceId) || null;
    }

    getInitializationStatus(): boolean {
        return this.isInitialized;
    }

    isPairingInProgress(): boolean {
        return this.pairingInProgress;
    }

    getServiceConfiguration(): {
        isInitialized: boolean;
        deviceCount: number;
        scenesCount: number;
        schedulesCount: number;
        metricsCount: number;
        version: string;
    } {
        return {
            isInitialized: this.isInitialized,
            deviceCount: this.localTestDevices.length,
            scenesCount: Array.from(this.deviceScenes.values()).reduce((sum, scenes) => sum + scenes.length, 0),
            schedulesCount: this.deviceSchedules.length,
            metricsCount: this.deviceMetrics.size,
            version: '2.0.0'
        };
    }

    // ======================== MÉTODOS DE DEBUG ========================

    getDebugInfo(): {
        service: any;
        devices: any[];
        scenes: any;
        schedules: any[];
        metrics: any;
    } {
        return {
            service: {
                isInitialized: this.isInitialized,
                pairingInProgress: this.pairingInProgress,
                version: '2.0.0'
            },
            devices: this.localTestDevices.map(d => ({
                id: d.devId,
                name: d.name,
                type: d.category,
                online: d.isOnline,
                functions: d.supportedFunctions?.length || 0
            })),
            scenes: Object.fromEntries(this.deviceScenes),
            schedules: this.deviceSchedules,
            metrics: Object.fromEntries(this.deviceMetrics)
        };
    }

    async runDiagnostics(): Promise<{
        sdk: boolean;
        devices: boolean;
        scenes: boolean;
        schedules: boolean;
        metrics: boolean;
        overall: boolean;
    }> {
        const results = {
            sdk: this.isInitialized,
            devices: this.localTestDevices.length >= 0,
            scenes: this.deviceScenes.size >= 0,
            schedules: this.deviceSchedules.length >= 0,
            metrics: this.deviceMetrics.size >= 0,
            overall: false
        };

        results.overall = Object.values(results).every(Boolean);

        console.log('🔍 SmartLifeService diagnostics:', results);
        return results;
    }

    // ======================== CLEANUP Y DESTRUCCIÓN ========================

    async destroy(): Promise<void> {
        try {
            console.log('🧹 Starting SmartLifeService destruction...');

            // Limpiar emparejamiento
            if (this.pairingInProgress) {
                await this.stopDevicePairing();
                console.log('✅ Pairing stopped');
            }

            // Limpiar todos los datos locales
            this.clearAllLocalData();
            console.log('✅ Local data cleared');

            // Destruir SDK nativo
            try {
                SmartLifeModule.destroy();
                console.log('✅ Native SDK destroyed');
            } catch (error) {
                console.warn('⚠️ Error destroying native SDK:', error);
            }

            // Resetear estado
            this.isInitialized = false;
            this.pairingInProgress = false;

            if (this.pairingTimer) {
                clearTimeout(this.pairingTimer);
                this.pairingTimer = null;
            }

            console.log('🎉 SmartLifeService destroyed successfully');
        } catch (error) {
            console.error('❌ Error destroying SmartLifeService:', error);
            throw error;
        }
    }
}

// ======================== EXPORTACIÓN DEL SERVICIO ========================

export default new SmartLifeService();
