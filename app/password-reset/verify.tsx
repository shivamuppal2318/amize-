import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

const StyledView = View

const StyledSafeAreaView = SafeAreaView
const StyledTouchableOpacity = TouchableOpacity

export default function VerifyCodeScreen() {
    const [code, setCode] = useState('');
    const [timer, setTimer] = useState(60);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timer]);

    const handleResendCode = () => {
        setTimer(60);
    };

    const handleNumberPress = (number: string) => {
        if (code.length < 4) {
            setCode(code + number);
        }
    };

    const handleDeletePress = () => {
        if (code.length > 0) {
            setCode(code.slice(0, -1));
        }
    };

    const handleContinue = () => {
        if (code.length === 4) {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                router.push('/password-reset/create-password');
            }, 1000);
        }
    };

    return (
        <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
            <StyledView className="flex-1 p-6">
                <StyledTouchableOpacity
                    className="p-2 -ml-2 mb-4"
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={24} color="white" />
                </StyledTouchableOpacity>

                <StyledView className="mb-6">
                    <Text className="text-white text-2xl font-bold">
                        Forget Password
                    </Text>
                </StyledView>

                <StyledView className="mb-6">
                    <Text className="text-gray-400 mb-6">
                        Code has been sent to +1 (555) ******99
                    </Text>

                    <StyledView className="flex-row justify-center mb-6">
                        {[...Array(4)].map((_, index) => (
                            <StyledView
                                key={index}
                                className={`w-12 h-12 rounded-lg mx-2 items-center justify-center ${
                                    index < code.length ? 'bg-[#FF5A5F]' : 'bg-[#2A2A2A]'
                                }`}
                            >
                                {index < code.length && (
                                    <Text className="text-white text-lg font-bold">
                                        {index === 2 ? '7' : '•'}
                                    </Text>
                                )}
                            </StyledView>
                        ))}
                    </StyledView>

                    <StyledView className="flex-row justify-center mb-6">
                        <Text className="text-gray-400 mr-1">Resend Code in</Text>
                        <Text className="text-[#FF5A5F]">{timer}s</Text>
                    </StyledView>
                </StyledView>

                {/* Number pad */}
                <StyledView className="mb-6">
                    <StyledView className="flex-row justify-around mb-4">
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('1')}
                        >
                            <Text className="text-white text-2xl">1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('2')}
                        >
                            <Text className="text-white text-2xl">2</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('3')}
                        >
                            <Text className="text-white text-2xl">3</Text>
                        </TouchableOpacity>
                    </StyledView>
                    <StyledView className="flex-row justify-around mb-4">
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('4')}
                        >
                            <Text className="text-white text-2xl">4</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('5')}
                        >
                            <Text className="text-white text-2xl">5</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('6')}
                        >
                            <Text className="text-white text-2xl">6</Text>
                        </TouchableOpacity>
                    </StyledView>
                    <StyledView className="flex-row justify-around mb-4">
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('7')}
                        >
                            <Text className="text-white text-2xl">7</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('8')}
                        >
                            <Text className="text-white text-2xl">8</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('9')}
                        >
                            <Text className="text-white text-2xl">9</Text>
                        </TouchableOpacity>
                    </StyledView>
                    <StyledView className="flex-row justify-around">
                        <StyledView className="w-16 h-16" />
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={() => handleNumberPress('0')}
                        >
                            <Text className="text-white text-2xl">0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                            onPress={handleDeletePress}
                        >
                            <Text className="text-white text-2xl">⌫</Text>
                        </TouchableOpacity>
                    </StyledView>
                </StyledView>

                <Button
                    label="Continue"
                    onPress={handleContinue}
                    variant="primary"
                    fullWidth
                    loading={loading}
                    disabled={code.length < 4}
                />
            </StyledView>
        </StyledSafeAreaView>
    );
}