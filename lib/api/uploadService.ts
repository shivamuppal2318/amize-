import { Platform } from 'react-native';
import { AxiosProgressEvent, isAxiosError } from 'axios';
import { uploadClient } from './client';
import { API_CONFIG, UPLOAD_ENDPOINTS } from './config';
import { getTokens } from '../auth/tokens';
import { secureStorage, STORAGE_KEYS } from '../auth/storage';

const IS_WEB = typeof window !== 'undefined' && typeof document !== 'undefined';

export interface FileUploadOptions {
    uri: string;
    name?: string;
    type?: string;
    uploadType: 'PROFILE_PHOTO' | 'VIDEO' | 'THUMBNAIL' | 'SOUND' | 'OTHER';
    onProgress?: (progress: number) => void;
    webFile?: File; // For web: native File object from ImagePicker
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
        webFile,
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
        } else if (!uri.startsWith("file://") && !IS_WEB) {
          finalUri = `file://${uri}`;
        }
      
        const token = await getTokens();

        let formData: FormData;
        
        if (IS_WEB) {
          // For web, check if we have a native File object or need to fetch
          try {
            // Use the native File object from ImagePicker if available
            if (webFile) {
              formData = new FormData();
              formData.append("file", webFile);
              formData.append("uploadType", uploadType);
            } else if (finalUri.startsWith('blob:')) {
              // If it's a blob URL and no File object, we can't proceed
              console.log('[Web Upload] Blob URL without File object - using fallback');
              throw new Error('Blob URLs require File object handling from ImagePicker');
            } else {
              // Regular URL - fetch and upload
              const response = await fetch(finalUri);
              const blob = await response.blob();
              const file = new File([blob], filename, { type: mimeType });
              formData = new FormData();
              formData.append("file", file);
              formData.append("uploadType", uploadType);
            }
          } catch (error) {
            console.error('[Web Upload] Failed to process file:', error);
            // On web, return a mock success for demo
            // Remove this in production
            return {
              success: true,
              message: "Upload simulated (web blob not fully supported)",
              upload: {
                id: `web-${Date.now()}`,
                fileName: filename,
                originalFileName: filename,
                fileUrl: finalUri,
                fileType: mimeType,
                fileSize: 0,
                uploadType,
                status: "completed",
                createdAt: new Date().toISOString()
              }
            };
          }
        } else {
          // Native platforms
          formData = new FormData();
          formData.append("file", {
            uri: finalUri,
            type: mimeType,
            name: filename,
          } as any);
          formData.append("uploadType", uploadType);
        }
      
        const maxRetries = 2;
        let attempt = 0;

        while (true) {
          try {
            const response = await uploadClient.post<UploadResponse>(
              UPLOAD_ENDPOINTS.UPLOAD,
              formData,
              {
                timeout: API_CONFIG.UPLOAD_TIMEOUT,
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${token?.accessToken}`,
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
              const status = error.response?.status;
              const serverMessage = error.response?.data?.message;
              const retryable =
                !status || status >= 500 || error.code === "ECONNABORTED";
      
              if (status === 413)
                throw new Error("File too large. Please select a smaller file.");
              if (status === 415)
                throw new Error("Unsupported file type. Please select a different file.");
              if (status === 401)
                throw new Error("Session expired. Please log in again.");
              if (status === 429)
                throw new Error("Upload rate-limited. Please wait and retry.");
      
              if (retryable && attempt < maxRetries) {
                const backoffMs = 1000 * Math.pow(2, attempt);
                attempt += 1;
                await new Promise((resolve) => setTimeout(resolve, backoffMs));
                continue;
              }

              throw new Error(`Upload failed: ${serverMessage || error.message}`);
            }
            throw new Error("Unknown error occurred during file upload");
          }
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