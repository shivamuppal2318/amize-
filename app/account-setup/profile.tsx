import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ChevronLeft, User, Mail, Phone, MapPin, Plus } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useRegistration } from "@/context/RegistrationContext";
import { LinearGradient } from "expo-linear-gradient";
import { useI18n } from "@/hooks/useI18n";

const buildStoredFullName = (
  firstName?: string,
  lastName?: string,
  username?: string
) => {
  const joined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (!joined) {
    return "";
  }

  const normalizedUsername = (username || "").trim().toLowerCase();
  const normalizedJoined = joined.toLowerCase();

  // Ignore stale values where signup username leaked into name fields.
  if (
    normalizedUsername &&
    (normalizedJoined === normalizedUsername ||
      normalizedJoined.replace(/\s+/g, "") === normalizedUsername.replace(/\s+/g, ""))
  ) {
    return "";
  }

  const parts = joined.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return "";
  }

  return joined;
};

export default function ProfileScreen() {
  const { t } = useI18n();
  const {
    register,
    completeSignupFlow,
    hasCompletedOnboarding,
    updateUser,
    loading,
  } = useAuth();
  const { registrationData, updateRegistrationData, clearRegistrationData, isHydrated } = useRegistration();

  const initialFullName = useMemo(() => {
    return buildStoredFullName(
      registrationData.firstName,
      registrationData.lastName,
      registrationData.username
    );
  }, [
    registrationData.firstName,
    registrationData.lastName,
    registrationData.username,
  ]);

  const [firstNameInput, setFirstNameInput] = useState(
    registrationData.firstName || ""
  );
  const [lastNameInput, setLastNameInput] = useState(
    registrationData.lastName || ""
  );
  const [email, setEmail] = useState(registrationData.email || "");
  const [phoneNumber, setPhoneNumber] = useState(
    registrationData.phoneNumber || ""
  );
  const [address, setAddress] = useState(registrationData.address || "");
  const [profileImage, setProfileImage] = useState<string | null>(
    registrationData.profilePhotoUrl || null
  );
  const [submitting, setSubmitting] = useState(false);

  const isRemoteUrl = (value: string | null) =>
    !!value && /^https?:\/\//i.test(value);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!registrationData.username || !registrationData.password) {
      router.replace("/(auth)/sign-up");
      return;
    }

    if (!registrationData.dateOfBirth || !registrationData.birthdayConfirmed) {
      router.replace("/account-setup/birthday");
    }
  }, [
    isHydrated,
    registrationData.username,
    registrationData.password,
    registrationData.dateOfBirth,
    registrationData.birthdayConfirmed,
  ]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const nameParts = initialFullName.split(/\s+/).filter(Boolean);
    setFirstNameInput(nameParts[0] || registrationData.firstName || "");
    setLastNameInput(
      nameParts.slice(1).join(" ") || registrationData.lastName || ""
    );
  }, [
    initialFullName,
    isHydrated,
    registrationData.firstName,
    registrationData.lastName,
  ]);

  const isEmailValid = /\S+@\S+\.\S+/.test(email.trim());
  const normalizedPhoneNumber = phoneNumber.trim();
  const isPhoneValid = /^\+?\d{7,15}$/.test(
    normalizedPhoneNumber.replace(/[^\d+]/g, "")
  );
  const firstName = firstNameInput.trim();
  const lastName = lastNameInput.trim();
  const isFormValid =
    firstName.length >= 2 &&
    lastName.length >= 2 &&
    isEmailValid &&
    isPhoneValid;

  const handleContinue = async () => {
    if (!isFormValid) {
      Alert.alert(
        t("onboarding.profile.incompleteTitle"),
        t("onboarding.profile.incompleteMessage")
      );
      return;
    }

    const trimmedEmail = email.trim();
    const registrationRequest = {
      username: registrationData.username || "",
      email: trimmedEmail,
      phoneNumber: normalizedPhoneNumber,
      address: address.trim() || undefined,
      password: registrationData.password || "",
      confirmPassword: registrationData.confirmPassword || "",
      firstName,
      lastName,
      gender: registrationData.gender,
      dateOfBirth: registrationData.dateOfBirth,
      interests: registrationData.interests,
      profilePhotoUrl: isRemoteUrl(profileImage) ? profileImage || undefined : undefined,
    };

    updateRegistrationData({
      email: trimmedEmail,
      phoneNumber: normalizedPhoneNumber,
      address: address.trim() || undefined,
      firstName,
      lastName,
      profilePhotoUrl: isRemoteUrl(profileImage) ? profileImage || undefined : undefined,
    });

    try {
      setSubmitting(true);
      const result = await register(registrationRequest);

      if (!result.success) {
        Alert.alert(
          t("onboarding.profile.registrationFailedTitle"),
          result.message || t("onboarding.profile.registrationFailedDefault")
        );
        return;
      }

      updateUser({ verified: true });
      await completeSignupFlow();
      clearRegistrationData();
      router.replace(hasCompletedOnboarding ? "/(tabs)" : "/onboarding/step1");
    } catch (error) {
      Alert.alert(
        t("onboarding.profile.errorTitle"),
        t("onboarding.profile.errorMessage")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      t("onboarding.profile.requiredTitle"),
      t("onboarding.profile.requiredMessage")
    );
  };

  const handleImagePicker = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          t("onboarding.profile.permissionTitle"),
          t("onboarding.profile.permissionMessage")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        ...(Platform.OS === "android" ? { legacy: true } : {}),
      });

      if (!result.canceled && result.assets?.length) {
        const selectedUri = result.assets[0].uri;
        setProfileImage(selectedUri);
        updateRegistrationData({ profilePhotoUrl: selectedUri });
      }
    } catch (error) {
      Alert.alert(
        t("onboarding.profile.photoErrorTitle"),
        t("onboarding.profile.photoErrorMessage")
      );
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1E4A72"
        translucent
      />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#1a1a2e" }}
        edges={["top"]}
      >
        <LinearGradient
          colors={["#1E4A72", "#000000"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, paddingHorizontal: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                }}
              >
                <TouchableOpacity
                  style={{ padding: 8, marginLeft: -8 }}
                  onPress={() => router.back()}
                >
                  <ChevronLeft size={24} color="white" />
                </TouchableOpacity>

                <Text
                  style={{
                    color: "white",
                    fontSize: 18,
                    fontWeight: "600",
                    fontFamily: "Figtree",
                  }}
                >
                  {t("onboarding.profile.title")}
                </Text>

                <TouchableOpacity onPress={handleSkip}>
                  <Text
                    style={{
                      color: "#FF5A5F",
                      fontSize: 16,
                      fontWeight: "500",
                      fontFamily: "Figtree",
                    }}
                  >
                    {t("onboarding.profile.info")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={{ flex: 1, alignItems: "center", paddingVertical: 20 }}
              >
                <View style={{ alignItems: "center", marginBottom: 32 }}>
                  <TouchableOpacity
                    onPress={handleImagePicker}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: "#1a1a2e",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      borderWidth: 3,
                      borderColor: "#4B5563",
                    }}
                  >
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={{
                          width: 114,
                          height: 114,
                          borderRadius: 57,
                        }}
                      />
                    ) : (
                      <User size={48} color="#9CA3AF" />
                    )}

                    <View
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: "#FF5A5F",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 3,
                        borderColor: "#1a1a2e",
                      }}
                    >
                      <Plus size={16} color="white" />
                    </View>
                  </TouchableOpacity>

                  <Text
                    style={{
                      color: "#9CA3AF",
                      fontSize: 14,
                      marginTop: 8,
                      fontFamily: "Figtree",
                    }}
                  >
                    {t("onboarding.profile.addPhoto")}
                  </Text>
                </View>

                <View style={{ paddingHorizontal: 32, marginBottom: 24 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {[0, 1, 2, 3].map((index) => (
                      <View
                        key={index}
                        style={{
                          flex: 1,
                          height: 8,
                          backgroundColor: "#FF5A5F",
                          borderRadius: 4,
                        }}
                      />
                    ))}
                  </View>
                  <Text
                    style={{
                      color: "#9CA3AF",
                      fontSize: 14,
                      textAlign: "center",
                      marginTop: 8,
                      fontFamily: "Figtree",
                    }}
                  >
                    {t("onboarding.profile.step")}
                  </Text>
                </View>

                <View style={{ width: "100%", maxWidth: 400 }}>
                  <Input
                    label={t("onboarding.profile.firstName")}
                    placeholder={t("onboarding.profile.firstNamePlaceholder")}
                    value={firstNameInput}
                    onChangeText={setFirstNameInput}
                    icon={<User size={20} color="#9CA3AF" />}
                    error={
                      firstNameInput.trim().length > 0 && firstName.length < 2
                        ? t("onboarding.profile.firstNameError")
                        : ""
                    }
                  />

                  <Input
                    label={t("onboarding.profile.lastName")}
                    placeholder={t("onboarding.profile.lastNamePlaceholder")}
                    value={lastNameInput}
                    onChangeText={setLastNameInput}
                    icon={<User size={20} color="#9CA3AF" />}
                    error={
                      lastNameInput.trim().length > 0 && lastName.length < 2
                        ? t("onboarding.profile.lastNameError")
                        : ""
                    }
                  />

                  <Input
                    label={t("onboarding.profile.email")}
                    placeholder={t("onboarding.profile.emailPlaceholder")}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon={<Mail size={20} color="#9CA3AF" />}
                    error={
                      email.trim().length > 0 && !isEmailValid
                        ? t("onboarding.profile.emailError")
                        : ""
                    }
                  />

                  <Input
                    label={t("onboarding.profile.phone")}
                    placeholder={t("onboarding.profile.phonePlaceholder")}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    icon={<Phone size={20} color="#9CA3AF" />}
                  />

                  <Input
                    label={t("onboarding.profile.address")}
                    placeholder={t("onboarding.profile.addressPlaceholder")}
                    value={address}
                    onChangeText={setAddress}
                    icon={<MapPin size={20} color="#9CA3AF" />}
                  />
                </View>

                {isFormValid && (
                  <View style={{ marginTop: 16, marginBottom: 8 }}>
                    <Text
                      style={{
                        color: "#10B981",
                        fontSize: 14,
                        textAlign: "center",
                        fontFamily: "Figtree",
                      }}
                    >
                      {t("onboarding.profile.ready")}
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  paddingBottom: 32,
                  width: "100%",
                  maxWidth: 400,
                  alignSelf: "center",
                }}
              >
                <Button
                  label={t("onboarding.profile.continue")}
                  onPress={handleContinue}
                  variant="primary"
                  fullWidth
                  loading={loading || submitting}
                  disabled={!isFormValid || loading || submitting}
                />
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}
