package com.smartlifeapppoc;

import android.content.Context;
import com.facebook.react.ReactInstanceManager;

/**
 * Class responsible of loading Flipper inside your React Native application. This is the debug
 * flavor of it. Here you can add your own plugins and customize the Flipper setup.
 */
public class ReactNativeFlipper {
    public static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
        // Temporalmente deshabilitado para evitar conflictos con Tuya SDK
        // TODO: Reactivar Flipper una vez resueltos los conflictos de dependencias

        // Código original comentado:
    /*
    if (FlipperUtils.shouldEnableFlipper(context)) {
      final FlipperClient client = AndroidFlipperClient.getInstance(context);

      client.addPlugin(new InspectorFlipperPlugin(context, DescriptorMapping.withDefaults()));
      client.addPlugin(new ReactFlipperPlugin());
      client.addPlugin(new DatabasesFlipperPlugin(context));
      client.addPlugin(new SharedPreferencesFlipperPlugin(context));
      client.addPlugin(CrashReporterPlugin.getInstance());

      NetworkFlipperPlugin networkFlipperPlugin = new NetworkFlipperPlugin();
      NetworkingModule.setCustomClientBuilder(
          new NetworkingModule.CustomClientBuilder() {
            @Override
            public void apply(OkHttpClient.Builder builder) {
              builder.addNetworkInterceptor(new FlipperOkhttpInterceptor(networkFlipperPlugin));
            }
          });
      client.addPlugin(networkFlipperPlugin);
      client.start();

      // Fresco Plugin
      client.addPlugin(new FrescoFlipperPlugin());
    }
    */
    }
}
