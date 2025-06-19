//
//  SmartLifeModule.m
//  Basado en la documentación oficial de Tuya
//  https://developer.tuya.com/en/docs/app-development/tutorial-for-ios-account?id=Kalawg5deam3k

#import "SmartLifeModule.h"
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

// Importar Tuya SDK
#import <ThingSmartHomeKit/ThingSmartKit.h>

@interface SmartLifeModule()
@property (nonatomic, strong) NSMutableArray<NSDictionary *> *mockDevices;
@property (nonatomic, assign) BOOL isPairingInProgress;
@property (nonatomic, strong) NSString *currentPairingMode;
@property (nonatomic, assign) BOOL sdkInitialized;
@end

@implementation SmartLifeModule

// MARK: - RCTBridgeModule

RCT_EXPORT_MODULE(); // Exporta como "SmartLifeModule"

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
        @"moduleVersion": @"1.0.0",
        @"sdkInitialized": @(self.sdkInitialized)
    };

    resolve(testResult);
}

// MARK: - Inicialización del SDK (Basado en documentación oficial)

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

            // Método oficial según documentación
            #ifdef DEBUG
            [[ThingSmartSDK sharedInstance] setDebugMode:YES];
            #endif

            [[ThingSmartSDK sharedInstance] startWithAppKey:appKey secretKey:secretKey];

            self.sdkInitialized = YES;
            RCTLogInfo(@"✅ Tuya SDK initialized successfully using official method");

            resolve(@{
                @"status": @"success",
                @"message": @"SDK initialized successfully",
                @"appKey": [appKey substringToIndex:MIN(8, appKey.length)],
                @"platform": @"iOS",
                @"method": @"official"
            });

        } @catch (NSException *exception) {
            RCTLogError(@"❌ Error initializing Tuya SDK: %@", exception.reason);
            reject(@"INIT_ERROR", exception.reason ?: @"Unknown initialization error", nil);
        }
    });
}

// MARK: - Métodos de autenticación (Basados en documentación oficial)

RCT_EXPORT_METHOD(loginWithEmail:(NSString *)countryCode
                  email:(NSString *)email
                  password:(NSString *)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    RCTLogInfo(@"🔑 Attempting login with email: %@ using OFFICIAL Tuya method", email);

    // Validaciones básicas
    if (!email || email.length == 0) {
        reject(@"VALIDATION_ERROR", @"Email is required", nil);
        return;
    }

    if (!password) {
        reject(@"VALIDATION_ERROR", @"Password is required", nil);
        return;
    }

    if (!countryCode) {
        reject(@"VALIDATION_ERROR", @"Country code is required", nil);
        return;
    }

    // Validar formato de email
    NSString *emailRegex = @"[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}";
    NSPredicate *emailPredicate = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", emailRegex];
    if (![emailPredicate evaluateWithObject:email]) {
        reject(@"VALIDATION_ERROR", @"Invalid email format", nil);
        return;
    }

    // Método oficial según documentación de Tuya
    [[ThingSmartUser sharedInstance] loginByEmail:countryCode
                                            email:email
                                         password:password
                                          success:^{
        ThingSmartUser *user = [ThingSmartUser sharedInstance];
        RCTLogInfo(@"✅ Official Tuya login successful for user: %@", user.userName ?: user.email);

        // Respuesta según modelo de datos oficial
        NSDictionary *userResponse = @{
            @"uid": user.uid ?: @"",
            @"username": user.userName ?: @"",
            @"email": user.email ?: @"",
            @"avatarUrl": user.headPic ?: @"",
            @"phoneNumber": user.phoneNumber ?: @"",
            @"countryCode": countryCode,
            @"loginMethod": @"email",
            @"isOfficial": @YES,
            @"loginTime": @([[NSDate date] timeIntervalSince1970])
        };

        resolve(userResponse);

    } failure:^(NSError *error) {
        RCTLogError(@"❌ Official Tuya login failed: %@", error.localizedDescription);

        // Mapear errores comunes según documentación
        NSString *errorMessage = error.localizedDescription;
        NSString *errorCode = @"LOGIN_ERROR";

        if ([errorMessage containsString:@"not exist"] || [errorMessage containsString:@"not found"]) {
            errorCode = @"USER_NOT_FOUND";
            errorMessage = @"User not found. Please register first.";
        } else if ([errorMessage containsString:@"password"] || [errorMessage containsString:@"credential"]) {
            errorCode = @"INVALID_CREDENTIALS";
            errorMessage = @"Invalid email or password.";
        } else if ([errorMessage containsString:@"network"] || [errorMessage containsString:@"connection"]) {
            errorCode = @"NETWORK_ERROR";
            errorMessage = @"Network error. Please check your connection.";
        }

        reject(errorCode, errorMessage, error);
    }];
}

RCT_EXPORT_METHOD(registerWithEmail:(NSString *)email
                  password:(NSString *)password
                  countryCode:(NSString *)countryCode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    RCTLogInfo(@"📧 Attempting registration with email: %@ using OFFICIAL Tuya method", email);

    // Validaciones básicas
    if (!email || email.length == 0) {
        reject(@"VALIDATION_ERROR", @"Email is required", nil);
        return;
    }

    if (!password || password.length < 6) {
        reject(@"VALIDATION_ERROR", @"Password must be at least 6 characters", nil);
        return;
    }

    if (!countryCode) {
        reject(@"VALIDATION_ERROR", @"Country code is required", nil);
        return;
    }

    // Validar formato de email
    NSString *emailRegex = @"[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}";
    NSPredicate *emailPredicate = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", emailRegex];
    if (![emailPredicate evaluateWithObject:email]) {
        reject(@"VALIDATION_ERROR", @"Invalid email format", nil);
        return;
    }

    // PASO 1: Enviar código de verificación (según documentación oficial)
    NSString *region = [[ThingSmartUser sharedInstance] getDefaultRegionWithCountryCode:countryCode];

    [[ThingSmartUser sharedInstance] sendVerifyCodeWithUserName:email
                                                         region:region
                                                    countryCode:countryCode
                                                           type:1 // type:1 para registro
                                                        success:^{
        RCTLogInfo(@"✅ Verification code sent successfully to: %@", email);

        // Para esta demo, simular que el usuario ingresó un código válido
        // En una app real, necesitarías una pantalla para que el usuario ingrese el código
        NSString *simulatedCode = @"123456"; // En producción, esto vendría del usuario

        // PASO 2: Registrar con el código (método oficial)
        [[ThingSmartUser sharedInstance] registerByEmail:countryCode
                                                   email:email
                                                password:password
                                                    code:simulatedCode
                                                 success:^{
            ThingSmartUser *user = [ThingSmartUser sharedInstance];
            RCTLogInfo(@"✅ Official Tuya registration successful for user: %@", user.userName ?: user.email);

            NSDictionary *userResponse = @{
                @"uid": user.uid ?: @"",
                @"username": user.userName ?: @"",
                @"email": user.email ?: @"",
                @"avatarUrl": user.headPic ?: @"",
                @"phoneNumber": user.phoneNumber ?: @"",
                @"countryCode": countryCode,
                @"registrationMethod": @"email",
                @"isOfficial": @YES,
                @"registrationTime": @([[NSDate date] timeIntervalSince1970])
            };

            resolve(userResponse);

        } failure:^(NSError *error) {
            RCTLogError(@"❌ Official Tuya registration failed: %@", error.localizedDescription);

            NSString *errorMessage = error.localizedDescription;
            NSString *errorCode = @"REGISTER_ERROR";

            if ([errorMessage containsString:@"exist"] || [errorMessage containsString:@"registered"]) {
                errorCode = @"EMAIL_EXISTS";
                errorMessage = @"Email already registered. Please use a different email or login.";
            } else if ([errorMessage containsString:@"code"] || [errorMessage containsString:@"verification"]) {
                errorCode = @"INVALID_CODE";
                errorMessage = @"Invalid verification code.";
            }

            reject(errorCode, errorMessage, error);
        }];

    } failure:^(NSError *error) {
        RCTLogError(@"❌ Failed to send verification code: %@", error.localizedDescription);
        reject(@"VERIFICATION_CODE_ERROR", @"Failed to send verification code", error);
    }];
}

RCT_EXPORT_METHOD(logout:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    RCTLogInfo(@"🚪 Performing logout using OFFICIAL Tuya method");

    // Método oficial según documentación
    [[ThingSmartUser sharedInstance] loginOut:^{
        RCTLogInfo(@"✅ Official Tuya logout successful");
        resolve(@{
            @"status": @"success",
            @"message": @"Logout successful",
            @"method": @"official",
            @"timestamp": @([[NSDate date] timeIntervalSince1970])
        });
    } failure:^(NSError *error) {
        RCTLogError(@"❌ Official Tuya logout failed: %@", error.localizedDescription);
        reject(@"LOGOUT_ERROR", error.localizedDescription, error);
    }];
}

// MARK: - Métodos de gestión de hogares (Basados en documentación oficial)

RCT_EXPORT_METHOD(getHomeList:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    RCTLogInfo(@"🏠 Getting home list using OFFICIAL Tuya method");

    // Método oficial según documentación
    ThingSmartHomeManager *homeManager = [ThingSmartHomeManager new];
    [homeManager getHomeListWithSuccess:^(NSArray<ThingSmartHomeModel *> *homes) {

        NSMutableArray *homeArray = [NSMutableArray array];

        for (ThingSmartHomeModel *home in homes) {
            [homeArray addObject:@{
                @"homeId": @(home.homeId),
                @"name": home.name ?: @"",
                @"geoName": home.geoName ?: @"",
                @"lat": @(home.lat),
                @"lon": @(home.lon),
                @"address": home.geoName ?: @"",
                @"isOfficial": @YES,
                @"rooms": @(home.rooms.count ?: 0),
                @"deviceCount": @(home.deviceList.count ?: 0)
            }];
        }

        RCTLogInfo(@"✅ Retrieved %lu homes using official method", (unsigned long)homes.count);
        resolve(homeArray);

    } failure:^(NSError *error) {
        RCTLogError(@"❌ Failed to get home list: %@", error.localizedDescription);
        reject(@"GET_HOMES_ERROR", error.localizedDescription, error);
    }];
}

RCT_EXPORT_METHOD(createHome:(NSString *)homeName
                  geoName:(NSString *)geoName
                  lat:(double)lat
                  lon:(double)lon
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    RCTLogInfo(@"🏠 Creating home: %@ using OFFICIAL Tuya method", homeName);

    if (!homeName || homeName.length == 0) {
        reject(@"VALIDATION_ERROR", @"Home name is required", nil);
        return;
    }

    // Método oficial según documentación
    ThingSmartHomeManager *homeManager = [ThingSmartHomeManager new];
    NSArray *rooms = @[]; // Lista vacía de habitaciones inicialmente

    [homeManager addHomeWithName:homeName
                         geoName:geoName ?: @""
                           rooms:rooms
                        latitude:lat
                       longitude:lon
                         success:^(long long homeId) {
        RCTLogInfo(@"✅ Home created successfully with ID: %lld", homeId);

        NSDictionary *newHome = @{
            @"homeId": @(homeId),
            @"name": homeName,
            @"geoName": geoName ?: @"",
            @"lat": @(lat),
            @"lon": @(lon),
            @"address": geoName ?: @"",
            @"isOfficial": @YES,
            @"createdAt": @([[NSDate date] timeIntervalSince1970])
        };

        resolve(newHome);

    } failure:^(NSError *error) {
        RCTLogError(@"❌ Failed to create home: %@", error.localizedDescription);
        reject(@"CREATE_HOME_ERROR", error.localizedDescription, error);
    }];
}

// MARK: - Métodos de dispositivos

RCT_EXPORT_METHOD(getDeviceList:(NSInteger)homeId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    RCTLogInfo(@"📱 Getting device list for home: %ld using OFFICIAL Tuya method", (long)homeId);

    // Método oficial según documentación
    ThingSmartHome *home = [ThingSmartHome homeWithHomeId:homeId];
    [home getHomeDetailWithSuccess:^(ThingSmartHomeModel *homeModel) {

        NSMutableArray *allDevices = [NSMutableArray array];

        // Agregar dispositivos reales del SDK
        if (homeModel.deviceList && homeModel.deviceList.count > 0) {
            for (ThingSmartDeviceModel *device in homeModel.deviceList) {
                [allDevices addObject:[self convertDeviceModelToDict:device]];
            }
        }

        // Agregar dispositivos mock para demo
        [allDevices addObjectsFromArray:self.mockDevices];

        RCTLogInfo(@"✅ Retrieved %lu devices (%lu real, %lu mock) for home %ld",
                  (unsigned long)allDevices.count,
                  (unsigned long)(homeModel.deviceList.count ?: 0),
                  (unsigned long)self.mockDevices.count,
                  (long)homeId);

        resolve(allDevices);

    } failure:^(NSError *error) {
        RCTLogError(@"❌ Failed to get device list: %@", error.localizedDescription);

        // En caso de error, devolver solo dispositivos mock
        RCTLogInfo(@"⚠️ Returning only mock devices due to error");
        resolve([self.mockDevices copy]);
    }];
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

// MARK: - Métodos de red y emparejamiento

RCT_EXPORT_METHOD(getCurrentWifiSSID:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    // iOS no permite obtener el SSID real por restricciones de privacidad desde iOS 13+
    NSArray *simulatedNetworks = @[@"MyHomeWiFi", @"Casa_Internet", @"Movistar_Fibra", @"CNT_WiFi"];
    NSString *randomSSID = simulatedNetworks[arc4random() % simulatedNetworks.count];

    RCTLogInfo(@"📶 Current WiFi SSID (simulated due to iOS restrictions): %@", randomSSID);
    resolve(randomSSID);
}

RCT_EXPORT_METHOD(startDevicePairingEZ:(NSInteger)homeId
                  ssid:(NSString *)ssid
                  password:(NSString *)password
                  timeout:(NSInteger)timeout
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    RCTLogInfo(@"🔗 Starting EZ device pairing (SIMULATED with real structure) for home: %ld", (long)homeId);

    if (self.isPairingInProgress) {
        reject(@"PAIRING_IN_PROGRESS", @"Device pairing is already in progress", nil);
        return;
    }

    if (!ssid || ssid.length == 0) {
        reject(@"VALIDATION_ERROR", @"WiFi SSID is required", nil);
        return;
    }

    self.isPairingInProgress = YES;

    // Simular proceso de emparejamiento EZ Mode
    // En producción, aquí usarías: ThingSmartActivator para el emparejamiento real
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

// MARK: - Utilidades y limpieza

RCT_EXPORT_METHOD(removeDevice:(NSString *)deviceId
                  homeId:(NSInteger)homeId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    RCTLogInfo(@"🗑️ Removing device: %@", deviceId);

    if (!deviceId) {
        reject(@"VALIDATION_ERROR", @"Device ID is required", nil);
        return;
    }

    // Verificar si es dispositivo mock
    NSPredicate *predicate = [NSPredicate predicateWithFormat:@"devId == %@", deviceId];
    NSArray *foundDevices = [self.mockDevices filteredArrayUsingPredicate:predicate];

    if (foundDevices.count > 0) {
        [self.mockDevices removeObjectsInArray:foundDevices];
        RCTLogInfo(@"✅ Mock device removed successfully: %@", deviceId);
        resolve(@"Mock device removed successfully");
    } else {
        // Para dispositivos reales, usar método oficial
        ThingSmartDevice *device = [ThingSmartDevice deviceWithDeviceId:deviceId];
        [device remove:^{
            RCTLogInfo(@"✅ Real device removed successfully: %@", deviceId);
            resolve(@"Real device removed successfully");
        } failure:^(NSError *error) {
            RCTLogError(@"❌ Failed to remove real device: %@", error.localizedDescription);
            reject(@"REMOVE_DEVICE_ERROR", error.localizedDescription, error);
        }];
    }
}

RCT_EXPORT_METHOD(clearAllTestDevices:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSInteger count = self.mockDevices.count;
    [self.mockDevices removeAllObjects];

    RCTLogInfo(@"✅ Cleared %ld test devices", (long)count);
    resolve([NSString stringWithFormat:@"Cleared %ld test devices successfully", (long)count]);
}

RCT_EXPORT_METHOD(destroy:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    RCTLogInfo(@"🧹 Destroying SmartLifeModule");

    self.isPairingInProgress = NO;
    self.currentPairingMode = nil;
    [self.mockDevices removeAllObjects];

    resolve(@"SmartLifeModule destroyed successfully");
}

// MARK: - Helper Methods

- (NSDictionary *)convertDeviceModelToDict:(ThingSmartDeviceModel *)device {
    NSMutableDictionary *deviceDict = [NSMutableDictionary dictionary];

    deviceDict[@"devId"] = device.devId ?: @"";
    deviceDict[@"name"] = device.name ?: @"Dispositivo sin nombre";
    deviceDict[@"iconUrl"] = device.iconUrl ?: @"";
    deviceDict[@"isOnline"] = @(device.isOnline);
    deviceDict[@"productId"] = device.productId ?: @"";
    deviceDict[@"uuid"] = device.uuid ?: @"";
    deviceDict[@"category"] = device.category ?: @"";
    deviceDict[@"productName"] = device.productId ?: @"";
    deviceDict[@"isLocalOnline"] = @(device.isLocalOnline);
    deviceDict[@"isSub"] = @NO;
    deviceDict[@"isShare"] = @(device.isShare);
    deviceDict[@"isOfficial"] = @YES;

    // Funciones soportadas desde schema
    NSMutableArray *functions = [NSMutableArray array];
    if (device.schemaArray) {
        for (ThingSmartSchemaModel *schema in device.schemaArray) {
            if (schema.code) {
                [functions addObject:schema.code];
            }
        }
    }
    deviceDict[@"supportedFunctions"] = functions;

    // Status/DPS del dispositivo real
    deviceDict[@"status"] = device.dps ?: @{};

    return [deviceDict copy];
}

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
        @"isOfficial": @NO, // Marca como dispositivo de prueba
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
        @"isOfficial": @NO,
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
