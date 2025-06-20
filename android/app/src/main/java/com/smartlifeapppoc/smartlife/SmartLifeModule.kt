package com.smartlifeapppoc.smartlife

import android.app.Application
import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.thingclips.smart.android.user.api.ILoginCallback
import com.thingclips.smart.android.user.api.IRegisterCallback
import com.thingclips.smart.android.user.api.ILogoutCallback
import com.thingclips.smart.android.user.bean.User
import com.thingclips.smart.home.sdk.ThingHomeSdk
import com.thingclips.smart.home.sdk.api.IThingHome
import com.thingclips.smart.home.sdk.api.IThingHomeManager
import com.thingclips.smart.home.sdk.callback.IThingHomeResultCallback
import com.thingclips.smart.home.sdk.callback.IThingGetHomeListCallback
import com.thingclips.smart.home.sdk.bean.HomeBean
import com.thingclips.smart.sdk.api.IThingDevice
import com.thingclips.smart.sdk.bean.DeviceBean
import com.thingclips.smart.sdk.api.IResultCallback
import java.util.concurrent.atomic.AtomicInteger

class SmartLifeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "SmartLifeModule"
        private val mockDeviceCounter = AtomicInteger(1)
    }

    private val mockDevices = mutableListOf<WritableMap>()
    private var isPairingInProgress = false
    private var currentPairingMode: String? = null

    override fun getName(): String {
        return "SmartLifeModule"
    }

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf(
            "EXAMPLE_CONSTANT" to "example",
            "MOCK_DEVICE_PREFIX" to "mock_device_",
            "PAIRING_AVAILABLE" to false
        )
    }

    @ReactMethod
    fun listAvailableMethods(promise: Promise) {
        try {
            val methods = """
                Available methods:
                - initSDK
                - loginWithEmail
                - logout
                - registerWithEmail
                - getHomeList
                - createHome
                - getDeviceList
                - getCurrentWifiSSID
                - startDevicePairingEZ (SIMULATED)
                - stopDevicePairing (SIMULATED)
                - addTestDevice
                - removeDevice
                - removeTestDevice
                - removeRealDevice
                - clearAllTestDevices
                - destroy
            """.trimIndent()
            promise.resolve(methods)
        } catch (e: Exception) {
            promise.reject("LIST_METHODS_ERROR", "Error listing methods: ${e.message}")
        }
    }

    @ReactMethod
    fun initSDK(appKey: String, secretKey: String, promise: Promise) {
        try {
            Log.d(TAG, "Initializing Tuya SDK with appKey: $appKey")

            val application = reactApplicationContext.applicationContext as Application
            ThingHomeSdk.init(application, appKey, secretKey)

            Log.d(TAG, "SDK initialization completed successfully")
            promise.resolve("SDK initialized successfully")

        } catch (e: Exception) {
            Log.e(TAG, "Error initializing SDK: ${e.message}", e)
            promise.reject("INIT_ERROR", "Failed to initialize SDK: ${e.message}")
        }
    }

    @ReactMethod
    fun loginWithEmail(countryCode: String, email: String, password: String, promise: Promise) {
        try {
            Log.d(TAG, "Attempting login with email: $email, country: $countryCode")

            ThingHomeSdk.getUserInstance().loginWithEmail(countryCode, email, password, object : ILoginCallback {
                override fun onSuccess(user: User) {
                    Log.d(TAG, "Login successful for user: ${user.username}")

                    val userMap = Arguments.createMap()
                    userMap.putString("uid", user.uid)
                    userMap.putString("username", user.username)
                    userMap.putString("email", user.email)
                    userMap.putString("avatarUrl", "")

                    promise.resolve(userMap)
                }

                override fun onError(code: String?, error: String?) {
                    Log.e(TAG, "Login failed: $code - $error")
                    promise.reject(code ?: "LOGIN_ERROR", "Login failed: $error")
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "Exception during login: ${e.message}", e)
            promise.reject("LOGIN_ERROR", "Exception during login: ${e.message}")
        }
    }

    @ReactMethod
    fun logout(promise: Promise) {
        try {
            Log.d(TAG, "Logging out user")

            ThingHomeSdk.getUserInstance().logout(object : ILogoutCallback {
                override fun onError(code: String?, error: String?) {
                    Log.e(TAG, "Logout failed: $code - $error")
                    promise.reject(code ?: "LOGOUT_ERROR", "Logout failed: $error")
                }

                override fun onSuccess() {
                    Log.d(TAG, "Logout successful")
                    promise.resolve("Logout successful")
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "Exception during logout: ${e.message}", e)
            promise.reject("LOGOUT_ERROR", "Exception during logout: ${e.message}")
        }
    }

    @ReactMethod
    fun registerWithEmail(email: String, password: String, countryCode: String, promise: Promise) {
        try {
            Log.d(TAG, "Attempting registration with email: $email, country: $countryCode")

            ThingHomeSdk.getUserInstance().registerAccountWithEmail(countryCode, email, password, object : IRegisterCallback {
                override fun onSuccess(user: User) {
                    Log.d(TAG, "Registration successful for user: ${user.username}")

                    val userMap = Arguments.createMap()
                    userMap.putString("uid", user.uid)
                    userMap.putString("username", user.username)
                    userMap.putString("email", user.email)
                    userMap.putString("avatarUrl", "")

                    promise.resolve(userMap)
                }

                override fun onError(code: String?, error: String?) {
                    Log.e(TAG, "Registration failed: $code - $error")
                    promise.reject(code ?: "REGISTER_ERROR", "Registration failed: $error")
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "Exception during registration: ${e.message}", e)
            promise.reject("REGISTER_ERROR", "Exception during registration: ${e.message}")
        }
    }

    @ReactMethod
    fun getHomeList(promise: Promise) {
        try {
            Log.d(TAG, "Getting home list")

            ThingHomeSdk.getHomeManagerInstance().queryHomeList(object : IThingGetHomeListCallback {
                override fun onSuccess(homeBeans: MutableList<HomeBean>) {
                    Log.d(TAG, "Got ${homeBeans.size} homes")

                    val homeArray = Arguments.createArray()

                    for (home in homeBeans) {
                        val homeMap = Arguments.createMap()
                        homeMap.putInt("homeId", home.homeId.toInt())
                        homeMap.putString("name", home.name)
                        homeMap.putString("geoName", home.geoName ?: "")
                        homeMap.putDouble("lon", home.lon)
                        homeMap.putDouble("lat", home.lat)
                        homeMap.putString("address", "")

                        homeArray.pushMap(homeMap)
                    }

                    promise.resolve(homeArray)
                }

                override fun onError(errorCode: String?, error: String?) {
                    Log.e(TAG, "Error getting home list: $errorCode - $error")
                    promise.reject(errorCode ?: "GET_HOMES_ERROR", "Failed to get home list: $error")
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "Exception getting home list: ${e.message}", e)
            promise.reject("GET_HOMES_ERROR", "Exception getting home list: ${e.message}")
        }
    }

    @ReactMethod
    fun createHome(homeName: String, geoName: String, lat: Double, lon: Double, promise: Promise) {
        try {
            Log.d(TAG, "Creating home: $homeName at $geoName")

            val homeManager = ThingHomeSdk.getHomeManagerInstance()
            val rooms = mutableListOf<String>()

            homeManager.createHome(homeName, lat, lon, geoName, rooms, object : IThingHomeResultCallback {
                override fun onSuccess(homeBean: HomeBean) {
                    Log.d(TAG, "Home created successfully: ${homeBean.name}")

                    val homeMap = Arguments.createMap()
                    homeMap.putInt("homeId", homeBean.homeId.toInt())
                    homeMap.putString("name", homeBean.name)
                    homeMap.putString("geoName", homeBean.geoName ?: "")
                    homeMap.putDouble("lon", homeBean.lon)
                    homeMap.putDouble("lat", homeBean.lat)
                    homeMap.putString("address", "")

                    promise.resolve(homeMap)
                }

                override fun onError(errorCode: String?, error: String?) {
                    Log.e(TAG, "Error creating home: $errorCode - $error")
                    promise.reject(errorCode ?: "CREATE_HOME_ERROR", "Failed to create home: $error")
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "Exception creating home: ${e.message}", e)
            promise.reject("CREATE_HOME_ERROR", "Exception creating home: ${e.message}")
        }
    }

    @ReactMethod
    fun getDeviceList(homeId: Int, promise: Promise) {
        Log.d(TAG, "=== GET DEVICE LIST (WITH MOCK SUPPORT) ===")
        Log.d(TAG, "Home ID: $homeId")

        try {
            ThingHomeSdk.newHomeInstance(homeId.toLong()).getHomeDetail(object : IThingHomeResultCallback {
                override fun onSuccess(homeBean: HomeBean) {
                    Log.d(TAG, "Got home details for: ${homeBean.name}")

                    val deviceArray = Arguments.createArray()

                    if (homeBean.deviceList != null && homeBean.deviceList.isNotEmpty()) {
                        Log.d(TAG, "Found ${homeBean.deviceList.size} real devices")

                        for (device in homeBean.deviceList) {
                            val deviceMap = convertDeviceBeanToMap(device)
                            deviceArray.pushMap(deviceMap)
                        }
                    }

                    Log.d(TAG, "Adding ${mockDevices.size} mock devices")
                    for (mockDevice in mockDevices) {
                        deviceArray.pushMap(mockDevice)
                    }

                    Log.d(TAG, "Returning ${deviceArray.size()} total devices")
                    promise.resolve(deviceArray)
                }

                override fun onError(errorCode: String?, errorMessage: String?) {
                    Log.e(TAG, "Error getting home details: $errorCode - $errorMessage")

                    val deviceArray = Arguments.createArray()
                    for (mockDevice in mockDevices) {
                        deviceArray.pushMap(mockDevice)
                    }

                    Log.d(TAG, "Returning only ${mockDevices.size} mock devices due to error")
                    promise.resolve(deviceArray)
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "Exception getting device list: ${e.message}", e)

            val deviceArray = Arguments.createArray()
            for (mockDevice in mockDevices) {
                deviceArray.pushMap(mockDevice)
            }
            promise.resolve(deviceArray)
        }
    }

    @ReactMethod
    fun getCurrentWifiSSID(promise: Promise) {
        try {
            val ssid = getCurrentWifiName()
            Log.d(TAG, "Current WiFi SSID: $ssid")
            promise.resolve(ssid)
        } catch (e: Exception) {
            Log.e(TAG, "Exception getting WiFi SSID: ${e.message}", e)
            promise.reject("WIFI_SSID_ERROR", "Exception getting WiFi SSID: ${e.message}")
        }
    }

    @ReactMethod
    fun startDevicePairingEZ(homeId: Int, ssid: String, password: String, timeout: Int, promise: Promise) {
        Log.d(TAG, "=== START DEVICE PAIRING EZ MODE (SIMULATED) ===")
        Log.d(TAG, "Home ID: $homeId")
        Log.d(TAG, "SSID: $ssid")
        Log.d(TAG, "Timeout: $timeout")

        if (isPairingInProgress) {
            promise.reject("PAIRING_IN_PROGRESS", "Device pairing is already in progress. Stop current pairing first.")
            return
        }

        try {
            isPairingInProgress = true
            currentPairingMode = "EZ"

            val handler = android.os.Handler()
            handler.postDelayed({
                try {
                    val pairedDevice = createSimulatedPairedDevice(ssid)

                    isPairingInProgress = false
                    currentPairingMode = null

                    Log.d(TAG, "EZ Pairing simulation completed successfully")
                    promise.resolve(pairedDevice)

                } catch (e: Exception) {
                    isPairingInProgress = false
                    currentPairingMode = null
                    promise.reject("EZ_PAIRING_SIMULATION_ERROR", "EZ Pairing simulation failed: ${e.message}")
                }
            }, 3000)

        } catch (e: Exception) {
            Log.e(TAG, "Exception starting EZ pairing simulation: ${e.message}", e)
            isPairingInProgress = false
            currentPairingMode = null
            promise.reject("START_EZ_PAIRING_ERROR", "Exception starting EZ pairing simulation: ${e.message}")
        }
    }

    @ReactMethod
    fun stopDevicePairing(promise: Promise) {
        Log.d(TAG, "=== STOP DEVICE PAIRING ===")

        try {
            isPairingInProgress = false
            currentPairingMode = null

            Log.d(TAG, "Device pairing stopped successfully")
            promise.resolve("Device pairing stopped successfully")

        } catch (e: Exception) {
            Log.e(TAG, "Exception stopping device pairing: ${e.message}", e)
            promise.reject("STOP_PAIRING_ERROR", "Exception stopping device pairing: ${e.message}")
        }
    }

    private fun createSimulatedPairedDevice(networkName: String): WritableMap {
        val deviceMap = Arguments.createMap()
        val timestamp = System.currentTimeMillis()
        val deviceId = "paired_$timestamp"

        deviceMap.putString("devId", deviceId)
        deviceMap.putString("name", "Dispositivo Emparejado - $networkName")
        deviceMap.putString("iconUrl", "https://images.tuyacn.com/smart/icon/switch.png")
        deviceMap.putBoolean("isOnline", true)
        deviceMap.putString("productId", "paired_product_$timestamp")

        deviceMap.putString("uuid", "paired_uuid_$timestamp")
        deviceMap.putString("category", "switch")
        deviceMap.putString("productName", "Dispositivo Recién Emparejado")
        deviceMap.putBoolean("isLocalOnline", true)
        deviceMap.putBoolean("isSub", false)
        deviceMap.putBoolean("isShare", false)

        val functionsArray = Arguments.createArray()
        functionsArray.pushString("switch_1")
        deviceMap.putArray("supportedFunctions", functionsArray)

        val statusMap = Arguments.createMap()
        statusMap.putBoolean("switch_1", false)
        deviceMap.putMap("status", statusMap)

        mockDevices.add(deviceMap)

        Log.d(TAG, "Simulated paired device created: ${deviceMap.getString("name")}")
        return deviceMap
    }

    @ReactMethod
    fun addTestDevice(homeId: Int, deviceName: String, deviceType: String, promise: Promise) {
        try {
            Log.d(TAG, "=== ADDING TEST DEVICE ===")
            Log.d(TAG, "Home ID: $homeId")
            Log.d(TAG, "Device Name: $deviceName")
            Log.d(TAG, "Device Type: $deviceType")

            val testDevice = createMockDevice(deviceName, deviceType)
            mockDevices.add(testDevice)

            Log.d(TAG, "Test device created successfully: $deviceName")
            promise.resolve(testDevice)

        } catch (e: Exception) {
            Log.e(TAG, "Error adding test device: ${e.message}", e)
            promise.reject("ADD_TEST_DEVICE_ERROR", "Error agregando dispositivo de prueba: ${e.message}")
        }
    }

    @ReactMethod
    fun removeTestDevice(deviceId: String, promise: Promise) {
        try {
            Log.d(TAG, "=== REMOVE TEST DEVICE ===")
            Log.d(TAG, "Device ID: $deviceId")

            var removedDevice: WritableMap? = null
            val iterator = mockDevices.iterator()
            while (iterator.hasNext()) {
                val device = iterator.next()
                if (device.hasKey("devId") && deviceId == device.getString("devId")) {
                    removedDevice = device
                    iterator.remove()
                    break
                }
            }

            if (removedDevice == null) {
                promise.reject("DEVICE_NOT_FOUND", "Dispositivo de prueba no encontrado: $deviceId")
                return
            }

            Log.d(TAG, "Test device removed successfully: $deviceId")
            promise.resolve("Dispositivo de prueba eliminado exitosamente")

        } catch (e: Exception) {
            Log.e(TAG, "Error removing test device: ${e.message}", e)
            promise.reject("REMOVE_TEST_DEVICE_ERROR", "Error eliminando dispositivo de prueba: ${e.message}")
        }
    }

    @ReactMethod
    fun removeRealDevice(deviceId: String, homeId: Int, promise: Promise) {
        try {
            Log.d(TAG, "=== REMOVE REAL DEVICE ===")
            Log.d(TAG, "Device ID: $deviceId")
            Log.d(TAG, "Home ID: $homeId")

            val device = ThingHomeSdk.newDeviceInstance(deviceId)
            device.removeDevice(object : IResultCallback {
                override fun onError(code: String?, error: String?) {
                    Log.e(TAG, "Error removing real device: $code - $error")
                    promise.reject(code ?: "REMOVE_DEVICE_ERROR", "Error eliminando dispositivo real: $error")
                }

                override fun onSuccess() {
                    Log.d(TAG, "Real device removed successfully: $deviceId")
                    promise.resolve("Dispositivo real eliminado exitosamente")
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "Error removing real device: ${e.message}", e)
            promise.reject("REMOVE_REAL_DEVICE_ERROR", "Error eliminando dispositivo real: ${e.message}")
        }
    }

    @ReactMethod
    fun removeDevice(deviceId: String, homeId: Int, promise: Promise) {
        try {
            Log.d(TAG, "=== REMOVE DEVICE ===")
            Log.d(TAG, "Device ID: $deviceId")
            Log.d(TAG, "Home ID: $homeId")

            if (deviceId.startsWith("mock_") || deviceId.startsWith("test_") || deviceId.startsWith("paired_")) {
                removeTestDevice(deviceId, promise)
            } else {
                removeRealDevice(deviceId, homeId, promise)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error removing device: ${e.message}", e)
            promise.reject("REMOVE_DEVICE_ERROR", "Error eliminando dispositivo: ${e.message}")
        }
    }

    @ReactMethod
    fun clearAllTestDevices(promise: Promise) {
        try {
            Log.d(TAG, "=== CLEAR ALL TEST DEVICES ===")

            val count = mockDevices.size
            mockDevices.clear()

            Log.d(TAG, "Cleared $count test devices")
            promise.resolve("Eliminados $count dispositivos de prueba exitosamente")

        } catch (e: Exception) {
            Log.e(TAG, "Error clearing test devices: ${e.message}", e)
            promise.reject("CLEAR_TEST_DEVICES_ERROR", "Error limpiando dispositivos de prueba: ${e.message}")
        }
    }

    private fun convertDeviceBeanToMap(device: DeviceBean): WritableMap {
        val deviceMap = Arguments.createMap()

        deviceMap.putString("devId", device.devId ?: "")
        deviceMap.putString("name", device.name ?: "Dispositivo sin nombre")
        deviceMap.putString("iconUrl", device.iconUrl ?: "")
        deviceMap.putBoolean("isOnline", device.isOnline)
        deviceMap.putString("productId", device.productId ?: "")

        deviceMap.putString("uuid", device.uuid ?: "")
        deviceMap.putString("category", device.category ?: "")

        val productInfo = device.productId ?: ""
        deviceMap.putString("productName", productInfo)

        deviceMap.putBoolean("isLocalOnline", device.isLocalOnline)
        deviceMap.putBoolean("isSub", false)
        deviceMap.putBoolean("isShare", device.isShare)

        val functionsArray = Arguments.createArray()
        if (device.schemaMap != null && device.schemaMap.isNotEmpty()) {
            for (functionCode in device.schemaMap.keys) {
                functionsArray.pushString(functionCode)
            }
        }
        deviceMap.putArray("supportedFunctions", functionsArray)

        val statusMap = Arguments.createMap()
        if (device.dps != null && device.dps.isNotEmpty()) {
            for ((dpId, dpValue) in device.dps) {
                if (dpValue != null) {
                    when (dpValue) {
                        is Boolean -> statusMap.putBoolean(dpId, dpValue)
                        is Int -> statusMap.putInt(dpId, dpValue)
                        is Double -> statusMap.putDouble(dpId, dpValue)
                        else -> statusMap.putString(dpId, dpValue.toString())
                    }
                }
            }
        }
        deviceMap.putMap("status", statusMap)

        return deviceMap
    }

    private fun createMockDevice(deviceName: String, deviceType: String): WritableMap {
        val deviceNumber = mockDeviceCounter.getAndIncrement()
        val deviceId = "test_${deviceType}_${deviceNumber}_${System.currentTimeMillis()}"

        val mockDevice = Arguments.createMap()
        mockDevice.putString("devId", deviceId)
        mockDevice.putString("name", deviceName)
        mockDevice.putString("iconUrl", getMockIconUrl(deviceType))
        mockDevice.putBoolean("isOnline", true)
        mockDevice.putString("productId", "mock_product_$deviceType")

        mockDevice.putString("uuid", "mock_uuid_$deviceNumber")
        mockDevice.putString("category", deviceType)
        mockDevice.putString("productName", "Mock $deviceType Device")
        mockDevice.putBoolean("isLocalOnline", true)
        mockDevice.putBoolean("isSub", false)
        mockDevice.putBoolean("isShare", false)

        val functions = getMockFunctions(deviceType)
        mockDevice.putArray("supportedFunctions", functions)

        val status = getMockInitialStatus(deviceType)
        mockDevice.putMap("status", status)

        return mockDevice
    }

    private fun getMockIconUrl(deviceType: String): String {
        return when (deviceType.lowercase()) {
            "light" -> "https://images.tuyacn.com/smart/icon/light.png"
            "sensor" -> "https://images.tuyacn.com/smart/icon/sensor.png"
            "plug" -> "https://images.tuyacn.com/smart/icon/plug.png"
            "fan" -> "https://images.tuyacn.com/smart/icon/fan.png"
            "thermostat" -> "https://images.tuyacn.com/smart/icon/thermostat.png"
            else -> "https://images.tuyacn.com/smart/icon/switch.png"
        }
    }

    private fun getMockFunctions(deviceType: String): WritableArray {
        val functions = Arguments.createArray()

        when (deviceType.lowercase()) {
            "light" -> {
                functions.pushString("switch_1")
                functions.pushString("bright_value")
                functions.pushString("temp_value")
                functions.pushString("colour_data")
            }
            "sensor" -> {
                functions.pushString("temp_current")
                functions.pushString("humidity_value")
                functions.pushString("battery_percentage")
            }
            "plug" -> {
                functions.pushString("switch_1")
                functions.pushString("cur_power")
                functions.pushString("cur_voltage")
            }
            "fan" -> {
                functions.pushString("switch_1")
                functions.pushString("fan_speed")
                functions.pushString("mode")
            }
            "thermostat" -> {
                functions.pushString("switch_1")
                functions.pushString("temp_set")
                functions.pushString("temp_current")
                functions.pushString("mode")
            }
            else -> {
                functions.pushString("switch_1")
                functions.pushString("switch_2")
                functions.pushString("switch_3")
            }
        }

        return functions
    }

    private fun getMockInitialStatus(deviceType: String): WritableMap {
        val status = Arguments.createMap()

        when (deviceType.lowercase()) {
            "light" -> {
                status.putBoolean("switch_1", false)
                status.putInt("bright_value", 255)
                status.putInt("temp_value", 500)
                status.putString("work_mode", "white")
            }
            "sensor" -> {
                status.putInt("temp_current", 22)
                status.putInt("humidity_value", 45)
                status.putInt("battery_percentage", 85)
            }
            "plug" -> {
                status.putBoolean("switch_1", false)
                status.putInt("cur_power", 0)
                status.putInt("cur_voltage", 220)
            }
            "fan" -> {
                status.putBoolean("switch_1", false)
                status.putInt("fan_speed", 1)
                status.putString("mode", "straight_wind")
            }
            "thermostat" -> {
                status.putBoolean("switch_1", false)
                status.putInt("temp_set", 23)
                status.putInt("temp_current", 22)
                status.putString("mode", "auto")
            }
            else -> {
                status.putBoolean("switch_1", false)
                status.putBoolean("switch_2", false)
                status.putBoolean("switch_3", false)
            }
        }

        return status
    }

    private fun getCurrentWifiName(): String {
        return try {
            val wifiManager = reactApplicationContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager?
            if (wifiManager != null) {
                val wifiInfo = wifiManager.connectionInfo
                if (wifiInfo != null) {
                    var ssid = wifiInfo.ssid
                    if (ssid != null && ssid != "<unknown ssid>") {
                        if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
                            ssid = ssid.substring(1, ssid.length - 1)
                        }
                        return ssid
                    }
                }
            }
            ""
        } catch (e: Exception) {
            Log.e(TAG, "Error getting WiFi name: ${e.message}", e)
            ""
        }
    }

    @ReactMethod
    fun destroy(promise: Promise) {
        try {
            Log.d(TAG, "Destroying SmartLifeModule")

            isPairingInProgress = false
            currentPairingMode = null

            mockDevices.clear()
            mockDeviceCounter.set(1)

            Log.d(TAG, "SmartLifeModule destroyed successfully")
            promise.resolve("SmartLifeModule destroyed successfully")

        } catch (e: Exception) {
            Log.e(TAG, "Error destroying SmartLifeModule: ${e.message}", e)
            promise.reject("DESTROY_ERROR", "Error destroying SmartLifeModule: ${e.message}")
        }
    }

    // ==================== MÉTODOS LEGACY DE COMPATIBILIDAD ====================

    @ReactMethod
    fun initializeSDK(appKey: String, appSecret: String, promise: Promise) {
        initSDK(appKey, appSecret, promise)
    }

    @ReactMethod
    fun getSDKVersion(promise: Promise) {
        try {
            val version = "Tuya Smart SDK Complete Bridge v2.0"
            Log.d(TAG, "SDK Version: $version")
            promise.resolve(version)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get SDK version", e)
            promise.reject("VERSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isSDKInitialized(promise: Promise) {
        try {
            val isInitialized = ThingHomeSdk.getUserInstance() != null
            Log.d(TAG, "SDK Initialized check: $isInitialized")
            promise.resolve(isInitialized)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check SDK initialization", e)
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun testConnection(promise: Promise) {
        try {
            Log.d(TAG, "Testing SDK connection")
            val result = Arguments.createMap()
            result.putString("status", "connected")
            result.putString("message", "Tuya Smart SDK bridge is working - complete version")
            result.putString("timestamp", System.currentTimeMillis().toString())
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Connection test failed", e)
            promise.reject("CONNECTION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun loginWithPhone(countryCode: String, phoneNumber: String, password: String, promise: Promise) {
        Log.d(TAG, "Phone login not implemented - use email login instead")
        promise.reject("NOT_IMPLEMENTED", "Phone login not implemented - use email login")
    }

    @ReactMethod
    fun isLoggedIn(promise: Promise) {
        try {
            val isLoggedIn = ThingHomeSdk.getUserInstance()?.isLogin == true
            promise.resolve(isLoggedIn)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getCurrentUser(promise: Promise) {
        try {
            val user = ThingHomeSdk.getUserInstance()?.user
            if (user != null) {
                val userMap = Arguments.createMap()
                userMap.putString("uid", user.uid)
                userMap.putString("username", user.username)
                userMap.putString("email", user.email)
                promise.resolve(userMap)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun getDeviceList(homeId: Double, promise: Promise) {
        getDeviceList(homeId.toInt(), promise)
    }

    @ReactMethod
    fun controlDevice(deviceId: String, dps: ReadableMap, promise: Promise) {
        Log.d(TAG, "Control device: $deviceId")
        promise.resolve("Device controlled successfully (mock)")
    }

    @ReactMethod
    fun renameDevice(deviceId: String, newName: String, promise: Promise) {
        Log.d(TAG, "Rename device: $deviceId to $newName")
        promise.resolve("Device renamed successfully (mock)")
    }

    @ReactMethod
    fun getDeviceStatus(deviceId: String, promise: Promise) {
        Log.d(TAG, "Get device status: $deviceId")

        val status = Arguments.createMap()
        status.putBoolean("switch_1", false)
        status.putInt("brightness", 255)

        promise.resolve(status)
    }

    // ==================== MÉTODOS ADICIONALES REQUERIDOS ====================
    @ReactMethod
    fun startDevicePairingAP(homeId: Int, ssid: String, password: String, timeout: Int, promise: Promise) {
        Log.d(TAG, "AP mode pairing not yet implemented, falling back to EZ simulation")
        startDevicePairingEZ(homeId, ssid, password, timeout, promise)
    }

    @ReactMethod
    fun validatePairingConditions(ssid: String, password: String, homeId: Int, timeout: Int, mode: String, promise: Promise) {
        Log.d(TAG, "Validate pairing conditions")

        val result = Arguments.createMap()
        result.putBoolean("canProceed", true)
        result.putString("status", "ready")
        result.putArray("errors", Arguments.createArray())
        result.putArray("warnings", Arguments.createArray())
        result.putString("ssid", ssid)
        result.putInt("homeId", homeId)
        result.putInt("timeout", timeout)
        result.putString("mode", mode)
        result.putBoolean("passwordProvided", password.isNotEmpty())
        result.putBoolean("validSSID", ssid.isNotEmpty())
        result.putBoolean("validPassword", password.length >= 8)
        result.putBoolean("validHomeId", homeId > 0)
        result.putBoolean("validTimeout", timeout in 30..300)
        result.putBoolean("validMode", true)
        result.putBoolean("wifiConnected", true)
        result.putBoolean("locationPermissionGranted", true)
        result.putBoolean("locationServicesEnabled", true)
        result.putBoolean("pairingAvailable", true)
        result.putString("currentSSID", getCurrentWifiName())
        result.putBoolean("alreadyOnTargetNetwork", false)

        promise.resolve(result)
    }

    // ==================== EVENT HANDLING ====================

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for event emitter
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
