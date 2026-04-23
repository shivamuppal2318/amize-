import React, { useEffect } from 'react';
import {View, Text, SafeAreaView, TouchableOpacity, Image, ScrollView, Alert, Platform, StyleSheet} from 'react-native';
import {router} from 'expo-router';
import {Button} from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  isGoogleConfiguredForCurrentPlatform,
  isFacebookConfigured,
  isAnyGoogleProviderConfigured,
  isGoogleWebSignInUsable,
  isSecureWebAuthOrigin,
} from '@/lib/auth/providerConfig';
import { isClerkConfigured } from '@/lib/auth/clerkConfig';

// @ts-ignore
import DefaultImage from '@/assets/images/figma/Mobile inbox-bro 1.png';
// @ts-ignore
import FacebookIcon from '@/assets/images/figma/facebook.png';
// @ts-ignore
import GoogleIcon from '@/assets/images/figma/google.png';
// @ts-ignore
import AppleIcon from '@/assets/images/figma/apple.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '@/hooks/useI18n';
import { isDemoMode } from '@/lib/release/releaseConfig';

const DEFAULT_IMAGE = DefaultImage;
const FACEBOOK_ICON = FacebookIcon;
const GOOGLE_ICON = GoogleIcon;
const APPLE_ICON = AppleIcon;

const showProviderNotConfigured = (provider: 'Google' | 'Facebook') => {
  Alert.alert(
    `${provider} Login`,
    `${provider} login is not configured for this build yet.`
  );
};

export default function GetStartedScreen() {
    const { t } = useI18n();
    const { isAuthenticated, isInSignupFlow, completeSignupFlow } = useAuth();
    const demoMode = isDemoMode();
    const showFacebookLogin = isFacebookConfigured;
    const hasCurrentPlatformGoogleConfig = isGoogleConfiguredForCurrentPlatform();
    const googleWebSignInUsable = isGoogleWebSignInUsable();
    const showGoogleLogin =
      hasCurrentPlatformGoogleConfig ||
      (Platform.OS === 'web' && isAnyGoogleProviderConfigured);
    const showAppleLogin = Platform.OS === 'ios';
    const showClerkLogin = isClerkConfigured();
    const showSocialLogin =
      showClerkLogin || showFacebookLogin || showGoogleLogin || showAppleLogin;
    const webGoogleStatusMessage =
        Platform.OS === 'web' && !isSecureWebAuthOrigin()
        ? 'Google sign-in on phone browser preview requires https or localhost. Use the Android app build for device testing.'
        : hasCurrentPlatformGoogleConfig
            ? 'Google sign-in is ready on this platform.'
            : 'Google sign-in is not configured for this platform in this build.';

    useEffect(() => {
        if (!isAuthenticated && isInSignupFlow) {
            completeSignupFlow().catch((error) => {
                console.error('[GetStarted] Failed to clear stale signup flow:', error);
            });
        }
    }, [completeSignupFlow, isAuthenticated, isInSignupFlow]);

    const handleContinueWithEmail = () => {
        router.push('/(auth)/sign-up');
        // router.push('/account-setup/verify');
    };

    const handleSignIn = () => {
        router.push('/(auth)/sign-in');
    };

    const handleFacebookLogin = () => {
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

    const handleGoogleLogin = () => {
        if (Platform.OS === 'web' && !googleWebSignInUsable) {
            Alert.alert(
                'Google Login',
                'Google sign-in on phone browser preview requires localhost or https. Use the Android build for device testing.'
            );
            return;
        }

        if (!hasCurrentPlatformGoogleConfig) {
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

    const handleAppleLogin = () => {
        router.push({
            pathname: '/(auth)/sign-in',
            params: {
                autoProvider: 'apple',
            },
        });
    };

    return (
        <SafeAreaView style={{ flex: 1,  }}>
            <LinearGradient
                            colors={['#1E4A72', '#000000']}  
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={{ flex: 1 }}
                        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ flex: 1, paddingHorizontal: 24 }}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                        <View style={{ alignItems: 'center', marginBottom: 48 }}>
                            <View style={{
                                width: 240,
                                height: 240,
                                borderRadius: 120,
                                backgroundColor: 'rgba(255, 90, 95, 0.1)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 32
                            }}>
                                <Image
                                    source={DEFAULT_IMAGE}
                                    style={{width: 200, height: 200}}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Title */}
                            <Text style={{
                                fontFamily: 'Figtree',
                                color: 'white',
                                fontSize: 32,
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }}>
                                {t('auth.getStarted.title')}
                            </Text>
                            {demoMode ? (
                                <View style={{
                                    marginTop: 12,
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: 'rgba(249, 115, 22, 0.35)',
                                    backgroundColor: 'rgba(17, 24, 39, 0.75)'
                                }}>
                                    <Text style={{
                                        color: '#FDBA74',
                                        fontSize: 12,
                                        fontWeight: '700',
                                        fontFamily: 'Figtree',
                                        textTransform: 'uppercase',
                                        textAlign: 'center'
                                    }}>
                                        Demo build
                                    </Text>
                                    <Text style={{
                                        color: '#FDE68A',
                                        fontSize: 12,
                                        marginTop: 4,
                                        fontFamily: 'Figtree',
                                        textAlign: 'center'
                                    }}>
                                        Demo data is enabled in parts of the app, but configured sign-in
                                        providers are still available in this build.
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {showSocialLogin && (
                            <>
                                <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
                                    {showClerkLogin && (
                                        <TouchableOpacity
                                            onPress={() => router.push('/(auth)/clerk')}
                                            style={styles.googleButton}
                                        >
                                            <Image
                                                source={GOOGLE_ICON}
                                                style={styles.googleIcon}
                                            />
                                            <View style={styles.googleCopy}>
                                                <Text style={styles.googleTitle}>Continue with Google</Text>
                                                <Text style={styles.googleSubtitle}>
                                                    Sign in with Google through Clerk
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}

                                    {showFacebookLogin && (
                                        <TouchableOpacity
                                            onPress={handleFacebookLogin}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#1a1a2e',
                                                borderRadius: 16,
                                                paddingVertical: 16,
                                                paddingHorizontal: 24,
                                                marginBottom: 16,
                                                borderWidth: 1,
                                                borderColor: '#4B5563'
                                            }}
                                        >
                                            <Image
                                                source={FACEBOOK_ICON}
                                                style={{width: 24, height: 24, marginRight: 12}}
                                            />
                                            <Text style={{
                                                color: 'white',
                                                fontSize: 16,
                                                fontWeight: '500',
                                                fontFamily: 'Figtree'
                                            }}>
                                                {t('auth.getStarted.continueFacebook')}
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {showGoogleLogin && !showClerkLogin && (
                                        <TouchableOpacity
                                            onPress={handleGoogleLogin}
                                            style={[
                                                styles.googleButton,
                                                Platform.OS === 'web' && !googleWebSignInUsable && styles.googleButtonDisabled
                                            ]}
                                            disabled={Platform.OS === 'web' && !googleWebSignInUsable}
                                        >
                                            <Image
                                                source={GOOGLE_ICON}
                                                style={styles.googleIcon}
                                            />
                                            <View style={styles.googleCopy}>
                                                <Text style={styles.googleTitle}>
                                                    {t('auth.getStarted.continueGoogle')}
                                                </Text>
                                                <Text style={styles.googleSubtitle}>
                                                    One tap sign-in with your Google account
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}

                                    {showGoogleLogin && !showClerkLogin && Platform.OS === 'web' && (
                                        <View style={styles.statusCard}>
                                            <Text style={styles.statusTitle}>Google web status</Text>
                                            <Text style={styles.statusText}>{webGoogleStatusMessage}</Text>
                                        </View>
                                    )}

                                    {showAppleLogin && (
                                        <TouchableOpacity
                                            onPress={handleAppleLogin}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#1a1a2e',
                                                borderRadius: 16,
                                                paddingVertical: 16,
                                                paddingHorizontal: 24,
                                                marginBottom: 16,
                                                borderWidth: 1,
                                                borderColor: '#4B5563'
                                            }}
                                        >
                                            <Image
                                                source={APPLE_ICON}
                                                style={{width: 24, height: 24, marginRight: 12}}
                                            />
                                            <Text style={{
                                                color: 'white',
                                                fontSize: 16,
                                                fontWeight: '500',
                                                fontFamily: 'Figtree'
                                            }}>
                                                {t('auth.getStarted.continueApple')}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: 32,
                                    width: '100%',
                                    maxWidth: 400
                                }}>
                                    <View style={{ flex: 1, height: 1, backgroundColor: '#1a1a2e' }} />
                                    <Text style={{
                                        color: '#6B7280',
                                        marginHorizontal: 16,
                                        fontFamily: 'Figtree',
                                        fontSize: 16
                                    }}>
                                        or
                                    </Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: '#1a1a2e' }} />
                                </View>
                            </>
                        )}

                        <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
                            <Button
                                label={t('auth.getStarted.signInPassword')}
                                onPress={handleSignIn}
                                variant="primary"
                                fullWidth
                            />
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                color: '#9CA3AF',
                                fontFamily: 'Figtree',
                                fontSize: 16
                            }}>
                                {t('auth.signIn.noAccount')}
                            </Text>
                            <TouchableOpacity 
                                onPress={handleContinueWithEmail}
                                accessibilityLabel="Sign up"
                                accessibilityRole="button"
                            >
                                <Text style={{
                                    color: '#FF5A5F',
                                    fontWeight: '500',
                                    fontFamily: 'Figtree',
                                    fontSize: 16,
                                    marginLeft: 4
                                }}>
                                    {t('auth.getStarted.signUp')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141B30',
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    googleButtonDisabled: {
        opacity: 0.6,
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 14,
    },
    googleCopy: {
        flex: 1,
    },
    googleTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    googleSubtitle: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 2,
        fontFamily: 'Figtree',
    },
    statusCard: {
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(96, 165, 250, 0.25)',
    },
    statusTitle: {
        color: '#BFDBFE',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'Figtree',
        textTransform: 'uppercase',
    },
    statusText: {
        color: '#E2E8F0',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
        fontFamily: 'Figtree',
    },
});
