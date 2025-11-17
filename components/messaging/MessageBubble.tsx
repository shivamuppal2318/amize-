// Enhanced MessageBubble.tsx - Updated with improved styling and animations
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { CheckCheck, RotateCcw, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Message } from "@/types/messaging";
import { COLORS, ANIMATION, UI } from "./constants";

interface MessageBubbleProps {
  message: Message;
  position: "first" | "middle" | "last" | "single";
  isLastInGroup?: boolean;
  onRetry?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  position,
  isLastInGroup = false,
  onRetry,
}) => {
  const isMe = message.isFromCurrentUser;
  const isFailed = message.status === "failed";

  // Enhanced border radius logic for better bubble grouping
  const getBubbleRadius = () => {
    const baseRadius = UI.BORDER_RADIUS.MESSAGE;
    const smallRadius = 6;

    return {
      borderTopLeftRadius:
        isMe && position !== "first" ? smallRadius : baseRadius,
      borderTopRightRadius:
        !isMe && position !== "first" ? smallRadius : baseRadius,
      borderBottomLeftRadius:
        isMe && position !== "last" && position !== "single"
          ? smallRadius
          : baseRadius,
      borderBottomRightRadius:
        !isMe && position !== "last" && position !== "single"
          ? smallRadius
          : baseRadius,
    };
  };

  // Get status icon with enhanced styling
  const getStatusIcon = () => {
    if (!isMe) return null;

    const iconProps = {
      size: 14,
      style: styles.statusIcon,
    };

    switch (message.status) {
      case "sending":
        return <ActivityIndicator size={12} color={COLORS.white} />;
      case "sent":
        return <Clock {...iconProps} color="rgba(255, 255, 255, 0.7)" />;
      case "delivered":
        return <CheckCheck {...iconProps} color="rgba(255, 255, 255, 0.8)" />;
      case "read":
        return <CheckCheck {...iconProps} color={COLORS.success} />;
      case "failed":
        return (
          <TouchableOpacity
            onPress={() => onRetry?.(message.id)}
            style={styles.retryButton}
            activeOpacity={0.7}
          >
            <RotateCcw size={14} color={COLORS.error} />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  // Render message bubble content
  const renderBubbleContent = () => (
    <View
      style={[
        styles.messageBubble,
        getBubbleRadius(),
        isFailed && styles.failedBubble,
      ]}
    >
      {/* Message text */}
      <Text
        style={[
          styles.messageText,
          isMe ? styles.sentMessageText : styles.receivedMessageText,
        ]}
      >
        {message.content}
      </Text>

      {/* Message footer with timestamp and status */}
      <View style={styles.messageFooter}>
        <Text
          style={[
            styles.messageTime,
            isMe ? styles.sentMessageTime : styles.receivedMessageTime,
          ]}
        >
          {message.timestamp}
        </Text>
        {getStatusIcon()}
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.messageBubbleRow,
        isMe ? styles.sentMessageRow : styles.receivedMessageRow,
        { marginBottom: isLastInGroup ? UI.SPACING.MD : UI.SPACING.XS },
      ]}
    >
      {/* Message bubble with gradient for sent messages */}
      {isMe ? (
        <LinearGradient
          colors={
            isFailed
              ? [COLORS.error, "rgba(239, 68, 68, 0.8)"]
              : ["#c3c4c9", "#737480"]
          }
          style={[
            styles.sentBubbleGradient,
            getBubbleRadius(),
            styles.bubbleContainer,
          ]}
        >
          {renderBubbleContent()}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.receivedBubbleContainer,
            getBubbleRadius(),
            styles.bubbleContainer,
          ]}
        >
          <LinearGradient
            colors={["rgba(26, 26, 46, 0.9)", "rgba(26, 26, 46, 0.7)"]}
            style={[styles.receivedBubbleGradient, getBubbleRadius()]}
          >
            {renderBubbleContent()}
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubbleRow: {
    flexDirection: "row",
  },
  sentMessageRow: {
    justifyContent: "flex-end",
  },
  receivedMessageRow: {
    justifyContent: "flex-start",
  },
  bubbleContainer: {
    maxWidth: "80%",
    minWidth: "20%",
    ...UI.SHADOW.SMALL,
  },
  sentBubbleGradient: {
    // Gradient is applied as container
  },
  receivedBubbleContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  receivedBubbleGradient: {
    // Gradient for received messages
  },
  messageBubble: {
    paddingHorizontal: UI.SPACING.LG,
    paddingVertical: UI.SPACING.MD,
    backgroundColor: "transparent", // Let gradient show through
  },
  failedBubble: {
    opacity: 0.8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: UI.FONT_FAMILY,
    fontWeight: "600",
  },
  sentMessageText: {
    color: COLORS.black,
  },
  receivedMessageText: {
    color: COLORS.textLightGray,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: UI.SPACING.SM,
    gap: UI.SPACING.XS,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: UI.FONT_FAMILY,
    fontWeight: "500",
  },
  sentMessageTime: {
    // color: "rgba(255, 255, 255, 0.8)",
    color: "rgb(0,0,0)",
  },
  receivedMessageTime: {
    // color: COLORS.textGray,
    color: "rgb(0,0,0)",
  },
  statusIcon: {
    marginLeft: 2,
  },
  retryButton: {
    padding: 2,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    marginLeft: 4,
  },
});

export default MessageBubble;
