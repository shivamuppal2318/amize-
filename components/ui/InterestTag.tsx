import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

type InterestTagProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export const InterestTag = ({ label, selected, onPress }: InterestTagProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        selected ? styles.containerSelected : styles.containerUnselected,
      ]}
    >
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8, // py-2
    paddingHorizontal: 16, // px-4
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
    marginRight: 8, // mr-2
    marginBottom: 8, // mb-2
  },
  containerSelected: {
    backgroundColor: "#FF5A5F",
    borderColor: "#FF5A5F",
    color: "white",
  },
  containerUnselected: {
    backgroundColor: "transparent",
    borderColor: "#FF5A5F",
    color: "#FF5A5F",
  },
  text: {
    fontWeight: "500", // font-medium
  },
  textSelected: {
    color: "white",
  },
  textUnselected: {
    color: "#FF5A5F", // text-gray-300
  },
});
