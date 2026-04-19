import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import {
  ChevronLeft,
  User,
  Shield,
  Instagram,
  Facebook,
  Twitter,
  Camera,
  Trash2,
  Save,
  Calendar,
  Users,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/hooks/useAuth";
import { useProfileEditor } from "@/hooks/useProfileEditor";
import { BioObject, ProfileUpdateData } from "@/lib/api/profileApi";
import { ProfileAvatar } from "@/components/settings/ProfileAvatar";
import { EditProfileItem } from "@/components/settings/EditProfileItem";
import { EditFieldModal } from "@/components/profile/EditFieldModal";
import { PhotoOptionsModal } from "@/components/profile/PhotoOptionsModal";
import { LinearGradient } from "expo-linear-gradient";

interface EditField {
  key: keyof ProfileUpdateData;
  label: string;
  icon: React.ReactNode;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  maxLength?: number;
}

export default function EditProfileScreen() {
  const { loading: authLoading } = useAuth();

  const {
    profile,
    formData,
    loading,
    saving,
    uploading,
    hasChanges,
    loadProfile,
    updateFormData,
    saveChanges,
    uploadPhoto,
    removePhoto,
  } = useProfileEditor();

  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<EditField | null>(null);

  useEffect(() => {
    if (!profile) {
      loadProfile();
    }
  }, [profile, loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save them before leaving?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
          {
            text: "Save",
            onPress: async () => {
              const success = await saveChanges();
              if (success) {
                router.back();
              }
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSaveChanges = async (navigateBack = false) => {
    const success = await saveChanges();
    if (success && navigateBack) {
      router.back();
    }
  };

  const handleFieldEdit = (field: EditField) => {
    setCurrentField(field);
    setEditModalVisible(true);
  };

  const handleFieldUpdate = (value: string) => {
    if (currentField) {
      updateFormData({ [currentField.key]: value });
    }
    setEditModalVisible(false);
    setCurrentField(null);
  };

  const handlePickImage = async () => {
    setPhotoModalVisible(true);
  };

  const handleImagePickerLaunch = async (source: "library" | "camera") => {
    setPhotoModalVisible(false);
    console.log(`[DEBUG] Attempting to launch ${source}...`);

    try {
      let permission;
      if (source === "camera") {
        console.log("[DEBUG] Requesting camera permissions...");
        permission = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        console.log("[DEBUG] Requesting media library permissions...");
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      console.log("[DEBUG] Permission result:", permission);

      if (permission.status !== "granted") {
        if (!permission.canAskAgain) {
          Alert.alert(
            "Permission Required",
            `You've previously denied ${source} permissions. Please go to your device's settings to enable them for this app.`
          );
        } else {
          Alert.alert(
            "Permission Required",
            `We need your permission to access the ${source}.`
          );
        }
        return;
      }

      console.log("[DEBUG] Permissions granted. Launching picker...");
      let result;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      console.log("[DEBUG] Picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log("[DEBUG] Image selected, starting upload...");
        await uploadPhoto(asset.uri);
      } else {
        console.log("[DEBUG] Picker was canceled or no assets were selected.");
      }
    } catch (error) {
      console.error("Error during image picking process:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred while trying to select an image. Please try again."
      );
    }
  };

   const handleRemovePhoto = async () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removePhoto();
          },
        },
      ]
    );
  };

  function isBioObject(bio: unknown): bio is BioObject {
    return typeof bio === "object" && bio !== null && "name" in bio;
  }

  if (authLoading || loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#1a1a2e]">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text className="text-white text-lg mt-4">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-[#1a1a2e]">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-white text-xl font-bold mb-4">
            Profile Not Found
          </Text>
          <Text className="text-gray-400 text-center mb-6">
            Unable to load your profile. Please try again.
          </Text>
          <TouchableOpacity
            onPress={loadProfile}
            className="bg-[#FF5A5F] px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const editFields: EditField[] = [
    {
      key: "firstName",
      label: "First Name",
      icon: <User size={24} color="white" />,
      value: formData.firstName || "",
      placeholder: "Enter your first name",
      maxLength: 50,
    },
    {
      key: "lastName",
      label: "Last Name",
      icon: <User size={24} color="white" />,
      value: formData.lastName || "",
      placeholder: "Enter your last name",
      maxLength: 50,
    },
    {
      key: "username",
      label: "Username",
      icon: <User size={24} color="white" />,
      value: formData.username || "",
      placeholder: "Enter your username",
      maxLength: 30,
    },
    {
      key: "bio",
      label: "Bio",
      icon: <Shield size={24} color="white" />,
      value:
        typeof formData.bio === "string"
          ? formData.bio
          : formData.bio?.name || "",
      placeholder: "Tell us about yourself...",
      multiline: true,
      maxLength: 160,
    },
    {
      key: "gender",
      label: "Gender",
      icon: <Users size={24} color="white" />,
      value: formData.gender || "",
      placeholder: "Enter your gender",
      maxLength: 20,
    },
    {
      key: "dateOfBirth",
      label: "Date of Birth",
      icon: <Calendar size={24} color="white" />,
      value: formData.dateOfBirth || "",
      placeholder: "YYYY-MM-DD",
      keyboardType: "numeric",
    },
  ];

  const socialFields: EditField[] = [
    {
      key: "instagramHandle",
      label: "Instagram",
      icon: <Instagram size={24} color="white" />,
      value: formData.instagramHandle || "",
      placeholder: "Your Instagram handle",
      maxLength: 30,
    },
    {
      key: "facebookHandle",
      label: "Facebook",
      icon: <Facebook size={24} color="white" />,
      value: formData.facebookHandle || "",
      placeholder: "Your Facebook name",
      maxLength: 50,
    },
    {
      key: "twitterHandle",
      label: "Twitter",
      icon: <Twitter size={24} color="white" />,
      value: formData.twitterHandle || "",
      placeholder: "Your Twitter handle",
      maxLength: 30,
    },
  ];

  return (
    <LinearGradient
      colors={["#1E4A72", "#000000"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between p-6 pb-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleBack} className="pr-4">
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Edit Profile</Text>
          </View>

          {hasChanges && (
            <TouchableOpacity
              onPress={() => handleSaveChanges()}
              disabled={saving}
              className="bg-[#FF5A5F] px-4 py-2 rounded-full flex-row items-center"
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Save size={16} color="white" />
                  <Text className="text-white font-semibold ml-2">Save</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF5A5F"
            />
          }
        >
          <View className="items-center px-6 pb-6">
            <View className="relative">
              <ProfileAvatar
                uri={profile.profilePhotoUrl}
                size={120}
                editable={false}
                loading={uploading}
              />

              {uploading && (
                <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                  <ActivityIndicator size="large" color="#FF5A5F" />
                </View>
              )}

              <TouchableOpacity
                onPress={handlePickImage}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-[#1E4A72] p-3 rounded-full"
                style={{
                  borderWidth: 1,
                  borderColor: "#b6b6b6",
                }}
              >
                <Camera size={20} color="white" />
              </TouchableOpacity>

              {profile.profilePhotoUrl && (
                <TouchableOpacity
                  onPress={handleRemovePhoto}
                  disabled={uploading}
                  className="absolute -bottom-2 -left-2 bg-red-500 p-2 rounded-full border-4 border-[#1a1a2e]"
                >
                  <Trash2 size={16} color="white" />
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-white text-2xl font-semibold mt-4">
              @{profile.username}
            </Text>

            <Text className="text-gray-400 text-base mb-6">
              {typeof profile?.bio === "string"
                ? profile.bio
                : isBioObject(profile?.bio)
                ? profile.bio.name
                : profile?.fullName || "No bio yet"}
            </Text>

            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploading}
              className="bg-[#fff]/20 border border-[#99c5ee]/50 px-6 py-3 rounded-full"
            >
              <Text className="text-[#deeaf5] font-semibold">
                {uploading ? "Uploading..." : "Change Photo"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="h-px bg-gray-800 mx-6 mb-6" />

          <View className="px-6 mb-8">
            <Text className="text-white text-2xl font-semibold mb-6">
              Personal Information
            </Text>

            {editFields.map((field, index) => (
              <EditProfileItem
                key={field.key}
                icon={field.icon}
                label={field.label}
                value={field.value || `Add ${field.label.toLowerCase()}`}
                onPress={() => handleFieldEdit(field)}
                hasValue={!!field.value}
                isLast={index === editFields.length - 1}
              />
            ))}
          </View>

          <View className="px-6 mb-8">
            <Text className="text-white text-2xl font-semibold mb-6">
              Social Media
            </Text>

            {socialFields.map((field, index) => (
              <EditProfileItem
                key={field.key}
                icon={field.icon}
                label={field.label}
                value={
                  field.value ? `@${field.value}` : `Add ${field.label} handle`
                }
                onPress={() => handleFieldEdit(field)}
                hasValue={!!field.value}
                isLast={index === socialFields.length - 1}
              />
            ))}
          </View>

          <View className="h-20" />
        </ScrollView>

        {currentField && (
          <EditFieldModal
            visible={editModalVisible}
            field={currentField}
            onSave={handleFieldUpdate}
            onClose={() => {
              setEditModalVisible(false);
              setCurrentField(null);
            }}
          />
        )}

        <PhotoOptionsModal
          visible={photoModalVisible}
          onCamera={() => handleImagePickerLaunch("camera")}
          onLibrary={() => handleImagePickerLaunch("library")}
          onClose={() => setPhotoModalVisible(false)}
          hasPhoto={!!profile.profilePhotoUrl}
          onRemove={handleRemovePhoto}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
