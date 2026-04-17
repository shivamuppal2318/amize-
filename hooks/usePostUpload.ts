import { useState } from "react";
import { useRouter } from "expo-router";
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
  } = usePostingStore();

  const { createPost, createMultiplePosts, createSlideshow } = usePostApi();
  const { uploadMultipleFiles } = useUploadApi();

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
  
      console.log("🎵 FINAL soundId chosen from mediaItems:", mediaSoundId);
  
const filesToUpload = mediaItems.map((media, index) => {
        const sanitizedUri = sanitizeMediaUri(media.uri);
        return {
          uri: sanitizedUri,
          name:
            media.uri.split("/").pop() ||
            `media_${index}.${media.type === "photo" ? "jpg" : "mp4"}`,
          type: media.type === "photo" ? "image/jpeg" : "video/mp4",
          uploadType: (media.type === "photo" ? "THUMBNAIL" : "VIDEO") as
            | "THUMBNAIL"
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
  
      // ---------------------------------------------------------------------
      //  SINGLE VIDEO POST
      // ---------------------------------------------------------------------
      if (mediaItems.length === 1 && mediaItems[0].type === "video") {
        const uploadId = uploadResults[0].upload.id;
  
        const postData = {
          uploadId,
          title: draftPost.caption || undefined,
          description: draftPost.location || undefined,
          soundId: mediaSoundId, // ✅ FIXED here
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
        if (mediaItems.length > 1 && createAsSlideshow) {
          const uploadIds = uploadResults.map((u) => u.upload.id);
  
          const slideshowData = {
            uploadIds,
            title: draftPost.caption || "Slideshow",
            description: draftPost.location || undefined,
            soundId: mediaSoundId, // ✅ FIXED here
            slideDuration,
            transition,
            isPublic: draftPost.visibility === "public",
          };
  
          console.log("📤 createSlideshow payload:", slideshowData);
  
          await createSlideshow(slideshowData);
          toast.show(
            "Success",
            postMode === "story" ? "Story shared successfully!" : "Slideshow created successfully!"
          );
        } else {
          const uploadIds = uploadResults.map((u) => u.upload.id);
  
          const postData = {
            title: draftPost.caption || undefined,
            description: draftPost.location || undefined,
            soundId: mediaSoundId, // ✅ FIXED here
            isPublic: draftPost.visibility === "public",
          };
  
          console.log("📤 createMultiplePosts payload:", uploadIds, postData);
  
          await createMultiplePosts(uploadIds, postData);
          toast.show(
            "Success",
            postMode === "story"
              ? "Story shared successfully!"
              : `${uploadResults.length} posts created successfully!`
          );
        }
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
  
      setUploading(false);
      router.replace("/(tabs)");
      return true;
    } catch (error) {
      console.error("Error submitting post:", error);
  
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.show("Upload Failed", errorMessage);
  
      setUploading(false);
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
