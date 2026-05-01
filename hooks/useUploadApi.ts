import { useState, useCallback } from "react";
import {
  uploadService,
  FileUploadOptions,
  UploadResponse,
} from "@/lib/api/uploadService";
import { useToast } from "@/hooks/useToast";

interface UploadProgress {
  [key: string]: number;
}

export const useUploadApi = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const toast = useToast();

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(
    async (options: FileUploadOptions): Promise<UploadResponse> => {
      const fileId = `${Date.now()}-${Math.random()}`;

      try {
        setIsUploading(true);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        const result = await uploadService.uploadFile({
          ...options,
          onProgress: (progress) => {
            setUploadProgress((prev) => ({ ...prev, [fileId]: progress }));
            if (options.onProgress) {
              options.onProgress(progress);
            }
          },
        });

        // Clean up progress for this file
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

        return result;
      } catch (error) {
        // Clean up progress on error
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        toast.show("Upload Error", errorMessage);
        throw error;
      } finally {
        // Check if any uploads are still in progress
        setUploadProgress((prev) => {
          const hasActiveUploads = Object.keys(prev).length > 0;
          if (!hasActiveUploads) {
            setIsUploading(false);
          }
          return prev;
        });
      }
    },
    [toast]
  );

  /**
   * Upload multiple files with progress tracking
   */
  const uploadMultipleFiles = useCallback(
    async (
      files: FileUploadOptions[],
      onOverallProgress?: (progress: number) => void
    ): Promise<UploadResponse[]> => {
      if (files.length === 0) {
        throw new Error("No files to upload");
      }

      setIsUploading(true);
      const results: UploadResponse[] = [];
      const errors: Error[] = [];
      const fileProgresses: { [key: number]: number } = {};

      // Initialize progress for all files
      files.forEach((_, index) => {
        fileProgresses[index] = 0;
      });

      // Calculate overall progress
      const updateOverallProgress = () => {
        if (!files || files.length === 0) {
          if (onOverallProgress) onOverallProgress(0);
          return;
        }

        const totalProgress = Object.values(fileProgresses).reduce(
          (sum, progress) => {
            const clampedProgress = Math.max(0, Math.min(progress, 100));
            return sum + clampedProgress;
          },
          0
        );

        const overallProgress = Math.min(
          Math.round(totalProgress / files.length),
          100
        );

        if (onOverallProgress) {
          onOverallProgress(overallProgress);
        }
      };

      // Upload files in parallel with a concurrency limit
      const CONCURRENT_UPLOADS = 3;
      const uploadQueue = [...files];
      const activeUploads: Promise<void>[] = [];

      const processUpload = async (file: FileUploadOptions, index: number) => {
        try {
          const result = await uploadFile({
            ...file,
            onProgress: (progress) => {
              fileProgresses[index] = progress;
              updateOverallProgress();
            },
          });
          results[index] = result;
        } catch (error) {
          errors.push(error as Error);
          fileProgresses[index] = 0; // Reset progress on error
          updateOverallProgress();
        }
      };

      // Process uploads with concurrency control
      let fileIndex = 0;
      while (uploadQueue.length > 0 || activeUploads.length > 0) {
        // Start new uploads if we have capacity
        while (
          activeUploads.length < CONCURRENT_UPLOADS &&
          uploadQueue.length > 0
        ) {
          const file = uploadQueue.shift()!;
          const currentIndex = fileIndex++;
          const uploadPromise = processUpload(file, currentIndex).then(() => {
            // Remove from active uploads when done
            const promiseIndex = activeUploads.indexOf(uploadPromise);
            if (promiseIndex > -1) {
              activeUploads.splice(promiseIndex, 1);
            }
          });
          activeUploads.push(uploadPromise);
        }

        // Wait for at least one upload to complete
        if (activeUploads.length > 0) {
          await Promise.race(activeUploads);
        }
      }

      setIsUploading(false);

      // Handle errors
      if (errors.length > 0) {
        if (errors.length === files.length) {
          // All uploads failed
          throw errors[0] || new Error("All uploads failed");
        } else {
          // Some uploads failed
          toast.show(
            "Partial Upload Success",
            `${results.filter((r) => r).length} of ${
              files.length
            } files uploaded successfully`
          );
        }
      }

      return results.filter((result) => result !== undefined);
    },
    [uploadFile, toast]
  );

  /**
   * Get list of user's uploads
   */
  const getUploads = useCallback(
    async (params?: {
      uploadType?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) => {
      try {
        return await uploadService.getUploads(params);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch uploads";
        toast.show("Error", errorMessage);
        throw error;
      }
    },
    [toast]
  );

  /**
   * Get upload details by ID
   */
  const getUploadById = useCallback(
    async (id: string) => {
      try {
        return await uploadService.getUploadById(id);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch upload details";
        toast.show("Error", errorMessage);
        throw error;
      }
    },
    [toast]
  );

  /**
   * Delete an upload
   */
  const deleteUpload = useCallback(
    async (id: string) => {
      try {
        const result = await uploadService.deleteUpload(id);
        toast.show("Success", "Upload deleted successfully");
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete upload";
        toast.show("Error", errorMessage);
        throw error;
      }
    },
    [toast]
  );

  /**
   * Get current overall upload progress (0-100)
   */
  const getOverallProgress = useCallback(() => {
    const progressValues = Object.values(uploadProgress);
    if (progressValues.length === 0) return 0;

    const totalProgress = progressValues.reduce(
      (sum, progress) => sum + progress,
      0
    );
    return Math.round(totalProgress / progressValues.length);
  }, [uploadProgress]);

  return {
    uploadFile,
    uploadMultipleFiles,
    getUploads,
    getUploadById,
    deleteUpload,
    isUploading,
    uploadProgress,
    getOverallProgress,
  };
};
