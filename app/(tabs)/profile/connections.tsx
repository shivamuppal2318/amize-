import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CheckCircle, ChevronLeft } from "lucide-react-native";
import { SocialAPI } from "@/lib/api/SocialAPI";

type ConnectionType = "followers" | "following";

type ConnectionUser = {
  id: string;
  username: string;
  fullName?: string | null;
  profilePhotoUrl?: string | null;
  creatorVerified?: boolean;
};

const LIMIT = 20;

function normalizeConnectionType(value: unknown): ConnectionType {
  return value === "following" ? "following" : "followers";
}

function extractUsers(payload: any, type: ConnectionType): ConnectionUser[] {
  const candidates = [
    payload,
    payload?.data,
    payload?.users,
    type === "followers" ? payload?.followers : payload?.following,
    payload?.results,
  ];

  const list = candidates.find((c) => Array.isArray(c));
  if (!Array.isArray(list)) return [];

  return list
    .map((item: any) => item?.user ?? item)
    .filter(Boolean)
    .map((item: any) => ({
      id: String(item.id),
      username: String(item.username ?? ""),
      fullName: item.fullName ?? item.name ?? null,
      profilePhotoUrl: item.profilePhotoUrl ?? item.avatar ?? null,
      creatorVerified: Boolean(item.creatorVerified ?? item.verified),
    }))
    .filter((item: ConnectionUser) => item.id && item.username);
}

export default function ConnectionsScreen() {
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const userId = params.id ? String(params.id) : "";
  const initialType = useMemo(
    () => normalizeConnectionType(params.type),
    [params.type]
  );

  const [connectionType, setConnectionType] =
    useState<ConnectionType>(initialType);
  const [items, setItems] = useState<ConnectionUser[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setConnectionType(initialType);
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [initialType]);

  const title = connectionType === "followers" ? "Followers" : "Following";

  const fetchPage = useCallback(
    async (nextPage: number, mode: "append" | "replace") => {
      if (!userId) {
        setError("Missing user id");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response =
          connectionType === "followers"
            ? await SocialAPI.getFollowers(userId, nextPage, LIMIT)
            : await SocialAPI.getFollowing(userId, nextPage, LIMIT);

        const nextItems = extractUsers(response, connectionType);
        setItems((prev) => (mode === "append" ? [...prev, ...nextItems] : nextItems));
        setPage(nextPage);
        setHasMore(nextItems.length >= LIMIT);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
        // Prevent endless pagination retries when backend doesn't support this endpoint (404).
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [connectionType, userId]
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1, "replace");
  }, [connectionType, fetchPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1, "replace");
    setRefreshing(false);
  }, [fetchPage]);

  const onEndReached = useCallback(() => {
    if (loading || refreshing || !hasMore) return;
    fetchPage(page + 1, "append");
  }, [fetchPage, hasMore, loading, page, refreshing]);

  const renderRow = ({ item }: { item: ConnectionUser }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(tabs)/profile/${item.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri:
            item.profilePhotoUrl ||
            "https://cdn-icons-png.flaticon.com/512/219/219983.png",
        }}
        style={styles.avatar}
      />
      <View style={styles.rowText}>
        <View style={styles.nameLine}>
          <Text style={styles.username} numberOfLines={1}>
            @{item.username}
          </Text>
          {item.creatorVerified ? (
            <View style={styles.verifiedBadge}>
              <CheckCircle size={14} color="white" />
            </View>
          ) : null}
        </View>
        {item.fullName ? (
          <Text style={styles.fullName} numberOfLines={1}>
            {item.fullName}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[
            styles.switchButton,
            connectionType === "followers" && styles.switchButtonActive,
          ]}
          onPress={() => setConnectionType("followers")}
        >
          <Text
            style={[
              styles.switchText,
              connectionType === "followers" && styles.switchTextActive,
            ]}
          >
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchButton,
            connectionType === "following" && styles.switchButtonActive,
          ]}
          onPress={() => setConnectionType("following")}
        >
          <Text
            style={[
              styles.switchText,
              connectionType === "following" && styles.switchTextActive,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          loading ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color="#FF5A5F" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.stateWrap}>
              <Text style={styles.stateText}>No {title.toLowerCase()} yet.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E4A72",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Figtree",
  },
  switchRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
  },
  switchButtonActive: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.3)",
  },
  switchText: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  switchTextActive: {
    color: "white",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  username: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "Figtree",
    maxWidth: "90%",
  },
  fullName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  verifiedBadge: {
    backgroundColor: "#1DA1F2",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stateWrap: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: "center",
    gap: 12,
  },
  stateText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Figtree",
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  retryText: {
    color: "white",
    fontWeight: "800",
    fontFamily: "Figtree",
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
