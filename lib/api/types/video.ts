export interface ApiUser {
    id: string;
    username: string;
    profilePhotoUrl: string | null;
    fullName?: string;
    bio?: string;
    creatorVerified: boolean;
}

export interface MixedFeedItem {
    id: string;
    type: 'video' | 'user' | 'sound';
    aspectRatio: '1:1' | '1:2' | '2:3' | '9:16' | '2:1';
    priority: number;
    data: any;
}

export interface ApiSound {
    id: string;
    title: string;
    artistName: string | null;
    soundUrl: string;
    duration: number;
}

export interface ApiVideo {
    id: string;
    title: string | null;
    description: string | null;
    videoUrl: string;
    thumbnailUrl: string | null;
    duration: number;
    isPublic: boolean;
    user: ApiUser;
    sound: ApiSound | null;
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
    hasLiked?: boolean;
    createdAt: string;
    updatedAt: string;
}

// Response types
export interface ApiSuccessResponse {
    success: boolean;
}

// Page-based pagination (legacy)
export interface ApiPaginatedResponse<T> {
    success: boolean;
    videos: T[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

// NEW: Cursor-based pagination for feed endpoints
export interface ApiCursorPaginatedResponse<T> {
    success: boolean;
    videos: T[];
    pagination: {
        nextCursor: string | null;
        limit: number;
    };
    message?: string; // Added this property as optional for empty state messages
}

// Single video response
export interface ApiVideoResponse {
    success: boolean;
    video: ApiVideo;
}

// Like response
export interface ApiLikeResponse {
    success: boolean;
    message: string;
    liked: boolean;
    likesCount: number;
}

// View request
export interface ApiViewRequest {
    watchTime: number;
    completionRate?: number;
}

// Comment response types
export interface ApiComment {
    id: string;
    text: string;
    userId: string;
    videoId: string;
    parentId: string | null;
    user: ApiUser;
    likesCount: number;
    repliesCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ApiCommentsResponse {
    success: boolean;
    comments: ApiComment[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

export interface ApiCommentRequest {
    text: string;
    parentId?: string;
}

export interface ApiCommentResponse {
    success: boolean;
    message: string;
    comment: ApiComment;
}

// Share request types
export type ApiSharePlatform = 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'copy_link' | 'other';

export interface ApiShareRequest {
    platform: ApiSharePlatform;
}

export interface ApiShareResponse {
    success: boolean;
    message: string;
    sharesCount: number;
}

// Subscription info (for premium videos)
export interface ApiSubscriptionInfo {
    planName: string;
    subscribedSince: string;
    expiresAt: string | null;
}