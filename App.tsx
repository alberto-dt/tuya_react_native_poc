import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';

import { useSmartLife, useDeviceControl } from './hooks/useSmartLife';
import { TuyaHome, TuyaDevice } from './types/SmartLifeTypes';

const APP_CONFIG = {
  APP_KEY: '',
  SECRET_KEY: '',
};

const App: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const {
    isInitialized,
    isLoggedIn,
    user,
    homes,
    devices,
    selectedHome,
    loading,
    error,
    initializeSDK,
    login,
    logout,
    selectHome,
    controlDevice,
    refreshDevices,
    clearError,
  } = useSmartLife();

  const deviceControl = useDeviceControl();

  useEffect(() => {
    handleInitializeSDK();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const handleInitializeSDK = async (): Promise<void> => {
    try {
      await initializeSDK(APP_CONFIG.APP_KEY, APP_CONFIG.SECRET_KEY);
      console.log('SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
    }
  };

  const handleLogin = async (): Promise<void> => {
    console.log(email);
    console.log(password);
    if (!email.trim() || !password.trim()) {

      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      await login(email.trim(), password, '593');
      Alert.alert('Success', `Welcome ${user?.username || user?.email || 'User'}!`);
    } catch (error) {
      console.error('Login failed:', error);
      // Error is handled by useSmartLife hook
    }
  };

  const handleDeviceControl = async (device: TuyaDevice): Promise<void> => {
    try {
      const currentState = device.status['1'] as boolean || false;
      await controlDevice(device.devId, {
        switch_1: !currentState
      });

      Alert.alert(
          'Success',
          `Device ${device.name} ${currentState ? 'turned OFF' : 'turned ON'}`
      );
    } catch (error) {
      console.error('Failed to control device:', error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      setEmail('');
      setPassword('');
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleBrightnessControl = async (device: TuyaDevice, brightness: number): Promise<void> => {
    try {
      await deviceControl.setBrightness(device.devId, brightness);
      Alert.alert('Success', `Brightness set to ${brightness}`);
      await refreshDevices();
    } catch (error) {
      console.error('Failed to set brightness:', error);
    }
  };

  const renderDevice: ListRenderItem<TuyaDevice> = ({ item }) => {
    const switchState = item.status['1'] as boolean;
    const brightness = item.status['3'] as number;

    return (
        <View style={[
          styles.deviceCard,
          { backgroundColor: item.isOnline ? '#e8f5e8' : '#f5e8e8' }
        ]}>
          <TouchableOpacity onPress={() => handleDeviceControl(item)}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceStatus}>
              Status: {item.isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.deviceCategory}>
              Category: {item.categoryCode}
            </Text>
            {switchState !== undefined && (
                <Text style={styles.switchStatus}>
                  Switch: {switchState ? 'ON' : 'OFF'}
                </Text>
            )}
            {brightness !== undefined && (
                <Text style={styles.brightnessStatus}>
                  Brightness: {brightness}
                </Text>
            )}
          </TouchableOpacity>

          {/* Controles adicionales para luces */}
          {item.categoryCode === 'dj' && brightness !== undefined && (
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => handleBrightnessControl(item, Math.max(0, brightness - 50))}
                >
                  <Text style={styles.controlButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => handleBrightnessControl(item, Math.min(255, brightness + 50))}
                >
                  <Text style={styles.controlButtonText}>+</Text>
                </TouchableOpacity>
              </View>
          )}
        </View>
    );
  };

  const renderHome: ListRenderItem<TuyaHome> = ({ item }) => (
      <TouchableOpacity
          style={[
            styles.homeCard,
            selectedHome?.homeId === item.homeId && styles.selectedHome
          ]}
          onPress={() => selectHome(item)}
      >
        <Text style={styles.homeName}>{item.name}</Text>
        <Text style={styles.homeAddress}>{item.address}</Text>
      </TouchableOpacity>
  );

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
    );
  }

  if (!isInitialized) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing SDK...</Text>
        </View>
    );
  }

  if (!isLoggedIn) {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loginContainer}>
            <Text style={styles.title}>Smart Life App</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Smart Life</Text>
            {user && (
                <Text style={styles.userInfo}>
                  {user.username || user.email}
                </Text>
            )}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {homes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Homes ({homes.length})</Text>
              <FlatList
                  horizontal
                  data={homes}
                  renderItem={renderHome}
                  keyExtractor={(item) => item.homeId.toString()}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
              />
            </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Devices {selectedHome ? `in ${selectedHome.name}` : ''} ({devices.length})
            </Text>
            <TouchableOpacity
                style={styles.refreshButton}
                onPress={refreshDevices}
                disabled={loading}
            >
              <Text style={styles.refreshText}>↻</Text>
            </TouchableOpacity>
          </View>

          {devices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {selectedHome ? 'No devices found in this home' : 'Select a home to view devices'}
                </Text>
              </View>
          ) : (
              <FlatList
                  data={devices}
                  renderItem={renderDevice}
                  keyExtractor={(item) => item.devId}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.devicesList}
              />
          )}
        </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    marginHorizontal: 15,
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  horizontalList: {
    paddingVertical: 5,
  },
  homeCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 160,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedHome: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  homeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  homeAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  devicesList: {
    paddingBottom: 20,
  },
  deviceCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  deviceStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  deviceCategory: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  switchStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#007AFF',
  },
  brightnessStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  controlButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default App;
