import { useState } from "react";
import { useRouter } from "expo-router";
import { Platform } from "react-native";
import { MediaItem, usePostingStore } from "@/stores/postingStore";
import { useToast } from "@/hooks/useToast";
import { usePostApi } from "@/lib/api/postApi";
import { useUploadApi } from "@/hooks/useUploadApi";
import { captureException } from "@/utils/errorReporting";
import { sanitizeMediaUri } from "@/utils/mediaHelpers";

interface UsePostUploadProps {
  createAsSlideshow?: boolean;
  slideDuration?: number;
  transition?: string;
  postMode?: "post" | "story";
}

export function usePostUpload({
  createAsSlideshow = false,
  slideDuration = 3,
  transition = "fade",
  postMode = "post",
}: UsePostUploadProps = {}) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    mediaItems,
    draftPost,
    setUploading,
    setUploadProgress,
    isUploading,
    resetMedia,
  } = usePostingStore();

  const { createPost, createMultiplePosts, createSlideshow } = usePostApi();
  const { uploadMultipleFiles } = useUploadApi();
  const uploadIdPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const resolveMimeType = (media: MediaItem) => {
    const lowerUri = media.uri.toLowerCase();
    const providedMime = media.mimeType?.toLowerCase();

    if (media.type === "video") {
      if (providedMime?.startsWith("video/") && providedMime !== "application/octet-stream") {
        return providedMime;
      }
      if (lowerUri.endsWith(".mov")) return "video/quicktime";
      if (lowerUri.endsWith(".webm")) return "video/webm";
      return "video/mp4";
    }

    if (providedMime?.startsWith("image/")) {
      return providedMime;
    }
    if (lowerUri.endsWith(".png")) return "image/png";
    if (lowerUri.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
  };

  const finalizeSuccessfulPost = () => {
    setUploading(false);
    setUploadProgress(100);
    resetMedia();
    router.replace("/(tabs)");
  };

  const submitPost = async () => {
    if (mediaItems.length === 0) {
      toast.show("Error", "No media selected");
      return false;
    }
  
    if (isUploading) {
      toast.show(
        "Upload in Progress",
        "Please wait for the current upload to complete"
      );
      return false;
    }
  
    setIsSubmitting(true);
    setUploading(true);
    setUploadProgress(0);
  
    try {
      // Pick soundId from mediaItems directly (video → photo priority)
      const mediaSoundId =
        mediaItems.find((m) => m.soundId)?.soundId ||
        mediaItems.find((m) => m.selectedSongId)?.selectedSongId ||
        undefined;
  
      // Backend validates soundId as UUID. Avoid sending non-UUID values (causes 400 "Validation error").
      const soundId =
        typeof mediaSoundId === "string" && uploadIdPattern.test(mediaSoundId)
          ? mediaSoundId
          : undefined;
      if (mediaSoundId && !soundId) {
        console.log(
          "🎵 Ignoring non-UUID soundId (backend requires UUID):",
          mediaSoundId
        );
      }

      console.log("🎵 FINAL soundId chosen from mediaItems:", soundId);
  
      const filesToUpload = mediaItems.map((media, index) => {
        const sanitizedUri = sanitizeMediaUri(media.uri);
        const mimeType = resolveMimeType(media);
        return {
          uri: sanitizedUri,
          name:
            media.uri.split("/").pop() ||
            `media_${index}.${media.type === "photo" ? "jpg" : "mp4"}`,
          type: mimeType,
          // The current backend accepts images for PROFILE_PHOTO but rejects
          // images sent as OTHER. Slideshow creation only needs completed image
          // uploads, so PROFILE_PHOTO is the safest image-capable upload type.
          uploadType: (media.type === "photo" ? "PROFILE_PHOTO" : "VIDEO") as
            | "PROFILE_PHOTO"
            | "VIDEO",
          // Pass web File object if available
          ...(media.webFile && { webFile: media.webFile }),
        };
      });
  
      console.log("Starting file upload with:", filesToUpload);
  
      const uploadResults = await uploadMultipleFiles(
        filesToUpload,
        (progress) => {
          console.log("Upload progress:", progress);
          setUploadProgress(progress);
        }
      );
  
      console.log("Upload results:", uploadResults);
  
      if (uploadResults.length === 0) {
        throw new Error("No files were uploaded successfully");
      }

      const hasBackendReadyUploads = uploadResults.every((result) =>
        uploadIdPattern.test(result.upload.id)
      );

      if (!hasBackendReadyUploads) {
        if (Platform.OS === "web") {
          toast.show(
            "Web Preview Only",
            "Web preview can select media, but real post creation requires the Android app build."
          );
          setUploading(false);
          router.replace("/(tabs)");
          return true;
        }

        throw new Error(
          "Upload did not return a valid server file reference. Please try again."
        );
      }
  
      // ---------------------------------------------------------------------
      //  SINGLE VIDEO POST
      // ---------------------------------------------------------------------
      if (mediaItems.length === 1 && mediaItems[0].type === "video") {
        const uploadId = uploadResults[0].upload.id;
  
        const postData = {
          uploadId,
          title: draftPost.caption || undefined,
          description: draftPost.location || undefined,
          soundId,
          isPublic: draftPost.visibility === "public",
        };
  
        console.log("📤 createPost VIDEO payload:", postData);
  
        await createPost(postData);
        toast.show(
          "Success",
          postMode === "story" ? "Story shared successfully!" : "Video posted successfully!"
        );
      }
  
      // ---------------------------------------------------------------------
      //  MULTIPLE PHOTOS → SLIDESHOW OR MULTI POST
      // ---------------------------------------------------------------------
      else if (mediaItems.every((item) => item.type === "photo")) {
        // Backend is video-first. Treat any photo selection as a slideshow/video post.
        const uploadIds = uploadResults.map((u) => u.upload.id);

        const slideshowData = {
          uploadIds,
          title: draftPost.caption || "Photo post",
          description: draftPost.location || undefined,
          soundId,
          photoFilters: mediaItems.map((item) =>
            item.type === "photo" ? item.filterName || "none" : "none"
          ),
          slideDuration,
          transition,
          isPublic: draftPost.visibility === "public",
        };

        console.log("createSlideshow payload:", slideshowData);

        await createSlideshow(slideshowData);
        toast.show(
          "Success",
          postMode === "story" ? "Story shared successfully!" : "Posted successfully!"
        );
      }
  
      // ---------------------------------------------------------------------
      // MIXED MEDIA NOT SUPPORTED
      // ---------------------------------------------------------------------
      else {
        toast.show("Error", "Mixed media types not supported yet");
        setUploading(false);
        return false;
      }
  
      // CORS POSTING
      if (
        draftPost.crossPost.whatsapp ||
        draftPost.crossPost.facebook ||
        draftPost.crossPost.instagram ||
        draftPost.crossPost.twitter
      ) {
        console.log("Cross-posting enabled for:", draftPost.crossPost);
      }
  
      finalizeSuccessfulPost();
      return true;
    } catch (error) {
      console.error("Error submitting post:", error);
  
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.show("Upload Failed", errorMessage);
  
      setUploading(false);
      setUploadProgress(0);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return {
    submitPost,
    isSubmitting,
    isUploading,
  };
}
