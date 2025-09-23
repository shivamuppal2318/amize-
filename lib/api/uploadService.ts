import { Platform } from 'react-native';
import axios, { AxiosProgressEvent, isAxiosError } from 'axios';
import { uploadClient } from './client';
import { API_CONFIG, UPLOAD_ENDPOINTS } from './config';
import { getTokens } from '../auth/tokens';
import { secureStorage, STORAGE_KEYS } from '../auth/storage';

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
    async uploadFile({
        uri,
        name,
        type,
        uploadType,
        onProgress,
      }: FileUploadOptions): Promise<UploadResponse> {
        const filename = name || uri.split("/").pop() || "file";
      
        // Detect mime type if not provided
        let mimeType = type;
        if (!mimeType) {
          const extension = filename.split(".").pop()?.toLowerCase();
          switch (extension) {
            case "jpg":
            case "jpeg":
              mimeType = "image/jpeg";
              break;
            case "png":
              mimeType = "image/png";
              break;
            case "webp":
              mimeType = "image/webp";
              break;
            case "mp4":
              mimeType = "video/mp4";
              break;
            case "mov":
              mimeType = "video/quicktime";
              break;
            default:
              mimeType = uploadType === "VIDEO" ? "video/mp4" : "image/jpeg";
          }
        }
      
        let finalUri = uri;
        if (Platform.OS === "ios") {
          finalUri = uri.replace("file://", "");
        } else if (!uri.startsWith("file://")) {
          finalUri = `file://${uri}`;
        }
      
        const token = await getTokens();
        console.log(token?.accessToken);

        const formData = new FormData();
        formData.append("file", {
          uri: finalUri,
          type: mimeType,
          name: filename,
        } as any);
        formData.append("uploadType", uploadType);
      
        try {
          const response = await axios.post<UploadResponse>(
            API_CONFIG.BASE_URL + UPLOAD_ENDPOINTS.UPLOAD,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization:`Bearer ${token?.accessToken}` ,
              },
              onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                if (progressEvent.total && onProgress) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  onProgress(percentCompleted);
                }
              },
            }
          );
      
          if (response.status === 201 && response.data?.success) {
            return response.data;
          }
      
          throw new Error(response.data?.message || "File upload failed");
        } catch (error) {
          if (isAxiosError(error)) {
            console.error("UPLOAD ERROR:", error);
            const status = error.response?.status;
            const serverMessage = error.response?.data?.message;
      
            if (status === 413)
              throw new Error("File too large. Please select a smaller file.");
            if (status === 415)
              throw new Error("Unsupported file type. Please select a different file.");
            if (status === 401)
              throw new Error("Session expired. Please log in again.");
      
            throw new Error(`Upload failed: ${serverMessage || error.message}`);
          }
          throw new Error("Unknown error occurred during file upload");
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