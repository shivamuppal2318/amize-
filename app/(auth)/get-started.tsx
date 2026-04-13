import React from 'react';
import {View, Text, SafeAreaView, TouchableOpacity, Image, ScrollView, Alert, Platform} from 'react-native';
import {router} from 'expo-router';
import {Button} from '@/components/ui/Button';
import {
  isAnyGoogleProviderConfigured,
  isFacebookConfigured,
} from '@/lib/auth/providerConfig';
import {
  canUseLocalDemoAuth,
  LOCAL_DEMO_ACCOUNTS,
} from '@/lib/auth/localDemoAuth';

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
    const demoMode = isDemoMode();
    const showFacebookLogin = isFacebookConfigured;
    const showGoogleLogin = isAnyGoogleProviderConfigured;
    const showAppleLogin = Platform.OS === 'ios';
    const showSocialLogin =
      !demoMode && (showFacebookLogin || showGoogleLogin || showAppleLogin);
    const localDemoEnabled = canUseLocalDemoAuth();

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

    const handleAppleLogin = () => {
        router.push({
            pathname: '/(auth)/sign-in',
            params: {
                autoProvider: 'apple',
            },
        });
    };

    const handleDemoLogin = (identifier: string, password: string) => {
        router.push({
            pathname: '/(auth)/sign-in',
            params: {
                prefillEmail: identifier,
                prefillPassword: password,
                autoSubmit: 'true',
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
                                        Social login is disabled. Use the demo accounts below.
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {showSocialLogin && (
                            <>
                                <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
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

                                    {showGoogleLogin && (
                                        <TouchableOpacity
                                            onPress={handleGoogleLogin}
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
                                                source={GOOGLE_ICON}
                                                style={{width: 24, height: 24, marginRight: 12}}
                                            />
                                            <Text style={{
                                                color: 'white',
                                                fontSize: 16,
                                                fontWeight: '500',
                                                fontFamily: 'Figtree'
                                            }}>
                                                {t('auth.getStarted.continueGoogle')}
                                            </Text>
                                        </TouchableOpacity>
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

                        {localDemoEnabled && (
                            <View
                                style={{
                                    width: '100%',
                                    maxWidth: 400,
                                    marginBottom: 32,
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.08)',
                                    padding: 16,
                                }}
                            >
                                <Text
                                    style={{
                                        color: 'white',
                                        fontSize: 16,
                                        fontWeight: '700',
                                        fontFamily: 'Figtree',
                                        marginBottom: 8,
                                    }}
                                >
                                    Local Demo Login
                                </Text>
                                <Text
                                    style={{
                                        color: '#CBD5E1',
                                        fontSize: 13,
                                        lineHeight: 18,
                                        fontFamily: 'Figtree',
                                        marginBottom: 12,
                                    }}
                                >
                                    Use these demo accounts without backend access.
                                </Text>
                                {LOCAL_DEMO_ACCOUNTS.map((account) => (
                                    <View
                                        key={account.label}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderTopWidth: 1,
                                            borderTopColor: 'rgba(255,255,255,0.06)',
                                            paddingTop: 12,
                                            marginTop: 12,
                                        }}
                                    >
                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                            <Text
                                                style={{
                                                    color: 'white',
                                                    fontSize: 14,
                                                    fontWeight: '600',
                                                    fontFamily: 'Figtree',
                                                }}
                                            >
                                                {account.label}
                                            </Text>
                                            <Text
                                                style={{
                                                    color: '#9CA3AF',
                                                    fontSize: 12,
                                                    fontFamily: 'Figtree',
                                                }}
                                            >
                                                {account.identifier}
                                            </Text>
                                            <Text
                                                style={{
                                                    color: '#9CA3AF',
                                                    fontSize: 12,
                                                    fontFamily: 'Figtree',
                                                }}
                                            >
                                                {account.password}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() =>
                                                handleDemoLogin(account.identifier, account.password)
                                            }
                                            style={{
                                                borderRadius: 12,
                                                paddingHorizontal: 14,
                                                paddingVertical: 10,
                                                backgroundColor: '#1E4A72',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: 'white',
                                                    fontSize: 13,
                                                    fontWeight: '700',
                                                    fontFamily: 'Figtree',
                                                }}
                                            >
                                                Use
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

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
                            <TouchableOpacity onPress={handleContinueWithEmail}>
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
