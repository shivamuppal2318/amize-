// Enhanced ConversationItem.tsx - Updated with improved styling and animations
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { Check, CheckCheck, Clock, Mic, Users } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Conversation } from "@/types/messaging";
import { COLORS, UI, ANIMATION } from "./constants";

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
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    setImgError(false);
  }, [item?.avatar]);

  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return "";

    try {
      const messageTime = new Date(timestamp);

      if (isNaN(messageTime.getTime())) {
        return "";
      }

      const now = new Date();
      const diffInMs = Math.abs(now.getTime() - messageTime.getTime());
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) {
        return "now";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h`;
      } else if (diffInDays < 7) {
        return `${diffInDays}d`;
      } else {
        return messageTime.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      console.warn("Error formatting timestamp in ConversationItem:", error);
      return "";
    }
  };

  // Truncate last message with smart truncation and better fallbacks
  const truncateMessage = (message: string, maxLength: number = 40): string => {
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
      return truncated.substring(0, lastSpace) + "...";
    }

    return truncated + "...";
  };

  // Highlight search text in message preview
  const highlightSearchText = (text: string, highlight: string) => {
    if (!highlight || !text) return text;

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

  // Get message status icon for sent messages
  const getMessageStatusIcon = () => {
    if (item.unreadCount === 0) {
      return <CheckCheck size={12} color={COLORS.success} />;
    }
    return null;
  };

  // Determine online status
  const isOnline =
    item.isOnline ||
    (item.participants && item.participants.some((p) => p.isOnline));
  const isUnread = item.unreadCount > 0;

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
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: imgError
                      ? FALLBACK_AVATAR
                      : item?.avatar || FALLBACK_AVATAR,
                  }}
                  style={[styles.avatar, isUnread && styles.avatarUnread]}
                  onError={() => setImgError(true)}
                />
                {isOnline && (
                  <View style={styles.onlineIndicator}>
                    <View style={styles.onlineIndicatorInner} />
                  </View>
                )}
                {item.type === "group" && (
                  <View style={styles.groupIndicator}>
                    <Users size={10} color={COLORS.white} />
                  </View>
                )}
              </View>
            </View>

            {/* Conversation Details */}
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
                {/* Message type indicator */}
                {item.lastMessage.startsWith("🎵") && (
                  <View style={styles.messageTypeIconContainer}>
                    <Mic size={12} color={COLORS.textGray} />
                  </View>
                )}

                {/* Last message preview */}
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

                {/* Unread count badge */}
                {isUnread && (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryLight]}
                    style={styles.unreadBadge}
                  >
                    <Text style={styles.unreadCount}>
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              {/* Group participants info */}
              {item.type === "group" && item.participants && (
                <Text style={styles.participantsCount}>
                  {item.participants.length} participants
                  {item.participants.filter((p) => p.isOnline).length > 0 &&
                    ` • ${
                      item.participants.filter((p) => p.isOnline).length
                    } online`}
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  conversationItemContainer: {
    marginHorizontal: UI.SPACING.LG,
    marginVertical: UI.SPACING.XS,
    borderRadius: UI.BORDER_RADIUS.CARD,
    overflow: "hidden",
    ...UI.SHADOW.SMALL,
  },
  unreadItemContainer: {
    ...UI.SHADOW.MEDIUM,
  },
  conversationItem: {
    // No additional styles needed
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
    padding: UI.SPACING.LG,
    alignItems: "flex-start",
  },
  avatarSection: {
    marginRight: UI.SPACING.MD,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: UI.AVATAR_SIZE_LARGE,
    height: UI.AVATAR_SIZE_LARGE,
    borderRadius: UI.AVATAR_SIZE_LARGE / 2,
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
    fontSize: 18,
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
    fontSize: 15,
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
