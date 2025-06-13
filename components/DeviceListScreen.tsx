import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    Switch,
    Modal,
} from 'react-native';

import SmartLifeService from '../services/SmartLifeService';
import type { TuyaDevice, TuyaHome, TuyaUser } from '../services/SmartLifeService';

interface DeviceListScreenProps {
    user: TuyaUser;
    home: TuyaHome;
    onLogout: () => void;
    onBackToHomes: () => void;
    onAddDevice?: () => void;
}

const DeviceListScreen: React.FC<DeviceListScreenProps> = ({
                                                               user,
                                                               home,
                                                               onLogout,
                                                               onBackToHomes,
                                                               onAddDevice,
                                                           }) => {
    const [devices, setDevices] = useState<TuyaDevice[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<TuyaDevice | null>(null);
    const [isDeviceModalVisible, setIsDeviceModalVisible] = useState<boolean>(false);
    const [controllingDevices, setControllingDevices] = useState<Set<string>>(new Set());

    const loadDevices = useCallback(async (isRefresh: boolean = false) => {
        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            console.log('Loading devices for home:', home.homeId);
            const deviceList = await SmartLifeService.getDeviceList(home.homeId);

            console.log('Devices loaded:', deviceList);
            setDevices(deviceList);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            console.error('Error loading devices:', err);
            setError(`Error al cargar dispositivos: ${errorMessage}`);

            Alert.alert(
                'Error',
                `No se pudieron cargar los dispositivos:\n${errorMessage}\n\n¿Quieres intentar nuevamente?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Reintentar', onPress: () => loadDevices(false) }
                ]
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [home.homeId]);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    const handleDevicePress = useCallback((device: TuyaDevice) => {
        setSelectedDevice(device);
        setIsDeviceModalVisible(true);
    }, []);

    const handleSwitchToggle = useCallback(async (device: TuyaDevice, switchNumber: number = 1) => {
        try {
            setControllingDevices(prev => new Set(prev).add(device.devId));

            const currentState = device.status?.[`switch_${switchNumber}`] || false;
            const newState = !currentState;

            console.log(`Toggling switch_${switchNumber} for device ${device.name}: ${currentState} -> ${newState}`);

            const command = { [`switch_${switchNumber}`]: newState };
            await SmartLifeService.controlDevice(device.devId, command);

            setDevices(prevDevices =>
                prevDevices.map(d =>
                    d.devId === device.devId
                        ? {
                            ...d,
                            status: {
                                ...d.status,
                                [`switch_${switchNumber}`]: newState
                            }
                        }
                        : d
                )
            );

            console.log(`Switch ${switchNumber} toggled successfully`);

        } catch (error) {
            console.error('Error controlling device:', error);
            Alert.alert(
                'Error de Control',
                `No se pudo controlar el dispositivo: ${(error as Error).message}`
            );
        } finally {
            setControllingDevices(prev => {
                const newSet = new Set(prev);
                newSet.delete(device.devId);
                return newSet;
            });
        }
    }, []);

    const handleRefresh = useCallback(() => {
        loadDevices(true);
    }, [loadDevices]);

    const handleLogout = useCallback(async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: onLogout
                }
            ]
        );
    }, [onLogout]);

    const getDeviceIcon = useCallback((category: string = '', productName: string = '') => {
        const cat = category.toLowerCase();
        const prod = productName.toLowerCase();

        if (cat.includes('switch') || prod.includes('switch') || prod.includes('plug')) return '🔌';
        if (cat.includes('light') || prod.includes('light') || prod.includes('bulb')) return '💡';
        if (cat.includes('sensor') || prod.includes('sensor')) return '📡';
        if (cat.includes('camera') || prod.includes('camera')) return '📷';
        if (cat.includes('door') || prod.includes('door')) return '🚪';
        if (cat.includes('curtain') || prod.includes('curtain')) return '🪟';
        if (cat.includes('fan') || prod.includes('fan')) return '🌀';
        if (cat.includes('thermostat') || prod.includes('thermostat')) return '🌡️';
        return '📱';
    }, []);

    const getDeviceType = useCallback((device: TuyaDevice) => {
        if (device.category) return device.category;
        if (device.productName) return device.productName;
        if (device.productId) return device.productId;
        return 'Dispositivo';
    }, []);

    const isSwitch = useCallback((device: TuyaDevice) => {
        return device.supportedFunctions?.includes('switch_1') ||
            device.status?.hasOwnProperty('switch_1') ||
            false;
    }, []);

    const getSwitchState = useCallback((device: TuyaDevice, switchNumber: number = 1) => {
        return device.status?.[`switch_${switchNumber}`] || false;
    }, []);

    const DeviceCard: React.FC<{ device: TuyaDevice }> = ({ device }) => {
        const deviceIcon = getDeviceIcon(device.category, device.productName);
        const deviceType = getDeviceType(device);
        const hasSwitch = isSwitch(device);
        const switchState = getSwitchState(device, 1);
        const isControlling = controllingDevices.has(device.devId);

        return (
            <TouchableOpacity
                style={[
                    styles.deviceCard,
                    !device.isOnline && styles.deviceCardOffline
                ]}
                onPress={() => handleDevicePress(device)}
                activeOpacity={0.7}
            >
                <View style={styles.deviceHeader}>
                    <View style={styles.deviceInfo}>
                        <View style={styles.deviceTitleRow}>
                            <Text style={styles.deviceIcon}>{deviceIcon}</Text>
                            <View style={styles.deviceTitleInfo}>
                                <Text style={styles.deviceName}>{device.name}</Text>
                                <Text style={styles.deviceProduct}>{deviceType}</Text>
                            </View>
                        </View>
                        <Text style={styles.deviceId}>
                            ID: {device.devId.length > 12 ? device.devId.substring(0, 12) + '...' : device.devId}
                        </Text>
                    </View>

                    <View style={styles.deviceControls}>
                        <View style={styles.deviceStatus}>
                            <View style={[
                                styles.statusIndicator,
                                device.isOnline ? styles.statusOnline : styles.statusOffline
                            ]} />
                            <Text style={[
                                styles.statusText,
                                device.isOnline ? styles.statusTextOnline : styles.statusTextOffline
                            ]}>
                                {device.isOnline ? 'En línea' : 'Desconectado'}
                            </Text>
                        </View>

                        {hasSwitch && device.isOnline && (
                            <View style={styles.switchControl}>
                                <Text style={styles.switchLabel}>
                                    {switchState ? 'Encendido' : 'Apagado'}
                                </Text>
                                <Switch
                                    value={switchState}
                                    onValueChange={() => handleSwitchToggle(device, 1)}
                                    disabled={isControlling}
                                    trackColor={{ false: '#ccc', true: '#4CAF50' }}
                                    thumbColor={switchState ? '#2e7d32' : '#f4f3f4'}
                                />
                            </View>
                        )}

                        {isControlling && (
                            <ActivityIndicator size="small" color="#FF9800" style={styles.controllingIndicator} />
                        )}
                    </View>
                </View>

                {device.supportedFunctions && device.supportedFunctions.length > 0 && (
                    <View style={styles.functionsContainer}>
                        <Text style={styles.functionsTitle}>Funciones:</Text>
                        <View style={styles.functionsList}>
                            {device.supportedFunctions.slice(0, 3).map((func, index) => (
                                <Text key={index} style={styles.functionTag}>
                                    {func}
                                </Text>
                            ))}
                            {device.supportedFunctions.length > 3 && (
                                <Text style={styles.functionTag}>
                                    +{device.supportedFunctions.length - 3}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.deviceFooter}>
                    <Text style={styles.tapHint}>Toca para más detalles →</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const DeviceModal: React.FC = () => {
        if (!selectedDevice) return null;

        return (
            <Modal
                visible={isDeviceModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsDeviceModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setIsDeviceModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{selectedDevice.name}</Text>
                        <View style={styles.modalPlaceholder} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>📱 Información del Dispositivo</Text>
                            <View style={styles.modalInfoCard}>
                                <Text style={styles.modalInfoItem}>Nombre: {selectedDevice.name}</Text>
                                <Text style={styles.modalInfoItem}>ID: {selectedDevice.devId}</Text>
                                {selectedDevice.productName && (
                                    <Text style={styles.modalInfoItem}>Producto: {selectedDevice.productName}</Text>
                                )}
                                {selectedDevice.category && (
                                    <Text style={styles.modalInfoItem}>Categoría: {selectedDevice.category}</Text>
                                )}
                                {selectedDevice.productId && (
                                    <Text style={styles.modalInfoItem}>Product ID: {selectedDevice.productId}</Text>
                                )}
                                <Text style={styles.modalInfoItem}>
                                    Estado: {selectedDevice.isOnline ? '🟢 En línea' : '🔴 Desconectado'}
                                </Text>
                            </View>
                        </View>

                        {selectedDevice.supportedFunctions && selectedDevice.supportedFunctions.length > 0 && (
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>⚙️ Funciones Soportadas</Text>
                                <View style={styles.modalFunctionsList}>
                                    {selectedDevice.supportedFunctions.map((func, index) => (
                                        <View key={index} style={styles.modalFunctionItem}>
                                            <Text style={styles.modalFunctionText}>{func}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {selectedDevice.status && Object.keys(selectedDevice.status).length > 0 && (
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>📊 Estado Actual</Text>
                                <View style={styles.modalInfoCard}>
                                    {Object.entries(selectedDevice.status).map(([key, value]) => (
                                        <Text key={key} style={styles.modalInfoItem}>
                                            {key}: {JSON.stringify(value)}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>🛠️ Controles</Text>
                            <Text style={styles.modalInfoText}>
                                Los controles avanzados se implementarán próximamente.
                                {'\n\n'}Por ahora puedes usar el switch en la lista principal para dispositivos compatibles.
                            </Text>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        );
    };

    if (isLoading && !isRefreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#FF9800" />
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBackToHomes}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Dispositivos</Text>
                        <Text style={styles.subtitle}>{home.name}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutButtonText}>🚪</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF9800" />
                    <Text style={styles.loadingText}>Cargando dispositivos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF9800" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBackToHomes}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Dispositivos</Text>
                    <Text style={styles.subtitle}>{home.name}</Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutButtonText}>🚪</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={['#FF9800']}
                        tintColor="#FF9800"
                        title="Actualizando dispositivos..."
                    />
                }
            >
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>⚠️ Error</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => loadDevices(false)}
                        >
                            <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : devices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>📱 No hay dispositivos</Text>
                        <Text style={styles.emptyMessage}>
                            No se encontraron dispositivos en "{home.name}".{'\n\n'}
                            Para agregar dispositivos:
                            {'\n'}• Abre la app Smart Life
                            {'\n'}• Toca "+" para agregar dispositivo
                            {'\n'}• Sigue las instrucciones de emparejamiento
                            {'\n'}• Los dispositivos aparecerán automáticamente aquí
                        </Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => loadDevices(false)}
                        >
                            <Text style={styles.retryButtonText}>🔄 Actualizar</Text>
                        </TouchableOpacity>

                        {onAddDevice && (
                            <TouchableOpacity
                                style={styles.addDeviceButton}
                                onPress={onAddDevice}
                            >
                                <Text style={styles.addDeviceButtonText}>
                                    ➕ Agregar Primer Dispositivo
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <>
                        <View style={styles.statsContainer}>
                            <Text style={styles.statsText}>
                                📊 {devices.length} dispositivo{devices.length !== 1 ? 's' : ''} encontrado{devices.length !== 1 ? 's' : ''}
                            </Text>
                            <Text style={styles.statsSubText}>
                                🟢 {devices.filter(d => d.isOnline).length} en línea •
                                🔴 {devices.filter(d => !d.isOnline).length} desconectado{devices.filter(d => !d.isOnline).length !== 1 ? 's' : ''}
                            </Text>
                        </View>

                        {onAddDevice && (
                            <TouchableOpacity
                                style={styles.addDeviceButton}
                                onPress={onAddDevice}
                            >
                                <Text style={styles.addDeviceButtonText}>
                                    ➕ Agregar Nuevo Dispositivo
                                </Text>
                            </TouchableOpacity>
                        )}

                        {devices.map((device) => (
                            <DeviceCard key={device.devId} device={device} />
                        ))}

                        <View style={styles.footerInfo}>
                            <Text style={styles.footerText}>
                                💡 Tip: Desliza hacia abajo para actualizar • Toca los dispositivos para más detalles
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>

            <DeviceModal />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#FF9800',
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
        marginRight: 15,
    },
    backButtonText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
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
    logoutButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButtonText: {
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    statsContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
    },
    statsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF9800',
        marginBottom: 5,
    },
    statsSubText: {
        fontSize: 14,
        color: '#666',
    },
    deviceCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    deviceCardOffline: {
        borderLeftColor: '#f44336',
        opacity: 0.7,
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    deviceInfo: {
        flex: 1,
        marginRight: 15,
    },
    deviceTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    deviceIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    deviceTitleInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    deviceProduct: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    deviceId: {
        fontSize: 12,
        color: '#999',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    deviceControls: {
        alignItems: 'flex-end',
    },
    deviceStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusOnline: {
        backgroundColor: '#4CAF50',
    },
    statusOffline: {
        backgroundColor: '#f44336',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextOnline: {
        color: '#4CAF50',
    },
    statusTextOffline: {
        color: '#f44336',
    },
    switchControl: {
        alignItems: 'center',
    },
    switchLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    controllingIndicator: {
        marginTop: 5,
    },
    functionsContainer: {
        marginBottom: 10,
    },
    functionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    functionsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    functionTag: {
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        fontSize: 11,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 4,
    },
    deviceFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
        alignItems: 'center',
    },
    tapHint: {
        fontSize: 12,
        color: '#FF9800',
        fontWeight: '500',
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        borderRadius: 12,
        padding: 20,
        marginVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffcdd2',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#c62828',
        marginBottom: 10,
    },
    errorMessage: {
        fontSize: 14,
        color: '#d32f2f',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 15,
    },
    emptyContainer: {
        backgroundColor: '#fff3e0',
        borderRadius: 12,
        padding: 30,
        marginVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffcc02',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e65100',
        marginBottom: 15,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#f57c00',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#FF9800',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    footerInfo: {
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        padding: 15,
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#1976d2',
        textAlign: 'center',
        lineHeight: 16,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalHeader: {
        backgroundColor: '#FF9800',
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalCloseButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    modalTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginHorizontal: 15,
    },
    modalPlaceholder: {
        width: 40,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalSection: {
        marginBottom: 20,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalInfoCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    modalInfoItem: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        paddingVertical: 2,
    },
    modalInfoText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    modalFunctionsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    modalFunctionItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    modalFunctionText: {
        fontSize: 12,
        color: '#1976d2',
        fontWeight: '500',
    },
    addDeviceButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    addDeviceButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DeviceListScreen;
