import React from 'react';
import { View, Text, Image, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Users } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/ui/ProgressDots';

// @ts-ignore
import DefaultImage from '@/assets/images/figma/Refer a friend-amico 1.png';

const DEFAULT_IMAGE = DefaultImage;

const StyledView = View

const StyledSafeAreaView = SafeAreaView

export default function OnboardingStep2() {
    const handleNext = () => {
        router.push('/onboarding/step3');
    };

    return (
        <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
            <StyledView className="flex-1 p-6">
                <StyledView className="flex-1 justify-center items-center">
                    <StyledView className="w-64 h-64 mb-8 justify-center items-center">
                        {/* The social media illustration - in real app would use an SVG or image */}
                        <StyledView className="w-64 h-64 rounded-full justify-center items-center">
                            <StyledView className="p-2 rounded-lg">
                                <Image
                                    source={DEFAULT_IMAGE}
                                    style={{width: 230, height: 230}}
                                />
                            </StyledView>
                        </StyledView>
                    </StyledView>

                    <Text style={{ fontFamily: 'Figtree'}} className="text-white font-figtree text-3xl font-bold text-center mb-4">
                        Find you friends and play together on social media
                    </Text>
                </StyledView>

                <StyledView className="mb-8">
                    <ProgressDots total={3} current={1} />
                    <Button
                        label="Next"
                        onPress={handleNext}
                        variant="primary"
                        fullWidth
                    />
                </StyledView>
            </StyledView>
        </StyledSafeAreaView>
    );
}
