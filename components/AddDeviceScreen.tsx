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
import type { TuyaDevice, TuyaHome, TuyaUser, PairingValidationResult, PairingResult } from '@/services/SmartLifeService';
import PairingProgressModal from '../components/PairingProgressModal';
import WiFiValidator from '../components/WifiValidator';

interface AddDeviceScreenProps {
    user: TuyaUser;
    home: TuyaHome;
    onDeviceAdded: (device: TuyaDevice) => void;
    onCancel: () => void;
}

type AddDeviceMode = 'selection' | 'test_device' | 'real_device_smart';
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
    const [currentPairingMode, setCurrentPairingMode] = useState<'EZ' | 'AP' | 'AUTO' | 'SMART' | null>(null);

    const [testDeviceName, setTestDeviceName] = useState('');
    const [testDeviceType, setTestDeviceType] = useState<TestDeviceType>('switch');
    const [isTestDeviceOnline, setIsTestDeviceOnline] = useState(true);

    const [wifiSSID, setWifiSSID] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');
    const [currentSSID, setCurrentSSID] = useState('');
    const [pairingTimeout, setPairingTimeout] = useState(120);

    const [isWifiValid, setIsWifiValid] = useState(false);
    const [wifiErrors, setWifiErrors] = useState<string[]>([]);
    const [wifiWarnings, setWifiWarnings] = useState<string[]>([]);

    const [lastValidation, setLastValidation] = useState<PairingValidationResult | null>(null);

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

    const handleWiFiValidationChange = useCallback((isValid: boolean, errors: string[], warnings: string[]) => {
        setIsWifiValid(isValid);
        setWifiErrors(errors);
        setWifiWarnings(warnings);
    }, []);

    const startRealDevicePairing = useCallback(async (pairingMode: 'EZ' | 'AP') => {
        try {
            if (!wifiSSID.trim()) {
                Alert.alert('Error', 'Por favor ingresa el nombre de tu red WiFi');
                return;
            }

            if (!wifiPassword.trim()) {
                Alert.alert('Error', 'Por favor ingresa la contraseña de tu WiFi');
                return;
            }

            if (!isWifiValid && wifiErrors.length > 0) {
                Alert.alert(
                    'Configuración WiFi Inválida',
                    `Se encontraron problemas críticos:\n\n${wifiErrors.join('\n')}\n\nPor favor corrige estos problemas antes de continuar.`
                );
                return;
            }

            if (wifiWarnings.length > 0) {
                const shouldContinue = await new Promise<boolean>((resolve) => {
                    Alert.alert(
                        'Advertencias de WiFi',
                        `Se detectaron advertencias:\n\n${wifiWarnings.join('\n')}\n\n¿Quieres continuar de todos modos?`,
                        [
                            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
                            { text: 'Continuar', onPress: () => resolve(true) }
                        ]
                    );
                });

                if (!shouldContinue) return;
            }

            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                Alert.alert(
                    'Permiso Requerido',
                    'El permiso de ubicación es necesario para el emparejamiento de dispositivos.'
                );
                return;
            }

            setIsPairing(true);
            setCurrentPairingMode(pairingMode);
            setPairingProgress('Validando condiciones de emparejamiento...');

            console.log(`Starting ENHANCED ${pairingMode} mode pairing:`, {
                homeId: home.homeId,
                ssid: wifiSSID.substring(0, 8) + '...',
                passwordLength: wifiPassword.length,
                timeout: pairingTimeout
            });

            try {
                let pairedDevice: TuyaDevice;

                if (pairingMode === 'EZ') {
                    setPairingProgress('Iniciando modo EZ optimizado...');
                    pairedDevice = await SmartLifeService.startDevicePairingEZ(
                        home.homeId,
                        wifiSSID,
                        wifiPassword,
                        pairingTimeout
                    );
                } else {
                    setPairingProgress('Iniciando modo AP optimizado...');
                    pairedDevice = await SmartLifeService.startDevicePairingAP(
                        home.homeId,
                        wifiSSID,
                        wifiPassword,
                        pairingTimeout
                    );
                }

                Alert.alert(
                    '¡Dispositivo Emparejado! 🎉',
                    `El dispositivo "${pairedDevice.name}" ha sido emparejado exitosamente usando modo ${pairingMode}.\n\n` +
                    `• ID: ${pairedDevice.devId}\n` +
                    `• Estado: ${pairedDevice.isOnline ? 'En línea ✅' : 'Desconectado ❌'}\n` +
                    `• Funciones: ${pairedDevice.supportedFunctions?.length || 0}\n\n` +
                    `El dispositivo ya está disponible en tu hogar.`,
                    [
                        {
                            text: 'Ver Dispositivo',
                            onPress: () => {
                                onDeviceAdded(pairedDevice);
                            }
                        }
                    ]
                );

            } catch (pairingError) {
                console.error('Enhanced device pairing failed:', pairingError);

                try {
                    await SmartLifeService.stopDevicePairing();
                } catch (stopError) {
                    console.warn('Error stopping pairing:', stopError);
                }

                const errorMessage = (pairingError as Error).message;

                let userFriendlyMessage = 'No se pudo emparejar el dispositivo.';
                let suggestions: string[] = [];
                let actions: Array<{text: string, onPress?: () => void}> = [];

                if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
                    userFriendlyMessage = 'El emparejamiento se agotó el tiempo de espera.';
                    suggestions = [
                        'Verifica que el dispositivo esté en modo de emparejamiento',
                        'Acerca el dispositivo al router WiFi (menos de 3 metros)',
                        'Asegúrate de que la red WiFi sea estable',
                        'Reinicia el dispositivo y vuelve a intentar'
                    ];
                    actions = [
                        { text: 'Reintentar', onPress: () => startRealDevicePairing(pairingMode) },
                        { text: 'Probar Otro Modo', onPress: () => {
                                const otherMode = pairingMode === 'EZ' ? 'AP' : 'EZ';
                                startRealDevicePairing(otherMode);
                            }},
                        { text: 'Emparejamiento Inteligente', onPress: startSmartDevicePairing },
                        { text: 'Cancelar' }
                    ];
                } else if (errorMessage.includes('password') || errorMessage.includes('PASSWORD')) {
                    userFriendlyMessage = 'Error de contraseña WiFi.';
                    suggestions = [
                        'Verifica que la contraseña WiFi sea correcta',
                        'Asegúrate de no tener espacios extra al inicio o final',
                        'Distingue entre mayúsculas y minúsculas',
                        'Verifica caracteres especiales'
                    ];
                    actions = [
                        { text: 'Corregir Contraseña' },
                        { text: 'Reintentar', onPress: () => startRealDevicePairing(pairingMode) }
                    ];
                } else if (errorMessage.includes('network') || errorMessage.includes('NETWORK')) {
                    userFriendlyMessage = 'Error de conectividad de red.';
                    suggestions = [
                        'Verifica que tu teléfono esté conectado a WiFi',
                        'Asegúrate de usar una red de 2.4GHz (no 5GHz)',
                        'Revisa que el router esté funcionando correctamente',
                        'Desactiva temporalmente el firewall del router'
                    ];
                    actions = [
                        { text: 'Verificar Red', onPress: getCurrentWiFiSSID },
                        { text: 'Probar Modo AP', onPress: () => startRealDevicePairing('AP') },
                        { text: 'Cancelar' }
                    ];
                } else if (errorMessage.includes('device') || errorMessage.includes('DEVICE')) {
                    userFriendlyMessage = 'El dispositivo no responde.';
                    suggestions = [
                        'Reinicia el dispositivo y ponlo en modo de emparejamiento',
                        'Verifica que el LED parpadee correctamente',
                        'Consulta el manual del dispositivo',
                        'Asegúrate de que sea compatible con Tuya/Smart Life'
                    ];
                    actions = [
                        { text: 'Reintentar', onPress: () => startRealDevicePairing(pairingMode) },
                        { text: 'Probar Otro Modo', onPress: () => {
                                const otherMode = pairingMode === 'EZ' ? 'AP' : 'EZ';
                                startRealDevicePairing(otherMode);
                            }},
                        { text: 'Cancelar'}
                    ];
                } else {
                    suggestions = [
                        'Reinicia la aplicación e intenta nuevamente',
                        'Verifica tu conexión a internet',
                        'Contacta soporte si el problema persiste'
                    ];
                    actions = [
                        { text: 'Reintentar', onPress: () => startRealDevicePairing(pairingMode) },
                        { text: 'Emparejamiento Inteligente', onPress: startSmartDevicePairing },
                        { text: 'Cancelar'}
                    ];
                }

                const alertMessage = `${userFriendlyMessage}\n\n` +
                    `Error técnico: ${errorMessage}\n\n` +
                    `Sugerencias:\n${suggestions.map(s => `• ${s}`).join('\n')}`;

                Alert.alert(
                    `Error de Emparejamiento ${pairingMode}`,
                    alertMessage,
                    actions
                );
            }

        } catch (error) {
            console.error('Error starting enhanced device pairing:', error);
            Alert.alert(
                'Error',
                `Error al iniciar el emparejamiento:\n${(error as Error).message}`
            );
        } finally {
            setIsPairing(false);
            setCurrentPairingMode(null);
            setPairingProgress('');
        }
    }, [wifiSSID, wifiPassword, pairingTimeout, home.homeId, onDeviceAdded, requestLocationPermission, isWifiValid, wifiErrors, wifiWarnings, getCurrentWiFiSSID]);

    const startSmartDevicePairing = useCallback(async () => {
        try {
            if (!wifiSSID.trim() || !wifiPassword.trim()) {
                Alert.alert('Error', 'Por favor completa todos los campos');
                return;
            }

            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                Alert.alert('Permiso Requerido', 'El permiso de ubicación es necesario.');
                return;
            }

            Alert.alert(
                '🤖 Emparejamiento Inteligente',
                'El sistema analizará tu red y dispositivo para usar automáticamente el mejor método de emparejamiento.\n\n' +
                '• Análisis automático de red\n' +
                '• Selección inteligente de modo\n' +
                '• Reintentos adaptativos\n' +
                '• Fallback automático\n\n' +
                '¿Quieres continuar?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Iniciar Emparejamiento Inteligente',
                        onPress: async () => {
                            setIsPairing(true);
                            setCurrentPairingMode('SMART');
                            setPairingProgress('Analizando red y dispositivo...');

                            try {
                                const result: PairingResult = await SmartLifeService.smartDevicePairing(
                                    home.homeId,
                                    wifiSSID,
                                    wifiPassword,
                                    {
                                        timeout: pairingTimeout,
                                        maxRetries: 2,
                                        autoFallback: true,
                                        onProgress: (step: string) => {
                                            setPairingProgress(step);
                                        }
                                    }
                                );

                                if (result.success && result.device) {
                                    Alert.alert(
                                        '🎉 ¡Emparejamiento Inteligente Exitoso!',
                                        `El dispositivo "${result.device.name}" ha sido emparejado exitosamente.\n\n` +
                                        `• Modo usado: ${result.mode}\n` +
                                        `• Intentos: ${result.attempts}\n` +
                                        `• Tiempo: ${Math.round((result.duration || 0) / 1000)}s\n\n` +
                                        `El sistema seleccionó automáticamente el método óptimo para tu configuración.`,
                                        [{ text: 'Ver Dispositivo', onPress: () => onDeviceAdded(result.device!) }]
                                    );
                                } else {
                                    throw new Error(result.error || 'Emparejamiento inteligente falló');
                                }

                            } catch (error) {
                                console.error('Smart pairing failed:', error);
                                Alert.alert(
                                    '❌ Emparejamiento Inteligente Falló',
                                    `No se pudo emparejar el dispositivo automáticamente:\n\n${(error as Error).message}\n\n` +
                                    `Puedes intentar manualmente con modo EZ o AP, o verificar la configuración del dispositivo.`,
                                    [
                                        { text: 'Modo EZ Manual', onPress: () => startRealDevicePairing('EZ') },
                                        { text: 'Modo AP Manual', onPress: () => startRealDevicePairing('AP') },
                                        { text: 'Cancelar', style: 'cancel' }
                                    ]
                                );
                            } finally {
                                setIsPairing(false);
                                setCurrentPairingMode(null);
                                setPairingProgress('');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error in smart pairing:', error);
            Alert.alert('Error', `Error en emparejamiento inteligente: ${(error as Error).message}`);
            setIsPairing(false);
            setCurrentPairingMode(null);
            setPairingProgress('');
        }
    }, [wifiSSID, wifiPassword, pairingTimeout, home.homeId, onDeviceAdded, requestLocationPermission, startRealDevicePairing]);

    const stopPairing = useCallback(async () => {
        try {
            await SmartLifeService.stopDevicePairing();
            setIsPairing(false);
            setCurrentPairingMode(null);
            setPairingProgress('');
            Alert.alert('Emparejamiento Cancelado', 'El proceso de emparejamiento ha sido cancelado.');
        } catch (error) {
            console.error('Error stopping pairing:', error);
        }
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

    const renderModeSelection = () => (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>Agregar Dispositivo</Text>
            <Text style={styles.stepDescription}>
                Elige el tipo de dispositivo que quieres agregar a "{home.name}"
            </Text>



            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>🏠 Dispositivos Reales</Text>

                <TouchableOpacity
                    style={[styles.optionCard, styles.smartDeviceCard]}
                    onPress={() => setMode('real_device_smart')}
                >
                    <Text style={styles.optionIcon}>🤖</Text>
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Emparejamiento Inteligente</Text>
                        <Text style={styles.optionDescription}>
                            IA que analiza tu red y selecciona automáticamente el mejor método. Recomendado para todos.
                        </Text>
                    </View>
                    <Text style={styles.optionArrow}>→</Text>
                </TouchableOpacity>
            </View>

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
            </View>
        </ScrollView>
    );

    const renderRealDevicePairing = (pairingMode: 'SMART') => (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>🤖 Emparejamiento Inteligente</Text>
            <Text style={styles.stepDescription}>
                IA que analiza tu configuración y selecciona automáticamente el método óptimo
            </Text>


            <WiFiValidator
                ssid={wifiSSID}
                password={wifiPassword}
                homeId={home.homeId}
                timeout={pairingTimeout}
                mode={pairingMode}
                onValidationChange={handleWiFiValidationChange}
                style={styles.wifiValidator}
            />

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

            {!isPairing && (
                <>
                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            styles.smartButton,
                            (!wifiSSID.trim() || !wifiPassword.trim()) && styles.buttonDisabled
                        ]}
                        onPress={startSmartDevicePairing}
                        disabled={!wifiSSID.trim() || !wifiPassword.trim()}
                    >
                        <Text style={styles.primaryButtonText}>
                            🤖 Iniciar Emparejamiento Inteligente
                        </Text>
                    </TouchableOpacity>
                </>
            )}
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

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (isPairing) {
                            Alert.alert(
                                'Emparejamiento en Progreso',
                                '¿Quieres cancelar el emparejamiento?',
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

            {mode === 'selection' && renderModeSelection()}
            {mode === 'test_device' && renderTestDevice()}
            {mode === 'real_device_smart' && renderRealDevicePairing('SMART')}

            <PairingProgressModal
                visible={isPairing}
                mode={currentPairingMode}
                progress={pairingProgress}
                onCancel={stopPairing}
                canCancel={true}
            />
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
    realPairingCard: {
        backgroundColor: '#e8f5e8',
        borderRadius: 12,
        padding: 20,
        marginBottom: 25,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    realPairingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 10,
    },
    realPairingText: {
        fontSize: 14,
        color: '#388e3c',
        lineHeight: 20,
    },
    realDeviceNotification: {
        backgroundColor: '#e8f5e8',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    realDeviceNotificationIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    realDeviceNotificationContent: {
        flex: 1,
    },
    realDeviceNotificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 5,
    },
    realDeviceNotificationText: {
        fontSize: 14,
        color: '#388e3c',
        lineHeight: 18,
    },
    wifiValidator: {
        marginBottom: 20,
    },
    smartDeviceCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#9C27B0',
        backgroundColor: '#fce4ec',
    },
    smartButton: {
        backgroundColor: '#9C27B0',
    },
    alternativeMethodsContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    alternativeMethodsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#495057',
        marginBottom: 10,
        textAlign: 'center',
    },
    alternativeMethodsButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    alternativeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    ezButton: {
        backgroundColor: '#4CAF50',
    },
    apButton: {
        backgroundColor: '#2196F3',
    },
    alternativeButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
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
    buttonDisabled: {
        opacity: 0.6,
    },
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
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
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
});

export default AddDeviceScreen;
