import React from 'react';
import {View, Text, SafeAreaView, TouchableOpacity, Image, ScrollView} from 'react-native';
import {router} from 'expo-router';
import {ChevronLeft} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';

// @ts-ignore
import DefaultImage from '@/assets/images/figma/Mobile inbox-bro 1.png';
// @ts-ignore
import FacebookIcon from '@/assets/images/figma/facebook.png';
// @ts-ignore
import GoogleIcon from '@/assets/images/figma/google.png';
// @ts-ignore
import AppleIcon from '@/assets/images/figma/apple.png';

const DEFAULT_IMAGE = Image.resolveAssetSource(DefaultImage).uri;
const FACEBOOK_ICON = Image.resolveAssetSource(FacebookIcon).uri;
const GOOGLE_ICON = Image.resolveAssetSource(GoogleIcon).uri;
const APPLE_ICON = Image.resolveAssetSource(AppleIcon).uri;

export default function GetStartedScreen() {
    const handleContinueWithEmail = () => {
        router.push('/(auth)/sign-up');
    };

    const handleSignIn = () => {
        router.push('/(auth)/sign-in');
    };

    const handleFacebookLogin = () => {
        // Handle Facebook login
        console.log('Facebook login');
    };

    const handleGoogleLogin = () => {
        // Handle Google login
        console.log('Google login');
    };

    const handleAppleLogin = () => {
        // Handle Apple login
        console.log('Apple login');
    };

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

                        {/* Illustration Section */}
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
                                    source={{uri: DEFAULT_IMAGE}}
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
                                Let's you in
                            </Text>
                        </View>

                        {/* Social Login Section */}
                        <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
                            {/* Facebook Button */}
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
                                    source={{uri: FACEBOOK_ICON}}
                                    style={{width: 24, height: 24, marginRight: 12}}
                                />
                                <Text style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: '500',
                                    fontFamily: 'Figtree'
                                }}>
                                    Continue with Facebook
                                </Text>
                            </TouchableOpacity>

                            {/* Google Button */}
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
                                    source={{uri: GOOGLE_ICON}}
                                    style={{width: 24, height: 24, marginRight: 12}}
                                />
                                <Text style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: '500',
                                    fontFamily: 'Figtree'
                                }}>
                                    Continue with Google
                                </Text>
                            </TouchableOpacity>

                            {/* Apple Button */}
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
                                    source={{uri: APPLE_ICON}}
                                    style={{width: 24, height: 24, marginRight: 12}}
                                />
                                <Text style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: '500',
                                    fontFamily: 'Figtree'
                                }}>
                                    Continue with Apple
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Divider */}
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

                        {/* Sign in with Email Button */}
                        <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
                            <Button
                                label="Sign in with password"
                                onPress={handleSignIn}
                                variant="primary"
                                fullWidth
                            />
                        </View>

                        {/* Sign Up Link */}
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
                                Don't have an account?
                            </Text>
                            <TouchableOpacity onPress={handleContinueWithEmail}>
                                <Text style={{
                                    color: '#FF5A5F',
                                    fontWeight: '500',
                                    fontFamily: 'Figtree',
                                    fontSize: 16,
                                    marginLeft: 4
                                }}>
                                    Sign up
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}