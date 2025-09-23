import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MessageCircle, Search, Users, Wifi } from "lucide-react-native";
import { MotiView } from "moti";
import { COLORS, UI } from "./constants";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  type?: "messages" | "search" | "groups" | "connection";
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  actionText,
  onAction,
  type = "messages",
}) => {
  const getIcon = () => {
    switch (type) {
      case "search":
        return <Search size={48} color={COLORS.textGray} />;
      case "groups":
        return <Users size={48} color={COLORS.textGray} />;
      case "connection":
        return <Wifi size={48} color={COLORS.error} />;
      default:
        return <MessageCircle size={48} color={COLORS.textGray} />;
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500 }}
      style={styles.container}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {actionText && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: UI.SPACING.XL,
    paddingVertical: UI.SPACING.XL * 2,
  },
  iconContainer: {
    marginBottom: UI.SPACING.LG,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: UI.SPACING.SM,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: UI.SPACING.LG,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: UI.SPACING.XL,
    paddingVertical: UI.SPACING.MD,
    borderRadius: UI.BORDER_RADIUS.SEARCH,
    marginTop: UI.SPACING.MD,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EmptyState;
