#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <ThingSmartHomeKit/ThingSmartKit.h>

// ✅ Mantener el nombre de clase pero exportar como SmartLifeModule
@interface TuyaSmartManager : RCTEventEmitter <RCTBridgeModule>

@end
