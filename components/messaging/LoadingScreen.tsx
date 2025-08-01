// Enhanced LoadingScreen.tsx - Updated with improved styling and animations
import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, UI } from './constants';

interface LoadingScreenProps {
    text?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
                                                         text = "Loading conversations..."
                                                     }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for the icon
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
    }, []);

    return (
        <View style={styles.loadingContainer}>
            <Animated.View style={[
                styles.loadingContent,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}>
                <LinearGradient
                    colors={[
                        'rgba(255, 90, 95, 0.2)',
                        'rgba(255, 90, 95, 0.1)'
                    ]}
                    style={styles.loadingGradient}
                >
                    <Animated.View style={[
                        styles.iconContainer,
                        {
                            transform: [{ scale: pulseAnim }]
                        }
                    ]}>
                        <View style={styles.iconBackground}>
                            <MessageCircle size={48} color={COLORS.primary} />
                        </View>
                    </Animated.View>

                    <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>

                    <Text style={styles.loadingText}>{text}</Text>

                    <View style={styles.dotsContainer}>
                        {[0, 1, 2].map((index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        opacity: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.3, 1],
                                        })
                                    }
                                ]}
                            />
                        ))}
                    </View>
                </LinearGradient>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: UI.SPACING.XL,
    },
    loadingContent: {
        width: '100%',
        maxWidth: 320,
        borderRadius: UI.BORDER_RADIUS.XXL,
        overflow: 'hidden',
        ...UI.SHADOW.LARGE,
    },
    loadingGradient: {
        alignItems: 'center',
        paddingVertical: UI.SPACING.XXL * 2,
        paddingHorizontal: UI.SPACING.XL,
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderWidth: 1,
        borderColor: COLORS.accentBorder,
    },
    iconContainer: {
        marginBottom: UI.SPACING.XL,
    },
    iconBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.accentBorder,
        ...UI.SHADOW.MEDIUM,
    },
    spinnerContainer: {
        marginBottom: UI.SPACING.LG,
    },
    loadingText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
        fontFamily: UI.FONT_FAMILY,
        textAlign: 'center',
        marginBottom: UI.SPACING.LG,
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: UI.SPACING.SM,
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
});

export default LoadingScreen;