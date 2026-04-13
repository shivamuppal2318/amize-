import React, { useState } from 'react';
import {View, Text, TouchableOpacity, ScrollView, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Mars, Venus, Users } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Gender } from '@/data/mockUser';
import { useRegistration } from '@/context/RegistrationContext';

// @ts-ignore
import AmizeLogo from '@/assets/images/amize.png';
const AMIZE_LOGO = AmizeLogo;

export default function GenderScreen() {
    const { updateUser, user } = useAuth();
    const [selectedGender, setSelectedGender] = useState<Gender>(
        (user?.gender as Gender) || null
    );
    const { updateRegistrationData } = useRegistration();

    const handleContinue = () => {
        if (selectedGender) {
            updateRegistrationData({ gender: selectedGender });
            updateUser({ gender: selectedGender });
        }
        router.push('/account-setup/birthday');
    };

    const handleSkip = () => {
        router.push('/account-setup/birthday');
    };

    const genderOptions = [
        {
            key: 'male' as Gender,
            label: 'Male',
            icon: Mars,
            color: '#3B82F6'
        },
        {
            key: 'female' as Gender,
            label: 'Female',
            icon: Venus,
            color: '#EC4899'
        },
        // {
        //     key: 'other' as Gender,
        //     label: 'Other',
        //     icon: Users,
        //     color: '#8B5CF6'
        // }
    ];

    return (
        <>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
            />
            <SafeAreaView
                style={{ flex: 1, backgroundColor: '#1a1a2e' }}
                edges={['top']}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ flex: 1, paddingHorizontal: 24 }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 16
                        }}>
                            <TouchableOpacity
                                style={{ padding: 8, marginLeft: -8 }}
                                onPress={() => router.back()}
                            >
                                <ChevronLeft size={24} color="white" />
                            </TouchableOpacity>

                            <Text style={{
                                color: 'white',
                                fontSize: 18,
                                fontWeight: '600',
                                fontFamily: 'Figtree'
                            }}>
                                Tell Us About Yourself
                            </Text>

                            <TouchableOpacity onPress={handleSkip}>
                                <Text style={{
                                    color: '#FF5A5F',
                                    fontSize: 16,
                                    fontWeight: '500',
                                    fontFamily: 'Figtree'
                                }}>
                                    Skip
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Content Container */}
                        <View style={{ flex: 1, alignItems: 'center', paddingVertical: 20 }}>

                            {/* Logo and Header Section */}
                            <View style={{ alignItems: 'center', marginBottom: 48 }}>
                                {/* Logo */}
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    backgroundColor: '#FF5A5F',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 24
                                }}>
                                    <Image
                                        source={AMIZE_LOGO}
                                        style={{ width: 80, height: 80, borderRadius: 40 }}
                                        resizeMode="contain"
                                    />
                                </View>

                                {/* Title */}
                                <Text style={{
                                    fontFamily: 'Figtree',
                                    color: 'white',
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    marginBottom: 8,
                                    textAlign: 'center'
                                }}>
                                    What's Your Gender?
                                </Text>

                                {/* Subtitle */}
                                <Text style={{
                                    color: '#9CA3AF',
                                    fontSize: 16,
                                    fontFamily: 'Figtree',
                                    textAlign: 'center',
                                    paddingHorizontal: 20,
                                    lineHeight: 24
                                }}>
                                    Choose your identity & help us to find accurate content for you
                                </Text>
                            </View>

                            {/* Progress Indicator */}
                            <View style={{ paddingHorizontal: 32, marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={{
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: '#FF5A5F',
                                        borderRadius: 4
                                    }} />
                                    <View style={{
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: '#FF5A5F',
                                        borderRadius: 4
                                    }} />
                                    <View style={{
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: '#1a1a2e',
                                        borderRadius: 4
                                    }} />
                                    <View style={{
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: '#1a1a2e',
                                        borderRadius: 4
                                    }} />
                                </View>
                                <Text style={{
                                    color: '#9CA3AF',
                                    fontSize: 14,
                                    textAlign: 'center',
                                    marginTop: 8,
                                    fontFamily: 'Figtree'
                                }}>
                                    Step 2 of 4
                                </Text>
                            </View>

                            {/* Gender Options */}
                            <View style={{ width: '100%', maxWidth: 320, marginBottom: 32 }}>
                                <View style={{ gap: 16 }}>
                                    {genderOptions.map((option) => {
                                        const IconComponent = option.icon;
                                        const isSelected = selectedGender === option.key;

                                        return (
                                            <TouchableOpacity
                                                key={option.key}
                                                onPress={() => setSelectedGender(option.key)}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    padding: 20,
                                                    borderRadius: 16,
                                                    borderWidth: 2,
                                                    borderColor: isSelected ? '#FF5A5F' : '#374151',
                                                    backgroundColor: isSelected ? 'rgba(255, 90, 95, 0.1)' : '#1a1a2e'
                                                }}
                                            >
                                                {/* Icon Container */}
                                                <View style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 28,
                                                    backgroundColor: isSelected ? '#FF5A5F' : option.color,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: 16
                                                }}>
                                                    <IconComponent size={28} color="white" />
                                                </View>

                                                {/* Label */}
                                                <Text style={{
                                                    color: 'white',
                                                    fontSize: 18,
                                                    fontWeight: '600',
                                                    fontFamily: 'Figtree',
                                                    flex: 1
                                                }}>
                                                    {option.label}
                                                </Text>

                                                {/* Selection Indicator */}
                                                <View style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 10,
                                                    borderWidth: 2,
                                                    borderColor: isSelected ? '#FF5A5F' : '#6B7280',
                                                    backgroundColor: isSelected ? '#FF5A5F' : 'transparent',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {isSelected && (
                                                        <View style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: 4,
                                                            backgroundColor: 'white'
                                                        }} />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Selection Confirmation */}
                            {selectedGender && (
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{
                                        color: '#9CA3AF',
                                        fontSize: 14,
                                        textAlign: 'center',
                                        fontFamily: 'Figtree'
                                    }}>
                                        {genderOptions.find(option => option.key === selectedGender)?.label} selected
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Continue Button */}
                        <View style={{ paddingBottom: 32, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                            <Button
                                label="Continue"
                                onPress={handleContinue}
                                variant="primary"
                                fullWidth
                                disabled={!selectedGender}
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}
