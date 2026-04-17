import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Flag, ShieldAlert } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  AdminReport,
  ReportAPI,
  ReportStatus,
} from "@/lib/api/reportService";
import { buildLocalAdminReports } from "@/lib/admin/localPreview";
import { captureException } from "@/utils/errorReporting";
import { isDemoMode } from "@/lib/release/releaseConfig";

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Not reviewed";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const statusColors: Record<ReportStatus, string> = {
  pending: "#FBBF24",
  reviewed: "#93C5FD",
  dismissed: "#94A3B8",
  actioned: "#86EFAC",
};

export default function AdminReportsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "reviewed" | "dismissed" | "actioned"
  >("pending");
  const [targetFilter, setTargetFilter] = useState<"all" | "video" | "user">(
    "all"
  );
  const [reports, setReports] = useState<AdminReport[]>([]);

  const isAdmin = user?.role === "ADMIN";
  const demoMode = isDemoMode();
  const showDemoBlocked = () => {
    Alert.alert(
      "Demo build",
      "Admin actions are disabled in the demo build."
    );
  };

  const loadReports = useCallback(async () => {
    if (!isAdmin) {
      setReports([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const nextReports = await ReportAPI.getReports({
        status: statusFilter,
        targetType: targetFilter,
        limit: 100,
      });
      setReports(nextReports);
      setLoadError(null);
      setPreviewMode(false);
    } catch (error) {
      captureException(error, {
        tags: { screen: "admin-reports", stage: "load" },
        extra: { statusFilter, targetFilter },
      });
      const previewReports = buildLocalAdminReports();
      setReports(
        previewReports.filter((report) =>
          statusFilter === "all" ? true : report.status === statusFilter
        ).filter((report) =>
          targetFilter === "all" ? true : report.targetType === targetFilter
        )
      );
      setPreviewMode(true);
      setLoadError(
        "Moderation backend is unavailable. Showing preview reports for demo only."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, statusFilter, targetFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, [loadReports]);

  const handleUpdate = useCallback(
    async (report: AdminReport, status: ReportStatus) => {
      if (demoMode) {
        showDemoBlocked();
        return;
      }
      const actionKind =
        status === "actioned"
          ? report.targetType === "video"
            ? "hide_video"
            : "suspend_user"
          : undefined;
      const actionTaken =
        status === "actioned"
          ? report.targetType === "video"
            ? "Video hidden from public access"
            : "User account suspended"
          : undefined;

      try {
        setUpdatingId(report.id);
        await ReportAPI.updateReport(report.id, {
          status,
          actionTaken,
          actionKind,
        });
        await loadReports();
      } catch (error) {
        captureException(error, {
          tags: { screen: "admin-reports", stage: "update" },
          extra: { reportId: report.id, status },
        });
        Alert.alert("Update Failed", "Unable to update report status.");
      } finally {
        setUpdatingId(null);
      }
    },
    [demoMode, loadReports]
  );

  const summary = useMemo(() => {
    return reports.reduce(
      (accumulator, report) => {
        accumulator.total += 1;
        accumulator[report.status] += 1;
        return accumulator;
      },
      {
        total: 0,
        pending: 0,
        reviewed: 0,
        dismissed: 0,
        actioned: 0,
      }
    );
  }, [reports]);

  const isActionApplied = useCallback((report: AdminReport) => {
    if (report.subject.type === "video") {
      return report.subject.video?.isPublic === false;
    }

    return Boolean(report.subject.user?.deactivatedAt);
  }, []);

  const handleRestore = useCallback(
    async (report: AdminReport) => {
      if (demoMode) {
        showDemoBlocked();
        return;
      }
      const actionKind =
        report.targetType === "video" ? "restore_video" : "restore_user";
      const actionTaken =
        report.targetType === "video"
          ? "Video restored to public access"
          : "User account restored";

      try {
        setUpdatingId(report.id);
        await ReportAPI.updateReport(report.id, {
          status: "reviewed",
          actionKind,
          actionTaken,
        });
        await loadReports();
      } catch (error) {
        captureException(error, {
          tags: { screen: "admin-reports", stage: "restore" },
          extra: { reportId: report.id, actionKind },
        });
        Alert.alert("Restore Failed", "Unable to restore the moderated target.");
      } finally {
        setUpdatingId(null);
      }
    },
    [demoMode, loadReports]
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1E4A72", "#000000"]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity 
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Review</Text>
            <View style={{ width: 24 }} />
          </View>

          {!isAdmin ? (
            <View style={styles.emptyCard}>
              <ShieldAlert size={36} color="#FF5A5F" />
              <Text style={styles.emptyTitle}>Admin access required</Text>
              <Text style={styles.emptyText}>
                Report moderation is restricted to admin accounts.
              </Text>
            </View>
          ) : (
            <>
              {previewMode ? (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeTitle}>Preview mode</Text>
                  <Text style={styles.noticeText}>
                    Reports shown here are local demo data because the admin API is
                    offline.
                  </Text>
                </View>
              ) : null}
              {demoMode ? (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeTitle}>Demo build</Text>
                  <Text style={styles.noticeText}>
                    Moderation actions are disabled in the demo build.
                  </Text>
                </View>
              ) : null}
              <View style={styles.summaryCard}>
                <Flag size={20} color="#FBBF24" />
                <Text style={styles.summaryTitle}>
                  {summary.total} reports loaded
                </Text>
                <Text style={styles.summaryText}>
                  Pending {summary.pending} • Actioned {summary.actioned}
                </Text>
              </View>

              {loadError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>Load failed</Text>
                  <Text style={styles.errorText}>{loadError}</Text>
                  <Button label="Retry" onPress={handleRefresh} variant="outline" />
                </View>
              ) : null}

              <View style={styles.filterBlock}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.filterRow}>
                  {(
                    ["pending", "reviewed", "dismissed", "actioned", "all"] as const
                  ).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterPill,
                        statusFilter === status && styles.filterPillActive,
                      ]}
                      onPress={() => setStatusFilter(status)}
                      accessibilityLabel={`Filter by ${status}`}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.filterText,
                          statusFilter === status && styles.filterTextActive,
                        ]}
                      >
                        {status.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.filterLabel}>Target</Text>
                <View style={styles.filterRow}>
                  {(["all", "video", "user"] as const).map((target) => (
                    <TouchableOpacity
                      key={target}
                      style={[
                        styles.filterPill,
                        targetFilter === target && styles.filterPillActive,
                      ]}
                      onPress={() => setTargetFilter(target)}
                      accessibilityLabel={`Filter by ${target}`}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.filterText,
                          targetFilter === target && styles.filterTextActive,
                        ]}
                      >
                        {target.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {loading ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Loading reports...</Text>
                </View>
              ) : reports.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No reports found</Text>
                  <Text style={styles.emptyText}>
                    No reports match the current filters.
                  </Text>
                </View>
              ) : (
                reports.map((report) => (
                  <View key={report.id} style={styles.reportCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{report.reason}</Text>
                        <Text style={styles.cardMeta}>
                          Reporter: {report.reportedBy.fullName || report.reportedBy.username}
                        </Text>
                        <Text style={styles.cardMeta}>
                          Target:{" "}
                          {report.subject.type === "video"
                            ? report.subject.video?.title ||
                              report.subject.owner?.username ||
                              "Video report"
                            : report.subject.user?.fullName ||
                              report.subject.user?.username ||
                              "User report"}
                        </Text>
                        <Text style={styles.cardMeta}>
                          Submitted {formatDate(report.createdAt)}
                        </Text>
                        <Text style={styles.cardMeta}>
                          Reviewed {formatDate(report.reviewedAt)}
                        </Text>
                        {report.description ? (
                          <Text style={styles.descriptionText}>
                            {report.description}
                          </Text>
                        ) : null}
                        <Text style={styles.subjectStateText}>
                          {report.subject.type === "video"
                            ? report.subject.video?.isPublic === false
                              ? "Video is hidden"
                              : "Video is public"
                            : report.subject.user?.deactivatedAt
                              ? "User is suspended"
                              : "User is active"}
                        </Text>
                        {report.actionTaken ? (
                          <Text style={styles.actionTakenText}>
                            Action: {report.actionTaken}
                          </Text>
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.statusPill,
                          { color: statusColors[report.status] },
                        ]}
                      >
                        {report.status.toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.actionRow}>
                      <Button
                        label="Review"
                        onPress={() => handleUpdate(report, "reviewed")}
                        variant="outline"
                        disabled={
                          updatingId === report.id || report.status === "reviewed"
                          || demoMode
                        }
                      />
                      <Button
                        label={
                          report.targetType === "video"
                            ? "Hide Video"
                            : "Suspend User"
                        }
                        onPress={() => handleUpdate(report, "actioned")}
                        variant="primary"
                        disabled={
                          updatingId === report.id ||
                          report.status === "actioned" ||
                          isActionApplied(report) ||
                          demoMode
                        }
                      />
                      {isActionApplied(report) ? (
                        <Button
                          label="Restore"
                          onPress={() => handleRestore(report)}
                          variant="outline"
                          disabled={updatingId === report.id || demoMode}
                        />
                      ) : null}
                      <Button
                        label="Dismiss"
                        onPress={() => handleUpdate(report, "dismissed")}
                        variant="outline"
                        disabled={
                          updatingId === report.id || report.status === "dismissed"
                          || demoMode
                        }
                      />
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  gradient: {
    flex: 1,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 20,
    backgroundColor: "rgba(17,24,39,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 14,
    fontFamily: "Figtree",
  },
  emptyText: {
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 10,
    fontFamily: "Figtree",
  },
  summaryCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "rgba(17,24,39,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    fontFamily: "Figtree",
  },
  summaryText: {
    color: "#9CA3AF",
    marginTop: 6,
    fontFamily: "Figtree",
  },
  errorCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(127,29,29,0.35)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
    marginBottom: 16,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  errorText: {
    color: "#E2E8F0",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
    fontFamily: "Figtree",
  },
  noticeCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(249, 115, 22, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.32)",
    marginBottom: 16,
  },
  noticeTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  noticeText: {
    color: "#FDE68A",
    marginTop: 6,
    fontSize: 13,
    fontFamily: "Figtree",
  },
  filterBlock: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(17,24,39,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  filterLabel: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    fontFamily: "Figtree",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  filterPillActive: {
    backgroundColor: "rgba(255,90,95,0.16)",
  },
  filterText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  filterTextActive: {
    color: "#FF5A5F",
  },
  reportCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(17,24,39,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  cardMeta: {
    color: "#9CA3AF",
    marginTop: 4,
    fontSize: 13,
    fontFamily: "Figtree",
  },
  descriptionText: {
    color: "#E5E7EB",
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Figtree",
  },
  subjectStateText: {
    color: "#C4B5FD",
    marginTop: 8,
    fontSize: 13,
    fontFamily: "Figtree",
  },
  actionTakenText: {
    color: "#86EFAC",
    marginTop: 8,
    fontSize: 13,
    fontFamily: "Figtree",
  },
  statusPill: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Figtree",
    marginLeft: 12,
  },
  actionRow: {
    gap: 10,
  },
});
