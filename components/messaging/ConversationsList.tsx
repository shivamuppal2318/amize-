import React, { useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import { Conversation } from "@/types/messaging";
import MessagesHeader from "./MessagesHeader";
import SearchBar from "./SearchBar";
import TabSelector from "./TabSelector";
import ConversationItem from "./ConversationItem";
import EmptyState from "./EmptyState";
import { ANIMATION, COLORS, UI } from "./constants";
import { LinearGradient } from "expo-linear-gradient";

interface ConversationsListProps {
  conversations: Conversation[];
  searchText: string;
  setSearchText: (text: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onConversationPress: (conversation: Conversation) => void;
  isConnected: boolean;
  loading: boolean;
  onRetry: () => void;
  onRefresh: () => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  searchText,
  setSearchText,
  activeTab,
  setActiveTab,
  onConversationPress,
  isConnected,
  loading,
  onRetry,
  onRefresh,
}) => {
  // Filter and sort conversations based on search text and active tab
  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations.filter((conv) => {
      // Filter by search text
      const matchesSearch =
        searchText === "" ||
        conv.name.toLowerCase().includes(searchText.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchText.toLowerCase());

      // Filter by tab
      const matchesTab =
        activeTab === "Chats"
          ? conv.type === "direct" || !conv.type // Default to direct if no type
          : conv.type === "group";

      return matchesSearch && matchesTab;
    });

    // Sort by last message timestamp (most recent first)
    return filtered.sort((a, b) => {
      // Handle conversations with unread messages first
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;

      // Then sort by timestamp
      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    });
  }, [conversations, searchText, activeTab]);

  const renderConversationItem = ({
    item,
    index,
  }: {
    item: Conversation;
    index: number;
  }) => (
    <ConversationItem
      item={item}
      onPress={onConversationPress}
      animationDelay={index * ANIMATION.CONVERSATION_ITEM_DELAY}
      searchText={searchText} // Pass search text for highlighting
    />
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (!isConnected) {
      return (
        <EmptyState
          title="No Connection"
          subtitle="Check your internet connection and try again"
          actionText="Retry"
          onAction={onRetry}
        />
      );
    }

    if (searchText) {
      return (
        <EmptyState
          title="No Results"
          subtitle={`No conversations found for "${searchText}"`}
          actionText="Clear Search"
          onAction={() => setSearchText("")}
        />
      );
    }

    if (activeTab === "Groups") {
      return (
        <EmptyState
          title="No Groups"
          subtitle="You haven't joined any groups yet"
        />
      );
    }

    return (
      <EmptyState
        title="No Conversations"
        subtitle="Start a new conversation to begin messaging"
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
          data={filteredAndSortedConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredAndSortedConversations.length === 0 &&
              styles.emptyListContent,
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
          getItemLayout={(data, index) => ({
            length: 72, // Approximate item height
            offset: 72 * index,
            index,
          })}
          removeClippedSubviews={true}
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
});

export default ConversationsList;
