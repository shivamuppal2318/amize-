import React, { useCallback, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  View,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useLocalSearchParams } from "expo-router";

import UserVideoFeed from "@/components/VideoFeed/UserFeeds";
import { VideoItemData } from "@/components/VideoFeed/VideoItem";

const { height } = Dimensions.get("window");

const AnimatedFlatList =
  Animated.createAnimatedComponent<FlatList<VideoItemData>>(FlatList);

const UserFeed = () => {
  const listRef = useRef<FlatList<VideoItemData>>(null);
  const scrollY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const { videos, startIndex } = useLocalSearchParams<{
    videos?: string;
    startIndex?: string;
  }>();

  const parsedVideos: VideoItemData[] = videos ? JSON.parse(videos) : [];

  const initialIndex = Number(startIndex ?? 0);
  const focusedIndex = useRef(initialIndex);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onBeginDrag: () => {
      isDragging.value = true;
    },
    onEndDrag: () => {
      isDragging.value = false;
    },
  });

  const handleMomentumEnd = useCallback((e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / height);
    focusedIndex.current = index;
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <AnimatedFlatList
        ref={listRef}
        data={parsedVideos}
        keyExtractor={(item: VideoItemData) => item.id}
        renderItem={({
          item,
          index,
        }: {
          item: VideoItemData;
          index: number;
        }) => (
          <UserVideoFeed
            item={item}
            index={index}
            focused={focusedIndex.current === index}
          />
        )}
        pagingEnabled
        snapToInterval={height}
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.9}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        initialScrollIndex={initialIndex}
        getItemLayout={(
          _: VideoItemData[] | null | undefined,
          index: number
        ) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onScrollToIndexFailed={(info: {
          index: number;
          highestMeasuredFrameIndex: number;
          averageItemLength: number;
        }) => {
          listRef.current?.scrollToOffset({
            offset: info.index * height,
            animated: true,
          });
        }}
      />
    </View>
  );
};

export default UserFeed;
