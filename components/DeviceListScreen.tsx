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
} from 'react-native';

import SmartLifeService from '../services/SmartLifeService';
import type { TuyaDevice, TuyaHome, TuyaUser } from '@/services/SmartLifeService';

interface DeviceListScreenProps {
    user: TuyaUser;
    home: TuyaHome;
    onLogout: () => void;
    onBackToHomes: () => void;
}

const DeviceListScreen: React.FC<DeviceListScreenProps> = ({
                                                               user,
                                                               home,
                                                               onLogout,
                                                               onBackToHomes,
                                                           }) => {
    const [devices, setDevices] = useState<TuyaDevice[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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

            if (deviceList.length === 0) {
                setError('No se encontraron dispositivos en este hogar. Asegúrate de tener dispositivos configurados en la app Smart Life.');
            }

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
        Alert.alert(
            device.name,
            `Dispositivo: ${device.name}\n` +
            `ID: ${device.devId}\n` +
            `Estado: ${device.isOnline ? '🟢 En línea' : '🔴 Desconectado'}\n\n` +
            `Próximamente: Control detallado del dispositivo`,
            [
                { text: 'OK', style: 'cancel' }
            ]
        );
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

    const DeviceCard: React.FC<{ device: TuyaDevice }> = ({ device }) => (
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
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceId}>ID: {device.devId}</Text>
                </View>

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
            </View>

            {device.productId && (
                <Text style={styles.deviceProduct}>Producto: {device.productId}</Text>
            )}

            <View style={styles.deviceFooter}>
                <Text style={styles.tapHint}>Toca para más detalles →</Text>
            </View>
        </TouchableOpacity>
    );

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
                        </Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => loadDevices(false)}
                        >
                            <Text style={styles.retryButtonText}>🔄 Actualizar</Text>
                        </TouchableOpacity>
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

                        {devices.map((device) => (
                            <DeviceCard key={device.devId} device={device} />
                        ))}

                        <View style={styles.footerInfo}>
                            <Text style={styles.footerText}>
                                💡 Tip: Desliza hacia abajo para actualizar la lista
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
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
        marginBottom: 10,
    },
    deviceInfo: {
        flex: 1,
        marginRight: 10,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    deviceId: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    deviceStatus: {
        flexDirection: 'row',
        alignItems: 'center',
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
    deviceProduct: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
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
});

export default DeviceListScreen;
