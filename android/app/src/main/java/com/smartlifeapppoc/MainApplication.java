package com.smartlifeapppoc;

import android.app.Application;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;

// Importar nuestro package personalizado
import com.smartlifeapppoc.smartlife.SmartLifePackage;

// Importar Tuya SDK (versión 6.2.2)
import com.thingclips.smart.home.sdk.ThingHomeSdk;

import java.util.List;

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
