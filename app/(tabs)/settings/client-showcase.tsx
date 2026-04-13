import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  BarChart3,
  ChevronLeft,
  Compass,
  MapPin,
  Rocket,
  Shield,
  Sparkles,
  Wallet,
  Waves,
} from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";

type DemoRoute = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: React.ReactNode;
};

function DemoCard({ item }: { item: DemoRoute }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(item.route as any)}
    >
      <View style={styles.iconWrap}>{item.icon}</View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
      <Text style={styles.cardCta}>Open</Text>
    </TouchableOpacity>
  );
}

export default function ClientShowcaseScreen() {
  const { user } = useAuth();

  const routes = useMemo<DemoRoute[]>(() => {
    const baseRoutes: DemoRoute[] = [
      {
        id: "explore",
        title: "Explore Feed",
        subtitle: "Search, mixed discovery, and feed browsing.",
        route: "/(tabs)/explore",
        icon: <Compass size={20} color="#FFFFFF" />,
      },
      {
        id: "nearby",
        title: "Nearby Discovery",
        subtitle: "Location-based creator and content discovery.",
        route: "/nearby",
        icon: <MapPin size={20} color="#FFFFFF" />,
      },
      {
        id: "wallet",
        title: "Wallet & Payouts",
        subtitle: "Top-ups, gifts, withdrawals, and payout status.",
        route: "/settings/wallet",
        icon: <Wallet size={20} color="#FFFFFF" />,
      },
      {
        id: "premium",
        title: "Premium & Billing",
        subtitle: "Subscriptions, billing history, and verification flows.",
        route: "/settings/premium",
        icon: <Sparkles size={20} color="#FFFFFF" />,
      },
      {
        id: "creator",
        title: "Creator Earnings",
        subtitle: "Revenue, subscriber data, analytics, and payouts.",
        route: "/settings/creator-earnings",
        icon: <BarChart3 size={20} color="#FFFFFF" />,
      },
      {
        id: "live",
        title: "Live Demo",
        subtitle: "Live setup, moderation controls, and transport status.",
        route: "/live",
        icon: <Waves size={20} color="#FFFFFF" />,
      },
    ];

    if (user?.role === "ADMIN") {
      baseRoutes.push(
        {
          id: "admin-overview",
          title: "Admin Overview",
          subtitle: "Platform totals, moderation, payouts, and revenue.",
          route: "/settings/admin-overview",
          icon: <Shield size={20} color="#FFFFFF" />,
        },
        {
          id: "release",
          title: "Release Readiness",
          subtitle: "Deployment blockers, migrations, and app metadata.",
          route: "/settings/admin-release-readiness",
          icon: <Rocket size={20} color="#FFFFFF" />,
        }
      );
    }

    return baseRoutes;
  }, [user?.role]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Client Showcase</Text>
            <Text style={styles.subtitle}>
              Fast path to the strongest demo-ready flows in this build.
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Demo path</Text>
          <Text style={styles.heroTitle}>Show the finished parts first.</Text>
          <Text style={styles.heroBody}>
            These routes are the cleanest ones to use for a client walkthrough
            today.
          </Text>
        </View>

        <View style={styles.grid}>
          {routes.map((item) => (
            <DemoCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 8,
    paddingTop: 2,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  subtitle: {
    color: "#94A3B8",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Figtree",
  },
  hero: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  heroEyebrow: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: "Figtree",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
    fontFamily: "Figtree",
  },
  heroBody: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: "Figtree",
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
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
  cardCta: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
    fontFamily: "Figtree",
  },
});
