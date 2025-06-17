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
import type { TuyaHome, TuyaUser } from '@/services/SmartLifeService';

interface HomeListScreenProps {
    user: TuyaUser;
    onLogout: () => void;
    onHomeSelected: (home: TuyaHome) => void;
    onAddHome: () => void;
}

const HomeListScreen: React.FC<HomeListScreenProps> = ({
                                                           user,
                                                           onLogout,
                                                           onHomeSelected,
                                                           onAddHome,
                                                       }) => {
    const [homes, setHomes] = useState<TuyaHome[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const loadHomes = useCallback(async (isRefresh: boolean = false) => {
        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            console.log('Loading homes...');
            const homeList = await SmartLifeService.getHomeList();

            console.log('Homes loaded:', homeList);
            setHomes(homeList);

            if (homeList.length === 0) {
                setError(null);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            console.error('Error loading homes:', err);
            setError(`Error al cargar hogares: ${errorMessage}`);

            Alert.alert(
                'Error',
                `No se pudieron cargar los hogares:\n${errorMessage}\n\n¿Quieres intentar nuevamente?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Reintentar', onPress: () => loadHomes(false) }
                ]
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const handleHomeCreated = useCallback((newHome: TuyaHome) => {
        setHomes(prev => [...prev, newHome]);
    }, []);

    React.useImperativeHandle(React.createRef(), () => ({
        reloadHomes: () => loadHomes(true)
    }), [loadHomes]);

    useEffect(() => {
        loadHomes();
    }, [loadHomes]);

    const handleHomePress = useCallback((home: TuyaHome) => {
        Alert.alert(
            'Seleccionar Hogar',
            `¿Quieres ver los dispositivos de "${home.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Ver Dispositivos',
                    onPress: () => {
                        console.log('Home selected:', home);
                        onHomeSelected(home);
                    }
                }
            ]
        );
    }, [onHomeSelected]);

    const handleRefresh = useCallback(() => {
        loadHomes(true);
    }, [loadHomes]);

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

    const handleAddHome = useCallback(() => {
        onAddHome();
    }, [onAddHome]);

    const HomeCard: React.FC<{ home: TuyaHome }> = ({ home }) => (
        <TouchableOpacity
            style={styles.homeCard}
            onPress={() => handleHomePress(home)}
            activeOpacity={0.7}
        >
            <View style={styles.homeHeader}>
                <Text style={styles.homeName}>{home.name}</Text>
                <Text style={styles.homeId}>ID: {home.homeId}</Text>
            </View>

            {home.geoName && (
                <Text style={styles.homeLocation}>📍 {home.geoName}</Text>
            )}

            {home.address && home.address !== home.geoName && (
                <Text style={styles.homeAddress}>{home.address}</Text>
            )}

            {(home.lat !== 0 || home.lon !== 0) && (
                <Text style={styles.homeCoordinates}>
                    🌐 {home.lat.toFixed(4)}, {home.lon.toFixed(4)}
                </Text>
            )}

            <View style={styles.homeFooter}>
                <Text style={styles.tapHint}>Toca para ver dispositivos →</Text>
            </View>
        </TouchableOpacity>
    );

    if (isLoading && !isRefreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
                <View style={styles.header}>
                    <Text style={styles.title}>Mis Hogares</Text>
                    <Text style={styles.subtitle}>Smart Life - {user.username || user.email}</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Cargando hogares...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.title}>Mis Hogares</Text>
                        <Text style={styles.subtitle}>Smart Life - {user.username || user.email}</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddHome}
                        >
                            <Text style={styles.addButtonText}>+</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Text style={styles.logoutButtonText}>🚪</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={['#4CAF50']}
                        tintColor="#4CAF50"
                        title="Actualizando hogares..."
                    />
                }
            >
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>⚠️ Error</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => loadHomes(false)}
                        >
                            <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : homes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>🏠 No hay hogares</Text>
                        <Text style={styles.emptyMessage}>
                            No tienes hogares configurados aún.{'\n\n'}
                            ¡Crea tu primer hogar para comenzar a agregar y controlar dispositivos inteligentes!
                        </Text>
                        <TouchableOpacity
                            style={styles.addHomeButton}
                            onPress={handleAddHome}
                        >
                            <Text style={styles.addHomeButtonText}>🏠 Crear Mi Primer Hogar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.statsContainer}>
                            <Text style={styles.statsText}>
                                📊 {homes.length} hogar{homes.length !== 1 ? 'es' : ''} encontrado{homes.length !== 1 ? 's' : ''}
                            </Text>
                        </View>

                        {homes.map((home) => (
                            <HomeCard key={home.homeId} home={home} />
                        ))}

                        <TouchableOpacity
                            style={styles.addMoreButton}
                            onPress={handleAddHome}
                        >
                            <Text style={styles.addMoreButtonText}>+ Agregar Otro Hogar</Text>
                        </TouchableOpacity>

                        <View style={styles.footerInfo}>
                            <Text style={styles.footerText}>
                                💡 Tip: Desliza hacia abajo para actualizar la lista • Toca + para agregar hogares
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
        backgroundColor: '#4CAF50',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    addButtonText: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
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
        fontSize: 18,
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
        color: '#4CAF50',
    },
    homeCard: {
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
    homeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    homeName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    homeId: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    homeLocation: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    homeAddress: {
        fontSize: 14,
        color: '#888',
        marginBottom: 5,
    },
    homeCoordinates: {
        fontSize: 12,
        color: '#999',
        marginBottom: 10,
    },
    homeFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
        alignItems: 'center',
    },
    tapHint: {
        fontSize: 14,
        color: '#4CAF50',
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
        backgroundColor: '#e8f5e8',
        borderRadius: 12,
        padding: 30,
        marginVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#c8e6c9',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 15,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#388e3c',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    addHomeButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingVertical: 15,
        paddingHorizontal: 30,
        marginTop: 10,
    },
    addHomeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    addMoreButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginVertical: 15,
    },
    addMoreButtonText: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: '600',
    },
    retryButton: {
        backgroundColor: '#4CAF50',
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
    },
});

export default HomeListScreen;
