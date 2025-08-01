import React, {useState} from 'react';
import {
    TextInput,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StyleProp,
    ViewStyle
} from 'react-native';
import {Eye, EyeOff} from 'lucide-react-native';

type InputProps = {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    error?: string;
    icon?: React.ReactNode;
    onBlur?: () => void;
    onFocus?: () => void;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    style?: StyleProp<ViewStyle>;
};

export const Input = ({
                          label,
                          placeholder,
                          value,
                          onChangeText,
                          secureTextEntry = false,
                          keyboardType = 'default',
                          error,
                          icon,
                          onBlur,
                          onFocus,
                          autoCapitalize = 'none',
                          style,
                      }: InputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

    const getContainerStyle = () => {
        if (error) {
            return styles.errorContainer;
        }
        if (isFocused) {
            return styles.focusedContainer;
        }
        return styles.defaultContainer;
    };

    return (
        <View style={[styles.wrapper, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.container, getContainerStyle()]}>
                {icon && (
                    <View style={styles.iconContainer}>
                        {icon}
                    </View>
                )}
                <TextInput
                    style={[styles.input, icon ? styles.inputWithIcon : null]}
                    placeholderTextColor="#6B7280"
                    placeholder={placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    keyboardType={keyboardType}
                    onFocus={() => {
                        setIsFocused(true);
                        onFocus && onFocus();
                    }}
                    onBlur={() => {
                        setIsFocused(false);
                        onBlur && onBlur();
                    }}
                    autoCapitalize={autoCapitalize}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.visibilityButton}
                    >
                        {isPasswordVisible ? (
                            <Eye size={20} color="#6B7280"/>
                        ) : (
                            <EyeOff size={20} color="#6B7280"/>
                        )}
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 20,
    },
    label: {
        color: '#F3F4F6',
        marginBottom: 8,
        fontSize: 16,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    container: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        borderWidth: 1,
        height: 56,
        borderColor: '#374151'
    },
    defaultContainer: {
        borderColor: '#374151',
    },
    errorContainer: {
        borderColor: '#EF4444',
    },
    focusedContainer: {
        borderColor: '#3B82F6',
        borderWidth: 2,
        backgroundColor: 'rgba(31,41,55,0.47)',
    },
    iconContainer: {
        position: 'absolute',
        left: 16,
        zIndex: 1,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 16,
        color: 'white',
        fontFamily: 'Figtree',
        fontSize: 16,
    },
    inputWithIcon: {
        paddingLeft: 48,
        borderRadius: 1,
    },
    visibilityButton: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    errorText: {
        color: '#EF4444',
        marginTop: 6,
        fontSize: 14,
        fontFamily: 'Figtree',
    },
});