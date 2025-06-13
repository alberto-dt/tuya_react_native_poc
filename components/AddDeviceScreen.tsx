import React, { useState, useCallback, useEffect } from 'react';
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
    PermissionsAndroid,
    Platform,
} from 'react-native';

import SmartLifeService from '../services/SmartLifeService';
import type { TuyaDevice, TuyaHome, TuyaUser } from '../services/SmartLifeService';

interface AddDeviceScreenProps {
    user: TuyaUser;
    home: TuyaHome;
    onDeviceAdded: (device: TuyaDevice) => void;
    onCancel: () => void;
}

type AddDeviceMode = 'selection' | 'test_device' | 'real_device_ez' | 'real_device_ap';
type TestDeviceType = 'switch' | 'light' | 'sensor' | 'plug' | 'fan' | 'thermostat';

const AddDeviceScreen: React.FC<AddDeviceScreenProps> = ({
                                                             user,
                                                             home,
                                                             onDeviceAdded,
                                                             onCancel,
                                                         }) => {
    const [mode, setMode] = useState<AddDeviceMode>('selection');
    const [isLoading, setIsLoading] = useState(false);
    const [isPairing, setIsPairing] = useState(false);
    const [pairingProgress, setPairingProgress] = useState('');

    // Test device states
    const [testDeviceName, setTestDeviceName] = useState('');
    const [testDeviceType, setTestDeviceType] = useState<TestDeviceType>('switch');
    const [isTestDeviceOnline, setIsTestDeviceOnline] = useState(true);

    // Real device pairing states
    const [wifiSSID, setWifiSSID] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');
    const [currentSSID, setCurrentSSID] = useState('');
    const [pairingTimeout, setPairingTimeout] = useState(120);

    useEffect(() => {
        getCurrentWiFiSSID();
    }, []);

    const getCurrentWiFiSSID = useCallback(async () => {
        try {
            const ssid = await SmartLifeService.getCurrentWifiSSID();
            setCurrentSSID(ssid);
            setWifiSSID(ssid);
            console.log('Current WiFi SSID:', ssid);
        } catch (error) {
            console.warn('Could not get current WiFi SSID:', error);
        }
    }, []);

    const requestLocationPermission = useCallback(async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Permiso de Ubicación',
                        message: 'Smart Life necesita acceso a tu ubicación para el emparejamiento de dispositivos.',
                        buttonNeutral: 'Preguntar después',
                        buttonNegative: 'Cancelar',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn('Error requesting location permission:', err);
                return false;
            }
        }
        return true;
    }, []);

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
                                            onPress: onCancel
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

    const startRealDevicePairing = useCallback(async (pairingMode: 'AP' | 'EZ') => {
        try {
            // Validate inputs
            if (!wifiSSID.trim()) {
                Alert.alert('Error', 'Por favor ingresa el nombre de tu red WiFi');
                return;
            }

            if (!wifiPassword.trim()) {
                Alert.alert('Error', 'Por favor ingresa la contraseña de tu WiFi');
                return;
            }

            // Request location permission
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                Alert.alert(
                    'Permiso Requerido',
                    'El permiso de ubicación es necesario para el emparejamiento de dispositivos.'
                );
                return;
            }

            setIsPairing(true);
            setPairingProgress('Iniciando emparejamiento simulado...');

            console.log(`Starting simulated ${pairingMode} mode pairing:`, {
                homeId: home.homeId,
                ssid: wifiSSID,
                passwordLength: wifiPassword.length,
                timeout: pairingTimeout
            });

            try {
                let pairedDevice: TuyaDevice;

                if (pairingMode === 'EZ') {
                    setPairingProgress('Simulando modo EZ...');
                    pairedDevice = await SmartLifeService.startDevicePairingEZ(
                        home.homeId,
                        wifiSSID,
                        wifiPassword,
                        pairingTimeout
                    );
                } else {
                    setPairingProgress('Simulando modo AP...');
                    pairedDevice = await SmartLifeService.startDevicePairing(
                        home.homeId,
                        wifiSSID,
                        wifiPassword,
                        pairingTimeout
                    );
                }

                Alert.alert(
                    '¡Dispositivo Emparejado! 🎉 (Simulado)',
                    `El dispositivo "${pairedDevice.name}" ha sido emparejado exitosamente.\n\n` +
                    `⚠️ Este es un emparejamiento simulado para demostración. ` +
                    `Para dispositivos reales, usa la aplicación Smart Life oficial.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                onDeviceAdded(pairedDevice);
                            }
                        }
                    ]
                );

            } catch (pairingError) {
                console.error('Device pairing failed:', pairingError);

                try {
                    await SmartLifeService.stopDevicePairing();
                } catch (stopError) {
                    console.warn('Error stopping pairing:', stopError);
                }

                Alert.alert(
                    'Error de Emparejamiento (Simulado)',
                    `No se pudo emparejar el dispositivo:\n${(pairingError as Error).message}\n\n` +
                    'Nota: Este es un proceso simulado. En un escenario real:\n' +
                    '• Verifica que el dispositivo esté en modo de emparejamiento\n' +
                    '• Asegúrate de que la red WiFi sea de 2.4GHz\n' +
                    '• Confirma que la contraseña sea correcta'
                );
            }

        } catch (error) {
            console.error('Error starting device pairing:', error);
            Alert.alert(
                'Error',
                `Error al iniciar el emparejamiento:\n${(error as Error).message}`
            );
        } finally {
            setIsPairing(false);
            setPairingProgress('');
        }
    }, [wifiSSID, wifiPassword, pairingTimeout, home.homeId, onDeviceAdded, requestLocationPermission]);

    const stopPairing = useCallback(async () => {
        try {
            await SmartLifeService.stopDevicePairing();
            setIsPairing(false);
            setPairingProgress('');
            Alert.alert('Emparejamiento Cancelado', 'El proceso de emparejamiento ha sido cancelado.');
        } catch (error) {
            console.error('Error stopping pairing:', error);
        }
    }, []);

    const renderModeSelection = () => (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>Agregar Dispositivo</Text>
            <Text style={styles.stepDescription}>
                Elige el tipo de dispositivo que quieres agregar a "{home.name}"
            </Text>

            {/* Notification about simulated pairing */}
            <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>⚠️ Importante - Modo Demostración</Text>
                <Text style={styles.warningText}>
                    El emparejamiento de dispositivos reales está en modo simulado para esta demostración.
                    {'\n\n'}Para emparejar dispositivos reales:
                    {'\n'}• Usa la aplicación Smart Life oficial
                    {'\n'}• O implementa las clases de activación completas del SDK
                </Text>
            </View>

            {/* Real Device Options */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>🏠 Dispositivos Reales (Simulado)</Text>

                <TouchableOpacity
                    style={[styles.optionCard, styles.realDeviceCard]}
                    onPress={() => setMode('real_device_ez')}
                >
                    <Text style={styles.optionIcon}>📶</Text>
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Modo EZ (Simulado)</Text>
                        <Text style={styles.optionDescription}>
                            Demostración del emparejamiento rápido. Crea un dispositivo virtual que simula un emparejamiento exitoso.
                        </Text>
                    </View>
                    <Text style={styles.optionArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.optionCard, styles.realDeviceCard]}
                    onPress={() => setMode('real_device_ap')}
                >
                    <Text style={styles.optionIcon}>📡</Text>
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Modo AP (Simulado)</Text>
                        <Text style={styles.optionDescription}>
                            Demostración del emparejamiento alternativo. Simula conexión directa al dispositivo.
                        </Text>
                    </View>
                    <Text style={styles.optionArrow}>→</Text>
                </TouchableOpacity>
            </View>

            {/* Test Device Options */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>🧪 Dispositivos de Prueba</Text>

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
            </View>
        </ScrollView>
    );

    const renderRealDevicePairing = (pairingMode: 'AP' | 'EZ') => (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>
                {pairingMode === 'EZ' ? '📶 Modo EZ (Simulado)' : '📡 Modo AP (Simulado)'}
            </Text>
            <Text style={styles.stepDescription}>
                {pairingMode === 'EZ'
                    ? 'Demostración del emparejamiento rápido para dispositivos Tuya'
                    : 'Demostración del emparejamiento alternativo para dispositivos especiales'
                }
            </Text>

            {/* Demo notification */}
            <View style={styles.demoNotification}>
                <Text style={styles.demoNotificationIcon}>🎭</Text>
                <View style={styles.demoNotificationContent}>
                    <Text style={styles.demoNotificationTitle}>Modo Demostración</Text>
                    <Text style={styles.demoNotificationText}>
                        Este proceso creará un dispositivo virtual que simula un emparejamiento exitoso.
                    </Text>
                </View>
            </View>

            {/* WiFi Configuration */}
            <View style={styles.configSection}>
                <Text style={styles.configTitle}>📶 Configuración WiFi</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Red WiFi (SSID):</Text>
                    <TextInput
                        style={styles.textInput}
                        value={wifiSSID}
                        onChangeText={setWifiSSID}
                        placeholder="Nombre de tu red WiFi"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {currentSSID && (
                        <Text style={styles.helperText}>
                            Red actual detectada: {currentSSID}
                        </Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Contraseña WiFi:</Text>
                    <TextInput
                        style={styles.textInput}
                        value={wifiPassword}
                        onChangeText={setWifiPassword}
                        placeholder="Contraseña de tu WiFi"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Tiempo límite (segundos):</Text>
                    <View style={styles.timeoutContainer}>
                        <TouchableOpacity
                            style={styles.timeoutButton}
                            onPress={() => setPairingTimeout(Math.max(30, pairingTimeout - 30))}
                        >
                            <Text style={styles.timeoutButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.timeoutValue}>{pairingTimeout}s</Text>
                        <TouchableOpacity
                            style={styles.timeoutButton}
                            onPress={() => setPairingTimeout(Math.min(300, pairingTimeout + 30))}
                        >
                            <Text style={styles.timeoutButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>
                    📋 Instrucciones {pairingMode === 'EZ' ? 'Modo EZ' : 'Modo AP'} (Simuladas)
                </Text>
                {pairingMode === 'EZ' ? (
                    <Text style={styles.instructionsText}>
                        En un escenario real:{'\n'}
                        1. El dispositivo estaría en modo de emparejamiento{'\n'}
                        2. El LED parpadearía rápidamente{'\n'}
                        3. Tu WiFi sería de 2.4GHz{'\n'}
                        4. El proceso tomaría 30-120 segundos{'\n\n'}
                        En esta demo:{'\n'}
                        • Se creará un dispositivo virtual{'\n'}
                        • Simula un emparejamiento exitoso
                    </Text>
                ) : (
                    <Text style={styles.instructionsText}>
                        En un escenario real:{'\n'}
                        1. El dispositivo estaría en modo AP{'\n'}
                        2. Te conectarías a su red WiFi{'\n'}
                        3. El dispositivo se uniría a tu red{'\n\n'}
                        En esta demo:{'\n'}
                        • Se simula todo el proceso{'\n'}
                        • Se crea un dispositivo virtual
                    </Text>
                )}
            </View>

            {/* Pairing Status */}
            {isPairing && (
                <View style={styles.pairingStatusCard}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.pairingStatusText}>{pairingProgress}</Text>
                    <Text style={styles.pairingSubText}>
                        Simulando proceso de emparejamiento...
                    </Text>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={stopPairing}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar Simulación</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Action Buttons */}
            {!isPairing && (
                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        (!wifiSSID.trim() || !wifiPassword.trim()) && styles.buttonDisabled
                    ]}
                    onPress={() => startRealDevicePairing(pairingMode)}
                    disabled={!wifiSSID.trim() || !wifiPassword.trim()}
                >
                    <Text style={styles.primaryButtonText}>
                        🎭 Simular Emparejamiento {pairingMode}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Informational Cards */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>ℹ️ Sobre el Emparejamiento Real</Text>
                <Text style={styles.infoText}>
                    Para implementar emparejamiento real necesitas:
                    {'\n\n'}• SDK completo con clases de activación
                    {'\n'}• Permisos de ubicación en Android
                    {'\n'}• Configuración de red adecuada
                    {'\n'}• Dispositivos físicos Tuya compatibles
                </Text>
            </View>
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
                        if (isPairing) {
                            Alert.alert(
                                'Simulación en Progreso',
                                '¿Quieres cancelar la simulación de emparejamiento?',
                                [
                                    { text: 'Continuar', style: 'cancel' },
                                    { text: 'Cancelar', onPress: stopPairing }
                                ]
                            );
                            return;
                        }

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
            {mode === 'real_device_ez' && renderRealDevicePairing('EZ')}
            {mode === 'real_device_ap' && renderRealDevicePairing('AP')}
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

    // Warning and demo notifications
    warningCard: {
        backgroundColor: '#fff3e0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 25,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f57c00',
        marginBottom: 10,
    },
    warningText: {
        fontSize: 14,
        color: '#e65100',
        lineHeight: 20,
    },
    demoNotification: {
        backgroundColor: '#f3e5f5',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#9C27B0',
    },
    demoNotificationIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    demoNotificationContent: {
        flex: 1,
    },
    demoNotificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7B1FA2',
        marginBottom: 5,
    },
    demoNotificationText: {
        fontSize: 14,
        color: '#8E24AA',
        lineHeight: 18,
    },

    // Sections
    sectionContainer: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginLeft: 5,
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
    realDeviceCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#f44336',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginTop: 15,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
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
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        fontStyle: 'italic',
    },

    // Timeout Control
    timeoutContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeoutButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    timeoutButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    timeoutValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        minWidth: 60,
        textAlign: 'center',
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

    // Instructions
    instructionsCard: {
        backgroundColor: '#fff3e0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f57c00',
        marginBottom: 10,
    },
    instructionsText: {
        fontSize: 14,
        color: '#e65100',
        lineHeight: 22,
    },

    // Pairing Status
    pairingStatusCard: {
        backgroundColor: '#e8f5e8',
        borderRadius: 12,
        padding: 25,
        marginBottom: 20,
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    pairingStatusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginTop: 15,
        marginBottom: 5,
        textAlign: 'center',
    },
    pairingSubText: {
        fontSize: 14,
        color: '#388e3c',
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default AddDeviceScreen;
