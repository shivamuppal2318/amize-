import { Platform } from 'react-native';
import { AxiosProgressEvent, isAxiosError } from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
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

function buildAbsoluteUploadUrl(path: string) {
    const baseUrl = String(API_CONFIG.BASE_URL || "").replace(/\/+$/, "");
    const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
}

function extensionFromMimeType(mimeType: string, uploadType: FileUploadOptions["uploadType"]) {
    const normalized = String(mimeType || "").toLowerCase();

    switch (normalized) {
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        case "video/mp4":
            return "mp4";
        case "video/quicktime":
            return "mov";
        case "video/webm":
            return "webm";
        case "audio/mpeg":
            return "mp3";
        case "audio/mp4":
            return "m4a";
        default:
            return uploadType === "VIDEO" ? "mp4" : "jpg";
    }
}

function ensureFilenameExtension(filename: string, mimeType: string, uploadType: FileUploadOptions["uploadType"]) {
    if (/\.[a-z0-9]+$/i.test(filename)) {
        return filename;
    }

    return `${filename}.${extensionFromMimeType(mimeType, uploadType)}`;
}

async function normalizeNativeUploadUri(
    uri: string,
    filename: string,
    mimeType: string,
    uploadType: FileUploadOptions["uploadType"]
) {
    const cacheDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!cacheDirectory) {
        return {
            uri,
            filename: ensureFilenameExtension(filename, mimeType, uploadType),
        };
    }

    const normalizedFilename = ensureFilenameExtension(filename, mimeType, uploadType);
    const normalizedCacheDirectory = String(cacheDirectory);
    const shouldPreferCachedCopy =
        uri.startsWith("content://") ||
        uri.startsWith("ph://") ||
        uri.startsWith("asset://") ||
        (uri.startsWith("file://") && !uri.startsWith(normalizedCacheDirectory));

    if (!shouldPreferCachedCopy) {
        return {
            uri,
            filename: normalizedFilename,
        };
    }

    const nextFilename = ensureFilenameExtension(`upload-${Date.now()}`, mimeType, uploadType);
    const destination = `${cacheDirectory}${nextFilename}`;

    try {
        await FileSystem.copyAsync({
            from: uri,
            to: destination,
        });

        return {
            uri: destination,
            filename: nextFilename,
        };
    } catch (error) {
        console.warn("[Native Upload] Failed to copy picker asset to cache, using original URI", {
            uri,
            destination,
            error,
        });

        return {
            uri,
            filename: normalizedFilename,
        };
    }
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
        const filenameFromUri = uri.split("/").pop() || "file";
        let filename = name || filenameFromUri || "file";
      
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

        filename = ensureFilenameExtension(filename, mimeType, uploadType);
      
        let finalUri = uri;
        if (Platform.OS === "ios" && uri.startsWith("file://")) {
          finalUri = uri.replace("file://", "");
        } else if (
          !IS_WEB &&
          !uri.startsWith("file://") &&
          !uri.startsWith("content://") &&
          !uri.startsWith("ph://") &&
          !uri.startsWith("asset://")
        ) {
          finalUri = `file://${uri}`;
        }
      
        const token = await getTokens();

        let formData: FormData;
        
        if (IS_WEB) {
          // For web, ensure we upload a real File with a non-empty, correct mime type.
          try {
            let fileToUpload: File;

            if (webFile) {
              const rawType = typeof webFile.type === "string" ? webFile.type : "";
              const needsNormalization =
                !rawType ||
                rawType === "application/octet-stream" ||
                rawType === "binary/octet-stream" ||
                !rawType.includes("/") ||
                (!rawType.startsWith("image/") &&
                  !rawType.startsWith("video/") &&
                  !rawType.startsWith("audio/"));

              fileToUpload = needsNormalization
                ? new File([webFile], filename, { type: mimeType })
                : new File([webFile], filename, { type: rawType });
            } else {
              // `blob:` URLs are fetchable in the browser; this works for expo-image-picker on web too.
              const response = await fetch(finalUri);
              const blob = await response.blob();
              fileToUpload = new File([blob], filename, {
                type: (blob as any)?.type || mimeType,
              });
            }

            formData = new FormData();
            formData.append("file", fileToUpload);
            formData.append("uploadType", uploadType);
          } catch (error) {
            console.error('[Web Upload] Failed to process file:', error);
            throw new Error(
              "Web upload failed to prepare the selected file. Please try selecting the media again."
            );
          }
        } else {
          const normalizedNativeFile = await normalizeNativeUploadUri(
            finalUri,
            filename,
            mimeType,
            uploadType
          );

          // Native platforms
          formData = new FormData();
          console.log("[Native Upload] Preparing file:", {
            originalUri: uri,
            finalUri,
            normalizedUri: normalizedNativeFile.uri,
            uploadType,
            mimeType,
            filename: normalizedNativeFile.filename,
          });

          formData.append("file", {
            uri: normalizedNativeFile.uri,
            type: mimeType,
            name: normalizedNativeFile.filename,
          } as any);
          formData.append("uploadType", uploadType);

          const nativeUploadUrl = buildAbsoluteUploadUrl(UPLOAD_ENDPOINTS.UPLOAD);
          try {
            onProgress?.(5);

            const response = await fetch(nativeUploadUrl, {
              method: "POST",
              headers: {
                ...(token?.accessToken
                  ? { Authorization: `Bearer ${token.accessToken}` }
                  : {}),
              },
              body: formData,
            });

            const rawBody = await response.text();
            let responseData: UploadResponse | { message?: string; success?: boolean } | null = null;

            try {
              responseData = rawBody ? JSON.parse(rawBody) : null;
            } catch {
              responseData = null;
            }

            onProgress?.(100);

            if ((response.status === 200 || response.status === 201) && responseData && "success" in responseData && responseData.success) {
              return responseData as UploadResponse;
            }

            if (response.status === 413) {
              throw new Error("File too large. Please select a smaller file.");
            }
            if (response.status === 415) {
              throw new Error("Unsupported file type. Please select a different file.");
            }
            if (response.status === 401) {
              throw new Error("Session expired. Please log in again.");
            }
            if (response.status === 429) {
              throw new Error("Upload rate-limited. Please wait and retry.");
            }

            const serverMessage =
              responseData && typeof responseData === "object" && "message" in responseData
                ? responseData.message
                : undefined;

            throw new Error(serverMessage || `Upload failed with status ${response.status}`);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error occurred during native upload";
            throw new Error(message === "Network request failed" ? "Upload failed: Network Error" : message);
          }
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
