import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useLanguage, Language } from '@/hooks/useLanguage';
import { useI18n } from '@/hooks/useI18n';
import { SettingsHeader } from '@/components/settings/SettingsHeader';

export default function LanguageScreen() {
    const { t } = useI18n();
    const {
        currentLanguage,
        suggestedLanguages,
        otherLanguages,
        isLoading,
        error,
        updateLanguage
    } = useLanguage();

    const handleBack = () => {
        router.back();
    };

    const handleSelectLanguage = async (languageCode: string) => {
        const success = await updateLanguage(languageCode);
        if (success) {
            Alert.alert(t('common.success'), t('settings.language.updated'));
        }
    };

    // Render a language option
    const renderLanguageOption = (language: Language) => {
        const isSelected = currentLanguage === language.code;

        return (
            <TouchableOpacity
                key={language.code}
                className="flex-row items-center justify-between py-4"
                onPress={() => handleSelectLanguage(language.code)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                disabled={isLoading}
            >
                <Text className="text-white">
                    {language.name}
                </Text>

                <View className={`w-5 h-5 rounded-full border ${
                    isSelected
                        ? 'border-[#FF5A5F] bg-[#FF5A5F]'
                        : 'border-white/30 bg-transparent'
                } items-center justify-center`}>
                    {isSelected && (
                        <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#1a1a2e]">
            <SettingsHeader title={t('settings.language.title')} onBackPress={handleBack} />

            {isLoading && (
                <View className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <ActivityIndicator size="large" color="#FF5A5F" />
                </View>
            )}

            <ScrollView className="flex-1 px-6">
                {error && (
                    <View className="bg-red-500/20 p-4 my-2 rounded-lg">
                        <Text className="text-red-400">{error}</Text>
                    </View>
                )}

                {suggestedLanguages.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-white text-lg font-semibold mb-3">
                            {t('settings.language.suggested')}
                        </Text>
                        {suggestedLanguages.map(renderLanguageOption)}
                    </View>
                )}

                {otherLanguages.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-white text-lg font-semibold mb-3">
                            {t('settings.language.other')}
                        </Text>
                        {otherLanguages.map(renderLanguageOption)}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
