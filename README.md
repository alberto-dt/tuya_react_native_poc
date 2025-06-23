This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

# 📱 SmartLifeAppPOC - Integración iOS con ThingSmart SDK

Este proyecto integra el SDK de Tuya (ThingSmart) para controlar dispositivos IoT desde una app React Native en iOS. A continuación se documenta todo lo necesario para configurar, compilar e implementar correctamente el proyecto en iOS.

---

## ✅ Requisitos mínimos

- macOS con Xcode 15+
- Node.js ≥ 16
- CocoaPods ≥ 1.12
- React Native 0.77
- iOS Deployment Target: **15.1**
- Cuenta de desarrollador Apple con **Team ID**

---

## 🛠️ Configuración del proyecto iOS

### 1. `Info.plist`

Se añadieron las siguientes claves necesarias para permisos en tiempo de ejecución:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to configure smart devices</string>
<key>NSLocalNetworkUsageDescription</key>
<string>This app needs local network access to discover and control smart devices</string>
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan QR codes for device configuration</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for voice control features</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs Bluetooth access to configure smart devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app needs Bluetooth access to configure smart devices</string>
```

> Ruta: `ios/SmartLifeAppPOC/Info.plist`

---

### 2. Podfile

Incluye las fuentes oficiales de Tuya, la versión del SDK y ajustes para React Native 0.77:

```ruby
source 'https://github.com/CocoaPods/Specs.git'
source 'https://github.com/TuyaInc/TuyaPublicSpecs.git'
source 'https://github.com/tuya/tuya-pod-specs.git'

platform :ios, '15.1'
...

target 'SmartLifeAppPOC' do
  ...
  pod 'ThingSmartHomeKit', '~> 6.2.0'
  pod 'ThingSmartCryption', :path => './ios_core_sdk'
  pod 'ThingSmartActivatorKit'

  post_install do |installer|
    ...
    config.build_settings["DEVELOPMENT_TEAM"] = "YOUR_TEAM_ID"
  end
end
```

> Ruta: `ios/Podfile`

---

## 🧠 Bridge nativo - Comunicación JS ↔️ iOS

### Archivos creados:

#### `TuyaBridge.h`

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface TuyaBridge : RCTEventEmitter <RCTBridgeModule>
@end
```

#### `TuyaBridge.m`

Contiene:

- Inicialización de SDK `ThingSmartSDK`
- Registro/login de usuario por email
- Logout
- Creación y listado de hogares
- Emisión de eventos (`TuyaUserLoginSuccess`, `TuyaUserLoginError`, etc.)
- Acceso a propiedades del usuario

> Ruta: `ios/SmartLifeAppPOC/TuyaBridge.h/.m`

---

## 📦 Instalación

```bash
cd ios
pod install
```

---

## 🚀 Compilación y ejecución

```bash
npx react-native run-ios
```

---

## 🔄 Métodos exportados a React Native

| Método JS (desde `SmartLifeModule`)        | Descripción                                    |
| ------------------------------------------ | ---------------------------------------------- |
| `initSDK(appKey, secretKey)`               | Inicializa el SDK de Tuya con las credenciales |
| `registerWithEmail(email, password, code)` | Registra un usuario con email                  |
| `loginWithEmail(code, email, password)`    | Inicia sesión con email                        |
| `logout()`                                 | Cierra la sesión del usuario                   |
| `getHomeList()`                            | Obtiene los hogares asociados al usuario       |
| `createHome(name, geoName, lat, lon)`      | Crea un nuevo hogar en la nube de Tuya         |
| `debugUserProperties()`                    | Muestra en consola las propiedades del usuario |
| `getCurrentUser()`                         | Devuelve los datos del usuario actual          |

---

## 📣 Eventos nativos emitidos

Escuchar desde React Native:

```ts
import { NativeEventEmitter, NativeModules } from "react-native";

const { SmartLifeModule } = NativeModules;
const emitter = new NativeEventEmitter(SmartLifeModule);

emitter.addListener("TuyaUserLoginSuccess", (user) => {
  console.log("User logged in:", user);
});
```

---

## 🧪 Tips y advertencias

- ✅ Usa cuentas reales de Tuya/ThingCloud para pruebas.
- ⚠️ No olvides reemplazar `YOUR_TEAM_ID` en el `Podfile`.
- 🧪 Se recomienda desactivar `DebugMode` en producción:
  ```objc
  [[ThingSmartSDK sharedInstance] setDebugMode:NO];
  ```

---

## 📚 Referencias

- [Tuya RN SDK Docs](https://developer.tuya.com/en/docs/iot/react-native-sdk?id=Ka7k8ucx0v6e2)
- [ThingSmart v6 Migration Guide](https://developer.tuya.com/en/docs/iot/tuya-ios-sdk-upgrade-notes?id=Kaiuzr79z7dko)

---

## © SmartLifeAppPOC

Desarrollado con 💡 para la gestión inteligente del hogar.
