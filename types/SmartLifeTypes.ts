export interface TuyaUser {
    uid: string;
    username?: string;
    email?: string;
    phoneCode?: string;
    mobile?: string;
    avatarUrl?: string;
}

export interface TuyaHome {
    homeId: number;
    name: string;
    geoName: string;
    lat: number;
    lon: number;
    address: string;
}

export interface DeviceStatus {
    [key: string]: boolean | number | string;
}

export interface TuyaDevice {
    devId: string;
    name: string;
    iconUrl: string;
    isOnline: boolean;
    productId: string;
    categoryCode: string;
    status: DeviceStatus;
}

export interface DeviceSchema {
    id: string;
    code: string;
    name: string;
    type: string;
    mode: string;
}

export interface DeviceCommand {
    switch_1?: boolean;
    switch_2?: boolean;
    switch_3?: boolean;
    bright_value?: number; // 0-255
    temp_value?: number;   // 0-1000
    colour_data?: string;  // JSON string
    [key: string]: any;
}

export interface SmartLifeModuleInterface {
    initSDK(appKey: string, secretKey: string): Promise<string>;
    loginWithEmail(email: string, password: string, countryCode: string): Promise<TuyaUser>;
    loginWithPhone(phone: string, password: string, countryCode: string): Promise<TuyaUser>;
    getHomeList(): Promise<TuyaHome[]>;
    getDeviceList(homeId: number): Promise<TuyaDevice[]>;
    controlDevice(deviceId: string, commands: DeviceCommand): Promise<string>;
    getDeviceSchema(deviceId: string): Promise<DeviceSchema[]>;
    logout(): Promise<string>;
}

export interface ColorHSV {
    h: number;
    s: number;
    v: number;
}

export interface ColorRGB {
    r: number;
    g: number;
    b: number;
}
