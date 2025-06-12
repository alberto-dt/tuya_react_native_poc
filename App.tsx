import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import SmartLifeService from './services/SmartLifeService';
import RegisterScreen from './components/RegisterScreen';
import HomeListScreen from './components/HomeListScreen';
import AddHomeScreen from './components/AddHomeScreen';
import type { TuyaUser, TuyaHome } from './services/SmartLifeService';

type AppScreen = 'login' | 'register' | 'home' | 'homeList' | 'addHome' | 'deviceList';

const App: React.FC = () => {
  const emailRef = useRef('');
  const passwordRef = useRef('');

  const [uiState, setUiState] = useState({
    currentScreen: 'login' as AppScreen,
    user: null as TuyaUser | null,
    selectedHome: null as TuyaHome | null,
    isLoading: false,
  });

  const { currentScreen, user, selectedHome, isLoading } = uiState;

  const updateUiState = useCallback((updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Permiso de Ubicación',
              message: 'Smart Life necesita acceso a tu ubicación para configurar hogares correctamente.',
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

  useEffect(() => {
    const initializeSDK = async (): Promise<void> => {
      try {
        await SmartLifeService.initSDK(
            'phrvfs7yuqg3rg8sw3km',
            '74akfvfua53teq4wvepcd847panjpkee'
        );
        console.log('SDK initialized successfully');

        await requestLocationPermission();
      } catch (error) {
        console.error('Error initializing SDK:', error);
        Alert.alert('Error', 'Failed to initialize Smart Life SDK');
      }
    };

    initializeSDK();
  }, [requestLocationPermission]);
  const validateCredentials = useCallback((): boolean => {
    if (!emailRef.current.trim() || !passwordRef.current.trim()) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return false;
    }
    return true;
  }, []);

  const goToRegister = useCallback((): void => {
    updateUiState({ currentScreen: 'register' });
  }, [updateUiState]);

  const goToLogin = useCallback((): void => {
    updateUiState({
      currentScreen: 'login',
      user: null,
      selectedHome: null
    });
  }, [updateUiState]);

  const goToHomeList = useCallback((userData: TuyaUser): void => {
    updateUiState({
      user: userData,
      currentScreen: 'homeList',
      selectedHome: null,
    });
  }, [updateUiState]);

  const goToAddHome = useCallback((): void => {
    updateUiState({
      currentScreen: 'addHome'
    });
  }, [updateUiState]);

  const handleHomeCreated = useCallback((newHome: TuyaHome): void => {
    updateUiState({
      currentScreen: 'homeList',
      selectedHome: null
    });

    Alert.alert(
        '¡Hogar Creado! 🎉',
        `El hogar "${newHome.name}" ha sido creado exitosamente y aparecerá en tu lista de hogares.`,
        [{ text: 'OK' }]
    );
  }, [updateUiState]);

  const handleCancelAddHome = useCallback((): void => {
    updateUiState({
      currentScreen: 'homeList'
    });
  }, [updateUiState]);

  const handleHomeSelected = useCallback((home: TuyaHome): void => {
    updateUiState({
      selectedHome: home,
      currentScreen: 'deviceList',
    });
  }, [updateUiState]);
  const handleLoginSuccess = useCallback((userData: TuyaUser): void => {
    goToHomeList(userData);
    Alert.alert(
        '¡Login Exitoso! 🎉',
        `Bienvenido: ${userData.username || userData.email}\n` +
        `UID: ${userData.uid}\n` +
        `Email: ${userData.email}`
    );
  }, [goToHomeList]);

  const handleRegisterSuccess = useCallback((newUser: TuyaUser): void => {
    goToHomeList(newUser);
    Alert.alert(
        '¡Bienvenido! 🎉',
        `Cuenta creada y login exitoso!\n\nUsuario: ${newUser.username || newUser.email}`
    );
  }, [goToHomeList]);
  const handleLoginError = useCallback((error: Error): void => {
    console.error('Error in Login:', error);

    const errorMessage = error.message;
    const isCredentialError = errorMessage.includes('Incorrect account') ||
        errorMessage.includes('password');

    Alert.alert(
        'Error de Login',
        `Error: ${errorMessage}\n\n` +
        (isCredentialError ?
            'Verifica tus credenciales o crea una cuenta nueva.' :
            'Revisa tu conexión a internet.'),
        [
          { text: 'Reintentar', style: 'cancel' },
          ...(isCredentialError ? [{ text: '✅ Crear Cuenta Nueva', onPress: goToRegister }] : [])
        ]
    );
  }, [goToRegister]);

  const handleLogin = useCallback(async (): Promise<void> => {
    if (!validateCredentials()) return;

    try {
      updateUiState({ isLoading: true });
      console.log('=== LOGIN ===');
      console.log('Email:', emailRef.current);
      console.log('Password length:', passwordRef.current.length);

      const result = await SmartLifeService.loginWithEmail(
          emailRef.current.trim(),
          passwordRef.current,
          '1'
      );
      handleLoginSuccess(result);
    } catch (error) {
      handleLoginError(error as Error);
    } finally {
      updateUiState({ isLoading: false });
    }
  }, [validateCredentials, updateUiState, handleLoginSuccess, handleLoginError]);
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await SmartLifeService.logout();
      updateUiState({
        user: null,
        selectedHome: null,
        currentScreen: 'login'
      });
      Alert.alert('Logout Exitoso', 'Has cerrado sesión correctamente');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Error al cerrar sesión: ' + (error as Error).message);
    }
  }, [updateUiState]);

  const LoadingScreen = () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Conectando...</Text>
      </View>
  );

  const handleEmailChange = useCallback((value: string) => {
    emailRef.current = value;
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    passwordRef.current = value;
  }, []);

  const InputFields = React.memo(() => (
      <>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
              style={styles.input}
              defaultValue=""
              onChangeText={handleEmailChange}
              placeholder="Ingresa tu email de Smart Life"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña:</Text>
          <TextInput
              style={styles.input}
              defaultValue=""
              onChangeText={handlePasswordChange}
              placeholder="Ingresa tu contraseña"
              secureTextEntry
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
          />
        </View>
      </>
  ));

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (currentScreen === 'register') {
    return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
          <RegisterScreen
              onRegisterSuccess={handleRegisterSuccess}
              onBackToLogin={goToLogin}
          />
        </SafeAreaView>
    );
  }

  if (currentScreen === 'addHome' && user) {
    return (
        <AddHomeScreen
            user={user}
            onHomeCreated={handleHomeCreated}
            onCancel={handleCancelAddHome}
        />
    );
  }

  if (currentScreen === 'homeList' && user) {
    return (
        <HomeListScreen
            user={user}
            onLogout={handleLogout}
            onHomeSelected={handleHomeSelected}
            onAddHome={goToAddHome} // NUEVO
        />
    );
  }

  if (currentScreen === 'deviceList' && user && selectedHome) {
    return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#FF9800" />
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={[styles.header, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.title}>Dispositivos</Text>
              <Text style={styles.subtitle}>{selectedHome.name}</Text>
            </View>

            <View style={styles.userContainer}>
              <Text style={styles.welcomeText}>🏠 {selectedHome.name}</Text>

              <View style={styles.userInfo}>
                <Text style={styles.userDetail}>📋 Próximamente: Lista de dispositivos</Text>
                <Text style={styles.userDetail}>🔧 Control de dispositivos</Text>
                <Text style={styles.userDetail}>⚡ Estados en tiempo real</Text>
                <Text style={styles.userDetail}>🏠 Hogar ID: {selectedHome.homeId}</Text>
                <Text style={styles.userDetail}>📍 Ubicación: {selectedHome.geoName}</Text>
              </View>

              <TouchableOpacity
                  style={[styles.button, styles.backToHomesButton]}
                  onPress={() => updateUiState({ currentScreen: 'homeList' })}
              >
                <Text style={styles.buttonText}>← Volver a Hogares</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
                <Text style={[styles.buttonText, styles.logoutButtonText]}>🚪 Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Smart Life App</Text>
            <Text style={styles.subtitle}>Tuya Smart Life Integration</Text>
          </View>

          <View style={styles.loginContainer}>
            <InputFields />

            <TouchableOpacity
                style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Conectando...' : '🔑 Iniciar Sesión'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.registerButton, isLoading && styles.buttonDisabled]}
                onPress={goToRegister}
                disabled={isLoading}
            >
              <Text style={[styles.buttonText, styles.registerButtonText]}>
                ✅ Crear Cuenta Nueva
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
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
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
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    marginTop: 10,
  },
  registerButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  logoutButton: {
    backgroundColor: '#f44336',
  },
  backToHomesButton: {
    backgroundColor: '#FF9800',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  registerButtonText: {
    color: '#4CAF50',
  },
  logoutButtonText: {
    color: 'white',
  },
  userContainer: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  userInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  userDetail: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
});

export default App;
