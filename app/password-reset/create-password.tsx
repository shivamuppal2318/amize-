import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const StyledView = View

const StyledSafeAreaView = SafeAreaView
const StyledTouchableOpacity = TouchableOpacity

export default function CreatePasswordScreen() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        let isValid = true;
        const newErrors = { password: '', confirmPassword: '' };

        if (!password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
            isValid = false;
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleContinue = () => {
        if (validateForm()) {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                router.push('/password-reset/success');
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
                        Create New Password
                    </Text>
                </StyledView>

                <StyledView className="mb-6">
                    <Input
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        icon={<Lock size={20} color="#9CA3AF" />}
                        error={errors.password}
                    />
                    <Input
                        placeholder="Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        icon={<Lock size={20} color="#9CA3AF" />}
                        error={errors.confirmPassword}
                    />

                    <StyledView className="flex-row items-center mb-4">
                        <TouchableOpacity
                            onPress={() => setRememberMe(!rememberMe)}
                            className="flex-row items-center"
                        >
                            <StyledView
                                className={`w-5 h-5 border rounded ${
                                    rememberMe ? 'bg-[#FF5A5F] border-[#FF5A5F]' : 'bg-transparent border-gray-600'
                                } mr-2 items-center justify-center`}
                            >
                                {rememberMe && <Text className="text-white">✓</Text>}
                            </StyledView>
                            <Text className="text-gray-400">Remember me</Text>
                        </TouchableOpacity>
                    </StyledView>
                </StyledView>

                <Button
                    label="Continue"
                    onPress={handleContinue}
                    variant="primary"
                    fullWidth
                    loading={loading}
                />
            </StyledView>
        </StyledSafeAreaView>
    );
}
