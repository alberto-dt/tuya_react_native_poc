import { Platform } from 'react-native';
import Config from 'react-native-config';

// Interfaces para TypeScript
export interface TuyaCredentials {
    appKey: string;
    appSecret: string;
}

export interface TuyaPlatformConfig {
    ios: TuyaCredentials;
    android: TuyaCredentials;
}

// Configuración hardcodeada (para desarrollo)
const TuyaConfigHardcoded: TuyaPlatformConfig = {
    ios: {
        appKey: 'qraads4d7nm9peqtcedw',
        appSecret: 'vxj4mm7erddw5memrcas9yvnhpttssct'
    },
    android: {
        appKey: 'phrvfs7yuqg3rg8sw3km',        // Reemplaza con tu Android AppKey
        appSecret: '74akfvfua53teq4wvepcd847panjpkee'   // Reemplaza con tu Android AppSecret
    }
};

export const getTuyaCredentials = (): TuyaCredentials => {
    // Determinar plataforma actual
    const currentPlatform = Platform.OS as keyof TuyaPlatformConfig;

    // Usar variables de entorno si están disponibles, sino usar hardcodeadas
    const credentials: TuyaCredentials = {
        appKey: Config.TUYA_APP_KEY || TuyaConfigHardcoded[currentPlatform].appKey,
        appSecret: Config.TUYA_APP_SECRET || TuyaConfigHardcoded[currentPlatform].appSecret
    };

    console.log(`🔧 Using ${Platform.OS.toUpperCase()} credentials:`, {
        appKey: credentials.appKey.substring(0, 8) + '...',
        appSecretLength: credentials.appSecret.length,
        source: Config.TUYA_APP_KEY ? 'environment' : 'hardcoded'
    });

    return credentials;
};

export const getCurrentPlatform = (): 'ios' | 'android' => {
    return Platform.OS as 'ios' | 'android';
};

export const validateCredentials = (credentials: TuyaCredentials): boolean => {
    return !!(
        credentials.appKey &&
        credentials.appSecret &&
        credentials.appKey.length > 10 &&
        credentials.appSecret.length > 10
    );
};

export default TuyaConfigHardcoded;
