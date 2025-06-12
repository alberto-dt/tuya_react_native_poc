import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Switch,
} from 'react-native';

import SmartLifeService from '../services/SmartLifeService';
import type { TuyaHome, TuyaUser } from '@/services/SmartLifeService';

interface AddHomeScreenProps {
    user: TuyaUser;
    onHomeCreated: (home: TuyaHome) => void;
    onCancel: () => void;
}

const AddHomeScreen: React.FC<AddHomeScreenProps> = ({
                                                         user,
                                                         onHomeCreated,
                                                         onCancel,
                                                     }) => {
    const [homeName, setHomeName] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
    const [customLat, setCustomLat] = useState<string>('');
    const [customLon, setCustomLon] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);

    const validateForm = (): boolean => {
        if (!homeName.trim()) {
            Alert.alert('Error', 'Por favor ingresa el nombre del hogar');
            return false;
        }

        if (homeName.trim().length < 2) {
            Alert.alert('Error', 'El nombre del hogar debe tener al menos 2 caracteres');
            return false;
        }

        if (!address.trim()) {
            Alert.alert('Error', 'Por favor ingresa la dirección o ciudad');
            return false;
        }

        if (!useCurrentLocation) {
            const lat = parseFloat(customLat);
            const lon = parseFloat(customLon);

            if (isNaN(lat) || isNaN(lon)) {
                Alert.alert('Error', 'Por favor ingresa coordenadas válidas');
                return false;
            }

            if (lat < -90 || lat > 90) {
                Alert.alert('Error', 'La latitud debe estar entre -90 y 90');
                return false;
            }

            if (lon < -180 || lon > 180) {
                Alert.alert('Error', 'La longitud debe estar entre -180 y 180');
                return false;
            }
        }

        return true;
    };

    const getCurrentLocation = useCallback(async () => {
        try {
            setIsGettingLocation(true);
            const location = await SmartLifeService.getCurrentLocation();
            setCustomLat(location.lat.toString());
            setCustomLon(location.lon.toString());
            Alert.alert(
                'Ubicación Obtenida',
                `Lat: ${location.lat.toFixed(4)}\nLon: ${location.lon.toFixed(4)}`
            );
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(
                'Error de Ubicación',
                'No se pudo obtener la ubicación actual. Se usará una ubicación por defecto.'
            );
        } finally {
            setIsGettingLocation(false);
        }
    }, []);

    const handleCreateHome = useCallback(async () => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);

            let lat = 0;
            let lon = 0;

            if (useCurrentLocation) {
                const location = await SmartLifeService.getCurrentLocation();
                lat = location.lat;
                lon = location.lon;
            } else {
                lat = parseFloat(customLat);
                lon = parseFloat(customLon);
            }

            const newHome = await SmartLifeService.createHome({
                name: homeName.trim(),
                geoName: address.trim(),
                lat,
                lon,
            });

            Alert.alert(
                '¡Hogar Creado! 🎉',
                `El hogar "${newHome.name}" ha sido creado exitosamente.\n\n` +
                `Ubicación: ${newHome.geoName}\n` +
                `Coordenadas: ${newHome.lat.toFixed(4)}, ${newHome.lon.toFixed(4)}`,
                [
                    {
                        text: 'Continuar',
                        onPress: () => onHomeCreated(newHome)
                    }
                ]
            );

        } catch (error) {
            console.error('Error creating home:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

            Alert.alert(
                'Error al Crear Hogar',
                `No se pudo crear el hogar:\n${errorMessage}\n\n` +
                'Verifica tu conexión a internet e intenta nuevamente.'
            );
        } finally {
            setIsLoading(false);
        }
    }, [homeName, address, useCurrentLocation, customLat, customLon, onHomeCreated]);

    const handleCancel = useCallback(() => {
        if (homeName || address) {
            Alert.alert(
                'Cancelar Creación',
                '¿Estás seguro que quieres cancelar? Se perderán los datos ingresados.',
                [
                    { text: 'Continuar Editando', style: 'cancel' },
                    { text: 'Cancelar', style: 'destructive', onPress: onCancel }
                ]
            );
        } else {
            onCancel();
        }
    }, [homeName, address, onCancel]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Creando hogar...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleCancel}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Agregar Hogar</Text>
                    <Text style={styles.subtitle}>Nuevo hogar para {user.username || user.email}</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nombre del Hogar *</Text>
                        <TextInput
                            style={styles.input}
                            value={homeName}
                            onChangeText={setHomeName}
                            placeholder="Ej: Mi Casa, Oficina, Departamento"
                            maxLength={50}
                            returnKeyType="next"
                            autoCapitalize="words"
                        />
                        <Text style={styles.charCount}>{homeName.length}/50</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Dirección o Ciudad *</Text>
                        <TextInput
                            style={styles.input}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Ej: Quito, Ecuador"
                            maxLength={100}
                            returnKeyType="next"
                            autoCapitalize="words"
                        />
                        <Text style={styles.charCount}>{address.length}/100</Text>
                    </View>

                    <View style={styles.locationContainer}>
                        <Text style={styles.sectionTitle}>📍 Ubicación</Text>

                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>Usar ubicación actual</Text>
                            <Switch
                                value={useCurrentLocation}
                                onValueChange={setUseCurrentLocation}
                                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                                thumbColor={useCurrentLocation ? '#2e7d32' : '#f4f3f4'}
                            />
                        </View>

                        {!useCurrentLocation && (
                            <>
                                <View style={styles.coordinatesContainer}>
                                    <View style={styles.coordinateInput}>
                                        <Text style={styles.label}>Latitud</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={customLat}
                                            onChangeText={setCustomLat}
                                            placeholder="-0.1807"
                                            keyboardType="numeric"
                                            returnKeyType="next"
                                        />
                                    </View>
                                    <View style={styles.coordinateInput}>
                                        <Text style={styles.label}>Longitud</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={customLon}
                                            onChangeText={setCustomLon}
                                            placeholder="-78.4678"
                                            keyboardType="numeric"
                                            returnKeyType="done"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.locationButton}
                                    onPress={getCurrentLocation}
                                    disabled={isGettingLocation}
                                >
                                    {isGettingLocation ? (
                                        <ActivityIndicator size="small" color="#4CAF50" />
                                    ) : (
                                        <Text style={styles.locationButtonText}>
                                            📍 Obtener Ubicación Actual
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={styles.locationInfo}>
                            <Text style={styles.locationInfoText}>
                                💡 La ubicación se usa para funciones como automatizaciones basadas en ubicación y clima.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Botones */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateHome}
                        disabled={isLoading}
                    >
                        <Text style={styles.createButtonText}>
                            🏠 Crear Hogar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        disabled={isLoading}
                    >
                        <Text style={styles.cancelButtonText}>
                            Cancelar
                        </Text>
                    </TouchableOpacity>
                </View>
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
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    placeholder: {
        width: 40,
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
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    charCount: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    locationContainer: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 20,
        marginTop: 10,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    coordinatesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    coordinateInput: {
        flex: 1,
        marginHorizontal: 5,
    },
    locationButton: {
        backgroundColor: '#e8f5e8',
        borderWidth: 1,
        borderColor: '#4CAF50',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 15,
    },
    locationButtonText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
    },
    locationInfo: {
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        padding: 12,
    },
    locationInfoText: {
        fontSize: 12,
        color: '#1976d2',
        lineHeight: 16,
    },
    buttonContainer: {
        marginTop: 20,
    },
    createButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    cancelButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
});

export default AddHomeScreen;
