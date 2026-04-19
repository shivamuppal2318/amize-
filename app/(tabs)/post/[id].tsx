import { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";

// Placeholder post detail route so the router has a valid default export.
// The app currently focuses on the feed experience; this route prevents runtime warnings/crashes.
export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const label = useMemo(() => (id ? String(id) : "post"), [id]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1, paddingTop: 16, paddingHorizontal: 16 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <ChevronLeft size={22} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Back
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
            Post details
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            This screen is a placeholder for now. Post id: {label}
          </Text>
        </View>
      </LinearGradient>
    </>
  );
}

