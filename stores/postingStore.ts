import { create } from 'zustand';

export type MediaType = 'photo' | 'video';
export type PostVisibility = 'public' | 'followers' | 'private';

export interface MediaItem {
    id?: string;
    uri: string;
    type: MediaType;
    width: number;
    height: number;
    size: number;
    duration?: number;
    timestamp?: number;
    assetId?: string;
    soundId?: string;
    selectedSongId?: string;
    postSong?: string;
    songTitle?: string;
}

export interface CrossPostSettings {
    whatsapp: boolean;
    facebook: boolean;
    instagram: boolean;
    twitter: boolean;
}

export interface DraftPost {
    caption: string;
    location: string;
    visibility: PostVisibility;
    allowComments: boolean;
    allowDuets: boolean;
    allowStitch: boolean;
    crossPost: CrossPostSettings;
}

interface PostingStoreState {
    mediaItems: MediaItem[];
    draftPost: DraftPost;
    isUploading: boolean;
    uploadProgress: number;
    addMedia: (item: MediaItem) => void;
    removeMedia: (index: number) => void;
    updateMedia: (index: number, updates: Partial<MediaItem>) => void;
    resetMedia: () => void;
    updateCaption: (caption: string) => void;
    updateLocation: (location: string) => void;
    updateVisibility: (visibility: PostVisibility) => void;
    toggleComments: () => void;
    toggleDuets: () => void;
    toggleStitch: () => void;
    toggleCrossPost: (platform: keyof CrossPostSettings) => void;
    setUploading: (isUploading: boolean) => void;
    setUploadProgress: (progress: number) => void;
    resetDraft: () => void;
}

const DEFAULT_DRAFT_POST: DraftPost = {
    caption: '',
    location: '',
    visibility: 'public',
    allowComments: true,
    allowDuets: true,
    allowStitch: true,
    crossPost: {
        whatsapp: false,
        facebook: false,
        instagram: false,
        twitter: false,
    },
};

export const usePostingStore = create<PostingStoreState>((set) => ({
    mediaItems: [],
    draftPost: DEFAULT_DRAFT_POST,
    isUploading: false,
    uploadProgress: 0,
    addMedia: (item) =>
        set((state) => ({
            mediaItems: [
                ...state.mediaItems,
                {
                    ...item,
                    id: item.id ?? `media-${Date.now()}-${state.mediaItems.length}`,
                },
            ],
        })),
    removeMedia: (index) =>
        set((state) => ({
            mediaItems: state.mediaItems.filter((_, itemIndex) => itemIndex !== index),
        })),
    updateMedia: (index, updates) =>
        set((state) => ({
            mediaItems: state.mediaItems.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...updates } : item
            ),
        })),
    resetMedia: () =>
        set({
            mediaItems: [],
            draftPost: DEFAULT_DRAFT_POST,
            isUploading: false,
            uploadProgress: 0,
        }),
    updateCaption: (caption) =>
        set((state) => ({
            draftPost: { ...state.draftPost, caption },
        })),
    updateLocation: (location) =>
        set((state) => ({
            draftPost: { ...state.draftPost, location },
        })),
    updateVisibility: (visibility) =>
        set((state) => ({
            draftPost: { ...state.draftPost, visibility },
        })),
    toggleComments: () =>
        set((state) => ({
            draftPost: {
                ...state.draftPost,
                allowComments: !state.draftPost.allowComments,
            },
        })),
    toggleDuets: () =>
        set((state) => ({
            draftPost: {
                ...state.draftPost,
                allowDuets: !state.draftPost.allowDuets,
            },
        })),
    toggleStitch: () =>
        set((state) => ({
            draftPost: {
                ...state.draftPost,
                allowStitch: !state.draftPost.allowStitch,
            },
        })),
    toggleCrossPost: (platform) =>
        set((state) => ({
            draftPost: {
                ...state.draftPost,
                crossPost: {
                    ...state.draftPost.crossPost,
                    [platform]: !state.draftPost.crossPost[platform],
                },
            },
        })),
    setUploading: (isUploading) => set({ isUploading }),
    setUploadProgress: (uploadProgress) => set({ uploadProgress }),
    resetDraft: () => set({ draftPost: DEFAULT_DRAFT_POST }),
}));
