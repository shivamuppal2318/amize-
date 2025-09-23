import React, { useState } from "react";
import { View, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { User, Edit2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ProfileAvatarProps {
  uri?: string | null;
  size?: number;
  editable?: boolean;
  onEditPress?: () => void;
  loading?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  uri,
  size = 100,
  editable = false,
  onEditPress,
  loading = false,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const renderPlaceholder = () => (
    <LinearGradient
    //   colors={["#FF5A5F", "#FF7A7F"]}
    colors={["#1E4A72", "#000000"]}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#888",
      }}
    >
      <User size={size * 0.4} color="#888" />
    </LinearGradient>
  );

  const renderImage = () => (
    <View style={{ position: "relative" }}>
      <Image
        source={{ uri: uri! }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderColor: "#FF5A5F",
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        resizeMode="cover"
      />

      {/* Loading overlay */}
      {imageLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(26, 26, 46, 0.8)",
            borderRadius: size / 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="#FF5A5F" />
        </View>
      )}
    </View>
  );

  const avatarContent = () => {
    if (loading) {
      return (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "rgba(26, 26, 46, 0.8)",
            borderWidth: 4,
            borderColor: "#FF5A5F",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="#FF5A5F" />
        </View>
      );
    }

    if (!uri || imageError) {
      return renderPlaceholder();
    }

    return renderImage();
  };

  if (editable && onEditPress) {
    return (
      <TouchableOpacity
        onPress={onEditPress}
        activeOpacity={0.8}
        style={{ position: "relative" }}
      >
        {avatarContent()}

        {/* Edit button */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            backgroundColor: "#FF5A5F",
            borderRadius: (size * 0.15) / 2,
            width: size * 0.3,
            height: size * 0.3,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 3,
            borderColor: "#1a1a2e",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Edit2 size={size * 0.15} color="white" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        shadowColor: "#FF5A5F",
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {avatarContent()}
    </View>
  );
};
