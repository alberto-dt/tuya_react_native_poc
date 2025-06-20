import { Platform } from 'react-native';

// Interfaces para TypeScript
export interface TuyaCredentials {
    appKey: string;
    appSecret: string;
}

// Configuración directa de credenciales
// IMPORTANTE: Reemplaza estos valores con tus credenciales reales de Tuya
const TUYA_CONFIG = {
    // Credenciales para iOS
    ios: {
        appKey: 'qraads4d7nm9peqtcedw',
        appSecret: 'vxj4mm7erddw5memrcas9yvnhpttssct',
    },
    // Credenciales para Android
    android: {
        appKey: 'phrvfs7yuqg3rg8sw3km',
        appSecret: '74akfvfua53teq4wvepcd847panjpkee',
    },
};

/**
 * Obtiene las credenciales de Tuya según la plataforma actual
 */
export const getTuyaCredentials = (): TuyaCredentials => {
    const platformConfig = Platform.OS === 'ios' ? TUYA_CONFIG.ios : TUYA_CONFIG.android;

    console.log(`🔧 Obteniendo credenciales para ${Platform.OS.toUpperCase()}`);

    return {
        appKey: platformConfig.appKey,
        appSecret: platformConfig.appSecret,
    };
};

/**
 * Valida que las credenciales sean válidas y estén configuradas
 */
export const validateCredentials = (credentials: TuyaCredentials): boolean => {
    const isValid = !!(
        credentials.appKey &&
        credentials.appSecret &&
        credentials.appKey !== 'TU_APP_KEY_IOS_AQUI' &&
        credentials.appKey !== 'TU_APP_KEY_ANDROID_AQUI' &&
        credentials.appSecret !== 'TU_APP_SECRET_IOS_AQUI' &&
        credentials.appSecret !== 'TU_APP_SECRET_ANDROID_AQUI' &&
        credentials.appKey.length > 5 &&
        credentials.appSecret.length > 5
    );

    if (!isValid) {
        console.error('❌ Validación de credenciales Tuya falló:', {
            hasAppKey: !!credentials.appKey,
            hasAppSecret: !!credentials.appSecret,
            platform: Platform.OS,
            isPlaceholder: credentials.appKey.includes('TU_APP_KEY'),
        });
    } else {
        console.log('✅ Credenciales Tuya validadas correctamente');
    }

    return isValid;
};

/**
 * Configuración de desarrollo/debug
 */
export const isDevelopment = __DEV__;

export default {
    getTuyaCredentials,
    validateCredentials,
    isDevelopment,
};
