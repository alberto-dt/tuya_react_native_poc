import React, { useEffect, useState, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    ActivityIndicator,
    BackHandler,
} from 'react-native';

interface PairingProgressModalProps {
    visible: boolean;
    mode: 'EZ' | 'AP' | 'AUTO' | null;
    progress: string;
    onCancel: () => void;
    canCancel?: boolean;
    duration?: number;
}

const { width, height } = Dimensions.get('window');

const PairingProgressModal: React.FC<PairingProgressModalProps> = ({
                                                                       visible,
                                                                       mode,
                                                                       progress,
                                                                       onCancel,
                                                                       canCancel = true,
                                                                       duration
                                                                   }) => {
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [animationStep, setAnimationStep] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressBarAnim = useRef(new Animated.Value(0)).current;
    const iconRotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setTimeElapsed(0);
            setAnimationStep(0);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            startContinuousAnimations();

            const timeInterval = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);

            const progressInterval = setInterval(() => {
                setAnimationStep(prev => (prev + 1) % 4);
            }, 800);

            return () => {
                clearInterval(timeInterval);
                clearInterval(progressInterval);
            };
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (visible && canCancel) {
                onCancel();
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [visible, canCancel, onCancel]);

    const startContinuousAnimations = () => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );

        const rotateAnimation = Animated.loop(
            Animated.timing(iconRotateAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        );

        const progressAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(progressBarAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: false,
                }),
                Animated.timing(progressBarAnim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: false,
                }),
            ])
        );

        pulseAnimation.start();
        rotateAnimation.start();
        progressAnimation.start();
    };

    const getModeInfo = () => {
        switch (mode) {
            case 'EZ':
                return {
                    icon: '📶',
                    title: 'Modo EZ',
                    subtitle: 'Emparejamiento Rápido',
                    color: '#4CAF50',
                    description: 'Conectando dispositivo directamente a tu red WiFi...'
                };
            case 'AP':
                return {
                    icon: '📡',
                    title: 'Modo AP',
                    subtitle: 'Punto de Acceso',
                    color: '#2196F3',
                    description: 'Conectando al punto de acceso del dispositivo...'
                };
            case 'AUTO':
                return {
                    icon: '🔄',
                    title: 'Modo Automático',
                    subtitle: 'Selección Inteligente',
                    color: '#FF9800',
                    description: 'Probando automáticamente los mejores métodos...'
                };

            default:
                return {
                    icon: '🔗',
                    title: 'Emparejando',
                    subtitle: 'Conectando Dispositivo',
                    color: '#607D8B',
                    description: 'Estableciendo conexión con el dispositivo...'
                };
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressDots = () => {
        return Array.from({ length: 4 }, (_, index) => (
            <View
                key={index}
                style={[
                    styles.progressDot,
                    {
                        backgroundColor: index <= animationStep ? modeInfo.color : '#E0E0E0',
                        transform: [
                            {
                                scale: index === animationStep ? 1.2 : 1
                            }
                        ]
                    }
                ]}
            />
        ));
    };

    const modeInfo = getModeInfo();

    const iconRotation = iconRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const progressBarWidth = progressBarAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent
        >
            <Animated.View
                style={[
                    styles.overlay,
                    {
                        opacity: fadeAnim,
                    }
                ]}
            >
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            transform: [
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    <View style={[styles.header, { backgroundColor: modeInfo.color }]}>
                        <Animated.View
                            style={[
                                styles.iconContainer,
                                {
                                    transform: [
                                        { scale: pulseAnim },
                                        { rotate: mode === 'AUTO' ? iconRotation : '0deg' }
                                    ]
                                }
                            ]}
                        >
                            <Text style={styles.modeIcon}>{modeInfo.icon}</Text>
                        </Animated.View>
                        <Text style={styles.modeTitle}>{modeInfo.title}</Text>
                        <Text style={styles.modeSubtitle}>{modeInfo.subtitle}</Text>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.modeDescription}>
                            {modeInfo.description}
                        </Text>

                        <Text style={styles.progressText}>{progress}</Text>

                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBarBackground}>
                                <Animated.View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            backgroundColor: modeInfo.color,
                                            width: progressBarWidth,
                                        }
                                    ]}
                                />
                            </View>
                        </View>

                        <View style={styles.progressDotsContainer}>
                            {getProgressDots()}
                        </View>

                        <View style={styles.timeSection}>
                            <View style={styles.timeItem}>
                                <Text style={styles.timeLabel}>Tiempo transcurrido:</Text>
                                <Text style={[styles.timeValue, { color: modeInfo.color }]}>
                                    {formatTime(timeElapsed)}
                                </Text>
                            </View>
                            {duration && (
                                <View style={styles.timeItem}>
                                    <Text style={styles.timeLabel}>Tiempo límite:</Text>
                                    <Text style={styles.timeValue}>
                                        {formatTime(Math.floor(duration / 1000))}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.activityContainer}>
                            <ActivityIndicator
                                size="large"
                                color={modeInfo.color}
                                style={styles.activityIndicator}
                            />
                            <Text style={[styles.activityText, { color: modeInfo.color }]}>
                                Procesando...
                            </Text>
                        </View>
                    </View>

                    {canCancel && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { borderColor: modeInfo.color }]}
                                onPress={onCancel}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.cancelButtonText, { color: modeInfo.color }]}>
                                    Cancelar Emparejamiento
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: height * 0.85,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 25,
    },
    header: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 25,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    iconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 35,
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    modeIcon: {
        fontSize: 32,
    },
    modeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    modeSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    content: {
        padding: 25,
    },
    modeDescription: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    progressText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 25,
    },
    progressBarContainer: {
        marginBottom: 20,
    },
    progressBarBackground: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressDotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginHorizontal: 6,
    },
    timeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    timeItem: {
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        fontWeight: '500',
    },
    timeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    activityContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    activityIndicator: {
        marginBottom: 10,
    },
    activityText: {
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    cancelButton: {
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        backgroundColor: 'white',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PairingProgressModal;
