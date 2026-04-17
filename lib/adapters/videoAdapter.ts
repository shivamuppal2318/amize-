import { ApiComment, ApiSound, ApiVideo } from '../api/types/video';
import { VideoItemData } from '@/components/VideoFeed/VideoItem';

const FALLBACK_VIDEO_URLS = [
    'https://videos.pexels.com/video-files/6646665/6646665-hd_1080_1920_24fps.mp4',
    'https://videos.pexels.com/video-files/6624853/6624853-uhd_1440_2560_30fps.mp4',
    'https://videos.pexels.com/video-files/8344235/8344235-uhd_1440_2560_25fps.mp4',
    'https://videos.pexels.com/video-files/3099415/3099415-uhd_2560_1440_30fps.mp4',
    'https://videos.pexels.com/video-files/7247861/7247861-hd_1080_1920_30fps.mp4',
];

const FALLBACK_POSTER_URLS = [
    'https://images.pexels.com/photos/31313204/pexels-photo-31313204/free-photo-of-charming-narrow-street-in-gorlitz-germany.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/30910224/pexels-photo-30910224/free-photo-of-delicious-chocolate-cake-with-pistachios.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load',
    'https://images.pexels.com/photos/31085625/pexels-photo-31085625/free-photo-of-small-bird-perched-on-wire-against-soft-background.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/29957631/pexels-photo-29957631/free-photo-of-serene-evening-coffee-in-golden-light.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load',
    'https://images.pexels.com/photos/31249687/pexels-photo-31249687/free-photo-of-elegant-coffee-and-dessert-display-in-cafe.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load',
];

const pickFallbackById = (id: string, values: string[]) => {
    const seed = id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
    return values[seed % values.length];
};

const isPlaceholderMediaUrl = (value?: string | null) => {
    if (!value) {
        return true;
    }

    const normalized = value.trim().toLowerCase();
    return (
        !normalized ||
        normalized.includes('example.com/videos') ||
        normalized.includes('example.com/thumbnails') ||
        normalized.includes('via.placeholder.com')
    );
};

const resolveVideoUrl = (apiVideo: ApiVideo) => {
    if (isPlaceholderMediaUrl(apiVideo.videoUrl)) {
        return pickFallbackById(apiVideo.id, FALLBACK_VIDEO_URLS);
    }

    return apiVideo.videoUrl;
};

const resolvePosterUrl = (apiVideo: ApiVideo) => {
    if (isPlaceholderMediaUrl(apiVideo.thumbnailUrl)) {
        return pickFallbackById(apiVideo.id, FALLBACK_POSTER_URLS);
    }

    return apiVideo.thumbnailUrl as string;
};

/**
 * Format a timestamp string to a relative time (e.g. "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Convert to seconds
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';

    // Convert to minutes
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;

    // Convert to hours
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;

    // Convert to days
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;

    // Convert to weeks
    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 4) return `${diffWeek} ${diffWeek === 1 ? 'week' : 'weeks'} ago`;

    // Use month and day for older dates
    return date.toLocaleDateString();
};

/**
 * Transform an API sound object to a format compatible with the VideoItem component
 */
export const adaptSoundForUI = (sound: ApiSound | null): { id: string; name: string } => {
    if (!sound) {
        return { id: 'original', name: 'Original Sound' };
    }

    return {
        id: sound.id,
        name: sound.artistName
            ? `${sound.title} - ${sound.artistName}`
            : sound.title
    };
};

/**
 * Transform an API video object to a format compatible with the VideoItem component
 */
export const adaptVideoForUI = (apiVideo: ApiVideo): VideoItemData => {
    const posterUrl = resolvePosterUrl(apiVideo);
    const videoUrl = resolveVideoUrl(apiVideo);

    return {
        id: apiVideo.id,
        title: apiVideo.title || '',
        user: {
            id: apiVideo.user.id,
            username: apiVideo.user.username,
            name: apiVideo.user.fullName || apiVideo.user.username,
            avatar: apiVideo.user.profilePhotoUrl ||
                'https://via.placeholder.com/150/333333/FFFFFF/?text=User',
            verified: apiVideo.user.creatorVerified || false,
            followerCount: 0  // This isn't provided by the API ye
        },
        video: {
            uri: videoUrl,
            poster: posterUrl,
            aspectRatio: 9/16  // Default vertical video aspect ratio
        },
        description: apiVideo.description || '',
        likeCount: apiVideo.likesCount,
        commentCount: apiVideo.commentsCount,
        shareCount: apiVideo.sharesCount,
        bookmarkCount: 0,  // Not implemented in API yet
        timestamp: formatRelativeTime(apiVideo.createdAt),
        music: adaptSoundForUI(apiVideo.sound)
    };
};

/**
 * Convert API videos array to UI-compatible format
 */
export const adaptVideosForUI = (apiVideos: ApiVideo[]): VideoItemData[] => {
    return apiVideos.map(video => adaptVideoForUI(video));
};

/**
 * Transform API comment to UI-compatible format
 */
export interface UIComment {
    id: string;
    user: {
        id: string;
        username: string;
        avatar: string;
        verified: boolean;
    };
    text: string;
    likes: number;
    isLiked: boolean;
    timestamp: string;
    repliesCount: number;
    parentId?: string | null;
}

export const adaptCommentForUI = (apiComment: ApiComment): UIComment => {
    return {
        id: apiComment.id,
        user: {
            id: apiComment.user.id,
            username: apiComment.user.username,
            avatar: apiComment.user.profilePhotoUrl ||
                'https://via.placeholder.com/150/333333/FFFFFF/?text=User',
            verified: apiComment.user.creatorVerified || false,
        },
        text: apiComment.text,
        likes: apiComment.likesCount,
        isLiked: false, // API doesn't provide this yet
        timestamp: formatRelativeTime(apiComment.createdAt),
        repliesCount: apiComment.repliesCount,
        parentId: apiComment.parentId
    };
};

export const adaptCommentsForUI = (apiComments: ApiComment[]): UIComment[] => {
    return apiComments.map(comment => adaptCommentForUI(comment));
};
