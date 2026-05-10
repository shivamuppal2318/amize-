import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircle, Search, Users } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import apiClient from "@/lib/api/client";
import { Conversation } from "@/types/messaging";

import MessagesHeader from "./MessagesHeader";
import SearchBar from "./SearchBar";
import TabSelector from "./TabSelector";
import ConversationItem from "./ConversationItem";
import EmptyState from "./EmptyState";
import { ANIMATION, COLORS, UI } from "./constants";

interface SearchUser {
  id: string;
  username: string;
  fullName?: string;
  profilePhotoUrl?: string;
  creatorVerified?: boolean;
  isOnline?: boolean;
}

type SearchResultItem =
  | { type: "user"; id: string; user: SearchUser }
  | { type: "conversation"; id: string; conversation: Conversation };

interface ConversationsListProps {
  conversations: Conversation[];
  searchText: string;
  setSearchText: (text: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onConversationPress: (conversation: Conversation) => void;
  onUserPress: (userId: string) => void;
  isConnected: boolean;
  loading: boolean;
  onRetry: () => void;
  onRefresh: () => void;
}

const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/219/219983.png";

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  searchText,
  setSearchText,
  activeTab,
  setActiveTab,
  onConversationPress,
  onUserPress,
  isConnected,
  loading,
  onRetry,
  onRefresh,
}) => {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      const query = searchText.trim();
      if (!query || activeTab !== "Chats") {
        setUsers([]);
        setSearchLoading(false);
        return;
      }

      try {
        setSearchLoading(true);
        const response = await apiClient.get("/users/search", {
          params: {
            q: query,
            limit: 10,
          },
        });

        if (cancelled) {
          return;
        }

        const nextUsers = response.data?.success
          ? (response.data.users as SearchUser[])
          : [];
        setUsers(Array.isArray(nextUsers) ? nextUsers : []);
      } catch (error) {
        if (!cancelled) {
          console.error("[ConversationsList] Error searching users:", error);
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(runSearch, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTab, searchText]);

  const filteredAndSortedConversations = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    const filtered = conversations.filter((conversation) => {
      const matchesSearch =
        !normalizedSearch ||
        conversation.name.toLowerCase().includes(normalizedSearch) ||
        conversation.lastMessage.toLowerCase().includes(normalizedSearch);

      const matchesTab =
        activeTab === "Chats"
          ? conversation.type === "direct" || !conversation.type
          : conversation.type === "group";

      return matchesSearch && matchesTab;
    });

    return filtered.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;

      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    });
  }, [activeTab, conversations, searchText]);

  const combinedResults = useMemo(() => {
    if (!searchText.trim() || activeTab !== "Chats") {
      return filteredAndSortedConversations.map((conversation) => ({
        type: "conversation" as const,
        id: `conversation-${conversation.id}`,
        conversation,
      }));
    }

    const userResults = users.map((user) => ({
      type: "user" as const,
      id: `user-${user.id}`,
      user,
    }));

    const conversationResults = filteredAndSortedConversations.map(
      (conversation) => ({
        type: "conversation" as const,
        id: `conversation-${conversation.id}`,
        conversation,
      })
    );

    return [...userResults, ...conversationResults];
  }, [activeTab, filteredAndSortedConversations, searchText, users]);

  const highlightText = (value: string, query: string) => {
    if (!query.trim()) {
      return value;
    }

    const parts = value.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={`${part}-${index}`} style={styles.highlightText}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const renderUserItem = (user: SearchUser) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => onUserPress(user.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={["rgba(26, 26, 46, 0.7)", "rgba(26, 26, 46, 0.5)"]}
        style={styles.userCardGradient}
      >
        <Image
          source={{ uri: user.profilePhotoUrl || FALLBACK_AVATAR }}
          style={styles.userAvatar}
        />

        <View style={styles.userTextBlock}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {highlightText(user.username, searchText)}
            </Text>
            {user.creatorVerified ? (
              <CheckCircle size={14} color={COLORS.primary} />
            ) : null}
          </View>

          <Text style={styles.userSubtitle} numberOfLines={1}>
            {user.fullName
              ? highlightText(user.fullName, searchText)
              : "Start a new conversation"}
          </Text>
        </View>

        <View style={styles.userMeta}>
          {user.isOnline ? <View style={styles.onlineDot} /> : null}
          <Text style={styles.userMetaText}>Message</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: SearchResultItem;
    index: number;
  }) => {
    if (item.type === "user") {
      return renderUserItem(item.user);
    }

    return (
      <ConversationItem
        item={item.conversation}
        onPress={onConversationPress}
        animationDelay={index * ANIMATION.CONVERSATION_ITEM_DELAY}
        searchText={searchText}
      />
    );
  };

  const renderEmptyState = () => {
    if (loading || searchLoading) return null;

    if (!isConnected) {
      return (
        <EmptyState
          title="No Connection"
          subtitle="Check your internet connection and try again"
          actionText="Retry"
          onAction={onRetry}
          type="connection"
        />
      );
    }

    if (searchText.trim()) {
      return (
        <EmptyState
          title="No Results"
          subtitle={`No users or conversations found for "${searchText}"`}
          actionText="Clear Search"
          onAction={() => setSearchText("")}
          type="search"
        />
      );
    }

    if (activeTab === "Groups") {
      return (
        <EmptyState
          title="No Groups"
          subtitle="You haven't joined any groups yet"
          type="groups"
        />
      );
    }

    return (
      <EmptyState
        title="No Conversations"
        subtitle="Search for a user above or start a new conversation"
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <MessagesHeader isConnected={isConnected} onRetry={onRetry} />
        <SearchBar searchText={searchText} setSearchText={setSearchText} />
        <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />

        <FlatList
          data={combinedResults}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            combinedResults.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews
          ListHeaderComponent={
            searchLoading ? (
              <View style={styles.searchingRow}>
                <Search size={16} color={COLORS.textGray} />
                <Text style={styles.searchingText}>Searching users...</Text>
              </View>
            ) : null
          }
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: UI.SPACING.XXL,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  searchingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Platform.OS === "web" ? UI.SPACING.LG : UI.SPACING.MD,
    paddingBottom: UI.SPACING.SM,
  },
  searchingText: {
    color: COLORS.textGray,
    fontSize: 13,
    fontFamily: UI.FONT_FAMILY,
  },
  userCard: {
    marginHorizontal: Platform.OS === "web" ? UI.SPACING.LG : UI.SPACING.MD,
    marginVertical: UI.SPACING.XS,
    borderRadius: UI.BORDER_RADIUS.CARD,
    overflow: "hidden",
    ...UI.SHADOW.SMALL,
  },
  userCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: UI.BORDER_RADIUS.CARD,
    padding: Platform.OS === "web" ? UI.SPACING.LG : UI.SPACING.MD,
  },
  userAvatar: {
    width: Platform.OS === "web" ? UI.AVATAR_SIZE_LARGE : 54,
    height: Platform.OS === "web" ? UI.AVATAR_SIZE_LARGE : 54,
    borderRadius: Platform.OS === "web" ? UI.AVATAR_SIZE_LARGE / 2 : 27,
    marginRight: UI.SPACING.MD,
    backgroundColor: COLORS.gray,
  },
  userTextBlock: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    flexShrink: 1,
    color: COLORS.white,
    fontSize: Platform.OS === "web" ? 18 : 17,
    fontWeight: "600",
    fontFamily: UI.FONT_FAMILY,
  },
  userSubtitle: {
    color: COLORS.textGray,
    fontSize: Platform.OS === "web" ? 15 : 14,
    fontFamily: UI.FONT_FAMILY,
  },
  userMeta: {
    alignItems: "flex-end",
    marginLeft: UI.SPACING.SM,
  },
  userMetaText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: UI.FONT_FAMILY,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginBottom: 6,
  },
  highlightText: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontWeight: "700",
    borderRadius: 2,
    paddingHorizontal: 2,
  },
});

export default ConversationsList;
