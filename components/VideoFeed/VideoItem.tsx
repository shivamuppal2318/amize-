import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useVideoPlayer, VideoView, VideoSource } from "expo-video";
import { useEvent } from "expo";
import Svg, { Path } from "react-native-svg";
import { Check, Flag, Music, Play } from "lucide-react-native";
import ShareModal from "@/components/VideoFeed/ShareModal";
import CommentsModal from "@/components/VideoFeed/CommentsModal";
import VideoService from "@/lib/api/videoService";
import { ApiSharePlatform } from "@/lib/api/types/video";
import ReportScreen from "./ReportScreen";
import SoundDetailScreen from "./SoundDetailScreen";
import { UserProfileModal } from "@/components/VideoFeed/partial/UserProfileModal";
import FollowButton from "@/components/VideoFeed/partial/FollowButton";
import { useAuthModal } from "@/context/AuthModalContext";
import { useAuth } from "@/hooks/useAuth";
import { useVideoContext } from "@/context/VideoContext";
import AuthPromptModal from "@/components/VideoFeed/partial/AuthPromptModal";
import { captureException } from "@/utils/errorReporting";
import { getSafePosterUri, getSafeVideoUri, sanitizeMediaUri } from "@/utils/mediaHelpers";

const { width, height } = Dimensions.get("window");

// Video Source interface
interface VideoSourceData {
  uri: string;
  poster: string;
  aspectRatio: number;
  duration?: number;
}

export interface VideoUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  verified: boolean;
  followerCount: number;
}

interface VideoMusic {
  id: string;
  name: string;
}

export interface VideoItemData {
  id: string;
  title: string;
  user: VideoUser;
  video: VideoSourceData;
  description: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount: number;
  timestamp: string;
  music: VideoMusic;
}

interface VideoItemProps {
  item: VideoItemData;
  focused: boolean;
  isBuffered?: boolean;
  forcePause?: boolean;
  onLike: (liked: boolean) => void;
  onComment: () => void;
  onShare: (platform?: ApiSharePlatform) => void;
  onBookmark: (bookmarked: boolean) => void;
  onProfilePress: () => void;
  onBuffered?: () => void;
  onAuthRequired?: (action: string) => void;
  onDeleted?: () => void;
  index?: number;
}

// Helper function to format counts
const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${Math.floor(count / 1000000)}M`;
  } else if (count >= 1000) {
    return `${Math.floor(count / 1000)}k`;
  }
  return count.toString();
};

const VideoItemWeb: React.FC<VideoItemProps> = ({
  item,
  focused = false,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onProfilePress,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [isPlayingWeb, setIsPlayingWeb] = useState(false);

  const videoSource = useMemo<VideoSource>(
    () => ({ uri: item.video?.uri }),
    [item.video?.uri]
  );

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    if (!focused || !videoReady) {
      player.pause();
      setIsPlayingWeb(false);
      return;
    }
  }, [focused, player, videoReady]);

  const handleToggleVideo = useCallback(() => {
    if (!videoReady) {
      return;
    }

    if (isPlayingWeb) {
      player.pause();
      setIsPlayingWeb(false);
      return;
    }

    player.play();
    setIsPlayingWeb(true);
  }, [isPlayingWeb, player, videoReady]);

  const handleLike = useCallback(() => {
    const next = !isLiked;
    setIsLiked(next);
    onLike(next);
  }, [isLiked, onLike]);

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen={true}
          allowsPictureInPicture={false}
          nativeControls={false}
          contentFit="cover"
          onFirstFrameRender={() => {
            setIsLoading(false);
            setVideoReady(true);
          }}
        />
        {!videoReady && (
          <Image
            source={{ uri: item.video?.poster || item.video?.uri }}
            style={styles.posterImage}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.overlay} />

      <View style={styles.pauseContainer}>
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={handleToggleVideo}
          accessibilityRole="button"
          accessibilityLabel={isPlayingWeb ? "Pause video" : "Play video"}
        >
          <Play size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.pauseReasonText}>
          {isLoading
            ? "Loading preview..."
            : isPlayingWeb
              ? "Tap to pause"
              : "Tap to play"}
        </Text>
      </View>

      {/* Minimal action buttons for web preview */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <View style={[styles.actionIconContainer, isLiked && styles.likedIconContainer]}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M20.84 4.61c-1.54-1.34-3.77-1.34-5.31 0L12 7.77 8.47 4.61c-1.54-1.34-3.77-1.34-5.31 0-1.76 1.53-1.84 4.21-.19 5.84L12 21.35l9.03-10.9c1.65-1.63 1.57-4.31-.19-5.84z"
                fill={isLiked ? "#FF5A5F" : "rgba(255,255,255,0.9)"}
              />
            </Svg>
          </View>
          <Text style={styles.actionText}>{formatCount(item.likeCount || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <View style={styles.actionIconContainer}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>C</Text>
          </View>
          <Text style={styles.actionText}>{formatCount(item.commentCount || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onShare()}>
          <View style={styles.actionIconContainer}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>S</Text>
          </View>
          <Text style={styles.actionText}>{formatCount(item.shareCount || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onBookmark(true)}>
          <View style={styles.actionIconContainer}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>B</Text>
          </View>
          <Text style={styles.actionText}>{formatCount(item.bookmarkCount || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onProfilePress}>
          <View style={styles.actionIconContainer}>
            <Image source={{ uri: item.user.avatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
          </View>
          <Text style={styles.actionText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Keep the existing text overlay so UI matches native */}
      <View style={styles.userInfoContainer}>
        <View style={styles.userInfo}>
          <TouchableOpacity style={styles.userAvatar} onPress={onProfilePress}>
            <Image source={{ uri: item.user.avatar }} style={styles.avatarImage} />
          </TouchableOpacity>
          <View style={styles.usernameContainer}>
            <TouchableOpacity style={styles.usernameRow} onPress={onProfilePress}>
              <Text style={styles.username}>@{item.user.username}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>
        <View style={styles.musicInfo}>
          <Music size={14} color="#F3F4F6" />
          <Text style={styles.musicText} numberOfLines={1}>
            {item.music?.name || "Original Sound"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const VideoItemNative: React.FC<VideoItemProps> = ({
  item,
  focused = false,
  isBuffered = false,
  forcePause = false,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onProfilePress,
  onBuffered,
  onAuthRequired,
  onDeleted,
  index = -1,
}) => {
  // Authentication and context
  const { isAuthenticated, user } = useAuth();
  const { showAuthModal } = useAuthModal();
  const { getLocalVideoPath, isVideoPreloaded } = useVideoContext();

  // Component state - minimal reactive state
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [hasRenderedFirstFrame, setHasRenderedFirstFrame] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [soundDetailModalVisible, setSoundDetailModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const [authPromptAction, setAuthPromptAction] = useState<string>("");

  // Refs for non-reactive state
  const likeChecked = useRef(false);
  const isMounted = useRef(true);
  const componentId = useRef(`VideoItem-${item.id}-${Date.now()}`);
  const manuallyPaused = useRef(false);
  const lastStatusChange = useRef(0);
  const lastFocusChange = useRef(0);
  const statusChangeInProgress = useRef(false);
  const playerReady = useRef(false);
  const isOwnVideo = user?.id === item.user.id;

  // Static logging function to avoid recreation
  const log = useRef((message: string, ...args: any[]) => {
    console.log(
      `🎥 [${componentId.current}] [Index: ${index}] [Focused: ${focused}] ${message}`,
      ...args
    );
  }).current;

  // Get video source with stable reference
  const videoSource = useMemo((): VideoSource => {
    const localPath = getLocalVideoPath(item.id);
    const isPreloaded = isVideoPreloaded(item.id);

    if (localPath && isPreloaded) {
      const cachedUri = sanitizeMediaUri(localPath);
      console.log(`🎥 [${componentId.current}] Using cached video: ${cachedUri}`);
      return { uri: cachedUri };
    }

    const safeRemoteUri = getSafeVideoUri(item.video?.uri, item.id);
    console.log(`🎥 [${componentId.current}] Using remote video: ${safeRemoteUri}`);
    return { uri: safeRemoteUri };
  }, [item.id, item.video.uri, getLocalVideoPath, isVideoPreloaded]);

  const posterUri = useMemo(
    () => getSafePosterUri(item.video?.poster || item.video?.uri, item.id),
    [item.id, item.video?.poster, item.video?.uri]
  );

  const player = useVideoPlayer(videoSource, (player) => {
      player.loop = true;
      player.muted = false;
      console.log(`🎥 [${componentId.current}] Player created`);
    }
  );

  // Listen to player events with throttling
  const { status, error: statusError } = useEvent(player, "statusChange", {
    status: player.status,
    error: undefined,
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  // Component lifecycle
  useEffect(() => {
    isMounted.current = true;
    log(`🏗️ Component mounted`);

    return () => {
      isMounted.current = false;
      statusChangeInProgress.current = false;
      log(`🗑️ Component unmounting`);
    };
  }, []);

  // Handle video status changes with throttling
  useEffect(() => {
    if (!isMounted.current) return;

    const now = Date.now();

    // Throttle status changes to prevent loops
    if (
      statusChangeInProgress.current ||
      now - lastStatusChange.current < 200
    ) {
      return;
    }

    statusChangeInProgress.current = true;
    lastStatusChange.current = now;

    const handleStatusChange = () => {
      switch (status) {
        case "loading":
          setIsLoading(true);
          playerReady.current = false;
          setPlaybackError(null);
          setHasRenderedFirstFrame(false);
          log(`⏳ Video loading`);
          break;

        case "readyToPlay":
          setIsLoading(false);
          playerReady.current = true;
          setPlaybackError(null);
          log(`✅ Video ready to play`);

          // Notify parent that video is buffered
          if (onBuffered) {
            onBuffered();
          }

          // CRITICAL: Only auto-play if focused AND not manually paused AND not force paused
          if (focused && !forcePause && !manuallyPaused.current) {
            // Small delay to ensure video is truly ready
            setTimeout(() => {
              if (
                isMounted.current &&
                focused &&
                !forcePause &&
                !manuallyPaused.current &&
                playerReady.current
              ) {
                player.play();
                log(`▶️ Auto-playing focused video`);
              }
            }, 100);
          }
          break;

        case "error":
          setIsLoading(false);
          playerReady.current = false;
          setPlaybackError(statusError?.message || "Unable to play this video");
          log(`❌ Video error`, statusError);
          captureException(statusError || new Error("expo-video unknown error"), {
            tags: { scope: "VideoItemNative" },
            extra: { videoId: item.id, videoUri: item.video?.uri },
          });
          break;

        default:
          break;
      }

      // Reset throttle after processing
      setTimeout(() => {
        statusChangeInProgress.current = false;
      }, 200);
    };

    handleStatusChange();
  }, [status, focused, forcePause, player, onBuffered]);

  // Handle focus and pause changes with better logic
  useEffect(() => {
    if (!isMounted.current || !playerReady.current) return;

    const now = Date.now();

    // Throttle focus changes
    if (now - lastFocusChange.current < 300) {
      return;
    }

    lastFocusChange.current = now;

    const shouldPause = forcePause || !focused;

    log(
      `🎮 Focus/Pause logic - shouldPause: ${shouldPause}, focused: ${focused}, forcePause: ${forcePause}, manuallyPaused: ${manuallyPaused.current}, isPlaying: ${player.playing}`
    );

    if (shouldPause && player.playing) {
      player.pause();
      log(`⏸️ Pausing video - forcePause: ${forcePause}, focused: ${focused}`);
    } else if (
      !shouldPause &&
      focused &&
      !manuallyPaused.current &&
      !player.playing
    ) {
      // Only auto-play if not manually paused
      player.play();
      log(`▶️ Playing video - ready and focused, not manually paused`);
    }
  }, [focused, forcePause, player]);

  // Reset manual pause when focus changes to this video
  useEffect(() => {
    if (focused) {
      log(`🎯 Video focused - resetting manual pause`);
      manuallyPaused.current = false;
    }
  }, [focused]);

  // Check like status when focused (only if authenticated)
  useEffect(() => {
    if (focused && !likeChecked.current && isAuthenticated) {
      const checkLikeStatus = async () => {
        try {
          const { liked } = await VideoService.checkLikeStatus(item.id);
          if (isMounted.current) {
            setIsLiked(liked);
            likeChecked.current = true;
            log(`💖 Like status: ${liked}`);
          }
        } catch (error) {
          log(`❌ Error checking like status:`, error);
        }
      };
      checkLikeStatus();
    } else if (focused && !isAuthenticated) {
      setIsLiked(false);
      likeChecked.current = true;
    }
  }, [focused, isAuthenticated, item.id]);

  // Reset like check when auth state changes
  useEffect(() => {
    likeChecked.current = false;
  }, [isAuthenticated]);

  // Video press handler with improved state management
  const handleVideoPress = useCallback(() => {
    if (forcePause) {
      log(`🚫 Video press ignored - force paused`);
      return;
    }

    log(
      `👆 Video pressed - current playing state: ${player.playing}, manuallyPaused: ${manuallyPaused.current}`
    );

    if (player.playing) {
      player.pause();
      manuallyPaused.current = true;
      log(`⏸️ Manual pause - set manuallyPaused to true`);
    } else {
      player.play();
      manuallyPaused.current = false;
      log(`▶️ Manual play - set manuallyPaused to false`);
    }
  }, [player, forcePause]);

  // Auth prompt helper
  const showAuthPrompt = useCallback(
    (action: string) => {
      log(`🔐 Showing auth prompt for: ${action}`);
      showAuthModal(action);
      if (onAuthRequired) {
        onAuthRequired(action);
      }
    },
    [showAuthModal, onAuthRequired]
  );

  // Action handlers
  const handleLikePress = useCallback(() => {
    if (!isAuthenticated) {
      showAuthPrompt("like");
      return;
    }
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    onLike(newLikedState);
    log(`💖 Like toggled: ${newLikedState}`);
  }, [isAuthenticated, isLiked, showAuthPrompt, onLike]);

  const handleCommentPress = useCallback(() => {
    if (!isAuthenticated) {
      showAuthPrompt("comment");
      return;
    }
    setCommentsModalVisible(true);
    onComment();
    log(`💬 Opening comments`);
  }, [isAuthenticated, showAuthPrompt, onComment]);

  const handleSharePress = useCallback(() => {
    if (!isAuthenticated) {
      showAuthPrompt("share");
      return;
    }
    setShareModalVisible(true);
    onShare();
    log(`📤 Opening share modal`);
  }, [isAuthenticated, showAuthPrompt, onShare]);

  const handleReportPress = useCallback(() => {
    if (!isAuthenticated) {
      showAuthPrompt("report");
      return;
    }
    setReportModalVisible(true);
    setShareModalVisible(false);
    setCommentsModalVisible(false);
    log(`🚩 Opening report modal`);
  }, [isAuthenticated, showAuthPrompt]);

  const handleMusicPress = useCallback(() => {
    setSoundDetailModalVisible(true);
    setShareModalVisible(false);
    setCommentsModalVisible(false);
    log(`🎵 Opening music detail`);
  }, []);

  const handleProfilePress = useCallback(() => {
    setProfileModalVisible(true);
    log(`👤 Opening profile modal`);
  }, []);

  const handleViewFullProfile = useCallback(
    (userId: string) => {
      setProfileModalVisible(false);
      onProfilePress();
      log(`👤 Navigating to profile: ${userId}`);
    },
    [onProfilePress]
  );

  // Modal handlers
  const handleReportSubmit = useCallback((reason: string) => {
    log(`🚩 Reporting video: ${reason}`);
    setReportModalVisible(false);
  }, []);

  const handleNotInterestedPress = useCallback(() => {
    setShareModalVisible(false);
    log(`👎 Not interested`);
  }, []);

  const handleAddToFavoritesPress = useCallback(() => {
    setShareModalVisible(false);
    onBookmark(true);
    log(`⭐ Add to favorites`);
  }, [onBookmark]);

  const handleDeletePostPress = useCallback(() => {
    Alert.alert(
      "Delete post",
      "This will permanently remove this post from your profile and feed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setShareModalVisible(false);
              await VideoService.deleteVideo(item.id);
              onDeleted?.();
              Alert.alert("Deleted", "The post was deleted successfully.");
              log(`🗑️ Deleted post: ${item.id}`);
            } catch (error: any) {
              captureException(error, {
                tags: { component: "video-item", stage: "delete-video" },
                extra: { videoId: item.id },
              });
              Alert.alert(
                "Delete Failed",
                error?.response?.data?.message || error?.message || "Unable to delete this post right now."
              );
            }
          },
        },
      ]
    );
  }, [item.id, log, onDeleted]);

  const handleRepostPress = useCallback(async () => {
    if (!isAuthenticated) {
      showAuthPrompt("repost");
      return;
    }

    setShareModalVisible(false);

    try {
      const result = await VideoService.repostVideo(item.id);
      if (result.success) {
        Alert.alert("Reposted", "This video was reposted to your profile.");
        log(`🔁 Reposted video: ${item.id}`);
        return;
      }

      Alert.alert("Repost Failed", "Unable to repost this video right now.");
    } catch (error: any) {
      captureException(error, {
        tags: { component: "video-item", stage: "repost-video" },
        extra: { videoId: item.id },
      });
      Alert.alert(
        "Repost Failed",
        error?.response?.data?.message || error?.message || "Unable to repost this video right now."
      );
    }
  }, [isAuthenticated, item.id, log, showAuthPrompt]);

  const handleSocialSharePress = useCallback(
    (platform: ApiSharePlatform) => {
      setShareModalVisible(false);
      onShare(platform);
      log(`📱 Share on ${platform}`);
    },
    [onShare]
  );

  const handleReportSubmitApi = useCallback(
    async (reason: string) => {
      log(`Reporting video to backend: ${reason}`);

      try {
        await VideoService.reportVideo(item.id, reason);
      } catch (error) {
        captureException(error, {
          tags: { component: "video-item", stage: "report-video" },
          extra: { videoId: item.id, reason },
        });
      } finally {
        setReportModalVisible(false);
      }
    },
    [item.id, log]
  );

  // Custom SVG Icons
  const LikeIcon = ({ color = "#FF5A5F" }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 31 26" fill="none">
      <Path
        d="M0.870605 9.32497C0.870605 16.4167 6.73227 20.1958 11.0231 23.5784C12.5373 24.7721 13.9956 25.8959 15.4539 25.8959C16.9123 25.8959 18.3706 24.7721 19.8848 23.5784C24.1756 20.1958 30.0373 16.4167 30.0373 9.32497C30.0373 2.23318 22.0161 -2.79617 15.4539 4.02178C8.89167 -2.79617 0.870605 2.23318 0.870605 9.32497Z"
        fill={color}
      />
    </Svg>
  );

  const CommentIcon = ({ color = "#FFF" }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 31 30" fill="none">
      <Path
        d="M15.4539 29.4565C23.508 29.4565 30.0373 22.9272 30.0373 14.8731C30.0373 6.81897 23.508 0.289795 15.4539 0.289795C7.39978 0.289795 0.870605 6.81897 0.870605 14.8731C0.870605 17.206 1.41838 19.4109 2.39232 21.3664C2.65114 21.886 2.73729 22.4799 2.58724 23.0407L1.71864 26.2871C1.34157 27.6963 2.63083 28.9854 4.04007 28.6084L7.28638 27.7399C7.84717 27.5898 8.44112 27.676 8.96076 27.9347C10.9161 28.9087 13.121 29.4565 15.4539 29.4565Z"
        fill={color}
      />
    </Svg>
  );

  const ShareIcon = ({ color = "#FFF" }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 31 30" fill="none">
      <Path
        d="M29.8617 4.64445L21.5784 27.8611C21.3803 28.4377 21.0064 28.9377 20.5094 29.2908C20.0124 29.644 19.4172 29.8325 18.8076 29.8299C18.2049 29.8367 17.615 29.6567 17.1188 29.3146C16.6226 28.9725 16.2446 28.4851 16.0367 27.9194L12.9451 19.8694L15.1909 17.6236L18.8221 13.9924C19.0968 13.7178 19.251 13.3453 19.251 12.957C19.251 12.5686 19.0968 12.1961 18.8221 11.9215C18.5475 11.6469 18.1751 11.4927 17.7867 11.4927C17.3984 11.4927 17.0259 11.6469 16.7513 11.9215L13.1201 15.5528L10.8159 17.8132L2.78048 14.707C2.18042 14.5262 1.65454 14.157 1.28074 13.654C0.906931 13.151 0.705078 12.5409 0.705078 11.9142C0.705078 11.2876 0.906931 10.6775 1.28074 10.1745C1.65454 9.67152 2.18042 9.30229 2.78048 9.12154L26.0555 0.838203C26.5877 0.619525 27.1728 0.563177 27.737 0.676251C28.3012 0.789324 28.8194 1.06677 29.2263 1.47366C29.6332 1.88055 29.9106 2.39871 30.0237 2.96292C30.1368 3.52714 30.0804 4.11219 29.8617 4.64445Z"
        fill={color}
      />
    </Svg>
  );

  return (
    <View style={styles.container}>
      {/* Video Component */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleVideoPress}
        style={styles.videoContainer}
      >
        <VideoView
          style={styles.video}
          player={player}
          surfaceType={Platform.OS === "android" ? "textureView" : undefined}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
          contentFit="cover"
          useExoShutter={false}
          onFirstFrameRender={() => {
            if (isMounted.current) {
              setIsLoading(false);
              setPlaybackError(null);
              setHasRenderedFirstFrame(true);
              log(`🎬 First frame rendered`);
            }
          }}
        />

        {(!hasRenderedFirstFrame || playbackError) && (
          <Image
            source={{ uri: posterUri }}
            style={styles.posterImage}
            resizeMode="cover"
          />
        )}

        {/* Overlay for better text visibility */}
        <View style={styles.overlay} />

        {/* Loading indicator */}
        {isLoading && focused && !forcePause && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FF5A5F" />
          </View>
        )}

        {/* Pause indicator with better logic */}
        {!isPlaying && !isLoading && focused && playerReady.current && (
          <View style={styles.pauseContainer}>
            <View style={styles.pauseButton}>
              <Play size={30} color="white" />
            </View>
            {(forcePause || manuallyPaused.current) && (
              <Text style={styles.pauseReasonText}>
                {forcePause ? "Video paused" : "Tap to play"}
              </Text>
            )}
          </View>
        )}

        {!!playbackError && (
          <View style={styles.pauseContainer}>
            <Text style={styles.pauseReasonText}>{playbackError}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleReportPress}
        >
          <View style={styles.actionIconContainer}>
            <Flag size={28} color="white" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            !isAuthenticated && styles.actionButtonDisabled,
          ]}
          onPress={handleLikePress}
        >
          <View
            style={[
              styles.actionIconContainer,
              isLiked && styles.likedIconContainer,
            ]}
          >
            <LikeIcon color={isLiked ? "#FF5A5F" : "white"} />
          </View>
          <Text style={styles.actionText}>{formatCount(item.likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            !isAuthenticated && styles.actionButtonDisabled,
          ]}
          onPress={handleCommentPress}
        >
          <View style={styles.actionIconContainer}>
            <CommentIcon color="#FFF" />
          </View>
          <Text style={styles.actionText}>
            {formatCount(item.commentCount)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            !isAuthenticated && styles.actionButtonDisabled,
          ]}
          onPress={handleSharePress}
        >
          <View style={styles.actionIconContainer}>
            <ShareIcon color="#FFF" />
          </View>
          <Text style={styles.actionText}>{formatCount(item.shareCount)}</Text>
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userInfoContainer}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            style={styles.userAvatar}
            onPress={handleProfilePress}
          >
            <Image
              source={{ uri: item.user.avatar }}
              style={styles.avatarImage}
            />
          </TouchableOpacity>

          <View style={styles.usernameContainer}>
            <View style={styles.usernameRow}>
              <TouchableOpacity onPress={handleProfilePress}>
                <Text style={styles.username}>{item.user.username}</Text>
              </TouchableOpacity>
              {item.user.verified && (
                <View style={styles.verifiedBadge}>
                  <Check size={10} color="white" />
                </View>
              )}
            </View>

            {isAuthenticated && (
              <FollowButton
                userId={item.user.id}
                size="small"
                style={styles.followButton}
                iconOnly={true}
                variant={"transparent"}
              />
            )}
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {/* <TouchableOpacity style={styles.musicInfo} onPress={handleMusicPress}> */}
        <View style={styles.musicInfo}>
          <Music size={15} color="white" />
          <Text style={styles.musicText} numberOfLines={1}>
            {item.music.name}
          </Text>
        </View>
      </View>

      {/* Modals */}
      <Modal
        visible={authPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAuthPromptVisible(false)}
        statusBarTranslucent
      >
        <AuthPromptModal
          visible={true}
          action={authPromptAction}
          onClose={() => setAuthPromptVisible(false)}
          onLogin={() => setAuthPromptVisible(false)}
          onSignup={() => setAuthPromptVisible(false)}
        />
      </Modal>

      {isAuthenticated && (
        <>
          <ShareModal
            visible={shareModalVisible}
            onClose={() => setShareModalVisible(false)}
            onRepostPress={handleRepostPress}
            onReportPress={handleReportPress}
            onNotInterestedPress={handleNotInterestedPress}
            onAddToFavoritesPress={handleAddToFavoritesPress}
            onSocialSharePress={handleSocialSharePress}
            onDeletePress={isOwnVideo ? handleDeletePostPress : undefined}
            canDelete={isOwnVideo}
            videoId={item.id}
          />

          <CommentsModal
            visible={commentsModalVisible}
            onClose={() => setCommentsModalVisible(false)}
            videoId={item.id}
            commentsCount={item.commentCount}
          />
        </>
      )}

      <Modal
        animationType="slide"
        transparent={false}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <ReportScreen
          onClose={() => setReportModalVisible(false)}
          onSubmit={handleReportSubmitApi}
        />
      </Modal>

      <Modal
        animationType="slide"
        transparent={false}
        visible={soundDetailModalVisible}
        onRequestClose={() => setSoundDetailModalVisible(false)}
      >
        <SoundDetailScreen
          onClose={() => setSoundDetailModalVisible(false)}
          onPlay={() => console.log("Play sound")}
          onAddToFavorites={() => console.log("Add sound to favorites")}
          onFollow={() => console.log("Follow sound creator")}
          onUseSound={() => console.log("Use this sound")}
        />
      </Modal>

      <UserProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        userId={item.user.id}
        username={item.user.username}
        avatar={item.user.avatar}
        onViewFullProfile={handleViewFullProfile}
      />
    </View>
  );
};

const VideoItem: React.FC<VideoItemProps> = (props) => {
  if (Platform.OS === "web") {
    return <VideoItemWeb {...props} />;
  }
  return <VideoItemNative {...props} />;
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    backgroundColor: "#1a1a2e",
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  posterImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1220",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 26, 46, 0.2)",
    zIndex: 2,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    backgroundColor: "rgba(26, 26, 46, 0.4)",
  },
  pauseContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  pauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pauseReasonText: {
    color: "#F3F4F6",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
    backgroundColor: "rgba(55, 65, 81, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontFamily: "Figtree",
    fontWeight: "500",
  },
  actionButtons: {
    position: "absolute",
    right: 12,
    bottom: Dimensions.get("window").height / 3,
    zIndex: 10,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginVertical: 0,
    padding: 4,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.01)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  likedIconContainer: {
    backgroundColor: "rgba(255, 90, 95, 0.01)",
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.1)",
  },
  actionText: {
    color: "#F3F4F6",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Figtree",
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userInfoContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 80,
    width: "75%",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    borderColor: "#FF5A5F",
    borderWidth: 2,
    backgroundColor: "#1a1a2e",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  usernameContainer: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  username: {
    color: "#F3F4F6",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Figtree",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF5A5F",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  followButton: {
    // Styles from FollowButton component
  },
  title: {
    color: "#F3F4F6",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: "Figtree",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: "#F3F4F6",
    fontSize: 14,
    marginBottom: 12,
    fontFamily: "Figtree",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  musicInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(55, 65, 81, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  musicText: {
    color: "#F3F4F6",
    fontSize: 12,
    marginLeft: 6,
    fontFamily: "Figtree",
    fontWeight: "500",
    maxWidth: 150,
  },
});

export default VideoItem;
