import { Platform } from 'react-native';
import { AxiosProgressEvent, isAxiosError } from 'axios';
import { uploadClient } from './client';
import { UPLOAD_ENDPOINTS } from './config';

export interface FileUploadOptions {
    uri: string;
    name?: string;
    type?: string;
    uploadType: 'PROFILE_PHOTO' | 'VIDEO' | 'THUMBNAIL' | 'SOUND' | 'OTHER';
    onProgress?: (progress: number) => void;
}

export interface UploadResponse {
    success: boolean;
    message: string;
    upload: {
        id: string;
        fileName: string;
        originalFileName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        uploadType: string;
        status: string;
        thumbnailUrl?: string;
        width?: number;
        height?: number;
        duration?: number;
        createdAt: string;
    };
}

export interface GetUploadsResponse {
    success: boolean;
    uploads: Array<{
        id: string;
        fileName: string;
        originalFileName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        uploadType: string;
        status: string;
        thumbnailUrl?: string;
        width?: number;
        height?: number;
        duration?: number;
        createdAt: string;
    }>;
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

type ReactNativeFile = {
    uri: string;
    name: string;
    type: string;
}

/**
 * Dedicated service for handling file uploads from React Native
 */
export const uploadService = {
    /**
     * Upload a file to the server with progress tracking
     */
    async uploadFile({ uri, name, type, uploadType, onProgress }: FileUploadOptions): Promise<UploadResponse> {
        const filename = name || uri.split('/').pop() || 'file';

        // Create FormData instance
        const formData = new FormData();

        // Determine MIME type based on file extension if not provided
        let mimeType = type;
        if (!mimeType) {
            const extension = filename.split('.').pop()?.toLowerCase();
            switch (extension) {
                case 'jpg':
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case 'png':
                    mimeType = 'image/png';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    break;
                case 'mp4':
                    mimeType = 'video/mp4';
                    break;
                case 'mov':
                    mimeType = 'video/quicktime';
                    break;
                case 'mp3':
                    mimeType = 'audio/mpeg';
                    break;
                case 'wav':
                    mimeType = 'audio/wav';
                    break;
                default:
                    mimeType = uploadType === 'VIDEO' ? 'video/mp4' : 'image/jpeg';
            }
        }

        // Append the file with proper React Native file structure
        const fileObject: ReactNativeFile = {
            name: filename,
            type: mimeType,
            uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        };

        formData.append('file', fileObject as unknown as Blob);
        formData.append('uploadType', uploadType);

        try {
            // Make the upload request with progress tracking
            const response = await uploadClient.post<UploadResponse>(
                UPLOAD_ENDPOINTS.UPLOAD,
                formData,
                {
                    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                        if (progressEvent.total && onProgress) {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            onProgress(percentCompleted);
                        }
                    },
                }
            );

            // Handle successful upload
            if (response.status === 201 && response.data?.success) {
                return response.data;
            }

            throw new Error(response.data?.message || 'File upload failed');

        } catch (error) {
            // Handle specific error codes
            if (isAxiosError(error)) {
                const status = error.response?.status;
                const serverMessage = error.response?.data?.message;

                if (status === 413) {
                    throw new Error('File too large. Please select a smaller file.');
                } else if (status === 415) {
                    throw new Error('Unsupported file type. Please select a different file.');
                } else if (status === 401) {
                    throw new Error('Session expired. Please log in again.');
                }

                const errorMessage = serverMessage || error.message;
                throw new Error(`Upload failed: ${errorMessage}`);
            }
            throw new Error('Unknown error occurred during file upload');
        }
    },

    /**
     * Get list of user's uploads
     */
    async getUploads(params?: {
        uploadType?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<GetUploadsResponse> {
        try {
            const response = await uploadClient.get<GetUploadsResponse>(
                UPLOAD_ENDPOINTS.GET_UPLOADS,
                { params }
            );

            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to fetch uploads');
            }
            throw error;
        }
    },

    /**
     * Get upload details by ID
     */
    async getUploadById(id: string) {
        try {
            const response = await uploadClient.get(
                UPLOAD_ENDPOINTS.UPLOAD_BY_ID(id)
            );

            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to fetch upload details');
            }
            throw error;
        }
    },

    /**
     * Delete an upload
     */
    async deleteUpload(id: string) {
        try {
            const response = await uploadClient.delete(
                UPLOAD_ENDPOINTS.DELETE_UPLOAD(id)
            );

            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to delete upload');
            }
            throw error;
        }
    }
};