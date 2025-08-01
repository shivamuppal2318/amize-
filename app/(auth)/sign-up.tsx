import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Mail, Lock, User, CheckCircle, XCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useRegistration } from '@/context/RegistrationContext';
import { secureStorage, STORAGE_KEYS } from '@/lib/auth/storage';

// @ts-ignore
import FacebookIcon from '@/assets/images/figma/facebook.png';
// @ts-ignore
import GoogleIcon from '@/assets/images/figma/google.png';
// @ts-ignore
import AppleIcon from '@/assets/images/figma/apple.png';

const FACEBOOK_ICON = Image.resolveAssetSource(FacebookIcon).uri;
const GOOGLE_ICON = Image.resolveAssetSource(GoogleIcon).uri;
const APPLE_ICON = Image.resolveAssetSource(AppleIcon).uri;

// @ts-ignore
import AmizeLogo from '@/assets/images/amize.png';
const AMIZE_LOGO = Image.resolveAssetSource(AmizeLogo).uri;

export default function SignUpScreen() {
    const { loading, startSignupFlow } = useAuth();
    const {
        registrationData,
        updateRegistrationData,
        validateField,
        registrationErrors
    } = useRegistration();

    const [processingSignup, setProcessingSignup] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

    // Password validation states
    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });

    // Form field handlers
    const handleUsernameChange = (text: string) => {
        updateRegistrationData({ username: text });
    };

    const handleEmailChange = (text: string) => {
        updateRegistrationData({ email: text });
    };

    const handlePasswordChange = (text: string) => {
        updateRegistrationData({ password: text });

        // Update password requirement checks
        setPasswordChecks({
            length: text.length >= 8,
            uppercase: /[A-Z]/.test(text),
            lowercase: /[a-z]/.test(text),
            number: /[0-9]/.test(text),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(text)
        });
    };

    const handleConfirmPasswordChange = (text: string) => {
        updateRegistrationData({ confirmPassword: text });
    };

    const validateForm = () => {
        const usernameValid = validateField('username');
        const emailValid = validateField('email');
        const passwordValid = validateField('password');
        const confirmPasswordValid = validateField('confirmPassword');

        return usernameValid && emailValid && passwordValid && confirmPasswordValid;
    };

    const handleSignUp = async () => {
        if (validateForm() && rememberMe) {
            try {
                setProcessingSignup(true);

                // IMPORTANT: Set the signup flow flag directly to ensure it's set before navigation
                await secureStorage.set(STORAGE_KEYS.SIGNUP_FLOW, 'true');

                // Wait a moment to make sure the flag is saved
                setTimeout(async () => {
                    try {
                        // Verify flag was set
                        const signupFlow = await secureStorage.get(STORAGE_KEYS.SIGNUP_FLOW);

                        // Use the context function to start the signup flow
                        await startSignupFlow();

                        // Navigate to account setup
                        console.log('SignUp: Navigating to account setup');
                        router.replace('/account-setup/interests');
                    } catch (navError) {
                        console.error('Navigation error:', navError);
                        Alert.alert('Error', 'Failed to navigate to account setup');
                    } finally {
                        setProcessingSignup(false);
                    }
                }, 500);
            } catch (error) {
                console.error('SignUp: Error during signup:', error);
                Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                setProcessingSignup(false);
            }
        } else if (!rememberMe) {
            Alert.alert('Terms Agreement', 'Please agree to the Terms and Privacy Policy to continue.');
        }
    };

    const handleSignIn = () => {
        router.push('/(auth)/sign-in');
    };

    const handleFacebookSignup = () => {
        console.log('Facebook signup');
    };

    const handleGoogleSignup = () => {
        console.log('Google signup');
    };

    const handleAppleSignup = () => {
        console.log('Apple signup');
    };

    // Show processing status if needed
    if (processingSignup) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FF5A5F" />
                <Text style={{ color: 'white', marginTop: 16, fontSize: 18, fontFamily: 'Figtree' }}>
                    Preparing your profile setup...
                </Text>
                <Text style={{ color: '#9CA3AF', marginTop: 8, textAlign: 'center', paddingHorizontal: 32, fontFamily: 'Figtree' }}>
                    Please wait while we prepare your account setup process.
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ flex: 1, paddingHorizontal: 24 }}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={{ padding: 8, marginLeft: -8, marginTop: 16, alignSelf: 'flex-start' }}
                        onPress={() => router.back()}
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>

                    {/* Content Container */}
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>

                        {/* Header Section */}
                        <View style={{ alignItems: 'center', marginBottom: 48, width: '100%' }}>
                            {/* Logo */}
                            <View style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                padding: 3,
                                backgroundColor: '#FF5A5F',
                                marginBottom: 24,
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <View style={{
                                    width: 74,
                                    height: 74,
                                    borderRadius: 37,
                                    backgroundColor: '#1a1a2e',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Image
                                        source={{ uri: AMIZE_LOGO }}
                                        style={{ width: 80, height: 80, borderRadius: 40 }}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>

                            {/* Title */}
                            <Text style={{
                                fontFamily: 'Figtree',
                                color: 'white',
                                fontSize: 28,
                                fontWeight: 'bold',
                                marginBottom: 8,
                                textAlign: 'center'
                            }}>
                                Create your Account
                            </Text>
                        </View>

                        {/* Form Section */}
                        <View style={{ width: '100%', maxWidth: 400 }}>
                            <Input
                                label="Username"
                                placeholder="Enter your username"
                                value={registrationData.username || ''}
                                onChangeText={handleUsernameChange}
                                icon={<User size={20} color="#9CA3AF" />}
                                error={registrationErrors.username}
                                onBlur={() => validateField('username')}
                            />

                            <Input
                                label="Email"
                                placeholder="Enter your email"
                                value={registrationData.email || ''}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                icon={<Mail size={20} color="#9CA3AF" />}
                                error={registrationErrors.email}
                                onBlur={() => validateField('email')}
                            />

                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                value={registrationData.password || ''}
                                onChangeText={handlePasswordChange}
                                secureTextEntry
                                icon={<Lock size={20} color="#9CA3AF" />}
                                error={registrationErrors.password}
                                onBlur={() => validateField('password')}
                                onFocus={() => setShowPasswordRequirements(true)}
                            />

                            {/* Password requirements */}
                            {showPasswordRequirements && (
                                <View style={{
                                    marginBottom: 20,
                                    padding: 16,
                                    backgroundColor: '#2A2A3A',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#374151'
                                }}>
                                    <Text style={{
                                        color: 'white',
                                        marginBottom: 12,
                                        fontFamily: 'Figtree',
                                        fontWeight: '500'
                                    }}>
                                        Password requirements:
                                    </Text>

                                    <View style={{ marginLeft: 8 }}>
                                        {[
                                            { key: 'length', text: 'At least 8 characters', check: passwordChecks.length },
                                            { key: 'uppercase', text: 'At least one uppercase letter', check: passwordChecks.uppercase },
                                            { key: 'lowercase', text: 'At least one lowercase letter', check: passwordChecks.lowercase },
                                            { key: 'number', text: 'At least one number', check: passwordChecks.number },
                                            { key: 'special', text: 'At least one special character', check: passwordChecks.special }
                                        ].map((requirement) => (
                                            <View key={requirement.key} style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginBottom: 6
                                            }}>
                                                {requirement.check ? (
                                                    <CheckCircle size={16} color="#00C853" style={{ marginRight: 8 }} />
                                                ) : (
                                                    <XCircle size={16} color="#FF5A5F" style={{ marginRight: 8 }} />
                                                )}
                                                <Text style={{
                                                    color: requirement.check ? '#00C853' : '#9CA3AF',
                                                    fontFamily: 'Figtree',
                                                    fontSize: 14
                                                }}>
                                                    {requirement.text}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <Input
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                value={registrationData.confirmPassword || ''}
                                onChangeText={handleConfirmPasswordChange}
                                secureTextEntry
                                icon={<Lock size={20} color="#9CA3AF" />}
                                error={registrationErrors.confirmPassword}
                                onBlur={() => validateField('confirmPassword')}
                            />

                            {/* Terms Agreement */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                marginBottom: 32
                            }}>
                                <TouchableOpacity
                                    onPress={() => setRememberMe(!rememberMe)}
                                    style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                                >
                                    <View style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 4,
                                        borderWidth: 1,
                                        borderColor: rememberMe ? '#FF5A5F' : '#6B7280',
                                        backgroundColor: rememberMe ? '#FF5A5F' : 'transparent',
                                        marginRight: 12,
                                        marginTop: 2,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {rememberMe && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
                                    </View>
                                    <Text style={{
                                        color: '#9CA3AF',
                                        fontFamily: 'Figtree',
                                        flex: 1,
                                        lineHeight: 20
                                    }}>
                                        I agree to the{' '}
                                        <Text style={{ color: '#FF5A5F' }}>Terms of Service</Text>
                                        {' '}and{' '}
                                        <Text style={{ color: '#FF5A5F' }}>Privacy Policy</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Sign Up Button */}
                            <Button
                                label="Create Account"
                                onPress={handleSignUp}
                                variant="primary"
                                fullWidth
                                loading={loading}
                                disabled={!rememberMe}
                            />

                            {/* Divider */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 32
                            }}>
                                <View style={{ flex: 1, height: 1, backgroundColor: '#1a1a2e' }} />
                                <Text style={{
                                    color: '#6B7280',
                                    marginHorizontal: 16,
                                    fontFamily: 'Figtree'
                                }}>
                                    or continue with
                                </Text>
                                <View style={{ flex: 1, height: 1, backgroundColor: '#1a1a2e' }} />
                            </View>

                            {/* Social Login Buttons */}
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                marginBottom: 32
                            }}>
                                <TouchableOpacity
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 16,
                                        backgroundColor: '#1a1a2e',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginHorizontal: 8
                                    }}
                                    onPress={handleFacebookSignup}
                                >
                                    <Image
                                        source={{uri: FACEBOOK_ICON}}
                                        style={{width: 24, height: 24}}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 16,
                                        backgroundColor: '#1a1a2e',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginHorizontal: 8
                                    }}
                                    onPress={handleGoogleSignup}
                                >
                                    <Image
                                        source={{uri: GOOGLE_ICON}}
                                        style={{width: 24, height: 24}}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 16,
                                        backgroundColor: '#1a1a2e',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginHorizontal: 8
                                    }}
                                    onPress={handleAppleSignup}
                                >
                                    <Image
                                        source={{uri: APPLE_ICON}}
                                        style={{width: 24, height: 24}}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Sign In Link */}
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'center'
                            }}>
                                <Text style={{ color: '#9CA3AF', fontFamily: 'Figtree' }}>
                                    Already have an account?
                                </Text>
                                <TouchableOpacity onPress={handleSignIn}>
                                    <Text style={{
                                        color: '#FF5A5F',
                                        fontWeight: '500',
                                        fontFamily: 'Figtree'
                                    }}>
                                        Sign in
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}