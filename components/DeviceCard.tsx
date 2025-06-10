import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { TuyaDevice, DeviceCommand } from '@/types/SmartLifeTypes';
import { useDeviceControl } from '@/hooks/useSmartLife';

interface DeviceCardProps {
    device: TuyaDevice;
    onDeviceUpdate: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onDeviceUpdate }) => {
    const [showControls, setShowControls] = useState<boolean>(false);
    const [brightness, setBrightness] = useState<number>(
        (device.status['3'] as number) || 100
    );
    const [colorTemp, setColorTemp] = useState<number>(
        (device.status['4'] as number) || 500
    );

    const {
        loading,
        error,
        toggleSwitch,
        setBrightness: setDeviceBrightness,
        setColorTemperature,
        clearError
    } = useDeviceControl();

    const switchState = device.status['1'] as boolean;
    const currentBrightness = device.status['3'] as number;
    const currentColorTemp = device.status['4'] as number;

    const handleToggleSwitch = async (): Promise<void> => {
        try {
            await toggleSwitch(device.devId, 1);
            onDeviceUpdate();
            Alert.alert(
                'Success',
                `Device ${device.name} ${switchState ? 'turned OFF' : 'turned ON'}`
            );
        } catch (err) {
            Alert.alert('Error', 'Failed to toggle switch');
        }
    };

    const handleBrightnessChange = async (value: number): Promise<void> => {
        setBrightness(value);
    };

    const handleBrightnessComplete = async (value: number): Promise<void> => {
        try {
            await setDeviceBrightness(device.devId, Math.round(value));
            onDeviceUpdate();
        } catch (err) {
            Alert.alert('Error', 'Failed to set brightness');
        }
    };

    const handleColorTempChange = async (value: number): Promise<void> => {
        setColorTemp(value);
    };

    const handleColorTempComplete = async (value: number): Promise<void> => {
        try {
            await setColorTemperature(device.devId, Math.round(value));
            onDeviceUpdate();
        } catch (err) {
            Alert.alert('Error', 'Failed to set color temperature');
        }
    };

    const getDeviceIcon = (): string => {
        switch (device.categoryCode) {
            case 'dj': return '💡'; // Light
            case 'kg': return '🔌'; // Switch
            case 'cz': return '🔌'; // Socket
            case 'qjdcq': return '🌡️'; // Thermostat
            case 'fs': return '💨'; // Fan
            default: return '📱';
        }
    };

    const getStatusColor = (): string => {
        if (!device.isOnline) return '#ffebee';
        if (switchState) return '#e8f5e8';
        return '#fff3e0';
    };

    const renderAdvancedControls = (): JSX.Element | null => {
        if (device.categoryCode !== 'dj') return null; // Only for lights

        return (
            <Modal
                visible={showControls}
                transparent
                animationType="slide"
                onRequestClose={() => setShowControls(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Control {device.name}
                        </Text>

                        {currentBrightness !== undefined && (
                            <View style={styles.controlSection}>
                                <Text style={styles.controlLabel}>
                                    Brightness: {Math.round(brightness)}
                                </Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={10}
                                    maximumValue={255}
                                    value={brightness}
                                    onValueChange={handleBrightnessChange}
                                    onSlidingComplete={handleBrightnessComplete}
                                    minimumTrackTintColor="#007AFF"
                                    maximumTrackTintColor="#ddd"
                                    disabled={loading}
                                />
                            </View>
                        )}

                        {currentColorTemp !== undefined && (
                            <View style={styles.controlSection}>
                                <Text style={styles.controlLabel}>
                                    Color Temperature: {Math.round(colorTemp)}K
                                </Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={1000}
                                    value={colorTemp}
                                    onValueChange={handleColorTempChange}
                                    onSlidingComplete={handleColorTempComplete}
                                    minimumTrackTintColor="#FFA500"
                                    maximumTrackTintColor="#87CEEB"
                                    disabled={loading}
                                />
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.closeButton]}
                                onPress={() => setShowControls(false)}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: getStatusColor() }]}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={handleToggleSwitch}
                disabled={loading}
            >
                <View style={styles.deviceHeader}>
                    <Text style={styles.deviceIcon}>{getDeviceIcon()}</Text>
                    <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <Text style={styles.deviceStatus}>
                            {device.isOnline ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                    <View style={styles.deviceState}>
                        <View style={[
                            styles.statusIndicator,
                            { backgroundColor: switchState ? '#4CAF50' : '#f44336' }
                        ]} />
                    </View>
                </View>

                <View style={styles.deviceDetails}>
                    <Text style={styles.categoryText}>
                        {device.categoryCode.toUpperCase()}
                    </Text>
                    {switchState !== undefined && (
                        <Text style={[
                            styles.switchText,
                            { color: switchState ? '#4CAF50' : '#f44336' }
                        ]}>
                            {switchState ? 'ON' : 'OFF'}
                        </Text>
                    )}
                </View>

                {currentBrightness !== undefined && (
                    <Text style={styles.valueText}>
                        Brightness: {currentBrightness}
                    </Text>
                )}

                {currentColorTemp !== undefined && (
                    <Text style={styles.valueText}>
                        Color Temp: {currentColorTemp}K
                    </Text>
                )}
            </TouchableOpacity>

            {device.categoryCode === 'dj' && (
                <TouchableOpacity
                    style={styles.advancedButton}
                    onPress={() => setShowControls(true)}
                >
                    <Text style={styles.advancedButtonText}>⚙️</Text>
                </TouchableOpacity>
            )}

            {renderAdvancedControls()}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 16,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    deviceIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    deviceStatus: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    deviceState: {
        alignItems: 'center',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    deviceDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    categoryText: {
        fontSize: 10,
        color: '#999',
        fontWeight: '500',
    },
    switchText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    valueText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    advancedButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderRadius: 20,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    advancedButtonText: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        margin: 20,
        minWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    controlSection: {
        marginBottom: 20,
    },
    controlLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderThumb: {
        backgroundColor: '#007AFF',
        width: 20,
        height: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    closeButton: {
        backgroundColor: '#f44336',
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default DeviceCard;
