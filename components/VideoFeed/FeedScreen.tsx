import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewToken,
  Modal,
  Image,
  Animated as RNAnimated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { RefreshControl } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import VideoItem, { VideoItemData } from "@/components/VideoFeed/VideoItem";
import AuthPromptModal from "@/components/VideoFeed/partial/AuthPromptModal";
import VideoAnalytics from "@/components/VideoFeed/VideoAnalytics";
import useVideoFeed, { FeedType } from "@/hooks/useVideoFeed";
import useVideoInteractions from "@/hooks/useVideoInteractions";
import { useVideoContext } from "@/context/VideoContext";
import { useAuth } from "@/hooks/useAuth";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import {
  SquarePlay,
  Search,
  Lock,
  Heart,
  User,
  PlayCircle,
  AlertCircle,
  RefreshCw,
  LogIn,
  WandSparkles,
} from "lucide-react-native";
import SearchResultsScreen from "@/components/VideoFeed/SearchResultsScreen";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Enhanced FlatList with Animated
const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList<VideoItemData>
);

// Debounced function utility
const createDebouncedFunction = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Loading Spinner Component (same as before)
const LoadingSpinner = () => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  return (
    <SafeAreaView style={loaderStyles.mainContainer}>
      <View style={loaderStyles.container}>
        <Animated.View
          style={[
            loaderStyles.spinnerContainer,
            {
              transform: [
                { rotate: `${rotation.value}deg` },
                { scale: scale.value },
              ],
              opacity: opacity.value,
            },
          ]}
        >
          <View style={loaderStyles.spinnerOuter}>
            <View style={loaderStyles.spinnerInner}>
              <PlayCircle size={32} color="white" />
            </View>
          </View>
        </Animated.View>

        <View style={loaderStyles.textContainer}>
          <Text style={loaderStyles.titleText}>Loading Videos</Text>
          <Text style={loaderStyles.subtitleText}>
            Discovering amazing content for you...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Empty State Component (same as before)
const EmptyState = ({
  message,
  showAction = false,
  actionText = "Try Again",
  onAction,
  icon = "empty",
  showLoginAction = false,
}: {
  message: string;
  showAction?: boolean;
  actionText?: string;
  onAction?: () => void;
  icon?: "empty" | "error" | "login";
  showLoginAction?: boolean;
}) => {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(30)).current;
  const scale = useRef(new RNAnimated.Value(0.9)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      RNAnimated.timing(translateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderIcon = () => {
    const iconColor = "#FF5A5F";
    switch (icon) {
      case "error":
        return <AlertCircle size={40} color={iconColor} />;
      case "login":
        return <LogIn size={40} color={iconColor} />;
      case "empty":
      default:
        return <WandSparkles size={40} color={iconColor} />;
    }
  };

  const handleLogin = () => {
    router.push("/(auth)/get-started");
  };

  return (
    <RNAnimated.View
      style={[
        emptyStyles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={emptyStyles.iconContainer}>
        <View style={emptyStyles.iconBackground}>{renderIcon()}</View>
      </View>

      <View style={emptyStyles.contentContainer}>
        <Text style={emptyStyles.message}>{message}</Text>
      </View>

      <View style={emptyStyles.buttonContainer}>
        {showAction && (
          <TouchableOpacity
            style={emptyStyles.primaryButton}
            activeOpacity={0.8}
            onPress={onAction}
          >
            <Text style={emptyStyles.primaryButtonText}>{actionText}</Text>
          </TouchableOpacity>
        )}

        {showLoginAction && (
          <TouchableOpacity
            style={emptyStyles.secondaryButton}
            activeOpacity={0.8}
            onPress={handleLogin}
          >
            <LogIn size={18} color="#FF5A5F" style={{ marginRight: 8 }} />
            <Text style={emptyStyles.secondaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </RNAnimated.View>
  );
};

// Error State Component (same as before)
const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => {
  return (
    <View style={errorStyles.container}>
      <View style={errorStyles.errorCard}>
        <View style={errorStyles.iconContainer}>
          <AlertCircle size={20} color="#FF5A5F" />
        </View>
        <Text style={errorStyles.message}>{message}</Text>
        <TouchableOpacity
          style={errorStyles.retryButton}
          activeOpacity={0.8}
          onPress={onRetry}
        >
          <RefreshCw size={14} color="white" style={errorStyles.retryIcon} />
          <Text style={errorStyles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FeedScreen: React.FC = () => {
  // Route parameters (stable refs to prevent re-renders)
  const routeParams = useLocalSearchParams<{
    videoId?: string;
    userId?: string;
    fromProfile?: string;
  }>();

  const params = useRef({
    videoId: routeParams.videoId,
    userId: routeParams.userId,
    fromProfile: routeParams.fromProfile,
  });

  useEffect(() => {
    params.current = {
      videoId: routeParams.videoId,
      userId: routeParams.userId,
      fromProfile: routeParams.fromProfile,
    };
  }, [routeParams.videoId, routeParams.userId, routeParams.fromProfile]);

  // Authentication and context
  const { isAuthenticated, user } = useAuth();
  const { authPrompt, requireAuth, hideAuthPrompt, handleLogin, handleSignup } =
    useAuthPrompt();

  // Video analytics
  const videoAnalytics = useRef(VideoAnalytics.getInstance());

  // Component state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Enhanced video feed hook with improved auto load more
  const {
    videos,
    refreshing,
    loading,
    error,
    hasMore,
    feedType,
    focusedIndex,
    setFocusedIndex,
    loadMore,
    refresh,
    changeFeedType,
    updateVideo,
    loadSpecificVideo,
    jumpToVideo,
    canLoadMore,
    isNearEnd,
    getLoadMoreState,
    getPerformanceStats,
  } = useVideoFeed({
    initialFeedType: "forYou",
    pageSize: 5,
    preloadCount: 2,
    initialVideoId: params.current.videoId,
    loadMoreThreshold: 2, // Trigger when 2 items from end
    minLoadInterval: 3000, // 3 seconds minimum between loads
    maxRetries: 3,
  });

  // Video interactions
  const { toggleLike, shareVideo } = useVideoInteractions();

  // Video context with throttled operations
  const videoContext = useVideoContext();

  // Refs for performance optimization
  const listRef = useRef<FlatList<VideoItemData>>(null);
  const scrollY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const lastFocusedIndex = useRef<number>(-1);
  const navigationHandled = useRef(false);

  // Scroll state management
  const scrollState = useRef({
    isScrolling: false,
    lastScrollTime: 0,
    lastEndReachedTime: 0,
    consecutiveEndReached: 0,
  });

  // Optimized logging with rate limiting
  const log = useRef(
    createDebouncedFunction((message: string, ...args: any[]) => {
      console.log(`📱 [FeedScreen] ${message}`, ...args);
    }, 250)
  ).current;

  // Enhanced onEndReached handler with advanced throttling
  const handleEndReached = useCallback(() => {
    const now = Date.now();
    const state = scrollState.current;
    const loadMoreState = getLoadMoreState();

    // Rate limiting checks
    if (now - state.lastEndReachedTime < 2000) {
      state.consecutiveEndReached++;
      if (state.consecutiveEndReached > 2) {
        log(
          `🚫 onEndReached blocked: too many consecutive calls (${state.consecutiveEndReached})`
        );
        return;
      }
    } else {
      state.consecutiveEndReached = 1;
    }

    state.lastEndReachedTime = now;

    // Basic checks
    if (!canLoadMore) {
      log(
        `⏸️ onEndReached skipped: canLoadMore=${canLoadMore}, hasMore=${hasMore}, loading=${loading}`
      );
      return;
    }

    // Advanced state checks
    if (loadMoreState.inProgress) {
      log(`⏸️ onEndReached skipped: load already in progress`);
      return;
    }

    if (now < loadMoreState.throttleUntil) {
      log(
        `⏸️ onEndReached skipped: throttled until ${new Date(
          loadMoreState.throttleUntil
        ).toLocaleTimeString()}`
      );
      return;
    }

    log(`🏁 onEndReached triggered - will attempt load more`);

    // Use setTimeout to avoid calling during render cycle
    setTimeout(() => {
      loadMore().then((success) => {
        if (success) {
          log(`✅ onEndReached load more successful`);
        } else {
          log(`❌ onEndReached load more failed`);
        }
      });
    }, 100);
  }, [canLoadMore, hasMore, loading, getLoadMoreState, loadMore]);

  // Enhanced manual load more for debugging
  const handleManualLoadMore = useCallback(async () => {
    log(`🔧 Manual load more triggered`);
    const loadMoreState = getLoadMoreState();
    const perfStats = getPerformanceStats();

    log(`📊 Load More State:`, loadMoreState);
    log(`📈 Performance Stats:`, perfStats);

    const success = await loadMore();
    log(`🔧 Manual load more ${success ? "succeeded" : "failed"}`);
  }, [loadMore, getLoadMoreState, getPerformanceStats]);

  // Handle navigation to specific video with improved logic
  useEffect(() => {
    if (
      !params.current.videoId ||
      videos.length === 0 ||
      navigationHandled.current
    ) {
      return;
    }

    const handleVideoNavigation = async () => {
      navigationHandled.current = true;
      log(`🧭 Navigating to video: ${params.current.videoId}`);

      const videoIndex = videos.findIndex(
        (v) => v.id === params.current.videoId
      );

      if (videoIndex !== -1) {
        log(`📍 Video found in feed at index: ${videoIndex}`);
        setFocusedIndex(videoIndex);

        // Scroll to video with error handling
        setTimeout(() => {
          try {
            listRef.current?.scrollToIndex({
              index: videoIndex,
              animated: true,
            });
          } catch (error) {
            log(`⚠️ ScrollToIndex failed, using offset: ${error}`);
            listRef.current?.scrollToOffset({
              offset: videoIndex * height,
              animated: true,
            });
          }
        }, 500);
      } else {
        try {
          const specificVideo = await loadSpecificVideo(
            params.current.videoId!
          );
          if (specificVideo) {
            await jumpToVideo(specificVideo);
            log(`✅ Specific video loaded and focused`);
          }
        } catch (error) {
          log(`❌ Error loading specific video:`, error);
        }
      }

      // Clean up route params
      setTimeout(() => {
        router.setParams({
          videoId: undefined,
          userId: undefined,
          fromProfile: undefined,
        });
      }, 2000);
    };

    if (!loading && videos.length > 0) {
      handleVideoNavigation();
    }
  }, [videos, loading, loadSpecificVideo, jumpToVideo, setFocusedIndex]);

  // Handle focus/blur events
  useFocusEffect(
    useCallback(() => {
      log(`🎯 FeedScreen focused`);
      setIsPaused(false);

      return () => {
        log(`🔴 FeedScreen blurred`);
        setIsPaused(true);
      };
    }, [])
  );

  // Enhanced focused video change handler
  useEffect(() => {
    const currentVideo = videos[focusedIndex];
    const prevVideo =
      lastFocusedIndex.current >= 0 ? videos[lastFocusedIndex.current] : null;

    if (!currentVideo || currentVideo.id === prevVideo?.id) {
      return;
    }

    log(`🎬 Video focus changed: ${currentVideo.id} (index: ${focusedIndex})`);

    // Analytics tracking
    videoAnalytics.current.startSession(
      currentVideo.id,
      currentVideo.video.duration || 0
    );

    // Context updates (with built-in throttling)
    if (isAuthenticated) {
      videoContext.addToRecentlyViewed(currentVideo.id);
    }
    videoContext.addToCache(currentVideo);

    // Cleanup previous video
    if (prevVideo && prevVideo.id !== currentVideo.id) {
      videoAnalytics.current.endSession(prevVideo.id);
    }

    lastFocusedIndex.current = focusedIndex;

    return () => {
      if (currentVideo) {
        videoAnalytics.current.pauseSession(currentVideo.id);
      }
    };
  }, [focusedIndex, videos, isAuthenticated, videoContext]);

  // Cleanup analytics on unmount
  useEffect(() => {
    return () => {
      videoAnalytics.current.cleanup();
    };
  }, []);

  // Enhanced viewability configuration
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        viewAreaCoveragePercentThreshold: 60,
        minimumViewTime: 300, // Increased to reduce sensitivity
        waitForInteraction: false,
      },
      onViewableItemsChanged: ({
        viewableItems,
      }: {
        viewableItems: Array<ViewToken>;
      }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
          const newIndex = viewableItems[0].index;
          if (newIndex !== focusedIndex) {
            log(`👁️ Viewability changed to index: ${newIndex}`);
            setFocusedIndex(newIndex);
          }
        }
      },
    },
  ]).current;

  // Enhanced scroll handlers
  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      scrollState.current.isScrolling = true;
      scrollState.current.lastScrollTime = Date.now();
    },
    onBeginDrag: () => {
      isDragging.value = true;
      scrollState.current.isScrolling = true;
    },
    onEndDrag: () => {
      isDragging.value = false;
      // Don't set isScrolling to false here, let momentum handle it
    },
  });

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      scrollState.current.isScrolling = false;

      const offsetY = event.nativeEvent.contentOffset.y;
      const newIndex = Math.round(offsetY / height);

      if (
        newIndex !== focusedIndex &&
        newIndex >= 0 &&
        newIndex < videos.length
      ) {
        log(`🎢 Momentum scroll to index: ${newIndex}`);
        setFocusedIndex(newIndex);
      }
    },
    [focusedIndex, videos.length, setFocusedIndex]
  );

  // Tab handling with improved state management
  const handleTabPress = useCallback(
    (tab: FeedType) => {
      if ((tab === "subscribed" || tab === "following") && !isAuthenticated) {
        requireAuth(`access_${tab}_feed`, () => {
          changeFeedType(tab);
        });
        return;
      }

      if (tab === feedType) return;

      log(`🏷️ Changing tab to: ${tab}`);
      navigationHandled.current = false;
      changeFeedType(tab);
    },
    [feedType, isAuthenticated, changeFeedType, requireAuth]
  );

  // Video interaction handlers (optimized and throttled)
  const handleLike = useCallback(
    async (videoId: string, liked: boolean) => {
      if (
        !requireAuth("like", async () => {
          const currentVideo = videos.find((v) => v.id === videoId);
          if (currentVideo) {
            updateVideo(videoId, {
              likeCount: currentVideo.likeCount + (liked ? 1 : -1),
            });
          }

          try {
            await toggleLike(videoId, (finalLiked, count) => {
              updateVideo(videoId, { likeCount: count });
            });
          } catch (error) {
            log(`❌ Error toggling like:`, error);
            if (currentVideo) {
              updateVideo(videoId, {
                likeCount: currentVideo.likeCount + (liked ? -1 : 1),
              });
            }
          }
        })
      ) {
        return;
      }
    },
    [videos, updateVideo, toggleLike, requireAuth]
  );

  const handleComment = useCallback(
    (videoId: string) => {
      requireAuth("comment", () => {
        log(`💬 Comment on video ${videoId}`);
      });
    },
    [requireAuth]
  );

  const handleShare = useCallback(
    async (videoId: string, platform?: string) => {
      const videoItem = videos.find((v) => v.id === videoId);
      if (!videoItem) return;

      if (platform) {
        try {
          updateVideo(videoId, { shareCount: videoItem.shareCount + 1 });
          await shareVideo(
            videoId,
            (platform as any) || "copy_link",
            (count) => {
              updateVideo(videoId, { shareCount: count });
            }
          );
        } catch (error) {
          log(`❌ Error sharing video:`, error);
          updateVideo(videoId, { shareCount: videoItem.shareCount });
        }
      } else {
        if (isAuthenticated) {
          log(`📤 Opening share modal for video: ${videoId}`);
        } else {
          handleShare(videoId, "copy_link");
        }
      }
    },
    [videos, updateVideo, shareVideo, isAuthenticated]
  );

  // Search handlers
  const handleOpenSearch = useCallback(() => {
    setSearchModalVisible(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchModalVisible(false);
  }, []);

  const handleUserPress = useCallback((userId: string) => {
    router.push(`/(tabs)/profile/${userId}`);
    setSearchModalVisible(false);
  }, []);

  const handleSearchedVideoPress = useCallback(
    async (videoId: string) => {
      setSearchModalVisible(false);

      const videoIndex = videos.findIndex((v) => v.id === videoId);
      if (videoIndex !== -1) {
        setFocusedIndex(videoIndex);
        listRef.current?.scrollToIndex({ index: videoIndex, animated: true });
      } else {
        try {
          const specificVideo = await loadSpecificVideo(videoId);
          if (specificVideo) {
            await jumpToVideo(specificVideo);
          }
        } catch (error) {
          log(`❌ Error loading searched video:`, error);
        }
      }
    },
    [videos, loadSpecificVideo, jumpToVideo, setFocusedIndex]
  );

  // Render video item with enhanced lazy loading
  const renderItem = useCallback(
    ({ item, index }: { item: VideoItemData; index: number }) => {
      const isFocused = focusedIndex === index;
      const shouldLoad = Math.abs(index - focusedIndex) <= 2;
      const shouldPause = isPaused || !isFocused;

      return (
        <View style={styles.videoItemContainer}>
          {shouldLoad ? (
            <VideoItem
              item={item}
              focused={isFocused && !isPaused}
              isBuffered={true}
              forcePause={shouldPause}
              onBuffered={() => {}}
              onLike={(liked) => handleLike(item.id, liked)}
              onComment={() => handleComment(item.id)}
              onShare={(platform) => handleShare(item.id, platform)}
              onBookmark={() => {}}
              onProfilePress={() =>
                router.push(`/(tabs)/profile/${item.user.id}`)
              }
              onAuthRequired={() => {}}
              index={index}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Image
                source={{ uri: item.video.poster }}
                style={styles.placeholderImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      );
    },
    [focusedIndex, isPaused, handleLike, handleComment, handleShare]
  );

  // Enhanced footer with debug info
  const renderFooter = useCallback(() => {
    const loadMoreState = getLoadMoreState();
    const perfStats = getPerformanceStats();

    return (
      <View style={styles.loadingFooter}>
        {loading && (
          <>
            <ActivityIndicator size="small" color="#FF5A5F" />
            <Text style={styles.loadingText}>Loading more videos...</Text>
          </>
        )}

        {!loading && hasMore && (
          <TouchableOpacity
            onPress={handleManualLoadMore}
            style={styles.debugButton}
          >
            <Text style={styles.debugButtonText}>Load More (Debug)</Text>
            <Text style={styles.debugText}>
              HasMore: {hasMore.toString()} | CanLoad: {canLoadMore.toString()}
            </Text>
            <Text style={styles.debugText}>
              NearEnd: {isNearEnd.toString()} | Focused: {focusedIndex}/
              {videos.length}
            </Text>
            <Text style={styles.debugText}>
              InProgress: {loadMoreState.inProgress.toString()} | Retries:{" "}
              {loadMoreState.retryCount}
            </Text>
            <Text style={styles.debugText}>
              Requests: {perfStats.successfulRequests}/{perfStats.totalRequests}{" "}
              | Avg: {Math.round(perfStats.averageResponseTime)}ms
            </Text>
          </TouchableOpacity>
        )}

        {!hasMore && (
          <Text style={[styles.loadingText, { color: "#666" }]}>
            No more videos to load
          </Text>
        )}
      </View>
    );
  }, [
    loading,
    hasMore,
    canLoadMore,
    isNearEnd,
    focusedIndex,
    videos.length,
    getLoadMoreState,
    getPerformanceStats,
    handleManualLoadMore,
  ]);

  // Error component
  const renderError = useCallback(() => {
    if (!error) return null;
    return <ErrorState message={error} onRetry={refresh} />;
  }, [error, refresh]);

  // Tabs component (same as before)
  const renderTabs = useCallback(
    () => (
      <View style={styles.tabContainer}>
        <View style={styles.customTab}>
          <SquarePlay size={20} color="white" />
        </View>

        <TouchableOpacity
          style={[styles.tab, { minWidth: 80, minHeight: 40 }]}
          activeOpacity={0.7}
          onPress={() => handleTabPress("forYou")}
        >
          <View style={styles.tabIconContainer}>
            {feedType === "forYou" && (
              <Heart size={18} color="white" style={styles.tabIcon} />
            )}
            <Text
              style={[
                styles.tabText,
                feedType === "forYou" && styles.activeTabText,
              ]}
            >
              For You
            </Text>
          </View>
          {feedType === "forYou" && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, { minWidth: 80, minHeight: 40 }]}
          activeOpacity={0.7}
          onPress={() => handleTabPress("following")}
        >
          <View style={styles.tabIconContainer}>
            {feedType === "following" && (
              <User size={18} color="white" style={styles.tabIcon} />
            )}
            <Text
              style={[
                styles.tabText,
                feedType === "following" && styles.activeTabText,
                !isAuthenticated && styles.disabledTabText,
              ]}
            >
              Following
            </Text>
            {!isAuthenticated && (
              <Lock
                size={12}
                color="rgba(255,255,255,0.5)"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
          {feedType === "following" && (
            <View style={styles.activeTabIndicator} />
          )}
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[styles.tab, { minWidth: 80, minHeight: 40 }]}
          activeOpacity={0.7}
          onPress={() => handleTabPress("subscribed")}
        >
          <View style={styles.tabIconContainer}>
            {feedType === "subscribed" && (
              <Lock size={18} color="white" style={styles.tabIcon} />
            )}
            <Text
              style={[
                styles.tabText,
                feedType === "subscribed" && styles.activeTabText,
                !isAuthenticated && styles.disabledTabText,
              ]}
            >
              Premium
            </Text>
            {!isAuthenticated && (
              <Lock
                size={12}
                color="rgba(255,255,255,0.5)"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
          {feedType === "subscribed" && (
            <View style={styles.activeTabIndicator} />
          )}
        </TouchableOpacity> */}

        <TouchableOpacity
          onPress={handleOpenSearch}
          style={[styles.searchIcon, styles.customTab]}
          activeOpacity={0.7}
        >
          <Search size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    ),
    [feedType, handleTabPress, isAuthenticated]
  );

  // Empty state handler (same logic as before)
  const renderEmpty = useCallback(() => {
    if (loading && videos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={["#1E4A72", "#000000"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
          >
            <LoadingSpinner />
          </LinearGradient>
        </View>
      );
    }

    if (error && videos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={["#1E4A72", "#000000"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
          >
            <EmptyState
              message="Unable to load videos. Please check your connection and try again."
              showAction={true}
              actionText="Retry"
              onAction={refresh}
              icon="error"
            />
          </LinearGradient>
        </View>
      );
    }

    if (videos.length === 0) {
      let message = "No videos found";
      let icon: "empty" | "error" | "login" = "empty";
      let showAction = false;
      let showLoginAction = false;
      let actionText = "";
      let actionHandler = () => {};

      if (feedType === "following") {
        if (isAuthenticated) {
          message =
            "You're not following any creators yet. Discover amazing creators in the For You feed!";
          showAction = true;
          actionText = "Explore For You";
          actionHandler = () => handleTabPress("forYou");
        } else {
          message =
            "Follow your favorite creators and never miss their latest content";
          icon = "login";
          showLoginAction = true;
        }
      } else if (feedType === "subscribed") {
        if (isAuthenticated) {
          message =
            "No premium content available. Subscribe to creators to unlock exclusive videos!";
          showAction = true;
          actionText = "Browse Creators";
          actionHandler = () => handleTabPress("forYou");
        } else {
          message =
            "Access exclusive premium content from your favorite creators";
          icon = "login";
          showLoginAction = true;
        }
      } else if (feedType === "forYou") {
        message =
          "We're preparing personalized content for you. Check back in a moment!";
        showAction = true;
        actionText = "Refresh";
        actionHandler = refresh;
        showLoginAction = !isAuthenticated;
      }

      return (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={["#1E4A72", "#000000"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
          >
            <EmptyState
              message={message}
              showAction={showAction}
              actionText={actionText}
              onAction={actionHandler}
              icon={icon}
              showLoginAction={showLoginAction}
            />
          </LinearGradient>
        </View>
      );
    }

    return null;
  }, [
    loading,
    error,
    videos.length,
    refresh,
    feedType,
    isAuthenticated,
    handleTabPress,
  ]);

  // Main render for empty state
  if (videos.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#1E4A72", "#000000"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        >
          <StatusBar style="light" backgroundColor="transparent" />
          {renderTabs()}
          {renderEmpty()}

          <Modal
            visible={authPrompt.visible}
            transparent
            animationType="fade"
            onRequestClose={hideAuthPrompt}
            statusBarTranslucent
          >
            <AuthPromptModal
              visible={true}
              action={authPrompt.action}
              onClose={hideAuthPrompt}
              onLogin={handleLogin}
              onSignup={handleSignup}
            />
          </Modal>
        </LinearGradient>
      </View>
    );
  }

  // Main render with enhanced FlatList
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={"transparent"} />

      {/* Gradient Background */}
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill} // fills entire screen
      />

      {/* Content (images/videos) */}
      <AnimatedFlatList
        ref={listRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.85}
        onScroll={handleScroll}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#FF5A5F"
            colors={["#FF5A5F"]}
            progressViewOffset={40}
          />
        }
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        bounces={Platform.OS === "ios"}
        disableIntervalMomentum={true}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollToIndexFailed={(info) => {
          log(`⚠️ ScrollToIndex failed for index ${info.index}, using offset`);
          listRef.current?.scrollToOffset({
            offset: info.index * height,
            animated: true,
          });
        }}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {/* Tabs, Errors, Modals above everything */}
      {renderTabs()}
      {renderError()}

      <Modal
        visible={authPrompt.visible}
        transparent
        animationType="fade"
        onRequestClose={hideAuthPrompt}
        statusBarTranslucent
      >
        <AuthPromptModal
          visible={true}
          action={authPrompt.action}
          onClose={hideAuthPrompt}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      </Modal>

      <Modal
        animationType="slide"
        transparent={false}
        visible={searchModalVisible}
        onRequestClose={handleCloseSearch}
      >
        <SearchResultsScreen
          initialQuery=""
          onClose={handleCloseSearch}
          onUserPress={handleUserPress}
          onVideoPress={handleSearchedVideoPress}
          onSoundPress={() => setSearchModalVisible(false)}
        />
      </Modal>
    </View>
  );
};

// Enhanced styles with debug components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#1a1a2e",
    // backgroundColor: "#1E4A72",
  },
  videoItemContainer: {
    height,
    width,
  },
  placeholderContainer: {
    flex: 1,
    // backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  loadingFooter: {
    height: 200, // Increased for debug info
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    color: "#FF5A5F",
    fontSize: 14,
    fontFamily: "Figtree",
    marginTop: 8,
    fontWeight: "500",
  },
  debugButton: {
    backgroundColor: "#FF5A5F",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    minWidth: 280,
    alignItems: "center",
  },
  debugButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  debugText: {
    color: "white",
    fontSize: 11,
    fontFamily: "monospace",
    marginVertical: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    // backgroundColor: "#1a1a2e",
    minHeight: "100%",
  },
  searchIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 25,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  customTab: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabIcon: {
    marginRight: 3,
  },
  activeTabText: {
    color: "white",
    fontWeight: "600",
  },
  disabledTabText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontFamily: "Figtree",
  },
  activeTabIndicator: {
    height: 3,
    width: 30,
    backgroundColor: "#FF4F5B",
    borderRadius: 3,
    marginTop: 6,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginHorizontal: 2,
    minWidth: 80,
    alignItems: "center",
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Figtree",
    textAlign: "center",
  },
});

// Same styles for other components...
const loaderStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100%",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    width: "100%",
    height: "100%",
  },
  spinnerContainer: {
    marginBottom: 32,
  },
  spinnerOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 90, 95, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 90, 95, 0.3)",
  },
  spinnerInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF5A5F",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
  },
  titleText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Figtree",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitleText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Figtree",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
});

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    width: "100%",
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: "rgba(255, 90, 95, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "ios" && {
      shadowColor: "#FF5A5F",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    }),
  },
  contentContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  message: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "Figtree",
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 320,
  },
  buttonContainer: {
    gap: 16,
    width: "100%",
    maxWidth: 280,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#FF5A5F",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    minWidth: 180,
    alignItems: "center",
    ...(Platform.OS === "ios" && {
      shadowColor: "#FF5A5F",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 90, 95, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.3)",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    minWidth: 180,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "Figtree",
  },
  secondaryButtonText: {
    color: "#FF5A5F",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Figtree",
  },
});

const errorStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 30,
  },
  errorCard: {
    backgroundColor: "rgba(26, 26, 46, 0.95)",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.3)",
    ...(Platform.OS === "ios" && {
      shadowColor: "#FF5A5F",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    }),
    elevation: 12,
    backdropFilter: "blur(10px)",
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    color: "white",
    flex: 1,
    fontSize: 14,
    fontFamily: "Figtree",
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#FF5A5F",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    ...(Platform.OS === "ios" && {
      shadowColor: "#FF5A5F",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    }),
    elevation: 4,
  },
  retryText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
    fontFamily: "Figtree",
  },
  retryIcon: {
    marginRight: 4,
  },
});

export default FeedScreen;
