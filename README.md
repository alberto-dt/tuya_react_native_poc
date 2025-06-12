# Tuya Smart Life SDK - Implementación en React Native

Este documento describe los pasos completos para implementar el 
Tuya Smart Life SDK en un proyecto React Native para Android.

# 📋 Tabla de Contenidos

* [Prerrequisitos](#Prerrequisitos)
* [Configuración en Tuya IoT Platform](#Configuración_en_Tuya_IoT_Platform)
* [Configuración del Proyecto Android](#Configuración_del_Proyecto_Android)
* [Implementación del Native Module](#Implementación_del_Native_Module)
* [Integración en React Native](#Integración_en_React_Native)
* [Uso de la API](#Uso_de_la_API)

# Prerrequisitos
* React Native: 0.68+
* Android SDK: Mínimo API 23 (Android 6.0)
* Java: JDK 11+
* Node.js: 16+
* Cuenta en Tuya IoT Platform

# Configuración_en_Tuya_IoT_Platform

## Paso 1: Crear proyecto en Tuya Developer Platform

1. Ve a iot.tuya.com
2. Crea una cuenta de desarrollador
3. Navega a App Development → App Authorization
4. Haz clic en Add Authorization

## Paso 2: Configurar App Authorization

- Project Name: Tu Proyecto Smart Life
- Application ID: **com.smartlifeapppoc** (debe coincidir con tu package name)
- Type: Tuya IoT App SDK (Android)

## Paso 3: Obtener credenciales
Después de crear la autorización obtendrás:

- Access ID (APP_KEY): ************
- Access Secret (SECRET_KEY): ***********

## Paso 4: Configurar SHA256

```bash
# Generar SHA256 del keystore de debug
cd android
./gradlew signingReport

# O usar keytool directamente
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepas

```

# Configuración_del_Proyecto_Android

## Paso 1: Agregar dependencias en android/app/build.gradle

```bash
dependencies {
implementation 'com.tuya.smart:tuyasmart:5.6.0'
implementation 'com.alibaba:fastjson:1.1.67.android'
implementation 'com.squareup.okhttp3:okhttp-urlconnection:3.14.9'
implementation 'com.facebook.soloader:soloader:0.8.0'
// ... otras dependencias
}
```
Estas implementaciones pueden varian de acuerdo al sdk generado para android

## Paso 2: Configurar repositorio Maven en android/build.gradle
```bash
allprojects {
   repositories {
      google()
      mavenCentral()
      maven { url "https://maven-other.tuya.com/repository/maven-releases/" }
      // ... otros repositorios
   }
}
```

## Paso 3: Configurar package name y signing

```bash
android {
defaultConfig {
applicationId "com.smartlifeapppoc"  // Debe coincidir exactamente con Tuya Platform
// ... otras configuraciones

        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a"
        }
    }
    
    signingConfigs {
        debug {
            storeFile file(System.getProperty("user.home") + "/.android/debug.keystore")
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
    }
    
    packagingOptions {
        pickFirst 'lib/*/libc++_shared.so'
    }
}

```

## Paso 4: Configurar AndroidManifest.xml

```bash
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
package="com.smartlifeapppoc">

    <!-- Permisos necesarios -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application
        android:name=".MainApplication"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        <!-- ... configuración de activities -->
    </application>
</manifest>
```

# Implementación_del_Native_Module

## Paso 1: Crear SmartLifeModule.java

// android/app/src/main/java/com/smartlifeapppoc/SmartLifeModule.java

```bash
public class SmartLifeModule extends ReactContextBaseJavaModule {
private static final String TAG = "SmartLifeModule";

    public SmartLifeModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "SmartLifeModule";
    }

    @ReactMethod
    public void initSDK(String appKey, String secretKey, Promise promise) {
        Log.d(TAG, "initSDK called with appKey: " + appKey);
        try {
            // Para SDK 6.2.2, necesitamos pasar Application context
            Application application = (Application) getReactApplicationContext().getApplicationContext();
            ThingHomeSdk.init(application, appKey, secretKey);
            ThingHomeSdk.setDebugMode(true); // Solo para desarrollo
            Log.d(TAG, "ThingHomeSdk initialized successfully");
            promise.resolve("Smart Life SDK initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing SDK: " + e.getMessage(), e);
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }
  
  ...

    @ReactMethod
    public void getHomeDetail(double homeId, Promise promise) {
        Log.d(TAG, "getHomeDetail called for homeId: " + homeId);
        // Conversión correcta de double a long
        long homeIdLong = (long) homeId;
        ThingHomeSdk.newHomeInstance(homeIdLong).getHomeDetail(new IThingHomeResultCallback() {
            @Override
            public void onSuccess(HomeBean homeBean) {
                Log.d(TAG, "Got home detail for: " + homeBean.getName());
                WritableMap homeMap = new WritableNativeMap();
                homeMap.putDouble("homeId", homeBean.getHomeId());
                homeMap.putString("name", homeBean.getName());
                homeMap.putString("geoName", homeBean.getGeoName());
                homeMap.putDouble("lon", homeBean.getLon());
                homeMap.putDouble("lat", homeBean.getLat());

                // Obtener lista de dispositivos
                WritableArray deviceArray = new WritableNativeArray();
                if (homeBean.getDeviceList() != null) {
                    for (DeviceBean device : homeBean.getDeviceList()) {
                        WritableMap deviceMap = new WritableNativeMap();
                        deviceMap.putString("devId", device.getDevId());
                        deviceMap.putString("name", device.getName());
                        deviceMap.putString("iconUrl", device.getIconUrl());
                        deviceMap.putBoolean("isOnline", device.getIsOnline());
                        deviceArray.pushMap(deviceMap);
                    }
                }
                homeMap.putArray("deviceList", deviceArray);
                promise.resolve(homeMap);
            }

            @Override
            public void onError(String errorCode, String errorMessage) {
                Log.e(TAG, "Error getting home detail: " + errorCode + " - " + errorMessage);
                promise.reject(errorCode, errorMessage);
            }
        });
    }

    ...

    @ReactMethod
    public void logout(Promise promise) {
        Log.d(TAG, "logout called");
        // Callback actualizado para SDK 6.2.2
        ThingHomeSdk.getUserInstance().logout(new ILogoutCallback() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "Logout successful");
                promise.resolve("Logout successful");
            }

            @Override
            public void onError(String errorCode, String errorMessage) {
                Log.e(TAG, "Logout error: " + errorCode + " - " + errorMessage);
                promise.reject(errorCode, errorMessage);
            }
        });
    }
}
```

## Paso 2: Registrar el módulo en SmartLifePackage.java

// android/app/src/main/java/com/smartlifeapppoc/SmartLifePackage.java

```bash
public class SmartLifePackage implements ReactPackage {

    private static final String TAG = "SmartLifePackage";

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();

        try {
            Log.d(TAG, "Creating SmartLifeModule...");
            SmartLifeModule smartLifeModule = new SmartLifeModule(reactContext);
            modules.add(smartLifeModule);
            Log.d(TAG, "SmartLifeModule created successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error creating SmartLifeModule: " + e.getMessage(), e);
        }

        return modules;
    }
}
```

## Paso 3: Agregar el package en MainApplication.java

// android/app/src/main/java/com/smartlifeapppoc/MainApplication.java

```bash

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost =
            new DefaultReactNativeHost(this) {
                @Override
                public boolean getUseDeveloperSupport() {
                    return BuildConfig.DEBUG;
                }

                @Override
                protected List<ReactPackage> getPackages() {
                    @SuppressWarnings("UnnecessaryLocalVariable")
                    List<ReactPackage> packages = new PackageList(this).getPackages();

                    packages.add(new SmartLifePackage());
                    Log.d("MainApplication", "SmartLifePackage added to packages list");

                    return packages;
                }

                @Override
                protected String getJSMainModuleName() {
                    return "index";
                }

                @Override
                protected boolean isNewArchEnabled() {
                    return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
                }

                @Override
                protected Boolean isHermesEnabled() {
                    return BuildConfig.IS_HERMES_ENABLED;
                }
            };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        SoLoader.init(this, /* native exopackage */ false);

        Log.d("MainApplication", "Application onCreate called");

        if (BuildConfig.DEBUG) {
            ThingHomeSdk.setDebugMode(true);
            Log.d("MainApplication", "Tuya SDK debug mode enabled");
        }

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load();
        }

        ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }
}

```

# Integración_en_React_Native

## Paso 1: Definir tipos TypeScript

// src/types/SmartLifeTypes.ts

```bash
export interface TuyaUser {
   uid: string;
   username?: string;
   email?: string;
   phoneCode?: string;
   mobile?: string;
   avatarUrl?: string;
}

export interface TuyaHome {
   homeId: number;
   name: string;
   geoName: string;
   lat: number;
   lon: number;
   address: string;
}

export interface DeviceStatus {
   [key: string]: boolean | number | string;
}

export interface TuyaDevice {
   devId: string;
   name: string;
   iconUrl: string;
   isOnline: boolean;
   productId: string;
   categoryCode: string;
   status: DeviceStatus;
}

export interface DeviceSchema {
   id: string;
   code: string;
   name: string;
   type: string;
   mode: string;
}

export interface DeviceCommand {
   switch_1?: boolean;
   switch_2?: boolean;
   switch_3?: boolean;
   bright_value?: number;
   temp_value?: number;
   colour_data?: string; 
   [key: string]: any;
}

export interface SmartLifeModuleInterface {
   initSDK(appKey: string, secretKey: string): Promise<string>;
   loginWithEmail(email: string, password: string, countryCode: string): Promise<TuyaUser>;
   loginWithPhone(phone: string, password: string, countryCode: string): Promise<TuyaUser>;
   getHomeList(): Promise<TuyaHome[]>;
   getDeviceList(homeId: number): Promise<TuyaDevice[]>;
   controlDevice(deviceId: string, commands: DeviceCommand): Promise<string>;
   getDeviceSchema(deviceId: string): Promise<DeviceSchema[]>;
   logout(): Promise<string>;
}

export interface ColorHSV {
   h: number;
   s: number;
   v: number;
}

export interface ColorRGB {
   r: number;
   g: number;
   b: number;
}
```

## Paso 2: Crear servicio SmartLifeService
// src/services/SmartLifeService.ts

```bash

class SmartLifeService {
private isInitialized: boolean = false;

    async initSDK(appKey: string, secretKey: string): Promise<string> {
        try {
            const result = await SmartLifeModule.initSDK(appKey, secretKey);
            this.isInitialized = true;
            console.log('Smart Life SDK initialized:', result);
            return result;
        } catch (error) {
            console.error('Error initializing Smart Life SDK:', error);
            throw error;
        }
    }

    async loginWithEmail(
        email: string,
        password: string,
        countryCode: string = '593'
    ): Promise<TuyaUser> {
        try {
            const user = await SmartLifeModule.loginWithEmail(email, password, countryCode);
            console.log('Login successful:', user);
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async loginWithPhone(
        phone: string,
        password: string,
        countryCode: string = '1'
    ): Promise<TuyaUser> {
        try {
            const user = await SmartLifeModule.loginWithPhone(phone, password, countryCode);
            console.log('Phone login successful:', user);
            return user;
        } catch (error) {
            console.error('Phone login error:', error);
            throw error;
        }
    }

    async getHomeList(): Promise<TuyaHome[]> {
        try {
            const homes = await SmartLifeModule.getHomeList();
            console.log('Homes retrieved:', homes);
            return homes;
        } catch (error) {
            console.error('Error getting homes:', error);
            throw error;
        }
    }

  ... 
  
    async getDeviceSchema(deviceId: string): Promise<DeviceSchema[]> {
        try {
            const schema = await SmartLifeModule.getDeviceSchema(deviceId);
            console.log('Device schema:', schema);
            return schema;
        } catch (error) {
            console.error('Error getting device schema:', error);
            throw error;
        }
    }

    async logout(): Promise<string> {
        try {
            const result = await SmartLifeModule.logout();
            console.log('Logout successful:', result);
            return result;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }
}

export default new SmartLifeService();
```

## Paso 3: Crear hook personalizado

```bash


interface UseSmartLifeState {
   isInitialized: boolean;
   isLoggedIn: boolean;
   user: TuyaUser | null;
   homes: TuyaHome[];
   devices: TuyaDevice[];
   selectedHome: TuyaHome | null;
   loading: boolean;
   error: string | null;
}

interface UseSmartLifeActions {
   initializeSDK: (appKey: string, secretKey: string) => Promise<void>;
   login: (email: string, password: string, countryCode?: string) => Promise<void>;
   loginWithPhone: (phone: string, password: string, countryCode?: string) => Promise<void>;
   logout: () => Promise<void>;
   loadHomes: () => Promise<void>;
   loadDevices: (homeId: number) => Promise<void>;
   selectHome: (home: TuyaHome) => Promise<void>;
   controlDevice: (deviceId: string, commands: any) => Promise<void>;
   refreshDevices: () => Promise<void>;
   clearError: () => void;
}

export const useSmartLife = (): UseSmartLifeState & UseSmartLifeActions => {
const [state, setState] = useState<UseSmartLifeState>({
   isInitialized: false,
   isLoggedIn: false,
   user: null,
   homes: [],
   devices: [],
   selectedHome: null,
   loading: false,
   error: null,
});

    const updateState = useCallback((updates: Partial<UseSmartLifeState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const setLoading = useCallback((loading: boolean) => {
        updateState({ loading });
    }, [updateState]);

    const setError = useCallback((error: string | null) => {
        updateState({ error });
    }, [updateState]);

    const initializeSDK = useCallback(async (appKey: string, secretKey: string) => {
        try {
            setLoading(true);
            setError(null);
            await SmartLifeService.initSDK(appKey, secretKey);
            updateState({ isInitialized: true });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to initialize SDK';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, updateState]);

    const login = useCallback(async (
        email: string,
        password: string,
        countryCode: string = '1'
    ) => {
        try {
            setLoading(true);
            setError(null);
            const user = await SmartLifeService.loginWithEmail(email, password, countryCode);
            updateState({
                isLoggedIn: true,
                user
            });
            await loadHomes();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, updateState]);

    const loginWithPhone = useCallback(async (
        phone: string,
        password: string,
        countryCode: string = '1'
    ) => {
        try {
            setLoading(true);
            setError(null);
            const user = await SmartLifeService.loginWithPhone(phone, password, countryCode);
            updateState({
                isLoggedIn: true,
                user
            });
            await loadHomes();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Phone login failed';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, updateState]);

    const logout = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await SmartLifeService.logout();
            updateState({
                isLoggedIn: false,
                user: null,
                homes: [],
                devices: [],
                selectedHome: null,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Logout failed';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, updateState]);

    const loadHomes = useCallback(async () => {
        try {
            setError(null);
            const homes = await SmartLifeService.getHomeList();
            updateState({ homes });

            if (homes.length > 0 && !state.selectedHome) {
                const firstHome = homes[0];
                updateState({ selectedHome: firstHome });
                await loadDevices(firstHome.homeId);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load homes';
            setError(errorMessage);
            throw error;
        }
    }, [setError, updateState, state.selectedHome]);

    const loadDevices = useCallback(async (homeId: number) => {
        try {
            setLoading(true);
            setError(null);
            const devices = await SmartLifeService.getDeviceList(homeId);
            updateState({ devices });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load devices';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, updateState]);

    const selectHome = useCallback(async (home: TuyaHome) => {
        updateState({ selectedHome: home });
        await loadDevices(home.homeId);
    }, [updateState, loadDevices]);

    const controlDevice = useCallback(async (deviceId: string, commands: any) => {
        try {
            setError(null);
            await SmartLifeService.controlDevice(deviceId, commands);

            // Refresh devices after control
            if (state.selectedHome) {
                await loadDevices(state.selectedHome.homeId);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to control device';
            setError(errorMessage);
            throw error;
        }
    }, [setError, state.selectedHome, loadDevices]);

    const refreshDevices = useCallback(async () => {
        if (state.selectedHome) {
            await loadDevices(state.selectedHome.homeId);
        }
    }, [state.selectedHome, loadDevices]);

    const clearError = useCallback(() => {
        setError(null);
    }, [setError]);

    return {
        ...state,
        initializeSDK,
        login,
        loginWithPhone,
        logout,
        loadHomes,
        loadDevices,
        selectHome,
        controlDevice,
        refreshDevices,
        clearError,
    };
};

...

};

```

# Uso_de_la_API

## Configuración de credenciales

```bash
const APP_CONFIG = {
   APP_KEY: '**********',
   SECRET_KEY: '***********',
};
```

## Inicialización y Login
```bash
const {
   initializeSDK,
   login,
   isInitialized,
   isLoggedIn
} = useSmartLife();

// Inicializar SDK
useEffect(() => {
i nitializeSDK(APP_CONFIG.APP_KEY, APP_CONFIG.SECRET_KEY);
}, []);

// Login
const handleLogin = async () => {
   try {
      await login('user@example.com', 'password', '593');
      console.log('Login exitoso');
   } catch (error) {
    console.error('Error en login:', error);
   }
};

```

## Recursos adicionales

- [Developer Guide for Android](https://developer.tuya.com/en/docs/app-development/featureoverview?id=Ka69nt97vtsfu)
- [Smart Industry App SDK](https://developer.tuya.com/en/docs/app-development/smart-industry-sdk?id=Kdl9j892m91y5)
- [Integración rápida con el SDK de la aplicación Smart Life para Android](https://developer.tuya.com/en/docs/app-development/integrated?id=Ka69nt96cw0uj)
- [tuya-home-android-sdk-sample-java](https://github.com/tuya/tuya-home-android-sdk-sample-java)


Desarrollado  con ❤️ por [Luis Alberto De La Torre](https://github.com/alberto-dt)







