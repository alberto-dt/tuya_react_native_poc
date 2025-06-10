import { SmartLifeModuleInterface } from './SmartLifeTypes';

declare module 'react-native' {
    interface NativeModulesStatic {
        SmartLifeModule: SmartLifeModuleInterface;
    }
}
