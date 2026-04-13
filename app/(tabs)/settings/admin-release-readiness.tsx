import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import Constants from "expo-constants";
import {
  BadgeCheck,
  ChevronLeft,
  CircleAlert,
  Rocket,
  Smartphone,
  TriangleAlert,
} from "lucide-react-native";

import {
  AdminAPI,
  AdminReleaseReadiness,
  AdminSystemHealth,
} from "@/lib/api/adminService";
import {
  buildLocalAdminReleaseReadiness,
  buildLocalAdminSystemHealth,
} from "@/lib/admin/localPreview";
import { captureException } from "@/utils/errorReporting";

type LocalCheck = {
  id: string;
  label: string;
  ready: boolean;
  severity: "critical" | "warning";
  details?: string;
};

function SummaryCard({
  label,
  value,
  warning,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <View style={[styles.summaryCard, warning ? styles.summaryCardWarn : null]}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ReadinessRow({
  label,
  ready,
  severity,
  details,
}: {
  label: string;
  ready: boolean;
  severity: "critical" | "warning";
  details?: string;
}) {
  const icon = ready ? (
    <BadgeCheck size={16} color="#22C55E" />
  ) : severity === "critical" ? (
    <CircleAlert size={16} color="#F97316" />
  ) : (
    <TriangleAlert size={16} color="#FACC15" />
  );

  return (
    <View style={styles.rowCard}>
      <View style={styles.rowHeader}>
        <View style={styles.rowTitleWrap}>
          {icon}
          <Text style={styles.rowTitle}>{label}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            ready
              ? styles.statusPillReady
              : severity === "critical"
              ? styles.statusPillBlocked
              : styles.statusPillWarn,
          ]}
        >
          <Text style={styles.statusPillText}>
            {ready ? "Ready" : severity === "critical" ? "Blocked" : "Warning"}
          </Text>
        </View>
      </View>
      {!!details && <Text style={styles.rowDetails}>{details}</Text>}
    </View>
  );
}

export default function AdminReleaseReadinessScreen() {
  const [readiness, setReadiness] = useState<AdminReleaseReadiness | null>(null);
  const [systemHealth, setSystemHealth] = useState<AdminSystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<"live" | "preview">("live");

  const loadData = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [nextReadiness, nextHealth] = await Promise.all([
        AdminAPI.getReleaseReadiness(),
        AdminAPI.getSystemHealth(),
      ]);

      setReadiness(nextReadiness);
      setSystemHealth(nextHealth);
      setMode("live");
    } catch (error) {
      captureException(error, {
        tags: { screen: "admin-release-readiness", stage: "load" },
      });
      const fallbackHealth = buildLocalAdminSystemHealth();
      setSystemHealth(fallbackHealth);
      setReadiness(buildLocalAdminReleaseReadiness(fallbackHealth));
      setMode("preview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const localChecks = useMemo<LocalCheck[]>(() => {
    const expoConfig = Constants.expoConfig;
    const ios = expoConfig?.ios;
    const android = expoConfig?.android;
    const extra = expoConfig?.extra as
      | { facebookAppId?: string; eas?: { projectId?: string } }
      | undefined;

    return [
      {
        id: "app-version",
        label: "App version",
        ready: Boolean(expoConfig?.version),
        severity: "critical",
        details: expoConfig?.version
          ? `Configured version: ${expoConfig.version}`
          : "Missing expo.version in app.json",
      },
      {
        id: "ios-bundle",
        label: "iOS bundle identifier",
        ready: Boolean(ios?.bundleIdentifier),
        severity: "critical",
        details: ios?.bundleIdentifier || "Missing iOS bundle identifier",
      },
      {
        id: "android-package",
        label: "Android package",
        ready: Boolean(android?.package),
        severity: "critical",
        details: android?.package || "Missing Android package name",
      },
      {
        id: "ios-build",
        label: "iOS build number",
        ready: Boolean(ios?.buildNumber),
        severity: "critical",
        details: ios?.buildNumber
          ? `Build number: ${ios.buildNumber}`
          : "Missing iOS buildNumber",
      },
      {
        id: "android-version-code",
        label: "Android version code",
        ready: typeof android?.versionCode === "number",
        severity: "critical",
        details:
          typeof android?.versionCode === "number"
            ? `Version code: ${android.versionCode}`
            : "Missing Android versionCode",
      },
      {
        id: "eas-project",
        label: "EAS project id",
        ready: Boolean(extra?.eas?.projectId),
        severity: "warning",
        details: extra?.eas?.projectId
          ? `Project id: ${extra.eas.projectId}`
          : "Missing expo.extra.eas.projectId",
      },
      {
        id: "facebook-mobile",
        label: "Facebook mobile app id",
        ready: Boolean(extra?.facebookAppId),
        severity: "warning",
        details: extra?.facebookAppId
          ? "Facebook sign-in can be enabled on mobile."
          : "Facebook button is wired, but mobile app id is still blank.",
      },
      {
        id: "apple-mobile",
        label: "Apple Sign In entitlement",
        ready: Boolean(ios?.usesAppleSignIn),
        severity: "warning",
        details: ios?.usesAppleSignIn
          ? "Apple Sign In is enabled in app config."
          : "Apple auth is wired, but ios.usesAppleSignIn is still disabled.",
      },
    ];
  }, []);

  if (loading && !readiness) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading release readiness...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!readiness) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Release readiness unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const localBlocked = localChecks.filter((item) => !item.ready).length;
  const localCriticalBlocked = localChecks.filter(
    (item) => item.severity === "critical" && !item.ready
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData("refresh")}
            tintColor="#FF5A5F"
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Release Readiness</Text>
            <Text style={styles.headerSubtitle}>
              Store-blocking checks for backend config and local app build metadata.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Rocket size={20} color="#FFFFFF" />
          <Text style={styles.heroTitle}>Current Release Status</Text>
          <Text style={styles.heroBody}>
            Backend blockers: {readiness.summary.criticalBlocked}. Local app
            blockers: {localCriticalBlocked}.
          </Text>
        </View>

        {mode === "preview" ? (
          <View style={styles.rowCard}>
            <Text style={styles.rowTitle}>Preview mode</Text>
            <Text style={styles.rowDetails}>
              Backend readiness endpoints are unavailable. Backend counts below are
              generated from local project checks so the release screen still stays
              usable for demos.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.grid}>
            <SummaryCard label="Backend Ready" value={readiness.summary.ready} />
            <SummaryCard
              label="Backend Blocked"
              value={readiness.summary.blocked}
              warning={readiness.summary.blocked > 0}
            />
            <SummaryCard
              label="Critical"
              value={readiness.summary.criticalBlocked}
              warning={readiness.summary.criticalBlocked > 0}
            />
            <SummaryCard
              label="Local Blocked"
              value={localBlocked}
              warning={localBlocked > 0}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Migration Status</Text>
          <View style={styles.rowCard}>
            <Text style={styles.rowTitle}>Latest local migration</Text>
            <Text style={styles.rowDetails}>
              {readiness.migrationStatus.latestLocalMigration || "none"}
            </Text>
            <Text style={styles.rowDetails}>
              Latest applied migration:{" "}
              {readiness.migrationStatus.latestAppliedMigration || "none"}
            </Text>
            <Text style={styles.rowDetails}>
              Applied/local count: {readiness.migrationStatus.appliedCount}/
              {readiness.migrationStatus.localCount}
            </Text>
            <Text style={styles.rowDetails}>
              Drift detected: {readiness.migrationStatus.driftDetected ? "yes" : "no"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Rocket size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Backend Checklist</Text>
          </View>
          {readiness.items.map((entry) => (
            <ReadinessRow
              key={entry.id}
              label={entry.label}
              ready={entry.ready}
              severity={entry.severity}
              details={entry.details}
            />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Smartphone size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Local App Checklist</Text>
          </View>
          {localChecks.map((entry) => (
            <ReadinessRow
              key={entry.id}
              label={entry.label}
              ready={entry.ready}
              severity={entry.severity}
              details={entry.details}
            />
          ))}
        </View>

        {readiness.deploymentSteps.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Deployment Steps</Text>
            <View style={styles.rowCard}>
              {readiness.deploymentSteps.map((step, index) => (
                <Text key={`${index}-${step}`} style={styles.stepText}>
                  {index + 1}. {step}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {systemHealth ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Release Metadata</Text>
            <View style={styles.rowCard}>
              <Text style={styles.rowTitle}>Support email</Text>
              <Text style={styles.rowDetails}>
                {systemHealth.release.supportEmail || "missing"}
              </Text>
              <Text style={styles.rowDetails}>
                Privacy URL: {systemHealth.release.privacyPolicyUrl || "missing"}
              </Text>
              <Text style={styles.rowDetails}>
                Terms URL: {systemHealth.release.termsOfServiceUrl || "missing"}
              </Text>
            </View>
          </View>
        ) : null}
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
  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 20,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    fontFamily: "Figtree",
  },
  heroBody: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: "Figtree",
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Figtree",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    width: "47%",
    minWidth: 120,
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  summaryCardWarn: {
    borderColor: "rgba(249,115,22,0.45)",
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  summaryLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Figtree",
  },
  rowCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 10,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rowTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  rowTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Figtree",
    flexShrink: 1,
  },
  rowDetails: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    fontFamily: "Figtree",
  },
  stepText: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Figtree",
    marginBottom: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillReady: {
    backgroundColor: "rgba(34,197,94,0.16)",
  },
  statusPillBlocked: {
    backgroundColor: "rgba(249,115,22,0.16)",
  },
  statusPillWarn: {
    backgroundColor: "rgba(250,204,21,0.16)",
  },
  statusPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
});
