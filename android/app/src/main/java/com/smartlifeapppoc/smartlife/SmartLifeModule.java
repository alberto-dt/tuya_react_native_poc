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
import com.thingclips.smart.android.device.bean.SchemaBean;

import java.lang.reflect.Method;
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
            Application application = (Application) getReactApplicationContext().getApplicationContext();
            ThingHomeSdk.init(application, appKey, secretKey);
            ThingHomeSdk.setDebugMode(true);
            Log.d(TAG, "ThingHomeSdk initialized successfully");
            promise.resolve("Smart Life SDK initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing SDK: " + e.getMessage(), e);
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void initSDKWithDataCenter(String appKey, String secretKey, String endpoint, Promise promise) {
        Log.d(TAG, "initSDK with data center endpoint: " + endpoint);
        try {
            try {
                ThingHomeSdk.onDestroy();
            } catch (Exception e) {
                Log.w(TAG, "No previous SDK to destroy");
            }

            Application application = (Application) getReactApplicationContext().getApplicationContext();

            ThingHomeSdk.init(application, appKey, secretKey);
            ThingHomeSdk.setDebugMode(true);

            Log.d(TAG, "ThingHomeSdk initialized with endpoint: " + endpoint);
            promise.resolve("SDK initialized with data center: " + endpoint);
        } catch (Exception e) {
            Log.e(TAG, "Error initializing SDK with data center: " + e.getMessage(), e);
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void loginWithEmail(String countryCode, String email, String password, Promise promise) {
        Log.d(TAG, "=== LOGIN WITH EMAIL ===");
        Log.d(TAG, "Country Code: " + countryCode);
        Log.d(TAG, "Email: " + email);
        Log.d(TAG, "Password length: " + password.length());
        Log.d(TAG, "========================");

        ThingHomeSdk.getUserInstance().loginWithEmail(countryCode, email, password, new ILoginCallback() {
            @Override
            public void onSuccess(User user) {
                Log.d(TAG, "Login successful for user: " + user.getUsername());
                WritableMap userMap = new WritableNativeMap();
                userMap.putString("uid", user.getUid());
                userMap.putString("username", user.getUsername());
                userMap.putString("email", user.getEmail());
                userMap.putString("avatarUrl", user.getHeadPic());
                userMap.putString("headPic", user.getHeadPic());
                userMap.putString("nickName", user.getNickName());
                userMap.putString("phoneCode", user.getPhoneCode());
                userMap.putString("mobile", user.getMobile());
                userMap.putString("timezoneId", user.getTimezoneId());
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
    public void loginWithPhone(String phone, String password, String countryCode, Promise promise) {
        Log.d(TAG, "=== LOGIN WITH PHONE ===");
        Log.d(TAG, "Phone: " + phone);
        Log.d(TAG, "Country Code: " + countryCode);
        Log.d(TAG, "Password length: " + password.length());
        Log.d(TAG, "========================");

        ThingHomeSdk.getUserInstance().loginWithPhone(countryCode, phone, password, new ILoginCallback() {
            @Override
            public void onSuccess(User user) {
                Log.d(TAG, "Phone login successful for user: " + user.getUsername());
                WritableMap userMap = new WritableNativeMap();
                userMap.putString("uid", user.getUid());
                userMap.putString("username", user.getUsername());
                userMap.putString("email", user.getEmail());
                userMap.putString("avatarUrl", user.getHeadPic());
                userMap.putString("headPic", user.getHeadPic());
                userMap.putString("nickName", user.getNickName());
                userMap.putString("phoneCode", user.getPhoneCode());
                userMap.putString("mobile", user.getMobile());
                userMap.putString("timezoneId", user.getTimezoneId());
                promise.resolve(userMap);
            }

            @Override
            public void onError(String code, String error) {
                Log.e(TAG, "Phone login error: " + code + " - " + error);
                promise.reject(code, error);
            }
        });
    }

    @ReactMethod
    public void logout(Promise promise) {
        Log.d(TAG, "logout called");
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
    public void registerWithEmail(String email, String password, String countryCode, Promise promise) {
        Log.d(TAG, "=== REGISTER WITH EMAIL ===");
        Log.d(TAG, "Email: " + email);
        Log.d(TAG, "Country Code: " + countryCode);
        Log.d(TAG, "Password length: " + password.length());
        Log.d(TAG, "============================");

        try {
            Class<?> userClass = ThingHomeSdk.getUserInstance().getClass();
            Method registerMethod = null;

            Method[] methods = userClass.getMethods();
            for (Method method : methods) {
                String methodName = method.getName();
                if (methodName.contains("registerAccount") && methodName.contains("Email")) {
                    Log.d(TAG, "Found registration method: " + methodName);
                    registerMethod = method;
                    break;
                }
            }

            if (registerMethod != null) {
                Log.d(TAG, "Attempting direct registration...");
                ThingHomeSdk.getUserInstance().registerAccountWithEmail(countryCode, email, password, new IRegisterCallback() {
                    @Override
                    public void onSuccess(User user) {
                        Log.d(TAG, "Email registration successful for user: " + user.getUsername());

                        WritableMap userMap = new WritableNativeMap();
                        userMap.putString("uid", user.getUid());
                        userMap.putString("username", user.getUsername());
                        userMap.putString("email", user.getEmail());
                        userMap.putString("avatarUrl", user.getHeadPic());
                        userMap.putString("headPic", user.getHeadPic());
                        userMap.putString("nickName", user.getNickName());
                        userMap.putString("phoneCode", user.getPhoneCode());
                        userMap.putString("mobile", user.getMobile());
                        userMap.putString("timezoneId", user.getTimezoneId());

                        promise.resolve(userMap);
                    }

                    @Override
                    public void onError(String code, String error) {
                        Log.e(TAG, "Email registration error: " + code + " - " + error);
                        promise.reject(code, "Registration failed: " + error);
                    }
                });
            } else {
                Log.e(TAG, "No registration method found");
                promise.reject("METHOD_NOT_FOUND", "Email registration is not available in this SDK version. Please update your SDK or create account manually in Smart Life app.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during email registration: " + e.getMessage(), e);
            promise.reject("REGISTRATION_ERROR", "Registration method not available: " + e.getMessage());
        }
    }

    private void testServerRecursive(String email, String password, String[] countryCodes,
                                     String[] serverNames, int index, Promise promise) {
        if (index >= countryCodes.length) {
            Log.e(TAG, "All servers failed");
            promise.reject("ALL_SERVERS_FAILED", "No server worked for these credentials");
            return;
        }

        String currentCode = countryCodes[index];
        String currentName = serverNames[index];

        Log.d(TAG, "Testing server: " + currentName + " (Code: " + currentCode + ")");

        try {
            String appKey = "phrvfs7yuqg3rg8sw3km";
            String secretKey = "74akfvfua53teq4wvepcd847panjpkee";

            Application application = (Application) getReactApplicationContext().getApplicationContext();

            try {
                ThingHomeSdk.onDestroy();
                Thread.sleep(1000);
            } catch (Exception e) {
                Log.w(TAG, "Error destroying SDK: " + e.getMessage());
            }

            new android.os.Handler().postDelayed(() -> {
                try {
                    Log.d(TAG, "Initializing SDK for " + currentName + "...");
                    ThingHomeSdk.init(application, appKey, secretKey);
                    ThingHomeSdk.setDebugMode(true);

                    new android.os.Handler().postDelayed(() -> {
                        try {
                            Log.d(TAG, "Attempting login for " + currentName + "...");

                            ThingHomeSdk.getUserInstance().loginWithEmail(currentCode, email, password, new ILoginCallback() {
                                @Override
                                public void onSuccess(User user) {
                                    Log.d(TAG, "SUCCESS! Server: " + currentName + " works!");

                                    WritableMap result = new WritableNativeMap();
                                    result.putString("server", currentName);
                                    result.putString("countryCode", currentCode);
                                    result.putString("username", user.getUsername());
                                    result.putString("email", user.getEmail());

                                    promise.resolve(result);
                                }

                                @Override
                                public void onError(String code, String error) {
                                    Log.w(TAG, "Failed " + currentName + ": " + code + " - " + error);
                                    testServerRecursive(email, password, countryCodes, serverNames, index + 1, promise);
                                }
                            });

                        } catch (Exception e) {
                            Log.e(TAG, "Exception with " + currentName + ": " + e.getMessage());
                            testServerRecursive(email, password, countryCodes, serverNames, index + 1, promise);
                        }
                    }, 2000);

                } catch (Exception e) {
                    Log.e(TAG, "Init error with " + currentName + ": " + e.getMessage());
                    testServerRecursive(email, password, countryCodes, serverNames, index + 1, promise);
                }
            }, 1500);

        } catch (Exception e) {
            Log.e(TAG, "General error with " + currentName + ": " + e.getMessage());
            testServerRecursive(email, password, countryCodes, serverNames, index + 1, promise);
        }
    }

    @ReactMethod
    public void getHomeList(Promise promise) {
        Log.d(TAG, "getHomeList called");
        ThingHomeSdk.getHomeManagerInstance().queryHomeList(new IThingGetHomeListCallback() {
            @Override
            public void onSuccess(List<HomeBean> homeBeans) {
                Log.d(TAG, "Got home list with " + homeBeans.size() + " homes");
                WritableArray homeArray = new WritableNativeArray();

                for (HomeBean home : homeBeans) {
                    WritableMap homeMap = new WritableNativeMap();
                    homeMap.putDouble("homeId", home.getHomeId());
                    homeMap.putString("name", home.getName());
                    homeMap.putString("geoName", home.getGeoName());
                    homeMap.putDouble("lon", home.getLon());
                    homeMap.putDouble("lat", home.getLat());
                    homeMap.putString("address", home.getGeoName());
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
    public void getDeviceList(int homeId, Promise promise) {
        Log.d(TAG, "getDeviceList called for home: " + homeId);
        WritableArray deviceArray = new WritableNativeArray();
        promise.resolve(deviceArray);
    }

    @ReactMethod
    public void controlDevice(String deviceId, String commands, Promise promise) {
        Log.d(TAG, "controlDevice called for device: " + deviceId);
        promise.resolve("Device control executed for: " + deviceId);
    }

    @ReactMethod
    public void getDeviceSchema(String deviceId, Promise promise) {
        Log.d(TAG, "getDeviceSchema called for device: " + deviceId);
        WritableArray schemaArray = new WritableNativeArray();
        promise.resolve(schemaArray);
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
