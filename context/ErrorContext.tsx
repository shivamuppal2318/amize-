import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Text, TouchableOpacity } from 'react-native';
import { X, AlertCircle, Lock, Wifi, Server } from 'lucide-react-native';
import { captureException } from '@/utils/errorReporting';

interface ErrorState {
    visible: boolean;
    title?: string;
    message: string;
    type?: 'general' | 'auth' | 'network' | 'server' | 'validation';
    action?: {
        label: string;
        onPress: () => void;
    };
}

interface ErrorContextType {
    showError: (message: string, title?: string, type?: ErrorState['type']) => void;
    showAuthError: (message: string, action?: ErrorState['action']) => void;
    showNetworkError: (action?: ErrorState['action']) => void;
    showServerError: (message?: string) => void;
    showValidationError: (message: string) => void;
    hideError: () => void;
    error: ErrorState;
}

// Create context with default values
const ErrorContext = createContext<ErrorContextType>({
    showError: () => {},
    showAuthError: () => {},
    showNetworkError: () => {},
    showServerError: () => {},
    showValidationError: () => {},
    hideError: () => {},
    error: { visible: false, message: '', type: 'general' }
});

// Custom hook to use the error context
export const useErrorContext = () => useContext(ErrorContext);

// Error provider component
export const ErrorProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    // Error state
    const [error, setError] = useState<ErrorState>({
        visible: false,
        message: '',
        type: 'general'
    });

    // Animation value for the toast
    const [animation] = useState(new Animated.Value(0));

    // Auto-hide timer
    const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);

    // Clear any existing timer
    const clearTimer = useCallback(() => {
        if (hideTimer) {
            clearTimeout(hideTimer);
            setHideTimer(null);
        }
    }, [hideTimer]);

    // Auto-hide error after delay
    const startAutoHide = useCallback((delay = 5000) => {
        clearTimer();

        const timer = setTimeout(() => {
            hideError();
        }, delay);

        setHideTimer(timer);
    }, [clearTimer]);

    // Show error method
    const showError = useCallback((
        message: string,
        title?: string,
        type: ErrorState['type'] = 'general'
    ) => {
        clearTimer();

        // Store error for logging/tracking based on type
        if (type === 'server' || message.includes('server')) {
            captureException(new Error(`UI Error: ${title} - ${message}`), {
                tags: { type: 'server_error' }
            });
        } else if (type === 'network') {
            captureException(new Error(`Network Error: ${message}`), {
                tags: { type: 'network_error' }
            });
        }

        // Update error state
        setError({
            visible: true,
            message,
            title,
            type,
            action: undefined
        });

        // Animate in
        Animated.timing(animation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();

        // Start auto-hide timer
        startAutoHide();
    }, [animation, clearTimer, startAutoHide]);

    // Show authentication-specific error
    const showAuthError = useCallback((
        message: string,
        action?: ErrorState['action']
    ) => {
        clearTimer();

        setError({
            visible: true,
            message,
            title: 'Authentication Required',
            type: 'auth',
            action
        });

        // Animate in
        Animated.timing(animation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();

        // Longer delay for auth errors since they may need user action
        startAutoHide(8000);
    }, [animation, clearTimer, startAutoHide]);

    // Show network-specific error
    const showNetworkError = useCallback((action?: ErrorState['action']) => {
        clearTimer();

        setError({
            visible: true,
            message: 'Please check your internet connection and try again.',
            title: 'Connection Error',
            type: 'network',
            action
        });

        // Animate in
        Animated.timing(animation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();

        // Shorter delay for network errors as they may resolve quickly
        startAutoHide(6000);
    }, [animation, clearTimer, startAutoHide]);

    // Show server-specific error
    const showServerError = useCallback((message = 'Server error. Please try again later.') => {
        clearTimer();

        captureException(new Error(`Server Error: ${message}`), {
            tags: { type: 'server_error' }
        });

        setError({
            visible: true,
            message,
            title: 'Server Error',
            type: 'server',
            action: undefined
        });

        // Animate in
        Animated.timing(animation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();

        startAutoHide();
    }, [animation, clearTimer, startAutoHide]);

    // Show validation-specific error
    const showValidationError = useCallback((message: string) => {
        clearTimer();

        setError({
            visible: true,
            message,
            title: 'Invalid Input',
            type: 'validation',
            action: undefined
        });

        // Animate in
        Animated.timing(animation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();

        // Longer delay for validation errors so user can read them
        startAutoHide(7000);
    }, [animation, clearTimer, startAutoHide]);

    // Hide error method
    const hideError = useCallback(() => {
        clearTimer();

        // Animate out
        Animated.timing(animation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            // Update state after animation completes
            setError({
                visible: false,
                message: '',
                type: 'general',
                action: undefined
            });
        });
    }, [animation, clearTimer]);

    // Handle action button press
    const handleActionPress = useCallback(() => {
        if (error.action?.onPress) {
            error.action.onPress();
        }
        hideError();
    }, [error.action, hideError]);

    // Calculate animation styles
    const animatedStyles = {
        opacity: animation,
        transform: [
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0]
                })
            }
        ]
    };

    // Get error icon based on type
    const getErrorIcon = () => {
        switch (error.type) {
            case 'auth':
                return <Lock size={20} color="#fff" />;
            case 'network':
                return <Wifi size={20} color="#fff" />;
            case 'server':
                return <Server size={20} color="#fff" />;
            default:
                return <AlertCircle size={20} color="#fff" />;
        }
    };

    // Get error color based on type
    const getErrorColor = () => {
        switch (error.type) {
            case 'auth':
                return '#FF9500'; // Orange for auth
            case 'network':
                return '#007AFF'; // Blue for network
            case 'server':
                return '#FF3B30'; // Red for server
            case 'validation':
                return '#FF9500'; // Orange for validation
            default:
                return '#FF4D67'; // Default red
        }
    };

    // Provide context value
    const contextValue = {
        showError,
        showAuthError,
        showNetworkError,
        showServerError,
        showValidationError,
        hideError,
        error
    };

    return (
        <ErrorContext.Provider value={contextValue}>
            {children}

            {/* Enhanced Error Toast */}
            {error.visible && (
                <Animated.View
                    style={[
                        styles.errorContainer,
                        animatedStyles,
                        { backgroundColor: getErrorColor() }
                    ]}
                >
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        {getErrorIcon()}
                    </View>

                    {/* Content */}
                    <View style={styles.errorContent}>
                        {error.title && (
                            <Text style={styles.errorTitle}>{error.title}</Text>
                        )}
                        <Text style={styles.errorMessage}>{error.message}</Text>
                    </View>

                    {/* Action Button */}
                    {error.action && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleActionPress}
                        >
                            <Text style={styles.actionButtonText}>
                                {error.action.label}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={hideError}>
                        <X size={20} color="#fff" />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </ErrorContext.Provider>
    );
};

const styles = StyleSheet.create({
    errorContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    iconContainer: {
        marginRight: 12,
    },
    errorContent: {
        flex: 1,
        marginRight: 12,
    },
    errorTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    errorMessage: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 18,
    },
    actionButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});