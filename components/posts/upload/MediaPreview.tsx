import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import { Audio } from "expo-av";
import { Video as VideoIcon } from "lucide-react-native";
import { sanitizeMediaUri } from "@/utils/mediaHelpers";
import { MediaItem } from "@/stores/postingStore";

const { width } = Dimensions.get("window");

interface MediaPreviewProps {
  mediaItems: MediaItem[];
  onMediaChange?: (index: number) => void;
}

export default function MediaPreview({
  mediaItems,
  onMediaChange,
}: MediaPreviewProps) {
  const videoRefs = useRef<{ [key: number]: Video | null }>({});
  const audioRefs = useRef<{ [key: number]: Audio.Sound | null }>({});
  const mediaScrollViewRef = useRef<FlatList>(null);

  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [playingVideos, setPlayingVideos] = useState<{
    [key: number]: boolean;
  }>({});

  // STOP all audios
  const stopAllAudio = async () => {
    const keys = Object.keys(audioRefs.current);
    for (let k of keys) {
      try {
        await audioRefs.current[k]?.stopAsync();
      } catch {}
    }
  };

  // PLAY song for an item
  const playSong = async (index: number) => {
    try {
      const songUrl = mediaItems[index]?.postSong;
      if (!songUrl) return;

      await stopAllAudio();
      const { sound } = await Audio.Sound.createAsync(
        { uri: songUrl },
        { shouldPlay: true }
      );

      audioRefs.current[index] = sound;
    } catch (e) {
      console.log("Audio play error:", e);
    }
  };

  // Handle media scroll change
  const handleMediaScroll = async (event: {
    nativeEvent: {
      contentOffset: { x: number };
      layoutMeasurement: { width: number };
    };
  }) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const pageIndex = Math.floor(contentOffset.x / viewSize.width);

    if (
      pageIndex !== coverImageIndex &&
      pageIndex >= 0 &&
      pageIndex < mediaItems.length
    ) {
      setCoverImageIndex(pageIndex);
      onMediaChange?.(pageIndex);

      // Pause videos
      Object.values(videoRefs.current).forEach((videoRef) => {
        if (videoRef) videoRef.pauseAsync();
      });
      setPlayingVideos({});

      // STOP AUDIO
      await stopAllAudio();

      // AUTO PLAY SONG ON IMAGE
      if (mediaItems[pageIndex]?.type === "photo") {
        playSong(pageIndex);
      }
    }
  };

  // Toggle video play/pause
  const toggleVideoPlayback = async (index: number) => {
    const videoRef = videoRefs.current[index];
    if (videoRef) {
      const isPlaying = playingVideos[index];

      if (isPlaying) {
        videoRef.pauseAsync();
        await stopAllAudio();
        setPlayingVideos((prev) => ({ ...prev, [index]: false }));
      } else {
        videoRef.playAsync();
        await playSong(index); // 🔥 PLAY SONG ON VIDEO
        setPlayingVideos((prev) => ({ ...prev, [index]: true }));
      }
    }
  };

  // Render individual media item
  const renderMediaItem = ({
    item,
    index,
  }: {
    item: MediaItem;
    index: number;
  }) => {
    const isVideoPlaying = playingVideos[index] || false;
    const sanitizedUri = sanitizeMediaUri(item.uri);

    return (
      <View style={styles.mediaItemContainer}>
        {item.type === "photo" ? (
          <Image
            source={{ uri: sanitizedUri }}
            style={styles.mediaPreview}
            resizeMode="cover"
          />
        ) : (
          <TouchableOpacity
            style={styles.mediaPreview}
            onPress={() => toggleVideoPlayback(index)}
            activeOpacity={0.9}
          >
            <Video
              ref={(ref) => {
                videoRefs.current[index] = ref;
              }}
              source={{ uri: sanitizedUri }}
              style={styles.videoPlayer}
              resizeMode={ResizeMode.COVER}
              isLooping
              useNativeControls={false}
              shouldPlay={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setPlayingVideos((prev) => {
                    if (prev[index] === status.isPlaying) {
                      return prev;
                    }
                    return { ...prev, [index]: status.isPlaying };
                  });
                }
              }}
            />
            {!isVideoPlaying && (
              <View style={styles.playButtonOverlay}>
                <VideoIcon size={40} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (mediaItems.length === 0) {
    return (
      <View style={styles.emptyMediaPreview}>
        <Text style={styles.emptyMediaText}>No media selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.mediaPreviewContainer}>
      <FlatList
        ref={mediaScrollViewRef}
        data={mediaItems}
        renderItem={renderMediaItem}
        keyExtractor={(item, index) => `media-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMediaScroll}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialScrollIndex={0}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />

      {/* Multiple media indicators */}
      {mediaItems.length > 1 && (
        <View style={styles.mediaIndicators}>
          {mediaItems.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.mediaIndicator,
                index === coverImageIndex && styles.activeMediaIndicator,
              ]}
              onPress={() => {
                setCoverImageIndex(index);
                mediaScrollViewRef.current?.scrollToIndex({
                  index,
                  animated: true,
                });
              }}
            />
          ))}
        </View>
      )}

      {/* Media counter */}
      {mediaItems.length > 1 && (
        <View style={styles.mediaCounter}>
          <Text style={styles.mediaCounterText}>
            {coverImageIndex + 1} / {mediaItems.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mediaPreviewContainer: {
    width: "100%",
    height: width,
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  mediaItemContainer: {
    width: width,
    height: width,
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333",
  },
  emptyMediaPreview: {
    width: "100%",
    height: width,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMediaText: {
    color: "#777",
    fontSize: 16,
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  mediaIndicators: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  mediaIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeMediaIndicator: {
    backgroundColor: "#FF4D67",
  },
  mediaCounter: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediaCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
});
