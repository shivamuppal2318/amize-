import apiClient, { uploadClient } from './client';
import { User } from './types';

export interface ProfileUpdateData {
    firstName?: string;
    lastName?: string;
    username?: string;
    bio?: string;
    gender?: string;
    dateOfBirth?: string;
    instagramHandle?: string;
    facebookHandle?: string;
    twitterHandle?: string;
    profilePhotoUrl?: string;
}

export interface ProfileResponse {
    success: boolean;
    message?: string;
    profile?: User;
}

export interface PhotoUploadResponse {
    success: boolean;
    message?: string;
    profilePhotoUrl?: string;
}

class ProfileAPI {
    /**
     * Get user profile data
     */
    async getProfile(): Promise<ProfileResponse> {
        try {
            const response = await apiClient.get('/profile');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch profile');
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(data: ProfileUpdateData): Promise<ProfileResponse> {
        try {
            const response = await apiClient.put('/profile', data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 409) {
                throw new Error('Username already exists');
            }
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    }

    /**
     * Upload profile photo directly via profile endpoint
     */
    async uploadProfilePhoto(file: File | Blob): Promise<PhotoUploadResponse> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await uploadClient.post('/profile/photo', formData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 413) {
                throw new Error('File size exceeds the 5MB limit');
            }
            if (error.response?.status === 415) {
                throw new Error('Invalid file type. Please select a JPEG, PNG, GIF, or WEBP image');
            }
            throw new Error(error.response?.data?.message || 'Failed to upload profile photo');
        }
    }

    /**
     * Remove profile photo
     */
    async removeProfilePhoto(): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await apiClient.delete('/profile/photo');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to remove profile photo');
        }
    }

    /**
     * Upload profile photo using S3 direct upload
     */
    async uploadProfilePhotoToS3(file: File | Blob): Promise<PhotoUploadResponse> {
        try {
            // First, upload the file as a general upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('uploadType', 'PROFILE_PHOTO');

            const uploadResponse = await uploadClient.post('/upload', formData);

            if (!uploadResponse.data.success) {
                throw new Error(uploadResponse.data.message || 'Failed to upload file');
            }

            // The upload endpoint returns the file URL
            const profilePhotoUrl = uploadResponse.data.upload.fileUrl;

            // Update the user's profile with the new photo URL
            const updateResponse = await this.updateProfile({ profilePhotoUrl });

            if (updateResponse.success) {
                return {
                    success: true,
                    profilePhotoUrl,
                    message: 'Profile photo updated successfully'
                };
            } else {
                throw new Error(updateResponse.message || 'Failed to update profile with new photo');
            }
        } catch (error: any) {
            if (error.response?.status === 413) {
                throw new Error('File size exceeds the limit');
            }
            if (error.response?.status === 415) {
                throw new Error('Invalid file type. Please select a valid image file');
            }
            throw new Error(error.response?.data?.message || 'Failed to upload profile photo');
        }
    }
}

export const profileApi = new ProfileAPI();