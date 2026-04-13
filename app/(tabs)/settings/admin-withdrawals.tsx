import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
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
import { ArrowLeft, ShieldAlert, Wallet } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { WithdrawalRequest, WalletAPI } from "@/lib/api/walletService";
import { buildLocalAdminWithdrawals } from "@/lib/admin/localPreview";
import { captureException } from "@/utils/errorReporting";
import { isDemoMode } from "@/lib/release/releaseConfig";

const formatCash = (amount: number) => `$${amount.toFixed(2)}`;

const formatDate = (value: string) => {
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

const canUpdateWithdrawalStatus = (
  request: WithdrawalRequest,
  nextStatus: "processing" | "completed" | "rejected"
) => {
  if (request.status === "completed" || request.status === "rejected") {
    return false;
  }

  return request.status !== nextStatus;
};

export default function AdminWithdrawalsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "processing" | "completed" | "rejected"
  >("pending");
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  const isAdmin = user?.role === "ADMIN";
  const demoMode = isDemoMode();
  const showDemoBlocked = () => {
    Alert.alert(
      "Demo build",
      "Admin actions are disabled in the demo build."
    );
  };

  const loadWithdrawals = useCallback(async () => {
    if (!isAdmin) {
      setWithdrawals([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const requests = await WalletAPI.getWithdrawals({
        scope: "all",
        status: filter,
      });
      setWithdrawals(requests);
      setLoadError(null);
      setPreviewMode(false);
    } catch (error) {
      captureException(error, {
        tags: { screen: "admin-withdrawals", stage: "load" },
      });
      const previewRequests = buildLocalAdminWithdrawals();
      setWithdrawals(
        previewRequests.filter((request) =>
          filter === "all" ? true : request.status === filter
        )
      );
      setPreviewMode(true);
      setLoadError(
        "Withdrawal backend is unavailable. Showing preview requests for demo only."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, isAdmin]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleUpdateStatus = useCallback(
    async (id: string, status: "processing" | "completed" | "rejected") => {
      if (demoMode) {
        showDemoBlocked();
        return;
      }
      try {
        setUpdatingId(id);
        await WalletAPI.updateWithdrawalStatus(id, status);
        await loadWithdrawals();
      } catch (error) {
        captureException(error, {
          tags: { screen: "admin-withdrawals", stage: "update-status" },
          extra: { id, status },
        });
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : "Unable to update withdrawal status.";
        Alert.alert("Update Failed", message);
      } finally {
        setUpdatingId(null);
      }
    },
    [demoMode, loadWithdrawals]
  );

  const summary = useMemo(() => {
    return withdrawals.reduce(
      (accumulator, request) => {
        accumulator.total += request.amount;
        accumulator.count += 1;
        return accumulator;
      },
      { total: 0, count: 0 }
    );
  }, [withdrawals]);

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
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Withdrawal Review</Text>
            <View style={{ width: 24 }} />
          </View>

          {!isAdmin ? (
            <View style={styles.deniedCard}>
              <ShieldAlert size={36} color="#FF5A5F" />
              <Text style={styles.deniedTitle}>Admin access required</Text>
              <Text style={styles.deniedText}>
                Withdrawal processing is restricted to admin accounts.
              </Text>
            </View>
          ) : (
            <>
              {previewMode ? (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeTitle}>Preview mode</Text>
                  <Text style={styles.noticeText}>
                    Withdrawal requests below are demo data because the backend is
                    offline.
                  </Text>
                </View>
              ) : null}
              {demoMode ? (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeTitle}>Demo build</Text>
                  <Text style={styles.noticeText}>
                    Status updates are disabled in the demo build.
                  </Text>
                </View>
              ) : null}
              <View style={styles.summaryCard}>
                <Wallet size={20} color="#86EFAC" />
                <Text style={styles.summaryTitle}>
                  {summary.count} requests - {formatCash(summary.total)}
                </Text>
                <Text style={styles.summaryText}>
                  Reviewing: {filter.toUpperCase()}
                </Text>
              </View>

              {loadError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>Load failed</Text>
                  <Text style={styles.errorText}>{loadError}</Text>
                  <Button label="Retry" onPress={handleRefresh} variant="outline" />
                </View>
              ) : null}

              <View style={styles.filterRow}>
                {(["pending", "processing", "completed", "rejected", "all"] as const).map(
                  (status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterPill,
                        filter === status && styles.filterPillActive,
                      ]}
                      onPress={() => setFilter(status)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          filter === status && styles.filterTextActive,
                        ]}
                      >
                        {status.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {loading ? (
                <View style={styles.deniedCard}>
                  <Text style={styles.deniedTitle}>Loading withdrawals...</Text>
                </View>
              ) : withdrawals.length === 0 ? (
                <View style={styles.deniedCard}>
                  <Text style={styles.deniedTitle}>No requests</Text>
                  <Text style={styles.deniedText}>
                    No withdrawal requests match the current filter.
                  </Text>
                </View>
              ) : (
                withdrawals.map((request) => (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.requestUser}>
                          {request.user?.fullName ||
                            request.user?.username ||
                            "User request"}
                        </Text>
                        <Text style={styles.requestMeta}>
                          {formatCash(request.amount)} - {request.payoutMethod}
                        </Text>
                        <Text style={styles.requestMeta}>
                          {request.payoutDestination}
                        </Text>
                        <Text style={styles.requestMeta}>
                          Requested {formatDate(request.createdAt)}
                        </Text>
                        {request.processedAt ? (
                          <Text style={styles.requestMeta}>
                            Processed {formatDate(request.processedAt)}
                          </Text>
                        ) : null}
                        {request.provider ? (
                          <Text style={styles.requestMeta}>
                            Provider: {request.provider}
                          </Text>
                        ) : null}
                        {request.payoutTransactionId ? (
                          <Text style={styles.requestMeta}>
                            Payout Ref: {request.payoutTransactionId}
                          </Text>
                        ) : null}
                        {request.payoutFailureReason ? (
                          <Text style={styles.failureText}>
                            Payout error: {request.payoutFailureReason}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.statusPill}>{request.status.toUpperCase()}</Text>
                    </View>

                    <View style={styles.actionRow}>
                      <Button
                        label="Processing"
                        onPress={() => handleUpdateStatus(request.id, "processing")}
                        variant="outline"
                        disabled={
                          updatingId === request.id ||
                          !canUpdateWithdrawalStatus(request, "processing") ||
                          demoMode
                        }
                      />
                      <Button
                        label="Complete"
                        onPress={() => handleUpdateStatus(request.id, "completed")}
                        variant="primary"
                        disabled={
                          updatingId === request.id ||
                          !canUpdateWithdrawalStatus(request, "completed") ||
                          demoMode
                        }
                      />
                      <Button
                        label="Reject"
                        onPress={() => handleUpdateStatus(request.id, "rejected")}
                        variant="outline"
                        disabled={
                          updatingId === request.id ||
                          !canUpdateWithdrawalStatus(request, "rejected") ||
                          demoMode
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
  deniedCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 20,
    backgroundColor: "rgba(17,24,39,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  deniedTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 14,
    fontFamily: "Figtree",
  },
  deniedText: {
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
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
  requestCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(17,24,39,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  requestUser: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  requestMeta: {
    color: "#9CA3AF",
    marginTop: 4,
    fontSize: 13,
    fontFamily: "Figtree",
  },
  failureText: {
    color: "#FCA5A5",
    marginTop: 6,
    fontSize: 13,
    fontFamily: "Figtree",
  },
  statusPill: {
    color: "#FFCC66",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Figtree",
    marginLeft: 12,
  },
  actionRow: {
    gap: 10,
  },
});
