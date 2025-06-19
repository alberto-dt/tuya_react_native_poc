#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootViewDelegate.h>

// Importar Tuya SDK
#import <ThingSmartHomeKit/ThingSmartKit.h>
// Nota: ThingSmartBusinessExtensionKit está comentado en el Podfile

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"SmartLifeApp"; // Cambiar por el nombre correcto de tu app

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Configurar Tuya SDK aquí si es necesario
  // [ThingSmartBusinessExtensionConfig setupConfig]; // Descomentar cuando tengas el BusinessExtensionKit

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
