import React, { useMemo, useState } from 'react';
import {
  isAnyGoogleProviderConfigured,
  isFacebookConfigured,
} from '@/lib/auth/providerConfig';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    ScrollView,
    Platform,
    Linking,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Mail, Lock, User, CheckCircle, XCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useRegistration } from '@/context/RegistrationContext';
import { appLinks } from '@/lib/config/appLinks';
import { LinearGradient } from 'expo-linear-gradient';

// @ts-ignore
import FacebookIcon from '@/assets/images/figma/facebook.png';
// @ts-ignore
import GoogleIcon from '@/assets/images/figma/google.png';
// @ts-ignore
import AppleIcon from '@/assets/images/figma/apple.png';
// @ts-ignore
import AmizeLogo from '@/assets/images/amize.png';

const FACEBOOK_ICON = FacebookIcon;
const GOOGLE_ICON = GoogleIcon;
const APPLE_ICON = AppleIcon;
const AMIZE_LOGO = AmizeLogo;

const showProviderNotConfigured = (provider: 'Google' | 'Facebook') => {
  Alert.alert(
    `${provider} Signup`,
    `${provider} signup is not configured for this build yet.`
  );
};

type PasswordChecks = {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
};

const getPasswordChecks = (value: string): PasswordChecks => ({
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
});

export default function SignUpScreen() {
    const showFacebookSignup = isFacebookConfigured;
    const showGoogleSignup = isAnyGoogleProviderConfigured;
    const showAppleSignup = Platform.OS === 'ios';
    const showSocialSignup = showFacebookSignup || showGoogleSignup || showAppleSignup;

    const { loading, startSignupFlow } = useAuth();
    const {
        registrationData,
        updateRegistrationData,
        validateField,
        registrationErrors,
    } = useRegistration();

    const [processingSignup, setProcessingSignup] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState('');
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

    const [passwordChecks, setPasswordChecks] = useState<PasswordChecks>(
        getPasswordChecks(registrationData.password || '')
    );

    const passwordRequirements = useMemo(
        () => [
            { key: 'length', text: 'At least 8 characters', check: passwordChecks.length },
            { key: 'uppercase', text: 'At least one uppercase letter', check: passwordChecks.uppercase },
            { key: 'lowercase', text: 'At least one lowercase letter', check: passwordChecks.lowercase },
            { key: 'number', text: 'At least one number', check: passwordChecks.number },
            { key: 'special', text: 'At least one special character', check: passwordChecks.special },
        ],
        [passwordChecks]
    );

    const handleUsernameChange = (text: string) => {
        updateRegistrationData({ username: text.trimStart() });
    };

    const handleEmailChange = (text: string) => {
        updateRegistrationData({ email: text.trim() });
    };

    const handlePasswordChange = (text: string) => {
        updateRegistrationData({ password: text });
        setPasswordChecks(getPasswordChecks(text));
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
        const formValid = validateForm();

        if (!acceptedTerms) {
            setTermsError('Agree to the Terms of Service and Privacy Policy to continue.');
        } else if (termsError) {
            setTermsError('');
        }

        if (!formValid || !acceptedTerms) {
            return;
        }

        try {
            setProcessingSignup(true);
            await startSignupFlow();
            router.replace('/account-setup/birthday');
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setProcessingSignup(false);
        }
    };

    const handleTermsToggle = () => {
        setAcceptedTerms((prev) => {
            const next = !prev;
            if (next) {
                setTermsError('');
            }
            return next;
        });
    };

    const handleTermsInfo = async (documentName: 'Terms of Service' | 'Privacy Policy') => {
        const targetUrl =
            documentName === 'Terms of Service'
                ? appLinks.termsOfServiceUrl
                : appLinks.privacyPolicyUrl;

        try {
            const supported = await Linking.canOpenURL(targetUrl);

            if (!supported) {
                Alert.alert(
                    documentName,
                    `Unable to open ${documentName} on this device right now.`
                );
                return;
            }

            await Linking.openURL(targetUrl);
        } catch (error) {
            Alert.alert(
                documentName,
                `Unable to open ${documentName} right now.`
            );
        }
    };

    const handleSignIn = () => {
        router.push('/(auth)/sign-in');
    };

    const handleFacebookSignup = () => {
        if (!isFacebookConfigured) {
            showProviderNotConfigured('Facebook');
            return;
        }

        router.push({
            pathname: '/(auth)/sign-in',
            params: {
                autoProvider: 'facebook',
            },
        });
    };

    const handleGoogleSignup = () => {
        if (!isAnyGoogleProviderConfigured) {
            showProviderNotConfigured('Google');
            return;
        }

        router.push({
            pathname: '/(auth)/sign-in',
            params: {
                autoProvider: 'google',
            },
        });
    };

    const handleAppleSignup = () => {
        router.push({
            pathname: '/(auth)/sign-in',
            params: {
                autoProvider: 'apple',
            },
        });
    };

    if (processingSignup) {
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: '#1a1a2e',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <ActivityIndicator size="large" color="#FF5A5F" />
                <Text
                    style={{
                        color: 'white',
                        marginTop: 16,
                        fontSize: 18,
                        fontFamily: 'Figtree',
                    }}
                >
                    Preparing your profile setup...
                </Text>
                <Text
                    style={{
                        color: '#9CA3AF',
                        marginTop: 8,
                        textAlign: 'center',
                        paddingHorizontal: 32,
                        fontFamily: 'Figtree',
                    }}
                >
                    Please wait while we prepare your account setup process.
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={['#1E4A72', '#000000']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1 }}
            >
                <TouchableOpacity
                    style={{ padding: 8, marginLeft: 8, alignSelf: 'flex-start' }}
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ flex: 1, paddingHorizontal: 24 }}>
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingVertical: 40,
                            }}
                        >
                            <View
                                style={{
                                    alignItems: 'center',
                                    marginBottom: 48,
                                    width: '100%',
                                }}
                            >
                                <View
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        padding: 3,
                                        backgroundColor: '#FF5A5F',
                                        marginBottom: 24,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 74,
                                            height: 74,
                                            borderRadius: 37,
                                            backgroundColor: '#1a1a2e',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Image
                                            source={AMIZE_LOGO}
                                            style={{ width: 80, height: 80, borderRadius: 40 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                </View>

                                <Text
                                    style={{
                                        fontFamily: 'Figtree',
                                        color: 'white',
                                        fontSize: 28,
                                        fontWeight: 'bold',
                                        marginBottom: 8,
                                        textAlign: 'center',
                                    }}
                                >
                                    Create your Account
                                </Text>
                            </View>

                            <View style={{ width: '100%', maxWidth: 400 }}>
                                <Input
                                    label="Username"
                                    placeholder="Enter your username"
                                    value={registrationData.username || ''}
                                    onChangeText={handleUsernameChange}
                                    autoCapitalize="none"
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
                                    autoCapitalize="none"
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

                                {showPasswordRequirements && (
                                    <View
                                        style={{
                                            marginBottom: 20,
                                            padding: 16,
                                            backgroundColor: '#2A2A3A',
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: '#374151',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: 'white',
                                                marginBottom: 12,
                                                fontFamily: 'Figtree',
                                                fontWeight: '500',
                                            }}
                                        >
                                            Password requirements:
                                        </Text>

                                        <View style={{ marginLeft: 8 }}>
                                            {passwordRequirements.map((requirement) => (
                                                <View
                                                    key={requirement.key}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginBottom: 6,
                                                    }}
                                                >
                                                    {requirement.check ? (
                                                        <CheckCircle
                                                            size={16}
                                                            color="#00C853"
                                                            style={{ marginRight: 8 }}
                                                        />
                                                    ) : (
                                                        <XCircle
                                                            size={16}
                                                            color="#FF5A5F"
                                                            style={{ marginRight: 8 }}
                                                        />
                                                    )}
                                                    <Text
                                                        style={{
                                                            color: requirement.check
                                                                ? '#00C853'
                                                                : '#9CA3AF',
                                                            fontFamily: 'Figtree',
                                                            fontSize: 14,
                                                        }}
                                                    >
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

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'flex-start',
                                        marginBottom: 16,
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={handleTermsToggle}
                                        style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                                    >
                                        <View
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 4,
                                                borderWidth: 1,
                                                borderColor: acceptedTerms ? '#FF5A5F' : '#6B7280',
                                                backgroundColor: acceptedTerms
                                                    ? '#FF5A5F'
                                                    : 'transparent',
                                                marginRight: 12,
                                                marginTop: 2,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {acceptedTerms && (
                                                <View
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: 2,
                                                        backgroundColor: 'white',
                                                    }}
                                                />
                                            )}
                                        </View>
                                        <Text
                                            style={{
                                                color: '#9CA3AF',
                                                fontFamily: 'Figtree',
                                                flex: 1,
                                                lineHeight: 20,
                                            }}
                                        >
                                            I agree to the{' '}
                                            <Text
                                                style={{ color: '#FF5A5F' }}
                                                onPress={() => handleTermsInfo('Terms of Service')}
                                            >
                                                Terms of Service
                                            </Text>
                                            {' '}and{' '}
                                            <Text
                                                style={{ color: '#FF5A5F' }}
                                                onPress={() => handleTermsInfo('Privacy Policy')}
                                            >
                                                Privacy Policy
                                            </Text>
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {!!termsError && (
                                    <Text
                                        style={{
                                            color: '#FCA5A5',
                                            fontFamily: 'Figtree',
                                            fontSize: 13,
                                            marginBottom: 16,
                                        }}
                                    >
                                        {termsError}
                                    </Text>
                                )}

                                <Button
                                    label="Create Account"
                                    onPress={handleSignUp}
                                    variant="primary"
                                    fullWidth
                                    loading={loading}
                                    disabled={loading || processingSignup}
                                />

                                {showSocialSignup && (
                                    <>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginBottom: 32,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flex: 1,
                                                    height: 1,
                                                    backgroundColor: '#1a1a2e',
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    color: '#6B7280',
                                                    marginHorizontal: 16,
                                                    fontFamily: 'Figtree',
                                                }}
                                            >
                                                or continue with
                                            </Text>
                                            <View
                                                style={{
                                                    flex: 1,
                                                    height: 1,
                                                    backgroundColor: '#1a1a2e',
                                                }}
                                            />
                                        </View>

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                marginBottom: 32,
                                            }}
                                        >
                                            {showFacebookSignup && (
                                                <TouchableOpacity
                                                    style={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: 16,
                                                        backgroundColor: '#1a1a2e',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginHorizontal: 8,
                                                    }}
                                                    onPress={handleFacebookSignup}
                                                >
                                                    <Image
                                                        source={FACEBOOK_ICON}
                                                        style={{ width: 24, height: 24 }}
                                                    />
                                                </TouchableOpacity>
                                            )}

                                            {showGoogleSignup && (
                                                <TouchableOpacity
                                                    style={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: 16,
                                                        backgroundColor: '#1a1a2e',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginHorizontal: 8,
                                                    }}
                                                    onPress={handleGoogleSignup}
                                                >
                                                    <Image
                                                        source={GOOGLE_ICON}
                                                        style={{ width: 24, height: 24 }}
                                                    />
                                                </TouchableOpacity>
                                            )}

                                            {showAppleSignup && (
                                                <TouchableOpacity
                                                    style={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: 16,
                                                        backgroundColor: '#1a1a2e',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginHorizontal: 8,
                                                    }}
                                                    onPress={handleAppleSignup}
                                                >
                                                    <Image
                                                        source={APPLE_ICON}
                                                        style={{ width: 24, height: 24 }}
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </>
                                )}

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#9CA3AF',
                                            fontFamily: 'Figtree',
                                        }}
                                    >
                                        Already have an account?
                                    </Text>
                                    <TouchableOpacity onPress={handleSignIn}>
                                        <Text
                                            style={{
                                                color: '#FF5A5F',
                                                fontWeight: '500',
                                                fontFamily: 'Figtree',
                                            }}
                                        >
                                            {' '}Sign in
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}
