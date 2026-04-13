import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  Mail,
  Megaphone,
  Settings2,
  Smartphone,
} from 'lucide-react-native';

import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsToggleSwitch } from '@/components/settings/SettingsToggleSwitch';
import { useSettings } from '@/hooks/useSettings';

export default function NotificationsScreen() {
  const { settings, loading, updateNestedSetting } = useSettings();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const enabledCount = useMemo(() => {
    const toggles = settings.notifications;
    return [toggles.push, toggles.email, toggles.marketing].filter(Boolean).length;
  }, [settings.notifications]);

  const handleBack = () => {
    router.back();
  };

  const updateNotificationToggle = async (
    key: 'push' | 'email' | 'marketing',
    value: boolean
  ) => {
    setSavingKey(key);

    const success = await updateNestedSetting('notifications', key, value);

    if (!success) {
      Alert.alert('Notifications', 'Unable to save notification settings right now.');
    }

    setSavingKey(null);
  };

  const handleOpenDeviceSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      Alert.alert('Notifications', 'Unable to open device settings right now.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#1a1a2e] items-center justify-center">
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text className="text-gray-400 mt-4">Loading notification settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1a1a2e]">
      <SettingsHeader title="Notifications" onBackPress={handleBack} />

      <ScrollView className="flex-1 px-6">
        <View className="bg-[#262626] rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <Bell size={20} color="#FF5A5F" />
            <Text className="text-white text-lg font-semibold ml-3">
              Notification Preferences
            </Text>
          </View>
          <Text className="text-gray-400 leading-5">
            Control how Amize contacts you. These preferences are stored on this device
            and can be updated anytime.
          </Text>
          <Text className="text-white mt-4">
            Enabled: {enabledCount} of 3
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-2">Channels</Text>

          <SettingsToggleSwitch
            icon={<Smartphone size={20} color="#FFFFFF" />}
            label={savingKey === 'push' ? 'Saving push notifications...' : 'Push Notifications'}
            value={settings.notifications.push}
            onToggle={(value) => updateNotificationToggle('push', value)}
          />

          <SettingsToggleSwitch
            icon={<Mail size={20} color="#FFFFFF" />}
            label={savingKey === 'email' ? 'Saving email alerts...' : 'Email Alerts'}
            value={settings.notifications.email}
            onToggle={(value) => updateNotificationToggle('email', value)}
          />

          <SettingsToggleSwitch
            icon={<Megaphone size={20} color="#FFFFFF" />}
            label={savingKey === 'marketing' ? 'Saving marketing updates...' : 'Marketing Updates'}
            value={settings.notifications.marketing}
            onToggle={(value) => updateNotificationToggle('marketing', value)}
          />
        </View>

        <View className="bg-[#262626] rounded-2xl p-5 mb-8">
          <View className="flex-row items-center mb-3">
            <Settings2 size={20} color="#FFFFFF" />
            <Text className="text-white text-lg font-semibold ml-3">
              Device Controls
            </Text>
          </View>
          <Text className="text-gray-400 leading-5 mb-4">
            If push permissions were blocked at the OS level, use device settings to allow
            notifications for Amize.
          </Text>
          <TouchableOpacity
            className="bg-[#FF5A5F] py-3 px-4 rounded-xl"
            onPress={handleOpenDeviceSettings}
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold">
              Open Device Settings
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
