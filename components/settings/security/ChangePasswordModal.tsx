import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, StyleSheet } from 'react-native';
import { X, Eye, EyeOff } from 'lucide-react-native';
import { useSecurityPassword } from '@/hooks/useSecurityHooks';

interface ChangePasswordModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ChangePasswordModal = ({ visible, onClose }: ChangePasswordModalProps) => {
    const { changePassword, loading } = useSecurityPassword();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errors, setErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Reset the form when closing
    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        onClose();
    };

    // Validate the form
    const validateForm = () => {
        const newErrors = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        };

        let isValid = true;

        if (!currentPassword) {
            newErrors.currentPassword = 'Current password is required';
            isValid = false;
        }

        if (!newPassword) {
            newErrors.newPassword = 'New password is required';
            isValid = false;
        } else if (newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
            isValid = false;
        } else if (!/[A-Z]/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain at least one uppercase letter';
            isValid = false;
        } else if (!/[a-z]/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain at least one lowercase letter';
            isValid = false;
        } else if (!/[0-9]/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain at least one number';
            isValid = false;
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain at least one special character';
            isValid = false;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle the form submission
    const handleSubmit = async () => {
        if (!validateForm()) return;

        const success = await changePassword(currentPassword, newPassword, confirmPassword);
        if (success) {
            Alert.alert('Success', 'Password changed successfully');
            handleClose();
        }
    };

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
                        <Text style={styles.headerText}>Change Password</Text>
                        <TouchableOpacity onPress={handleClose} disabled={loading}>
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
                        {/* Current Password */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Current Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        errors.currentPassword ? styles.inputError : null
                                    ]}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry={!showCurrentPassword}
                                    placeholder="Enter current password"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.currentPassword ? (
                                <Text style={styles.errorText}>{errors.currentPassword}</Text>
                            ) : null}
                        </View>

                        {/* New Password */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        errors.newPassword ? styles.inputError : null
                                    ]}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showNewPassword}
                                    placeholder="Enter new password"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.newPassword ? (
                                <Text style={styles.errorText}>{errors.newPassword}</Text>
                            ) : null}

                            {/* Password requirements info */}
                            <View style={styles.requirementsContainer}>
                                <Text style={styles.requirementTitle}>Password must contain:</Text>
                                <Text style={styles.requirementText}>- At least 8 characters</Text>
                                <Text style={styles.requirementText}>- One uppercase letter (A-Z)</Text>
                                <Text style={styles.requirementText}>- One lowercase letter (a-z)</Text>
                                <Text style={styles.requirementText}>- One number (0-9)</Text>
                                <Text style={styles.requirementText}>- One special character (!@#$%^&*...)</Text>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Confirm Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        errors.confirmPassword ? styles.inputError : null
                                    ]}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    placeholder="Confirm new password"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword ? (
                                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                            ) : null}
                        </View>
                    </ScrollView>

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
                            style={styles.actionButton}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Change Password</Text>
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
        maxHeight: '80%'
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
    scrollContainer: {
        maxHeight: 400
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
    requirementsContainer: {
        marginTop: 8
    },
    requirementTitle: {
        color: '#9CA3AF',
        fontSize: 12
    },
    requirementText: {
        color: '#9CA3AF',
        fontSize: 12,
        lineHeight: 18
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
    buttonText: {
        color: '#FFFFFF'
    }
});