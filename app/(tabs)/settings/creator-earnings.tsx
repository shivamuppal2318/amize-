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
import * as WebBrowser from "expo-web-browser";
import {
  ArrowLeft,
  BadgeDollarSign,
  Crown,
  Link2,
  TrendingUp,
  Users,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  CreatorAPI,
  CreatorAnalyticsResponse,
  CreatorSubscriberResponse,
  SubscriptionPaymentRecord,
  UserStatusResponse,
} from "@/lib/api/CreatorAPI";
import {
  buildLocalCreatorAnalyticsPreview,
  buildLocalCreatorStatusPreview,
  buildLocalCreatorSubscriberPreview,
} from "@/lib/admin/localPreview";
import { captureException } from "@/utils/errorReporting";
import { isDemoMode } from "@/lib/release/releaseConfig";

const emptyCreatorStatus: UserStatusResponse["creator"] = {
  isCreator: false,
  isEligibleForCreator: false,
  creatorVerified: false,
  monetizationEnabled: false,
  creatorCategory: null,
  stats: {
    subscribers: 0,
    totalContent: 0,
  },
};

const emptySubscriberData: CreatorSubscriberResponse = {
  success: false,
  subscriptions: [],
  stats: {
    total: 0,
    active: 0,
    revenue: 0,
    currency: "USD",
  },
};

const emptyAnalytics: CreatorAnalyticsResponse = {
  success: false,
  creator: {
    id: "",
    username: "creator",
    fullName: null,
    creatorCategory: null,
    isEligibleForCreator: false,
    monetizationEnabled: false,
  },
  overview: {
    periodDays: 30,
    activeSubscribers: 0,
    revenue: 0,
    currency: "USD",
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    averageWatchTime: 0,
    averageCompletionRate: 0,
  },
  topVideos: [],
  recentPayments: [],
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatDate = (value?: string | null) => {
  if (!value) return "No end date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No end date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const formatStatusLabel = (status?: string | null) => {
  if (!status) return "UNKNOWN";
  return status.replace(/_/g, " ").toUpperCase();
};

const getPaymentStatusStyle = (status?: string | null) => {
  if (status === "successful") {
    return styles.successText;
  }

  if (status === "refunded" || status === "partially_refunded") {
    return styles.errorText;
  }

  return styles.subscriptionMetaText;
};

export default function CreatorEarningsScreen() {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refundingPaymentId, setRefundingPaymentId] = useState<string | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [creatorStatus, setCreatorStatus] =
    useState<UserStatusResponse["creator"]>(emptyCreatorStatus);
  const [subscriberData, setSubscriberData] =
    useState<CreatorSubscriberResponse>(emptySubscriberData);
  const [analytics, setAnalytics] =
    useState<CreatorAnalyticsResponse>(emptyAnalytics);
  const demoMode = isDemoMode();
  const showDemoBlocked = () => {
    Alert.alert(
      "Demo build",
      "Creator monetization actions are disabled in the demo build."
    );
  };

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setCreatorStatus(emptyCreatorStatus);
      setSubscriberData(emptySubscriberData);
      setAnalytics(emptyAnalytics);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [creatorStatusResponse, subscriberResponse, analyticsResponse] = await Promise.all([
        CreatorAPI.getUserCreatorStatus(user.id),
        CreatorAPI.getCreatorSubscribers(user.id),
        CreatorAPI.getCreatorAnalytics(user.id),
      ]);

      setCreatorStatus(creatorStatusResponse.creator ?? emptyCreatorStatus);
      setSubscriberData(subscriberResponse ?? emptySubscriberData);
      setAnalytics(analyticsResponse ?? emptyAnalytics);
      setPreviewMode(false);
      setLoadError(null);
    } catch (error) {
      captureException(error, {
        tags: { screen: "creator-earnings", stage: "load" },
        extra: { userId: user.id },
      });
      setCreatorStatus(buildLocalCreatorStatusPreview());
      setSubscriberData(buildLocalCreatorSubscriberPreview());
      setAnalytics(buildLocalCreatorAnalyticsPreview(user.id));
      setPreviewMode(true);
      setLoadError(
        "Creator analytics are unavailable. This screen is showing preview mode with demo monetization data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleRefundPayment = useCallback(
    (paymentId: string, subscriberName: string, amount: number) => {
      if (demoMode) {
        showDemoBlocked();
        return;
      }
      Alert.alert(
        "Refund Subscription Payment",
        `Refund ${currencyFormatter.format(amount)} for ${subscriberName} and cancel the subscription renewal?`,
        [
          { text: "Keep", style: "cancel" },
          {
            text: "Refund",
            style: "destructive",
            onPress: async () => {
              try {
                setRefundingPaymentId(paymentId);
                const result = await CreatorAPI.refundSubscriptionPayment(paymentId, {
                  reason: "Creator-issued refund from creator earnings",
                  cancelSubscription: true,
                });

                if (!result.success) {
                  Alert.alert(
                    "Refund Failed",
                    result.message || "The refund could not be processed."
                  );
                  return;
                }

                Alert.alert(
                  "Refund Processed",
                  result.message || "The payment refund was processed successfully."
                );
                await loadData();
              } catch (error) {
                captureException(error, {
                  tags: { screen: "creator-earnings", stage: "refund" },
                  extra: { paymentId, subscriberName, amount, userId: user?.id },
                });
                Alert.alert(
                  "Refund Failed",
                  "An unexpected error occurred while processing the refund."
                );
              } finally {
                setRefundingPaymentId(null);
              }
            },
          },
        ]
      );
    },
    [demoMode, loadData, user?.id]
  );

  const handleStripeConnect = useCallback(async () => {
    if (demoMode) {
      showDemoBlocked();
      return;
    }
    try {
      setConnectingStripe(true);
      const result = await CreatorAPI.createCreatorConnectOnboarding();

      if (!result.success || !result.connect.onboardingUrl) {
        Alert.alert(
          "Stripe Connect",
          "Unable to start Stripe Connect onboarding right now."
        );
        return;
      }

      await WebBrowser.openBrowserAsync(result.connect.onboardingUrl);
      await loadData();
    } catch (error) {
      captureException(error, {
        tags: { screen: "creator-earnings", stage: "stripe-connect" },
        extra: { userId: user?.id },
      });
      Alert.alert(
        "Stripe Connect",
        "Unable to open Stripe Connect onboarding right now."
      );
    } finally {
      setConnectingStripe(false);
    }
  }, [demoMode, loadData, user?.id]);

  const revenueLabel = useMemo(() => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: analytics.overview.currency || subscriberData.stats.currency || "USD",
      maximumFractionDigits: 2,
    });

    return formatter.format(
      analytics.overview.revenue || subscriberData.stats.revenue || 0
    );
  }, [
    analytics.overview.currency,
    analytics.overview.revenue,
    subscriberData.stats.currency,
    subscriberData.stats.revenue,
  ]);

  const statusCopy = useMemo(() => {
    if (creatorStatus.isCreator && creatorStatus.monetizationEnabled) {
      return "Creator monetization is active. Revenue shown here reflects subscription-side records from the backend.";
    }
    if (creatorStatus.isEligibleForCreator) {
      return "This account is eligible for creator monetization, but payouts and advanced settlement still need deeper backend integration.";
    }
    return "This account is not currently configured as a creator monetization account.";
  }, [creatorStatus]);

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#1E4A72", "#000000"]} style={styles.gradient}>
          <View style={styles.centerState}>
            <Text style={styles.headerTitle}>Creator Earnings</Text>
            <Text style={styles.helperText}>
              Sign in to view creator monetization data.
            </Text>
            <Button
              label="Go To Sign In"
              onPress={() => router.replace("/(auth)/sign-in")}
              variant="primary"
              fullWidth
            />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>Creator Earnings</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.heroCard}>
            <Crown size={24} color="#FFCC66" />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Subscriber Revenue</Text>
              <Text style={styles.heroSubtitle}>
                Track active subscribers, monthly revenue, content performance, and creator account readiness.
              </Text>
            </View>
          </View>

          {loadError ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>
                {previewMode ? "Preview mode" : "Load issue"}
              </Text>
              <Text style={styles.noticeBody}>{loadError}</Text>
              <Button
                label={refreshing ? "Retrying..." : "Retry"}
                onPress={handleRefresh}
                variant="outline"
                fullWidth
                disabled={refreshing}
              />
            </View>
          ) : null}

          {demoMode ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Demo build</Text>
              <Text style={styles.noticeBody}>
                Creator earnings are demo data only. Real payouts require a live
                backend.
              </Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Users size={18} color="#93C5FD" />
              <Text style={styles.statValue}>{analytics.overview.activeSubscribers}</Text>
              <Text style={styles.statLabel}>Active Subs</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={18} color="#FCA5A5" />
              <Text style={styles.statValue}>{analytics.overview.totalViews}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statCard}>
              <BadgeDollarSign size={18} color="#86EFAC" />
              <Text style={styles.statValue}>{revenueLabel}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Status</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoHeadline}>
                {creatorStatus.isCreator ? "Creator account" : "Standard account"}
              </Text>
              <Text style={styles.infoBody}>{statusCopy}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoPill}>
                  Total subscribers: {subscriberData.stats.total}
                </Text>
                <Text style={styles.infoPill}>
                  Active subscribers: {analytics.overview.activeSubscribers}
                </Text>
                <Text style={styles.infoPill}>
                  Posts: {creatorStatus.stats.totalContent}
                </Text>
              </View>
              <Text style={styles.infoBody}>
                Stripe Connect:{" "}
                {creatorStatus.stripeConnect?.accountId
                  ? creatorStatus.stripeConnect.payoutsEnabled
                    ? "payouts enabled"
                    : creatorStatus.stripeConnect.detailsSubmitted
                      ? "account linked, waiting on payouts"
                      : "account linked, onboarding incomplete"
                  : "not connected"}
              </Text>
              {creatorStatus.stripeConnect?.accountId ? (
                <Text style={styles.periodText}>
                  Account ID: {creatorStatus.stripeConnect.accountId}
                </Text>
              ) : null}
              {creatorStatus.isCreator || creatorStatus.isEligibleForCreator ? (
                <Button
                  label={
                    connectingStripe
                      ? "Opening Stripe..."
                      : creatorStatus.stripeConnect?.accountId
                        ? "Resume Stripe Onboarding"
                        : "Connect Stripe Payouts"
                  }
                  onPress={handleStripeConnect}
                  variant="outline"
                  fullWidth
                  loading={connectingStripe}
                  disabled={connectingStripe || demoMode}
                />
              ) : null}
              {subscriberData.stats.period ? (
                <Text style={styles.periodText}>
                  Revenue period: {subscriberData.stats.period}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analytics.overview.totalLikes}</Text>
                <Text style={styles.metricLabel}>Likes</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analytics.overview.totalComments}</Text>
                <Text style={styles.metricLabel}>Comments</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analytics.overview.totalShares}</Text>
                <Text style={styles.metricLabel}>Shares</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {analytics.overview.averageCompletionRate.toFixed(1)}%
                </Text>
                <Text style={styles.metricLabel}>Completion</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Content</Text>
            {analytics.topVideos.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoBody}>
                  Top videos will appear here once analytics records exist for this creator.
                </Text>
              </View>
            ) : (
              analytics.topVideos.map((video) => (
                <View key={video.id} style={styles.subscriptionCard}>
                  <View style={styles.subscriptionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subscriptionCreator}>
                        {video.title || "Untitled video"}
                      </Text>
                      <Text style={styles.subscriptionPlan}>
                        Posted {formatDate(video.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.subscriptionAmount}>{video.views} views</Text>
                  </View>

                  <View style={styles.subscriptionMeta}>
                    <Text style={styles.subscriptionMetaText}>Likes: {video.likes}</Text>
                    <Text style={styles.subscriptionMetaText}>
                      Comments: {video.comments}
                    </Text>
                    <Text style={styles.subscriptionMetaText}>Shares: {video.shares}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscriber Roster</Text>
            {loading ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoBody}>Loading creator subscriber data...</Text>
              </View>
            ) : subscriberData.subscriptions.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoHeadline}>No subscriber records</Text>
                <Text style={styles.infoBody}>
                  Subscriber and revenue data will appear here when this creator account has active or past subscriptions.
                </Text>
              </View>
            ) : (
                subscriberData.subscriptions.map((subscription) => (
                <View key={subscription.id} style={styles.subscriptionCard}>
                  {(() => {
                    const paymentHistory = subscription.SubscriptionPayment || [];
                    const latestPayment = paymentHistory[0];
                    const latestCharge = paymentHistory.find(
                      (payment: SubscriptionPaymentRecord) => payment.amount > 0
                    );
                    const latestRefund = paymentHistory.find(
                      (payment: SubscriptionPaymentRecord) => payment.amount < 0
                    );
                    const subscriberName =
                      subscription.subscriber?.fullName ||
                      subscription.subscriber?.username ||
                      "Subscriber";
                    const canRefundLatestPayment =
                      !!latestCharge &&
                      latestCharge.status === "successful";

                    return (
                      <>
                  <View style={styles.subscriptionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subscriptionCreator}>
                        {subscriberName}
                      </Text>
                      <Text style={styles.subscriptionPlan}>
                        {subscription.plan?.name || "Creator plan"}
                      </Text>
                    </View>
                    <Text style={styles.subscriptionAmount}>
                      {currencyFormatter.format(subscription.plan?.price || 0)}
                    </Text>
                  </View>

                    <View style={styles.subscriptionMeta}>
                      <Text style={styles.subscriptionMetaText}>
                      Status: {formatStatusLabel(subscription.status)}
                      </Text>
                      <Text style={styles.subscriptionMetaText}>
                        Auto-renew: {subscription.autoRenew ? "On" : "Off"}
                      </Text>
                      <Text style={styles.subscriptionMetaText}>
                        End date: {formatDate(subscription.endDate)}
                      </Text>
                    {latestCharge ? (
                      <>
                        <Text style={styles.subscriptionMetaText}>
                          Latest charge: {currencyFormatter.format(latestCharge.amount)} on{" "}
                          {formatDate(latestCharge.createdAt)}
                        </Text>
                        <Text
                          style={[
                            styles.subscriptionMetaText,
                            getPaymentStatusStyle(latestCharge.status),
                          ]}
                        >
                          Charge status: {formatStatusLabel(latestCharge.status)}
                        </Text>
                      </>
                    ) : null}
                    {latestRefund ? (
                      <>
                        <Text style={styles.subscriptionMetaText}>
                          Latest refund: {currencyFormatter.format(Math.abs(latestRefund.amount))} on{" "}
                          {formatDate(latestRefund.createdAt)}
                        </Text>
                        <Text
                          style={[
                            styles.subscriptionMetaText,
                            getPaymentStatusStyle(latestRefund.status),
                          ]}
                        >
                          Refund status: {formatStatusLabel(latestRefund.status)}
                        </Text>
                      </>
                    ) : null}
                    {paymentHistory.length > 1 ? (
                      <Text style={styles.subscriptionMetaText}>
                        Payment records: {paymentHistory.length}
                      </Text>
                    ) : null}
                  </View>
                  {canRefundLatestPayment ? (
                    <Button
                      label={
                        refundingPaymentId === latestCharge!.id
                          ? "Refunding..."
                          : "Refund Latest Payment"
                      }
                      onPress={() =>
                        handleRefundPayment(
                          latestCharge!.id,
                          subscriberName,
                          latestCharge!.amount
                        )
                      }
                      variant="outline"
                      fullWidth
                      loading={refundingPaymentId === latestCharge!.id}
                      disabled={refundingPaymentId === latestCharge!.id || demoMode}
                    />
                  ) : null}
                      </>
                    );
                  })()}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  centerState: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  helperText: {
    color: "#A1A1AA",
    fontSize: 15,
    lineHeight: 22,
    marginVertical: 16,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  heroCopy: {
    marginLeft: 14,
    flex: 1,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
  noticeCard: {
    backgroundColor: "rgba(127,29,29,0.2)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
    marginBottom: 18,
  },
  noticeTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  noticeBody: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "31%",
    backgroundColor: "rgba(12, 18, 32, 0.92)",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "rgba(12, 18, 32, 0.92)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },
  infoHeadline: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoBody: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },
  infoPill: {
    color: "#E2E8F0",
    backgroundColor: "rgba(30, 74, 114, 0.55)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "600",
  },
  periodText: {
    color: "#FFCC66",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
  subscriptionCard: {
    backgroundColor: "rgba(12, 18, 32, 0.92)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    marginBottom: 14,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  subscriptionCreator: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  subscriptionPlan: {
    color: "#CBD5E1",
    fontSize: 14,
    marginTop: 4,
  },
  subscriptionAmount: {
    color: "#86EFAC",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 12,
  },
  subscriptionMeta: {
    marginBottom: 4,
  },
  subscriptionMetaText: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 4,
  },
  successText: {
    color: "#86EFAC",
  },
  errorText: {
    color: "#FCA5A5",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "rgba(12, 18, 32, 0.92)",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },
  metricValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 6,
  },
});
