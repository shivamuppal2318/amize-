// Enhanced MessagesHeader.tsx - Updated with improved styling and animations
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  Plus,
  MoreVertical,
  WifiOff,
  RotateCcw,
  MessageCircle,
  MessageSquare,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { COLORS, UI } from "./constants";

interface MessagesHeaderProps {
  isConnected: boolean;
  onRetry: () => void;
}

const MessagesHeader: React.FC<MessagesHeaderProps> = ({
  isConnected,
  onRetry,
}) => (
  <View style={styles.header}>
    {/* <LinearGradient
            colors={['rgba(26, 26, 46, 0.98)', 'rgba(26, 26, 46, 0.95)']}
            style={styles.headerGradient}
        > */}
    <LinearGradient
      colors={["#1E4A72", "#000000"]}
      start={{ x: 0, y: 0.5 }} // left center
      end={{ x: 1, y: 0.5 }} // right center
      style={{ flex: 1 }}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <View style={styles.titleIcon}>
              <MessageSquare size={UI.ICON_SIZE.LARGE} color={COLORS.primary} />
            </View>
            <View style={styles.titleTexts}>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  !isConnected && styles.headerSubtitleError,
                ]}
              >
                {isConnected ? "Stay connected" : "Reconnecting..."}
              </Text>
            </View>
          </View>
          {!isConnected && (
            <View style={styles.offlineIndicator}>
              <WifiOff size={UI.ICON_SIZE.SMALL} color={COLORS.white} />
            </View>
          )}
        </View>

        <View style={styles.headerIcons}>
          {!isConnected && (
            <TouchableOpacity
              onPress={onRetry}
              style={[styles.headerIconButton, { marginLeft: 5 }]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, styles.retryIcon]}>
                <RotateCcw size={UI.ICON_SIZE.SMALL} color={COLORS.error} />
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push("/(tabs)/inbox/new")}
            activeOpacity={0.7}
          >
            <View style={styles.primaryButtonContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.primaryIconContainer}
              >
                <Plus size={UI.ICON_SIZE.MEDIUM} color={COLORS.white} />
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  header: {
    zIndex: 10,
  },
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: UI.SPACING.LG,
    paddingVertical: UI.SPACING.LG,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: UI.SPACING.MD,
    flex: 1,
  },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: UI.BORDER_RADIUS.BUTTON,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    ...UI.SHADOW.SMALL,
  },
  titleTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Math.min(Dimensions.get("window").width * 0.06, 28),
    fontWeight: "700",
    color: COLORS.white,
    fontFamily: UI.FONT_FAMILY,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    fontFamily: UI.FONT_FAMILY,
    fontWeight: "500",
  },
  headerSubtitleError: {
    color: COLORS.error,
  },
  offlineIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: UI.SPACING.SM,
    ...UI.SHADOW.SMALL,
  },
  headerIcons: {
    flexDirection: "row",
    gap: UI.SPACING.SM,
    alignItems: "center",
  },
  headerIconButton: {
    // No additional styles needed
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: UI.BORDER_RADIUS.BUTTON,
    backgroundColor: "rgba(75, 85, 99, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(75, 85, 99, 0.3)",
    ...UI.SHADOW.SMALL,
  },
  retryIcon: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  primaryButtonContainer: {
    borderRadius: UI.BORDER_RADIUS.BUTTON,
    overflow: "hidden",
    ...UI.SHADOW.PRIMARY,
  },
  primaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: UI.BORDER_RADIUS.BUTTON,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MessagesHeader;
