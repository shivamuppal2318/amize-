// src/stores/postingStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MediaItem {
    uri: string;
    type: 'photo' | 'video';
    width: number;
    height: number;
    size: number;
    duration?: number; // in milliseconds, only for videos
    timestamp: number;
    isSelected?: boolean;
}

export interface Post {
    soundId: undefined;
    caption: string;
    location?: string;
    visibility: 'public' | 'followers' | 'private';
    allowComments: boolean;
    allowDuets: boolean;
    allowStitch: boolean;
    hashtagIds: string[];
    mentionIds: string[];
    crossPost: {
        whatsapp: boolean;
        facebook: boolean;
        instagram: boolean;
        twitter: boolean;
    };
}

interface PostingState {
    // Media management
    mediaItems: MediaItem[];
    addMedia: (item: MediaItem) => void;
    removeMedia: (uri: string) => void;
    selectMedia: (uri: string, selected: boolean) => void;
    resetMedia: () => void;

    // Draft post management
    draftPost: Post;
    updateCaption: (caption: string) => void;
    updateLocation: (location: string) => void;
    updateVisibility: (visibility: 'public' | 'followers' | 'private') => void;
    toggleComments: () => void;
    toggleDuets: () => void;
    toggleStitch: () => void;
    addHashtag: (id: string) => void;
    removeHashtag: (id: string) => void;
    addMention: (id: string) => void;
    removeMention: (id: string) => void;
    toggleCrossPost: (platform: 'whatsapp' | 'facebook' | 'instagram' | 'twitter') => void;
    resetDraft: () => void;

    // Posting status
    isUploading: boolean;
    uploadProgress: number;
    setUploading: (isUploading: boolean) => void;
    setUploadProgress: (progress: number) => void;
}

// Default draft post settings
const DEFAULT_POST: Post = {
    soundId: undefined,
    caption: '',
    visibility: 'public',
    allowComments: true,
    allowDuets: true,
    allowStitch: true,
    hashtagIds: [],
    mentionIds: [],
    crossPost: {
        whatsapp: false,
        facebook: false,
        instagram: false,
        twitter: false,
    }
};

export const usePostingStore = create<PostingState>()(
    persist(
        (set) => ({
            // Media items
            mediaItems: [],
            addMedia: (item) => set((state) => ({
                mediaItems: [...state.mediaItems, item]
            })),
            removeMedia: (uri) => set((state) => ({
                mediaItems: state.mediaItems.filter(item => item.uri !== uri)
            })),
            selectMedia: (uri, selected) => set((state) => ({
                mediaItems: state.mediaItems.map(item =>
                    item.uri === uri ? { ...item, isSelected: selected } : item
                )
            })),
            resetMedia: () => set({ mediaItems: [] }),

            // Draft post
            draftPost: DEFAULT_POST,
            updateCaption: (caption) => set((state) => ({
                draftPost: { ...state.draftPost, caption }
            })),
            updateLocation: (location) => set((state) => ({
                draftPost: { ...state.draftPost, location }
            })),
            updateVisibility: (visibility) => set((state) => ({
                draftPost: { ...state.draftPost, visibility }
            })),
            toggleComments: () => set((state) => ({
                draftPost: {
                    ...state.draftPost,
                    allowComments: !state.draftPost.allowComments
                }
            })),
            toggleDuets: () => set((state) => ({
                draftPost: {
                    ...state.draftPost,
                    allowDuets: !state.draftPost.allowDuets
                }
            })),
            toggleStitch: () => set((state) => ({
                draftPost: {
                    ...state.draftPost,
                    allowStitch: !state.draftPost.allowStitch
                }
            })),
            addHashtag: (id) => set((state) => ({
                draftPost: {
                    ...state.draftPost,
                    hashtagIds: state.draftPost.hashtagIds.includes(id)
                        ? state.draftPost.hashtagIds
                        : [...state.draftPost.hashtagIds, id]
                }
            })),
            removeHashtag: (id) => set((state) => ({
                draftPost: {
                    ...state.draftPost,
                    hashtagIds: state.draftPost.hashtagIds.filter(tagId => tagId !== id)
                }
            })),
            addMention: (id) => set((state) => ({
                draftPost: {
                    ...state.draftPost,
                    mentionIds: state.draftPost.mentionIds.includes(id)
                        ? state.draftPost.mentionIds
                        : [...state.draftPost.mentionIds, id]
                }
            })),
            removeMention: (id) => set((state) => ({
                draftPost: {
                    ...state.draftPost,
                    mentionIds: state.draftPost.mentionIds.filter(mentionId => mentionId !== id)
                }
            })),
            toggleCrossPost: (platform) => set((state) => ({
                draftPost: {
                    ...state.draftPost,
                    crossPost: {
                        ...state.draftPost.crossPost,
                        [platform]: !state.draftPost.crossPost[platform]
                    }
                }
            })),
            resetDraft: () => set({ draftPost: DEFAULT_POST }),

            // Upload status
            isUploading: false,
            uploadProgress: 0,
            setUploading: (isUploading) => set({ isUploading }),
            setUploadProgress: (uploadProgress) => set({ uploadProgress }),
        }),
        {
            name: 'posting-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Only persist draft post and selected media
                draftPost: state.draftPost,
                mediaItems: state.mediaItems,
            }),
        }
    )
);