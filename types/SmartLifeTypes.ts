export interface TuyaUser {
    uid: string;
    username: string;
    email: string;
    avatarUrl?: string;
    headPic?: string;
    nickName?: string;
    phoneCode?: string;
    mobile?: string;
    timezoneId?: string;
}

export interface TuyaHome {
    homeId: number;
    name: string;
    geoName: string;
    lon: number;
    lat: number;
    address: string;
}

export interface TuyaDevice {
    devId: string;
    name: string;
    iconUrl: string;
    isOnline: boolean;
    productId: string;
    supportedFunctions: string[];
    schemaArray?: DeviceSchema[];
}

export interface DeviceSchema {
    id: string;
    mode: string;
    code: string;
    name: string;
    type: string;
    values?: any;
    property?: any;
}

export interface DeviceCommand {
    [key: string]: any;
}

export interface SmartLifeModuleInterface {
    initSDK(appKey: string, secretKey: string): Promise<string>;
    initSDKWithDataCenter(appKey: string, secretKey: string, endpoint: string): Promise<string>;
    loginWithEmail(countryCode: string, email: string, password: string): Promise<TuyaUser>;
    loginWithPhone(phone: string, password: string, countryCode: string): Promise<TuyaUser>;
    testBasicLogging(email: string, password: string): Promise<any>;
    testMultipleServers(email: string, password: string): Promise<any>;
    getHomeList(): Promise<TuyaHome[]>;
    getDeviceList(homeId: number): Promise<TuyaDevice[]>;
    controlDevice(deviceId: string, commands: string): Promise<string>;
    getDeviceSchema(deviceId: string): Promise<DeviceSchema[]>;
    logout(): Promise<string>;
}
