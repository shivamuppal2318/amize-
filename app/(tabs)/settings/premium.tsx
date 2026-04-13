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
import {
  ArrowLeft,
  BadgeDollarSign,
  Crown,
  Sparkles,
  Users,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  CreatorAPI,
  SubscriptionPaymentRecord,
  UserSubscriptionRecord,
  UserStatusResponse,
} from "@/lib/api/CreatorAPI";
import { PaymentAPI, PaymentAttempt } from "@/lib/api/paymentService";
import { completePendingPayment } from "@/lib/payments/completePendingPayment";
import {
  buildLocalCreatorStatusPreview,
  buildLocalPaymentAttempts,
  buildLocalPremiumSubscriptionsPreview,
} from "@/lib/admin/localPreview";
import { captureException } from "@/utils/errorReporting";
import { isDemoMode } from "@/lib/release/releaseConfig";

type BillingItem = {
  id: string;
  createdAt: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  status: string;
  canConfirm: boolean;
  confirmAttemptId?: string;
  clientSecret?: string | null;
};

type SubscriptionStats = {
  total: number;
  active: number;
  spending: number;
};

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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatDate = (value?: string | null) => {
  if (!value) return "No renewal date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No renewal date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const resolveCurrencyAmount = (subscription: UserSubscriptionRecord) => {
  if (typeof subscription.amount === "number") {
    return currencyFormatter.format(subscription.amount);
  }

  return "Billed via creator plan";
};

const formatPaymentAmount = (attempt: PaymentAttempt) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: attempt.currency || "USD",
    maximumFractionDigits: 2,
  }).format(attempt.amount);

const formatPaymentTitle = (purpose: PaymentAttempt["purpose"]) => {
  if (purpose === "subscription_initial") {
    return "Subscription Start";
  }

  if (purpose === "subscription_renewal") {
    return "Subscription Renewal";
  }

  return "Subscription Payment";
};

const formatBillingStatus = (status: string) =>
  status.replace(/_/g, " ").toUpperCase();

const getBillingStatusStyle = (status: string) => {
  if (status === "succeeded" || status === "successful") {
    return styles.successText;
  }

  if (
    status === "failed" ||
    status === "refunded" ||
    status === "partially_refunded"
  ) {
    return styles.errorText;
  }

  return styles.pendingText;
};

export default function PremiumScreen() {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionRecord[]>([]);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(
    null
  );
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    spending: 0,
  });
  const [creatorStatus, setCreatorStatus] =
    useState<UserStatusResponse["creator"]>(emptyCreatorStatus);
  const demoMode = isDemoMode();
  const showDemoBlocked = () => {
    Alert.alert(
      "Demo build",
      "Subscription management is disabled in the demo build."
    );
  };

  const loadPremiumData = useCallback(async () => {
    if (!user?.id) {
      setSubscriptions([]);
      setBillingItems([]);
      setStats({ total: 0, active: 0, spending: 0 });
      setCreatorStatus(emptyCreatorStatus);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [
        subscriptionsResponse,
        subscriptionBillingResponse,
        creatorStatusResponse,
        initialAttempts,
        renewalAttempts,
      ] = await Promise.all([
        CreatorAPI.getUserSubscriptions(user.id, {
          status: "active",
          mode: "subscribing",
        }),
        CreatorAPI.getUserSubscriptions(user.id, {
          status: "all",
          mode: "subscribing",
        }),
        CreatorAPI.getUserCreatorStatus(user.id),
        PaymentAPI.getAttempts({
          purpose: "subscription_initial",
          limit: 6,
        }),
        PaymentAPI.getAttempts({
          purpose: "subscription_renewal",
          limit: 6,
        }),
      ]);

      const activeSubscriptions = Array.isArray(subscriptionsResponse?.subscriptions)
        ? subscriptionsResponse.subscriptions
        : [];
      const allSubscriptions = Array.isArray(
        subscriptionBillingResponse?.subscriptions
      )
        ? subscriptionBillingResponse.subscriptions
        : [];

      setSubscriptions(activeSubscriptions);
      setStats({
        total: subscriptionsResponse?.stats?.total ?? 0,
        active: subscriptionsResponse?.stats?.active ?? 0,
        spending: subscriptionsResponse?.stats?.spending ?? 0,
      });
      setCreatorStatus(creatorStatusResponse?.creator ?? emptyCreatorStatus);
      setPreviewMode(false);
      setLoadError(null);

      const paymentRecords: BillingItem[] = allSubscriptions.flatMap(
        (subscription) =>
          (subscription.SubscriptionPayment || []).map(
            (payment: SubscriptionPaymentRecord) => ({
              id: payment.id,
              createdAt: payment.createdAt,
              title:
                subscription.creator?.fullName ||
                subscription.creator?.username ||
                subscription.creatorName ||
                subscription.creatorUsername ||
                "Creator subscription",
              subtitle:
                subscription.plan?.name ||
                subscription.planName ||
                "Subscription payment",
              amountLabel: new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: payment.currency || "USD",
                maximumFractionDigits: 2,
              }).format(payment.amount),
              status: payment.status,
              canConfirm: false,
            })
          )
      );

      const attemptRecords: BillingItem[] = [
        ...initialAttempts,
        ...renewalAttempts,
      ].map((attempt) => ({
        id: attempt.id,
        createdAt: attempt.createdAt,
        title: formatPaymentTitle(attempt.purpose),
        subtitle: `${attempt.provider} | ${attempt.paymentMethod}`,
        amountLabel: formatPaymentAmount(attempt),
        status: attempt.status,
        canConfirm: attempt.status === "requires_action",
        confirmAttemptId: attempt.id,
        clientSecret: attempt.clientSecret,
      }));

      setBillingItems(
        [...paymentRecords, ...attemptRecords]
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime()
          )
          .slice(0, 8)
      );
    } catch (error) {
      captureException(error, {
        tags: { screen: "settings-premium", stage: "load" },
        extra: { userId: user.id },
      });
      const previewData = buildLocalPremiumSubscriptionsPreview();
      const previewAttempts = [
        ...buildLocalPaymentAttempts("subscription_initial", 2),
        ...buildLocalPaymentAttempts("subscription_renewal", 2),
      ];
      setSubscriptions(previewData.subscriptions);
      setStats({
        total: previewData.stats.total,
        active: previewData.stats.active,
        spending: previewData.stats.spending,
      });
      setCreatorStatus(buildLocalCreatorStatusPreview());
      setPreviewMode(true);
      setLoadError(
        "Premium backend data is unavailable. This screen is showing local preview mode only."
      );

      const previewBillingItems: BillingItem[] = previewAttempts.map((attempt) => ({
        id: attempt.id,
        createdAt: attempt.createdAt,
        title: formatPaymentTitle(attempt.purpose),
        subtitle: `${attempt.provider} | ${attempt.paymentMethod}`,
        amountLabel: formatPaymentAmount(attempt),
        status: attempt.status,
        canConfirm: attempt.status === "requires_action",
        confirmAttemptId: attempt.id,
        clientSecret: attempt.clientSecret,
      }));

      setBillingItems(previewBillingItems);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPremiumData();
  }, [loadPremiumData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPremiumData();
  }, [loadPremiumData]);

  const handleCancelSubscription = useCallback(
    (subscriptionId: string) => {
      if (demoMode) {
        showDemoBlocked();
        return;
      }
      Alert.alert(
        "Cancel Subscription",
        "This will request cancellation for the selected subscription.",
        [
          { text: "Keep", style: "cancel" },
          {
            text: "Cancel Subscription",
            style: "destructive",
            onPress: async () => {
              try {
                setCancellingId(subscriptionId);
                const success = await CreatorAPI.cancelSubscription(subscriptionId);
                if (!success) {
                  Alert.alert(
                    "Cancellation Failed",
                    "The subscription could not be cancelled right now."
                  );
                  return;
                }

                Alert.alert(
                  "Cancellation Requested",
                  "The subscription has been marked for cancellation."
                );
                loadPremiumData();
              } catch (error) {
                captureException(error, {
                  tags: {
                    screen: "settings-premium",
                    stage: "cancel-subscription",
                  },
                  extra: { subscriptionId },
                });
                Alert.alert(
                  "Cancellation Failed",
                  "An unexpected error occurred while cancelling."
                );
              } finally {
                setCancellingId(null);
              }
            },
          },
        ]
      );
    },
    [demoMode, loadPremiumData]
  );

  const monetizationSummary = useMemo(() => {
    if (creatorStatus.isCreator && creatorStatus.monetizationEnabled) {
      return "Creator monetization is enabled on this account.";
    }
    if (creatorStatus.isEligibleForCreator) {
      return "This account is eligible for creator subscriptions but still needs backend onboarding.";
    }
    return "Premium creator monetization is not enabled on this account yet.";
  }, [creatorStatus]);

  const handleConfirmPaymentAttempt = useCallback(
    async (paymentAttemptId: string, clientSecret?: string | null) => {
      if (demoMode) {
        showDemoBlocked();
        return;
      }
      try {
        setConfirmingPaymentId(paymentAttemptId);
        const result = await completePendingPayment({
          paymentAttemptId,
          clientSecret,
        });
        Alert.alert(
          result.success ? "Payment Confirmed" : "Verification Pending",
          result.message
        );
        await loadPremiumData();
      } catch (error) {
        captureException(error, {
          tags: { screen: "settings-premium", stage: "confirm-payment" },
          extra: { paymentAttemptId, userId: user?.id },
        });
        Alert.alert("Error", "Unable to confirm this payment right now.");
      } finally {
        setConfirmingPaymentId(null);
      }
    },
    [demoMode, loadPremiumData, user?.id]
  );

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#1E4A72", "#000000"]} style={styles.gradient}>
          <View style={styles.centerState}>
            <Text style={styles.headerTitle}>Premium</Text>
            <Text style={styles.helperText}>
              Sign in to manage subscriptions and creator monetization.
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
            <Text style={styles.headerTitle}>Premium & Subscriptions</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.heroCard}>
            <Crown size={24} color="#FFCC66" />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Premium Access</Text>
              <Text style={styles.heroSubtitle}>
                Manage active subscriptions and review creator monetization
                status.
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
                Subscriptions are simulated in this demo. No real billing or
                renewals occur.
              </Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Sparkles size={18} color="#FFCC66" />
              <Text style={styles.statValue}>{stats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Users size={18} color="#93C5FD" />
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <BadgeDollarSign size={18} color="#86EFAC" />
              <Text style={styles.statValue}>
                {currencyFormatter.format(stats.spending ?? 0)}
              </Text>
              <Text style={styles.statLabel}>Spending</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Creator Status</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoHeadline}>
                {creatorStatus.isCreator ? "Creator Account" : "Standard Account"}
              </Text>
              <Text style={styles.infoBody}>{monetizationSummary}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoPill}>
                  Subscribers: {creatorStatus.stats.subscribers}
                </Text>
                <Text style={styles.infoPill}>
                  Posts: {creatorStatus.stats.totalContent}
                </Text>
              </View>
              {creatorStatus.creatorCategory ? (
                <Text style={styles.creatorCategory}>
                  Category: {creatorStatus.creatorCategory}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Subscriptions</Text>
            {loading ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoBody}>Loading subscriptions...</Text>
              </View>
            ) : subscriptions.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoHeadline}>No active subscriptions</Text>
                <Text style={styles.infoBody}>
                  Subscription management is wired, but this account does not
                  have active plans right now.
                </Text>
              </View>
            ) : (
              subscriptions.map((subscription) => (
                <View key={subscription.id} style={styles.subscriptionCard}>
                  <View style={styles.subscriptionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subscriptionCreator}>
                        {subscription.creatorName ||
                          subscription.creatorUsername ||
                          "Creator subscription"}
                      </Text>
                      <Text style={styles.subscriptionPlan}>
                        {subscription.planName || "Premium plan"}
                      </Text>
                    </View>
                    <Text style={styles.subscriptionAmount}>
                      {resolveCurrencyAmount(subscription)}
                    </Text>
                  </View>

                  <View style={styles.subscriptionMeta}>
                    <Text style={styles.subscriptionMetaText}>
                      Renews: {formatDate(subscription.endDate)}
                    </Text>
                    <Text style={styles.subscriptionMetaText}>
                      Auto-renew: {subscription.autoRenew ? "On" : "Off"}
                    </Text>
                  </View>

                  <Button
                    label={
                      cancellingId === subscription.id
                        ? "Cancelling..."
                        : "Cancel Subscription"
                    }
                    onPress={() => handleCancelSubscription(subscription.id)}
                    variant="outline"
                    fullWidth
                    loading={cancellingId === subscription.id}
                    disabled={cancellingId === subscription.id || demoMode}
                  />
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Billing</Text>
            {loading ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoBody}>Loading billing activity...</Text>
              </View>
            ) : billingItems.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoHeadline}>No billing activity yet</Text>
                <Text style={styles.infoBody}>
                  Subscription billing activity will appear here, including
                  successful charges, refunds, and payments that still need
                  verification.
                </Text>
              </View>
            ) : (
              billingItems.map((item) => (
                <View key={item.id} style={styles.subscriptionCard}>
                  <View style={styles.subscriptionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subscriptionCreator}>{item.title}</Text>
                      <Text style={styles.subscriptionPlan}>
                        {formatDate(item.createdAt)} | {item.subtitle}
                      </Text>
                    </View>
                    <Text style={styles.subscriptionAmount}>
                      {item.amountLabel}
                    </Text>
                  </View>

                  <View style={styles.subscriptionMeta}>
                    <Text
                      style={[
                        styles.subscriptionMetaText,
                        getBillingStatusStyle(item.status),
                      ]}
                    >
                      Status: {formatBillingStatus(item.status)}
                    </Text>
                  </View>

                  {item.canConfirm && item.confirmAttemptId ? (
                    <Button
                      label={
                        confirmingPaymentId === item.confirmAttemptId
                          ? "Confirming..."
                          : "Complete Verification"
                      }
                      onPress={() =>
                        handleConfirmPaymentAttempt(
                          item.confirmAttemptId!,
                          item.clientSecret
                        )
                      }
                      variant="outline"
                      fullWidth
                      loading={confirmingPaymentId === item.confirmAttemptId}
                      disabled={confirmingPaymentId === item.confirmAttemptId || demoMode}
                    />
                  ) : null}
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
    fontSize: 17,
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
  creatorCategory: {
    color: "#FFCC66",
    fontSize: 13,
    marginTop: 2,
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
    marginBottom: 14,
  },
  subscriptionMetaText: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 4,
  },
  successText: {
    color: "#86EFAC",
  },
  pendingText: {
    color: "#FCD34D",
  },
  errorText: {
    color: "#FCA5A5",
  },
});
