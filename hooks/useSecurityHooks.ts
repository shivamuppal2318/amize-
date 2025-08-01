import { useState, useCallback, useEffect, useRef } from 'react';
import { useApi } from '@/hooks/useApi';
import { Alert } from 'react-native';

// Type for biometric settings response
interface BiometricSettings {
    useFaceId: boolean;
    useFingerprint: boolean;
    supportedMethods: string[];
}

// Hook for managing security biometric settings
export function useSecurityBiometrics() {
    const { data, loading, error, execute } = useApi('/security/biometric', 'get');
    const updateBiometricApi = useApi('/security/biometric', 'put');

    const [settings, setSettings] = useState<BiometricSettings>({
        useFaceId: false,
        useFingerprint: false,
        supportedMethods: [],
    });

    // Prevent multiple API calls
    const initialFetchDone = useRef(false);

    // Fetch biometric settings only once on mount
    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchBiometricSettings();
            initialFetchDone.current = true;
        }
    }, []);

    // Update state when API data changes
    useEffect(() => {
        if (data?.success && data.settings) {
            setSettings(data.settings);
        }
    }, [data]);

    // Fetch biometric settings
    const fetchBiometricSettings = useCallback(async () => {
        try {
            await execute();
        } catch (err) {
            console.error('Error fetching biometric settings:', err);
        }
    }, [execute]);

    // Update biometric settings (Face ID or Fingerprint)
    const updateBiometricSettings = useCallback(async (type: 'useFaceId' | 'useFingerprint', value: boolean) => {
        try {
            const response = await updateBiometricApi.execute({
                [type]: value
            });

            if (response?.success) {
                setSettings(prev => ({
                    ...prev,
                    [type]: value
                }));
                return true;
            } else {
                Alert.alert('Error', response?.message || `Failed to update ${type.replace('use', '')} settings`);
                return false;
            }
        } catch (err) {
            console.error(`Error updating ${type} settings:`, err);
            Alert.alert('Error', `Failed to update ${type.replace('use', '')} settings`);
            return false;
        }
    }, [updateBiometricApi]);

    return {
        settings,
        loading,
        error,
        updateBiometricSettings,
        refreshSettings: fetchBiometricSettings
    };
}

// Hook for managing PIN
export function useSecurityPIN() {
    const checkPinApi = useApi('/security/pin', 'get');
    const setupPinApi = useApi('/security/pin', 'post');
    const changePinApi = useApi('/security/pin', 'put');
    const removePinApi = useApi('/security/pin', 'delete');

    const [hasPIN, setHasPIN] = useState(false);
    const [loading, setLoading] = useState(false);

    // Prevent multiple API calls
    const initialFetchDone = useRef(false);
    const isRefreshing = useRef(false);

    // Check if PIN is set only once on mount
    useEffect(() => {
        if (!initialFetchDone.current) {
            checkPINStatus();
            initialFetchDone.current = true;
        }
    }, []);

    // Update state when API data changes
    useEffect(() => {
        if (checkPinApi.data?.success) {
            setHasPIN(checkPinApi.data.hasPIN);
        }
    }, [checkPinApi.data]);

    // Check if PIN is set
    const checkPINStatus = useCallback(async () => {
        // Prevent multiple simultaneous calls
        if (isRefreshing.current) return;

        try {
            isRefreshing.current = true;
            await checkPinApi.execute();
        } catch (err) {
            console.error('Error checking PIN status:', err);
        } finally {
            isRefreshing.current = false;
        }
    }, [checkPinApi]);

    // Set up a new PIN
    const setupPIN = useCallback(async (pin: string, confirmPin: string, password: string) => {
        setLoading(true);
        try {
            const response = await setupPinApi.execute({
                pin,
                confirmPin,
                password
            });

            if (response?.success) {
                setHasPIN(true);
                return true;
            } else {
                Alert.alert('Error', response?.message || 'Failed to set up PIN');
                return false;
            }
        } catch (err) {
            console.error('Error setting up PIN:', err);
            Alert.alert('Error', 'Failed to set up PIN');
            return false;
        } finally {
            setLoading(false);
        }
    }, [setupPinApi]);

    // Change existing PIN
    const changePIN = useCallback(async (currentPin: string, newPin: string, confirmPin: string) => {
        setLoading(true);
        try {
            const response = await changePinApi.execute({
                currentPin,
                newPin,
                confirmPin
            });

            if (response?.success) {
                return true;
            } else {
                Alert.alert('Error', response?.message || 'Failed to change PIN');
                return false;
            }
        } catch (err) {
            console.error('Error changing PIN:', err);
            Alert.alert('Error', 'Failed to change PIN');
            return false;
        } finally {
            setLoading(false);
        }
    }, [changePinApi]);

    // Remove PIN
    const removePIN = useCallback(async (currentPin: string, password: string) => {
        setLoading(true);
        try {
            const response = await removePinApi.execute({
                currentPin,
                password
            });

            if (response?.success) {
                setHasPIN(false);
                return true;
            } else {
                Alert.alert('Error', response?.message || 'Failed to remove PIN');
                return false;
            }
        } catch (err) {
            console.error('Error removing PIN:', err);
            Alert.alert('Error', 'Failed to remove PIN');
            return false;
        } finally {
            setLoading(false);
        }
    }, [removePinApi]);

    return {
        hasPIN,
        loading: loading || checkPinApi.loading,
        setupPIN,
        changePIN,
        removePIN,
        refreshPINStatus: checkPINStatus
    };
}

// Hook for managing password
export function useSecurityPassword() {
    const changePasswordApi = useApi('/security/password', 'put');
    const [loading, setLoading] = useState(false);

    // Change password
    const changePassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword: string) => {
        setLoading(true);
        try {
            const response = await changePasswordApi.execute({
                currentPassword,
                newPassword,
                confirmPassword
            });

            if (response?.success) {
                return true;
            } else {
                Alert.alert('Error', response?.message || 'Failed to change password');
                return false;
            }
        } catch (err) {
            console.error('Error changing password:', err);
            Alert.alert('Error', 'Failed to change password');
            return false;
        } finally {
            setLoading(false);
        }
    }, [changePasswordApi]);

    return {
        loading: loading || changePasswordApi.loading,
        changePassword
    };
}

// Hook for managing device sessions
export function useSecurityDevices() {
    const { data, loading, error, execute } = useApi('/security/devices', 'get');
    const [devices, setDevices] = useState<any[]>([]);

    // Prevent multiple API calls
    const initialFetchDone = useRef(false);

    // Fetch devices only once on mount
    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchDevices();
            initialFetchDone.current = true;
        }
    }, []);

    // Update state when API data changes
    useEffect(() => {
        if (data?.success && data.devices) {
            setDevices(data.devices);
        }
    }, [data]);

    // Fetch devices
    const fetchDevices = useCallback(async () => {
        try {
            await execute();
        } catch (err) {
            console.error('Error fetching devices:', err);
        }
    }, [execute]);

    // Remove device
    const removeDevice = useCallback(async (deviceId: string) => {
        try {
            const removeDeviceApi = useApi(`/security/devices/${deviceId}`, 'delete');
            const response = await removeDeviceApi.execute();

            if (response?.success) {
                // Update local state to remove the device
                setDevices(prev => prev.filter(device => device.id !== deviceId));
                return true;
            } else {
                Alert.alert('Error', response?.message || 'Failed to remove device');
                return false;
            }
        } catch (err) {
            console.error('Error removing device:', err);
            Alert.alert('Error', 'Failed to remove device');
            return false;
        }
    }, []);

    return {
        devices,
        loading,
        error,
        removeDevice,
        refreshDevices: fetchDevices
    };
}

// Hook for managing permissions
export function useSecurityPermissions() {
    const { data, loading, error, execute } = useApi('/security/permissions', 'get');
    const updatePermissionApi = useApi('/security/permissions', 'put');

    const [permissions, setPermissions] = useState<any[]>([]);

    // Prevent multiple API calls
    const initialFetchDone = useRef(false);

    // Fetch permissions only once on mount
    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchPermissions();
            initialFetchDone.current = true;
        }
    }, []);

    // Update state when API data changes
    useEffect(() => {
        if (data?.success && data.permissions) {
            setPermissions(data.permissions);
        }
    }, [data]);

    // Fetch permissions
    const fetchPermissions = useCallback(async () => {
        try {
            await execute();
        } catch (err) {
            console.error('Error fetching permissions:', err);
        }
    }, [execute]);

    // Update permission
    const updatePermission = useCallback(async (permissionId: string, granted: boolean) => {
        try {
            const response = await updatePermissionApi.execute({
                permissionId,
                granted
            });

            if (response?.success) {
                // Update local state
                setPermissions(prev =>
                    prev.map(permission =>
                        permission.id === permissionId
                            ? { ...permission, granted }
                            : permission
                    )
                );
                return true;
            } else {
                Alert.alert('Error', response?.message || 'Failed to update permission');
                return false;
            }
        } catch (err) {
            console.error('Error updating permission:', err);
            Alert.alert('Error', 'Failed to update permission');
            return false;
        }
    }, [updatePermissionApi]);

    return {
        permissions,
        loading,
        error,
        updatePermission,
        refreshPermissions: fetchPermissions
    };
}