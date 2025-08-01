// components/profile/ProfileUtilities.tsx

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Shimmer Loading Component for Videos
export const VideoSkeleton: React.FC = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-300, 300],
    });

    return (
        <View style={styles.skeletonContainer}>
            <View style={styles.skeletonVideo}>
                <Animated.View
                    style={[
                        styles.shimmer,
                        {
                            transform: [{ translateX: shimmerTranslate }],
                        }
                    ]}
                />
            </View>
        </View>
    );
};

// Loading Grid Component
export const LoadingVideoGrid: React.FC = () => {
    return (
        <View style={styles.loadingGrid}>
            {Array.from({ length: 9 }).map((_, index) => (
                <VideoSkeleton key={index} />
            ))}
        </View>
    );
};

// Profile Stats Animation Component
interface AnimatedStatProps {
    number: number;
    label: string;
    delay?: number;
}

export const AnimatedStat: React.FC<AnimatedStatProps> = ({ number, label, delay = 0 }) => {
    const countAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(countAnim, {
                toValue: number,
                duration: 1000,
                delay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                delay,
                easing: Easing.elastic(1.2),
                useNativeDriver: true,
            }),
        ]).start();
    }, [number, delay]);

    return (
        <Animated.View
            style={[
                styles.statContainer,
                { transform: [{ scale: scaleAnim }] }
            ]}
        >
            <Animated.Text style={styles.statNumber}>
                {countAnim.interpolate({
                    inputRange: [0, number],
                    outputRange: [0, number],
                    extrapolate: 'clamp',
                }).__getValue().toFixed(0)}
            </Animated.Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
};

// Floating Action Button for Profile Actions
interface FloatingActionButtonProps {
    onPress: () => void;
    icon: React.ReactNode;
    label: string;
    gradient?: string[];
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
                                                                              onPress,
                                                                              icon,
                                                                              label,
                                                                              gradient = ['#FF4D67', '#FF6B35']
                                                                          }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                style={styles.fabContainer}
            >
                <LinearGradient
                    colors={gradient}
                    style={styles.fabGradient}
                >
                    {icon}
                    <Text style={styles.fabLabel}>{label}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Enhanced Tab Indicator
interface TabIndicatorProps {
    activeIndex: number;
    tabCount: number;
    containerWidth: number;
}

export const TabIndicator: React.FC<TabIndicatorProps> = ({
                                                              activeIndex,
                                                              tabCount,
                                                              containerWidth
                                                          }) => {
    const translateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const tabWidth = containerWidth / tabCount;
        const translateX = tabWidth * activeIndex;

        Animated.parallel([
            Animated.spring(translateAnim, {
                toValue: translateX,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, [activeIndex, containerWidth, tabCount]);

    return (
        <Animated.View
            style={[
                styles.indicator,
                {
                    width: containerWidth / tabCount,
                    transform: [
                        { translateX: translateAnim },
                        { scaleX: scaleAnim }
                    ]
                }
            ]}
        >
            <LinearGradient
                colors={['#FF4D67', '#FF6B35']}
                style={styles.indicatorGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />
        </Animated.View>
    );
};

// Profile Header Background
export const ProfileHeaderBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <LinearGradient
            colors={['#000000', '#0D0D0D', '#000000']}
            style={styles.headerBackground}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    // Skeleton Styles
    skeletonContainer: {
        width: '31%',
        aspectRatio: 0.6,
        marginBottom: 8,
    },
    skeletonVideo: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    shimmer: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        position: 'absolute',
    },
    loadingGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
    },

    // Animated Stat Styles
    statContainer: {
        alignItems: 'center',
    },
    statNumber: {
        color: 'white',
        fontSize: 22,
        fontWeight: '800',
    },
    statLabel: {
        color: '#888888',
        fontSize: 14,
        marginTop: 4,
        fontWeight: '500',
    },

    // FAB Styles
    fabContainer: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#FF4D67',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 8,
    },
    fabLabel: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },

    // Tab Indicator Styles
    indicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        borderRadius: 2,
    },
    indicatorGradient: {
        flex: 1,
        borderRadius: 2,
    },

    // Header Background Styles
    headerBackground: {
        flex: 1,
    },
});