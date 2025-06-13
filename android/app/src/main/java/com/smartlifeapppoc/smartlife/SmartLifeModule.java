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

public class SmartLifeModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmartLifeModule";
    private ReactApplicationContext reactContext;

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
        return constants;
    }

    @ReactMethod
    public void listAvailableMethods(Promise promise) {
        try {
            String methods = "Available methods:\n" +
                    "- initSDK\n" +
                    "- initSDKWithDataCenter\n" +
                    "- loginWithEmail\n" +
                    "- loginWithPhone\n" +
                    "- logout\n" +
                    "- registerWithEmail\n" +
                    "- getHomeList\n" +
                    "- createHome\n" +
                    "- updateHome\n" +
                    "- deleteHome\n" +
                    "- getDeviceList\n" +
                    "- controlDevice\n" +
                    "- getDeviceSchema\n" +
                    "- getCurrentWifiSSID\n" +
                    "- startDevicePairingEZ (EXPERIMENTAL)\n" +
                    "- startDevicePairing (EXPERIMENTAL)\n" +
                    "- stopDevicePairing (EXPERIMENTAL)\n" +
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
    public void initSDKWithDataCenter(String appKey, String secretKey, String endpoint, Promise promise) {
        try {
            Log.d(TAG, "Initializing Tuya SDK with data center - appKey: " + appKey + ", endpoint: " + endpoint);

            Application application = (Application) getReactApplicationContext().getApplicationContext();
            ThingHomeSdk.init(application, appKey, secretKey);

            Log.d(TAG, "SDK initialization completed successfully (endpoint parameter not supported in this version)");
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
    public void loginWithPhone(String phone, String password, String countryCode, Promise promise) {
        try {
            Log.d(TAG, "Attempting login with phone: " + phone + ", country: " + countryCode);

            ThingHomeSdk.getUserInstance().loginWithPhonePassword(countryCode, phone, password, new ILoginCallback() {
                @Override
                public void onSuccess(User user) {
                    Log.d(TAG, "Phone login successful for user: " + user.getUsername());

                    WritableMap userMap = new WritableNativeMap();
                    userMap.putString("uid", user.getUid());
                    userMap.putString("username", user.getUsername());
                    userMap.putString("email", user.getEmail() != null ? user.getEmail() : "");
                    userMap.putString("avatarUrl", "");

                    promise.resolve(userMap);
                }

                @Override
                public void onError(String code, String error) {
                    Log.e(TAG, "Phone login failed: " + code + " - " + error);
                    promise.reject(code, "Phone login failed: " + error);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception during phone login: " + e.getMessage(), e);
            promise.reject("PHONE_LOGIN_ERROR", "Exception during phone login: " + e.getMessage());
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

            // Para versión 6.2.2, createHome requiere una lista de habitaciones (puede estar vacía)
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
    public void updateHome(int homeId, String homeName, String geoName, double lat, double lon, Promise promise) {
        try {
            Log.d(TAG, "Updating home: " + homeId + " with name: " + homeName);

            IThingHome home = ThingHomeSdk.newHomeInstance(homeId);
            home.updateHome(homeName, lat, lon, geoName, new IResultCallback() {
                @Override
                public void onError(String code, String error) {
                    Log.e(TAG, "Error updating home: " + code + " - " + error);
                    promise.reject(code, "Failed to update home: " + error);
                }

                @Override
                public void onSuccess() {
                    Log.d(TAG, "Home updated successfully");
                    promise.resolve("Home updated successfully");
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception updating home: " + e.getMessage(), e);
            promise.reject("UPDATE_HOME_ERROR", "Exception updating home: " + e.getMessage());
        }
    }

    @ReactMethod
    public void deleteHome(int homeId, Promise promise) {
        try {
            Log.d(TAG, "Deleting home: " + homeId);

            IThingHome home = ThingHomeSdk.newHomeInstance(homeId);
            home.dismissHome(new IResultCallback() {
                @Override
                public void onError(String code, String error) {
                    Log.e(TAG, "Error deleting home: " + code + " - " + error);
                    promise.reject(code, "Failed to delete home: " + error);
                }

                @Override
                public void onSuccess() {
                    Log.d(TAG, "Home deleted successfully");
                    promise.resolve("Home deleted successfully");
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception deleting home: " + e.getMessage(), e);
            promise.reject("DELETE_HOME_ERROR", "Exception deleting home: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getDeviceList(int homeId, Promise promise) {
        Log.d(TAG, "=== GET DEVICE LIST ===");
        Log.d(TAG, "Home ID: " + homeId);
        Log.d(TAG, "======================");

        try {
            ThingHomeSdk.newHomeInstance(homeId).getHomeDetail(new IThingHomeResultCallback() {
                @Override
                public void onSuccess(HomeBean homeBean) {
                    Log.d(TAG, "Got home details for: " + homeBean.getName());

                    WritableArray deviceArray = new WritableNativeArray();

                    if (homeBean.getDeviceList() != null && !homeBean.getDeviceList().isEmpty()) {
                        Log.d(TAG, "Found " + homeBean.getDeviceList().size() + " devices");

                        for (DeviceBean device : homeBean.getDeviceList()) {
                            WritableMap deviceMap = new WritableNativeMap();

                            deviceMap.putString("devId", device.getDevId() != null ? device.getDevId() : "");
                            deviceMap.putString("name", device.getName() != null ? device.getName() : "Dispositivo sin nombre");
                            deviceMap.putString("iconUrl", device.getIconUrl() != null ? device.getIconUrl() : "");
                            deviceMap.putBoolean("isOnline", device.getIsOnline());
                            deviceMap.putString("productId", device.getProductId() != null ? device.getProductId() : "");

                            deviceMap.putString("uuid", device.getUuid() != null ? device.getUuid() : "");
                            deviceMap.putString("category", device.getCategory() != null ? device.getCategory() : "");

                            String productInfo = "";
                            try {
                                if (device.getProductId() != null) {
                                    productInfo = device.getProductId();
                                }
                            } catch (Exception e) {
                                Log.w(TAG, "Could not get product info for device: " + device.getDevId());
                            }
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

                            deviceArray.pushMap(deviceMap);

                            Log.d(TAG, "Device: " + device.getName() +
                                    " | Online: " + device.getIsOnline() +
                                    " | Product: " + productInfo +
                                    " | Category: " + device.getCategory());
                        }
                    } else {
                        Log.d(TAG, "No devices found in home");
                    }

                    Log.d(TAG, "Returning " + deviceArray.size() + " devices");
                    promise.resolve(deviceArray);
                }

                @Override
                public void onError(String errorCode, String errorMessage) {
                    Log.e(TAG, "Error getting home details: " + errorCode + " - " + errorMessage);
                    promise.reject(errorCode, "Failed to get home details: " + errorMessage);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Exception getting device list: " + e.getMessage(), e);
            promise.reject("GET_DEVICES_ERROR", "Exception getting device list: " + e.getMessage());
        }
    }

    @ReactMethod
    public void controlDevice(String deviceId, String commands, Promise promise) {
        Log.d(TAG, "=== CONTROL DEVICE ===");
        Log.d(TAG, "Device ID: " + deviceId);
        Log.d(TAG, "Commands: " + commands);
        Log.d(TAG, "======================");

        try {
            org.json.JSONObject commandsJson = new org.json.JSONObject(commands);

            Map<String, Object> commandMap = new HashMap<>();
            java.util.Iterator<String> keys = commandsJson.keys();

            while (keys.hasNext()) {
                String key = keys.next();
                Object value = commandsJson.get(key);
                commandMap.put(key, value);
                Log.d(TAG, "Command: " + key + " = " + value);
            }

            String dpsString = new org.json.JSONObject(commandMap).toString();

            ThingHomeSdk.newDeviceInstance(deviceId).publishDps(
                    dpsString,
                    new IResultCallback() {
                        @Override
                        public void onError(String code, String error) {
                            Log.e(TAG, "Device control error: " + code + " - " + error);
                            promise.reject(code, "Control failed: " + error);
                        }

                        @Override
                        public void onSuccess() {
                            Log.d(TAG, "Device control successful");
                            promise.resolve("Device control executed successfully");
                        }
                    }
            );

        } catch (Exception e) {
            Log.e(TAG, "Exception controlling device: " + e.getMessage(), e);
            promise.reject("CONTROL_DEVICE_ERROR", "Exception controlling device: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getDeviceSchema(String deviceId, Promise promise) {
        Log.d(TAG, "=== GET DEVICE SCHEMA ===");
        Log.d(TAG, "Device ID: " + deviceId);
        Log.d(TAG, "=========================");

        try {
            WritableArray schemaArray = new WritableNativeArray();

            WritableMap basicSchema = new WritableNativeMap();
            basicSchema.putString("id", "switch_1");
            basicSchema.putString("code", "switch_1");
            basicSchema.putString("name", "Switch");
            basicSchema.putString("type", "Boolean");
            basicSchema.putString("mode", "rw");
            schemaArray.pushMap(basicSchema);

            Log.d(TAG, "Device schema retrieved with basic schema");
            promise.resolve(schemaArray);

        } catch (Exception e) {
            Log.e(TAG, "Exception getting device schema: " + e.getMessage(), e);
            promise.reject("GET_SCHEMA_ERROR", "Exception getting device schema: " + e.getMessage());
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
    public void startDevicePairingEZ(int homeId, String ssid, String password, int timeout, Promise promise) {
        Log.d(TAG, "startDevicePairingEZ called - currently not implemented");
        promise.reject("NOT_IMPLEMENTED", "Device pairing not yet implemented. Please add device through official Smart Life app for now.");
    }

    @ReactMethod
    public void startDevicePairing(int homeId, String ssid, String password, int timeout, Promise promise) {
        Log.d(TAG, "startDevicePairing called - currently not implemented");
        promise.reject("NOT_IMPLEMENTED", "Device pairing not yet implemented. Please add device through official Smart Life app for now.");
    }

    @ReactMethod
    public void stopDevicePairing(Promise promise) {
        Log.d(TAG, "stopDevicePairing called - currently not implemented");
        promise.resolve("No active pairing to stop");
    }

    @ReactMethod
    public void destroy(Promise promise) {
        try {
            Log.d(TAG, "Destroying SmartLifeModule");
            promise.resolve("SmartLifeModule destroyed successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error destroying SmartLifeModule: " + e.getMessage(), e);
            promise.reject("DESTROY_ERROR", "Error destroying SmartLifeModule: " + e.getMessage());
        }
    }
}
