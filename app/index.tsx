import React from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootIndexPage() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#07111D",
      }}
    >
      <ActivityIndicator size="large" color="#FF5A5F" />
    </View>
  );
}
