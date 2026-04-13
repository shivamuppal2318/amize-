import React from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import UserVideoFeed from "@/components/VideoFeed/UserFeeds";
import { VideoItemData } from "@/components/VideoFeed/VideoItem";

const UserFeed = () => {
  const { videos, startIndex } = useLocalSearchParams<{
    videos?: string;
    startIndex?: string;
  }>();

  const parsedVideos: VideoItemData[] = videos ? JSON.parse(videos) : [];
  const initialIndex = Number(startIndex ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <UserVideoFeed videos={parsedVideos as any} initialIndex={initialIndex} />
    </View>
  );
};

export default UserFeed;
