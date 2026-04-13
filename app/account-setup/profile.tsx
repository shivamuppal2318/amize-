import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
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

export default function ProfileScreen() {
  const { register, loading } = useAuth();
  const { registrationData, updateRegistrationData } = useRegistration();

  const initialFullName = useMemo(() => {
    const names = [registrationData.firstName, registrationData.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return names;
  }, [registrationData.firstName, registrationData.lastName]);

  const [fullName, setFullName] = useState(initialFullName);
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
    if (!registrationData.username || !registrationData.password) {
      router.replace("/(auth)/sign-up");
      return;
    }

    if (!registrationData.dateOfBirth) {
      router.replace("/account-setup/birthday");
    }
  }, [registrationData.username, registrationData.password, registrationData.dateOfBirth]);

  const isEmailValid = /\S+@\S+\.\S+/.test(email.trim());
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");
  const isFormValid =
    firstName.length >= 2 && lastName.length >= 2 && isEmailValid;

  const handleContinue = async () => {
    if (!isFormValid) {
      Alert.alert(
        "Incomplete Profile",
        "Enter your full name and a valid email address to continue."
      );
      return;
    }

    const trimmedEmail = email.trim();
    const registrationRequest = {
      username: registrationData.username || "",
      email: trimmedEmail,
      phoneNumber: phoneNumber.trim() || undefined,
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
      phoneNumber: phoneNumber.trim() || undefined,
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
          "Registration Failed",
          result.message || "Unable to start account verification right now."
        );
        return;
      }

      router.replace("/account-setup/verify");
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/account-setup/pin");
  };

  const handleImagePicker = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Allow photo library access to add a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const selectedUri = result.assets[0].uri;
        setProfileImage(selectedUri);
        updateRegistrationData({ profilePhotoUrl: selectedUri });
      }
    } catch (error) {
      Alert.alert(
        "Photo Error",
        "Unable to open the image picker right now. Please try again."
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
                  Fill Your Profile
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
                    Skip
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
                    Tap to add photo
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
                    Step 4 of 4
                  </Text>
                </View>

                <View style={{ width: "100%", maxWidth: 400 }}>
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                    icon={<User size={20} color="#9CA3AF" />}
                    error={
                      fullName.trim().length > 0 && !isFormValid
                        ? "Enter first and last name"
                        : ""
                    }
                  />

                  <Input
                    label="Email"
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon={<Mail size={20} color="#9CA3AF" />}
                    error={
                      email.trim().length > 0 && !isEmailValid
                        ? "Enter a valid email address"
                        : ""
                    }
                  />

                  <Input
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    icon={<Phone size={20} color="#9CA3AF" />}
                  />

                  <Input
                    label="Address"
                    placeholder="Enter your address (optional)"
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
                      Profile ready to verify
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
                  label="Continue to Verification"
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
