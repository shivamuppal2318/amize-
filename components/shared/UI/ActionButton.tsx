import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ActionButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    fullWidth?: boolean;
    disabled?: boolean;
    loading?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
                                                       label,
                                                       onPress,
                                                       variant = 'primary',
                                                       fullWidth = false,
                                                       disabled = false,
                                                       loading = false,
                                                   }) => {
    const getButtonStyle = () => {
        if (disabled) return [styles.button, styles.disabled, fullWidth && styles.fullWidth];

        switch (variant) {
            case 'primary':
                return [styles.button, styles.primaryButton, fullWidth && styles.fullWidth];
            case 'secondary':
                return [styles.button, styles.secondaryButton, fullWidth && styles.fullWidth];
            case 'outline':
                return [styles.button, styles.outlineButton, fullWidth && styles.fullWidth];
            default:
                return [styles.button, styles.primaryButton, fullWidth && styles.fullWidth];
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'outline':
                return [styles.buttonText, styles.outlineButtonText];
            default:
                return styles.buttonText;
        }
    };

    return (
        <TouchableOpacity
            style={getButtonStyle()}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
                <Text style={getTextStyle()}>{label}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#FF4D67',
    },
    secondaryButton: {
        backgroundColor: '#333333',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FF4D67',
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        backgroundColor: '#444444',
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    outlineButtonText: {
        color: '#FF4D67',
    },
});

export default ActionButton;