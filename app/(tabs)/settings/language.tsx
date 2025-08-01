import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useLanguage, Language } from '@/hooks/useLanguage';
import { SettingsHeader } from '@/components/settings/SettingsHeader';

export default function LanguageScreen() {
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

    const handleSelectLanguage = async (language: string) => {
        const success = await updateLanguage(language);
        if (success) {
            Alert.alert('Success', 'Language updated successfully');
        }
    };

    // Render a language option
    const renderLanguageOption = (language: Language) => {
        const isSelected = currentLanguage === language.name;

        return (
            <TouchableOpacity
                key={language.code}
                className="flex-row items-center justify-between py-4"
                onPress={() => handleSelectLanguage(language.name)}
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
            <SettingsHeader title="Language" onBackPress={handleBack} />

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
                            Suggested
                        </Text>
                        {suggestedLanguages.map(renderLanguageOption)}
                    </View>
                )}

                {otherLanguages.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-white text-lg font-semibold mb-3">
                            Language
                        </Text>
                        {otherLanguages.map(renderLanguageOption)}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}