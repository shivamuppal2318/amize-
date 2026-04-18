import React, { useEffect, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCheck, Mic, Users } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Conversation } from "@/types/messaging";

import { COLORS, UI } from "./constants";

interface ConversationItemProps {
  item: Conversation;
  onPress: (conversation: Conversation) => void;
  animationDelay?: number;
  searchText?: string;
}

const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/219/219983.png";

const ConversationItem: React.FC<ConversationItemProps> = ({
  item,
  onPress,
  animationDelay = 0,
  searchText = "",
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [item?.avatar]);

  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) {
      return "";
    }

    try {
      const messageTime = new Date(timestamp);
      if (Number.isNaN(messageTime.getTime())) {
        return "";
      }

      const now = new Date();
      const diffInMs = Math.abs(now.getTime() - messageTime.getTime());
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) {
        return "now";
      }
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
      }
      if (diffInHours < 24) {
        return `${diffInHours}h`;
      }
      if (diffInDays < 7) {
        return `${diffInDays}d`;
      }

      return messageTime.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.warn("Error formatting timestamp in ConversationItem:", error);
      return "";
    }
  };

  const truncateMessage = (message: string, maxLength = 40): string => {
    if (!message || message.trim() === "") {
      return "Start a conversation";
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length <= maxLength) {
      return cleanMessage;
    }

    const truncated = cleanMessage.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > maxLength * 0.7) {
      return `${truncated.substring(0, lastSpace)}...`;
    }

    return `${truncated}...`;
  };

  const highlightSearchText = (text: string, highlight: string) => {
    if (!highlight || !text) {
      return text;
    }

    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <Text key={index} style={styles.highlightText}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const getMessageStatusIcon = () =>
    item.unreadCount === 0 ? (
      <CheckCheck size={12} color={COLORS.success} />
    ) : null;

  const isOnline =
    item.isOnline ||
    (item.participants && item.participants.some((participant) => participant.isOnline));
  const isUnread = item.unreadCount > 0;
  const messageLooksLikeAudio = /\b(voice|audio)\b/i.test(item.lastMessage);
  const onlineParticipants =
    item.participants?.filter((participant) => participant.isOnline).length || 0;

  return (
    <Animated.View
      style={[
        styles.conversationItemContainer,
        isUnread && styles.unreadItemContainer,
      ]}
    >
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isUnread
              ? ["rgba(255, 90, 95, 0.1)", "rgba(255, 90, 95, 0.05)"]
              : ["rgba(26, 26, 46, 0.6)", "rgba(26, 26, 46, 0.4)"]
          }
          style={styles.itemGradient}
        >
          <View style={styles.itemContent}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: imgError ? FALLBACK_AVATAR : item?.avatar || FALLBACK_AVATAR,
                  }}
                  style={[styles.avatar, isUnread && styles.avatarUnread]}
                  onError={() => setImgError(true)}
                />
                {isOnline ? (
                  <View style={styles.onlineIndicator}>
                    <View style={styles.onlineIndicatorInner} />
                  </View>
                ) : null}
                {item.type === "group" ? (
                  <View style={styles.groupIndicator}>
                    <Users size={10} color={COLORS.white} />
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.conversationDetails}>
              <View style={styles.conversationHeader}>
                <Text
                  style={[
                    styles.conversationName,
                    isUnread && styles.unreadName,
                  ]}
                  numberOfLines={1}
                >
                  {searchText
                    ? highlightSearchText(item.name, searchText)
                    : item.name}
                </Text>

                <View style={styles.timestampContainer}>
                  {getMessageStatusIcon()}
                  <Text
                    style={[
                      styles.conversationTime,
                      isUnread && styles.unreadTime,
                    ]}
                  >
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
              </View>

              <View style={styles.messageRow}>
                {messageLooksLikeAudio ? (
                  <View style={styles.messageTypeIconContainer}>
                    <Mic size={12} color={COLORS.textGray} />
                  </View>
                ) : null}

                <Text
                  style={[
                    styles.conversationPreview,
                    isUnread && styles.unreadPreview,
                  ]}
                  numberOfLines={1}
                >
                  {searchText
                    ? highlightSearchText(
                        truncateMessage(item.lastMessage),
                        searchText
                      )
                    : truncateMessage(item.lastMessage)}
                </Text>

                {isUnread ? (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryLight]}
                    style={styles.unreadBadge}
                  >
                    <Text style={styles.unreadCount}>
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </Text>
                  </LinearGradient>
                ) : null}
              </View>

              {item.type === "group" && item.participants ? (
                <Text style={styles.participantsCount}>
                  {item.participants.length} participants
                  {onlineParticipants > 0 ? ` - ${onlineParticipants} online` : ""}
                </Text>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  conversationItemContainer: {
    marginHorizontal: Platform.OS === "web" ? UI.SPACING.LG : UI.SPACING.MD,
    marginVertical: UI.SPACING.XS,
    borderRadius: UI.BORDER_RADIUS.CARD,
    overflow: "hidden",
    ...UI.SHADOW.SMALL,
  },
  unreadItemContainer: {
    ...UI.SHADOW.MEDIUM,
  },
  conversationItem: {
    backgroundColor:
      Platform.OS === "ios" ? "rgba(26, 26, 46, 0.6)" : "#1a1a2e",
  },
  itemGradient: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: UI.BORDER_RADIUS.CARD,
  },
  itemContent: {
    flexDirection: "row",
    padding: Platform.OS === "web" ? UI.SPACING.LG : UI.SPACING.MD,
    alignItems: "flex-start",
  },
  avatarSection: {
    marginRight: UI.SPACING.MD,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: Platform.OS === "web" ? UI.AVATAR_SIZE_LARGE : 54,
    height: Platform.OS === "web" ? UI.AVATAR_SIZE_LARGE : 54,
    borderRadius: Platform.OS === "web" ? UI.AVATAR_SIZE_LARGE / 2 : 27,
    backgroundColor: COLORS.gray,
    borderWidth: 2,
    borderColor: "rgba(75, 85, 99, 0.3)",
  },
  avatarUnread: {
    borderColor: COLORS.accentBorder,
    borderWidth: 3,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  onlineIndicatorInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  groupIndicator: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  conversationDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  conversationName: {
    color: COLORS.white,
    fontSize: Platform.OS === "web" ? 18 : 17,
    fontWeight: "600",
    fontFamily: UI.FONT_FAMILY,
    flex: 1,
    marginRight: UI.SPACING.SM,
  },
  unreadName: {
    fontWeight: "700",
    color: COLORS.textLightGray,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  conversationTime: {
    color: COLORS.textGray,
    fontSize: 13,
    fontWeight: "500",
    fontFamily: UI.FONT_FAMILY,
  },
  unreadTime: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginBottom: 4,
  },
  messageTypeIconContainer: {
    marginRight: 6,
    padding: 2,
  },
  conversationPreview: {
    color: COLORS.textGray,
    fontSize: Platform.OS === "web" ? 15 : 14,
    flex: 1,
    lineHeight: 20,
    fontFamily: UI.FONT_FAMILY,
    fontWeight: "400",
  },
  unreadPreview: {
    color: COLORS.textLightGray,
    fontWeight: "500",
  },
  highlightText: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontWeight: "700",
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  unreadBadge: {
    borderRadius: UI.BORDER_RADIUS.BADGE,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: UI.SPACING.SM,
    paddingHorizontal: 6,
    ...UI.SHADOW.SMALL,
  },
  unreadCount: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: UI.FONT_FAMILY,
  },
  participantsCount: {
    color: COLORS.textGray,
    fontSize: 13,
    fontFamily: UI.FONT_FAMILY,
    fontWeight: "400",
    marginTop: 2,
  },
});

export default ConversationItem;
