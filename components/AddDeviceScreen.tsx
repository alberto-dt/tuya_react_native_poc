import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Switch,
} from 'react-native';

import SmartLifeService from '../services/SmartLifeService';
import type { TuyaDevice, TuyaHome, TuyaUser } from '../services/SmartLifeService';

interface AddDeviceScreenProps {
    user: TuyaUser;
    home: TuyaHome;
    onDeviceAdded: (device: TuyaDevice) => void;
    onCancel: () => void;
}

type AddDeviceMode = 'selection' | 'test_device';
type TestDeviceType = 'switch' | 'light' | 'sensor' | 'plug' | 'fan' | 'thermostat';

const AddDeviceScreen: React.FC<AddDeviceScreenProps> = ({
                                                             user,
                                                             home,
                                                             onDeviceAdded,
                                                             onCancel,
                                                         }) => {
    const [mode, setMode] = useState<AddDeviceMode>('selection');
    const [isLoading, setIsLoading] = useState(false);

    const [testDeviceName, setTestDeviceName] = useState('');
    const [testDeviceType, setTestDeviceType] = useState<TestDeviceType>('switch');
    const [isTestDeviceOnline, setIsTestDeviceOnline] = useState(true);

    const addTestDevice = useCallback(async () => {
        try {
            if (!testDeviceName.trim()) {
                Alert.alert('Error', 'Por favor ingresa un nombre para el dispositivo');
                return;
            }

            setIsLoading(true);

            console.log('Agregando dispositivo de prueba:', {
                name: testDeviceName,
                type: testDeviceType,
                online: isTestDeviceOnline
            });

            // Usar el método addTestDevice del servicio refactorizado
            const testDevice = await SmartLifeService.addTestDevice(
                home.homeId,
                testDeviceName,
                testDeviceType
            );

            Alert.alert(
                '¡Dispositivo de Prueba Creado! 🧪',
                `El dispositivo "${testDevice.name}" ha sido agregado a tu hogar para pruebas.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            onDeviceAdded(testDevice);
                        }
                    }
                ]
            );

        } catch (error) {
            console.error('Error agregando dispositivo de prueba:', error);
            Alert.alert(
                'Error',
                `No se pudo crear el dispositivo de prueba:\n${(error as Error).message}`
            );
        } finally {
            setIsLoading(false);
        }
    }, [testDeviceName, testDeviceType, isTestDeviceOnline, home.homeId, onDeviceAdded]);

    const createPresetDevices = useCallback(async () => {
        try {
            setIsLoading(true);

            Alert.alert(
                'Crear Dispositivos de Demostración',
                '¿Quieres crear 4 dispositivos de prueba predefinidos para demostración?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Crear',
                        onPress: async () => {
                            try {
                                const devices = await SmartLifeService.createPresetTestDevices(home.homeId);

                                Alert.alert(
                                    '¡Dispositivos Creados! 🎉',
                                    `Se crearon ${devices.length} dispositivos de demostración exitosamente.`,
                                    [
                                        {
                                            text: 'Ver Dispositivos',
                                            onPress: onCancel // Regresar a la lista para ver los dispositivos
                                        }
                                    ]
                                );
                            } catch (error) {
                                Alert.alert('Error', `No se pudieron crear los dispositivos: ${(error as Error).message}`);
                            }
                        }
                    }
                ]
            );
        } finally {
            setIsLoading(false);
        }
    }, [home.homeId, onCancel]);
    const renderModeSelection = () => (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>🧪 Agregar Dispositivos de Prueba</Text>
            <Text style={styles.stepDescription}>
                Elige cómo quieres agregar dispositivos virtuales a "{home.name}"
            </Text>

            <TouchableOpacity
                style={[styles.optionCard, styles.testDeviceCard]}
                onPress={() => setMode('test_device')}
            >
                <Text style={styles.optionIcon}>🧪</Text>
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Dispositivo Individual</Text>
                    <Text style={styles.optionDescription}>
                        Crear un dispositivo virtual personalizado para probar funcionalidades específicas
                    </Text>
                </View>
                <Text style={styles.optionArrow}>→</Text>
            </TouchableOpacity>

            {/* Opción Dispositivos de Demostración */}
            <TouchableOpacity
                style={[styles.optionCard, styles.demoCard]}
                onPress={createPresetDevices}
                disabled={isLoading}
            >
                <Text style={styles.optionIcon}>⚡</Text>
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Demo Completa</Text>
                    <Text style={styles.optionDescription}>
                        Crear automáticamente 4 dispositivos de prueba variados para demostración completa
                    </Text>
                </View>
                {isLoading ? (
                    <ActivityIndicator size="small" color="#9C27B0" />
                ) : (
                    <Text style={styles.optionArrow}>→</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );

    const renderTestDevice = () => (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>🧪 Dispositivo de Prueba</Text>
            <Text style={styles.stepDescription}>
                Crear un dispositivo virtual para desarrollo y pruebas
            </Text>

            <View style={styles.configSection}>
                <Text style={styles.configTitle}>⚙️ Configuración</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nombre del Dispositivo:</Text>
                    <TextInput
                        style={styles.textInput}
                        value={testDeviceName}
                        onChangeText={setTestDeviceName}
                        placeholder="Mi Dispositivo de Prueba"
                        autoCapitalize="words"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Tipo de Dispositivo:</Text>
                    <View style={styles.deviceTypeGrid}>
                        {([
                            { type: 'switch', icon: '🔌', name: 'Switch' },
                            { type: 'light', icon: '💡', name: 'Luz' },
                            { type: 'sensor', icon: '📡', name: 'Sensor' },
                            { type: 'plug', icon: '🔌', name: 'Enchufe' },
                            { type: 'fan', icon: '🌀', name: 'Ventilador' },
                            { type: 'thermostat', icon: '🌡️', name: 'Termostato' }
                        ] as Array<{ type: TestDeviceType; icon: string; name: string }>).map((device) => (
                            <TouchableOpacity
                                key={device.type}
                                style={[
                                    styles.deviceTypeButton,
                                    testDeviceType === device.type && styles.deviceTypeButtonSelected
                                ]}
                                onPress={() => setTestDeviceType(device.type)}
                            >
                                <Text style={styles.deviceTypeIcon}>{device.icon}</Text>
                                <Text style={[
                                    styles.deviceTypeName,
                                    testDeviceType === device.type && styles.deviceTypeNameSelected
                                ]}>
                                    {device.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.switchContainer}>
                        <Text style={styles.inputLabel}>Estado Inicial Online:</Text>
                        <Switch
                            value={isTestDeviceOnline}
                            onValueChange={setIsTestDeviceOnline}
                            trackColor={{ false: '#ccc', true: '#4CAF50' }}
                            thumbColor={isTestDeviceOnline ? '#2e7d32' : '#f4f3f4'}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>ℹ️ Información</Text>
                <Text style={styles.infoText}>
                    Los dispositivos de prueba funcionan como dispositivos reales pero son virtuales.
                    {'\n\n'}Perfecto para:
                    {'\n'}• Probar la interfaz
                    {'\n'}• Desarrollo de funcionalidades
                    {'\n'}• Demonstraciones
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.primaryButton, (!testDeviceName.trim() || isLoading) && styles.buttonDisabled]}
                onPress={addTestDevice}
                disabled={!testDeviceName.trim() || isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <Text style={styles.primaryButtonText}>
                        🧪 Crear Dispositivo de Prueba
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (mode === 'selection') {
                            onCancel();
                        } else {
                            setMode('selection');
                        }
                    }}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Agregar Dispositivo</Text>
                    <Text style={styles.subtitle}>{home.name}</Text>
                </View>
                <View style={styles.headerPlaceholder} />
            </View>

            {/* Content */}
            {mode === 'selection' && renderModeSelection()}
            {mode === 'test_device' && renderTestDevice()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#4CAF50',
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
    headerPlaceholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    stepDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },

    // Option Cards
    optionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    testDeviceCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#9C27B0',
    },
    demoCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    optionIcon: {
        fontSize: 32,
        marginRight: 15,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    optionDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    optionArrow: {
        fontSize: 24,
        color: '#4CAF50',
        fontWeight: 'bold',
    },

    // Buttons
    primaryButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 15,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.6,
    },

    // Configuration
    configSection: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    configTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },

    // Device Type Grid
    deviceTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    deviceTypeButton: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    deviceTypeButtonSelected: {
        backgroundColor: '#e8f5e8',
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    deviceTypeIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    deviceTypeName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    deviceTypeNameSelected: {
        color: '#2e7d32',
    },

    // Switch Container
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // Info Cards
    infoCard: {
        backgroundColor: '#e3f2fd',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#2196f3',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#1565c0',
        lineHeight: 20,
    },
});

export default AddDeviceScreen;
