import React from "react";
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
  StyleSheet,
} from "react-native";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
};

export const Button = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
}: ButtonProps) => {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    disabled && styles.button_disabled,
    loading && styles.button_loading,
    fullWidth && styles.button_fullWidth,
  ].filter(Boolean);

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    disabled && styles.text_disabled,
  ].filter(Boolean);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyles}
      activeOpacity={0.8}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={
              variant === "outline" || variant === "text" ? "#FF5A5F" : "white"
            }
          />
        </View>
      ) : (
        <Text style={textStyles}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    borderWidth: 0,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  button_primary: {
    // backgroundColor: "#FF5A5F",
    backgroundColor: "#1E4A72",
  },
  button_secondary: {
    backgroundColor: "#1a1a2e",
  },
  button_outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF5A5F",
  },
  button_text: {
    backgroundColor: "transparent",
  },
  button_sm: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  button_md: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  button_lg: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    minHeight: 64,
  },
  button_disabled: {
    opacity: 0.5,
  },
  button_loading: {
    opacity: 0.8,
  },
  button_fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Figtree",
    fontSize: 16,
  },
  text_primary: {
    color: "white",
  },
  text_secondary: {
    color: "white",
  },
  text_outline: {
    color: "#FF5A5F",
  },
  text_text: {
    color: "#FF5A5F",
  },
  text_disabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
