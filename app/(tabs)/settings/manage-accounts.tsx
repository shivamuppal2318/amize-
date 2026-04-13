import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, Alert, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { Phone, Mail, CalendarDays, Briefcase, Trash2, ChevronLeft, ChevronRight, Lock, X } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import DateTimePicker from '@react-native-community/datetimepicker';
import PasswordEntryModal from '@/components/profile/PasswordEntryModal';
import { Platform } from 'react-native';

type AccountItemProps = {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress: () => void;
    showChevron?: boolean;
    textColor?: string;
    loading?: boolean;
};

const AccountItem = ({
                         icon,
                         label,
                         value,
                         onPress,
                         showChevron = true,
                         textColor = '#FFFFFF',
                         loading = false
                     }: AccountItemProps) => (
    <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between py-4 border-b border-[#333333]"
        disabled={loading}
    >
        <View className="flex-row items-center gap-3">
            {icon}
            <Text style={{ color: textColor }} className="text-base font-medium">{label}</Text>
        </View>

        <View className="flex-row items-center">
            {loading ? (
                <ActivityIndicator size="small" color="#FF4D67" className="mr-2" />
            ) : (
                value && <Text className="text-sm text-gray-400 mr-2">{value}</Text>
            )}
            {showChevron && <ChevronRight size={20} color="#9CA3AF" />}
        </View>
    </TouchableOpacity>
);

const SectionTitle = ({ title }: { title: string }) => (
    <Text className="text-white text-lg font-semibold mb-2 mt-6">{title}</Text>
);

// Modal component for editing text fields
const EditFieldModal = ({
                            visible,
                            onClose,
                            title,
                            value,
                            onSave,
                            loading,
                            placeholder,
                            keyboardType = 'default',
                            maxLength
                        }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    value: string;
    onSave: (value: string) => void;
    loading: boolean;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
    maxLength?: number;
}) => {
    const [inputValue, setInputValue] = useState(value || '');

    useEffect(() => {
        if (visible) {
            setInputValue(value || '');
        }
    }, [visible, value]);

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
                        <Text className="text-white text-xl font-bold">{title}</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        className="bg-[#1E1E1E] text-white p-3 rounded-lg mb-4"
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder={placeholder || `Enter ${title.toLowerCase()}`}
                        placeholderTextColor="#9CA3AF"
                        keyboardType={keyboardType}
                        autoCapitalize="none"
                        maxLength={maxLength}
                    />

                    <View className="flex-row justify-end">
                        <TouchableOpacity
                            className="px-5 py-3 mr-3 rounded-lg bg-[#333333]"
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text className="text-white font-medium">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`px-5 py-3 rounded-lg bg-[#1E4A72]`}
                            onPress={() => onSave(inputValue)}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-medium">Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const DatePickerModal = ({
    visible,
    onClose,
    value,
    onSave,
    loading
  }: {
    visible: boolean;
    onClose: () => void;
    value: Date | null;
    onSave: (value: Date) => void;
    loading: boolean;
  }) => {
    const [date, setDate] = useState<Date>(value || new Date());
    const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  
    useEffect(() => {
      if (visible && value) {
        setDate(value);
      }
    }, [visible, value]);
  
    const handleAndroidChange = (event: any, selectedDate?: Date) => {
      if (event.type === "set") {
        const newDate = selectedDate || date;
        setDate(newDate);
      }
      setShowAndroidPicker(false);
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
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">Date of Birth</Text>
              <TouchableOpacity onPress={onClose} disabled={loading}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
  
            {/* iOS picker inside modal */}
            {Platform.OS === "ios" && (
              <View className="bg-[#1E1E1E] p-4 rounded-lg">
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={(e, d) => d && setDate(d)}
                  maximumDate={new Date()}
                  themeVariant="dark"
                  textColor="#FFFFFF"
                />
              </View>
            )}
  
            {/* Android button */}
            {Platform.OS === "android" && (
              <TouchableOpacity
                onPress={() => setShowAndroidPicker(true)}
                className="bg-[#1E1E1E] p-4 rounded-lg"
              >
                <Text className="text-white text-center">
                  {date.toDateString()}
                </Text>
              </TouchableOpacity>
            )}
  
            {/* Buttons */}
            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                className="px-5 py-3 mr-3 rounded-lg bg-[#333333]"
                onPress={onClose}
                disabled={loading}
              >
                <Text className="text-white font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-5 py-3 rounded-lg bg-[#1E4A72]"
                onPress={() => onSave(date)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-medium">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
  
        {/* Android system picker outside modal */}
        {showAndroidPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="calendar"
            onChange={handleAndroidChange}
            maximumDate={new Date()}
          />
        )}
      </Modal>
    );
  };
  
// Confirmation modal
const ConfirmationModal = ({
                               visible,
                               onClose,
                               title,
                               message,
                               confirmText,
                               onConfirm,
                               loading,
                               destructive = false
                           }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    loading: boolean;
    destructive?: boolean;
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-[#262626] w-[90%] rounded-xl p-5">
                    <Text className="text-white text-xl font-bold mb-2">{title}</Text>
                    <Text className="text-gray-300 mb-6">{message}</Text>

                    <View className="flex-row justify-end">
                        <TouchableOpacity
                            className="px-5 py-3 mr-3 rounded-lg bg-[#333333]"
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text className="text-white font-medium">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`px-5 py-3 rounded-lg ${destructive ? 'bg-red-600' : 'bg-[#FF4D67]'}`}
                            onPress={onConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-medium">{confirmText}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function ManageAccountsScreen() {
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

    // API hooks
    const { data: accountData, loading: accountLoading, error: accountError, execute: fetchAccount } = useApi('/account', 'get');
    const updateAccountApi = useApi('/account', 'put');
    const deleteAccountApi = useApi('/account/delete', 'post');
    const businessAccountApi = useApi('/account/business', 'post');

    // State for account data
    const [userData, setUserData] = useState<{
        phoneNumber: string | null;
        email: string | null;
        dateOfBirth: Date | null;
        isBusinessAccount: boolean;
    }>({
        phoneNumber: null,
        email: null,
        dateOfBirth: null,
        isBusinessAccount: false
    });

    // Modal states
    const [modalStates, setModalStates] = useState({
        phoneNumber: false,
        dateOfBirth: false,
        businessAccount: false,
        deleteAccount: false,
        passwordEntry: false
    });

    // Loading states
    const [fieldLoading, setFieldLoading] = useState<{[key: string]: boolean}>({});

    // Fetch user account data
    useEffect(() => {
        if (isAuthenticated && user) {
            fetchAccount();
        }
    }, [isAuthenticated, user]);

    // Update local state when account data is received
    useEffect(() => {
        if (accountData?.success && accountData.account) {
            const account = accountData.account;
            setUserData({
                phoneNumber: account.phoneNumber || null,
                email: account.email || null,
                dateOfBirth: account.dateOfBirth ? new Date(account.dateOfBirth) : null,
                // Get isBusinessAccount from settings or default to false
                isBusinessAccount: account.settings?.isBusinessAccount || false
            });
        }
    }, [accountData]);

    const handleBack = () => {
        router.back();
    };

    const handleNavigateToLogin = () => {
        router.replace('/(auth)/sign-in');
    };

    const openModal = (field: keyof typeof modalStates) => {
        setModalStates({...modalStates, [field]: true});
    };

    const closeModal = (field: keyof typeof modalStates) => {
        setModalStates({...modalStates, [field]: false});
    };

    const handleUpdatePhoneNumber = async (value: string) => {
        try {
            setFieldLoading({...fieldLoading, phoneNumber: true});

            const response = await updateAccountApi.execute({
                phoneNumber: value
            });

            if (response?.success) {
                setUserData(prev => ({...prev, phoneNumber: value}));
                Alert.alert('Success', 'Phone number updated successfully');
            } else {
                Alert.alert('Error', response?.message || 'Failed to update phone number');
            }
        } catch (error) {
            console.error('Error updating phone number:', error);
            Alert.alert('Error', 'Failed to update phone number');
        } finally {
            setFieldLoading({...fieldLoading, phoneNumber: false});
            closeModal('phoneNumber');
        }
    };

    const handleUpdateDateOfBirth = async (date: Date) => {
        try {
            setFieldLoading({...fieldLoading, dateOfBirth: true});

            const response = await updateAccountApi.execute({
                dateOfBirth: date.toISOString()
            });

            if (response?.success) {
                setUserData(prev => ({...prev, dateOfBirth: date}));
                Alert.alert('Success', 'Date of birth updated successfully');
            } else {
                Alert.alert('Error', response?.message || 'Failed to update date of birth');
            }
        } catch (error) {
            console.error('Error updating date of birth:', error);
            Alert.alert('Error', 'Failed to update date of birth');
        } finally {
            setFieldLoading({...fieldLoading, dateOfBirth: false});
            closeModal('dateOfBirth');
        }
    };

    const handleSwitchToBusiness = async () => {
        try {
            setFieldLoading({...fieldLoading, businessAccount: true});

            const response = await businessAccountApi.execute({
                businessName: user?.firstName ? `${user.firstName}'s Business` : 'My Business',
                businessCategory: 'Personal',
                businessEmail: user?.email
            });

            if (response?.success) {
                setUserData(prev => ({...prev, isBusinessAccount: true}));
                Alert.alert('Success', 'Your account has been switched to a business account');
                // Refetch account data to ensure we have the latest settings
                fetchAccount();
            } else {
                Alert.alert('Error', response?.message || 'Failed to switch to business account');
            }
        } catch (error) {
            console.error('Error switching to business account:', error);
            Alert.alert('Error', 'Failed to switch to business account');
        } finally {
            setFieldLoading({...fieldLoading, businessAccount: false});
            closeModal('businessAccount');
        }
    };

    const handleDeleteAccount = () => {
        // Instead of showing the confirmation modal directly,
        // first show the password entry modal
        openModal('passwordEntry');
    };

    const handleDeleteConfirmation = async (password: string, reason: string) => {
        try {
            setFieldLoading({...fieldLoading, deleteAccount: true});

            const response = await deleteAccountApi.execute({
                password: password,
                reason: reason
            });

            if (response?.success) {
                closeModal('passwordEntry');
                Alert.alert('Account Deleted', 'Your account has been deleted successfully. You can recover it within 30 days by logging in again.');
                // Log out the user after account deletion
                await logout();
            } else {
                Alert.alert('Error', response?.message || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            Alert.alert('Error', 'Failed to delete account. Please try again.');
        } finally {
            setFieldLoading({...fieldLoading, deleteAccount: false});
        }
    };

    // Format date of birth
    const formatDate = (date: Date | null): string => {
        if (!date) return 'Not set';
        try {
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Loading state
    if (authLoading || accountLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#1a1a2e] items-center justify-center">
                <ActivityIndicator size="large" color="#FF4D67" />
                <Text className="text-gray-400 mt-4">Loading account information...</Text>
            </SafeAreaView>
        );
    }

    // Error state
    if (accountError) {
        return (
            <SafeAreaView className="flex-1 bg-[#1a1a2e]">
                <View className="flex-row items-center p-4 mb-4">
                    <TouchableOpacity onPress={handleBack} className="mr-4">
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Manage Account</Text>
                </View>

                <View className="flex-1 p-4 items-center justify-center">
                    <Text className="text-white text-lg text-center mb-4">
                        Error loading account information
                    </Text>
                    <TouchableOpacity
                        className="bg-[#FF4D67] py-3 px-6 rounded-lg"
                        onPress={() => fetchAccount()}
                    >
                        <Text className="text-white font-semibold">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Not authenticated state
    if (!isAuthenticated || !user) {
        return (
            <SafeAreaView className="flex-1 bg-[#1a1a2e]">
                <View className="p-6 flex-1 items-center justify-center">
                    <View className="items-center mb-8">
                        <Lock size={64} color="#FF4D67" />
                        <Text className="text-white text-2xl font-bold mt-6 text-center">
                            Authentication Required
                        </Text>
                        <Text className="text-gray-400 text-base mt-2 mb-8 text-center px-6">
                            You need to sign in to manage your account information.
                        </Text>
                        <TouchableOpacity
                            className="bg-[#FF4D67] py-3 px-6 rounded-full w-64"
                            onPress={handleNavigateToLogin}
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#1a1a2e]">
            {/* Header */}
            <View className="flex-row items-center p-4 mb-4">
                <TouchableOpacity onPress={handleBack} className="mr-4">
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Manage Account</Text>
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Account Information Section */}
                <SectionTitle title="Account Information" />

                <AccountItem
                    icon={<Phone size={20} color="#9CA3AF" />}
                    label="Phone Number"
                    value={userData.phoneNumber || "Not set"}
                    onPress={() => openModal('phoneNumber')}
                    loading={fieldLoading['phoneNumber']}
                />

                <AccountItem
                    icon={<Mail size={20} color="#9CA3AF" />}
                    label="Email"
                    value={user.email}
                    onPress={() => router.push('/settings/help-center/contact-us')}
                />

                <AccountItem
                    icon={<CalendarDays size={20} color="#9CA3AF" />}
                    label="Date of Birth"
                    value={formatDate(userData.dateOfBirth)}
                    onPress={() => openModal('dateOfBirth')}
                    loading={fieldLoading['dateOfBirth']}
                />

                {/* Account Control Section */}
                <SectionTitle title="Account Control" />

                <AccountItem
                    icon={<Briefcase size={20} color="#9CA3AF" />}
                    label={userData.isBusinessAccount ? "Business Account" : "Switch to Business Account"}
                    value={userData.isBusinessAccount ? "Active" : undefined}
                    onPress={() => openModal('businessAccount')}
                    loading={fieldLoading['businessAccount']}
                />

                <AccountItem
                    icon={<Trash2 size={20} color="#FF5A5F" />}
                    label="Delete Account"
                    showChevron={false}
                    textColor="#FF5A5F"
                    onPress={() => openModal('deleteAccount')}
                />
            </ScrollView>

            {/* Edit Phone Number Modal */}
            <EditFieldModal
                visible={modalStates.phoneNumber}
                onClose={() => closeModal('phoneNumber')}
                title="Phone Number"
                value={userData.phoneNumber || ''}
                onSave={handleUpdatePhoneNumber}
                loading={fieldLoading['phoneNumber'] || false}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={15}
            />

            {/* Date of Birth Picker Modal */}
            <DatePickerModal
                visible={modalStates.dateOfBirth}
                onClose={() => closeModal('dateOfBirth')}
                value={userData.dateOfBirth}
                onSave={handleUpdateDateOfBirth}
                loading={fieldLoading['dateOfBirth'] || false}
            />

            {/* Business Account Confirmation Modal */}
            <ConfirmationModal
                visible={modalStates.businessAccount}
                onClose={() => closeModal('businessAccount')}
                title="Switch to Business Account"
                message="Are you sure you want to switch to a business account? This will give you access to analytics and additional features."
                confirmText="Switch"
                onConfirm={handleSwitchToBusiness}
                loading={fieldLoading['businessAccount'] || false}
            />

            {/* Delete Account Confirmation Modal */}
            <ConfirmationModal
                visible={modalStates.deleteAccount}
                onClose={() => closeModal('deleteAccount')}
                title="Delete Account"
                message="Are you sure you want to delete your account? This action cannot be undone."
                confirmText="Continue"
                onConfirm={() => openModal('passwordEntry')}
                loading={false}
                destructive={true}
            />

            {/* Password Entry Modal for Account Deletion */}
            <PasswordEntryModal
                visible={modalStates.passwordEntry}
                onClose={() => closeModal('passwordEntry')}
                onSubmit={handleDeleteConfirmation}
                loading={fieldLoading['deleteAccount'] || false}
            />
        </SafeAreaView>
    );
}
