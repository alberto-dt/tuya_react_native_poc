
import { NativeModules } from 'react-native';
import {
    SmartLifeModuleInterface,
    TuyaUser,
    TuyaHome,
    TuyaDevice,
    DeviceSchema,
    DeviceCommand,
    ColorHSV,
    ColorRGB
} from '@/types/SmartLifeTypes';

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

    async loginWithEmail(
        email: string,
        password: string,
        countryCode: string = '593'
    ): Promise<TuyaUser> {
        try {
            const user = await SmartLifeModule.loginWithEmail(email, password, countryCode);
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
            const result = await SmartLifeModule.controlDevice(deviceId, commands);
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

    async toggleSwitch(deviceId: string, switchNumber: number = 1): Promise<string> {
        return this.controlDevice(deviceId, {
            [`switch_${switchNumber}`]: true
        });
    }

    async setSwitchState(
        deviceId: string,
        state: boolean,
        switchNumber: number = 1
    ): Promise<string> {
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

    async setHSVColor(deviceId: string, hsv: ColorHSV): Promise<string> {
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

    hsvToRgb(h: number, s: number, v: number): ColorRGB {
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;

        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    getInitializationStatus(): boolean {
        return this.isInitialized;
    }
}

export default new SmartLifeService();
