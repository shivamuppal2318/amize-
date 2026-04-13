import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { isDemoMode } from "@/lib/release/releaseConfig";

export function DemoBanner() {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <Text style={styles.title}>Demo build</Text>
      <Text style={styles.subtitle}>
        Preview data only. Payments, ads, and live services are disabled.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    zIndex: 50,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.35)",
    backgroundColor: "rgba(17, 24, 39, 0.92)",
  },
  title: {
    color: "#FDBA74",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Figtree",
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#FDE68A",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Figtree",
  },
});
