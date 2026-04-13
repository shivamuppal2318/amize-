import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { appLinks, getSupportMailtoUrl } from "@/lib/config/appLinks";
import { FileText, Globe, Mail, Send } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const TERMS_SECTIONS = [
  {
    id: "1",
    title: "Account Responsibilities",
    content:
      "You are responsible for your account credentials and any activity that occurs under your account.",
  },
  {
    id: "2",
    title: "Content Guidelines",
    content:
      "You may not upload content that violates laws, infringes on rights, or harms other users.",
  },
  {
    id: "3",
    title: "Monetization & Payments",
    content:
      "Creator earnings and payouts require verified payment details and may be subject to review or holds.",
  },
  {
    id: "4",
    title: "Service Availability",
    content:
      "Features may change or be unavailable during maintenance, updates, or policy enforcement.",
  },
];

export default function TermsScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleViewFullTerms = async () => {
    try {
      const url = appLinks.termsOfServiceUrl;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Unable to open browser",
          "Please open the terms URL in your web browser to view the complete policy."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to open the terms of service. Please try again later."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#1E4A72] pt-0">
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <SettingsHeader title="Terms of Service" onBackPress={handleBack} />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pb-6 pt-4">
            <View className="mb-8">
              <View className="flex-row items-center mb-3">
                <FileText size={22} color="#ec4899" />
                <Text className="text-white text-2xl font-bold ml-2">
                  Terms Summary
                </Text>
              </View>
              <Text className="text-gray-400 leading-6 mb-4 text-justify">
                These terms govern your use of Amize. Below is a short summary of
                the most important sections.
              </Text>
              <Text className="text-gray-500 text-sm">
                Last updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>

            {TERMS_SECTIONS.map((section) => (
              <View key={section.id} className="mb-8">
                <Text className="text-white text-xl font-bold mb-4">
                  {section.id}. {section.title}
                </Text>
                <Text className="text-gray-400 leading-6 text-justify">
                  {section.content}
                </Text>
              </View>
            ))}

            <View className="mt-8 mb-4">
              <TouchableOpacity
                onPress={handleViewFullTerms}
                className="bg-pink-500 rounded-2xl py-4 px-6 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <Globe size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  View Complete Terms
                </Text>
              </TouchableOpacity>
              <Text className="text-gray-500 text-sm text-center mt-3">
                Opens in your web browser for the full terms
              </Text>
            </View>

            <View className="bg-gray-900 rounded-2xl p-6 mt-4">
              <View className="flex-row items-center mb-3">
                <Mail size={20} color="#ec4899" />
                <Text className="text-white font-semibold text-base ml-2">
                  Questions?
                </Text>
              </View>
              <Text className="text-gray-400 leading-5 mb-4">
                Contact support if you need clarification on these terms.
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(getSupportMailtoUrl("Terms Question"))
                }
                className="bg-gray-800 rounded-xl py-3 px-4 flex-row items-center justify-center"
                activeOpacity={0.7}
              >
                <Send size={16} color="#ec4899" />
                <Text className="text-pink-400 font-medium ml-2">
                  Contact Support
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
