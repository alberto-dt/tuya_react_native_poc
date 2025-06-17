# Reglas oficiales de Tuya SDK
#fastJson
-keep class com.alibaba.fastjson.**{*;}
-dontwarn com.alibaba.fastjson.**

#mqtt
-keep class com.thingclips.smart.mqttclient.mqttv3.** { *; }
-dontwarn com.thingclips.smart.mqttclient.mqttv3.**

#OkHttp3
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-keep class okio.** { *; }
-dontwarn okio.**

-keep class com.thingclips.**{*;}
-dontwarn com.thingclips.**

# Matter SDK
-keep class chip.** { *; }
-dontwarn chip.**

#MINI SDK
-keep class com.gzl.smart.** { *; }
-dontwarn com.gzl.smart.**

# ============ TUYA DEVICE ACTIVATOR BIZBUNDLE RULES ============
# Reglas adicionales para Device Activator según documentación oficial

#rx (RxJava - requerido por Device Activator)
-dontwarn rx.**
-keep class rx.** {*;}
-keep class io.reactivex.**{*;}
-dontwarn io.reactivex.**
-keep class rx.**{ *; }
-keep class rx.android.**{*;}

#fresco (para manejo de imágenes en UI)
-keep class com.facebook.drawee.backends.pipeline.Fresco
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.common.internal.DoNotStrip *;
}

# QR Code Scanner MLKit
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**
-keep class com.google.android.gms.vision.** { *; }
-dontwarn com.google.android.gms.vision.**

# Camera2 API (para QR scanning)
-keep class android.hardware.camera2.** { *; }
-dontwarn android.hardware.camera2.**

# Bluetooth LE support
-keep class android.bluetooth.** { *; }
-dontwarn android.bluetooth.**

# WiFi management
-keep class android.net.wifi.** { *; }
-dontwarn android.net.wifi.**

# Network security configuration
-keep class android.security.** { *; }
-dontwarn android.security.**
