import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Switch,
    ActivityIndicator,
    Modal,
    TextInput,
    Dimensions,
} from 'react-native';

import SmartLifeService from '../services/SmartLifeService';
import type { TuyaDevice, TuyaHome, TuyaUser } from '../services/SmartLifeService';
import Slider from "@react-native-community/slider";

interface DeviceControlScreenProps {
    user: TuyaUser;
    home: TuyaHome;
    device: TuyaDevice;
    onBack: () => void;
    onDeviceUpdated: (device: TuyaDevice) => void;
}

interface ControlAction {
    id: string;
    label: string;
    icon: string;
    type: 'switch' | 'slider' | 'color' | 'mode' | 'custom';
    key: string;
    min?: number;
    max?: number;
    options?: string[];
    unit?: string;
}

const { width: screenWidth } = Dimensions.get('window');

const DeviceControlScreen: React.FC<DeviceControlScreenProps> = ({
                                                                     user,
                                                                     home,
                                                                     device,
                                                                     onBack,
                                                                     onDeviceUpdated,
                                                                 }) => {
    const [currentDevice, setCurrentDevice] = useState<TuyaDevice>(device);
    const [isLoading, setIsLoading] = useState(false);
    const [controllingFunction, setControllingFunction] = useState<string | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [customValue, setCustomValue] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customInputKey, setCustomInputKey] = useState('');

    useEffect(() => {
        setCurrentDevice(device);
    }, [device]);

    const getControlActions = useCallback((): ControlAction[] => {
        const actions: ControlAction[] = [];
        const deviceType = getDeviceType();

        switch (deviceType) {
            case 'switch':
                actions.push(
                    { id: 'switch1', label: 'Canal 1', icon: '🔌', type: 'switch', key: 'switch_1' },
                    { id: 'switch2', label: 'Canal 2', icon: '🔌', type: 'switch', key: 'switch_2' },
                    { id: 'switch3', label: 'Canal 3', icon: '🔌', type: 'switch', key: 'switch_3' }
                );
                break;

            case 'light':
                actions.push(
                    { id: 'power', label: 'Encender/Apagar', icon: '💡', type: 'switch', key: 'switch_1' },
                    { id: 'brightness', label: 'Brillo', icon: '☀️', type: 'slider', key: 'bright_value', min: 10, max: 1000, unit: '' },
                    { id: 'temperature', label: 'Temperatura', icon: '🌡️', type: 'slider', key: 'temp_value', min: 0, max: 1000, unit: 'K' },
                    { id: 'mode', label: 'Modo', icon: '🎨', type: 'mode', key: 'work_mode', options: ['white', 'colour', 'scene', 'music'] },
                    { id: 'color', label: 'Color RGB', icon: '🌈', type: 'color', key: 'colour_data' }
                );
                break;

            case 'sensor':
                actions.push(
                    { id: 'temp', label: 'Temperatura', icon: '🌡️', type: 'slider', key: 'temp_current', min: -20, max: 50, unit: '°C' },
                    { id: 'humidity', label: 'Humedad', icon: '💧', type: 'slider', key: 'humidity_value', min: 0, max: 100, unit: '%' },
                    { id: 'battery', label: 'Batería', icon: '🔋', type: 'slider', key: 'battery_percentage', min: 0, max: 100, unit: '%' }
                );
                break;

            case 'plug':
                actions.push(
                    { id: 'power', label: 'Encender/Apagar', icon: '🔌', type: 'switch', key: 'switch_1' },
                    { id: 'voltage', label: 'Voltaje', icon: '⚡', type: 'slider', key: 'cur_voltage', min: 110, max: 240, unit: 'V' },
                    { id: 'current', label: 'Corriente', icon: '🔌', type: 'slider', key: 'cur_current', min: 0, max: 16, unit: 'A' }
                );
                break;

            case 'fan':
                actions.push(
                    { id: 'power', label: 'Encender/Apagar', icon: '🌀', type: 'switch', key: 'switch_1' },
                    { id: 'speed', label: 'Velocidad', icon: '💨', type: 'slider', key: 'fan_speed', min: 1, max: 5, unit: '' },
                    { id: 'oscillation', label: 'Oscilación', icon: '↔️', type: 'switch', key: 'oscillation' },
                    { id: 'mode', label: 'Modo', icon: '🌪️', type: 'mode', key: 'mode', options: ['straight_wind', 'natural_wind', 'sleep_wind'] }
                );
                break;

            case 'thermostat':
                actions.push(
                    { id: 'power', label: 'Encender/Apagar', icon: '🌡️', type: 'switch', key: 'switch_1' },
                    { id: 'target_temp', label: 'Temperatura Objetivo', icon: '🎯', type: 'slider', key: 'temp_set', min: 16, max: 30, unit: '°C' },
                    { id: 'current_temp', label: 'Temperatura Actual', icon: '🌡️', type: 'slider', key: 'temp_current', min: 10, max: 40, unit: '°C' },
                    { id: 'mode', label: 'Modo', icon: '⚙️', type: 'mode', key: 'mode', options: ['auto', 'cool', 'heat', 'fan_only'] }
                );
                break;
        }

        // Agregar control personalizado para funciones no cubiertas
        if (currentDevice.supportedFunctions) {
            currentDevice.supportedFunctions.forEach(func => {
                if (!actions.some(action => action.key === func)) {
                    actions.push({
                        id: `custom_${func}`,
                        label: func,
                        icon: '⚙️',
                        type: 'custom',
                        key: func
                    });
                }
            });
        }

        return actions;
    }, [currentDevice]);

    const getDeviceType = useCallback(() => {
        if (currentDevice.category) return currentDevice.category.toLowerCase();
        if (currentDevice.devId.includes('test_')) {
            const match = currentDevice.devId.match(/test_(\w+)_/);
            return match ? match[1] : 'switch';
        }
        return 'switch';
    }, [currentDevice]);

    const executeCommand = useCallback(async (key: string, value: any) => {
        try {
            setIsLoading(true);
            setControllingFunction(key);

            console.log(`Executing command: ${key} = ${value}`);

            const command = { [key]: value };
            await SmartLifeService.controlDevice(currentDevice.devId, command);

            // Actualizar el estado local del dispositivo
            const updatedDevice = {
                ...currentDevice,
                status: {
                    ...currentDevice.status,
                    [key]: value
                }
            };

            setCurrentDevice(updatedDevice);
            onDeviceUpdated(updatedDevice);

            console.log(`Command executed successfully: ${key} = ${value}`);

        } catch (error) {
            console.error('Error executing command:', error);
            Alert.alert(
                'Error de Control',
                `No se pudo ejecutar el comando:\n${(error as Error).message}`
            );
        } finally {
            setIsLoading(false);
            setControllingFunction(null);
        }
    }, [currentDevice, onDeviceUpdated]);

    const getCurrentValue = useCallback((key: string): any => {
        return currentDevice.status?.[key] ?? null;
    }, [currentDevice.status]);

    const renderSwitchControl = (action: ControlAction) => {
        const currentValue = getCurrentValue(action.key);
        const isBoolean = typeof currentValue === 'boolean';
        const switchValue = isBoolean ? currentValue : false;

        return (
            <View style={styles.controlItem}>
                <View style={styles.controlHeader}>
                    <Text style={styles.controlIcon}>{action.icon}</Text>
                    <View style={styles.controlInfo}>
                        <Text style={styles.controlLabel}>{action.label}</Text>
                        <Text style={styles.controlValue}>
                            {switchValue ? 'Encendido' : 'Apagado'}
                        </Text>
                    </View>
                    <Switch
                        value={switchValue}
                        onValueChange={(value: boolean) => executeCommand(action.key, value)}
                        disabled={isLoading || !currentDevice.isOnline}
                        trackColor={{ false: '#ccc', true: '#4CAF50' }}
                        thumbColor={switchValue ? '#2e7d32' : '#f4f3f4'}
                    />
                </View>
                {controllingFunction === action.key && (
                    <ActivityIndicator size="small" color="#FF9800" style={styles.controlLoading} />
                )}
            </View>
        );
    };

    const renderSliderControl = (action: ControlAction) => {
        const currentValue = getCurrentValue(action.key);
        const numericValue = typeof currentValue === 'number' ? currentValue : (action.min || 0);
        const min = action.min || 0;
        const max = action.max || 100;

        return (
            <View style={styles.controlItem}>
                <View style={styles.controlHeader}>
                    <Text style={styles.controlIcon}>{action.icon}</Text>
                    <View style={styles.controlInfo}>
                        <Text style={styles.controlLabel}>{action.label}</Text>
                        <Text style={styles.controlValue}>
                            {numericValue}{action.unit || ''}
                        </Text>
                    </View>
                </View>
                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>{min}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={min}
                        maximumValue={max}
                        value={numericValue}
                        onSlidingComplete={(value: number) => executeCommand(action.key, Math.round(value))}
                        minimumTrackTintColor="#4CAF50"
                        maximumTrackTintColor="#ccc"
                        disabled={isLoading || !currentDevice.isOnline}
                    />
                    <Text style={styles.sliderLabel}>{max}</Text>
                </View>
                {controllingFunction === action.key && (
                    <ActivityIndicator size="small" color="#FF9800" style={styles.controlLoading} />
                )}
            </View>
        );
    };

    const renderModeControl = (action: ControlAction) => {
        const currentValue = getCurrentValue(action.key);
        const options = action.options || [];

        return (
            <View style={styles.controlItem}>
                <View style={styles.controlHeader}>
                    <Text style={styles.controlIcon}>{action.icon}</Text>
                    <View style={styles.controlInfo}>
                        <Text style={styles.controlLabel}>{action.label}</Text>
                        <Text style={styles.controlValue}>{currentValue || 'No definido'}</Text>
                    </View>
                </View>
                <View style={styles.modeContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.modeButton,
                                currentValue === option && styles.modeButtonSelected,
                                (!currentDevice.isOnline || isLoading) && styles.modeButtonDisabled
                            ]}
                            onPress={() => executeCommand(action.key, option)}
                            disabled={!currentDevice.isOnline || isLoading}
                        >
                            <Text style={[
                                styles.modeButtonText,
                                currentValue === option && styles.modeButtonTextSelected
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {controllingFunction === action.key && (
                    <ActivityIndicator size="small" color="#FF9800" style={styles.controlLoading} />
                )}
            </View>
        );
    };

    const renderColorControl = (action: ControlAction) => {
        const currentValue = getCurrentValue(action.key);

        return (
            <View style={styles.controlItem}>
                <View style={styles.controlHeader}>
                    <Text style={styles.controlIcon}>{action.icon}</Text>
                    <View style={styles.controlInfo}>
                        <Text style={styles.controlLabel}>{action.label}</Text>
                        <Text style={styles.controlValue}>
                            {currentValue ? 'Color personalizado' : 'Sin configurar'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.colorButton, !currentDevice.isOnline && styles.colorButtonDisabled]}
                        onPress={() => setShowColorPicker(true)}
                        disabled={!currentDevice.isOnline || isLoading}
                    >
                        <Text style={styles.colorButtonText}>🎨</Text>
                    </TouchableOpacity>
                </View>
                {controllingFunction === action.key && (
                    <ActivityIndicator size="small" color="#FF9800" style={styles.controlLoading} />
                )}
            </View>
        );
    };

    const renderCustomControl = (action: ControlAction) => {
        const currentValue = getCurrentValue(action.key);

        return (
            <View style={styles.controlItem}>
                <View style={styles.controlHeader}>
                    <Text style={styles.controlIcon}>{action.icon}</Text>
                    <View style={styles.controlInfo}>
                        <Text style={styles.controlLabel}>{action.label}</Text>
                        <Text style={styles.controlValue}>
                            {JSON.stringify(currentValue)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.customButton, !currentDevice.isOnline && styles.customButtonDisabled]}
                        onPress={() => {
                            setCustomInputKey(action.key);
                            setCustomValue(JSON.stringify(currentValue || ''));
                            setShowCustomInput(true);
                        }}
                        disabled={!currentDevice.isOnline || isLoading}
                    >
                        <Text style={styles.customButtonText}>✏️</Text>
                    </TouchableOpacity>
                </View>
                {controllingFunction === action.key && (
                    <ActivityIndicator size="small" color="#FF9800" style={styles.controlLoading} />
                )}
            </View>
        );
    };

    const renderControl = (action: ControlAction) => {
        switch (action.type) {
            case 'switch':
                return renderSwitchControl(action);
            case 'slider':
                return renderSliderControl(action);
            case 'mode':
                return renderModeControl(action);
            case 'color':
                return renderColorControl(action);
            case 'custom':
                return renderCustomControl(action);
            default:
                return null;
        }
    };

    const handleColorSelection = useCallback(async (color: string) => {
        try {
            setShowColorPicker(false);
            await SmartLifeService.setRGBColor(currentDevice.devId, color);

            const updatedDevice = {
                ...currentDevice,
                status: {
                    ...currentDevice.status,
                    work_mode: 'colour',
                    colour_data: color
                }
            };

            setCurrentDevice(updatedDevice);
            onDeviceUpdated(updatedDevice);
        } catch (error) {
            Alert.alert('Error', `No se pudo cambiar el color: ${(error as Error).message}`);
        }
    }, [currentDevice, onDeviceUpdated]);

    const handleCustomValueSubmit = useCallback(async () => {
        try {
            let parsedValue: any;
            try {
                parsedValue = JSON.parse(customValue);
            } catch {
                // Si no es JSON válido, usar como string
                parsedValue = customValue;
            }

            setShowCustomInput(false);
            await executeCommand(customInputKey, parsedValue);
        } catch (error) {
            Alert.alert('Error', `No se pudo aplicar el valor: ${(error as Error).message}`);
        }
    }, [customValue, customInputKey, executeCommand]);

    const refreshDevice = useCallback(async () => {
        try {
            setIsLoading(true);
            const devices = await SmartLifeService.getDeviceList(home.homeId);
            const refreshedDevice = devices.find(d => d.devId === currentDevice.devId);

            if (refreshedDevice) {
                setCurrentDevice(refreshedDevice);
                onDeviceUpdated(refreshedDevice);
            }
        } catch (error) {
            Alert.alert('Error', `No se pudo actualizar el dispositivo: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }, [home.homeId, currentDevice.devId, onDeviceUpdated]);

    const applyPresetBrightness = useCallback(async (level: 'low' | 'medium' | 'high' | 'max') => {
        const brightnessMap = {
            low: 100,
            medium: 500,
            high: 800,
            max: 1000
        };

        const brightness = brightnessMap[level];
        await executeCommand('bright_value', brightness);
    }, [executeCommand]);

    const applyPresetFanSpeed = useCallback(async (speed: 'silent' | 'low' | 'medium' | 'high' | 'max') => {
        const speedMap = {
            silent: 1,
            low: 2,
            medium: 3,
            high: 4,
            max: 5
        };

        const fanSpeed = speedMap[speed];
        await executeCommand('fan_speed', fanSpeed);
    }, [executeCommand]);

    const actions = getControlActions();
    const isTestDevice = currentDevice.devId.startsWith('test_') || currentDevice.devId.startsWith('mock_');
    const deviceType = getDeviceType();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2196F3" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>{currentDevice.name}</Text>
                    <Text style={styles.subtitle}>Control de Dispositivo</Text>
                </View>
                <TouchableOpacity style={styles.refreshButton} onPress={refreshDevice}>
                    <Text style={styles.refreshButtonText}>🔄</Text>
                </TouchableOpacity>
            </View>

            {/* Device Status */}
            <View style={[styles.statusCard, !currentDevice.isOnline && styles.statusCardOffline]}>
                <View style={styles.statusHeader}>
                    <View style={[
                        styles.statusIndicator,
                        currentDevice.isOnline ? styles.statusOnline : styles.statusOffline
                    ]} />
                    <Text style={styles.statusTitle}>
                        {currentDevice.isOnline ? 'Dispositivo En Línea' : 'Dispositivo Desconectado'}
                    </Text>
                    {isTestDevice && (
                        <View style={styles.testBadge}>
                            <Text style={styles.testBadgeText}>TEST</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.statusSubtitle}>
                    Tipo: {deviceType} • ID: {currentDevice.devId.substring(0, 12)}...
                </Text>
            </View>

            {!currentDevice.isOnline && (
                <View style={styles.offlineWarning}>
                    <Text style={styles.offlineWarningText}>
                        ⚠️ El dispositivo está desconectado. Los controles no funcionarán hasta que se reconnecte.
                    </Text>
                </View>
            )}

            {/* Quick Presets for specific device types */}
            {currentDevice.isOnline && deviceType === 'light' && (
                <View style={styles.presetsCard}>
                    <Text style={styles.presetsTitle}>⚡ Presets de Brillo</Text>
                    <View style={styles.presetsContainer}>
                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => applyPresetBrightness('low')}
                            disabled={isLoading}
                        >
                            <Text style={styles.presetIcon}>🌙</Text>
                            <Text style={styles.presetLabel}>Bajo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => applyPresetBrightness('medium')}
                            disabled={isLoading}
                        >
                            <Text style={styles.presetIcon}>☁️</Text>
                            <Text style={styles.presetLabel}>Medio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => applyPresetBrightness('high')}
                            disabled={isLoading}
                        >
                            <Text style={styles.presetIcon}>☀️</Text>
                            <Text style={styles.presetLabel}>Alto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => applyPresetBrightness('max')}
                            disabled={isLoading}
                        >
                            <Text style={styles.presetIcon}>💡</Text>
                            <Text style={styles.presetLabel}>Máximo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {currentDevice.isOnline && deviceType === 'fan' && (
                <View style={styles.presetsCard}>
                    <Text style={styles.presetsTitle}>💨 Presets de Velocidad</Text>
                    <View style={styles.presetsContainer}>
                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => applyPresetFanSpeed('silent')}
                            disabled={isLoading}
                        >
                            <Text style={styles.presetIcon}>🤫</Text>
                            <Text style={styles.presetLabel}>Silencioso</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => applyPresetFanSpeed('medium')}
                            disabled={isLoading}
                        >
                            <Text style={styles.presetIcon}>💨</Text>
                            <Text style={styles.presetLabel}>Normal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => applyPresetFanSpeed('max')}
                            disabled={isLoading}
                        >
                            <Text style={styles.presetIcon}>🌪️</Text>
                            <Text style={styles.presetLabel}>Máximo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Controls */}
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {actions.length === 0 ? (
                    <View style={styles.noControlsContainer}>
                        <Text style={styles.noControlsTitle}>🚫 Sin Controles</Text>
                        <Text style={styles.noControlsMessage}>
                            Este dispositivo no tiene controles disponibles o no se pudieron cargar.
                        </Text>
                    </View>
                ) : (
                    actions.map((action, index) => (
                        <View key={action.id} style={styles.controlCard}>
                            {renderControl(action)}
                        </View>
                    ))
                )}

                {/* Device Information */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>ℹ️ Información del Dispositivo</Text>
                    <Text style={styles.infoText}>
                        • Tipo: {deviceType}{'\n'}
                        • Funciones: {currentDevice.supportedFunctions?.length || 0}{'\n'}
                        • Estado: {currentDevice.isOnline ? 'En línea' : 'Desconectado'}{'\n'}
                        • Categoría: {currentDevice.category || 'No especificada'}
                    </Text>
                </View>
            </ScrollView>

            {/* Color Picker Modal */}
            <Modal
                visible={showColorPicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowColorPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.colorPickerContainer}>
                        <Text style={styles.colorPickerTitle}>Seleccionar Color</Text>
                        <View style={styles.colorGrid}>
                            {[
                                '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
                                '#FF00FF', '#00FFFF', '#FFA500', '#800080',
                                '#FFC0CB', '#A52A2A', '#808080', '#000000',
                                '#FFFFFF', '#FFD700', '#32CD32', '#FF69B4'
                            ].map((color, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.colorSwatch, { backgroundColor: color }]}
                                    onPress={() => handleColorSelection(color)}
                                />
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowColorPicker(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom Value Input Modal */}
            <Modal
                visible={showCustomInput}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCustomInput(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.customInputContainer}>
                        <Text style={styles.customInputTitle}>Valor Personalizado</Text>
                        <Text style={styles.customInputSubtitle}>Función: {customInputKey}</Text>
                        <TextInput
                            style={styles.customTextInput}
                            value={customValue}
                            onChangeText={(text: string) => setCustomValue(text)}
                            placeholder="Ingresa el valor (JSON o texto)"
                            multiline
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowCustomInput(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={handleCustomValueSubmit}
                            >
                                <Text style={styles.applyButtonText}>Aplicar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Loading overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.loadingText}>Procesando...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#2196F3',
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    refreshButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshButtonText: {
        fontSize: 16,
    },
    statusCard: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    statusCardOffline: {
        backgroundColor: '#ffebee',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    statusOnline: {
        backgroundColor: '#4CAF50',
    },
    statusOffline: {
        backgroundColor: '#f44336',
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    testBadge: {
        backgroundColor: '#9C27B0',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    testBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusSubtitle: {
        fontSize: 14,
        color: '#666',
        marginLeft: 22,
    },
    offlineWarning: {
        backgroundColor: '#fff3cd',
        padding: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
    },
    offlineWarningText: {
        fontSize: 14,
        color: '#856404',
        textAlign: 'center',
    },
    presetsCard: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    presetsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    presetsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    presetButton: {
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        minWidth: 70,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    presetIcon: {
        fontSize: 20,
        marginBottom: 5,
    },
    presetLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    controlCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    controlItem: {
        position: 'relative',
    },
    controlHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    controlIcon: {
        fontSize: 24,
        marginRight: 15,
    },
    controlInfo: {
        flex: 1,
    },
    controlLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    controlValue: {
        fontSize: 14,
        color: '#666',
    },
    controlLoading: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#666',
        minWidth: 30,
        textAlign: 'center',
    },
    slider: {
        flex: 1,
        marginHorizontal: 10,
        height: 40,
    },
    modeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    modeButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    modeButtonSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196F3',
    },
    modeButtonDisabled: {
        opacity: 0.5,
    },
    modeButtonText: {
        fontSize: 14,
        color: '#666',
    },
    modeButtonTextSelected: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    colorButton: {
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorButtonDisabled: {
        opacity: 0.5,
    },
    colorButtonText: {
        fontSize: 20,
    },
    customButton: {
        backgroundColor: '#fff3e0',
        borderRadius: 8,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customButtonDisabled: {
        opacity: 0.5,
    },
    customButtonText: {
        fontSize: 20,
    },
    noControlsContainer: {
        backgroundColor: '#fff3e0',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffcc02',
    },
    noControlsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e65100',
        marginBottom: 10,
    },
    noControlsMessage: {
        fontSize: 14,
        color: '#f57c00',
        textAlign: 'center',
        lineHeight: 20,
    },
    infoCard: {
        backgroundColor: '#e8f5e8',
        borderRadius: 12,
        padding: 20,
        marginTop: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#388e3c',
        lineHeight: 20,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorPickerContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        margin: 20,
        maxWidth: 300,
        width: '90%',
    },
    colorPickerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    colorSwatch: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    customInputContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        margin: 20,
        maxWidth: 350,
        width: '90%',
    },
    customInputTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
    customInputSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    customTextInput: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: '#2196F3',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
    },
});

export default DeviceControlScreen;
