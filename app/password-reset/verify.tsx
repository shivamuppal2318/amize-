import React, { useEffect, useState } from 'react';
import { Alert, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth';

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

    const handleResendCode = async () => {
        if (deliveryMethod !== 'email') {
            setTimer(60);
            setError('');
            return;
        }

        try {
            await authApi.forgotPassword(deliveryTarget.toLowerCase());
            setTimer(60);
            setError('');
        } catch (e: any) {
            Alert.alert(
                'Resend Failed',
                e?.response?.data?.message || 'Unable to resend reset email now.'
            );
        }
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
        if (deliveryMethod === 'email') {
            Alert.alert(
                'Use The Reset Link',
                'Open the password reset link sent to your email, then continue from that secure link.'
            );
            return;
        }

        if (code.length !== 4) {
            setError('Enter the 4-digit verification code.');
            return;
        }

        Alert.alert(
            'SMS Reset Unavailable',
            'Password reset verification by SMS is not available in this build yet. Use email reset instead.'
        );
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
                        {deliveryMethod === 'email'
                            ? `A secure reset link has been sent to ${deliveryTarget}. Open that email to continue.`
                            : `Code has been sent by ${deliveryMethod.toUpperCase()} to ${deliveryTarget}`}
                    </Text>

                    {deliveryMethod !== 'email' && (
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
                    )}

                    <StyledView className="flex-row justify-center mb-6">
                        <Text className="text-gray-400 mr-1">Resend code in</Text>
                        {timer > 0 ? (
                            <Text className="text-[#FF5A5F]">{timer}s</Text>
                        ) : (
                            <TouchableOpacity 
                                onPress={handleResendCode}
                                accessibilityLabel="Resend code"
                                accessibilityRole="button"
                            >
                                <Text className="text-[#FF5A5F] font-bold">Resend now</Text>
                            </TouchableOpacity>
                        )}
                    </StyledView>
                    {!!error && (
                        <Text className="text-[#FCA5A5] text-center mb-4">{error}</Text>
                    )}
                </StyledView>

                {deliveryMethod !== 'email' && (
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
                )}

                <Button
                    label={deliveryMethod === 'email' ? 'Open Email Link' : 'Continue'}
                    onPress={handleContinue}
                    variant="primary"
                    fullWidth
                    loading={loading}
                    disabled={deliveryMethod !== 'email' && code.length < 4}
                />
            </StyledView>
        </StyledSafeAreaView>
    );
}
