import React from 'react';
import { View, Text, Image, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Film } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/ui/ProgressDots';
// @ts-ignore
import DefaultImage from '@/assets/images/figma/Media player-rafiki 1.png';

const DEFAULT_IMAGE = DefaultImage;

const StyledView = View

const StyledSafeAreaView = SafeAreaView

export default function OnboardingStep1() {
    const handleNext = () => {
        router.push('/onboarding/step2');
    };

    return (
        <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
            <StyledView className="flex-1 p-6">
                <StyledView className="flex-1 justify-center items-center">
                    <StyledView className="w-64 h-64 mb-8 justify-center items-center">
                        {/* The person standing next to TV illustration - in real app would use an SVG or image */}
                        <StyledView className="w-64 h-64 rounded-full justify-center items-center">
                            <StyledView className="p-2 rounded-lg">
                                <Image
                                    source={DEFAULT_IMAGE}
                                    style={{width: 300, height: 300}}
                                    />
                            </StyledView>
                        </StyledView>
                    </StyledView>

                    <Text style={{ fontFamily: 'Figtree'}} className="text-white font-figtree text-3xl font-bold text-center mb-4">
                        Watch Interesting Videos from around the world
                    </Text>
                </StyledView>

                <StyledView className="mb-8">
                    <ProgressDots total={3} current={0} />
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
