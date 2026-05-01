import React, { useEffect, useMemo, useState } from 'react';
import {
  isAnyGoogleProviderConfigured,
  isFacebookConfigured,
} from '@/lib/auth/providerConfig';
import { isClerkConfigured } from '@/lib/auth/clerkConfig';
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
import { useI18n } from '@/hooks/useI18n';
import { appLinks } from '@/lib/config/appLinks';
import { canBypassVerification } from '@/lib/release/releaseConfig';
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
  Alert.alert(`${provider} Signup`, `${provider} signup is not configured for this build yet.`);
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
    const { t } = useI18n();
    const showClerkSignup = isClerkConfigured();
    const showFacebookSignup = !showClerkSignup && isFacebookConfigured;
    const showGoogleSignup = !showClerkSignup && isAnyGoogleProviderConfigured;
    const showAppleSignup = !showClerkSignup && Platform.OS === 'ios';
    const showSocialSignup = showFacebookSignup || showGoogleSignup || showAppleSignup;

    const {
        loading,
        isAuthenticated,
        isInSignupFlow,
        completeSignupFlow,
        startSignupFlow,
    } = useAuth();
    const {
        registrationData,
        updateRegistrationData,
        validateField,
        registrationErrors,
        setCurrentStep,
        clearRegistrationData,
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
            { key: 'length', text: t('auth.signUp.requirement.length'), check: passwordChecks.length },
            { key: 'uppercase', text: t('auth.signUp.requirement.uppercase'), check: passwordChecks.uppercase },
            { key: 'lowercase', text: t('auth.signUp.requirement.lowercase'), check: passwordChecks.lowercase },
            { key: 'number', text: t('auth.signUp.requirement.number'), check: passwordChecks.number },
            { key: 'special', text: t('auth.signUp.requirement.special'), check: passwordChecks.special },
        ],
        [passwordChecks, t]
    );

    useEffect(() => {
        // If a signed-in user somehow lands back on sign-up with a stale signup-flow flag,
        // clear it. Do not clear the flag for unauthenticated users because that is the
        // expected state during the multi-step registration flow.
        if (isAuthenticated && isInSignupFlow) {
            completeSignupFlow().catch((error) => {
                console.error('[SignUp] Failed to clear stale signup flow:', error);
            });
        }
    }, [completeSignupFlow, isAuthenticated, isInSignupFlow]);

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
            setTermsError(t('auth.signUp.termsError'));
        } else if (termsError) {
            setTermsError('');
        }

        if (!formValid || !acceptedTerms) {
            return;
        }

        try {
            setProcessingSignup(true);
            const username = (registrationData.username || '').trim();
            const email = (registrationData.email || '').trim();
            const password = registrationData.password || '';
            const confirmPassword = registrationData.confirmPassword || '';
            updateRegistrationData({
                username,
                email,
                password,
                confirmPassword,
            });
            await startSignupFlow();
            setCurrentStep(2);
            router.push('/account-setup/birthday');
        } catch (error) {
            Alert.alert(t('auth.signUp.errorTitle'), t('auth.signUp.genericError'));
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
        const unavailableMessage = t('auth.signUp.documentOpenUnavailable').replace('{{document}}', documentName);
        const failedMessage = t('auth.signUp.documentOpenFailed').replace('{{document}}', documentName);

        try {
            const supported = await Linking.canOpenURL(targetUrl);

            if (!supported) {
                Alert.alert(documentName, unavailableMessage);
                return;
            }

            await Linking.openURL(targetUrl);
        } catch (error) {
            Alert.alert(documentName, failedMessage);
        }
    };

    const handleSignIn = () => {
        router.push('/sign-in');
    };

    const handleFacebookSignup = () => {
        if (!isFacebookConfigured) {
            Alert.alert(
                t('auth.signUp.providerTitle'),
                t('auth.signUp.providerNotConfigured').replace('{{provider}}', 'Facebook')
            );
            return;
        }

        router.push({
            pathname: '/sign-in',
            params: {
                autoProvider: 'facebook',
            },
        });
    };

    const handleGoogleSignup = () => {
        if (!isAnyGoogleProviderConfigured) {
            Alert.alert(
                t('auth.signUp.providerTitle'),
                t('auth.signUp.providerNotConfigured').replace('{{provider}}', 'Google')
            );
            return;
        }

        router.push({
            pathname: '/sign-in',
            params: {
                autoProvider: 'google',
            },
        });
    };

    const handleAppleSignup = () => {
        router.push({
            pathname: '/sign-in',
            params: {
                autoProvider: 'apple',
            },
        });
    };

    const handleClerkSignup = () => {
        router.push('/clerk');
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
                    {t('auth.signUp.preparingTitle')}
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
                    {t('auth.signUp.preparingText')}
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
                                    {t('auth.signUp.title')}
                                </Text>
                                <Text
                                    style={{
                                        color: '#9CA3AF',
                                        fontSize: 15,
                                        lineHeight: 22,
                                        textAlign: 'center',
                                        fontFamily: 'Figtree',
                                        maxWidth: 320,
                                    }}
                                >
                                    {t('auth.signUp.subtitle')}
                                </Text>
                            </View>

                            <View style={{ width: '100%', maxWidth: 400 }}>
                                <Input
                                    label={t('auth.signUp.usernameLabel')}
                                    placeholder={t('auth.signUp.usernamePlaceholder')}
                                    value={registrationData.username || ''}
                                    onChangeText={handleUsernameChange}
                                    autoCapitalize="none"
                                    icon={<User size={20} color="#9CA3AF" />}
                                    error={registrationErrors.username}
                                    onBlur={() => validateField('username')}
                                />

                                <Input
                                    label={t('auth.signUp.emailLabel')}
                                    placeholder={t('auth.signUp.emailPlaceholder')}
                                    value={registrationData.email || ''}
                                    onChangeText={handleEmailChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    icon={<Mail size={20} color="#9CA3AF" />}
                                    error={registrationErrors.email}
                                    onBlur={() => validateField('email')}
                                />

                                <Input
                                    label={t('auth.signUp.passwordLabel')}
                                    placeholder={t('auth.signUp.passwordPlaceholder')}
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
                                            {t('auth.signUp.passwordRequirements')}
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
                                    label={t('auth.signUp.confirmPasswordLabel')}
                                    placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
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
                                            {t('auth.signUp.termsAgreementPrefix')}
                                            <Text
                                                style={{ color: '#FF5A5F' }}
                                                onPress={() => handleTermsInfo('Terms of Service')}
                                            >
                                                {t('auth.signUp.termsLink')}
                                            </Text>
                                            {t('auth.signUp.termsAgreementMiddle')}
                                            <Text
                                                style={{ color: '#FF5A5F' }}
                                                onPress={() => handleTermsInfo('Privacy Policy')}
                                            >
                                                {t('auth.signUp.privacyLink')}
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
                                    label={t('auth.signUp.continue')}
                                    onPress={handleSignUp}
                                    variant="primary"
                                    fullWidth
                                    loading={loading}
                                    disabled={loading || processingSignup}
                                />

                                {(showClerkSignup || showSocialSignup) && (
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
                                                {t('auth.signUp.orContinueWith')}
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
                                            {showClerkSignup && (
                                                <TouchableOpacity
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        backgroundColor: '#141B30',
                                                        borderRadius: 18,
                                                        paddingVertical: 16,
                                                        paddingHorizontal: 18,
                                                        borderWidth: 1,
                                                        borderColor: 'rgba(255,255,255,0.12)',
                                                        width: '100%',
                                                    }}
                                                    onPress={handleClerkSignup}
                                                >
                                                    <Image
                                                        source={GOOGLE_ICON}
                                                        style={{ width: 24, height: 24, marginRight: 14 }}
                                                    />
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            style={{
                                                                color: 'white',
                                                                fontSize: 16,
                                                                fontWeight: '700',
                                                                fontFamily: 'Figtree',
                                                            }}
                                                        >
                                                            {t('auth.signUp.continueGoogle')}
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                color: '#94A3B8',
                                                                fontSize: 12,
                                                                marginTop: 2,
                                                                fontFamily: 'Figtree',
                                                            }}
                                                        >
                                                            {t('auth.signUp.clerkProviders')}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )}

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
                                        {t('auth.signUp.haveAccount')}
                                    </Text>
                                    <TouchableOpacity 
                                    onPress={handleSignIn}
                                    accessibilityLabel="Sign in"
                                    accessibilityRole="button"
                                >
                                        <Text
                                            style={{
                                                color: '#FF5A5F',
                                                fontWeight: '500',
                                                fontFamily: 'Figtree',
                                            }}
                                        >
                                            {' '}{t('auth.signUp.signIn')}
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
