import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Image, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
//@ts-ignore
import DefaultImage from '@/assets/images/amize.png';

const DEFAULT_IMAGE = DefaultImage;

const COLORS = {
    background: '#1a1a2e',
    primary: '#FF5A5F',
    primaryLight: '#FF7A7F',
    white: '#F3F4F6',
    accent: 'rgba(255, 90, 95, 0.1)',
    accentBorder: 'rgba(255, 90, 95, 0.2)',
};

const UI = {
    SPACING: {
        XS: 4,
        SM: 8,
        MD: 12,
        LG: 16,
        XL: 24,
        XXL: 32,
    },
    BORDER_RADIUS: {
        LG: 16,
        XL: 20,
        XXL: 24,
        CIRCLE: 50,
    },
    FONT_FAMILY: 'Figtree',
    SHADOW: {
        LARGE: {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 12,
            },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 16,
        },
        PRIMARY: {
            shadowColor: '#FF5A5F',
            shadowOffset: {
                width: 0,
                height: 8,
            },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 12,
        },
    },
};

export default function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const logoRotate = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Logo entrance animation
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]),
            // Subtle rotation
            Animated.timing(logoRotate, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for loading indicator
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Navigate to onboarding after delay
        const timer = setTimeout(() => {
            router.replace('/onboarding/step1');
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    const logoRotation = logoRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    '#1a1a2e',
                    'rgba(26, 26, 46, 0.8)',
                    '#1a1a2e'
                ]}
                style={styles.backgroundGradient}
            >
                {/* Top spacing */}
                <View style={styles.topSpacer} />

                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <Animated.View style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { scale: scaleAnim }
                            ]
                        }
                    ]}>
                        <LinearGradient
                            colors={[COLORS.accent, 'rgba(255, 90, 95, 0.05)']}
                            style={styles.logoGradient}
                        >
                            <View style={styles.logoImageContainer}>
                                <Image
                                    source={DEFAULT_IMAGE}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* App Name */}
                    <Animated.View style={[
                        styles.appNameContainer,
                        { opacity: fadeAnim }
                    ]}>
                        <Text style={styles.appName}>Amize</Text>
                        <Text style={styles.appTagline}>Discover • Connect • Share</Text>
                    </Animated.View>
                </View>

                {/* Loading Section */}
                <View style={styles.loadingSection}>
                    <Animated.View style={[
                        styles.loadingContainer,
                        {
                            opacity: fadeAnim
                        }
                    ]}>
                        <View style={styles.loadingSpinner}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                        <Text style={styles.loadingText}>Loading your experience...</Text>
                    </Animated.View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    backgroundGradient: {
        flex: 1,
        paddingHorizontal: UI.SPACING.XL,
    },
    topSpacer: {
        flex: 0.3,
    },
    logoSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: UI.SPACING.XXL,
    },
    logoGradient: {
        width: 130,
        height: 130,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.accentBorder,
        ...UI.SHADOW.PRIMARY,
    },
    logoImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        ...UI.SHADOW.LARGE,
    },
    logoImage: {
        width: 120,
        height: 120,
    },
    appNameContainer: {
        alignItems: 'center',
        gap: UI.SPACING.SM,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.white,
        fontFamily: UI.FONT_FAMILY,
        textAlign: 'center',
        letterSpacing: 1,
    },
    appTagline: {
        fontSize: 16,
        color: COLORS.primary,
        fontFamily: UI.FONT_FAMILY,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    loadingSection: {
        flex: 0.4,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: UI.SPACING.XXL * 2,
    },
    loadingContainer: {
        alignItems: 'center',
        gap: UI.SPACING.LG,
    },
    loadingSpinner: {
        borderRadius: UI.BORDER_RADIUS.CIRCLE,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.white,
        fontFamily: UI.FONT_FAMILY,
        fontWeight: '500',
        opacity: 0.8,
    },
});
