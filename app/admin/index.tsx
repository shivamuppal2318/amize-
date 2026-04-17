import React, { useEffect, useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  BarChart3,
  Flag,
  Rocket,
  Shield,
  SlidersHorizontal,
  Wallet,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/hooks/useAuth";

const adminLinks = [
  {
    label: "Admin Overview",
    subtitle: "Platform health, moderation, and payout activity",
    icon: BarChart3,
    route: "/settings/admin-overview",
  },
  {
    label: "System Health",
    subtitle: "Secrets, providers, and deployment readiness",
    icon: Shield,
    route: "/settings/admin-system-health",
  },
  {
    label: "Release Readiness",
    subtitle: "Store-blocking backend and config gaps",
    icon: Rocket,
    route: "/settings/admin-release-readiness",
  },
  {
    label: "Discovery Topics",
    subtitle: "Featured and visible explore topics",
    icon: SlidersHorizontal,
    route: "/settings/admin-topics",
  },
  {
    label: "Withdrawal Review",
    subtitle: "Payout requests and settlement statuses",
    icon: Wallet,
    route: "/settings/admin-withdrawals",
  },
  {
    label: "Report Review",
    subtitle: "Moderate reported users and content",
    icon: Flag,
    route: "/settings/admin-reports",
  },
];

export default function AdminIndexPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const isAdmin = useMemo(
    () => user?.role === "ADMIN" || user?.adminPermissions === "all",
    [user]
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if (!isAdmin) {
      router.replace("/(tabs)/settings");
    }
  }, [isAdmin, isAuthenticated, loading]);

  if (loading || !isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Back"
              accessibilityRole="button"
            >
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.eyebrow}>Admin</Text>
              <Text style={styles.title}>Console</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Dedicated admin surface. This stays outside the user settings page
            and only renders for authenticated admin accounts.
          </Text>

          <View style={styles.grid}>
            {adminLinks.map((item) => {
              const Icon = item.icon;

              return (
                <TouchableOpacity
                  key={item.route}
                  style={styles.card}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.iconWrap}>
                    <Icon size={22} color="#fff" />
                  </View>
                  <Text style={styles.cardTitle}>{item.label}</Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111D",
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  eyebrow: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Figtree",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    fontFamily: "Figtree",
  },
  subtitle: {
    marginTop: 14,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Figtree",
  },
  grid: {
    marginTop: 24,
    gap: 14,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(12, 18, 32, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E4A72",
    marginBottom: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  cardSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    fontFamily: "Figtree",
  },
});

