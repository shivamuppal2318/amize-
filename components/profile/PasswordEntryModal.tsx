// Password Entry Modal Component for Account Deletion
import {useEffect, useState} from "react";
import {Modal, TouchableOpacity, View, Text, ActivityIndicator, TextInput} from "react-native";
import {X} from "lucide-react-native";

const PasswordEntryModal = ({
                                visible,
                                onClose,
                                onSubmit,
                                loading
                            }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (password: string, reason: string) => void;
    loading: boolean;
}) => {
    const [password, setPassword] = useState('');
    const [reason, setReason] = useState('');
    const [feedback, setFeedback] = useState('');
    const [errors, setErrors] = useState({ password: '', reason: '' });

    useEffect(() => {
        if (visible) {
            // Reset form when modal opens
            setPassword('');
            setReason('');
            setFeedback('');
            setErrors({ password: '', reason: '' });
        }
    }, [visible]);

    const validateForm = () => {
        let valid = true;
        const newErrors = { password: '', reason: '' };

        if (!password.trim()) {
            newErrors.password = 'Password is required';
            valid = false;
        }

        if (!reason.trim()) {
            newErrors.reason = 'Please provide a reason for account deletion';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit(password, reason);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-[#262626] w-[90%] rounded-xl p-5">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-xl font-bold">Delete Account</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-gray-300 mb-4">
                        To delete your account, please enter your password and tell us why you're leaving.
                    </Text>

                    {/* Password Field */}
                    <Text className="text-white mb-2">Password</Text>
                    <TextInput
                        className={`bg-[#1E1E1E] text-white p-3 rounded-lg mb-1 ${errors.password ? 'border border-red-500' : ''}`}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                    />
                    {errors.password ? (
                        <Text className="text-red-500 text-xs mb-3">{errors.password}</Text>
                    ) : (
                        <View className="mb-3" />
                    )}

                    {/* Reason Field */}
                    <Text className="text-white mb-2">Reason for leaving</Text>
                    <TextInput
                        className={`bg-[#1E1E1E] text-white p-3 rounded-lg mb-1 ${errors.reason ? 'border border-red-500' : ''}`}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Why are you deleting your account?"
                        placeholderTextColor="#9CA3AF"
                    />
                    {errors.reason ? (
                        <Text className="text-red-500 text-xs mb-3">{errors.reason}</Text>
                    ) : (
                        <View className="mb-3" />
                    )}

                    {/* Feedback Field (Optional) */}
                    <Text className="text-white mb-2">Additional feedback (optional)</Text>
                    <TextInput
                        className="bg-[#1E1E1E] text-white p-3 rounded-lg mb-4"
                        value={feedback}
                        onChangeText={setFeedback}
                        placeholder="Is there anything we could improve?"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                    />

                    <View className="flex-row justify-end mt-2">
                        <TouchableOpacity
                            className="px-5 py-3 mr-3 rounded-lg bg-[#333333]"
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text className="text-white font-medium">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="px-5 py-3 rounded-lg bg-red-600"
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-medium">Delete Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default PasswordEntryModal;