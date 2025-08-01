import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { DeviceInfo } from '../api/types';

// Generate a unique device ID (can be improved with additional identifiers)
export const getDeviceId = async (): Promise<string> => {
    if (Platform.OS === 'android') {
        return Application.getAndroidId() || Device.deviceName || 'unknown-android-device';
    } else if (Platform.OS === 'ios') {
        return await Application.getIosIdForVendorAsync() || Device.deviceName || 'unknown-ios-device';
    }

    return Device.deviceName || 'unknown-device';
};

// Get device info for API requests
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
    return {
        deviceName: Device.deviceName || undefined,
        deviceModel: Device.modelName || undefined,
        osVersion: `${Platform.OS} ${Platform.Version}`,
        appVersion: Application.nativeApplicationVersion || undefined,
    };
};

// Get full device details for API requests
export const getFullDeviceDetails = async () => {
    const deviceId = await getDeviceId();
    const deviceInfo = await getDeviceInfo();

    return {
        deviceId,
        deviceInfo
    };
};