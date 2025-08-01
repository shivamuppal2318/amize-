// src/hooks/useCameraPermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Linking, Platform, Alert } from 'react-native';

export const useCameraPermissions = () => {
    const [cameraPermission, setCameraPermission] = useState(null);
    const [microphonePermission, setMicrophonePermission] = useState(null);
    const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if all required permissions are granted
    const hasPermissions =
        cameraPermission === true &&
        microphonePermission === true &&
        mediaLibraryPermission === true;

    // Function to request all permissions
    const requestPermissions = useCallback(async () => {
        setIsLoading(true);

        try {
            // Request camera permission
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
            setCameraPermission(cameraStatus === 'granted');

            // Request microphone permission
            const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();
            setMicrophonePermission(micStatus === 'granted');

            // Request media library permission
            const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
            setMediaLibraryPermission(mediaStatus === 'granted');

            // If any permission is denied, show instructions to enable in settings
            if (
                cameraStatus !== 'granted' ||
                micStatus !== 'granted' ||
                mediaStatus !== 'granted'
            ) {
                // Count denied permissions
                const deniedCount = [
                    cameraStatus !== 'granted',
                    micStatus !== 'granted',
                    mediaStatus !== 'granted'
                ].filter(Boolean).length;

                // Only show alert if multiple permissions were denied or after multiple attempts
                showPermissionInstructions(deniedCount > 1);
            }
        } catch (error) {
            console.error("Error requesting permissions:", error);
            Alert.alert(
                "Permission Error",
                "There was an error requesting permissions. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Function to show instructions to enable permissions in settings
    const showPermissionInstructions = (forceShow = false) => {
        // Only show alert if force is true or permissions were previously requested
        if (forceShow || (cameraPermission === false || microphonePermission === false || mediaLibraryPermission === false)) {
            Alert.alert(
                "Permissions Required",
                "This feature requires camera and storage permissions. Would you like to open settings to enable them?",
                [
                    {
                        text: "Not Now",
                        style: "cancel"
                    },
                    {
                        text: "Open Settings",
                        onPress: openSettings
                    }
                ]
            );
        }
    };

    // Function to open app settings
    const openSettings = () => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
    };

    // Check permissions on mount
    useEffect(() => {
        const checkPermissions = async () => {
            setIsLoading(true);

            try {
                // Check camera permission
                const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
                setCameraPermission(cameraStatus === 'granted');

                // Check microphone permission
                const { status: micStatus } = await Camera.getMicrophonePermissionsAsync();
                setMicrophonePermission(micStatus === 'granted');

                // Check media library permission
                const { status: mediaStatus } = await MediaLibrary.getPermissionsAsync();
                setMediaLibraryPermission(mediaStatus === 'granted');

                // If no permissions have been requested yet, request them
                if (
                    cameraStatus === 'undetermined' ||
                    micStatus === 'undetermined' ||
                    mediaStatus === 'undetermined'
                ) {
                    await requestPermissions();
                }
            } catch (error) {
                console.error("Error checking permissions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkPermissions();
    }, []);

    return {
        cameraPermission,
        microphonePermission,
        mediaLibraryPermission,
        hasPermissions,
        isLoading,
        requestPermissions,
        openSettings
    };
};