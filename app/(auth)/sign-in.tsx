import React, { useState, useEffect } from 'react';
import {View, Text,  TouchableOpacity, Image, Alert, ScrollView, StatusBar} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Mail, Lock } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';
import { useAuth } from '@/hooks/useAuth';

// @ts-ignore
import FacebookIcon from '@/assets/images/figma/facebook.png';
// @ts-ignore
import GoogleIcon from '@/assets/images/figma/google.png';
// @ts-ignore
import AppleIcon from '@/assets/images/figma/apple.png';
// @ts-ignore
import AmizeLogo from '@/assets/images/amize.png';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
const AMIZE_LOGO = Image.resolveAssetSource(AmizeLogo).uri;


const FACEBOOK_ICON = Image.resolveAssetSource(FacebookIcon).uri;
const GOOGLE_ICON = Image.resolveAssetSource(GoogleIcon).uri;
const APPLE_ICON = Image.resolveAssetSource(AppleIcon).uri;

export default function SignInScreen() {
    const { login, loading, isAuthenticated } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [loginSuccess, setLoginSuccess] = useState(false);

    // Check if we need to redirect after successful authentication
    useEffect(() => {
        if (isAuthenticated && loginSuccess) {
            console.log("SignIn: Authentication successful, redirecting to tabs...");
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 200);
        }
    }, [isAuthenticated, loginSuccess]);

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: '', password: '' };

        if (!email) {
            newErrors.email = 'Email is required';
            isValid = false;
        }

        if (!password) {
            newErrors.password = 'Password is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSignIn = async () => {
        if (validateForm()) {
            try {
                console.log("SignIn: Attempting login...");
                const result = await login(email, password);
                console.log(`SignIn: Login result:`, result);

                if (result.success) {
                    setLoginSuccess(true);
                    console.log("SignIn: Login successful, setting redirect flag");
                    router.replace('/(tabs)');
                } else {
                    Alert.alert('Login Failed', result.message || 'Please check your credentials and try again.');
                }
            } catch (error) {
                console.error("SignIn: Login error:", error);
                Alert.alert('Login Error', 'An unexpected error occurred. Please try again.');
            }
        }
    };

    const handleForgotPassword = () => {
        router.push('/password-reset');
    };

    const handleSignUp = () => {
        router.push('/(auth)/sign-up');
    };

    return (
        <SafeAreaView style={{ flex: 1, 
        // backgroundColor: '#1a1a2e'
         }}>
            <StatusBar barStyle="light-content" backgroundColor={"#1E4A72"} />
             <LinearGradient
                colors={['#1E4A72', '#000000']}  
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1 }}
            >
                    {/* <TouchableOpacity
                        style={{ position:"absolute",padding: 8, marginLeft: 8, marginTop: 10, alignSelf: 'flex-start' }}
                        onPress={() => router.back()}
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity> */}
            <ScrollView contentContainerStyle={{ flexGrow: 1, top:30 }}>
                <View style={{ flex: 1, paddingHorizontal: 24 }}>
                    {/* Back Button */}

                    {/* Content Container */}
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>

                        {/* Logo Section */}
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            {/* Circular Logo with Gradient Ring */}
                            <View>
                                <View style={{
                                    width: 85,
                                    height: 85,
                                    borderRadius: 47,
                                    backgroundColor: 'rgba(3,5,16,0.45)',
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
                                fontSize: 32,
                                fontWeight: 'bold',
                                marginBottom: 12,
                                textAlign: 'center'
                            }}>
                                Amize Login
                            </Text>

                            {/* Subtitle */}
                            <Text style={{
                                color: '#9CA3AF',
                                fontSize: 16,
                                fontFamily: 'Figtree',
                                textAlign: 'center',
                                lineHeight: 24,
                                maxWidth: 320
                            }}>
                                Sign in to continue to your account and access all features
                            </Text>
                        </View>

                        {/* Form Section */}
                        <View style={{ width: '100%', maxWidth: 400 }}>
                            <Input
                                label="Email"
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                icon={<Mail size={20} color="#9CA3AF" />}
                                error={errors.email}
                            />

                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                icon={<Lock size={20} color="#9CA3AF" />}
                                error={errors.password}
                            />

                            {/* Remember Me */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 32
                            }}>
                                <TouchableOpacity
                                    onPress={() => setRememberMe(!rememberMe)}
                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <View style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 4,
                                        borderWidth: 1,
                                        borderColor: rememberMe ? '#FF5A5F' : '#6B7280',
                                        backgroundColor: rememberMe ? '#FF5A5F' : 'transparent',
                                        marginRight: 8,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {rememberMe && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
                                    </View>
                                    <Text style={{ color: '#9CA3AF', fontFamily: 'Figtree' }}>Remember me</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Sign In Button */}
                            <Button
                                label="Sign In"
                                onPress={handleSignIn}
                                variant="primary"
                                fullWidth
                                loading={loading}
                            />

                            {/* Forgot Password */}
                            <TouchableOpacity
                                onPress={handleForgotPassword}
                                style={{ alignItems: 'center', marginBottom: 32 }}
                            >
                                <Text style={{ color: '#FF5A5F', fontFamily: 'Figtree', fontSize: 16 }}>
                                    Forgot your password?
                                </Text>
                            </TouchableOpacity>

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
                                    onPress={() => {}}
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
                                    onPress={() => {}}
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
                                    onPress={() => {}}
                                >
                                    <Image
                                        source={{uri: APPLE_ICON}}
                                        style={{width: 24, height: 24}}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Sign Up Link */}
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'center'
                            }}>
                                <Text style={{ color: '#9CA3AF', fontFamily: 'Figtree' }}>
                                    Don't have an account?
                                </Text>
                                <TouchableOpacity onPress={handleSignUp}>
                                    <Text style={{
                                        color: '#FF5A5F',
                                        fontWeight: '500',
                                        fontFamily: 'Figtree'
                                    }}>
                                        Sign up
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