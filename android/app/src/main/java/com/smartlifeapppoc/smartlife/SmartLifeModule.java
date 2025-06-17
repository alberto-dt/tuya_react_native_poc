package com.smartlifeapppoc.smartlife;

import android.app.Application;
import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.ReadableMap;

import com.thingclips.smart.android.user.api.ILoginCallback;
import com.thingclips.smart.android.user.api.IRegisterCallback;
import com.thingclips.smart.android.user.api.ILogoutCallback;
import com.thingclips.smart.android.user.bean.User;
import com.thingclips.smart.home.sdk.ThingHomeSdk;
import com.thingclips.smart.home.sdk.api.IThingHome;
import com.thingclips.smart.home.sdk.api.IThingHomeManager;
import com.thingclips.smart.home.sdk.callback.IThingHomeResultCallback;
import com.thingclips.smart.home.sdk.callback.IThingGetHomeListCallback;
import com.thingclips.smart.home.sdk.bean.HomeBean;
import com.thingclips.smart.sdk.api.IThingDevice;
import com.thingclips.smart.sdk.bean.DeviceBean;
import com.thingclips.smart.sdk.api.IResultCallback;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

public class SmartLifeModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmartLifeModule";
    private ReactApplicationContext reactContext;

    private static final AtomicInteger mockDeviceCounter = new AtomicInteger(1);
    private final List<WritableMap> mockDevices = new ArrayList<>();

    private boolean isPairingInProgress = false;
    private String currentPairingMode = null;

    public SmartLifeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "SmartLifeModule";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("EXAMPLE_CONSTANT", "example");
        constants.put("MOCK_DEVICE_PREFIX", "mock_device_");
        constants.put("PAIRING_AVAILABLE", false);
        return constants;
    }

    @ReactMethod
    public void listAvailableMethods(Promise promise) {
        try {
            String methods = "Available methods:\n" +
                    "- initSDK\n" +
                    "- loginWithEmail\n" +
                    "- logout\n" +
                    "- registerWithEmail\n" +
                    "- getHomeList\n" +
                    "- createHome\n" +
                    "- getDeviceList\n" +
                    "- getCurrentWifiSSID\n" +
                    "- startDevicePairingEZ (SIMULATED)\n" +
                    "- stopDevicePairing (SIMULATED)\n" +
                    "- addTestDevice\n" +
                    "- removeDevice\n" +
                    "- removeTestDevice\n" +
                    "- removeRealDevice\n" +
                    "- clearAllTestDevices\n" +
                    "- destroy";
            promise.resolve(methods);
        } catch (Exception e) {
            promise.reject("LIST_METHODS_ERROR", "Error listing methods: " + e.getMessage());
        }
    }

    @ReactMethod
    public void initSDK(String appKey, String secretKey, Promise promise) {
        try {
            Log.d(TAG, "Initializing Tuya SDK with appKey: " + appKey);

            Application application = (Application) getReactApplicationContext().getApplicationContext();
            ThingHomeSdk.init(application, appKey, secretKey);

            Log.d(TAG, "SDK initialization completed successfully");
            promise.resolve("SDK initialized successfully");

        } catch (Exception e) {
            Log.e(TAG, "Error initializing SDK: " + e.getMessage(), e);
            promise.reject("INIT_ERROR", "Failed to initialize SDK: " + e.getMessage());
        }
    }

    @ReactMethod
    public void loginWithEmail(String countryCode, String email, String password, Promise promise) {
        try {
            Log.d(TAG, "Attempting login with email: " + email + ", country: " + countryCode);

            ThingHomeSdk.getUserInstance().loginWithEmail(countryCode, email, password, new ILoginCallback() {
                @Override
                public void onSuccess(User user) {
                    Log.d(TAG, "Login successful for user: " + user.getUsername());

                    WritableMap userMap = new WritableNativeMap();
                    userMap.putString("uid", user.getUid());
                    userMap.putString("username", user.getUsername());
                    userMap.putString("email", user.getEmail());
                    userMap.putString("avatarUrl", "");

                    promise.resolve(userMap);
                }

                @Override
                public void onError(String code, String error) {
                    Log.e(TAG, "Login failed: " + code + " - " + error);
                    promise.reject(code, "Login failed: " + error);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception during login: " + e.getMessage(), e);
            promise.reject("LOGIN_ERROR", "Exception during login: " + e.getMessage());
        }
    }

    @ReactMethod
    public void logout(Promise promise) {
        try {
            Log.d(TAG, "Logging out user");

            ThingHomeSdk.getUserInstance().logout(new ILogoutCallback() {
                @Override
                public void onError(String code, String error) {
                    Log.e(TAG, "Logout failed: " + code + " - " + error);
                    promise.reject(code, "Logout failed: " + error);
                }

                @Override
                public void onSuccess() {
                    Log.d(TAG, "Logout successful");
                    promise.resolve("Logout successful");
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception during logout: " + e.getMessage(), e);
            promise.reject("LOGOUT_ERROR", "Exception during logout: " + e.getMessage());
        }
    }

    @ReactMethod
    public void registerWithEmail(String email, String password, String countryCode, Promise promise) {
        try {
            Log.d(TAG, "Attempting registration with email: " + email + ", country: " + countryCode);

            ThingHomeSdk.getUserInstance().registerAccountWithEmail(countryCode, email, password, new IRegisterCallback() {
                @Override
                public void onSuccess(User user) {
                    Log.d(TAG, "Registration successful for user: " + user.getUsername());

                    WritableMap userMap = new WritableNativeMap();
                    userMap.putString("uid", user.getUid());
                    userMap.putString("username", user.getUsername());
                    userMap.putString("email", user.getEmail());
                    userMap.putString("avatarUrl", "");

                    promise.resolve(userMap);
                }

                @Override
                public void onError(String code, String error) {
                    Log.e(TAG, "Registration failed: " + code + " - " + error);
                    promise.reject(code, "Registration failed: " + error);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception during registration: " + e.getMessage(), e);
            promise.reject("REGISTER_ERROR", "Exception during registration: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getHomeList(Promise promise) {
        try {
            Log.d(TAG, "Getting home list");

            ThingHomeSdk.getHomeManagerInstance().queryHomeList(new IThingGetHomeListCallback() {
                @Override
                public void onSuccess(java.util.List<HomeBean> homeBeans) {
                    Log.d(TAG, "Got " + homeBeans.size() + " homes");

                    WritableArray homeArray = new WritableNativeArray();

                    for (HomeBean home : homeBeans) {
                        WritableMap homeMap = new WritableNativeMap();
                        homeMap.putInt("homeId", (int) home.getHomeId());
                        homeMap.putString("name", home.getName());
                        homeMap.putString("geoName", home.getGeoName() != null ? home.getGeoName() : "");
                        homeMap.putDouble("lon", home.getLon());
                        homeMap.putDouble("lat", home.getLat());
                        homeMap.putString("address", "");

                        homeArray.pushMap(homeMap);
                    }

                    promise.resolve(homeArray);
                }

                @Override
                public void onError(String errorCode, String error) {
                    Log.e(TAG, "Error getting home list: " + errorCode + " - " + error);
                    promise.reject(errorCode, "Failed to get home list: " + error);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception getting home list: " + e.getMessage(), e);
            promise.reject("GET_HOMES_ERROR", "Exception getting home list: " + e.getMessage());
        }
    }

    @ReactMethod
    public void createHome(String homeName, String geoName, double lat, double lon, Promise promise) {
        try {
            Log.d(TAG, "Creating home: " + homeName + " at " + geoName);

            IThingHomeManager homeManager = ThingHomeSdk.getHomeManagerInstance();

            java.util.List<String> rooms = new java.util.ArrayList<>();

            homeManager.createHome(homeName, lat, lon, geoName, rooms, new IThingHomeResultCallback() {
                @Override
                public void onSuccess(HomeBean homeBean) {
                    Log.d(TAG, "Home created successfully: " + homeBean.getName());

                    WritableMap homeMap = new WritableNativeMap();
                    homeMap.putInt("homeId", (int) homeBean.getHomeId());
                    homeMap.putString("name", homeBean.getName());
                    homeMap.putString("geoName", homeBean.getGeoName() != null ? homeBean.getGeoName() : "");
                    homeMap.putDouble("lon", homeBean.getLon());
                    homeMap.putDouble("lat", homeBean.getLat());
                    homeMap.putString("address", "");

                    promise.resolve(homeMap);
                }

                @Override
                public void onError(String errorCode, String error) {
                    Log.e(TAG, "Error creating home: " + errorCode + " - " + error);
                    promise.reject(errorCode, "Failed to create home: " + error);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception creating home: " + e.getMessage(), e);
            promise.reject("CREATE_HOME_ERROR", "Exception creating home: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getDeviceList(int homeId, Promise promise) {
        Log.d(TAG, "=== GET DEVICE LIST (WITH MOCK SUPPORT) ===");
        Log.d(TAG, "Home ID: " + homeId);

        try {
            ThingHomeSdk.newHomeInstance(homeId).getHomeDetail(new IThingHomeResultCallback() {
                @Override
                public void onSuccess(HomeBean homeBean) {
                    Log.d(TAG, "Got home details for: " + homeBean.getName());

                    WritableArray deviceArray = new WritableNativeArray();

                    if (homeBean.getDeviceList() != null && !homeBean.getDeviceList().isEmpty()) {
                        Log.d(TAG, "Found " + homeBean.getDeviceList().size() + " real devices");

                        for (DeviceBean device : homeBean.getDeviceList()) {
                            WritableMap deviceMap = convertDeviceBeanToMap(device);
                            deviceArray.pushMap(deviceMap);
                        }
                    }

                    Log.d(TAG, "Adding " + mockDevices.size() + " mock devices");
                    for (WritableMap mockDevice : mockDevices) {
                        deviceArray.pushMap(mockDevice);
                    }

                    Log.d(TAG, "Returning " + deviceArray.size() + " total devices");
                    promise.resolve(deviceArray);
                }

                @Override
                public void onError(String errorCode, String errorMessage) {
                    Log.e(TAG, "Error getting home details: " + errorCode + " - " + errorMessage);

                    WritableArray deviceArray = new WritableNativeArray();
                    for (WritableMap mockDevice : mockDevices) {
                        deviceArray.pushMap(mockDevice);
                    }

                    Log.d(TAG, "Returning only " + mockDevices.size() + " mock devices due to error");
                    promise.resolve(deviceArray);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception getting device list: " + e.getMessage(), e);

            WritableArray deviceArray = new WritableNativeArray();
            for (WritableMap mockDevice : mockDevices) {
                deviceArray.pushMap(mockDevice);
            }
            promise.resolve(deviceArray);
        }
    }

    @ReactMethod
    public void getCurrentWifiSSID(Promise promise) {
        try {
            String ssid = getCurrentWifiName();
            Log.d(TAG, "Current WiFi SSID: " + ssid);
            promise.resolve(ssid);
        } catch (Exception e) {
            Log.e(TAG, "Exception getting WiFi SSID: " + e.getMessage(), e);
            promise.reject("WIFI_SSID_ERROR", "Exception getting WiFi SSID: " + e.getMessage());
        }
    }

    @ReactMethod
    public void startDevicePairingEZ(int homeId, String ssid, String password, int timeout, Promise promise) {
        Log.d(TAG, "=== START DEVICE PAIRING EZ MODE (SIMULATED) ===");
        Log.d(TAG, "Home ID: " + homeId);
        Log.d(TAG, "SSID: " + ssid);
        Log.d(TAG, "Timeout: " + timeout);

        if (isPairingInProgress) {
            promise.reject("PAIRING_IN_PROGRESS", "Device pairing is already in progress. Stop current pairing first.");
            return;
        }

        try {
            isPairingInProgress = true;
            currentPairingMode = "EZ";

            android.os.Handler handler = new android.os.Handler();
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        WritableMap pairedDevice = createSimulatedPairedDevice(ssid);

                        isPairingInProgress = false;
                        currentPairingMode = null;

                        Log.d(TAG, "EZ Pairing simulation completed successfully");
                        promise.resolve(pairedDevice);

                    } catch (Exception e) {
                        isPairingInProgress = false;
                        currentPairingMode = null;
                        promise.reject("EZ_PAIRING_SIMULATION_ERROR", "EZ Pairing simulation failed: " + e.getMessage());
                    }
                }
            }, 3000);

        } catch (Exception e) {
            Log.e(TAG, "Exception starting EZ pairing simulation: " + e.getMessage(), e);
            isPairingInProgress = false;
            currentPairingMode = null;
            promise.reject("START_EZ_PAIRING_ERROR", "Exception starting EZ pairing simulation: " + e.getMessage());
        }
    }

    @ReactMethod
    public void stopDevicePairing(Promise promise) {
        Log.d(TAG, "=== STOP DEVICE PAIRING ===");

        try {
            isPairingInProgress = false;
            currentPairingMode = null;

            Log.d(TAG, "Device pairing stopped successfully");
            promise.resolve("Device pairing stopped successfully");

        } catch (Exception e) {
            Log.e(TAG, "Exception stopping device pairing: " + e.getMessage(), e);
            promise.reject("STOP_PAIRING_ERROR", "Exception stopping device pairing: " + e.getMessage());
        }
    }

    private WritableMap createSimulatedPairedDevice(String networkName) {
        WritableMap deviceMap = new WritableNativeMap();

        long timestamp = System.currentTimeMillis();
        String deviceId = "paired_" + timestamp;

        deviceMap.putString("devId", deviceId);
        deviceMap.putString("name", "Dispositivo Emparejado - " + networkName);
        deviceMap.putString("iconUrl", "https://images.tuyacn.com/smart/icon/switch.png");
        deviceMap.putBoolean("isOnline", true);
        deviceMap.putString("productId", "paired_product_" + timestamp);

        deviceMap.putString("uuid", "paired_uuid_" + timestamp);
        deviceMap.putString("category", "switch");
        deviceMap.putString("productName", "Dispositivo Recién Emparejado");
        deviceMap.putBoolean("isLocalOnline", true);
        deviceMap.putBoolean("isSub", false);
        deviceMap.putBoolean("isShare", false);

        WritableArray functionsArray = new WritableNativeArray();
        functionsArray.pushString("switch_1");
        deviceMap.putArray("supportedFunctions", functionsArray);

        WritableMap statusMap = new WritableNativeMap();
        statusMap.putBoolean("switch_1", false);
        deviceMap.putMap("status", statusMap);

        mockDevices.add(deviceMap);

        Log.d(TAG, "Simulated paired device created: " + deviceMap.getString("name"));
        return deviceMap;
    }

    @ReactMethod
    public void addTestDevice(int homeId, String deviceName, String deviceType, Promise promise) {
        try {
            Log.d(TAG, "=== ADDING TEST DEVICE ===");
            Log.d(TAG, "Home ID: " + homeId);
            Log.d(TAG, "Device Name: " + deviceName);
            Log.d(TAG, "Device Type: " + deviceType);

            WritableMap testDevice = createMockDevice(deviceName, deviceType);
            mockDevices.add(testDevice);

            Log.d(TAG, "Test device created successfully: " + deviceName);
            promise.resolve(testDevice);

        } catch (Exception e) {
            Log.e(TAG, "Error adding test device: " + e.getMessage(), e);
            promise.reject("ADD_TEST_DEVICE_ERROR", "Error agregando dispositivo de prueba: " + e.getMessage());
        }
    }

    @ReactMethod
    public void removeTestDevice(String deviceId, Promise promise) {
        try {
            Log.d(TAG, "=== REMOVE TEST DEVICE ===");
            Log.d(TAG, "Device ID: " + deviceId);

            WritableMap removedDevice = null;
            for (int i = 0; i < mockDevices.size(); i++) {
                WritableMap device = mockDevices.get(i);
                if (device.hasKey("devId") && deviceId.equals(device.getString("devId"))) {
                    removedDevice = mockDevices.remove(i);
                    break;
                }
            }

            if (removedDevice == null) {
                promise.reject("DEVICE_NOT_FOUND", "Dispositivo de prueba no encontrado: " + deviceId);
                return;
            }

            Log.d(TAG, "Test device removed successfully: " + deviceId);
            promise.resolve("Dispositivo de prueba eliminado exitosamente");

        } catch (Exception e) {
            Log.e(TAG, "Error removing test device: " + e.getMessage(), e);
            promise.reject("REMOVE_TEST_DEVICE_ERROR", "Error eliminando dispositivo de prueba: " + e.getMessage());
        }
    }

    @ReactMethod
    public void removeRealDevice(String deviceId, int homeId, Promise promise) {
        try {
            Log.d(TAG, "=== REMOVE REAL DEVICE ===");
            Log.d(TAG, "Device ID: " + deviceId);
            Log.d(TAG, "Home ID: " + homeId);

            IThingDevice device = ThingHomeSdk.newDeviceInstance(deviceId);
            device.removeDevice(new IResultCallback() {
                @Override
                public void onError(String code, String error) {
                    Log.e(TAG, "Error removing real device: " + code + " - " + error);
                    promise.reject(code, "Error eliminando dispositivo real: " + error);
                }

                @Override
                public void onSuccess() {
                    Log.d(TAG, "Real device removed successfully: " + deviceId);
                    promise.resolve("Dispositivo real eliminado exitosamente");
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Error removing real device: " + e.getMessage(), e);
            promise.reject("REMOVE_REAL_DEVICE_ERROR", "Error eliminando dispositivo real: " + e.getMessage());
        }
    }

    @ReactMethod
    public void removeDevice(String deviceId, int homeId, Promise promise) {
        try {
            Log.d(TAG, "=== REMOVE DEVICE ===");
            Log.d(TAG, "Device ID: " + deviceId);
            Log.d(TAG, "Home ID: " + homeId);

            if (deviceId.startsWith("mock_") || deviceId.startsWith("test_") || deviceId.startsWith("paired_")) {
                removeTestDevice(deviceId, promise);
            } else {
                removeRealDevice(deviceId, homeId, promise);
            }

        } catch (Exception e) {
            Log.e(TAG, "Error removing device: " + e.getMessage(), e);
            promise.reject("REMOVE_DEVICE_ERROR", "Error eliminando dispositivo: " + e.getMessage());
        }
    }

    @ReactMethod
    public void clearAllTestDevices(Promise promise) {
        try {
            Log.d(TAG, "=== CLEAR ALL TEST DEVICES ===");

            int count = mockDevices.size();
            mockDevices.clear();

            Log.d(TAG, "Cleared " + count + " test devices");
            promise.resolve("Eliminados " + count + " dispositivos de prueba exitosamente");

        } catch (Exception e) {
            Log.e(TAG, "Error clearing test devices: " + e.getMessage(), e);
            promise.reject("CLEAR_TEST_DEVICES_ERROR", "Error limpiando dispositivos de prueba: " + e.getMessage());
        }
    }

    private WritableMap convertDeviceBeanToMap(DeviceBean device) {
        WritableMap deviceMap = new WritableNativeMap();

        deviceMap.putString("devId", device.getDevId() != null ? device.getDevId() : "");
        deviceMap.putString("name", device.getName() != null ? device.getName() : "Dispositivo sin nombre");
        deviceMap.putString("iconUrl", device.getIconUrl() != null ? device.getIconUrl() : "");
        deviceMap.putBoolean("isOnline", device.getIsOnline());
        deviceMap.putString("productId", device.getProductId() != null ? device.getProductId() : "");

        deviceMap.putString("uuid", device.getUuid() != null ? device.getUuid() : "");
        deviceMap.putString("category", device.getCategory() != null ? device.getCategory() : "");

        String productInfo = device.getProductId() != null ? device.getProductId() : "";
        deviceMap.putString("productName", productInfo);

        deviceMap.putBoolean("isLocalOnline", device.getIsLocalOnline());
        deviceMap.putBoolean("isSub", false);
        deviceMap.putBoolean("isShare", device.getIsShare());

        WritableArray functionsArray = new WritableNativeArray();
        if (device.getSchemaMap() != null && !device.getSchemaMap().isEmpty()) {
            for (String functionCode : device.getSchemaMap().keySet()) {
                functionsArray.pushString(functionCode);
            }
        }
        deviceMap.putArray("supportedFunctions", functionsArray);

        WritableMap statusMap = new WritableNativeMap();
        if (device.getDps() != null && !device.getDps().isEmpty()) {
            for (String dpId : device.getDps().keySet()) {
                Object dpValue = device.getDps().get(dpId);
                if (dpValue != null) {
                    if (dpValue instanceof Boolean) {
                        statusMap.putBoolean(dpId, (Boolean) dpValue);
                    } else if (dpValue instanceof Integer) {
                        statusMap.putInt(dpId, (Integer) dpValue);
                    } else if (dpValue instanceof Double) {
                        statusMap.putDouble(dpId, (Double) dpValue);
                    } else {
                        statusMap.putString(dpId, dpValue.toString());
                    }
                }
            }
        }
        deviceMap.putMap("status", statusMap);

        return deviceMap;
    }

    private WritableMap createMockDevice(String deviceName, String deviceType) {
        int deviceNumber = mockDeviceCounter.getAndIncrement();
        String deviceId = "test_" + deviceType + "_" + deviceNumber + "_" + System.currentTimeMillis();

        WritableMap mockDevice = new WritableNativeMap();
        mockDevice.putString("devId", deviceId);
        mockDevice.putString("name", deviceName);
        mockDevice.putString("iconUrl", getMockIconUrl(deviceType));
        mockDevice.putBoolean("isOnline", true);
        mockDevice.putString("productId", "mock_product_" + deviceType);

        mockDevice.putString("uuid", "mock_uuid_" + deviceNumber);
        mockDevice.putString("category", deviceType);
        mockDevice.putString("productName", "Mock " + deviceType + " Device");
        mockDevice.putBoolean("isLocalOnline", true);
        mockDevice.putBoolean("isSub", false);
        mockDevice.putBoolean("isShare", false);

        WritableArray functions = getMockFunctions(deviceType);
        mockDevice.putArray("supportedFunctions", functions);

        WritableMap status = getMockInitialStatus(deviceType);
        mockDevice.putMap("status", status);

        return mockDevice;
    }

    private String getMockIconUrl(String deviceType) {
        switch (deviceType.toLowerCase()) {
            case "light":
                return "https://images.tuyacn.com/smart/icon/light.png";
            case "sensor":
                return "https://images.tuyacn.com/smart/icon/sensor.png";
            case "plug":
                return "https://images.tuyacn.com/smart/icon/plug.png";
            case "fan":
                return "https://images.tuyacn.com/smart/icon/fan.png";
            case "thermostat":
                return "https://images.tuyacn.com/smart/icon/thermostat.png";
            default:
                return "https://images.tuyacn.com/smart/icon/switch.png";
        }
    }

    private WritableArray getMockFunctions(String deviceType) {
        WritableArray functions = new WritableNativeArray();

        switch (deviceType.toLowerCase()) {
            case "light":
                functions.pushString("switch_1");
                functions.pushString("bright_value");
                functions.pushString("temp_value");
                functions.pushString("colour_data");
                break;
            case "sensor":
                functions.pushString("temp_current");
                functions.pushString("humidity_value");
                functions.pushString("battery_percentage");
                break;
            case "plug":
                functions.pushString("switch_1");
                functions.pushString("cur_power");
                functions.pushString("cur_voltage");
                break;
            case "fan":
                functions.pushString("switch_1");
                functions.pushString("fan_speed");
                functions.pushString("mode");
                break;
            case "thermostat":
                functions.pushString("switch_1");
                functions.pushString("temp_set");
                functions.pushString("temp_current");
                functions.pushString("mode");
                break;
            default:
                functions.pushString("switch_1");
                functions.pushString("switch_2");
                functions.pushString("switch_3");
                break;
        }

        return functions;
    }

    private WritableMap getMockInitialStatus(String deviceType) {
        WritableMap status = new WritableNativeMap();

        switch (deviceType.toLowerCase()) {
            case "light":
                status.putBoolean("switch_1", false);
                status.putInt("bright_value", 255);
                status.putInt("temp_value", 500);
                status.putString("work_mode", "white");
                break;
            case "sensor":
                status.putInt("temp_current", 22);
                status.putInt("humidity_value", 45);
                status.putInt("battery_percentage", 85);
                break;
            case "plug":
                status.putBoolean("switch_1", false);
                status.putInt("cur_power", 0);
                status.putInt("cur_voltage", 220);
                break;
            case "fan":
                status.putBoolean("switch_1", false);
                status.putInt("fan_speed", 1);
                status.putString("mode", "straight_wind");
                break;
            case "thermostat":
                status.putBoolean("switch_1", false);
                status.putInt("temp_set", 23);
                status.putInt("temp_current", 22);
                status.putString("mode", "auto");
                break;
            default:
                status.putBoolean("switch_1", false);
                status.putBoolean("switch_2", false);
                status.putBoolean("switch_3", false);
                break;
        }

        return status;
    }

    private String getCurrentWifiName() {
        try {
            WifiManager wifiManager = (WifiManager) getReactApplicationContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null) {
                WifiInfo wifiInfo = wifiManager.getConnectionInfo();
                if (wifiInfo != null) {
                    String ssid = wifiInfo.getSSID();
                    if (ssid != null && !ssid.equals("<unknown ssid>")) {
                        if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
                            ssid = ssid.substring(1, ssid.length() - 1);
                        }
                        return ssid;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting WiFi name: " + e.getMessage(), e);
        }
        return "";
    }

    @ReactMethod
    public void destroy(Promise promise) {
        try {
            Log.d(TAG, "Destroying SmartLifeModule");

            isPairingInProgress = false;
            currentPairingMode = null;

            mockDevices.clear();
            mockDeviceCounter.set(1);

            Log.d(TAG, "SmartLifeModule destroyed successfully");
            promise.resolve("SmartLifeModule destroyed successfully");

        } catch (Exception e) {
            Log.e(TAG, "Error destroying SmartLifeModule: " + e.getMessage(), e);
            promise.reject("DESTROY_ERROR", "Error destroying SmartLifeModule: " + e.getMessage());
        }
    }
}
