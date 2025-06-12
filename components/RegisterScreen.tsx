import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';

import SmartLifeService from '../services/SmartLifeService';
import type { TuyaUser } from '@/services/SmartLifeService';

interface RegisterScreenProps {
    onRegisterSuccess: (user: TuyaUser) => void;
    onBackToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({
                                                           onRegisterSuccess,
                                                           onBackToLogin,
                                                       }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const validateForm = (): boolean => {
        if (!email.trim()) {
            Alert.alert('Error', 'Por favor ingresa tu email');
            return false;
        }
        if (!email.includes('@') || !email.includes('.')) {
            Alert.alert('Error', 'Por favor ingresa un email válido');
            return false;
        }

        if (!password.trim()) {
            Alert.alert('Error', 'Por favor ingresa una contraseña');
            return false;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return false;
        }

        return true;
    };

    const handleRegister = async (): Promise<void> => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);

            const newUser: TuyaUser = await SmartLifeService.registerWithEmail(
                email.trim(),
                password,
                '1'
            );

            Alert.alert(
                '¡Registro Exitoso! 🎉',
                `Cuenta creada correctamente!\n\nUsuario: ${newUser.username || newUser.email}`,
                [
                    {
                        text: 'Continuar',
                        onPress: () => onRegisterSuccess(newUser)
                    }
                ]
            );

        } catch (error) {
            console.error('Error en registro:', error);
            Alert.alert(
                'Error en el Registro',
                (error as Error).message + '\n\nVerifica los datos e intenta nuevamente.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Registrando usuario...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Crear Cuenta Nueva</Text>
                <Text style={styles.subtitle}>Registro en Smart Life</Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email:</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="ejemplo@gmail.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="next"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Contraseña:</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mínimo 6 caracteres"
                        secureTextEntry
                        autoCorrect={false}
                        autoComplete="password"
                        textContentType="password"
                        returnKeyType="next"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirmar Contraseña:</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Repite la contraseña"
                        secureTextEntry
                        autoCorrect={false}
                        textContentType="password"
                        returnKeyType="done"
                        onSubmitEditing={handleRegister}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        ✅ Crear Cuenta
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={onBackToLogin}
                disabled={isLoading}
            >
                <Text style={[styles.buttonText, styles.backButtonText]}>
                    ← Volver al Login
                </Text>
            </TouchableOpacity>


        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
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
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
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
    button: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
        marginTop: 10,
    },
    backButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#666',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    backButtonText: {
        color: '#666',
    },

});

export default RegisterScreen;
