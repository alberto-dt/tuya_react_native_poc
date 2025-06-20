package com.smartlifeapppoc

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

// Importaciones del SDK de Tuya (ThingClips Smart)
import com.thingclips.smart.home.sdk.ThingHomeSdk

// Importar el módulo SmartLife existente
import com.smartlifeapppoc.smartlife.SmartLifePackage

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Packages that cannot be autolinked yet can be added manually here, for example:
                    // add(MyReactNativePackage())

                    // Agregar el módulo SmartLife existente
                    add(SmartLifePackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, OpenSourceMergedSoMapping)

        // Inicializar el SDK de Tuya
        initTuyaSDK()

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
    }

    /**
     * Inicializa el SDK de ThingClips Smart (Tuya)
     */
    private fun initTuyaSDK() {
        try {
            // Las credenciales configuradas en build.gradle
            val appKey = "phrvfs7yuqg3rg8sw3km"
            val appSecret = "74akfvfua53teq4wvepcd847panjpkee"

            // Inicializar el SDK de ThingClips Smart
            ThingHomeSdk.init(this, appKey, appSecret)

            // Log de éxito en debug
            if (BuildConfig.DEBUG) {
                println("✅ Tuya SDK inicializado correctamente")
            }

        } catch (e: Exception) {
            // Manejar errores de inicialización
            if (BuildConfig.DEBUG) {
                println("❌ Error al inicializar Tuya SDK: ${e.message}")
                e.printStackTrace()
            }
        }
    }
}
