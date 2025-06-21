// ios/SmartLifeAppPOC/TuyaBridge.m
#import "TuyaBridge.h"
#import <ThingSmartHomeKit/ThingSmartKit.h>

@implementation TuyaBridge

RCT_EXPORT_MODULE(SmartLifeModule);

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"TuyaDeviceStatusChanged", @"TuyaUserLoginSuccess", @"TuyaUserLoginError"];
}

RCT_EXPORT_METHOD(initSDK:(NSString *)appKey
                  secretKey:(NSString *)secretKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🔧 Initializing ThingSmartSDK v6.2.0...");

    [[ThingSmartSDK sharedInstance] startWithAppKey:appKey secretKey:secretKey];
    [[ThingSmartSDK sharedInstance] setDebugMode:YES];

    NSLog(@"✅ ThingSmartSDK v6.2.0 initialized successfully");
    resolve(@"ThingSmartSDK v6.2.0 initialized successfully");
}

// ✅ MÉTODO HELPER CORREGIDO PARA v6.2.0
- (NSDictionary *)userDataFromThingSmartUser:(ThingSmartUser *)user email:(NSString *)email {
    return @{
        @"uid": user.uid ?: @"",
        @"email": email ?: @"",
        @"username": user.nickname ?: email ?: @"",
        @"nickName": user.nickname ?: @"",
        // ✅ PROPIEDADES REMOVIDAS EN v6.x
        @"phoneCode": @"", // Ya no existe
        @"mobile": @"",    // Ya no existe
        @"timezoneId": user.timezoneId ?: @"",
        @"avatarUrl": @"",
        @"headPic": @""
    };
}

RCT_EXPORT_METHOD(loginWithEmail:(NSString *)countryCode
                  email:(NSString *)email
                  password:(NSString *)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🔑 Logging in with ThingSmartUser...");

    [[ThingSmartUser sharedInstance] loginByEmail:countryCode
                                            email:email
                                         password:password
                                          success:^{
        NSLog(@"✅ Login successful with ThingSmartSDK");

        ThingSmartUser *currentUser = [ThingSmartUser sharedInstance];
        NSDictionary *userData = [self userDataFromThingSmartUser:currentUser email:email];

        [self sendEventWithName:@"TuyaUserLoginSuccess" body:userData];
        resolve(userData);

    } failure:^(NSError *error) {
        NSLog(@"❌ Login failed: %@", error.localizedDescription);
        [self sendEventWithName:@"TuyaUserLoginError" body:@{@"error": error.localizedDescription}];
        reject(@"LOGIN_ERROR", error.localizedDescription, error);
    }];
}

RCT_EXPORT_METHOD(registerWithEmail:(NSString *)email
                  password:(NSString *)password
                  countryCode:(NSString *)countryCode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"📧 Registering user with email: %@", email);

    [[ThingSmartUser sharedInstance] registerByEmail:countryCode
                                               email:email
                                            password:password
                                             success:^{
        NSLog(@"✅ User registered successfully");

        // Después del registro exitoso, hacer login automático
        [[ThingSmartUser sharedInstance] loginByEmail:countryCode
                                                email:email
                                             password:password
                                              success:^{
            ThingSmartUser *currentUser = [ThingSmartUser sharedInstance];
            NSDictionary *userData = [self userDataFromThingSmartUser:currentUser email:email];

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

RCT_EXPORT_METHOD(logout:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🚪 Logging out user");

    [[ThingSmartUser sharedInstance] loginOut:^{
        NSLog(@"✅ Logout successful");
        resolve(@"Logout successful");
    } failure:^(NSError *error) {
        NSLog(@"❌ Logout failed: %@", error.localizedDescription);
        reject(@"LOGOUT_ERROR", error.localizedDescription, error);
    }];
}

// ✅ CORREGIDO: ThingSmartHomeManager NO tiene sharedInstance
RCT_EXPORT_METHOD(getHomeList:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🏠 Getting home list");

    // ✅ USAR INSTANCIA DIRECTA, NO sharedInstance
    ThingSmartHomeManager *homeManager = [[ThingSmartHomeManager alloc] init];

    [homeManager getHomeListWithSuccess:^(NSArray<ThingSmartHomeModel *> *homes) {
        NSLog(@"✅ Retrieved %lu homes", (unsigned long)homes.count);

        NSMutableArray *homeList = [NSMutableArray array];
        for (ThingSmartHomeModel *home in homes) {
            [homeList addObject:@{
                @"homeId": @(home.homeId),
                @"name": home.name ?: @"",
                @"geoName": home.geoName ?: @"",
                // ✅ PROPIEDADES REMOVIDAS EN v6.x
                @"lon": @0.0, // Ya no existe
                @"lat": @0.0, // Ya no existe
                @"address": @"" // Ya no existe
            }];
        }

        resolve(homeList);

    } failure:^(NSError *error) {
        NSLog(@"❌ Failed to get home list: %@", error.localizedDescription);
        reject(@"GET_HOMES_ERROR", error.localizedDescription, error);
    }];
}

// ✅ CORREGIDO: Método createHome simplificado
RCT_EXPORT_METHOD(createHome:(NSString *)homeName
                  geoName:(NSString *)geoName
                  lat:(double)lat
                  lon:(double)lon
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSLog(@"🏠 Creating home: %@", homeName);

    // ✅ USAR INSTANCIA DIRECTA Y CALLBACK CORRECTO
    ThingSmartHomeManager *homeManager = [[ThingSmartHomeManager alloc] init];

    [homeManager addHomeWithName:homeName
                         geoName:geoName
                           rooms:@[]
                        latitude:lat
                       longitude:lon
                         success:^(long long homeId) { // ✅ TIPO CORRECTO
        NSLog(@"✅ Home created with ID: %lld", homeId);

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

// ✅ MÉTODO ADICIONAL CORREGIDO: Verificar propiedades disponibles
RCT_EXPORT_METHOD(debugUserProperties:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    ThingSmartUser *user = [ThingSmartUser sharedInstance];

    NSLog(@"=== ThingSmartUser Properties Debug v6.2.0 ===");
    NSLog(@"uid: %@", user.uid);
    NSLog(@"nickname: %@", user.nickname);
    NSLog(@"timezoneId: %@", user.timezoneId);
    // ✅ REMOVIDAS: phoneCode, mobile ya no existen
    NSLog(@"=======================================");

    resolve(@"Check console for user properties");
}

// ✅ MÉTODO ADICIONAL: Obtener información de usuario actual
RCT_EXPORT_METHOD(getCurrentUser:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    ThingSmartUser *user = [ThingSmartUser sharedInstance];

    if (user.uid && user.uid.length > 0) {
        NSDictionary *userData = [self userDataFromThingSmartUser:user email:@""];
        resolve(userData);
    } else {
        reject(@"NO_USER", @"No user logged in", nil);
    }
}

@end
