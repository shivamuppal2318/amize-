import React from "react";
import { Platform, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, UI, TABS } from "./constants";

interface TabSelectorProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [TABS.CHATS, TABS.GROUPS];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabButton, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[styles.tabText, activeTab === tab && styles.activeTabText]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? UI.SPACING.LG : UI.SPACING.MD,
    marginBottom: UI.SPACING.MD,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 520 : undefined,
    gap: UI.SPACING.SM,
  },
  tabButton: {
    flex: 1,
    paddingVertical: UI.SPACING.SM + 2,
    paddingHorizontal: Platform.OS === "web" ? UI.SPACING.LG : UI.SPACING.MD,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: UI.BORDER_RADIUS.XL,
    backgroundColor: "rgba(10, 14, 28, 0.18)",
  },
  activeTab: {
    backgroundColor: "rgba(10, 14, 28, 0.42)",
    borderColor: COLORS.accentBorder,
  },
  tabText: {
    color: COLORS.textGray,
    fontSize: Platform.OS === "web" ? 16 : 15,
    fontWeight: "600",
    fontFamily: UI.FONT_FAMILY,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: "700",
  },
});

export default TabSelector;
