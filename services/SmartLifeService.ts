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

export interface DeviceStatus {
    switch_1?: boolean;
    switch_2?: boolean;
    switch_3?: boolean;

    bright_value?: number;
    temp_value?: number;
    colour_data?: string;
    work_mode?: string;

    temp_current?: number;
    humidity_value?: number;
    battery_percentage?: number;

    cur_power?: number;
    cur_voltage?: number;
    cur_current?: number;

    [key: string]: any;
}

export interface SwitchCommand {
    switch_1?: boolean;
    switch_2?: boolean;
    switch_3?: boolean;
}

export interface LightCommand {
    switch_1?: boolean;
    bright_value?: number;
    temp_value?: number;
    colour_data?: string;
    work_mode?: 'white' | 'colour' | 'scene' | 'music';
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

    // Device pairing methods
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

    async initSDKWithDataCenter(appKey: string, secretKey: string, endpoint: string): Promise<string> {
        try {
            const result = await SmartLifeModule.initSDKWithDataCenter(appKey, secretKey, endpoint);
            this.isInitialized = true;
            console.log('Smart Life SDK initialized with data center:', result);
            return result;
        } catch (error) {
            console.error('Error initializing Smart Life SDK with data center:', error);
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

    async loginWithPhone(
        phone: string,
        password: string,
        countryCode: string = '1'
    ): Promise<TuyaUser> {
        try {
            const user = await SmartLifeModule.loginWithPhone(phone, password, countryCode);
            console.log('Phone login successful:', user);
            return user;
        } catch (error) {
            console.error('Phone login error:', error);
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
            const devices = await SmartLifeModule.getDeviceList(homeId);
            console.log('Devices retrieved:', devices);
            return devices;
        } catch (error) {
            console.error('Error getting devices:', error);
            throw error;
        }
    }

    async controlDevice(deviceId: string, commands: DeviceCommand): Promise<string> {
        try {
            const commandsString = JSON.stringify(commands);
            const result = await SmartLifeModule.controlDevice(deviceId, commandsString);
            console.log('Device control result:', result);
            return result;
        } catch (error) {
            console.error('Error controlling device:', error);
            throw error;
        }
    }

    async getDeviceSchema(deviceId: string): Promise<DeviceSchema[]> {
        try {
            const schema = await SmartLifeModule.getDeviceSchema(deviceId);
            console.log('Device schema:', schema);
            return schema;
        } catch (error) {
            console.error('Error getting device schema:', error);
            throw error;
        }
    }

    // Device pairing methods
    async startDevicePairing(
        homeId: number,
        ssid: string,
        password: string,
        timeout: number = 120
    ): Promise<TuyaDevice> {
        try {
            console.log('Starting device pairing (AP mode):', { homeId, ssid, timeout });
            const device = await SmartLifeModule.startDevicePairing(homeId, ssid, password, timeout);
            console.log('Device paired successfully:', device);
            return device;
        } catch (error) {
            console.error('Error pairing device:', error);
            throw error;
        }
    }

    async startDevicePairingEZ(
        homeId: number,
        ssid: string,
        password: string,
        timeout: number = 120
    ): Promise<TuyaDevice> {
        try {
            console.log('Starting device pairing (EZ mode):', { homeId, ssid, timeout });
            const device = await SmartLifeModule.startDevicePairingEZ(homeId, ssid, password, timeout);
            console.log('Device EZ paired successfully:', device);
            return device;
        } catch (error) {
            console.error('Error EZ pairing device:', error);
            throw error;
        }
    }

    async stopDevicePairing(): Promise<string> {
        try {
            const result = await SmartLifeModule.stopDevicePairing();
            console.log('Device pairing stopped:', result);
            return result;
        } catch (error) {
            console.error('Error stopping device pairing:', error);
            throw error;
        }
    }

    async getCurrentWifiSSID(): Promise<string> {
        try {
            const ssid = await SmartLifeModule.getCurrentWifiSSID();
            console.log('Current WiFi SSID:', ssid);
            return ssid;
        } catch (error) {
            console.error('Error getting WiFi SSID:', error);
            throw error;
        }
    }

    async toggleSwitch(deviceId: string, switchNumber: number = 1): Promise<string> {
        return this.controlDevice(deviceId, {
            [`switch_${switchNumber}`]: true
        });
    }

    async setSwitchState(deviceId: string, state: boolean, switchNumber: number = 1): Promise<string> {
        return this.controlDevice(deviceId, {
            [`switch_${switchNumber}`]: state
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

    getInitializationStatus(): boolean {
        return this.isInitialized;
    }

    async destroy(): Promise<void> {
        try {
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
