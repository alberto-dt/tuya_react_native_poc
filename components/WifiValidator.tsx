import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';

import SmartLifeService from '../services/SmartLifeService';
import type { PairingValidationResult } from '../services/SmartLifeService';

interface WiFiValidatorProps {
    ssid: string;
    password: string;
    homeId?: number;
    timeout?: number;
    mode?: string;
    onValidationChange: (isValid: boolean, errors: string[], warnings: string[]) => void;
    style?: any;
}

interface ValidationState {
    isValidating: boolean;
    lastValidation: PairingValidationResult | null;
    validationTime: Date | null;
}

const WiFiValidator: React.FC<WiFiValidatorProps> = ({
                                                         ssid,
                                                         password,
                                                         homeId = 0,
                                                         timeout = 120,
                                                         mode = 'AUTO',
                                                         onValidationChange,
                                                         style
                                                     }) => {
    const [validationState, setValidationState] = useState<ValidationState>({
        isValidating: false,
        lastValidation: null,
        validationTime: null
    });

    const { isValidating, lastValidation, validationTime } = validationState;

    const validateConditions = useCallback(async () => {
        if (!ssid || !password) {
            onValidationChange(false, [], []);
            setValidationState(prev => ({
                ...prev,
                lastValidation: null,
                validationTime: null
            }));
            return;
        }

        try {
            setValidationState(prev => ({ ...prev, isValidating: true }));

            const validation = await SmartLifeService.validatePairingConditions(
                ssid, password, homeId, timeout, mode
            );

            setValidationState({
                isValidating: false,
                lastValidation: validation,
                validationTime: new Date()
            });

            onValidationChange(
                validation.canProceed,
                validation.errors || [],
                validation.warnings || []
            );

        } catch (error) {
            console.error('Error validating WiFi conditions:', error);

            const errorMessage = `Validation error: ${(error as Error).message}`;
            setValidationState({
                isValidating: false,
                lastValidation: null,
                validationTime: new Date()
            });

            onValidationChange(false, [errorMessage], []);
        }
    }, [ssid, password, homeId, timeout, mode, onValidationChange]);

    useEffect(() => {
        const timeoutId = setTimeout(validateConditions, 500);
        return () => clearTimeout(timeoutId);
    }, [validateConditions]);

    const handleManualValidation = useCallback(() => {
        validateConditions();
    }, [validateConditions]);

    const showDiagnostics = useCallback(async () => {
        try {
            const diagnostics = await SmartLifeService.runPairingDiagnostics();

            const statusIcon = {
                'excellent': '🟢',
                'good': '🟡',
                'fair': '🟠',
                'poor': '🔴'
            }[diagnostics.overall];

            Alert.alert(
                `${statusIcon} Diagnóstico de Red`,
                `Estado: ${diagnostics.overall.toUpperCase()}\n` +
                `Puntuación: ${diagnostics.score}/100\n\n` +
                `Red actual: ${diagnostics.networkInfo.currentSSID || 'No detectada'}\n` +
                `Tipo: ${diagnostics.networkInfo.detectedType || 'Desconocido'}\n\n` +
                `Recomendaciones:\n${diagnostics.recommendations.join('\n')}`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo ejecutar el diagnóstico');
        }
    }, []);

    const getValidationIcon = () => {
        if (isValidating) return '⏳';
        if (!lastValidation) return '❓';

        if (lastValidation.canProceed) {
            return lastValidation.warnings?.length > 0 ? '⚠️' : '✅';
        } else {
            return '❌';
        }
    };

    const getValidationStatus = () => {
        if (isValidating) return 'Validando...';
        if (!lastValidation) return 'Pendiente de validación';

        if (lastValidation.canProceed) {
            return lastValidation.warnings?.length > 0
                ? 'Listo con advertencias'
                : 'Listo para emparejamiento';
        } else {
            return 'Requiere correcciones';
        }
    };

    const getStatusColor = () => {
        if (isValidating) return '#FF9800';
        if (!lastValidation) return '#9E9E9E';

        if (lastValidation.canProceed) {
            return lastValidation.warnings?.length > 0 ? '#FF9800' : '#4CAF50';
        } else {
            return '#F44336';
        }
    };

    const renderValidationDetails = () => {
        if (!lastValidation) return null;

        return (
            <View style={styles.detailsContainer}>
                <View style={styles.networkInfo}>
                    <Text style={styles.networkTitle}>📶 Estado de Red</Text>
                    <Text style={styles.networkDetail}>
                        Actual: {lastValidation.currentSSID || 'No detectada'}
                    </Text>
                    <Text style={styles.networkDetail}>
                        Objetivo: {lastValidation.ssid}
                    </Text>
                    {lastValidation.alreadyOnTargetNetwork && (
                        <Text style={[styles.networkDetail, { color: '#4CAF50' }]}>
                            ✅ Ya conectado a la red objetivo
                        </Text>
                    )}
                </View>

                {lastValidation.errors && lastValidation.errors.length > 0 && (
                    <View style={styles.errorsContainer}>
                        <Text style={styles.errorsTitle}>❌ Errores</Text>
                        {lastValidation.errors.map((error, index) => (
                            <Text key={index} style={styles.errorText}>
                                • {error}
                            </Text>
                        ))}
                    </View>
                )}

                {lastValidation.warnings && lastValidation.warnings.length > 0 && (
                    <View style={styles.warningsContainer}>
                        <Text style={styles.warningsTitle}>⚠️ Advertencias</Text>
                        {lastValidation.warnings.map((warning, index) => (
                            <Text key={index} style={styles.warningText}>
                                • {warning}
                            </Text>
                        ))}
                    </View>
                )}

                {lastValidation.debugInfo && (
                    <View style={styles.debugContainer}>
                        <Text style={styles.debugTitle}>🔍 Información Técnica</Text>
                        <Text style={styles.debugText}>
                            Modo recomendado: {lastValidation.debugInfo.recommendedMode}
                        </Text>
                        <Text style={styles.debugText}>
                            Tipo de red: {lastValidation.debugInfo.networkType}
                        </Text>
                    </View>
                )}

                <View style={styles.checksContainer}>
                    <Text style={styles.checksTitle}>🔧 Verificaciones del Sistema</Text>
                    <View style={styles.checksList}>
                        <Text style={[styles.checkItem, { color: lastValidation.wifiConnected ? '#4CAF50' : '#F44336' }]}>
                            {lastValidation.wifiConnected ? '✅' : '❌'} WiFi conectado
                        </Text>
                        <Text style={[styles.checkItem, { color: lastValidation.locationPermissionGranted ? '#4CAF50' : '#F44336' }]}>
                            {lastValidation.locationPermissionGranted ? '✅' : '❌'} Permisos de ubicación
                        </Text>
                        <Text style={[styles.checkItem, { color: lastValidation.locationServicesEnabled ? '#4CAF50' : '#F44336' }]}>
                            {lastValidation.locationServicesEnabled ? '✅' : '❌'} Servicios de ubicación
                        </Text>
                        <Text style={[styles.checkItem, { color: lastValidation.pairingAvailable ? '#4CAF50' : '#F44336' }]}>
                            {lastValidation.pairingAvailable ? '✅' : '❌'} Emparejamiento disponible
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.header, { backgroundColor: getStatusColor() }]}>
                <View style={styles.headerLeft}>
                    {isValidating ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.statusIcon}>{getValidationIcon()}</Text>
                    )}
                    <Text style={styles.statusText}>{getValidationStatus()}</Text>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleManualValidation}
                        disabled={isValidating}
                    >
                        <Text style={styles.actionButtonText}>🔄</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={showDiagnostics}
                    >
                        <Text style={styles.actionButtonText}>🔍</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {validationTime && (
                <Text style={styles.timestamp}>
                    Última validación: {validationTime.toLocaleTimeString()}
                </Text>
            )}

            {renderValidationDetails()}

            {lastValidation && !lastValidation.canProceed && (
                <View style={styles.quickFixes}>
                    <Text style={styles.quickFixesTitle}>🔧 Soluciones Rápidas</Text>
                    {!lastValidation.wifiConnected && (
                        <Text style={styles.quickFixText}>
                            • Conecta tu dispositivo a WiFi
                        </Text>
                    )}
                    {!lastValidation.locationPermissionGranted && (
                        <Text style={styles.quickFixText}>
                            • Otorga permisos de ubicación en Configuración
                        </Text>
                    )}
                    {!lastValidation.validSSID && (
                        <Text style={styles.quickFixText}>
                            • Verifica el nombre de la red WiFi
                        </Text>
                    )}
                    {!lastValidation.validPassword && (
                        <Text style={styles.quickFixText}>
                            • Verifica la contraseña WiFi (mínimo 8 caracteres)
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    statusText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    actionButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 6,
        padding: 8,
        marginLeft: 8,
    },
    actionButtonText: {
        fontSize: 16,
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    detailsContainer: {
        marginTop: 5,
    },
    networkInfo: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    networkTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    networkDetail: {
        fontSize: 13,
        color: '#666',
        marginBottom: 2,
    },
    errorsContainer: {
        backgroundColor: '#ffebee',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#f44336',
    },
    errorsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 5,
    },
    errorText: {
        fontSize: 13,
        color: '#d32f2f',
        marginBottom: 2,
    },
    warningsContainer: {
        backgroundColor: '#fff8e1',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    warningsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ef6c00',
        marginBottom: 5,
    },
    warningText: {
        fontSize: 13,
        color: '#ef6c00',
        marginBottom: 2,
    },
    debugContainer: {
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 5,
    },
    debugText: {
        fontSize: 13,
        color: '#1565c0',
        marginBottom: 2,
    },
    checksContainer: {
        backgroundColor: '#f3e5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    checksTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7b1fa2',
        marginBottom: 8,
    },
    checksList: {
        flexDirection: 'column',
    },
    checkItem: {
        fontSize: 13,
        marginBottom: 4,
        fontWeight: '500',
    },
    quickFixes: {
        backgroundColor: '#e8f5e8',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4caf50',
    },
    quickFixesTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 5,
    },
    quickFixText: {
        fontSize: 13,
        color: '#388e3c',
        marginBottom: 2,
    },
});

export default WiFiValidator;
