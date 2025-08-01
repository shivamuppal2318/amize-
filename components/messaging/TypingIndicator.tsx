// Enhanced TypingIndicator.tsx - Updated with improved styling and animations
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, UI, ANIMATION } from './constants';

interface TypingIndicatorProps {
    typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (typingUsers.length > 0) {
            // Entrance animation
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Exit animation
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 20,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [typingUsers.length]);

    if (typingUsers.length === 0) return null;

    const formatName = (inputName: string) => {
        const name = inputName.charAt(0).toUpperCase() + inputName.slice(1).toLowerCase();
        if (name.length > 12) {
            return `${name.slice(0, 12)}...`;
        }
        return name;
    };

    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${formatName(typingUsers[0])} is typing...`;
        } else if (typingUsers.length === 2) {
            return `${formatName(typingUsers[0])} and ${formatName(typingUsers[1])} are typing...`;
        } else {
            return `${formatName(typingUsers[0])} and ${typingUsers.length - 1} others are typing...`;
        }
    };

    return (
        <Animated.View style={[
            styles.typingIndicatorContainer,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }
        ]}>
            <View style={styles.typingIndicator}>
                <LinearGradient
                    colors={[
                        'rgba(26, 26, 46, 0.95)',
                        'rgba(26, 26, 46, 0.9)'
                    ]}
                    style={styles.typingGradient}
                >
                    <View style={styles.typingContent}>
                        {/* Animated typing dots */}
                        <View style={styles.typingDotsContainer}>
                            {[0, 1, 2].map((index) => (
                                <AnimatedDot key={index} delay={index * ANIMATION.TYPING_DOT.DELAY} />
                            ))}
                        </View>

                        {/* Typing text */}
                        <Text style={styles.typingText}>
                            {getTypingText()}
                        </Text>
                    </View>
                </LinearGradient>
            </View>
        </Animated.View>
    );
};

// Animated dot component for typing indicator
const AnimatedDot: React.FC<{ delay: number }> = ({ delay }) => {
    const scaleAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        const animate = () => {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: ANIMATION.TYPING_DOT.DURATION,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.5,
                    duration: ANIMATION.TYPING_DOT.DURATION,
                    useNativeDriver: true,
                }),
            ]).start(animate);
        };

        const timeout = setTimeout(animate, delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    return (
        <Animated.View style={[
            styles.typingDot,
            {
                transform: [{ scale: scaleAnim }]
            }
        ]} />
    );
};

const styles = StyleSheet.create({
    typingIndicatorContainer: {
    },
    typingIndicator: {
        alignSelf: 'flex-start',
        borderRadius: UI.BORDER_RADIUS.LG,
        overflow: 'hidden',
        ...UI.SHADOW.SMALL,
    },
    typingGradient: {
    },
    typingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: UI.SPACING.LG,
        paddingVertical: UI.SPACING.MD,
        gap: UI.SPACING.MD,
    },
    typingDotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.accent,
        borderRadius: 12,
        paddingHorizontal: UI.SPACING.SM,
        paddingVertical: UI.SPACING.SM,
        borderWidth: 1,
        borderColor: COLORS.accentBorder,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    typingText: {
        color: COLORS.textGray,
        fontSize: 14,
        fontStyle: 'italic',
        fontFamily: UI.FONT_FAMILY,
        fontWeight: '500',
        flex: 1,
    },
});

export default TypingIndicator;