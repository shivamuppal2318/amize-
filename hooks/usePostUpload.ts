import { useState } from 'react';
import { useRouter } from 'expo-router';
import { MediaItem, usePostingStore } from '@/stores/postingStore';
import { useToast } from '@/hooks/useToast';
import { usePostApi } from '@/lib/api/postApi';
import { useUploadApi } from '@/hooks/useUploadApi';
import { captureException } from '@/utils/errorReporting';
import { sanitizeMediaUri } from '@/utils/mediaHelpers';

interface UsePostUploadProps {
    createAsSlideshow?: boolean;
    slideDuration?: number;
    transition?: string;
}

export function usePostUpload({
                                  createAsSlideshow = false,
                                  slideDuration = 3,
                                  transition = 'fade'
                              }: UsePostUploadProps = {}) {
    const router = useRouter();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        mediaItems,
        draftPost,
        setUploading,
        setUploadProgress,
        isUploading
    } = usePostingStore();

    const { createPost, createMultiplePosts, createSlideshow } = usePostApi();
    const { uploadMultipleFiles } = useUploadApi();

    const submitPost = async () => {
        if (mediaItems.length === 0) {
            toast.show('Error', 'No media selected');
            return false;
        }

        if (isUploading) {
            toast.show('Upload in Progress', 'Please wait for the current upload to complete');
            return false;
        }

        setIsSubmitting(true);
        setUploading(true);
        setUploadProgress(0);

        try {
            // Prepare files for upload with sanitized URIs
            const filesToUpload = mediaItems.map((media, index) => {
                const sanitizedUri = sanitizeMediaUri(media.uri);
                return {
                    uri: sanitizedUri,
                    name: sanitizedUri.split('/').pop() || `media_${index}.${media.type === 'photo' ? 'jpg' : 'mp4'}`,
                    type: media.type === 'photo' ? 'image/jpeg' : 'video/mp4',
                    uploadType: media.type === 'photo' ? 'THUMBNAIL' : 'VIDEO' as 'THUMBNAIL' | 'VIDEO',
                };
            });

            // Upload all media files
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
                throw new Error('No files were uploaded successfully');
            }

            // Create posts based on upload type
            if (mediaItems.length === 1 && mediaItems[0].type === 'video') {
                // Single video post
                const uploadId = uploadResults[0].upload.id;
                const postData = {
                    uploadId,
                    title: draftPost.caption || undefined,
                    description: draftPost.location || undefined,
                    soundId: draftPost.soundId || undefined,
                    isPublic: draftPost.visibility === 'public'
                };

                await createPost(postData);
                toast.show('Success', 'Video posted successfully!');
            } else if (mediaItems.every(item => item.type === 'photo')) {
                // For multiple photos, check if we're creating a slideshow or individual posts
                if (mediaItems.length > 1 && createAsSlideshow) {
                    // Create a slideshow
                    const uploadIds = uploadResults.map(result => result.upload.id);
                    const slideshowData = {
                        uploadIds,
                        title: draftPost.caption || 'Slideshow',
                        description: draftPost.location || undefined,
                        soundId: draftPost.soundId || undefined,
                        slideDuration: slideDuration,
                        transition: transition,
                        isPublic: draftPost.visibility === 'public'
                    };

                    await createSlideshow(slideshowData);
                    toast.show('Success', 'Slideshow created successfully!');
                } else {
                    // Create individual posts
                    const postData = {
                        title: draftPost.caption || undefined,
                        description: draftPost.location || undefined,
                        isPublic: draftPost.visibility === 'public'
                    };

                    const uploadIds = uploadResults.map(result => result.upload.id);
                    await createMultiplePosts(uploadIds, postData);

                    toast.show('Success', `${uploadResults.length} posts created successfully!`);
                }
            } else {
                // Mixed media - handle based on your business logic
                toast.show('Error', 'Mixed media types not supported yet');
                setUploading(false);
                return false;
            }

            // Handle cross-posting if enabled
            if (draftPost.crossPost.whatsapp || draftPost.crossPost.facebook ||
                draftPost.crossPost.instagram || draftPost.crossPost.twitter) {
                // TODO: Implement cross-posting logic
                console.log('Cross-posting enabled for:', draftPost.crossPost);
            }

            // Clear posting store and navigate back
            setUploading(false);
            router.replace('/(tabs)');
            return true;

        } catch (error) {
            console.error('Error submitting post:', error);

            captureException(error instanceof Error ? error : new Error(String(error)), {
                tags: { screen: 'post_editor', action: 'submit_post' }
            });
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.show('Upload Failed', errorMessage);
            setUploading(false);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        submitPost,
        isSubmitting,
        isUploading
    };
}