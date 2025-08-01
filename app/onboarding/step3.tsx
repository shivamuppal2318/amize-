import React from 'react';
import { View, Text, Image, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { PartyPopper } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { useAuth } from '@/hooks/useAuth';

// @ts-ignore
import DefaultImage from '@/assets/images/figma/Enthusiastic-amico 1.png';

const DEFAULT_IMAGE = Image.resolveAssetSource(DefaultImage).uri;

const StyledView = View

const StyledSafeAreaView = SafeAreaView

export default function OnboardingStep3() {
    const { setOnboardingComplete } = useAuth();

    const handleGetStarted = async () => {
        // Mark onboarding as complete using the context method
        await setOnboardingComplete();
        router.push('/(auth)/get-started');
    };

    return (
        <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
            <StyledView className="flex-1 p-6">
                <StyledView className="flex-1 justify-center items-center">
                    <StyledView className="w-64 h-64 mb-8 justify-center items-center">
                        {/* The person celebrating illustration - in real app would use an SVG or image */}
                        <StyledView className="w-64 h-64 rounded-full justify-center items-center">
                            <StyledView className="p-2 rounded-lg">
                                <Image
                                    source={{uri: DEFAULT_IMAGE }}
                                    style={{width: 230, height: 230}}
                                />
                            </StyledView>
                        </StyledView>
                    </StyledView>

                    <Text style={{ fontFamily: 'Figtree'}} className="text-white font-figtree text-3xl font-bold text-center mb-4">
                        Let's have fun with your friends & app right now!
                    </Text>
                </StyledView>

                <StyledView className="mb-8">
                    <ProgressDots total={3} current={2} />
                    <Button
                        label="Next"
                        onPress={handleGetStarted}
                        variant="primary"
                        fullWidth
                    />
                </StyledView>
            </StyledView>
        </StyledSafeAreaView>
    );
}