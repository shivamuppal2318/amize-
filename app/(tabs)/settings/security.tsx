import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft} from 'lucide-react-native';
import { SecurityMenuItem } from '@/components/settings/SecurityMenuItem';
import { SecurityButton } from '@/components/settings/SecurityButton';
import { useSecurityBiometrics, useSecurityPIN } from '@/hooks/useSecurityHooks';
import { ChangePasswordModal } from '@/components/settings/security/ChangePasswordModal';
import { ChangePINModal } from '@/components/settings/security/ChangePINModal';
import { ManageDevicesModal } from '@/components/settings/security/ManageDevicesModal';
import { ManagePermissionsModal } from '@/components/settings/security/ManagePermissionsModal';

export default function SecurityScreen() {
    // Security API hooks
    const { settings: biometricSettings, updateBiometricSettings, loading: biometricLoading } = useSecurityBiometrics();
    const { hasPIN, loading: pinLoading } = useSecurityPIN();

    // Modal states
    const [modalStates, setModalStates] = useState({
        changePassword: false,
        changePIN: false,
        manageDevices: false,
        managePermissions: false,
    });

    // Handle back navigation
    const handleBack = () => {
        router.back();
    };

    // Toggle switch handlers
    const handleToggleFaceId = async (value: boolean) => {
        await updateBiometricSettings('useFaceId', value);
    };

    const handleToggleFingerprint = async (value: boolean) => {
        await updateBiometricSettings('useFingerprint', value);
    };

    // Open modal handlers
    const openModal = (modalName: keyof typeof modalStates) => {
        setModalStates(prev => ({ ...prev, [modalName]: true }));
    };

    // Close modal handlers
    const closeModal = (modalName: keyof typeof modalStates) => {
        setModalStates(prev => ({ ...prev, [modalName]: false }));
    };

    // Loading state
    if (biometricLoading && pinLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#1a1a2e] items-center justify-center">
                <ActivityIndicator size="large" color="#FF4D67" />
                <Text className="text-gray-400 mt-4">Loading security settings...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#1a1a2e]">
            {/* Header */}
            <View className="flex-row items-center p-6 pb-4">
                <TouchableOpacity onPress={handleBack} className="pr-4">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-2xl font-bold">
                    Security
                </Text>
            </View>

            <View className="px-6 flex-1">
                {/* Control Section */}
                <View className="mb-8">
                    <Text className="text-white text-2xl font-semibold mb-2">
                        Control
                    </Text>

                    <SecurityMenuItem
                        label="Security Alerts"
                        value="On"
                        onPress={() => {
                            Alert.alert('Security Alerts', 'Security alerts are enabled. You will receive notifications for suspicious activity.');
                        }}
                    />

                    <SecurityMenuItem
                        label="Manage Devices"
                        onPress={() => openModal('manageDevices')}
                    />

                    <SecurityMenuItem
                        label="Manage Permissions"
                        onPress={() => openModal('managePermissions')}
                    />
                </View>

                {/* Security Section */}
                <View className="mb-8">
                    <Text className="text-white text-2xl font-semibold mb-2">
                        Security
                    </Text>

                    {/* Face ID Toggle */}
                    <View className="flex-row items-center justify-between py-5">
                        <Text className="text-white text-lg">
                            Face ID
                        </Text>
                        <View className={`w-12 h-6 rounded-full ${
                            biometricSettings.useFaceId ? 'bg-[#FF4D67]' : 'bg-gray-600'
                        } justify-center px-1`}>
                            <TouchableOpacity
                                className="w-full h-full"
                                onPress={() => handleToggleFaceId(!biometricSettings.useFaceId)}
                                disabled={biometricLoading}
                            >
                                <View
                                    className={`w-5 h-5 rounded-full bg-white ${
                                        biometricSettings.useFaceId ? 'ml-auto' : 'mr-auto'
                                    }`}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Fingerprint Toggle */}
                    <View className="flex-row items-center justify-between py-5">
                        <Text className="text-white text-lg">
                            Fingerprint
                        </Text>
                        <View className={`w-12 h-6 rounded-full ${
                            biometricSettings.useFingerprint ? 'bg-[#FF4D67]' : 'bg-gray-600'
                        } justify-center px-1`}>
                            <TouchableOpacity
                                className="w-full h-full"
                                onPress={() => handleToggleFingerprint(!biometricSettings.useFingerprint)}
                                disabled={biometricLoading}
                            >
                                <View
                                    className={`w-5 h-5 rounded-full bg-white ${
                                        biometricSettings.useFingerprint ? 'ml-auto' : 'mr-auto'
                                    }`}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="mt-4 flex-col gap-4">
                    <SecurityButton
                        label={hasPIN ? "Change PIN" : "Set Up PIN"}
                        onPress={() => openModal('changePIN')}
                    />

                    <SecurityButton
                        label="Change Password"
                        onPress={() => openModal('changePassword')}
                    />
                </View>
            </View>

            {/* Modals */}
            <ChangePasswordModal
                visible={modalStates.changePassword}
                onClose={() => closeModal('changePassword')}
            />

            <ChangePINModal
                visible={modalStates.changePIN}
                onClose={() => closeModal('changePIN')}
            />

            <ManageDevicesModal
                visible={modalStates.manageDevices}
                onClose={() => closeModal('manageDevices')}
            />

            <ManagePermissionsModal
                visible={modalStates.managePermissions}
                onClose={() => closeModal('managePermissions')}
            />
        </SafeAreaView>
    );
}