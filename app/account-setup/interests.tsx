import React, { useState, useEffect } from 'react';
import {View, Text, TouchableOpacity, ScrollView, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { router } from 'expo-router';
import {
    ChevronLeft,
    Music,
    WandSparkles,
    Laugh,
    Trophy,
    Gamepad2,
    Gem,
    Footprints,
    UtensilsCrossed,
    Plane,
    GraduationCap,
    Laptop,
    PenTool,
    Activity,
    PawPrint,
    CarFront,
    Flower,
    X
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRegistration } from '@/context/RegistrationContext';

// @ts-ignore
import AmizeLogo from '@/assets/images/amize.png';
const AMIZE_LOGO = Image.resolveAssetSource(AmizeLogo).uri;

const interests = [
    {
        name: 'Music',
        icon: Music,
        color: '#8B5CF6' // purple
    },
    {
        name: 'Dance',
        icon: WandSparkles,
        color: '#EC4899' // pink
    },
    {
        name: 'Comedy',
        icon: Laugh,
        color: '#F59E0B' // amber
    },
    {
        name: 'Sports',
        icon: Trophy,
        color: '#10B981' // emerald
    },
    {
        name: 'Gaming',
        icon: Gamepad2,
        color: '#3B82F6' // blue
    },
    {
        name: 'Beauty',
        icon: Gem,
        color: '#F472B6' // pink
    },
    {
        name: 'Fashion',
        icon: Footprints,
        color: '#6366F1' // indigo
    },
    {
        name: 'Food',
        icon: UtensilsCrossed,
        color: '#EF4444' // red
    },
    {
        name: 'Travel',
        icon: Plane,
        color: '#06B6D4' // cyan
    },
    {
        name: 'Education',
        icon: GraduationCap,
        color: '#3B82F6' // blue
    },
    {
        name: 'Technology',
        icon: Laptop,
        color: '#6B7280' // gray
    },
    {
        name: 'Art',
        icon: PenTool,
        color: '#F97316' // orange
    },
    {
        name: 'Fitness',
        icon: Activity,
        color: '#059669' // green
    },
    {
        name: 'Pets',
        icon: PawPrint,
        color: '#84CC16' // lime
    },
    {
        name: 'Cars',
        icon: CarFront,
        color: '#DC2626' // red
    },
    {
        name: 'Nature',
        icon: Flower,
        color: '#16A34A' // green
    }
];

export default function InterestsScreen() {
    const { addInterest, removeInterest, interests: userInterests } = useAuth();
    const { registrationData, updateRegistrationData, setCurrentStep } = useRegistration();
    const [selectedInterests, setSelectedInterests] = useState<string[]>(
        registrationData.interests || userInterests || []
    );

    // Set the current step for the registration flow
    useEffect(() => {
        setCurrentStep(1);
    }, []);

    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            const newInterests = selectedInterests.filter(i => i !== interest);
            setSelectedInterests(newInterests);
            updateRegistrationData({ interests: newInterests });
            removeInterest(interest);
        } else {
            const newInterests = [...selectedInterests, interest];
            setSelectedInterests(newInterests);
            updateRegistrationData({ interests: newInterests });
            addInterest(interest);
        }
    };

    const handleContinue = () => {
        router.push('/account-setup/gender');
    };

    const handleSkip = () => {
        updateRegistrationData({ interests: [] });
        router.push('/account-setup/gender');
    };

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
                                Choose Your Interest
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
                            <View style={{ alignItems: 'center', marginBottom: 32 }}>
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
                                        source={{ uri: AMIZE_LOGO }}
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
                                    Tell Us About Yourself
                                </Text>

                                {/* Subtitle */}
                                <Text style={{
                                    color: '#9CA3AF',
                                    fontSize: 16,
                                    fontFamily: 'Figtree',
                                    textAlign: 'center',
                                    paddingHorizontal: 20
                                }}>
                                    Choose your interests and we'll show you the best videos
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
                                        backgroundColor: '#1a1a2e',
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
                                    Step 1 of 4
                                </Text>
                            </View>

                            {/* Interests Grid */}
                            <View style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}>
                                <View style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    gap: 12
                                }}>
                                    {interests.map((interest) => {
                                        const IconComponent = interest.icon;
                                        const isSelected = selectedInterests.includes(interest.name);

                                        return (
                                            <TouchableOpacity
                                                key={interest.name}
                                                onPress={() => toggleInterest(interest.name)}
                                                style={{
                                                    position: 'relative',
                                                    width: 'auto',
                                                    padding: 14,
                                                    gap: 5,
                                                    flexDirection: 'row',
                                                    borderRadius: 16,
                                                    borderWidth: 2,
                                                    borderColor: isSelected ? '#FF5A5F' : '#374151',
                                                    backgroundColor: isSelected ? 'rgba(255, 90, 95, 0.2)' : '#1a1a2e',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <View style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 16,
                                                    backgroundColor: interest.color,
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <IconComponent size={13} color="white" />
                                                </View>

                                                <Text style={{
                                                    color: 'white',
                                                    fontSize: 14,
                                                    fontWeight: '500',
                                                    fontFamily: 'Figtree',
                                                    textAlign: 'center'
                                                }}>
                                                    {interest.name}
                                                </Text>

                                                {isSelected && (
                                                    <View style={{
                                                        position: 'absolute',
                                                        top: 4,
                                                        right: 4,
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: 12,
                                                        backgroundColor: '#EF4444',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <X size={12} color="white" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Selected Count */}
                            {selectedInterests.length > 0 && (
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{
                                        color: '#9CA3AF',
                                        fontSize: 14,
                                        textAlign: 'center',
                                        fontFamily: 'Figtree'
                                    }}>
                                        {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
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
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}