import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
  FlatList,
  ViewToken,
  Image,
  StyleSheet,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { resolveRemoteMediaUri } from "@/utils/mediaHelpers";

const { height, width } = Dimensions.get("window");

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profilePhotoUrl?: string;
    creatorVerified: boolean;
  };
  _count: {
    likes: number;
    comments: number;
    views: number;
  };
}

interface Props {
  videos: VideoItem[];
  initialIndex?: number;
}

export default function UserVideoFeed({ videos, initialIndex = 0 }: Props) {
  const listRef = useRef<FlatList<VideoItem>>(null);
  const videoRefs = useRef<Record<number, Video | null>>({});
  const lastTap = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [endedIndex, setEndedIndex] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(true);

  // Preload cache for next video
  const preloadVideo = async (index: number) => {
    if (videos[index] && videoRefs.current[index] == null) {
      const ref = new Video({ source: { uri: resolveRemoteMediaUri(videos[index].videoUrl) } });
      videoRefs.current[index] = ref;
      try {
        await ref.loadAsync({ uri: resolveRemoteMediaUri(videos[index].videoUrl) }, {}, false);
      } catch (e) {
        console.log("Preload error", e);
      }
    }
  };

  // Handle focus/unfocus
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      playVideo(currentIndex);
      return () => {
        setIsFocused(false);
        pauseAll();
      };
    }, [currentIndex])
  );

  const pauseAll = () => {
    Object.values(videoRefs.current).forEach((v) => v?.pauseAsync());
  };

  const playVideo = async (index: number) => {
    pauseAll();
    const ref = videoRefs.current[index];
    if (ref) {
      try {
        await ref.playAsync();
        // preload next video
        preloadVideo(index + 1);
      } catch (e) {
        console.log("Video play error:", e);
      }
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems?.length) return;
      const index = viewableItems[0].index ?? 0;
      setCurrentIndex(index);
      setEndedIndex(null);
      if (isFocused) playVideo(index);
    }
  ).current;

  if (!videos || videos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No videos found</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: VideoItem; index: number }) => {
    const liked = likes[item.id];
    const isLast = index === videos.length - 1;
    const showReplay = endedIndex === index;

    return (
      <View style={{ height, width }}>
        <TouchableWithoutFeedback
          onPress={() => {
            const now = Date.now();
            if (lastTap.current && now - lastTap.current < 300) {
              setLikes((prev) => ({ ...prev, [item.id]: true }));
            }
            lastTap.current = now;
          }}
        >
          <LinearGradient
            colors={["#000000", "#0a0a0a", "#000000"]}
            style={styles.container}
          >
            {/* Thumbnail + loader */}
            {(loadingIndex === index || !showReplay) && item.thumbnailUrl && (
              <Image
                source={{ uri: resolveRemoteMediaUri(item.thumbnailUrl) }}
                style={StyleSheet.absoluteFillObject}
                blurRadius={10}
              />
            )}
            {loadingIndex === index && (
              <ActivityIndicator
                size="large"
                color="#fff"
                style={StyleSheet.absoluteFillObject}
              />
            )}

            {/* Video */}
            <Video
              ref={(ref) => {
                if (ref) videoRefs.current[index] = ref;
              }}
              source={{ uri: resolveRemoteMediaUri(item.videoUrl) }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={currentIndex === index && !showReplay}
              isLooping={false}
              onLoadStart={() => setLoadingIndex(index)}
              onLoad={() => setLoadingIndex(null)}
              onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                if (status.isLoaded && status.didJustFinish) {
                  setEndedIndex(index);
                }
              }}
            />

            {/* Replay overlay */}
            {showReplay && (
              <TouchableWithoutFeedback
                onPress={() => {
                  setEndedIndex(null);
                  playVideo(index);
                }}
              >
                <View style={styles.replayOverlay}>
                  <Ionicons name="play-circle" size={80} color="#fff" />
                </View>
              </TouchableWithoutFeedback>
            )}

            {/* User info */}
            <View style={styles.userInfo}>
              {item.user.profilePhotoUrl && (
                <Image
                  source={{ uri: item.user.profilePhotoUrl }}
                  style={styles.userImage}
                />
              )}
              <Text style={styles.username}>{item.user.username}</Text>
            </View>

            {/* Like & comment buttons */}
            <View style={styles.actions}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={36}
                color={liked ? "#ff2d55" : "#fff"}
                style={{ marginBottom: 20 }}
                onPress={() =>
                  setLikes((prev) => ({
                    ...prev,
                    [item.id]: !prev[item.id],
                  }))
                }
              />
              <Ionicons name="chatbubble-outline" size={32} color="#fff" />
            </View>

            {/* Last video */}
            {isLast && currentIndex === index && (
              <View style={styles.end}>
                <Text style={styles.endText}>No more videos available</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={videos}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      initialScrollIndex={initialIndex < videos.length ? initialIndex : 0}
      getItemLayout={(_, index) => ({
        length: height,
        offset: height * index,
        index,
      })}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      windowSize={3} // keep 3 videos in memory for smooth scroll
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height,
    width,
    justifyContent: "center",
  },
  video: {
    height,
    width,
    backgroundColor: "#000",
  },
  actions: {
    position: "absolute",
    right: 16,
    bottom: 120,
    alignItems: "center",
  },
  replayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  end: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
  },
  endText: {
    color: "#fff",
    fontSize: 16,
  },
  empty: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
  },
  userInfo: {
    position: "absolute",
    left: 16,
    bottom: 120,
    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  username: {
    color: "#fff",
    fontSize: 16,
  },
});
