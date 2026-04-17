import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import {
  User,
  Shield,
  Globe,
  Moon,
  HelpCircle,
  FileText,
  LogOut,
  Lock,
  Edit3,
  ChevronRight,
  Star,
  Settings as SettingsIcon,
  Bell,
  BadgeDollarSign,
  Download,
  Trash2,
  Wallet,
  MapPin,
  Gift,
} from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { useSettings } from "@/hooks/useSettings";
import { CustomModal } from "@/components/ui/CustomModal";
import { ProfileAvatar } from "@/components/settings/ProfileAvatar";
import { EditProfileButton } from "@/components/settings/EditProfileButton";
import { SettingsMenuItem } from "@/components/settings/SettingsMenuItem";
import { SettingsToggleSwitch } from "@/components/settings/SettingsToggleSwitch";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { BioObject } from "@/lib/api/profileApi";
import { isDemoMode } from "@/lib/release/releaseConfig";

export default function SettingsScreen() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { languageName } = useI18n();
  const { settings, updateSetting } = useSettings();
  const demoMode = isDemoMode();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  console.log(user);

  useEffect(() => {
    if (!loading) {
      // Run entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const handleEditProfile = () => {
    router.push("/settings/edit-profile");
  };

  const handleNavigateToLogin = () => {
    router.replace("/(auth)/sign-in");
  };

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  const handleToggleDarkMode = async (value: boolean) => {
    await updateSetting("darkMode", value);
  };

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoggingOut(false);
      setLogoutModalVisible(false);
    }
  };

  const handleCloseModal = () => {
    setLogoutModalVisible(false);
  };

  // Format number for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  function isBioObject(bio: unknown): bio is BioObject {
    return typeof bio === "object" && bio !== null && "name" in bio;
  }

  // Enhanced Menu Item Component
  const EnhancedMenuItem = ({
    icon,
    label,
    onPress,
    danger = false,
    showChevron = true,
    subtitle = null,
    rightElement = null,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    danger?: boolean;
    showChevron?: boolean;
    subtitle?: string | null;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, danger && styles.dangerMenuItem]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuItemIcon, danger && styles.dangerIcon]}>
          {icon}
        </View>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemLabel, danger && styles.dangerText]}>
            {label}
          </Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {rightElement}
        {showChevron && !rightElement && (
          <ChevronRight size={20} color={danger ? "#FF5A5F" : "#6B7280"} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Enhanced Toggle Switch Component
  const EnhancedToggle = ({
    icon,
    label,
    value,
    onToggle,
    subtitle = null,
  }: {
    icon: React.ReactNode;
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    subtitle?: string | null;
  }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>{icon}</View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemLabel}>{label}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        <TouchableOpacity
          style={[styles.toggleSwitch, value && styles.toggleSwitchActive]}
          onPress={() => onToggle(!value)}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.toggleThumb,
              {
                transform: [
                  {
                    translateX: value ? 22 : 2,
                  },
                ],
              },
            ]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#1E4A72", "#000000"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        >
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color="#FF5A5F" />
            </View>
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#1E4A72", "#000000"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        >
          <View style={styles.unauthenticatedContainer}>
            <Animated.View
              style={[
                styles.unauthenticatedContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.unauthenticatedIcon}>
                <Lock size={44} color="#FF5A5F" />
              </View>

              <Text style={styles.unauthenticatedTitle}>
                Authentication Required
              </Text>

              <Text style={styles.unauthenticatedSubtitle}>
                You need to sign in to access your settings and profile
                information.
              </Text>

              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleNavigateToLogin}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#FF5A5F", "#FF7A7F"]}
                  style={styles.signInGradient}
                >
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Authenticated state with valid user
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <StatusBar style="light" backgroundColor="transparent" />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Settings</Text>
              <View style={styles.headerIcon}>
                <SettingsIcon size={28} color="#fff" />
              </View>
            </View>

            {/* Profile Section */}
            <Animated.View
              style={[
                styles.profileSection,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={["#1E4A72", "#000000"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.profileGradient}
              >
                <View style={styles.profileContent}>
                  {/* Avatar Section */}
                  <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                      <Image
                        source={{
                          uri: user.profilePhotoUrl  ||
                          "https://cdn-icons-png.flaticon.com/512/219/219983.png",
                        }}
                        style={styles.profileImage}
                      />
                      <TouchableOpacity
                        style={styles.editAvatarButton}
                        onPress={handleEditProfile}
                        activeOpacity={0.8}
                      >
                        <Edit3 size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Profile Info */}
                  <View style={styles.profileInfo}>
                    <Text style={styles.username}>
                      @{user.username || "username"}
                    </Text>
                    <Text className="text-gray-400 text-base mb-6">
                      {user?.fullName
                        ? user.fullName
                        : user?.bio
                        ? typeof user.bio === "string"
                          ? user.bio
                          : isBioObject(user.bio)
                          ? user.bio.name
                          : null
                        : user?.fullName || "No bio available."}
                    </Text>

                    {/* Stats */}
                    {/* <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>100</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>68</Text>
                        <Text style={styles.statLabel}>Following</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>8</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                      </View>
                    </View> */}
                  </View>

                  {/* Edit Profile Button */}
                  <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={handleEditProfile}
                    activeOpacity={0.8}
                  >
                    <View style={styles.editProfileContent}>
                      <Edit3 size={18} color="#FF5A5F" />
                      <Text style={styles.editProfileText}>Edit Profile</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Settings Sections */}
            <View style={styles.settingsContainer}>
              {/* Account Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.sectionContent}>
                  <EnhancedMenuItem
                    // icon={<User size={22} color="#FF5A5F"/>}
                    icon={<User size={22} color="rgb(255,255,255)" />}
                    label="Manage Account"
                    subtitle="Personal information, email, phone"
                    onPress={() => handleNavigate("/settings/manage-accounts")}
                  />
                  <EnhancedMenuItem
                    icon={<Shield size={22} color="rgb(255,255,255)" />}
                    label="Security"
                    subtitle="Password, two-factor authentication"
                    onPress={() => handleNavigate("/settings/security")}
                  />
<EnhancedMenuItem
                    icon={<Gift size={22} color="#FF5A5F" />}
                    label="Gifts & Coins"
                    subtitle={
                      demoMode
                        ? "Demo: 18 Roses, 6 Stars, 1 Crown"
                        : "Send and receive gifts"
                    }
                    onPress={() => handleNavigate("/settings/wallet")}
                  />
                  <EnhancedMenuItem
                    icon={<Wallet size={22} color="rgb(255,255,255)" />}
                    label="Wallet & Payouts"
                    subtitle={
                      demoMode
                        ? "Demo preview (no real payouts)"
                        : "Coins, gifts, withdrawal requests"
                    }
                    onPress={() => handleNavigate("/settings/wallet")}
                  />
                  <EnhancedMenuItem
                    icon={<Star size={22} color="rgb(255,255,255)" />}
                    label="Premium"
                    subtitle={
                      demoMode
                        ? "Demo preview (subscriptions mocked)"
                        : "Upgrade to unlock more features"
                    }
                    onPress={() => handleNavigate("/settings/premium")}
                  />
                  <EnhancedMenuItem
                    icon={<BadgeDollarSign size={22} color="rgb(255,255,255)" />}
                    label="Creator Earnings"
                    subtitle={
                      demoMode
                        ? "Demo preview (analytics mocked)"
                        : "Subscribers, revenue, creator monetization"
                    }
                    onPress={() => handleNavigate("/settings/creator-earnings")}
                  />
                </View>
              </View>

              {/* Preferences Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.sectionContent}>
                  <EnhancedMenuItem
                    icon={<Bell size={22} color="rgb(255,255,255)" />}
                    label="Notifications"
                    subtitle="Push notifications, email alerts"
                    onPress={() => handleNavigate("/settings/notifications")}
                  />
                  <EnhancedMenuItem
                    icon={<Globe size={22} color="rgb(255,255,255)" />}
                    label="Language"
                    subtitle={languageName}
                    onPress={() => handleNavigate("/settings/language")}
                  />
                  <EnhancedMenuItem
                    icon={<MapPin size={22} color="rgb(255,255,255)" />}
                    label="Nearby Discovery"
                    subtitle={
                      demoMode
                        ? "Demo preview (local fallback data)"
                        : "Discover local creators and posts"
                    }
                    onPress={() => handleNavigate("/nearby")}
                  />
                  {/* <EnhancedToggle
                    icon={<Moon size={22} color="rgb(255,255,255)" />}
                    label="Dark Mode"
                    subtitle="Enable dark theme"
                    value={settings.darkMode}
                    onToggle={handleToggleDarkMode}
                  /> */}
                  <EnhancedMenuItem
                    icon={<Download size={22} color="rgb(255,255,255)" />}
                    label="Data & Storage"
                    subtitle="Download data, clear cache"
                    onPress={() => handleNavigate("/settings/data-storage")}
                  />
                </View>
              </View>

              {/* Support Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.sectionContent}>
                  <EnhancedMenuItem
                    icon={<HelpCircle size={22} color="rgb(255,255,255)" />}
                    label="Help Center"
                    subtitle="FAQs, contact support"
                    onPress={() => handleNavigate("/settings/help-center")}
                  />
                  <EnhancedMenuItem
                    icon={<FileText size={22} color="rgb(255,255,255)" />}
                    label="Privacy Policy"
                    subtitle="Privacy policy and data handling"
                    onPress={() => handleNavigate("/settings/privacy-policy")}
                  />
                  <EnhancedMenuItem
                    icon={<FileText size={22} color="rgb(255,255,255)" />}
                    label="Terms of Service"
                    subtitle="Usage terms and platform rules"
                    onPress={() => handleNavigate("/settings/terms")}
                  />
                </View>
              </View>

              {/* Danger Zone */}
              <View style={styles.settingsSection}>
                <Text style={[styles.sectionTitle]}>Account Actions</Text>
                <View style={styles.sectionContent}>
                  <EnhancedMenuItem
                    icon={<LogOut size={22} color="rgb(255,255,255)" />}
                    label="Sign Out"
                    subtitle="Sign out of your account"
                    onPress={handleLogoutPress}
                    danger={false}
                    showChevron={false}
                  />
                  <EnhancedMenuItem
                    icon={<Trash2 size={22} color="rgb(255,255,255)" />}
                    label="Delete Account"
                    subtitle="Permanently delete your account"
                    onPress={() => handleNavigate("/settings/delete-account")}
                    danger={false}
                  />
                </View>
              </View>
            </View>

            {/* App Version */}
            <View style={styles.appVersion}>
              <Text style={styles.appVersionText}>App Version 1.0.0</Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Logout Confirmation Modal */}
        <CustomModal
          visible={logoutModalVisible}
          onClose={handleCloseModal}
          title="Sign Out"
          message="Are you sure you want to sign out of your account?"
          primaryAction={{
            label: loggingOut ? "Signing out..." : "Yes, Sign Out",
            onPress: handleLogoutConfirm,
            destructive: true,
          }}
          secondaryAction={{
            label: "Cancel",
            onPress: handleCloseModal,
          }}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#1a1a2e',
    backgroundColor: "#1E4A72",
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  loadingSpinner: {
    padding: 20,
    backgroundColor: "rgba(255, 90, 95, 0.1)",
    borderRadius: 50,
    marginBottom: 24,
  },
  loadingText: {
    color: "#F3F4F6",
    fontSize: 16,
    fontFamily: "Figtree",
    fontWeight: "500",
  },

  // Unauthenticated State
  unauthenticatedContainer: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  unauthenticatedContent: {
    alignItems: "center",
    width: "100%",
  },
  unauthenticatedIcon: {
    padding: 16,
    backgroundColor: "rgba(255, 90, 95, 0.04)",
    borderRadius: 50,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.1)",
  },
  unauthenticatedTitle: {
    color: "#F3F4F6",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "Figtree",
  },
  unauthenticatedSubtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    fontFamily: "Figtree",
  },
  signInButton: {
    width: "80%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#FF5A5F",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  signInGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  signInButtonText: {
    color: "#F3F4F6",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Figtree",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: "#F3F4F6",
    fontSize:
      Dimensions.get("window").width > 400
        ? 32
        : Math.min(Dimensions.get("window").width * 0.08, 28),
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  headerIcon: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.1)",
  },

  // Profile Section
  profileSection: {
    marginBottom: 40,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  profileGradient: {
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.1)",
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderRadius: 24,
  },
  profileContent: {
    padding: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#888",
    shadowColor: "#FF5A5F",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#FF5A5F",
    borderRadius: 16,
    width: 32,
    height: 32,
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
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 24,
    justifyContent: "center",
  },
  username: {
    color: "#F3F4F6",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: "Figtree",
  },
  bio: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Figtree",
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 46, 0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(75,85,99,0.1)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    color: "#F3F4F6",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Figtree",
    marginBottom: 4,
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Figtree",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#4B5563",
    marginHorizontal: 16,
  },
  editProfileButton: {
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(75,85,99,0.1)",
    borderRadius: 16,
    overflow: "hidden",
  },
  editProfileContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  editProfileText: {
    color: "#F3F4F6",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: "Figtree",
  },

  // Settings Container
  settingsContainer: {
    gap: 32,
  },
  settingsSection: {
    backgroundColor:
      Platform.OS === "ios" ? "rgba(26, 26, 46, 0.6)" : "#1E4A72",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(75,85,99,0.1)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: {
    color: "#F3F4F6",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Figtree",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  dangerSectionTitle: {
    color: "#FF5A5F",
  },
  sectionContent: {
    paddingBottom: 8,
  },

  // Menu Items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(75, 85, 99, 0.3)",
  },
  dangerMenuItem: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 90, 95, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.2)",
  },
  dangerIcon: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    color: "#F3F4F6",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Figtree",
    marginBottom: 2,
  },
  dangerText: {
    color: "#FF5A5F",
  },
  menuItemSubtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Figtree",
    lineHeight: 18,
  },
  menuItemRight: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Toggle Switch
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4B5563",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: "gray",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // App Version
  appVersion: {
    alignItems: "center",
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(75, 85, 99, 0.3)",
  },
  appVersionText: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Figtree",
    fontWeight: "500",
  },
});
