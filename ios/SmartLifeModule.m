//
//  SmartLifeModule.m
//

#import "SmartLifeModule.h"
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

// Importar Tuya SDK solo para inicialización
#import <ThingSmartHomeKit/ThingSmartKit.h>

@interface SmartLifeModule()
@property (nonatomic, strong) NSMutableArray<NSDictionary *> *mockDevices;
@property (nonatomic, assign) BOOL isPairingInProgress;
@property (nonatomic, strong) NSString *currentPairingMode;
@property (nonatomic, assign) BOOL sdkInitialized;
@end

@implementation SmartLifeModule

// MARK: - RCTBridgeModule

RCT_EXPORT_MODULE(); // Esto exporta como "SmartLifeModule"

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (instancetype)init {
    if (self = [super init]) {
        _mockDevices = [NSMutableArray array];
        _isPairingInProgress = NO;
        _currentPairingMode = nil;
        _sdkInitialized = NO;
        
        RCTLogInfo(@"✅ SmartLifeModule initialized successfully");
    }
    return self;
}

// MARK: - Método de prueba de conexión

RCT_EXPORT_METHOD(testConnection:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    RCTLogInfo(@"🧪 Testing SmartLifeModule connection");
    
    NSDictionary *testResult = @{
        @"status": @"success",
        @"message": @"SmartLifeModule is working correctly!",
        @"timestamp": @([[NSDate date] timeIntervalSince1970]),
        @"platform": @"iOS",
        @"moduleVersion": @"1.0.0"
    };
    
    resolve(testResult);
}

// MARK: - Inicialización del SDK

RCT_EXPORT_METHOD(initSDK:(NSString *)appKey
                  secretKey:(NSString *)secretKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        @try {
            RCTLogInfo(@"🔧 Initializing Tuya SDK with AppKey: %@", appKey ?: @"[NULL]");
            
            if (!appKey || !secretKey) {
                RCTLogError(@"❌ AppKey or SecretKey is null");
                reject(@"INIT_ERROR", @"AppKey and SecretKey are required", nil);
                return;
            }
            
            #ifdef DEBUG
            [[ThingSmartSDK sharedInstance] setDebugMode:YES];
            #endif
            
            [[ThingSmartSDK sharedInstance] startWithAppKey:appKey secretKey:secretKey];
            
            self.sdkInitialized = YES;
            RCTLogInfo(@"✅ Tuya SDK initialized successfully");
            
            resolve(@{
                @"status": @"success",
                @"message": @"SDK initialized successfully",
                @"appKey": [appKey substringToIndex:MIN(8, appKey.length)],
                @"platform": @"iOS"
            });
            
        } @catch (NSException *exception) {
            RCTLogError(@"❌ Error initializing Tuya SDK: %@", exception.reason);
            reject(@"INIT_ERROR", exception.reason ?: @"Unknown initialization error", nil);
        }
    });
}

// MARK: - Métodos de autenticación (simulados por compatibilidad)

RCT_EXPORT_METHOD(loginWithEmail:(NSString *)countryCode
                  email:(NSString *)email
                  password:(NSString *)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"🔑 Attempting login with email: %@ (SIMULATED)", email);
    
    // Validaciones básicas
    if (!email || email.length == 0) {
        reject(@"VALIDATION_ERROR", @"Email is required", nil);
        return;
    }
    
    if (!password || password.length == 0) {
        reject(@"VALIDATION_ERROR", @"Password is required", nil);
        return;
    }
    
    // Validar formato de email
    NSString *emailRegex = @"[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}";
    NSPredicate *emailPredicate = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", emailRegex];
    if (![emailPredicate evaluateWithObject:email]) {
        reject(@"VALIDATION_ERROR", @"Invalid email format", nil);
        return;
    }
    
    // Simular proceso de login con delay realista
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        
        // Simular diferentes respuestas basadas en el email para testing
        if ([email containsString:@"error"]) {
            reject(@"LOGIN_ERROR", @"Invalid credentials", nil);
            return;
        }
        
        if ([email containsString:@"timeout"]) {
            reject(@"TIMEOUT_ERROR", @"Login timeout", nil);
            return;
        }
        
        NSString *username = [[email componentsSeparatedByString:@"@"] firstObject];
        
        NSDictionary *userResponse = @{
            @"uid": [NSString stringWithFormat:@"sim_%@_%ld", username, (long)[[NSDate date] timeIntervalSince1970]],
            @"username": username,
            @"email": email,
            @"avatarUrl": @"",
            @"phoneNumber": @"",
            @"countryCode": countryCode ?: @"593",
            @"isSimulated": @YES,
            @"loginTime": @([[NSDate date] timeIntervalSince1970])
        };
        
        RCTLogInfo(@"✅ Login successful (simulated) for user: %@", username);
        resolve(userResponse);
    });
}

RCT_EXPORT_METHOD(registerWithEmail:(NSString *)email
                  password:(NSString *)password
                  countryCode:(NSString *)countryCode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"📧 Attempting registration with email: %@ (SIMULATED)", email);
    
    // Validaciones básicas
    if (!email || email.length == 0) {
        reject(@"VALIDATION_ERROR", @"Email is required", nil);
        return;
    }
    
    if (!password || password.length < 6) {
        reject(@"VALIDATION_ERROR", @"Password must be at least 6 characters", nil);
        return;
    }
    
    // Validar formato de email
    NSString *emailRegex = @"[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}";
    NSPredicate *emailPredicate = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", emailRegex];
    if (![emailPredicate evaluateWithObject:email]) {
        reject(@"VALIDATION_ERROR", @"Invalid email format", nil);
        return;
    }
    
    // Simular proceso de registro con delay realista
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        
        // Simular diferentes respuestas para testing
        if ([email containsString:@"exists"]) {
            reject(@"REGISTER_ERROR", @"Email already exists", nil);
            return;
        }
        
        NSString *username = [[email componentsSeparatedByString:@"@"] firstObject];
        
        NSDictionary *userResponse = @{
            @"uid": [NSString stringWithFormat:@"new_%@_%ld", username, (long)[[NSDate date] timeIntervalSince1970]],
            @"username": username,
            @"email": email,
            @"avatarUrl": @"",
            @"phoneNumber": @"",
            @"countryCode": countryCode ?: @"593",
            @"isSimulated": @YES,
            @"registrationTime": @([[NSDate date] timeIntervalSince1970])
        };
        
        RCTLogInfo(@"✅ Registration successful (simulated) for user: %@", username);
        resolve(userResponse);
    });
}

RCT_EXPORT_METHOD(logout:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"🚪 Performing logout (SIMULATED)");
    
    // Simular logout con pequeño delay
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        RCTLogInfo(@"✅ Logout successful (simulated)");
        resolve(@{
            @"status": @"success",
            @"message": @"Logout successful",
            @"timestamp": @([[NSDate date] timeIntervalSince1970])
        });
    });
}

// MARK: - Métodos de gestión de hogares (simulados)

RCT_EXPORT_METHOD(getHomeList:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"🏠 Getting home list (SIMULATED)");
    
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        NSArray *simulatedHomes = @[
            @{
                @"homeId": @1001,
                @"name": @"Mi Casa Principal",
                @"geoName": @"Quito, Ecuador",
                @"lat": @(-0.1807),
                @"lon": @(-78.4678),
                @"address": @"Quito, Pichincha, Ecuador",
                @"isSimulated": @YES
            },
            @{
                @"homeId": @1002,
                @"name": @"Casa de Playa",
                @"geoName": @"Salinas, Ecuador",
                @"lat": @(-2.2108),
                @"lon": @(-80.9558),
                @"address": @"Salinas, Santa Elena, Ecuador",
                @"isSimulated": @YES
            }
        ];
        
        RCTLogInfo(@"✅ Retrieved %lu homes (simulated)", (unsigned long)simulatedHomes.count);
        resolve(simulatedHomes);
    });
}

RCT_EXPORT_METHOD(createHome:(NSString *)homeName
                  geoName:(NSString *)geoName
                  lat:(double)lat
                  lon:(double)lon
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"🏠 Creating home: %@ (SIMULATED)", homeName);
    
    if (!homeName || homeName.length == 0) {
        reject(@"VALIDATION_ERROR", @"Home name is required", nil);
        return;
    }
    
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        long newHomeId = 2000 + (long)[[NSDate date] timeIntervalSince1970] % 1000;
        
        NSDictionary *newHome = @{
            @"homeId": @(newHomeId),
            @"name": homeName,
            @"geoName": geoName ?: @"",
            @"lat": @(lat),
            @"lon": @(lon),
            @"address": geoName ?: @"",
            @"isSimulated": @YES,
            @"createdAt": @([[NSDate date] timeIntervalSince1970])
        };
        
        RCTLogInfo(@"✅ Home created successfully (simulated): %@", homeName);
        resolve(newHome);
    });
}

// MARK: - Métodos de dispositivos

RCT_EXPORT_METHOD(getDeviceList:(NSInteger)homeId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"📱 Getting device list for home: %ld (INCLUDING MOCK)", (long)homeId);
    
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.8 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        NSMutableArray *allDevices = [NSMutableArray array];
        
        // Agregar dispositivos mock existentes
        [allDevices addObjectsFromArray:self.mockDevices];
        
        // Agregar algunos dispositivos simulados por defecto si no hay ninguno
        if (allDevices.count == 0) {
            [allDevices addObjectsFromArray:@[
                [self createMockDevice:@"Luz Principal" deviceType:@"light"],
                [self createMockDevice:@"Switch Cocina" deviceType:@"switch"],
                [self createMockDevice:@"Sensor Sala" deviceType:@"sensor"]
            ]];
        }
        
        RCTLogInfo(@"✅ Retrieved %lu devices for home %ld", (unsigned long)allDevices.count, (long)homeId);
        resolve(allDevices);
    });
}

RCT_EXPORT_METHOD(addTestDevice:(NSInteger)homeId
                  deviceName:(NSString *)deviceName
                  deviceType:(NSString *)deviceType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"🧪 Adding test device: %@ of type: %@", deviceName, deviceType);
    
    if (!deviceName || deviceName.length == 0) {
        reject(@"VALIDATION_ERROR", @"Device name is required", nil);
        return;
    }
    
    NSDictionary *testDevice = [self createMockDevice:deviceName deviceType:deviceType ?: @"switch"];
    [self.mockDevices addObject:testDevice];
    
    RCTLogInfo(@"✅ Test device created successfully: %@", deviceName);
    resolve(testDevice);
}

RCT_EXPORT_METHOD(removeDevice:(NSString *)deviceId
                  homeId:(NSInteger)homeId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"🗑️ Removing device: %@", deviceId);
    
    if (!deviceId) {
        reject(@"VALIDATION_ERROR", @"Device ID is required", nil);
        return;
    }
    
    NSPredicate *predicate = [NSPredicate predicateWithFormat:@"devId == %@", deviceId];
    NSArray *foundDevices = [self.mockDevices filteredArrayUsingPredicate:predicate];
    
    if (foundDevices.count > 0) {
        [self.mockDevices removeObjectsInArray:foundDevices];
        RCTLogInfo(@"✅ Device removed successfully: %@", deviceId);
        resolve(@"Device removed successfully");
    } else {
        reject(@"DEVICE_NOT_FOUND", @"Device not found", nil);
    }
}

RCT_EXPORT_METHOD(clearAllTestDevices:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    NSInteger count = self.mockDevices.count;
    [self.mockDevices removeAllObjects];
    
    RCTLogInfo(@"✅ Cleared %ld test devices", (long)count);
    resolve([NSString stringWithFormat:@"Cleared %ld test devices successfully", (long)count]);
}

// MARK: - Métodos de red y emparejamiento

RCT_EXPORT_METHOD(getCurrentWifiSSID:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    // iOS no permite obtener el SSID real por restricciones de privacidad
    NSArray *simulatedNetworks = @[@"MyHomeWiFi", @"Casa_Internet", @"Movistar_Fibra", @"CNT_WiFi"];
    NSString *randomSSID = simulatedNetworks[arc4random() % simulatedNetworks.count];
    
    RCTLogInfo(@"📶 Current WiFi SSID (simulated): %@", randomSSID);
    resolve(randomSSID);
}

RCT_EXPORT_METHOD(startDevicePairingEZ:(NSInteger)homeId
                  ssid:(NSString *)ssid
                  password:(NSString *)password
                  timeout:(NSInteger)timeout
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"🔗 Starting EZ device pairing (SIMULATED) for home: %ld", (long)homeId);
    
    if (self.isPairingInProgress) {
        reject(@"PAIRING_IN_PROGRESS", @"Device pairing is already in progress", nil);
        return;
    }
    
    if (!ssid || ssid.length == 0) {
        reject(@"VALIDATION_ERROR", @"WiFi SSID is required", nil);
        return;
    }
    
    self.isPairingInProgress = YES;
    
    // Simular proceso de emparejamiento
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(3.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        NSDictionary *pairedDevice = [self createSimulatedPairedDevice:ssid];
        [self.mockDevices addObject:pairedDevice];
        
        self.isPairingInProgress = NO;
        
        RCTLogInfo(@"✅ EZ Pairing simulation completed successfully");
        resolve(pairedDevice);
    });
}

RCT_EXPORT_METHOD(stopDevicePairing:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"⏹️ Stopping device pairing");
    self.isPairingInProgress = NO;
    resolve(@"Device pairing stopped successfully");
}

// MARK: - Utilidades

RCT_EXPORT_METHOD(destroy:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"🧹 Destroying SmartLifeModule");
    
    self.isPairingInProgress = NO;
    self.currentPairingMode = nil;
    [self.mockDevices removeAllObjects];
    
    resolve(@"SmartLifeModule destroyed successfully");
}

// MARK: - Helper Methods

- (NSDictionary *)createMockDevice:(NSString *)deviceName deviceType:(NSString *)deviceType {
    NSTimeInterval timestamp = [[NSDate date] timeIntervalSince1970];
    NSString *deviceId = [NSString stringWithFormat:@"test_%@_%.0f_%d", deviceType, timestamp, arc4random() % 1000];
    
    return @{
        @"devId": deviceId,
        @"name": deviceName,
        @"iconUrl": [self getIconForDeviceType:deviceType],
        @"isOnline": @YES,
        @"productId": [NSString stringWithFormat:@"test_%@", deviceType],
        @"uuid": [NSString stringWithFormat:@"test_uuid_%.0f", timestamp],
        @"category": deviceType,
        @"productName": [NSString stringWithFormat:@"Test %@", deviceType],
        @"isLocalOnline": @YES,
        @"isSub": @NO,
        @"isShare": @NO,
        @"supportedFunctions": [self getFunctionsForType:deviceType],
        @"status": [self getDefaultStateForType:deviceType],
        @"isSimulated": @YES,
        @"createdAt": @(timestamp)
    };
}

- (NSDictionary *)createSimulatedPairedDevice:(NSString *)networkName {
    NSTimeInterval timestamp = [[NSDate date] timeIntervalSince1970];
    NSString *deviceId = [NSString stringWithFormat:@"paired_%.0f_%d", timestamp, arc4random() % 1000];
    
    return @{
        @"devId": deviceId,
        @"name": [NSString stringWithFormat:@"Dispositivo Emparejado - %@", networkName],
        @"iconUrl": @"https://images.tuyacn.com/smart/icon/switch.png",
        @"isOnline": @YES,
        @"productId": [NSString stringWithFormat:@"paired_product_%.0f", timestamp],
        @"uuid": [NSString stringWithFormat:@"paired_uuid_%.0f", timestamp],
        @"category": @"switch",
        @"productName": @"Dispositivo Recién Emparejado",
        @"isLocalOnline": @YES,
        @"isSub": @NO,
        @"isShare": @NO,
        @"supportedFunctions": @[@"switch_1"],
        @"status": @{@"switch_1": @NO},
        @"isSimulated": @YES,
        @"pairedAt": @(timestamp),
        @"pairedFrom": networkName
    };
}

- (NSString *)getIconForDeviceType:(NSString *)deviceType {
    NSDictionary *icons = @{
        @"switch": @"https://images.tuyacn.com/smart/icon/switch.png",
        @"light": @"https://images.tuyacn.com/smart/icon/light.png",
        @"sensor": @"https://images.tuyacn.com/smart/icon/sensor.png",
        @"plug": @"https://images.tuyacn.com/smart/icon/plug.png",
        @"fan": @"https://images.tuyacn.com/smart/icon/fan.png",
        @"thermostat": @"https://images.tuyacn.com/smart/icon/thermostat.png"
    };
    return icons[deviceType] ?: icons[@"switch"];
}

- (NSArray *)getFunctionsForType:(NSString *)deviceType {
    NSDictionary *functions = @{
        @"switch": @[@"switch_1", @"switch_2", @"switch_3"],
        @"light": @[@"switch_1", @"bright_value", @"temp_value", @"colour_data"],
        @"sensor": @[@"temp_current", @"humidity_value", @"battery_percentage"],
        @"plug": @[@"switch_1", @"cur_power", @"cur_voltage"],
        @"fan": @[@"switch_1", @"fan_speed", @"mode"],
        @"thermostat": @[@"switch_1", @"temp_set", @"temp_current", @"mode"]
    };
    return functions[deviceType] ?: @[@"switch_1"];
}

- (NSDictionary *)getDefaultStateForType:(NSString *)deviceType {
    NSDictionary *states = @{
        @"switch": @{@"switch_1": @NO, @"switch_2": @NO, @"switch_3": @NO},
        @"light": @{@"switch_1": @NO, @"bright_value": @255, @"temp_value": @500, @"work_mode": @"white"},
        @"sensor": @{@"temp_current": @22, @"humidity_value": @45, @"battery_percentage": @85},
        @"plug": @{@"switch_1": @NO, @"cur_power": @0, @"cur_voltage": @220},
        @"fan": @{@"switch_1": @NO, @"fan_speed": @1, @"mode": @"straight_wind"},
        @"thermostat": @{@"switch_1": @NO, @"temp_set": @23, @"temp_current": @22, @"mode": @"auto"}
    };
    return states[deviceType] ?: @{@"switch_1": @NO};
}

@end
