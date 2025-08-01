import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { X, Eye, EyeOff } from 'lucide-react-native';
import { useSecurityPIN } from '@/hooks/useSecurityHooks';

interface ChangePINModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ChangePINModal = ({ visible, onClose }: ChangePINModalProps) => {
    const { hasPIN, setupPIN, changePIN, removePIN, loading, refreshPINStatus } = useSecurityPIN();

    const [mode, setMode] = useState<'setup' | 'change' | 'remove'>('setup');
    const [currentPIN, setCurrentPIN] = useState('');
    const [newPIN, setNewPIN] = useState('');
    const [confirmPIN, setConfirmPIN] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    const [errors, setErrors] = useState({
        currentPIN: '',
        newPIN: '',
        confirmPIN: '',
        password: ''
    });

    // Track if we should check PIN status
    const hasCheckedStatus = useRef(false);

    // Check PIN status only when modal first becomes visible
    // and we haven't already checked in this session
    useEffect(() => {
        if (visible && !hasCheckedStatus.current) {
            refreshPINStatus();
            hasCheckedStatus.current = true;
        }

        // Reset checked flag when modal is closed
        if (!visible) {
            hasCheckedStatus.current = false;
        }
    }, [visible]);

    // Set mode based on PIN status
    useEffect(() => {
        setMode(hasPIN ? 'change' : 'setup');
    }, [hasPIN]);

    // Reset the form when closing
    const handleClose = useCallback(() => {
        setCurrentPIN('');
        setNewPIN('');
        setConfirmPIN('');
        setPassword('');
        setErrors({
            currentPIN: '',
            newPIN: '',
            confirmPIN: '',
            password: ''
        });
        onClose();
    }, [onClose]);

    // Validate the form
    const validateForm = useCallback(() => {
        const newErrors = {
            currentPIN: '',
            newPIN: '',
            confirmPIN: '',
            password: ''
        };

        let isValid = true;

        // Validate based on mode
        if (mode === 'change' || mode === 'remove') {
            if (!currentPIN) {
                newErrors.currentPIN = 'Current PIN is required';
                isValid = false;
            } else if (!/^\d{4,6}$/.test(currentPIN)) {
                newErrors.currentPIN = 'PIN must be 4-6 digits';
                isValid = false;
            }
        }

        if (mode === 'setup' || mode === 'change') {
            if (!newPIN) {
                newErrors.newPIN = 'New PIN is required';
                isValid = false;
            } else if (!/^\d{4,6}$/.test(newPIN)) {
                newErrors.newPIN = 'PIN must be 4-6 digits';
                isValid = false;
            }

            if (!confirmPIN) {
                newErrors.confirmPIN = 'Please confirm your PIN';
                isValid = false;
            } else if (newPIN !== confirmPIN) {
                newErrors.confirmPIN = 'PINs do not match';
                isValid = false;
            }
        }

        if (mode === 'setup' || mode === 'remove') {
            if (!password) {
                newErrors.password = 'Password is required for verification';
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    }, [currentPIN, newPIN, confirmPIN, password, mode]);

    // Handle the form submission
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;

        let success = false;

        if (mode === 'setup') {
            success = await setupPIN(newPIN, confirmPIN, password);
        } else if (mode === 'change') {
            success = await changePIN(currentPIN, newPIN, confirmPIN);
        } else if (mode === 'remove') {
            success = await removePIN(currentPIN, password);
        }

        if (success) {
            Alert.alert('Success', `PIN ${mode === 'remove' ? 'removed' : mode === 'setup' ? 'set up' : 'changed'} successfully`);
            handleClose();
        }
    }, [mode, setupPIN, changePIN, removePIN, currentPIN, newPIN, confirmPIN, password, validateForm, handleClose]);

    // Toggle between change and remove modes
    const toggleMode = useCallback(() => {
        if (mode === 'change') {
            setMode('remove');
        } else if (mode === 'remove') {
            setMode('change');
        }
    }, [mode]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerText}>
                            {mode === 'setup' ? 'Set Up PIN' : mode === 'change' ? 'Change PIN' : 'Remove PIN'}
                        </Text>
                        <TouchableOpacity onPress={handleClose} disabled={loading}>
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Mode toggle button (only if PIN is already set) */}
                    {hasPIN && (
                        <TouchableOpacity
                            style={styles.toggleModeButton}
                            onPress={toggleMode}
                            disabled={loading}
                        >
                            <Text style={styles.toggleModeText}>
                                {mode === 'change' ? 'Remove PIN instead?' : 'Change PIN instead?'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Current PIN (only for change/remove) */}
                    {(mode === 'change' || mode === 'remove') && (
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Current PIN</Text>
                            <TextInput
                                style={[styles.input, errors.currentPIN ? styles.inputError : null]}
                                value={currentPIN}
                                onChangeText={text => {
                                    // Only allow numbers
                                    const numericValue = text.replace(/[^0-9]/g, '');
                                    setCurrentPIN(numericValue);
                                }}
                                keyboardType="numeric"
                                maxLength={6}
                                placeholder="Enter current PIN"
                                placeholderTextColor="#9CA3AF"
                                secureTextEntry
                            />
                            {errors.currentPIN ? (
                                <Text style={styles.errorText}>{errors.currentPIN}</Text>
                            ) : null}
                        </View>
                    )}

                    {/* New PIN and Confirm PIN (only for setup/change) */}
                    {(mode === 'setup' || mode === 'change') && (
                        <>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>New PIN</Text>
                                <TextInput
                                    style={[styles.input, errors.newPIN ? styles.inputError : null]}
                                    value={newPIN}
                                    onChangeText={text => {
                                        // Only allow numbers
                                        const numericValue = text.replace(/[^0-9]/g, '');
                                        setNewPIN(numericValue);
                                    }}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    placeholder="Enter new PIN (4-6 digits)"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry
                                />
                                {errors.newPIN ? (
                                    <Text style={styles.errorText}>{errors.newPIN}</Text>
                                ) : null}
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Confirm PIN</Text>
                                <TextInput
                                    style={[styles.input, errors.confirmPIN ? styles.inputError : null]}
                                    value={confirmPIN}
                                    onChangeText={text => {
                                        // Only allow numbers
                                        const numericValue = text.replace(/[^0-9]/g, '');
                                        setConfirmPIN(numericValue);
                                    }}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    placeholder="Confirm new PIN"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry
                                />
                                {errors.confirmPIN ? (
                                    <Text style={styles.errorText}>{errors.confirmPIN}</Text>
                                ) : null}
                            </View>
                        </>
                    )}

                    {/* Password (only for setup/remove) */}
                    {(mode === 'setup' || mode === 'remove') && (
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Password Verification</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        errors.password ? styles.inputError : null
                                    ]}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.password ? (
                                <Text style={styles.errorText}>{errors.password}</Text>
                            ) : null}
                        </View>
                    )}

                    {/* Action buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                mode === 'remove' ? styles.removeButton : null
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {mode === 'setup' ? 'Set PIN' : mode === 'change' ? 'Change PIN' : 'Remove PIN'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        backgroundColor: '#262626',
        width: '90%',
        borderRadius: 12,
        padding: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold'
    },
    toggleModeButton: {
        marginBottom: 16
    },
    toggleModeText: {
        color: '#FF4D67',
        fontSize: 16
    },
    inputWrapper: {
        marginBottom: 16
    },
    inputLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 8
    },
    input: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        padding: 12,
        borderRadius: 8
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#FF0000'
    },
    errorText: {
        color: '#FF0000',
        fontSize: 12,
        marginTop: 4
    },
    passwordContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center'
    },
    passwordInput: {
        flex: 1
    },
    eyeIcon: {
        position: 'absolute',
        right: 12
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16
    },
    cancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#333333',
        borderRadius: 8,
        marginRight: 8
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FF4D67',
        borderRadius: 8
    },
    removeButton: {
        backgroundColor: '#E53E3E',
    },
    buttonText: {
        color: '#FFFFFF'
    }
});