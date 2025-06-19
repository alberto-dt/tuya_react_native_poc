#import "TuyaSmartManager.h"
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

@implementation TuyaSmartManager

RCT_EXPORT_MODULE(SmartLifeModule);


RCT_EXPORT_METHOD(initSDK:(NSString *)appKey
                  secretKey:(NSString *)secretKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        @try {
            #ifdef DEBUG
            [[ThingSmartSDK sharedInstance] setDebugMode:YES];
            #endif

            [[ThingSmartSDK sharedInstance] startWithAppKey:appKey secretKey:secretKey];
            resolve(@"SDK initialized successfully");
        } @catch (NSException *exception) {
            reject(@"INIT_ERROR", exception.reason, nil);
        }
    });
}

RCT_EXPORT_METHOD(loginWithEmail:(NSString *)countryCode
                  email:(NSString *)email
                  password:(NSString *)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    [[ThingSmartUser sharedInstance] loginByEmail:email
                                      countryCode:countryCode
                                         password:password
                                          success:^{
        ThingSmartUser *user = [ThingSmartUser sharedInstance];
        resolve(@{
            @"uid": user.uid ?: @"",
            @"username": user.userName ?: @"",
            @"email": user.email ?: @"",
            @"phoneNumber": user.phoneNumber ?: @""
        });
    } failure:^(NSError *error) {
        reject(@"LOGIN_ERROR", error.localizedDescription, error);
    }];
}

// Agregar más métodos según los que uses en SmartLifeService...

@end
