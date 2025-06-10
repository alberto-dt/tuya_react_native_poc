package com.smartlifeapppoc.smartlife;

import android.app.Application;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

// Imports actualizados para SDK 6.2.2
import com.thingclips.smart.home.sdk.ThingHomeSdk;
import com.thingclips.smart.home.sdk.callback.IThingGetHomeListCallback;
import com.thingclips.smart.home.sdk.callback.IThingHomeResultCallback;
import com.thingclips.smart.home.sdk.bean.HomeBean;
import com.thingclips.smart.sdk.api.IResultCallback;
import com.thingclips.smart.sdk.bean.DeviceBean;
import com.thingclips.smart.android.user.api.ILoginCallback;
import com.thingclips.smart.android.user.api.IRegisterCallback;
import com.thingclips.smart.android.user.api.ILogoutCallback;
import com.thingclips.smart.android.user.bean.User;
// Remover IThingDevice import - no disponible en esta versión
import com.thingclips.smart.android.device.bean.SchemaBean;

import java.util.List;

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

    @ReactMethod
    public void loginWithEmail(String countryCode, String email, String password, Promise promise) {
        Log.d(TAG, "loginWithEmail called");
        ThingHomeSdk.getUserInstance().loginWithEmail(countryCode, email, password, new ILoginCallback() {
            @Override
            public void onSuccess(User user) {
                Log.d(TAG, "Login successful for user: " + user.getUsername());
                WritableMap userMap = new WritableNativeMap();
                userMap.putString("uid", user.getUid());
                userMap.putString("username", user.getUsername());
                userMap.putString("email", user.getEmail());
                // Propiedades actualizadas para SDK 6.2.2
                userMap.putString("avatarUrl", user.getHeadPic());
                userMap.putString("nickname", user.getNickName());
                promise.resolve(userMap);
            }

            @Override
            public void onError(String code, String error) {
                Log.e(TAG, "Login error: " + code + " - " + error);
                promise.reject(code, error);
            }
        });
    }

    @ReactMethod
    public void registerWithEmail(String countryCode, String email, String password, String code, Promise promise) {
        Log.d(TAG, "registerWithEmail called");
        ThingHomeSdk.getUserInstance().registerAccountWithEmail(countryCode, email, password, code, new IRegisterCallback() {
            @Override
            public void onSuccess(User user) {
                Log.d(TAG, "Registration successful for user: " + user.getUsername());
                WritableMap userMap = new WritableNativeMap();
                userMap.putString("uid", user.getUid());
                userMap.putString("username", user.getUsername());
                userMap.putString("email", user.getEmail());
                promise.resolve(userMap);
            }

            @Override
            public void onError(String code, String error) {
                Log.e(TAG, "Registration error: " + code + " - " + error);
                promise.reject(code, error);
            }
        });
    }

    @ReactMethod
    public void getHomeList(Promise promise) {
        Log.d(TAG, "getHomeList called");
        // Callback actualizado para SDK 6.2.2
        ThingHomeSdk.getHomeManagerInstance().queryHomeList(new IThingGetHomeListCallback() {
            @Override
            public void onSuccess(List<HomeBean> homeBeans) {
                Log.d(TAG, "Got home list with " + homeBeans.size() + " homes");
                WritableArray homeArray = new WritableNativeArray();

                for (HomeBean home : homeBeans) {
                    WritableMap homeMap = new WritableNativeMap();
                    homeMap.putDouble("homeId", home.getHomeId());
                    homeMap.putString("name", home.getName());
                    // Propiedades actualizadas para SDK 6.2.2
                    homeMap.putString("geoName", home.getGeoName());
                    homeMap.putDouble("lon", home.getLon());
                    homeMap.putDouble("lat", home.getLat());
                    homeArray.pushMap(homeMap);
                }
                promise.resolve(homeArray);
            }

            @Override
            public void onError(String errorCode, String errorMessage) {
                Log.e(TAG, "Error getting home list: " + errorCode + " - " + errorMessage);
                promise.reject(errorCode, errorMessage);
            }
        });
    }

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

    @ReactMethod
    public void getDeviceDetail(String deviceId, Promise promise) {
        Log.d(TAG, "getDeviceDetail called for deviceId: " + deviceId);
        try {

            ThingHomeSdk.getHomeManagerInstance().queryHomeList(new IThingGetHomeListCallback() {
                @Override
                public void onSuccess(List<HomeBean> homeBeans) {
                    for (HomeBean home : homeBeans) {
                        if (home.getDeviceList() != null) {
                            for (DeviceBean device : home.getDeviceList()) {
                                if (device.getDevId().equals(deviceId)) {
                                    WritableMap deviceMap = new WritableNativeMap();
                                    deviceMap.putString("devId", device.getDevId());
                                    deviceMap.putString("name", device.getName());
                                    deviceMap.putString("iconUrl", device.getIconUrl());
                                    deviceMap.putBoolean("isOnline", device.getIsOnline());
                                    deviceMap.putString("productId", device.getProductId());

                                    // Schema information
                                    WritableArray schemaArray = new WritableNativeArray();
                                    if (device.getSchemaMap() != null) {
                                        for (SchemaBean schema : device.getSchemaMap().values()) {
                                            WritableMap schemaMap = new WritableNativeMap();
                                            schemaMap.putString("id", schema.getId());
                                            schemaMap.putString("name", schema.getName());
                                            schemaMap.putString("type", schema.getType());
                                            schemaArray.pushMap(schemaMap);
                                        }
                                    }
                                    deviceMap.putArray("schema", schemaArray);
                                    promise.resolve(deviceMap);
                                    return;
                                }
                            }
                        }
                    }
                    promise.reject("DEVICE_NOT_FOUND", "Device not found");
                }

                @Override
                public void onError(String errorCode, String errorMessage) {
                    Log.e(TAG, "Error getting device detail: " + errorCode + " - " + errorMessage);
                    promise.reject(errorCode, errorMessage);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error getting device detail: " + e.getMessage(), e);
            promise.reject("DEVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void controlDevice(String deviceId, String command, Object value, Promise promise) {
        Log.d(TAG, "controlDevice called for deviceId: " + deviceId + ", command: " + command);
        try {
            // Método alternativo sin IThingDevice
            // Nota: Para control completo de dispositivos, se necesitaría implementar
            // usando ThingHomeSdk.newHomeInstance(homeId).getHomeBean().getDeviceList()
            // y luego usar el método de control específico del SDK 6.2.2

            // Por ahora, implementación básica que indica que se necesita más configuración
            Log.w(TAG, "Device control requires additional implementation for SDK 6.2.2");
            promise.reject("NOT_IMPLEMENTED", "Device control needs to be implemented with specific home context in SDK 6.2.2");

        } catch (Exception e) {
            Log.e(TAG, "Error controlling device: " + e.getMessage(), e);
            promise.reject("CONTROL_ERROR", e.getMessage());
        }
    }

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

    @ReactMethod
    public void destroy() {
        Log.d(TAG, "destroy called");
        try {
            ThingHomeSdk.onDestroy();
            Log.d(TAG, "SDK destroyed successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error destroying SDK: " + e.getMessage(), e);
        }
    }
}
