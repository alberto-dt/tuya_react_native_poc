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
    Linking,
} from 'react-native';

import type { TuyaDevice, TuyaHome, TuyaUser } from '../services/SmartLifeService';

interface AddDeviceScreenProps {
    user: TuyaUser;
    home: TuyaHome;
    onDeviceAdded: (device: TuyaDevice) => void;
    onCancel: () => void;
}

const AddDeviceScreen: React.FC<AddDeviceScreenProps> = ({
                                                             user,
                                                             home,
                                                             onDeviceAdded,
                                                             onCancel,
                                                         }) => {
    const [step, setStep] = useState<'instructions' | 'waiting'>('instructions');

    const openSmartLifeApp = useCallback(() => {
        const smartLifeUrl = 'smartlife://';
        const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.tuya.smartlife';

        Linking.canOpenURL(smartLifeUrl).then(supported => {
            if (supported) {
                Linking.openURL(smartLifeUrl);
            } else {
                Linking.openURL(playStoreUrl);
            }
        }).catch(err => {
            console.error('Error opening Smart Life app:', err);
            Linking.openURL(playStoreUrl);
        });
    }, []);

    const handleRefreshDevices = useCallback(() => {
        setStep('waiting');

        setTimeout(() => {
            Alert.alert(
                'Actualización Completa',
                'Si agregaste un dispositivo en la app Smart Life, debería aparecer en tu lista de dispositivos al regresar.',
                [
                    {
                        text: 'Volver a Lista',
                        onPress: onCancel
                    }
                ]
            );
            setStep('instructions');
        }, 2000);
    }, [onCancel]);

    const renderInstructions = () => (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>📱 Agregar Dispositivo</Text>
            <Text style={styles.stepDescription}>
                Para agregar dispositivos a tu hogar "{home.name}", necesitas usar la app oficial Smart Life.
            </Text>

            <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>⚠️ Función en Desarrollo</Text>
                <Text style={styles.warningText}>
                    El emparejamiento directo desde esta app está siendo implementado.
                    Por ahora, usa la app oficial Smart Life para agregar dispositivos.
                </Text>
            </View>

            <View style={styles.instructionsSection}>
                <Text style={styles.instructionsTitle}>📋 Pasos para Agregar Dispositivo:</Text>
                <Text style={styles.instructionsText}>
                    1. 📲 Abre la app Smart Life (botón abajo)
                    {'\n'}2. 🏠 Selecciona el hogar "{home.name}"
                    {'\n'}3. ➕ Toca el botón "+" para agregar dispositivo
                    {'\n'}4. 🔍 Sigue las instrucciones de emparejamiento
                    {'\n'}5. ✅ Una vez agregado, regresa a esta app
                    {'\n'}6. 🔄 Actualiza la lista de dispositivos
                </Text>
            </View>

            <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>💡 Consejos Importantes:</Text>
                <Text style={styles.tipsText}>
                    • Asegúrate de estar conectado a WiFi de 2.4GHz
                    {'\n'}• Pon el dispositivo en modo emparejamiento
                    {'\n'}• Usa la misma cuenta en ambas apps
                    {'\n'}• Mantén el dispositivo cerca del router
                    {'\n'}• Verifica que el LED parpadee rápidamente
                </Text>
            </View>

            <TouchableOpacity
                style={styles.smartLifeButton}
                onPress={openSmartLifeApp}
            >
                <Text style={styles.smartLifeButtonText}>
                    📱 Abrir Smart Life App
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefreshDevices}
            >
                <Text style={styles.refreshButtonText}>
                    🔄 Actualizar Lista de Dispositivos
                </Text>
            </TouchableOpacity>

            <View style={styles.comingSoonSection}>
                <Text style={styles.comingSoonTitle}>🚀 Próximamente:</Text>
                <Text style={styles.comingSoonText}>
                    • Emparejamiento directo en la app
                    {'\n'}• Modo EZ y AP integrados
                    {'\n'}• Detección automática de WiFi
                    {'\n'}• Configuración avanzada de dispositivos
                </Text>
            </View>
        </ScrollView>
    );

    const renderWaiting = () => (
        <View style={styles.waitingContainer}>
            <Text style={styles.waitingTitle}>🔄 Actualizando...</Text>
            <Text style={styles.waitingText}>
                Buscando nuevos dispositivos en tu hogar "{home.name}"
            </Text>
            <View style={styles.waitingAnimation}>
                <Text style={styles.waitingDots}>⚡ ⚡ ⚡</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onCancel}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Agregar Dispositivo</Text>
                    <Text style={styles.subtitle}>{home.name}</Text>
                </View>
                <View style={styles.headerPlaceholder} />
            </View>

            {step === 'instructions' ? renderInstructions() : renderWaiting()}
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
        marginBottom: 20,
    },
    warningCard: {
        backgroundColor: '#fff3e0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    warningTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f57c00',
        marginBottom: 8,
    },
    warningText: {
        fontSize: 14,
        color: '#ef6c00',
        lineHeight: 20,
    },
    instructionsSection: {
        backgroundColor: '#e8f5e8',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    instructionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 12,
    },
    instructionsText: {
        fontSize: 14,
        color: '#388e3c',
        lineHeight: 22,
    },
    tipsSection: {
        backgroundColor: '#e3f2fd',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#2196f3',
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 12,
    },
    tipsText: {
        fontSize: 14,
        color: '#1565c0',
        lineHeight: 22,
    },
    smartLifeButton: {
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    smartLifeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    refreshButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    refreshButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    comingSoonSection: {
        backgroundColor: '#f3e5f5',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#9c27b0',
    },
    comingSoonTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7b1fa2',
        marginBottom: 12,
    },
    comingSoonText: {
        fontSize: 14,
        color: '#8e24aa',
        lineHeight: 22,
    },
    // Waiting styles
    waitingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    waitingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        textAlign: 'center',
        marginBottom: 15,
    },
    waitingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    waitingAnimation: {
        alignItems: 'center',
    },
    waitingDots: {
        fontSize: 32,
        color: '#4CAF50',
    },
});

export default AddDeviceScreen;
