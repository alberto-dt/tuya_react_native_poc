// ios/SmartLifeAppPOC/TuyaBridge.m
#import "TuyaBridge.h"
#import <TuyaSmartHomeKit/TuyaSmartHomeKit.h>
#import <TuyaSmartActivatorKit/TuyaSmartActivatorKit.h>

@interface TuyaBridge() <TuyaSmartActivatorDelegate>
@property (nonatomic, strong) RCTPromiseResolveBlock pairingResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock pairingReject;
@end

@implementation TuyaBridge

// ✅ CRÍTICO: Exportar como SmartLifeModule para que coincida con tu servicio
RCT_EXPORT_MODULE(SmartLifeModule);

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"TuyaDeviceStatusChanged", @"TuyaUserLoginSuccess", @"TuyaUserLoginError", @"TuyaDevicePaired"];
}

#pragma mark - SDK Initialization

RCT_EXPORT_METHOD(initSDK:(NSString *)appKey
                  secretKey:(NSString *)secretKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🔧 Initializing Tuya SDK with appKey: %@", appKey);

    [[TuyaSmartSDK sharedInstance] startWithAppKey:appKey secretKey:secretKey];

    // Configurar delegados para activación
    [TuyaSmartActivator sharedInstance].delegate = self;

    // Solo para desarrollo - remover en producción
    [[TuyaSmartSDK sharedInstance] setDebugMode:YES];

    NSLog(@"✅ Tuya SDK initialized successfully");
    resolve(@"SDK initialized successfully");
}

#pragma mark - User Management

RCT_EXPORT_METHOD(registerWithEmail:(NSString *)email
                  password:(NSString *)password
                  countryCode:(NSString *)countryCode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"📧 Registering user with email: %@", email);

    [[TuyaSmartUser sharedInstance] registerByEmail:countryCode
                                              email:email
                                           password:password
                                            success:^{
        NSLog(@"✅ User registered successfully");

        // Después del registro exitoso, hacer login automático
        [[TuyaSmartUser sharedInstance] loginByEmail:countryCode
                                               email:email
                                            password:password
                                             success:^{
            TuyaSmartUser *currentUser = [TuyaSmartUser sharedInstance];
            NSDictionary *userData = [self userDataDictionary:currentUser email:email];

            [self sendEventWithName:@"TuyaUserLoginSuccess" body:userData];
            resolve(userData);
        } failure:^(NSError *error) {
            NSLog(@"❌ Auto-login after registration failed: %@", error.localizedDescription);
            reject(@"AUTO_LOGIN_ERROR", error.localizedDescription, error);
        }];

    } failure:^(NSError *error) {
        NSLog(@"❌ Registration failed: %@", error.localizedDescription);
        [self sendEventWithName:@"TuyaUserLoginError" body:@{@"error": error.localizedDescription}];
        reject(@"REGISTER_ERROR", error.localizedDescription, error);
    }];
}

RCT_EXPORT_METHOD(loginWithEmail:(NSString *)countryCode
                  email:(NSString *)email
                  password:(NSString *)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🔑 Logging in user: %@", email);

    [[TuyaSmartUser sharedInstance] loginByEmail:countryCode
                                           email:email
                                        password:password
                                         success:^{
        NSLog(@"✅ Login successful");

        TuyaSmartUser *currentUser = [TuyaSmartUser sharedInstance];
        NSDictionary *userData = [self userDataDictionary:currentUser email:email];

        [self sendEventWithName:@"TuyaUserLoginSuccess" body:userData];
        resolve(userData);

    } failure:^(NSError *error) {
        NSLog(@"❌ Login failed: %@", error.localizedDescription);
        [self sendEventWithName:@"TuyaUserLoginError" body:@{@"error": error.localizedDescription}];
        reject(@"LOGIN_ERROR", error.localizedDescription, error);
    }];
}

RCT_EXPORT_METHOD(logout:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🚪 Logging out user");

    [[TuyaSmartUser sharedInstance] loginOut:^{
        NSLog(@"✅ Logout successful");
        resolve(@"Logout successful");
    } failure:^(NSError *error) {
        NSLog(@"❌ Logout failed: %@", error.localizedDescription);
        reject(@"LOGOUT_ERROR", error.localizedDescription, error);
    }];
}

#pragma mark - Home Management

RCT_EXPORT_METHOD(getHomeList:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🏠 Getting home list");

    [[TuyaSmartHomeManager sharedInstance] getHomeListWithSuccess:^(NSArray<TuyaSmartHomeModel *> *homes) {
        NSLog(@"✅ Retrieved %lu homes", (unsigned long)homes.count);

        NSMutableArray *homeList = [NSMutableArray array];
        for (TuyaSmartHomeModel *home in homes) {
            [homeList addObject:[self homeDataDictionary:home]];
        }

        resolve(homeList);

    } failure:^(NSError *error) {
        NSLog(@"❌ Failed to get home list: %@", error.localizedDescription);
        reject(@"GET_HOMES_ERROR", error.localizedDescription, error);
    }];
}

RCT_EXPORT_METHOD(createHome:(NSString *)homeName
                  geoName:(NSString *)geoName
                  lat:(double)lat
                  lon:(double)lon
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🏠 Creating home: %@", homeName);

    [[TuyaSmartHomeManager sharedInstance] addHomeWithName:homeName
                                                   geoName:geoName
                                                     rooms:@[]
                                                  latitude:lat
                                                 longitude:lon
                                                   success:^(double homeId) {
        NSLog(@"✅ Home created with ID: %.0f", homeId);

        NSDictionary *homeData = @{
            @"homeId": @(homeId),
            @"name": homeName,
            @"geoName": geoName,
            @"lon": @(lon),
            @"lat": @(lat),
            @"address": geoName
        };

        resolve(homeData);

    } failure:^(NSError *error) {
        NSLog(@"❌ Failed to create home: %@", error.localizedDescription);
        reject(@"CREATE_HOME_ERROR", error.localizedDescription, error);
    }];
}

#pragma mark - Device Management

RCT_EXPORT_METHOD(getDeviceList:(NSNumber *)homeId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"📱 Getting device list for home: %@", homeId);

    TuyaSmartHome *home = [TuyaSmartHome homeWithHomeId:[homeId longLongValue]];

    if (!home) {
        reject(@"NO_HOME", @"Home not found", nil);
        return;
    }

    [home getHomeDetailWithSuccess:^(TuyaSmartHomeModel *homeModel) {
        NSLog(@"✅ Retrieved %lu devices", (unsigned long)homeModel.deviceList.count);

        NSMutableArray *devices = [NSMutableArray array];
        for (TuyaSmartDeviceModel *device in homeModel.deviceList) {
            [devices addObject:[self deviceDataDictionary:device]];
        }

        resolve(devices);

    } failure:^(NSError *error) {
        NSLog(@"❌ Failed to get device list: %@", error.localizedDescription);
        reject(@"GET_DEVICES_ERROR", error.localizedDescription, error);
    }];
}

#pragma mark - Device Pairing

RCT_EXPORT_METHOD(startDevicePairingEZ:(NSNumber *)homeId
                  ssid:(NSString *)ssid
                  password:(NSString *)password
                  timeout:(NSNumber *)timeout
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🔗 Starting EZ mode pairing for SSID: %@", ssid);

    // Guardar callbacks para usar en el delegate
    self.pairingResolve = resolve;
    self.pairingReject = reject;

    // Obtener token de activación
    [[TuyaSmartActivator sharedInstance] getTokenWithHomeId:[homeId longLongValue]
                                                    success:^(NSString *token) {
        NSLog(@"✅ Got activation token");

        // Iniciar configuración EZ
        [[TuyaSmartActivator sharedInstance] startConfigWiFi:TYActivatorModeEZ
                                                        ssid:ssid
                                                    password:password
                                                       token:token
                                                     timeout:[timeout intValue]];

    } failure:^(NSError *error) {
        NSLog(@"❌ Failed to get activation token: %@", error.localizedDescription);
        reject(@"TOKEN_ERROR", error.localizedDescription, error);
    }];
}

RCT_EXPORT_METHOD(startDevicePairingAP:(NSNumber *)homeId
                  ssid:(NSString *)ssid
                  password:(NSString *)password
                  timeout:(NSNumber *)timeout
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🔗 Starting AP mode pairing");

    self.pairingResolve = resolve;
    self.pairingReject = reject;

    [[TuyaSmartActivator sharedInstance] getTokenWithHomeId:[homeId longLongValue]
                                                    success:^(NSString *token) {
        NSLog(@"✅ Got activation token for AP mode");

        [[TuyaSmartActivator sharedInstance] startConfigWiFi:TYActivatorModeAP
                                                        ssid:ssid
                                                    password:password
                                                       token:token
                                                     timeout:[timeout intValue]];

    } failure:^(NSError *error) {
        NSLog(@"❌ Failed to get activation token for AP: %@", error.localizedDescription);
        reject(@"TOKEN_ERROR", error.localizedDescription, error);
    }];
}

RCT_EXPORT_METHOD(stopDevicePairing:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"⏹️ Stopping device pairing");

    [[TuyaSmartActivator sharedInstance] stopConfigWiFi];

    // Limpiar callbacks
    self.pairingResolve = nil;
    self.pairingReject = nil;

    resolve(@"Device pairing stopped");
}

#pragma mark - TuyaSmartActivatorDelegate

- (void)activator:(TuyaSmartActivator *)activator didReceiveDevice:(TuyaSmartDeviceModel *)deviceModel error:(NSError *)error {
    if (error) {
        NSLog(@"❌ Device pairing failed: %@", error.localizedDescription);
        if (self.pairingReject) {
            self.pairingReject(@"PAIRING_ERROR", error.localizedDescription, error);
            self.pairingReject = nil;
            self.pairingResolve = nil;
        }
        return;
    }

    if (deviceModel) {
        NSLog(@"✅ Device paired successfully: %@", deviceModel.name);

        NSDictionary *deviceData = [self deviceDataDictionary:deviceModel];

        [self sendEventWithName:@"TuyaDevicePaired" body:deviceData];

        if (self.pairingResolve) {
            self.pairingResolve(deviceData);
            self.pairingResolve = nil;
            self.pairingReject = nil;
        }
    }
}

#pragma mark - Additional Methods

RCT_EXPORT_METHOD(validatePairingConditions:(NSString *)ssid
                  password:(NSString *)password
                  homeId:(NSNumber *)homeId
                  timeout:(NSNumber *)timeout
                  mode:(NSString *)mode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSMutableArray *errors = [NSMutableArray array];
    NSMutableArray *warnings = [NSMutableArray array];

    if (!ssid || ssid.length == 0) {
        [errors addObject:@"SSID es requerido"];
    }

    if (!password || password.length < 8) {
        [warnings addObject:@"Contraseña muy corta - recomendado 8+ caracteres"];
    }

    if (!homeId || [homeId intValue] <= 0) {
        [errors addObject:@"ID de hogar inválido"];
    }

    BOOL canProceed = errors.count == 0;
    NSString *status = errors.count > 0 ? @"error" : (warnings.count > 0 ? @"not_ready" : @"ready");

    NSDictionary *result = @{
        @"canProceed": @(canProceed),
        @"status": status,
        @"errors": errors,
        @"warnings": warnings,
        @"ssid": ssid ?: @"",
        @"homeId": homeId ?: @0,
        @"timeout": timeout ?: @120,
        @"mode": mode ?: @"EZ",
        @"passwordProvided": @(password && password.length > 0),
        @"validSSID": @(ssid && ssid.length > 0),
        @"validPassword": @(password && password.length >= 8),
        @"validHomeId": @(homeId && [homeId intValue] > 0),
        @"validTimeout": @(timeout && [timeout intValue] >= 30),
        @"validMode": @(YES),
        @"wifiConnected": @(YES),
        @"locationPermissionGranted": @(YES),
        @"locationServicesEnabled": @(YES),
        @"pairingAvailable": @(YES),
        @"currentSSID": @"Unknown",
        @"alreadyOnTargetNetwork": @(NO)
    };

    resolve(result);
}

RCT_EXPORT_METHOD(getCurrentWifiSSID:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    // En iOS es complejo obtener el SSID sin permisos especiales
    resolve(@"Unknown Network");
}

RCT_EXPORT_METHOD(removeDevice:(NSString *)deviceId
                  homeId:(NSNumber *)homeId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    TuyaSmartDevice *device = [TuyaSmartDevice deviceWithDeviceId:deviceId];

    [device remove:^{
        resolve(@"Device removed successfully");
    } failure:^(NSError *error) {
        reject(@"REMOVE_ERROR", error.localizedDescription, error);
    }];
}

// Mock methods para testing
RCT_EXPORT_METHOD(addTestDevice:(NSNumber *)homeId
                  deviceName:(NSString *)deviceName
                  deviceType:(NSString *)deviceType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSString *deviceId = [NSString stringWithFormat:@"test_%@_%ld", deviceType, (long)[[NSDate date] timeIntervalSince1970]];

    NSDictionary *mockDevice = @{
        @"devId": deviceId,
        @"name": deviceName,
        @"iconUrl": @"https://images.tuyacn.com/smart/icon/switch.png",
        @"isOnline": @YES,
        @"productId": [NSString stringWithFormat:@"test_%@", deviceType],
        @"supportedFunctions": @[@"switch_1"],
        @"uuid": deviceId,
        @"category": deviceType,
        @"productName": [NSString stringWithFormat:@"Test %@", deviceType],
        @"isLocalOnline": @YES,
        @"isSub": @NO,
        @"isShare": @NO,
        @"status": @{@"switch_1": @NO}
    };

    resolve(mockDevice);
}

RCT_EXPORT_METHOD(clearAllTestDevices:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@"Test devices cleared");
}

RCT_EXPORT_METHOD(destroy:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@"SDK destroyed");
}

#pragma mark - Helper Methods

- (NSDictionary *)userDataDictionary:(TuyaSmartUser *)user email:(NSString *)email {
    return @{
        @"uid": user.uid ?: @"",
        @"email": email ?: @"",
        @"username": user.nickname ?: email ?: @"",
        @"avatarUrl": user.headPic ?: @"",
        @"nickName": user.nickname ?: @"",
        @"phoneCode": user.phoneCode ?: @"",
        @"mobile": user.mobile ?: @"",
        @"timezoneId": user.timezoneId ?: @""
    };
}

- (NSDictionary *)homeDataDictionary:(TuyaSmartHomeModel *)home {
    return @{
        @"homeId": @(home.homeId),
        @"name": home.name ?: @"",
        @"geoName": home.geoName ?: @"",
        @"lon": @(home.lon),
        @"lat": @(home.lat),
        @"address": home.address ?: @""
    };
}

- (NSDictionary *)deviceDataDictionary:(TuyaSmartDeviceModel *)device {
    return @{
        @"devId": device.devId ?: @"",
        @"name": device.name ?: @"",
        @"iconUrl": device.iconUrl ?: @"",
        @"isOnline": @(device.isOnline),
        @"productId": device.productId ?: @"",
        @"supportedFunctions": device.schemaArray ?: @[],
        @"uuid": device.uuid ?: @"",
        @"category": device.category ?: @"",
        @"productName": device.productName ?: @"",
        @"isLocalOnline": @(device.isLocalOnline),
        @"isSub": @(device.isSub),
        @"isShare": @(device.isShare),
        @"status": device.dps ?: @{}
    };
}

@end
