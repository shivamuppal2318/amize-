import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  Database,
  ServerCog,
} from "lucide-react-native";

import { AdminAPI, AdminSystemHealth } from "@/lib/api/adminService";
import { buildLocalAdminSystemHealth } from "@/lib/admin/localPreview";
import { captureException } from "@/utils/errorReporting";

function StatusPill({
  ready,
  label,
}: {
  ready: boolean;
  label: string;
}) {
  return (
    <View
      style={[
        styles.statusPill,
        ready ? styles.statusPillReady : styles.statusPillMissing,
      ]}
    >
      <Text style={styles.statusPillText}>{label}</Text>
    </View>
  );
}

export default function AdminSystemHealthScreen() {
  const [health, setHealth] = useState<AdminSystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<"live" | "preview">("live");

  const loadHealth = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const nextHealth = await AdminAPI.getSystemHealth();
      setHealth(nextHealth);
      setMode("live");
    } catch (error) {
      captureException(error, {
        tags: { screen: "admin-system-health", stage: "load" },
      });
      setHealth(buildLocalAdminSystemHealth());
      setMode("preview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  if (loading && !health) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading system health...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!health) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>System health unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHealth("refresh")}
            tintColor="#FF5A5F"
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>System Health</Text>
            <Text style={styles.headerSubtitle}>
              Deployment-critical config and provider readiness.
            </Text>
          </View>
        </View>

        {mode === "preview" ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Preview mode</Text>
            <Text style={styles.noticeBody}>
              Live backend health checks are unavailable. This screen is showing
              local config readiness derived from the current Expo project setup.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Database</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Connection</Text>
              <StatusPill
                ready={health.database.reachable}
                label={health.database.reachable ? "Ready" : "Error"}
              />
            </View>
            {!!health.database.error && (
              <Text style={styles.cardDetail}>{health.database.error}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ServerCog size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Providers</Text>
          </View>
          {Object.entries(health.providers).map(([key, provider]) => (
            <View key={key} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.providerLabelRow}>
                  {provider.configured ? (
                    <CircleCheck size={16} color="#22C55E" />
                  ) : (
                    <CircleAlert size={16} color="#F97316" />
                  )}
                  <Text style={styles.cardTitle}>{provider.label}</Text>
                </View>
                <StatusPill
                  ready={provider.configured}
                  label={provider.configured ? "Configured" : "Missing"}
                />
              </View>
              {!!provider.details && (
                <Text style={styles.cardDetail}>{provider.details}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ServerCog size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Payments</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active provider</Text>
            <Text style={styles.cardValue}>{health.payments.provider}</Text>
            <Text style={styles.cardDetail}>
              Stripe charge flow: {health.payments.stripeConfigured ? "configured" : "missing"}
            </Text>
            <Text style={styles.cardDetail}>
              Stripe Connect payouts:{" "}
              {health.payments.stripeConnectConfigured ? "configured" : "missing"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ServerCog size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Live Transport</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Transport readiness</Text>
              <StatusPill
                ready={health.liveTransport.configured}
                label={health.liveTransport.configured ? "Configured" : "Preview only"}
              />
            </View>
            <Text style={styles.cardValue}>{health.liveTransport.provider}</Text>
            <Text style={styles.cardDetail}>
              Ingest: {health.liveTransport.ingestProtocol.toUpperCase()} via{" "}
              {health.liveTransport.ingestUrl}
            </Text>
            <Text style={styles.cardDetail}>
              Playback: {health.liveTransport.playbackProtocol.toUpperCase()} via{" "}
              {health.liveTransport.playbackBaseUrl}
            </Text>
            <Text style={styles.cardDetail}>
              External encoder:{" "}
              {health.liveTransport.requiresExternalEncoder ? "required" : "not required"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ServerCog size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Release Metadata</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{health.release.appName}</Text>
            <Text style={styles.cardDetail}>Version: {health.release.appVersion}</Text>
            <Text style={styles.cardDetail}>
              Maintenance mode: {health.release.maintenanceMode ? "on" : "off"}
            </Text>
            <Text style={styles.cardDetail}>
              Support email: {health.release.supportEmail || "missing"}
            </Text>
            <Text style={styles.cardDetail}>
              Privacy URL: {health.release.privacyPolicyUrl || "missing"}
            </Text>
            <Text style={styles.cardDetail}>
              Terms URL: {health.release.termsOfServiceUrl || "missing"}
            </Text>
          </View>
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
    paddingBottom: 40,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 14,
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Figtree",
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
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  headerSubtitle: {
    color: "#94A3B8",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Figtree",
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  providerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
    fontFamily: "Figtree",
  },
  cardDetail: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
    fontFamily: "Figtree",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillReady: {
    backgroundColor: "rgba(34,197,94,0.16)",
  },
  statusPillMissing: {
    backgroundColor: "rgba(249,115,22,0.16)",
  },
  statusPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  noticeCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.35)",
    marginBottom: 22,
  },
  noticeTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  noticeBody: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    fontFamily: "Figtree",
  },
});
