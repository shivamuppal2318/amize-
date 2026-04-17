import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  BarChart3,
  ChevronLeft,
  CreditCard,
  Flag,
  Radio,
  Users,
} from "lucide-react-native";

import { AdminAPI, AdminOverview } from "@/lib/api/adminService";
import { buildLocalAdminOverview } from "@/lib/admin/localPreview";
import { captureException } from "@/utils/errorReporting";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <View
      style={[
        styles.statCard,
        tone === "danger" && styles.statCardDanger,
        tone === "success" && styles.statCardSuccess,
      ]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  label,
  subtitle,
  onPress,
}: {
  label: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity 
      style={styles.quickAction} 
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={styles.quickActionTitle}>{label}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function AdminOverviewScreen() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<"live" | "preview">("live");

  const loadOverview = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await AdminAPI.getOverview();
      setOverview(data);
      setMode("live");
    } catch (error) {
      captureException(error, {
        tags: { screen: "admin-overview", stage: "load" },
      });
      setOverview(buildLocalAdminOverview());
      setMode("preview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading && !overview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading admin overview...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!overview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Admin overview unavailable.</Text>
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
            onRefresh={() => loadOverview("refresh")}
            tintColor="#FF5A5F"
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Admin Overview</Text>
            <Text style={styles.headerSubtitle}>
              Operations, moderation, revenue, and payout health.
            </Text>
          </View>
        </View>

        {mode === "preview" ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Preview mode</Text>
            <Text style={styles.noticeBody}>
              Backend admin metrics are unavailable, so this screen is showing local
              admin shortcuts and zeroed summary placeholders only.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Platform Totals</Text>
          </View>
          <View style={styles.grid}>
            <StatCard label="Users" value={overview.totals.totalUsers} />
            <StatCard label="Creators" value={overview.totals.totalCreators} />
            <StatCard label="Videos" value={overview.totals.totalVideos} />
            <StatCard
              label="Active Subs"
              value={overview.totals.activeSubscriptions}
            />
            <StatCard
              label="Live Now"
              value={overview.totals.activeLiveSessions}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Flag size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Moderation</Text>
          </View>
          <View style={styles.grid}>
            <StatCard
              label="Pending Reports"
              value={overview.moderation.pendingReports}
              tone="danger"
            />
            <StatCard
              label="Actioned Reports"
              value={overview.moderation.actionedReports}
              tone="success"
            />
            <StatCard label="Hidden Videos" value={overview.moderation.hiddenVideos} />
            <StatCard
              label="Suspended Users"
              value={overview.moderation.suspendedUsers}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Revenue & Payouts</Text>
          </View>
          <View style={styles.grid}>
            <StatCard
              label="Monthly Revenue"
              value={formatCurrency(overview.revenue.monthlySubscriptionRevenue)}
              tone="success"
            />
            <StatCard
              label="Pending Withdrawals"
              value={overview.payouts.pendingWithdrawals}
              tone="danger"
            />
            <StatCard
              label="Processing Withdrawals"
              value={overview.payouts.processingWithdrawals}
            />
            <StatCard
              label="Monthly Payouts"
              value={formatCurrency(overview.payouts.monthlyPayoutVolume)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <QuickAction
            label="Report Review"
            subtitle="Open moderation queue for users and videos"
            onPress={() => router.push("/settings/admin-reports")}
          />
          <QuickAction
            label="Withdrawal Review"
            subtitle="Process payout requests and failure states"
            onPress={() => router.push("/settings/admin-withdrawals")}
          />
          <QuickAction
            label="Discovery Topics"
            subtitle="Control promoted and visible discovery topics"
            onPress={() => router.push("/settings/admin-topics")}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Radio size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Recent Reports</Text>
          </View>
          {overview.recentReports.length === 0 ? (
            <Text style={styles.emptyText}>No recent reports.</Text>
          ) : (
            overview.recentReports.map((report) => (
              <View key={report.id} style={styles.listCard}>
                <Text style={styles.listTitle}>{report.reason}</Text>
                <Text style={styles.listSubtitle}>Status: {report.status}</Text>
                {report.video ? (
                  <Text style={styles.listSubtitle}>
                    Video: {report.video.title || report.video.id}
                  </Text>
                ) : null}
                {report.user ? (
                  <Text style={styles.listSubtitle}>
                    User: {report.user.username}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Recent Withdrawals</Text>
          </View>
          {overview.recentWithdrawals.length === 0 ? (
            <Text style={styles.emptyText}>No recent withdrawals.</Text>
          ) : (
            overview.recentWithdrawals.map((withdrawal) => (
              <View key={withdrawal.id} style={styles.listCard}>
                <Text style={styles.listTitle}>{withdrawal.username}</Text>
                <Text style={styles.listSubtitle}>
                  {formatCurrency(withdrawal.amount)} • {withdrawal.status}
                </Text>
              </View>
            ))
          )}
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  statCardDanger: {
    borderColor: "rgba(239,68,68,0.4)",
  },
  statCardSuccess: {
    borderColor: "rgba(34,197,94,0.4)",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 6,
    fontFamily: "Figtree",
  },
  quickAction: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 10,
  },
  quickActionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  quickActionSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 4,
    fontFamily: "Figtree",
  },
  listCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 10,
  },
  listTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  listSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 4,
    fontFamily: "Figtree",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
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
