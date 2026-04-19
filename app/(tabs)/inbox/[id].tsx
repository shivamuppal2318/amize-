import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

// This route exists so deep links like `/inbox/<conversationId>` work.
// We redirect into the inbox index screen which already knows how to auto-open a conversation.
export default function InboxConversationRedirect() {
  const router = useRouter();
  const { id, name, avatar } = useLocalSearchParams<{
    id: string;
    name?: string;
    avatar?: string;
  }>();

  useEffect(() => {
    if (!id) return;
    router.replace({
      pathname: "/(tabs)/inbox",
      params: {
        openConversationId: id,
        openConversationName: name,
        openConversationAvatar: avatar,
      },
    });
  }, [avatar, id, name, router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          flex: 1,
          backgroundColor: "#1E4A72",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#FF5A5F" />
      </View>
    </>
  );
}

