import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle } from 'react-native-svg';

// Create an animated Circle component for the animation
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProfileIndexPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const dashAnim = useRef(new Animated.Value(0)).current;

    // State to manage color alternation
    const [colorIndex, setColorIndex] = useState(0);
    // Colors to alternate between - using consistent app colors
    const colors = ['#FF5A5F', '#F3F4F6'];
    const colorsAlternate = ['#F3F4F6', '#FF5A5F'];

    // Calculate circle circumference for the loader
    const circleRadius = 45;
    const circumference = 2 * Math.PI * circleRadius;

    useEffect(() => {
        // Start all animations together
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ),
            Animated.loop(
                Animated.timing(dashAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ),
        ]).start();

        // Listener to alternate colors after each rotation loop
        let lastValue = 0;
        rotateAnim.addListener(({ value }) => {
            // Detect when the animation resets from ~1 to 0, indicating a loop completion
            if (value < lastValue) {
                setColorIndex((prev) => (prev + 1) % colors.length);
            }
            lastValue = value;
        });

        // Cleanup listener on component unmount
        return () => {
            rotateAnim.removeAllListeners();
        };
    }, []);

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated && user) {
                // Redirect to the authenticated user's profile
                setTimeout(() => {
                    router.replace(`/(tabs)/profile/${user.id}`);
                }, 800);
            } else {
                // Redirect to login if not authenticated
                setTimeout(() => {
                    router.replace('/(auth)/sign-in');
                }, 800);
            }
        }
    }, [loading, isAuthenticated, user]);

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1a1a2e', '#2A2A3A']}
                style={styles.gradient}
            >
                <Animated.View
                    style={[
                        styles.loadingContainer,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoText}>A</Text>
                        </View>
                    </View>

                    <View style={styles.iconContainer}>
                        <Svg width="100" height="100" style={{ position: 'absolute' }}>
                            <Circle
                                cx="50"
                                cy="50"
                                r="45"
                                stroke={colorsAlternate[colorIndex]}
                                strokeWidth="2"
                                opacity="0.3"
                                fill="none"
                            />
                            <AnimatedCircle
                                cx="50"
                                cy="50"
                                r="45"
                                stroke={colors[colorIndex]}
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray={[circumference, circumference]}
                                strokeDashoffset={dashAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [circumference, 0],
                                })}
                            />
                        </Svg>
                        {/* User icon with consistent color */}
                        <User size={44} color="#F3F4F6" />
                    </View>

                    <Text style={styles.loadingText}>
                        {loading
                            ? 'Loading your profile...'
                            : isAuthenticated
                                ? 'Opening profile...'
                                : 'Redirecting to sign in...'}
                    </Text>

                    {isAuthenticated && user && (
                        <Text style={styles.welcomeText}>
                            Welcome back, @{user.username}!
                        </Text>
                    )}
                </Animated.View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    gradient: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logoContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF5A5F',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Figtree',
    },
    iconContainer: {
        width: 100,
        height: 100,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    loadingText: {
        color: '#F3F4F6',
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 10,
        fontFamily: 'Figtree',
    },
    welcomeText: {
        color: '#FF5A5F',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
});