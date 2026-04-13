import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

const StyledView = View;
const StyledSafeAreaView = SafeAreaView;
const StyledTouchableOpacity = TouchableOpacity;

export default function VerifyCodeScreen() {
    const { method, target } = useLocalSearchParams<{
        method?: string;
        target?: string;
    }>();
    const [code, setCode] = useState('');
    const [timer, setTimer] = useState(60);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const deliveryMethod = method === 'email' ? 'email' : 'sms';
    const deliveryTarget =
        typeof target === 'string' && target.length > 0
            ? target
            : deliveryMethod === 'email'
              ? '****@yourdomain.com'
              : '+1 (555) ******99';

    useEffect(() => {
        if (timer <= 0) {
            return undefined;
        }

        const interval = setInterval(() => {
            setTimer((prevTimer) => prevTimer - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    const handleResendCode = () => {
        setTimer(60);
        setError('');
    };

    const handleNumberPress = (number: string) => {
        setCode((prevCode) => {
            if (prevCode.length >= 4) {
                return prevCode;
            }

            if (error) {
                setError('');
            }

            return `${prevCode}${number}`;
        });
    };

    const handleDeletePress = () => {
        setCode((prevCode) => prevCode.slice(0, -1));
        if (error) {
            setError('');
        }
    };

    const handleContinue = () => {
        if (code.length !== 4) {
            setError('Enter the 4-digit verification code.');
            return;
        }

        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            router.push({
                pathname: '/password-reset/create-password',
                params: {
                    method: deliveryMethod,
                    target: deliveryTarget,
                },
            });
        }, 600);
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
                        Verify Reset Code
                    </Text>
                </StyledView>

                <StyledView className="mb-6">
                    <Text className="text-gray-400 mb-6">
                        Code has been sent by {deliveryMethod.toUpperCase()} to {deliveryTarget}
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
                                    <Text className="text-white text-lg font-bold">*</Text>
                                )}
                            </StyledView>
                        ))}
                    </StyledView>

                    <StyledView className="flex-row justify-center mb-6">
                        <Text className="text-gray-400 mr-1">Resend code in</Text>
                        {timer > 0 ? (
                            <Text className="text-[#FF5A5F]">{timer}s</Text>
                        ) : (
                            <TouchableOpacity onPress={handleResendCode}>
                                <Text className="text-[#FF5A5F] font-bold">Resend now</Text>
                            </TouchableOpacity>
                        )}
                    </StyledView>
                    {!!error && (
                        <Text className="text-[#FCA5A5] text-center mb-4">{error}</Text>
                    )}
                </StyledView>

                <StyledView className="mb-6">
                    <StyledView className="flex-row justify-around mb-4">
                        {['1', '2', '3'].map((value) => (
                            <TouchableOpacity
                                key={value}
                                className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                                onPress={() => handleNumberPress(value)}
                            >
                                <Text className="text-white text-2xl">{value}</Text>
                            </TouchableOpacity>
                        ))}
                    </StyledView>
                    <StyledView className="flex-row justify-around mb-4">
                        {['4', '5', '6'].map((value) => (
                            <TouchableOpacity
                                key={value}
                                className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                                onPress={() => handleNumberPress(value)}
                            >
                                <Text className="text-white text-2xl">{value}</Text>
                            </TouchableOpacity>
                        ))}
                    </StyledView>
                    <StyledView className="flex-row justify-around mb-4">
                        {['7', '8', '9'].map((value) => (
                            <TouchableOpacity
                                key={value}
                                className="w-16 h-16 bg-[#2A2A2A] rounded-lg items-center justify-center"
                                onPress={() => handleNumberPress(value)}
                            >
                                <Text className="text-white text-2xl">{value}</Text>
                            </TouchableOpacity>
                        ))}
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
                            <Text className="text-white text-lg font-semibold">Del</Text>
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
