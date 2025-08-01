import { useState, useCallback, useEffect } from 'react';
import VideoService from '@/lib/api/videoService';
import { ApiComment } from '@/lib/api/types/video';
import { adaptCommentsForUI, UIComment } from '@/lib/adapters/videoAdapter';

interface UseCommentsOptions {
    videoId: string;
    parentId?: string; // For replies
    initialPageSize?: number;
    autoLoad?: boolean;
}

export default function useComments({
                                        videoId,
                                        parentId,
                                        initialPageSize = 20,
                                        autoLoad = true
                                    }: UseCommentsOptions) {
    // State
    const [comments, setComments] = useState<UIComment[]>([]);
    const [apiComments, setApiComments] = useState<ApiComment[]>([]); // Keep original API data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalComments, setTotalComments] = useState(0);

    // Load comments
    const loadComments = useCallback(async (page: number = 1) => {
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            const response = await VideoService.getComments(
                videoId,
                page,
                initialPageSize,
                parentId
            );

            const newComments = response.comments;
            const uiComments = adaptCommentsForUI(newComments);

            if (page === 1) {
                // Replace all comments
                setApiComments(newComments);
                setComments(uiComments);
            } else {
                // Append to existing comments
                setApiComments(prev => [...prev, ...newComments]);
                setComments(prev => [...prev, ...uiComments]);
            }

            // Update pagination info
            setPage(page);
            setHasMore(page < response.pagination.totalPages);
            setTotalComments(response.pagination.totalItems);
        } catch (err: any) {
            console.error('Error loading comments:', err);
            setError(err.message || 'Failed to load comments');
        } finally {
            setLoading(false);
        }
    }, [videoId, parentId, initialPageSize, loading]);

    // Load more comments
    const loadMoreComments = useCallback(() => {
        if (loading || !hasMore) return;
        loadComments(page + 1);
    }, [loading, hasMore, page, loadComments]);

    // Refresh comments
    const refreshComments = useCallback(() => {
        loadComments(1);
    }, [loadComments]);

    // Add a new comment
    const addComment = useCallback(async (text: string) => {
        if (!text.trim()) return;

        try {
            const response = await VideoService.addComment(videoId, text, parentId);

            // Add the new comment to the beginning of the list
            const newComment = adaptCommentsForUI([response.comment])[0];
            setComments(prev => [newComment, ...prev]);
            setApiComments(prev => [response.comment, ...prev]);

            // Update total count
            setTotalComments(prev => prev + 1);

            return newComment;
        } catch (err: any) {
            console.error('Error adding comment:', err);
            throw err;
        }
    }, [videoId, parentId]);

    // Like a comment (not implemented in API yet)
    const likeComment = useCallback((commentId: string, liked: boolean) => {
        // Update the UI optimistically
        setComments(prev =>
            prev.map(comment =>
                comment.id === commentId
                    ? {
                        ...comment,
                        isLiked: liked,
                        likes: liked ? comment.likes + 1 : Math.max(0, comment.likes - 1)
                    }
                    : comment
            )
        );
    }, []);

    // Auto-load on mount if enabled
    useEffect(() => {
        if (autoLoad) {
            loadComments(1);
        }
    }, [autoLoad, loadComments]);

    return {
        comments,
        loading,
        error,
        hasMore,
        totalComments,
        loadMoreComments,
        refreshComments,
        addComment,
        likeComment
    };
}