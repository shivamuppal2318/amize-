import { useState, useCallback, useEffect, useRef } from "react";
import VideoService from "@/lib/api/videoService";
import { ApiComment } from "@/lib/api/types/video";
import { adaptCommentsForUI, UIComment } from "@/lib/adapters/videoAdapter";

interface UseCommentsOptions {
  videoId: string;
  parentId?: string;
  initialPageSize?: number;
  autoLoad?: boolean;
}

export default function useComments({
  videoId,
  parentId,
  initialPageSize = 20,
  autoLoad = true,
}: UseCommentsOptions) {
  const [comments, setComments] = useState<UIComment[]>([]);
  const [apiComments, setApiComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(false); // only true first time
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);

  // track if we already showed loading for this video
  const initialLoaded = useRef(false);

  const fetchComments = useCallback(
    async (page: number = 1) => {
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
          setApiComments(newComments);
          setComments(uiComments);
        } else {
          setApiComments((prev) => [...prev, ...newComments]);
          setComments((prev) => [...prev, ...uiComments]);
        }

        setPage(page);
        setHasMore(page < response.pagination.totalPages);
        setTotalComments(response.pagination.totalItems);

        initialLoaded.current = true;
      } catch (err: any) {
        console.error("Error loading comments:", err);
        setError(err.message || "Failed to load comments");
      }
    },
    [videoId, parentId, initialPageSize]
  );

  const loadComments = useCallback(
    async (page: number = 1) => {
      // show loader ONLY the very first time
      if (!initialLoaded.current) {
        setLoading(true);
        await fetchComments(page);
        setLoading(false);
      } else {
        // silent background refresh
        fetchComments(page);
      }
    },
    [fetchComments]
  );

  const loadMoreComments = useCallback(() => {
    if (loading || !hasMore) return;
    loadComments(page + 1);
  }, [loading, hasMore, page, loadComments]);

  const refreshComments = useCallback(() => {
    loadComments(1);
  }, [loadComments]);

  const addComment = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        const response = await VideoService.addComment(videoId, text, parentId);
        const newComment = adaptCommentsForUI([response.comment])[0];

        setComments((prev) => [newComment, ...prev]);
        setApiComments((prev) => [response.comment, ...prev]);
        setTotalComments((prev) => prev + 1);

        return newComment;
      } catch (err: any) {
        console.error("Error adding comment:", err);
        throw err;
      }
    },
    [videoId, parentId]
  );

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await VideoService.deleteComment(videoId, commentId);

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setApiComments((prev) =>
        prev.filter((comment) => comment.id !== commentId)
      );
      setTotalComments((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      throw err;
    }
  }, [videoId]);

  const likeComment = useCallback((commentId: string, liked: boolean) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: liked,
              likes: liked ? comment.likes + 1 : Math.max(0, comment.likes - 1),
            }
          : comment
      )
    );
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadComments(1);
    }
  }, [autoLoad, loadComments]);

  return {
    comments,
    loading, // true only on first visit
    error,
    hasMore,
    totalComments,
    loadMoreComments,
    refreshComments,
    addComment,
    deleteComment,
    likeComment,
  };
}
