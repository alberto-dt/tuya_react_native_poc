import type { TuyaDevice } from './SmartLifeService';

export type TestDeviceType = 'switch' | 'light' | 'sensor' | 'plug' | 'fan' | 'thermostat';

export interface TestDeviceTemplate {
    type: TestDeviceType;
    name: string;
    icon: string;
    description: string;
    defaultFunctions: string[];
    defaultState: { [key: string]: any };
    controlOptions: ControlOption[];
}

export interface ControlOption {
    key: string;
    label: string;
    type: 'boolean' | 'number' | 'string' | 'enum';
    min?: number;
    max?: number;
    options?: string[];
    unit?: string;
}

export class TestDeviceUtils {

    static getDeviceTemplates(): TestDeviceTemplate[] {
        return [
            {
                type: 'switch',
                name: 'Switch Inteligente',
                icon: '🔌',
                description: 'Interruptor de 3 canales con control independiente',
                defaultFunctions: ['switch_1', 'switch_2', 'switch_3'],
                defaultState: {
                    switch_1: false,
                    switch_2: false,
                    switch_3: false
                },
                controlOptions: [
                    { key: 'switch_1', label: 'Canal 1', type: 'boolean' },
                    { key: 'switch_2', label: 'Canal 2', type: 'boolean' },
                    { key: 'switch_3', label: 'Canal 3', type: 'boolean' }
                ]
            },
            {
                type: 'light',
                name: 'Bombilla Inteligente',
                icon: '💡',
                description: 'Luz RGB con control de brillo y temperatura de color',
                defaultFunctions: ['switch_1', 'bright_value', 'temp_value', 'colour_data', 'work_mode'],
                defaultState: {
                    switch_1: false,
                    bright_value: 255,
                    temp_value: 500,
                    work_mode: 'white',
                    colour_data: '{"h":0,"s":0,"v":255}'
                },
                controlOptions: [
                    { key: 'switch_1', label: 'Encender/Apagar', type: 'boolean' },
                    { key: 'bright_value', label: 'Brillo', type: 'number', min: 10, max: 1000, unit: '' },
                    { key: 'temp_value', label: 'Temperatura', type: 'number', min: 0, max: 1000, unit: 'K' },
                    { key: 'work_mode', label: 'Modo', type: 'enum', options: ['white', 'colour', 'scene', 'music'] }
                ]
            },
            {
                type: 'sensor',
                name: 'Sensor Ambiental',
                icon: '📡',
                description: 'Sensor de temperatura, humedad y batería',
                defaultFunctions: ['temp_current', 'humidity_value', 'battery_percentage'],
                defaultState: {
                    temp_current: 22,
                    humidity_value: 45,
                    battery_percentage: 85,
                    motion_state: false
                },
                controlOptions: [
                    { key: 'temp_current', label: 'Temperatura', type: 'number', min: -20, max: 50, unit: '°C' },
                    { key: 'humidity_value', label: 'Humedad', type: 'number', min: 0, max: 100, unit: '%' },
                    { key: 'battery_percentage', label: 'Batería', type: 'number', min: 0, max: 100, unit: '%' },
                    { key: 'motion_state', label: 'Movimiento', type: 'boolean' }
                ]
            },
            {
                type: 'plug',
                name: 'Enchufe Inteligente',
                icon: '🔌',
                description: 'Enchufe con medición de energía',
                defaultFunctions: ['switch_1', 'cur_power', 'cur_voltage', 'cur_current'],
                defaultState: {
                    switch_1: false,
                    cur_power: 0,
                    cur_voltage: 220,
                    cur_current: 0,
                    total_energy: 0
                },
                controlOptions: [
                    { key: 'switch_1', label: 'Encender/Apagar', type: 'boolean' },
                    { key: 'cur_power', label: 'Potencia', type: 'number', min: 0, max: 3000, unit: 'W' },
                    { key: 'cur_voltage', label: 'Voltaje', type: 'number', min: 110, max: 240, unit: 'V' },
                    { key: 'cur_current', label: 'Corriente', type: 'number', min: 0, max: 16, unit: 'A' }
                ]
            },
            {
                type: 'fan',
                name: 'Ventilador Inteligente',
                icon: '🌀',
                description: 'Ventilador con control de velocidad y modo',
                defaultFunctions: ['switch_1', 'fan_speed', 'mode', 'oscillation'],
                defaultState: {
                    switch_1: false,
                    fan_speed: 1,
                    mode: 'straight_wind',
                    oscillation: false,
                    timer: 0
                },
                controlOptions: [
                    { key: 'switch_1', label: 'Encender/Apagar', type: 'boolean' },
                    { key: 'fan_speed', label: 'Velocidad', type: 'number', min: 1, max: 5, unit: '' },
                    { key: 'mode', label: 'Modo', type: 'enum', options: ['straight_wind', 'natural_wind', 'sleep_wind'] },
                    { key: 'oscillation', label: 'Oscilación', type: 'boolean' }
                ]
            },
            {
                type: 'thermostat',
                name: 'Termostato Inteligente',
                icon: '🌡️',
                description: 'Control de temperatura con múltiples modos',
                defaultFunctions: ['switch_1', 'temp_set', 'temp_current', 'mode'],
                defaultState: {
                    switch_1: false,
                    temp_set: 23,
                    temp_current: 22,
                    mode: 'auto',
                    fan_speed: 'auto'
                },
                controlOptions: [
                    { key: 'switch_1', label: 'Encender/Apagar', type: 'boolean' },
                    { key: 'temp_set', label: 'Temperatura Objetivo', type: 'number', min: 16, max: 30, unit: '°C' },
                    { key: 'temp_current', label: 'Temperatura Actual', type: 'number', min: 10, max: 40, unit: '°C' },
                    { key: 'mode', label: 'Modo', type: 'enum', options: ['auto', 'cool', 'heat', 'fan_only'] }
                ]
            }
        ];
    }

    static getTemplateByType(type: TestDeviceType): TestDeviceTemplate | null {
        return this.getDeviceTemplates().find(template => template.type === type) || null;
    }

    static createTestDevice(
        name: string,
        type: TestDeviceType,
        homeId: number,
        customConfig?: {
            online?: boolean;
            customState?: { [key: string]: any };
            customFunctions?: string[];
        }
    ): TuyaDevice {
        const template = this.getTemplateByType(type);
        if (!template) {
            throw new Error(`Tipo de dispositivo no soportado: ${type}`);
        }

        const deviceId = this.generateTestDeviceId(type);
        const config = customConfig || {};

        return {
            devId: deviceId,
            name: name,
            iconUrl: this.getIconUrl(type),
            isOnline: config.online !== undefined ? config.online : true,
            productId: `test_${type}`,
            supportedFunctions: config.customFunctions || template.defaultFunctions,
            uuid: `test_uuid_${deviceId}`,
            category: type,
            productName: template.name,
            isLocalOnline: config.online !== undefined ? config.online : true,
            isSub: false,
            isShare: false,
            status: { ...template.defaultState, ...(config.customState || {}) }
        };
    }

    static generateTestDeviceId(type: TestDeviceType): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `test_${type}_${timestamp}_${random}`;
    }

    static getIconUrl(type: TestDeviceType): string {
        const iconMap: { [key in TestDeviceType]: string } = {
            switch: 'https://images.tuyacn.com/smart/icon/switch.png',
            light: 'https://images.tuyacn.com/smart/icon/light.png',
            sensor: 'https://images.tuyacn.com/smart/icon/sensor.png',
            plug: 'https://images.tuyacn.com/smart/icon/plug.png',
            fan: 'https://images.tuyacn.com/smart/icon/fan.png',
            thermostat: 'https://images.tuyacn.com/smart/icon/thermostat.png'
        };
        return iconMap[type];
    }

    static validateCommand(device: TuyaDevice, command: { [key: string]: any }): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        const deviceType = this.getDeviceTypeFromId(device.devId);
        const template = deviceType ? this.getTemplateByType(deviceType) : null;

        if (!template) {
            warnings.push('No se pudo determinar el tipo de dispositivo para validación completa');
        }
        Object.entries(command).forEach(([key, value]) => {
            if (!device.supportedFunctions?.includes(key)) {
                errors.push(`Función '${key}' no soportada por el dispositivo`);
                return;
            }

            if (template) {
                const controlOption = template.controlOptions.find(option => option.key === key);
                if (controlOption) {
                    const validation = this.validateControlValue(controlOption, value);
                    if (!validation.valid) {
                        errors.push(`${key}: ${validation.error}`);
                    }
                    if (validation.warning) {
                        warnings.push(`${key}: ${validation.warning}`);
                    }
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    static validateControlValue(option: ControlOption, value: any): {
        valid: boolean;
        error?: string;
        warning?: string;
    } {
        switch (option.type) {
            case 'boolean':
                if (typeof value !== 'boolean') {
                    return { valid: false, error: 'Debe ser un valor booleano (true/false)' };
                }
                break;

            case 'number':
                if (typeof value !== 'number' || isNaN(value)) {
                    return { valid: false, error: 'Debe ser un número válido' };
                }
                if (option.min !== undefined && value < option.min) {
                    return { valid: false, error: `Valor mínimo: ${option.min}` };
                }
                if (option.max !== undefined && value > option.max) {
                    return { valid: false, error: `Valor máximo: ${option.max}` };
                }
                break;

            case 'string':
                if (typeof value !== 'string') {
                    return { valid: false, error: 'Debe ser una cadena de texto' };
                }
                break;

            case 'enum':
                if (!option.options?.includes(value)) {
                    return {
                        valid: false,
                        error: `Valor debe ser uno de: ${option.options?.join(', ')}`
                    };
                }
                break;
        }

        return { valid: true };
    }

    static simulateStateChange(
        device: TuyaDevice,
        command: { [key: string]: any }
    ): TuyaDevice {
        const newDevice = { ...device };
        const newStatus = { ...device.status };

        Object.entries(command).forEach(([key, value]) => {
            newStatus[key] = value;

            this.applyStateEffects(newStatus, key, value, device.category || 'switch');
        });

        newDevice.status = newStatus;
        return newDevice;
    }

    private static applyStateEffects(
        status: { [key: string]: any },
        changedKey: string,
        newValue: any,
        deviceType: string
    ): void {
        switch (deviceType) {
            case 'plug':
                if (changedKey === 'switch_1') {
                    if (!newValue) {
                        status.cur_power = 0;
                        status.cur_current = 0;
                    } else {
                        status.cur_power = Math.floor(Math.random() * 500) + 50;
                        status.cur_current = status.cur_power / (status.cur_voltage || 220);
                    }
                }
                break;

            case 'light':
                if (changedKey === 'switch_1' && !newValue) {
                }
                if (changedKey === 'work_mode') {
                    if (newValue === 'colour') {
                        status.temp_value = 0;
                    }
                }
                break;

            case 'fan':
                if (changedKey === 'switch_1' && !newValue) {
                    status.oscillation = false;
                }
                if (changedKey === 'mode') {
                    if (newValue === 'sleep_wind') {
                        status.fan_speed = Math.min(status.fan_speed || 1, 2);
                    }
                }
                break;

            case 'thermostat':
                if (changedKey === 'temp_set') {
                    const tempDiff = newValue - (status.temp_current || 20);
                    status.temp_current = status.temp_current + (tempDiff * 0.1);
                }
                break;

            case 'sensor':
                if (changedKey === 'temp_current') {
                    const tempChange = newValue - (status.temp_current || 20);
                    status.humidity_value = Math.max(0, Math.min(100,
                        (status.humidity_value || 50) - (tempChange * 2)
                    ));
                }
                break;
        }
    }

    static getDeviceTypeFromId(deviceId: string): TestDeviceType | null {
        const match = deviceId.match(/^test_(\w+)_/);
        if (match && match[1]) {
            const type = match[1] as TestDeviceType;
            return this.getDeviceTemplates().some(t => t.type === type) ? type : null;
        }
        return null;
    }

    static isTestDevice(deviceId: string): boolean {
        return deviceId.startsWith('test_') || deviceId.startsWith('mock_');
    }

    static getDeviceStats(device: TuyaDevice): {
        [key: string]: {
            label: string;
            value: string;
            unit?: string;
            status?: 'normal' | 'warning' | 'error';
        }
    } {
        const stats: { [key: string]: any } = {};
        const deviceType = this.getDeviceTypeFromId(device.devId);
        const template = deviceType ? this.getTemplateByType(deviceType) : null;

        if (!template || !device.status) {
            return stats;
        }

        template.controlOptions.forEach(option => {
            const value = device.status![option.key];
            if (value !== undefined) {
                let displayValue = value.toString();
                let status: 'normal' | 'warning' | 'error' = 'normal';

                if (option.type === 'boolean') {
                    displayValue = value ? 'Sí' : 'No';
                } else if (option.type === 'number') {
                    if (option.unit) {
                        displayValue = `${value}${option.unit}`;
                    }

                    if (option.min !== undefined && value < option.min) {
                        status = 'error';
                    } else if (option.max !== undefined && value > option.max) {
                        status = 'error';
                    } else if (option.key === 'battery_percentage' && value < 20) {
                        status = 'warning';
                    } else if (option.key === 'temp_current' && (value < 5 || value > 35)) {
                        status = 'warning';
                    }
                }

                stats[option.key] = {
                    label: option.label,
                    value: displayValue,
                    unit: option.unit,
                    status
                };
            }
        });

        return stats;
    }

    static generateHistoricalData(
        device: TuyaDevice,
        parameter: string,
        hours: number = 24
    ): Array<{ timestamp: Date; value: number }> {
        const data: Array<{ timestamp: Date; value: number }> = [];
        const now = new Date();
        const currentValue = device.status?.[parameter] || 0;

        for (let i = hours; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));

            let value = currentValue;
            const variation = this.getParameterVariation(parameter, i, hours);
            value += variation;

            data.push({ timestamp, value });
        }

        return data;
    }

    private static getParameterVariation(parameter: string, hoursAgo: number, totalHours: number): number {
        const timeProgress = hoursAgo / totalHours;

        switch (parameter) {
            case 'temp_current':
                const tempCycle = Math.sin(timeProgress * Math.PI * 2) * 5;
                const randomTemp = (Math.random() - 0.5) * 2;
                return tempCycle + randomTemp;

            case 'humidity_value':
                const humidityCycle = Math.cos(timeProgress * Math.PI * 2) * 10;
                const randomHumidity = (Math.random() - 0.5) * 5;
                return humidityCycle + randomHumidity;

            case 'cur_power':
                const usagePattern = Math.random() > 0.7 ? Math.random() * 100 : 0;
                return usagePattern;

            case 'battery_percentage':
                return -hoursAgo * 0.5;

            default:
                return (Math.random() - 0.5) * 2;
        }
    }

    static exportDeviceConfig(device: TuyaDevice): string {
        const config = {
            name: device.name,
            type: this.getDeviceTypeFromId(device.devId),
            functions: device.supportedFunctions,
            state: device.status,
            online: device.isOnline,
            exportedAt: new Date().toISOString()
        };

        return JSON.stringify(config, null, 2);
    }

    static importDeviceConfig(configJson: string, homeId: number): TuyaDevice {
        try {
            const config = JSON.parse(configJson);

            if (!config.name || !config.type) {
                throw new Error('Configuración inválida: falta nombre o tipo');
            }

            return this.createTestDevice(config.name, config.type, homeId, {
                online: config.online,
                customState: config.state,
                customFunctions: config.functions
            });
        } catch (error) {
            throw new Error(`Error importando configuración: ${(error as Error).message}`);
        }
    }

    // ======================== MÉTODOS DE ELIMINACIÓN ========================

    static canDeleteDevice(device: TuyaDevice): {
        canDelete: boolean;
        reason?: string;
        isTestDevice: boolean;
    } {
        const isTestDevice = this.isTestDevice(device.devId);

        if (isTestDevice) {
            return {
                canDelete: true,
                isTestDevice: true
            };
        } else {
            return {
                canDelete: false,
                reason: 'Solo se pueden eliminar dispositivos de prueba desde esta aplicación',
                isTestDevice: false
            };
        }
    }

    static getDeletionWarningMessage(device: TuyaDevice): string {
        const isTestDevice = this.isTestDevice(device.devId);

        if (isTestDevice) {
            return `¿Estás seguro que quieres eliminar "${device.name}"?\n\nEste dispositivo de prueba se eliminará permanentemente.`;
        } else {
            return `No se puede eliminar "${device.name}" desde esta aplicación.\n\nPara eliminar dispositivos reales, usa la aplicación Smart Life oficial.`;
        }
    }

    static getMultipleDeletionSummary(devices: TuyaDevice[]): {
        totalDevices: number;
        testDevices: number;
        realDevices: number;
        canDeleteCount: number;
        warningMessage: string;
    } {
        const testDevices = devices.filter(d => this.isTestDevice(d.devId));
        const realDevices = devices.filter(d => !this.isTestDevice(d.devId));

        return {
            totalDevices: devices.length,
            testDevices: testDevices.length,
            realDevices: realDevices.length,
            canDeleteCount: testDevices.length,
            warningMessage: testDevices.length > 0
                ? `Se eliminarán ${testDevices.length} dispositivos de prueba permanentemente.`
                : 'No hay dispositivos de prueba para eliminar.'
        };
    }
}

export const createPresetTestDevices = (homeId: number): TuyaDevice[] => {
    const presets = [
        {
            name: 'Luz Sala Principal',
            type: 'light' as TestDeviceType,
            state: { switch_1: true, bright_value: 200, work_mode: 'white' }
        },
        {
            name: 'Switch Cocina',
            type: 'switch' as TestDeviceType,
            state: { switch_1: true, switch_2: false, switch_3: false }
        },
        {
            name: 'Sensor Habitación',
            type: 'sensor' as TestDeviceType,
            state: { temp_current: 24, humidity_value: 42, battery_percentage: 78 }
        },
        {
            name: 'Enchufe TV',
            type: 'plug' as TestDeviceType,
            state: { switch_1: true, cur_power: 85, cur_voltage: 220 }
        }
    ];

    return presets.map(preset =>
        TestDeviceUtils.createTestDevice(preset.name, preset.type, homeId, {
            customState: preset.state
        })
    );
};

export default TestDeviceUtils;
