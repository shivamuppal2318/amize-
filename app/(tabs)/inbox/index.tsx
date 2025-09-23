import React, { useEffect } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import MessagingSection from "@/components/messaging/MessagingSection";
import { MessageProvider } from "@/context/MessageContext";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Messages screen component that implements the messaging feature
 * using the MessagingSection component wrapped in the MessageProvider
 * for proper data management
 */
export default function MessagesScreen() {
  const params = useLocalSearchParams<{
    openConversationId?: string;
    openConversationName?: string;
    openConversationAvatar?: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <MessageProvider>
          <MessagingSection
            autoOpenConversation={
              params.openConversationId
                ? {
                    id: params.openConversationId,
                    name: params.openConversationName || "User",
                    avatar:
                      params.openConversationAvatar ||
                      "https://via.placeholder.com/40",
                  }
                : undefined
            }
          />
        </MessageProvider>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#1a1a2e",
  },
});
