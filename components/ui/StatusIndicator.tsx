import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Check } from "lucide-react-native";

type StatusIndicatorProps = {
  status: "success" | "loading" | "error";
  title: string;
  message?: string;
  style?: StyleProp<ViewStyle>; // Changed className to style for RN
};

export const StatusIndicator = ({
  status,
  title,
  message,
  style,
}: StatusIndicatorProps) => {
  const getStatusContainerStyle = () => {
    switch (status) {
      case "success":
        return styles.successContainer;
      case "error":
        return styles.errorContainer;
      case "loading":
        return styles.loadingContainer;
      default:
        return {};
    }
  };

  return (
    <View style={[styles.mainContainer, style]}>
      <View style={[styles.statusContainer, getStatusContainerStyle()]}>
        {status === "success" ? (
          <Check size={32} color="white" />
        ) : status === "loading" ? (
          <ActivityIndicator size="large" color="#FF5A5F" />
        ) : (
          <Text style={styles.errorIcon}>!</Text>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusContainer: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 9999, // rounded-full
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16, // mb-4
  },
  successContainer: {
    backgroundColor: "#FF5A5F",
  },
  errorContainer: {
    backgroundColor: "#EF4444", // bg-red-500
  },
  loadingContainer: {
    backgroundColor: "#2A2A2A",
  },
  errorIcon: {
    color: "white",
    fontSize: 24, // text-2xl
  },
  title: {
    color: "white",
    fontSize: 20, // text-xl
    fontWeight: "bold",
    marginBottom: 8, // mb-2
  },
  message: {
    color: "#9CA3AF", // text-gray-400
    textAlign: "center",
  },
});
