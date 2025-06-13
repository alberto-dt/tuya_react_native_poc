import {NativeModules} from 'react-native';

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

    // Device pairing methods (EXISTENTES)
    startDevicePairing(homeId: number, ssid: string, password: string, timeout: number): Promise<TuyaDevice>;
    startDevicePairingEZ(homeId: number, ssid: string, password: string, timeout: number): Promise<TuyaDevice>;
    stopDevicePairing(): Promise<string>;
    getCurrentWifiSSID(): Promise<string>;

    destroy(): void;
}

const { SmartLifeModule } = NativeModules as {
    SmartLifeModule: SmartLifeModuleInterface;
};

class SmartLifeService {
    private isInitialized: boolean = false;
    private pairingInProgress: boolean = false;
    private pairingTimer: NodeJS.Timeout | null = null;

    private localTestDevices: TuyaDevice[] = [];

    async initSDK(appKey: string, secretKey: string): Promise<string> {
        try {
            const result = await SmartLifeModule.initSDK(appKey, secretKey);
            this.isInitialized = true;
            console.log('Smart Life SDK initialized:', result);
            return result;
        } catch (error) {
            console.error('Error initializing Smart Life SDK:', error);
            throw error;
        }
    }


    async loginWithEmail(
        email: string,
        password: string,
        countryCode: string = '593'
    ): Promise<TuyaUser> {
        try {
            const user = await SmartLifeModule.loginWithEmail(countryCode, email, password);
            console.log('Login successful:', user);
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout(): Promise<string> {
        try {
            const result = await SmartLifeModule.logout();
            console.log('Logout successful:', result);
            return result;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    async registerWithEmail(
        email: string,
        password: string,
        countryCode: string = '1'
    ): Promise<TuyaUser> {
        try {
            console.log('Registering with email:', email, 'countryCode:', countryCode);
            const user = await SmartLifeModule.registerWithEmail(email, password, countryCode);
            console.log('Email registration successful:', user);
            return user;
        } catch (error) {
            console.error('Email registration error:', error);
            throw error;
        }
    }

    async createHome(params: CreateHomeParams): Promise<TuyaHome> {
        try {
            console.log('Creating home:', params);

            const home = await SmartLifeModule.createHome(
                params.name,
                params.geoName,
                params.lat || 0,
                params.lon || 0
            );

            console.log('Home created successfully:', home);
            return home;
        } catch (error) {
            console.error('Error creating home:', error);
            throw error;
        }
    }

    async updateHome(params: UpdateHomeParams): Promise<string> {
        try {
            console.log('Updating home:', params);

            const result = await SmartLifeModule.updateHome(
                params.homeId,
                params.name,
                params.geoName,
                params.lat || 0,
                params.lon || 0
            );

            console.log('Home updated successfully');
            return result;
        } catch (error) {
            console.error('Error updating home:', error);
            throw error;
        }
    }

    async deleteHome(homeId: number): Promise<string> {
        try {
            console.log('Deleting home:', homeId);

            const result = await SmartLifeModule.deleteHome(homeId);

            console.log('Home deleted successfully');
            return result;
        } catch (error) {
            console.error('Error deleting home:', error);
            throw error;
        }
    }

    async getCurrentLocation(): Promise<{lat: number, lon: number}> {
        console.log('Using default location: Quito, Ecuador');

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

    async getHomeList(): Promise<TuyaHome[]> {
        try {
            const homes = await SmartLifeModule.getHomeList();
            console.log('Homes retrieved:', homes);
            return homes;
        } catch (error) {
            console.error('Error getting homes:', error);
            throw error;
        }
    }

    async getDeviceList(homeId: number): Promise<TuyaDevice[]> {
        try {
            let realDevices: TuyaDevice[] = [];

            // Intentar obtener dispositivos reales
            try {
                realDevices = await SmartLifeModule.getDeviceList(homeId);
                console.log('Real devices retrieved:', realDevices.length);
            } catch (error) {
                console.warn('Error getting real devices, continuing with test devices only:', error);
            }

            // Obtener dispositivos de prueba locales
            const testDevices = this.localTestDevices.filter(device =>
                device.devId.includes('test_') || device.devId.includes('mock_')
            );

            // Combinar dispositivos reales y de prueba
            const allDevices = [...realDevices, ...testDevices];

            console.log('Total devices retrieved:', {
                real: realDevices.length,
                test: testDevices.length,
                total: allDevices.length
            });

            return allDevices;
        } catch (error) {
            console.error('Error getting device list:', error);
            // En caso de error, devolver solo dispositivos de prueba
            return this.localTestDevices;
        }
    }

    async controlDevice(deviceId: string, commands: DeviceCommand): Promise<string> {
        try {
            console.log('=== CONTROL DEVICE ===');
            console.log('Device ID:', deviceId);
            console.log('Commands:', commands);

            // Verificar si es un dispositivo de prueba
            if (this.isTestDevice(deviceId)) {
                return await this.controlTestDevice(deviceId, commands);
            }

            // Control de dispositivo real (código existente)
            const commandsString = JSON.stringify(commands);
            const result = await SmartLifeModule.controlDevice(deviceId, commandsString);
            console.log('Real device control result:', result);
            return result;
        } catch (error) {
            console.error('Error controlling device:', error);
            throw error;
        }
    }


    async stopDevicePairing(): Promise<string> {
        try {
            const result = await SmartLifeModule.stopDevicePairing();
            console.log('Device pairing stopped:', result);
            this.pairingInProgress = false;

            if (this.pairingTimer) {
                clearTimeout(this.pairingTimer);
                this.pairingTimer = null;
            }

            return result;
        } catch (error) {
            console.error('Error stopping device pairing:', error);
            throw error;
        }
    }

    async addTestDevice(
        homeId: number,
        deviceName: string,
        deviceType: 'switch' | 'light' | 'sensor' | 'plug' | 'fan' | 'thermostat' = 'switch'
    ): Promise<TuyaDevice> {
        try {
            console.log('Agregando dispositivo de prueba:', { homeId, deviceName, deviceType });

            // Crear dispositivo mock localmente
            const mockDevice = this.createLocalMockDevice(deviceName, deviceType);
            this.localTestDevices.push(mockDevice);

            console.log('Dispositivo de prueba creado localmente:', mockDevice);
            return mockDevice;
        } catch (error) {
            console.error('Error agregando dispositivo de prueba:', error);
            throw error;
        }
    }

    async createMockDevice(homeId: number, config: MockDeviceConfig): Promise<TuyaDevice> {
        try {
            console.log('Creando dispositivo mock:', config);

            // Crear dispositivo mock personalizado localmente
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
            console.log('Dispositivo mock creado localmente:', mockDevice);
            return mockDevice;
        } catch (error) {
            console.error('Error creando dispositivo mock:', error);
            throw error;
        }
    }


    private isTestDevice(deviceId: string): boolean {
        return deviceId.startsWith('test_') || deviceId.startsWith('mock_');
    }

    private async controlTestDevice(deviceId: string, commands: DeviceCommand): Promise<string> {
        try {
            console.log('Controlando dispositivo de prueba:', deviceId, commands);

            // Control local de dispositivo de prueba
            const deviceIndex = this.localTestDevices.findIndex(d => d.devId === deviceId);
            if (deviceIndex === -1) {
                throw new Error('Dispositivo de prueba no encontrado');
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

            console.log('Dispositivo de prueba controlado exitosamente');
            return 'Control de dispositivo de prueba exitoso';
        } catch (error) {
            console.error('Error controlando dispositivo de prueba:', error);
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


    async toggleSwitch(deviceId: string, switchNumber: number = 1): Promise<string> {
        return this.controlDevice(deviceId, {
            [`switch_${switchNumber}`]: true
        });
    }

    async setBrightness(deviceId: string, brightness: number): Promise<string> {
        if (brightness < 0 || brightness > 255) {
            throw new Error('Brightness must be between 0 and 255');
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
            colour_data: JSON.stringify(colorData)
        });
    }

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


    isPairingInProgress(): boolean {
        return this.pairingInProgress;
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
                console.log(`Dispositivo preset creado: ${preset.name}`);
            } catch (error) {
                console.error(`Error creando dispositivo preset ${preset.name}:`, error);
            }
        }

        return createdDevices;
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

    async clearTestDevices(): Promise<void> {
        try {
            this.localTestDevices = [];
            console.log('Dispositivos de prueba eliminados');
        } catch (error) {
            console.error('Error limpiando dispositivos de prueba:', error);
            throw error;
        }
    }

    getDeviceById(deviceId: string): TuyaDevice | null {
        return this.localTestDevices.find(device => device.devId === deviceId) || null;
    }

    async removeTestDevice(deviceId: string): Promise<string> {
        try {
            const index = this.localTestDevices.findIndex(device => device.devId === deviceId);
            if (index === -1) {
                throw new Error('Dispositivo de prueba no encontrado');
            }

            this.localTestDevices.splice(index, 1);
            console.log('Dispositivo de prueba eliminado:', deviceId);
            return 'Dispositivo de prueba eliminado exitosamente';
        } catch (error) {
            console.error('Error eliminando dispositivo de prueba:', error);
            throw error;
        }
    }

    getInitializationStatus(): boolean {
        return this.isInitialized;
    }

    async destroy(): Promise<void> {
        try {
            // Limpiar emparejamiento
            if (this.pairingInProgress) {
                await this.stopDevicePairing();
            }

            // Limpiar dispositivos de prueba
            this.localTestDevices = [];

            // Destruir SDK
            SmartLifeModule.destroy();
            this.isInitialized = false;

            console.log('Smart Life SDK destroyed');
        } catch (error) {
            console.error('Error destroying SDK:', error);
            throw error;
        }
    }
}

export default new SmartLifeService();
