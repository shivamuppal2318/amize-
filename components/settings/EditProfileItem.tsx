import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface EditProfileItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  hasValue?: boolean;
  isLast?: boolean;
}

export const EditProfileItem: React.FC<EditProfileItemProps> = ({
  icon,
  label,
  value,
  onPress,
  hasValue = false,
  isLast = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        // backgroundColor: Platform.OS === 'ios' ? 'rgba(26, 26, 46, 0.6)' : '#1a1a2e',
        borderWidth: 0.5,
        borderColor: "rgba(255,255,255,0.2)",
        borderRadius: 16,
        marginBottom: isLast ? 0 : 16,
        ...(Platform.OS === "ios"
          ? {
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }
          : {
            shadowColor: "#fff"
          }),
        elevation: 2,
      }}
    >
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ flex: 1, borderRadius: 16 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 20,
          }}
        >
          {/* Icon Container */}
          <View
            style={{
              backgroundColor: "rgba(255, 90, 95, 0.1)",
              borderRadius: 12,
              padding: 12,
              marginRight: 16,
            }}
          >
            {icon}
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#F3F4F6",
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 4,
                fontFamily: "Figtree",
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                color: hasValue ? "#9CA3AF" : "#6B7280",
                fontSize: 15,
                fontFamily: "Figtree",
                fontStyle: hasValue ? "normal" : "italic",
                lineHeight: 20,
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {value}
            </Text>
          </View>

          {/* Arrow */}
          <View
            style={{
              backgroundColor: "rgba(255, 90, 95, 0.1)",
              borderRadius: 8,
              padding: 8,
              marginLeft: 12,
            }}
          >
            <ChevronRight size={20} color="#fff" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};
