package com.smartlifeapppoc.smartlife;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import android.util.Log;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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
