import React from "react";
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function InboxLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation:
          Platform.OS === "ios" ? "slide_from_right" : "fade_from_bottom",
        animationDuration: Platform.OS === "ios" ? 300 : 250,
        contentStyle: {
          backgroundColor: "#1E4A72",
          ...Platform.select({
            ios: { paddingTop: 1 },
            android: { paddingTop: 50 },
          }),
        },
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
