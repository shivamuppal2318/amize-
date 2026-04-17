import React, { useMemo, useState } from 'react';
import { Alert, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api/auth';

const StyledView = View

const StyledSafeAreaView = SafeAreaView
const StyledTouchableOpacity = TouchableOpacity

export default function CreatePasswordScreen() {
    const { method, target, token } = useLocalSearchParams<{
        method?: string;
        target?: string;
        token?: string;
    }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    const resetTarget = useMemo(() => {
        if (typeof target === 'string' && target.length > 0) {
            return target;
        }

        return method === 'email' ? '****@yourdomain.com' : '+1 (555) ******99';
    }, [method, target]);

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

    const handleContinue = async () => {
        if (validateForm()) {
            setLoading(true);
            try {
                if (typeof method === 'string' && method === 'email' && typeof target === 'string') {
                    // Requires token from secure reset link; this screen supports it when provided.
                    const tokenParam = typeof token === 'string' ? token : '';

                    if (tokenParam) {
                        await authApi.resetPassword({
                            token: tokenParam,
                            password,
                            confirmPassword,
                        });
                    } else {
                        Alert.alert(
                            'Reset Link Required',
                            'For secure email reset, open the reset link from your email to continue.'
                        );
                        setLoading(false);
                        return;
                    }
                }

                router.push('/password-reset/success');
            } catch (error: any) {
                Alert.alert(
                    'Reset Failed',
                    error?.response?.data?.message || 'Could not reset password now.'
                );
            } finally {
                setLoading(false);
            }
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

                <Text className="text-gray-400 mb-6">
                    Resetting password for {resetTarget}
                </Text>

                <StyledView className="mb-6">
                    <Input
                        placeholder="New password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        icon={<Lock size={20} color="#9CA3AF" />}
                        error={errors.password}
                    />
                    <Input
                        placeholder="Confirm new password"
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
                    onPress={() => {
                        handleContinue().catch(() => {
                            setLoading(false);
                        });
                    }}
                    variant="primary"
                    fullWidth
                    loading={loading}
                />
            </StyledView>
        </StyledSafeAreaView>
    );
}
