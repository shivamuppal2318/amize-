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
import { SITE_URL } from "@/lib/settings/constants";
import {
  ChevronRight,
  Download,
  Globe,
  Mail,
  Send,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// Privacy policy content sections
const POLICY_SECTIONS = [
  {
    id: "1",
    title: "Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, upload content, or contact us. This includes your name, email address, username, profile information, and any videos, photos, or other content you share on Amize.`,
  },
  {
    id: "2",
    title: "How We Use Your Information",
    content: `We use the information we collect to provide, maintain, and improve our services, personalize your experience, communicate with you, ensure safety and security, and comply with legal obligations. This helps us create a better platform for all creators.`,
  },
  {
    id: "3",
    title: "Information Sharing",
    content: `We do not sell your personal information. We may share your information in limited circumstances, such as with service providers who help us operate our platform, when required by law, or with your consent. Your public content is visible to other users as part of the platform experience.`,
  },
  {
    id: "4",
    title: "Your Rights and Choices",
    content: `You have the right to access, update, or delete your personal information. You can manage your privacy settings, control who can see your content, and choose how we communicate with you. Contact us if you need help exercising these rights.`,
  },
  {
    id: "5",
    title: "Data Security",
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.`,
  },
];

export default function PrivacyPolicyScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleViewFullPolicy = async () => {
    try {
      const url = `${SITE_URL}/privacy`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Unable to open browser",
          "Please visit amize.com/privacy in your web browser to view the complete privacy policy."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to open the privacy policy. Please try again later."
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
        <SettingsHeader title="Privacy Policy" onBackPress={handleBack} />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pb-6 pt-4">
            {/* Introduction */}
            <View className="mb-8">
              <Text className="text-white text-2xl font-bold mb-4">
                Your Privacy Matters
              </Text>
              <Text className="text-gray-400 leading-6 mb-4 text-justify">
                At Amize, we're committed to protecting your privacy and being
                transparent about how we collect, use, and share your
                information. Here's a summary of our key privacy practices.
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

            {/* Policy Sections */}
            {POLICY_SECTIONS.map((section) => (
              <View key={section.id} className="mb-8">
                <Text className="text-white text-xl font-bold mb-4">
                  {section.id}. {section.title}
                </Text>

                <Text className="text-gray-400 leading-6 text-justify">
                  {section.content}
                </Text>
              </View>
            ))}

            {/* View Full Policy Button */}
            <View className="mt-8 mb-4">
              <TouchableOpacity
                onPress={handleViewFullPolicy}
                className="bg-pink-500 rounded-2xl py-4 px-6 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <Globe size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  View Complete Privacy Policy
                </Text>
              </TouchableOpacity>

              <Text className="text-gray-500 text-sm text-center mt-3">
                Opens in your web browser for the full detailed policy
              </Text>
            </View>

            {/* Contact Information */}
            <View className="bg-gray-900 rounded-2xl p-6 mt-4">
              <View className="flex-row items-center mb-3">
                <Mail size={20} color="#ec4899" />
                <Text className="text-white font-semibold text-base ml-2">
                  Privacy Questions?
                </Text>
              </View>
              <Text className="text-gray-400 leading-5 mb-4">
                If you have any questions about this privacy policy or our
                privacy practices, please contact our privacy team.
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL("mailto:privacy@amize.com")}
                className="bg-gray-800 rounded-xl py-3 px-4 flex-row items-center justify-center"
                activeOpacity={0.7}
              >
                <Send size={16} color="#ec4899" />
                <Text className="text-pink-400 font-medium ml-2">
                  Contact Privacy Team
                </Text>
              </TouchableOpacity>
            </View>

            {/* Data Rights Quick Actions */}
            <View className="mt-6">
              <Text className="text-white font-semibold text-lg mb-4">
                Quick Actions
              </Text>

              <View className="flex flex-col gap-3">
                <TouchableOpacity
                  className="bg-gray-900 rounded-xl p-4 flex-row items-center justify-between"
                  activeOpacity={0.7}
                  onPress={() => {
                    // Navigate to account settings or data management
                    Alert.alert(
                      "Coming Soon",
                      "Data management features will be available in account settings."
                    );
                  }}
                >
                  <View className="flex-row items-center">
                    <Users size={20} color="#ec4899" />
                    <Text className="text-white font-medium ml-3">
                      Manage My Data
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#6b7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-gray-900 rounded-xl p-4 flex-row items-center justify-between"
                  activeOpacity={0.7}
                  onPress={() => {
                    // Navigate to privacy settings
                    Alert.alert(
                      "Coming Soon",
                      "Privacy settings will be available in account settings."
                    );
                  }}
                >
                  <View className="flex-row items-center">
                    <Shield size={20} color="#ec4899" />
                    <Text className="text-white font-medium ml-3">
                      Privacy Settings
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#6b7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-gray-900 rounded-xl p-4 flex-row items-center justify-between"
                  activeOpacity={0.7}
                  onPress={() => {
                    Linking.openURL(
                      "mailto:privacy@amize.com?subject=Data%20Download%20Request"
                    );
                  }}
                >
                  <View className="flex-row items-center">
                    <Download size={20} color="#ec4899" />
                    <Text className="text-white font-medium ml-3">
                      Download My Data
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Trust Message */}
            <View className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl p-6 mt-6 border border-pink-500/20">
              <View className="flex-row items-center mb-3">
                <ShieldCheck size={24} color="#ec4899" />
                <Text className="text-white font-bold text-lg ml-2">
                  Your Trust is Our Priority
                </Text>
              </View>
              <Text className="text-gray-300 leading-5">
                We're committed to earning and maintaining your trust through
                transparent privacy practices and strong data protection
                measures.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
