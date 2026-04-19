// hooks/useProfileEditor.ts
import {useState, useCallback, useEffect} from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';
import { profileApi, ProfileUpdateData } from '@/lib/api/profileApi';
import { User } from '@/lib/api/types';
import { uploadService } from '@/lib/api/uploadService';

interface UseProfileEditorReturn {
    // State
    profile: User | null;
    formData: ProfileUpdateData;
    loading: boolean;
    saving: boolean;
    uploading: boolean;
    hasChanges: boolean;

    // Actions
    loadProfile: () => Promise<void>;
    updateFormData: (data: Partial<ProfileUpdateData>) => void;
    saveChanges: () => Promise<boolean>;
    uploadPhoto: (uri: string) => Promise<boolean>;
    removePhoto: () => Promise<boolean>;
    resetForm: () => void;
    discardChanges: () => void;
}

export const useProfileEditor = (): UseProfileEditorReturn => {
    const { user, updateUser } = useAuth();

    // State
    const [profile, setProfile] = useState<User | null>(user);
    const [formData, setFormData] = useState<ProfileUpdateData>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState<ProfileUpdateData>({});

    // Initialize form data from user profile
    const initializeFormData = useCallback((userData: User) => {
        const data: ProfileUpdateData = {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            username: userData.username || '',
            bio: userData.bio || '',
            gender: userData.gender || '',
            dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
            instagramHandle: userData.instagramHandle || '',
            facebookHandle: userData.facebookHandle || '',
            twitterHandle: userData.twitterHandle || '',
        };

        setFormData(data);
        setOriginalData(data);
        setHasChanges(false);
    }, []);

    // Initialize profile data when user is available
    useEffect(() => {
        if (user) {
            setProfile(user);
            initializeFormData(user);
        }
        if(typeof user?.bio === 'string' && user !== null) {
            const parsedBio = JSON.parse(user?.bio);
            setProfile(prev => prev ? {...prev, bio: parsedBio} : prev);
            initializeFormData({...user, bio: parsedBio});
        }
    }, [user, initializeFormData]);

    // Load profile from API
    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);

            // If we already have user data, use it
            if (user && !profile) {
                setProfile(user);
                initializeFormData(user);
                return;
            }

            // Otherwise fetch from API
            const response = await profileApi.getProfile();
            if (response.success && response.profile) {
                setProfile(response.profile);
                initializeFormData(response.profile);
                updateUser(response.profile);
            } else {
                throw new Error('Failed to load profile');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, [user, profile, updateUser, initializeFormData]);

    // Update form data and track changes
    const updateFormData = useCallback((data: Partial<ProfileUpdateData>) => {
        setFormData(prev => {
            const newData = { ...prev, ...data };

            // Check if data has changed from original
            const changed = Object.keys(newData).some(key => {
                const typedKey = key as keyof ProfileUpdateData;
                return newData[typedKey] !== originalData[typedKey];
            });

            setHasChanges(changed);
            return newData;
        });
    }, [originalData]);

    // Save changes to API
    const saveChanges = useCallback(async (): Promise<boolean> => {
        if (!hasChanges) return true;

        try {
            setSaving(true);

            // Filter out empty strings and unchanged values
            const dataToSave: ProfileUpdateData = {};
            Object.keys(formData).forEach(key => {
                const typedKey = key as keyof ProfileUpdateData;
                const value = formData[typedKey];

                // Only include changed, non-empty values
                if (value !== originalData[typedKey] && value !== '') {
                    // dataToSave[typedKey] = value;
                    dataToSave[typedKey] = typeof value === 'object' ? JSON.stringify(value) : value;
                }
            });

            // Don't make API call if no actual changes
            if (Object.keys(dataToSave).length === 0) {
                setHasChanges(false);
                return true;
            }

            const response = await profileApi.updateProfile(dataToSave);

            if (response.success && response.profile) {
                // Update all state
                setProfile(response.profile);
                updateUser(response.profile);
                initializeFormData(response.profile);

                Alert.alert('Success', 'Profile updated successfully');
                return true;
            } else {
                throw new Error(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
            return false;
        } finally {
            setSaving(false);
        }
    }, [formData, originalData, hasChanges, updateUser, initializeFormData]);

    // Upload profile photo
    const uploadPhoto = useCallback(async (uri: string): Promise<boolean> => {
        try {
            setUploading(true);

            // Use platform-aware upload service
            const uploadResponse = await uploadService.uploadFile({
                uri,
                uploadType: 'PROFILE_PHOTO',
            });

            if (uploadResponse.success && uploadResponse.upload.fileUrl) {
                const fileUrl = uploadResponse.upload.fileUrl;

                // Persist the profile photo URL to the backend
                const updateResponse = await profileApi.updateProfile({ profilePhotoUrl: fileUrl });

                if (updateResponse.success && updateResponse.profile) {
                    // Update local state with the updated profile from server
                    setProfile(updateResponse.profile);
                    updateUser(updateResponse.profile);
                    Alert.alert('Success', 'Profile picture updated successfully');
                    return true;
                } else {
                    throw new Error(updateResponse.message || 'Failed to update profile with new photo');
                }
            } else {
                throw new Error(uploadResponse.message || 'Failed to upload photo');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload photo');
            return false;
        } finally {
            setUploading(false);
        }
    }, [profile, updateUser]);

    // Remove profile photo
    const removePhoto = useCallback(async (): Promise<boolean> => {
        try {
            setUploading(true);

            await profileApi.removeProfilePhoto();

            // Update profile to remove photo (use undefined instead of null)
            const updatedProfile = { ...profile!, profilePhotoUrl: undefined };
            setProfile(updatedProfile);
            updateUser(updatedProfile);

            Alert.alert('Success', 'Profile photo removed successfully');
            return true;
        } catch (error) {
            console.error('Error removing photo:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove photo');
            return false;
        } finally {
            setUploading(false);
        }
    }, [profile, updateUser]);

    // Reset form to original values
    const resetForm = useCallback(() => {
        setFormData(originalData);
        setHasChanges(false);
    }, [originalData]);

    // Discard changes with confirmation
    const discardChanges = useCallback(() => {
        if (hasChanges) {
            Alert.alert(
                'Discard Changes',
                'Are you sure you want to discard your changes?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: resetForm
                    }
                ]
            );
        }
    }, [hasChanges, resetForm]);

    return {
        // State
        profile,
        formData,
        loading,
        saving,
        uploading,
        hasChanges,

        // Actions
        loadProfile,
        updateFormData,
        saveChanges,
        uploadPhoto,
        removePhoto,
        resetForm,
        discardChanges,
    };
};