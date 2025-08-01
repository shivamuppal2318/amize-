import React, { ReactNode, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Animated, Dimensions } from 'react-native';
import { State, PanGestureHandler } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    primaryAction?: {
        label: string;
        onPress: () => void;
        destructive?: boolean;
    };
    secondaryAction?: {
        label: string;
        onPress: () => void;
    };
    children?: ReactNode;
    panGestureEnabled?: boolean; // New prop to control gesture handler
}

export const CustomModal = ({
                                visible,
                                onClose,
                                title,
                                message,
                                primaryAction,
                                secondaryAction,
                                children,
                                panGestureEnabled = true, // Default to true
                            }: CustomModalProps) => {
    const translateY = useRef(new Animated.Value(0)).current;

    // A unified function to handle the closing animation
    const handleClose = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT, // Animate down off the screen
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            onClose(); // Call the original onClose prop
            translateY.setValue(0); // Reset position for the next open
        });
    };

    const onGestureEvent = Animated.event(
        [{ nativeEvent: { translationY: translateY } }],
        { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: any) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            const { translationY: finalTranslateY, velocityY } = event.nativeEvent;

            // Dismiss if swiped down significantly or with enough velocity
            if (finalTranslateY > 150 || velocityY > 800) {
                Animated.spring(translateY, {
                    toValue: SCREEN_HEIGHT,
                    velocity: velocityY,
                    useNativeDriver: true,
                }).start(() => {
                    onClose();
                    translateY.setValue(0);
                });
            } else {
                // Otherwise, snap back to the original position
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            }
        }
    };

    // Reset animation state when visibility changes
    useEffect(() => {
        if (visible) {
            translateY.setValue(0);
        }
    }, [visible]);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose} // Use animated close for Android back button
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                {/* The overlay now also triggers the animated close */}
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <PanGestureHandler
                            onGestureEvent={onGestureEvent}
                            onHandlerStateChange={onHandlerStateChange}
                            enabled={panGestureEnabled} // Control gesture handler via prop
                        >
                            <Animated.View
                                style={[
                                    styles.modalContainer,
                                    {
                                        transform: [{
                                            translateY: translateY.interpolate({
                                                inputRange: [0, SCREEN_HEIGHT],
                                                outputRange: [0, SCREEN_HEIGHT],
                                                extrapolate: 'clamp',
                                            })
                                        }]
                                    }
                                ]}
                            >
                                <View style={styles.handleContainer}>
                                    <View style={styles.handle} />
                                </View>

                                <View style={styles.contentContainer}>
                                    <Text style={styles.title}>
                                        {title}
                                    </Text>

                                    {message && (
                                        <Text style={styles.message}>
                                            {message}
                                        </Text>
                                    )}

                                    {children}

                                    {(primaryAction || secondaryAction) && (
                                        <View style={styles.actionsContainer}>
                                            {secondaryAction && (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.button,
                                                        styles.secondaryButton
                                                    ]}
                                                    onPress={secondaryAction.onPress}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.secondaryButtonText}>
                                                        {secondaryAction.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}

                                            {primaryAction && (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.button,
                                                        styles.primaryButton,
                                                        primaryAction.destructive ? styles.destructiveButton : styles.defaultButton
                                                    ]}
                                                    onPress={primaryAction.onPress}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.primaryButtonText}>
                                                        {primaryAction.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        </PanGestureHandler>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(26,26,46,0.1)' // Darken overlay for better focus
    },
    modalContainer: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: 'rgba(75,85,99,0.1)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 24,
        maxHeight: '90%',
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 48,
        height: 4,
        backgroundColor: '#6B7280',
        borderRadius: 2,
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    title: {
        textAlign: 'center',
        color: '#F3F4F6',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        fontFamily: 'Figtree',
    },
    message: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 16,
        marginBottom: 24,
        lineHeight: 24,
        fontFamily: 'Figtree',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    secondaryButton: {
        backgroundColor: '#1a1a2e',
        borderWidth: 1,
        borderColor: '#4B5563',
    },
    primaryButton: {
        borderWidth: 0,
    },
    defaultButton: {
        backgroundColor: '#FF5A5F',
        shadowColor: '#FF5A5F',
        shadowOpacity: 0.3,
    },
    destructiveButton: {
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
        shadowOpacity: 0.3,
    },
    primaryButtonText: {
        color: '#F3F4F6',
        fontWeight: '700',
        fontSize: 16,
        fontFamily: 'Figtree',
    },
    secondaryButtonText: {
        color: '#9CA3AF',
        fontWeight: '600',
        fontSize: 16,
        fontFamily: 'Figtree',
    },
});