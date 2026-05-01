import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowLeft,
  Coins,
  Gift,
  Landmark,
  ReceiptText,
  Wallet,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "@/components/ui/Button";
import {
  ConfigAPI,
  PaymentProviderConfig,
} from "@/lib/api/configService";
import {
  CreatorAPI,
  CreatorConnectStatusResponse,
} from "@/lib/api/CreatorAPI";
import { AuthContext } from "@/context/AuthContext";
import { captureException } from "@/utils/errorReporting";
import { PaymentAPI, PaymentAttempt } from "@/lib/api/paymentService";
import { completePendingPayment } from "@/lib/payments/completePendingPayment";
import {
  GiftInventory,
  WalletAPI,
  WalletState,
  WalletTransaction,
  WithdrawalRequest,
} from "@/lib/api/walletService";
import {
  buildLocalPaymentAttempts,
  buildLocalWalletWithdrawals,
} from "@/lib/admin/localPreview";
import { isDemoMode } from "@/lib/release/releaseConfig";
const minimumWithdrawal = 25;

const DEFAULT_WALLET_STATE: WalletState = {
  coinBalance: 0,
  cashBalance: 0,
  giftInventory: { roses: 0, stars: 0, crowns: 0 },
  payoutMethod: "",
  payoutDestination: "",
  transactions: [],
};

const coinPackages = [
  { coins: 250, price: 4.99 },
  { coins: 1000, price: 14.99 },
  { coins: 2500, price: 29.99 },
];

const giftCashValues: Record<keyof GiftInventory, number> = {
  roses: 0.25,
  stars: 1.5,
  crowns: 10,
};

const defaultPaymentConfig: PaymentProviderConfig = {
  provider: "mock",
  displayName: "Mock Payments",
  isMock: true,
  supportsManualConfirmation: true,
  requiresClientSecret: true,
  configured: true,
  defaults: {
    wallet_top_up: "mock_wallet_default",
    subscription_initial: "mock_subscription_default",
    subscription_renewal: "mock_subscription_renewal",
  },
  testPaymentMethods: [
    {
      id: "mock_wallet_default",
      label: "Mock success",
      outcome: "success",
    },
    {
      id: "mock_action_required",
      label: "Mock requires verification",
      outcome: "requires_action",
    },
    {
      id: "mock_decline_card",
      label: "Mock decline",
      outcome: "decline",
    },
  ],
};

const normalizeWalletState = (raw: unknown): WalletState => {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_WALLET_STATE;
  }

  const parsed = raw as Partial<WalletState> & {
    transactions?: Array<
      Partial<WalletTransaction> & { amount?: number; createdAt?: string }
    >;
    giftInventory?: Partial<GiftInventory>;
  };

  return {
    coinBalance:
      typeof parsed.coinBalance === "number"
        ? parsed.coinBalance
        : DEFAULT_WALLET_STATE.coinBalance,
    cashBalance:
      typeof parsed.cashBalance === "number"
        ? parsed.cashBalance
        : DEFAULT_WALLET_STATE.cashBalance,
    payoutMethod:
      typeof parsed.payoutMethod === "string" && parsed.payoutMethod.trim()
        ? parsed.payoutMethod
        : DEFAULT_WALLET_STATE.payoutMethod,
    payoutDestination:
      typeof parsed.payoutDestination === "string"
        ? parsed.payoutDestination
        : "",
    giftInventory: {
      roses:
        typeof parsed.giftInventory?.roses === "number"
          ? parsed.giftInventory.roses
          : DEFAULT_WALLET_STATE.giftInventory.roses,
      stars:
        typeof parsed.giftInventory?.stars === "number"
          ? parsed.giftInventory.stars
          : DEFAULT_WALLET_STATE.giftInventory.stars,
      crowns:
        typeof parsed.giftInventory?.crowns === "number"
          ? parsed.giftInventory.crowns
          : DEFAULT_WALLET_STATE.giftInventory.crowns,
    },
    transactions: Array.isArray(parsed.transactions)
      ? parsed.transactions.map((transaction, index) => ({
          id: transaction.id || `legacy-${index}`,
          title: transaction.title || "Wallet activity",
          amount: typeof transaction.amount === "number" ? transaction.amount : 0,
          asset:
            transaction.asset === "cash" || transaction.asset === "coins"
              ? transaction.asset
              : typeof transaction.amount === "number" && transaction.amount > 100
                ? "coins"
                : "cash",
          type:
            transaction.type === "credit" ||
            transaction.type === "debit" ||
            transaction.type === "withdrawal"
              ? transaction.type
              : "credit",
          createdAt:
            typeof transaction.createdAt === "string"
              ? transaction.createdAt
              : new Date().toISOString().slice(0, 10),
        }))
      : DEFAULT_WALLET_STATE.transactions,
  };
};

const formatCash = (amount: number) => `$${amount.toFixed(2)}`;

const formatTransactionAmount = (transaction: WalletTransaction) => {
  const prefix = transaction.type === "withdrawal" || transaction.type === "debit" ? "-" : "+";
  const value =
    transaction.asset === "coins"
      ? `${transaction.amount} coins`
      : formatCash(transaction.amount);

  return `${prefix}${value}`;
};

const formatDateLabel = (value: string) => {
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

const formatPaymentPurpose = (value: string) => {
  if (value === "wallet_top_up") {
    return "Wallet top-up";
  }

  if (value === "subscription_initial") {
    return "Subscription start";
  }

  if (value === "subscription_renewal") {
    return "Subscription renewal";
  }

  return value;
};

const formatPaymentAmount = (attempt: PaymentAttempt) =>
  `${attempt.currency} ${attempt.amount.toFixed(2)}`;

const isStripeConnectDestination = (method: string, destination: string) =>
  method.trim().toLowerCase() === "stripe connect" &&
  destination.trim().startsWith("acct_");

const defaultConnectStatus: CreatorConnectStatusResponse = {
  success: false,
  connect: {
    provider: "unknown",
    accountId: null,
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    onboardedAt: null,
  },
};

export default function WalletScreen() {
  const { user } = useContext(AuthContext);
  const [walletState, setWalletState] = useState<WalletState>(DEFAULT_WALLET_STATE);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [paymentAttempts, setPaymentAttempts] = useState<PaymentAttempt[]>([]);
  const [paymentConfig, setPaymentConfig] =
    useState<PaymentProviderConfig>(defaultPaymentConfig);
  const [connectStatus, setConnectStatus] =
    useState<CreatorConnectStatusResponse>(defaultConnectStatus);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState(DEFAULT_WALLET_STATE.payoutMethod);
  const [payoutDestination, setPayoutDestination] = useState("");
  const demoMode = isDemoMode();
  const showDemoBlocked = () => {
    Alert.alert(
      "Demo build",
      "This action is disabled in the demo build. Use live backend + payments to enable it."
    );
  };

  const stripeConnectLinked = useMemo(
    () => isStripeConnectDestination(payoutMethod, payoutDestination),
    [payoutDestination, payoutMethod]
  );
  const stripeProviderActive = paymentConfig.provider === "stripe";
  const stripeConnectReady =
    stripeConnectLinked &&
    !!connectStatus.connect.accountId &&
    connectStatus.connect.detailsSubmitted &&
    connectStatus.connect.payoutsEnabled;

  const canUseCreatorConnect = useMemo(() => {
    // `/creators/connect` is forbidden for normal accounts on the backend.
    return !!(
      user?.role === "CREATOR" ||
      user?.creatorVerified ||
      user?.monetizationEnabled
    );
  }, [user?.creatorVerified, user?.monetizationEnabled, user?.role]);

  const giftActivity = useMemo(
    () =>
      walletState.transactions.filter((transaction) =>
        transaction.title.toLowerCase().includes("gift")
      ),
    [walletState.transactions]
  );

  const syncWalletState = (nextState: WalletState) => {
    const normalizedState = normalizeWalletState(nextState);
    setWalletState(normalizedState);
    setPayoutMethod(normalizedState.payoutMethod);
    setPayoutDestination(normalizedState.payoutDestination);
  };

  const loadWithdrawalRequests = useCallback(async () => {
    const result = await WalletAPI.getWithdrawals();
    setWithdrawals(result.withdrawals);
  }, []);

  const loadPaymentAttempts = useCallback(async () => {
    const nextAttempts = await PaymentAPI.getAttempts({
      purpose: "wallet_top_up",
      limit: 6,
    });
    setPaymentAttempts(nextAttempts);
  }, []);

  const loadWalletState = useCallback(async () => {
    try {
      const [wallet, nextPaymentConfig, nextConnectStatus] = await Promise.all([
        WalletAPI.getWallet(),
        ConfigAPI.getPaymentProviderConfig(),
        canUseCreatorConnect
          ? CreatorAPI.getCreatorConnectStatus()
          : Promise.resolve(defaultConnectStatus),
        loadWithdrawalRequests(),
        loadPaymentAttempts(),
      ]);
      syncWalletState(wallet);
      setPaymentConfig(nextPaymentConfig);
      setConnectStatus(nextConnectStatus);
      setPreviewMode(false);
      setLoadError(null);
    } catch (error) {
      captureException(error, {
        tags: { screen: "wallet", stage: "load" },
      });
      syncWalletState(DEFAULT_WALLET_STATE);
      setPaymentConfig(defaultPaymentConfig);
      setConnectStatus(defaultConnectStatus);

      if (demoMode) {
        setWithdrawals(buildLocalWalletWithdrawals());
        setPaymentAttempts(buildLocalPaymentAttempts("wallet_top_up", 3));
        setPreviewMode(true);
        setLoadError(
          "Wallet backend data is unavailable. This screen is showing local preview balances and actions."
        );
      } else {
        setWithdrawals([]);
        setPaymentAttempts([]);
        setPreviewMode(false);
        setLoadError(
          "Wallet backend data is unavailable right now. Balances are hidden until live wallet data loads."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [canUseCreatorConnect, loadPaymentAttempts, loadWithdrawalRequests]);

  useEffect(() => {
    loadWalletState();
  }, [loadWalletState]);

  const estimatedGiftValue = useMemo(() => {
    return Number(
      (
        walletState.giftInventory.roses * giftCashValues.roses +
        walletState.giftInventory.stars * giftCashValues.stars +
        walletState.giftInventory.crowns * giftCashValues.crowns
      ).toFixed(2)
    );
  }, [walletState.giftInventory]);

  const canWithdraw = useMemo(() => {
    const parsedAmount = Number(withdrawalAmount);
    return (
      parsedAmount >= minimumWithdrawal &&
      parsedAmount <= walletState.cashBalance &&
      payoutMethod.trim().length > 0 &&
      payoutDestination.trim().length > 0 &&
      (!stripeProviderActive || stripeConnectReady)
    );
  }, [
    payoutDestination,
    payoutMethod,
    stripeConnectReady,
    stripeProviderActive,
    walletState.cashBalance,
    withdrawalAmount,
  ]);

  const handleConnectStripe = async () => {
    if (demoMode) {
      showDemoBlocked();
      return;
    }
    if (!canUseCreatorConnect) {
      Alert.alert(
        "Stripe Connect",
        "Creator monetization is not enabled for this account yet."
      );
      return;
    }
    try {
      setSubmitting(true);
      const result = await CreatorAPI.createCreatorConnectOnboarding();

      if (!result.success || !result.connect.onboardingUrl) {
        Alert.alert(
          "Stripe Connect",
          "Unable to open Stripe Connect onboarding right now."
        );
        return;
      }

      await WebBrowser.openBrowserAsync(result.connect.onboardingUrl);
      const [wallet, nextConnectStatus] = await Promise.all([
        WalletAPI.getWallet(),
        CreatorAPI.getCreatorConnectStatus(),
      ]);
      syncWalletState(wallet);
      setConnectStatus(nextConnectStatus);
    } catch (error) {
      captureException(error, {
        tags: { screen: "wallet", stage: "connect-stripe" },
      });
      Alert.alert("Stripe Connect", "Unable to load Stripe Connect onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  const persistPayoutDetails = async () => {
    if (demoMode) {
      showDemoBlocked();
      return;
    }
    const method = payoutMethod.trim();
    const destination = payoutDestination.trim();

    if (!method || !destination) {
      Alert.alert(
        "Payout Details Missing",
        "Enter both a payout method and destination before saving."
      );
      return;
    }

    try {
      setSubmitting(true);
      const nextState = await WalletAPI.updatePayoutDetails(method, destination);
      syncWalletState(nextState);
      Alert.alert("Saved", "Payout details were updated.");
    } catch (error) {
      captureException(error, {
        tags: { screen: "wallet", stage: "save-payout-details" },
      });
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Unable to save payout details right now.";
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopUp = async (coins: number, price: number) => {
    if (demoMode) {
      showDemoBlocked();
      return;
    }
    try {
      setSubmitting(true);
      const result = await WalletAPI.topUpCoins(
        coins,
        price,
        paymentConfig.defaults.wallet_top_up
      );

      if (!result.success) {
        await loadPaymentAttempts();
        if (result.payment?.attemptId) {
          Alert.alert(
            "Payment Verification Required",
            result.message ||
              "This top-up needs additional payment verification before coins can be added.",
            [
              { text: "Later", style: "cancel" },
              {
                text: "Complete Now",
                onPress: () => handleConfirmPaymentAttempt(result.payment!.attemptId!),
              },
            ]
          );
        } else {
          Alert.alert(
            "Payment Verification Required",
            result.message ||
              "This top-up needs additional payment verification before coins can be added."
          );
        }
        return;
      }

      syncWalletState(result.wallet);
      await loadPaymentAttempts();
      Alert.alert("Coins Added", `${coins} coins were added to your wallet.`);
    } catch (error) {
      captureException(error, {
        tags: { screen: "wallet", stage: "top-up" },
        extra: { coins, price },
      });
      Alert.alert("Error", "Unable to add coins right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertGifts = async () => {
    if (demoMode) {
      showDemoBlocked();
      return;
    }
    if (estimatedGiftValue <= 0) {
      Alert.alert("No Gifts Available", "There are no gifts available to settle.");
      return;
    }

    try {
      setSubmitting(true);
      const { wallet, settledAmount } = await WalletAPI.settleGifts();
      syncWalletState(wallet);
      Alert.alert(
        "Gifts Settled",
        `${formatCash(settledAmount)} was added to your cash balance.`
      );
    } catch (error) {
      captureException(error, {
        tags: { screen: "wallet", stage: "convert-gifts" },
      });
      Alert.alert("Error", "Unable to settle gifts right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawal = async () => {
    if (demoMode) {
      showDemoBlocked();
      return;
    }
    const parsedAmount = Number(withdrawalAmount);
    if (!canWithdraw) {
      Alert.alert(
        "Withdrawal Not Ready",
        stripeProviderActive && !stripeConnectReady
          ? "Complete Stripe Connect onboarding before requesting a Stripe payout."
          : `Enter at least $${minimumWithdrawal}, stay within available balance, and save a payout destination.`
      );
      return;
    }

    try {
      setWithdrawing(true);
      const nextState = await WalletAPI.requestWithdrawal(
        parsedAmount,
        payoutMethod.trim(),
        payoutDestination.trim()
      );
      syncWalletState(nextState);
      await loadWithdrawalRequests();
      setWithdrawalAmount("");
      Alert.alert(
        "Withdrawal Requested",
        "The withdrawal request has been recorded."
      );
    } catch (error) {
      captureException(error, {
        tags: { screen: "wallet", stage: "withdraw" },
        extra: { amount: parsedAmount },
      });
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Unable to save the withdrawal request right now.";
      Alert.alert("Error", message);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleConfirmPaymentAttempt = async (paymentAttemptId: string) => {
    if (demoMode) {
      showDemoBlocked();
      return;
    }
    const targetAttempt = paymentAttempts.find(
      (attempt) => attempt.id === paymentAttemptId
    );

    try {
      setConfirmingPaymentId(paymentAttemptId);
      const result = await completePendingPayment({
        paymentAttemptId,
        clientSecret: targetAttempt?.clientSecret,
        paymentConfig,
      });
      await Promise.all([loadPaymentAttempts(), loadWithdrawalRequests()]);
      const wallet = await WalletAPI.getWallet();
      syncWalletState(wallet);
      if (!result.success) {
        Alert.alert(
          "Verification Pending",
          result.message || "The pending payment could not be completed yet."
        );
        return;
      }

      Alert.alert("Payment Confirmed", result.message);
    } catch (error) {
      captureException(error, {
        tags: { screen: "wallet", stage: "confirm-payment" },
        extra: { paymentAttemptId },
      });
      Alert.alert("Error", "Unable to confirm this payment right now.");
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#1E4A72", "#000000"]} style={styles.gradient}>
          <View style={styles.centerState}>
            <Text style={styles.headerTitle}>Loading wallet...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1E4A72", "#000000"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
                onPress={() => router.back()}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Wallet & Payouts</Text>
            <View style={{ width: 24 }} />
          </View>

          {loadError ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>
                {previewMode ? "Preview mode" : "Load issue"}
              </Text>
              <Text style={styles.noticeText}>{loadError}</Text>
              <Button
                label={loading ? "Retrying..." : "Retry"}
                onPress={() => {
                  setLoading(true);
                  loadWalletState();
                }}
                variant="outline"
                fullWidth
                disabled={loading}
              />
            </View>
          ) : null}

          {demoMode ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Demo build</Text>
              <Text style={styles.noticeText}>
                Payments and payouts are simulated in this demo. No real money
                will be processed.
              </Text>
            </View>
          ) : null}

          <View style={styles.balanceGrid}>
            <View style={styles.balanceCard}>
              <Coins size={24} color="#FFB700" />
              <Text style={styles.balanceLabel}>Coin Balance</Text>
              <Text style={styles.balanceValue}>{walletState.coinBalance}</Text>
            </View>
            <View style={styles.balanceCard}>
              <Wallet size={24} color="#74A9D9" />
              <Text style={styles.balanceLabel}>Cash Balance</Text>
              <Text style={styles.balanceValue}>
                {formatCash(walletState.cashBalance)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Up Coins</Text>
            <Text style={styles.helperText}>
              Charges run through {paymentConfig.displayName}. Default wallet
              method: {paymentConfig.defaults.wallet_top_up || "not configured"}.
            </Text>
            {paymentConfig.isMock ? (
              <Text style={styles.helperText}>
                Test methods:{" "}
                {paymentConfig.testPaymentMethods
                  .map((method) => `${method.id} (${method.outcome})`)
                  .join(", ")}
              </Text>
            ) : null}
            <View style={styles.packageRow}>
              {coinPackages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.coins}
                  style={styles.packageCard}
                  activeOpacity={0.85}
                  onPress={() => handleTopUp(pkg.coins, pkg.price)}
                  disabled={submitting || withdrawing || demoMode}
                >
                  <Text style={styles.packageCoins}>{pkg.coins} coins</Text>
                  <Text style={styles.packagePrice}>{formatCash(pkg.price)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gift Inventory</Text>
              <TouchableOpacity
                onPress={handleConvertGifts}
                disabled={submitting || withdrawing || demoMode}
              >
                <Text style={styles.linkText}>Settle Gifts</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.giftsRow}>
              {[
                { key: "Roses", value: walletState.giftInventory.roses },
                { key: "Stars", value: walletState.giftInventory.stars },
                { key: "Crowns", value: walletState.giftInventory.crowns },
              ].map((gift) => (
                <View key={gift.key} style={styles.giftCard}>
                  <Gift size={18} color="#FF5A5F" />
                  <Text style={styles.giftName}>{gift.key}</Text>
                  <Text style={styles.giftValue}>{gift.value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.helperText}>
              Estimated settlement value: {formatCash(estimatedGiftValue)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gift Activity</Text>
            {giftActivity.length === 0 ? (
              <Text style={styles.helperText}>
                Gift activity will appear here once you send or receive gifts.
              </Text>
            ) : (
              giftActivity.map((transaction) => (
                <View key={transaction.id} style={styles.transactionRow}>
                  <View>
                    <Text style={styles.transactionTitle}>{transaction.title}</Text>
                    <Text style={styles.transactionDate}>
                      {formatDateLabel(transaction.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.transactionAmount}>
                    {formatTransactionAmount(transaction)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payout Account</Text>
              <ReceiptText size={18} color="#9CA3AF" />
            </View>
            <Text style={styles.helperText}>
              {stripeProviderActive
                ? stripeConnectLinked
                  ? "This wallet is linked to Stripe Connect. Your connected account id is synced automatically."
                  : "For Stripe payouts, save a connected account id like acct_... as the destination."
                : "Save the payout destination used by your current provider workflow."}
            </Text>
            {stripeProviderActive ? (
              <View style={styles.connectStatusCard}>
                <Text style={styles.connectStatusTitle}>Stripe Connect</Text>
                <Text style={styles.connectStatusText}>
                  {stripeConnectReady
                    ? "Payouts are enabled for this connected account."
                    : connectStatus.connect.accountId
                    ? "Connected account found, but Stripe onboarding is not complete yet."
                    : "No Stripe Connect account linked yet."}
                </Text>
                {connectStatus.connect.accountId ? (
                  <Text style={styles.connectStatusText}>
                    Account: {connectStatus.connect.accountId}
                  </Text>
                ) : null}
                <Text style={styles.connectStatusText}>
                  Details submitted: {connectStatus.connect.detailsSubmitted ? "Yes" : "No"}
                </Text>
                <Text style={styles.connectStatusText}>
                  Payouts enabled: {connectStatus.connect.payoutsEnabled ? "Yes" : "No"}
                </Text>
                {!stripeConnectReady ? (
                  <Button
                    label={
                      connectStatus.connect.accountId
                        ? "Resume Stripe Connect"
                        : "Set Up Stripe Connect"
                    }
                    onPress={handleConnectStripe}
                    variant="outline"
                    fullWidth
                    loading={submitting}
                    disabled={submitting || withdrawing || demoMode}
                  />
                ) : null}
              </View>
            ) : null}
            {stripeConnectLinked ? (
              <Text style={styles.helperText}>
                Connected account: {payoutDestination.trim()}
              </Text>
            ) : null}
            <TextInput
              value={payoutMethod}
              onChangeText={setPayoutMethod}
              placeholder="Payout method"
              placeholderTextColor="#6B7280"
              style={styles.input}
              editable={!stripeConnectLinked}
            />
            <TextInput
              value={payoutDestination}
              onChangeText={setPayoutDestination}
              placeholder="Bank, UPI, PayPal, or account destination"
              placeholderTextColor="#6B7280"
              style={styles.input}
              editable={!stripeConnectLinked}
            />
            <Button
              label={stripeConnectLinked ? "Linked via Stripe Connect" : "Save Payout Details"}
              onPress={persistPayoutDetails}
              variant="outline"
              fullWidth
              loading={submitting}
              disabled={submitting || withdrawing || stripeConnectLinked || demoMode}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal Request</Text>
            <Text style={styles.helperText}>
              Minimum withdrawal: ${minimumWithdrawal}. Requests are sent through the wallet API.
            </Text>
            {stripeProviderActive ? (
              <Text style={styles.helperText}>
                {stripeConnectReady
                  ? "Withdrawal execution will use the connected Stripe account linked above."
                  : "Stripe withdrawals stay disabled until Stripe Connect onboarding is complete."}
              </Text>
            ) : null}
            <TextInput
              value={withdrawalAmount}
              onChangeText={setWithdrawalAmount}
              placeholder="Enter withdrawal amount"
              placeholderTextColor="#6B7280"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.payoutPreview}>
              Destination: {payoutDestination.trim() || "Not saved yet"}
            </Text>
            <Button
              label="Request Withdrawal"
              onPress={handleWithdrawal}
              variant="primary"
              fullWidth
              loading={withdrawing}
              disabled={!canWithdraw || withdrawing || submitting || demoMode}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Withdrawal Status</Text>
              <ReceiptText size={18} color="#9CA3AF" />
            </View>
            {withdrawals.length === 0 ? (
              <Text style={styles.helperText}>
                No withdrawal requests yet.
              </Text>
            ) : (
              withdrawals.map((request) => (
                <View key={request.id} style={styles.transactionRow}>
                  <View style={styles.transactionCopy}>
                    <Text style={styles.transactionTitle}>
                      {formatCash(request.amount)} via {request.payoutMethod}
                    </Text>
                    <Text style={styles.transactionDate}>
                      Requested {formatDateLabel(request.createdAt)}
                    </Text>
                    {request.processedAt ? (
                      <Text style={styles.transactionDate}>
                        Processed {formatDateLabel(request.processedAt)}
                      </Text>
                    ) : null}
                    {request.payoutTransactionId ? (
                      <Text style={styles.transactionDate}>
                        Ref: {request.payoutTransactionId}
                      </Text>
                    ) : null}
                    {request.payoutFailureReason ? (
                      <Text style={styles.rejectedAmount}>
                        {request.payoutFailureReason}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.withdrawalStatus,
                      request.status === "completed"
                        ? styles.creditAmount
                        : request.status === "rejected"
                          ? styles.rejectedAmount
                          : styles.debitAmount,
                    ]}
                  >
                    {request.status.toUpperCase()}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Landmark size={18} color="#9CA3AF" />
            </View>
            {walletState.transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionRow}>
                <View style={styles.transactionCopy}>
                  <Text style={styles.transactionTitle}>{transaction.title}</Text>
                  <Text style={styles.transactionDate}>
                    {formatDateLabel(transaction.createdAt)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === "withdrawal" || transaction.type === "debit"
                      ? styles.debitAmount
                      : styles.creditAmount,
                  ]}
                >
                  {formatTransactionAmount(transaction)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment Attempts</Text>
              <ReceiptText size={18} color="#9CA3AF" />
            </View>
            {paymentAttempts.length === 0 ? (
              <Text style={styles.helperText}>
                No payment attempts recorded yet.
              </Text>
            ) : (
              paymentAttempts.map((attempt) => (
                <View key={attempt.id} style={styles.transactionRow}>
                  <View style={styles.transactionCopy}>
                    <Text style={styles.transactionTitle}>
                      {formatPaymentPurpose(attempt.purpose)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatPaymentAmount(attempt)} • {formatDateLabel(attempt.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.withdrawalStatus,
                      attempt.status === "succeeded"
                        ? styles.creditAmount
                        : attempt.status === "failed"
                          ? styles.rejectedAmount
                          : styles.debitAmount,
                    ]}
                  >
                    {attempt.status.replace("_", " ").toUpperCase()}
                  </Text>
                  {attempt.status === "requires_action" ? (
                    <TouchableOpacity
                      onPress={() => handleConfirmPaymentAttempt(attempt.id)}
                      disabled={confirmingPaymentId === attempt.id || demoMode}
                    >
                      <Text style={styles.linkText}>
                        {confirmingPaymentId === attempt.id
                          ? "Confirming..."
                          : "Complete"}
                      </Text>
                    </TouchableOpacity>
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
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  noticeCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(127,29,29,0.35)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
    marginBottom: 18,
  },
  noticeTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: "Figtree",
  },
  noticeText: {
    color: "#E2E8F0",
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: "Figtree",
  },
  balanceGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  balanceCard: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    backgroundColor: "rgba(17, 24, 39, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  balanceLabel: {
    color: "#9CA3AF",
    marginTop: 12,
    fontSize: 13,
    fontFamily: "Figtree",
  },
  balanceValue: {
    color: "#fff",
    marginTop: 6,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  section: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(17, 24, 39, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Figtree",
    marginBottom: 12,
  },
  helperText: {
    color: "#9CA3AF",
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: "Figtree",
  },
  connectStatusCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  connectStatusTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: "Figtree",
  },
  connectStatusText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: "Figtree",
  },
  packageRow: {
    flexDirection: "row",
    gap: 10,
  },
  packageCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  packageCoins: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  packagePrice: {
    color: "#FFCC66",
    fontSize: 13,
    marginTop: 8,
    fontFamily: "Figtree",
  },
  giftsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  giftCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  giftName: {
    color: "#D1D5DB",
    marginTop: 8,
    fontSize: 13,
    fontFamily: "Figtree",
  },
  giftValue: {
    color: "#fff",
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#111827",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    fontFamily: "Figtree",
  },
  payoutPreview: {
    color: "#CBD5E1",
    fontSize: 13,
    marginBottom: 12,
    fontFamily: "Figtree",
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  transactionCopy: {
    flex: 1,
    paddingRight: 12,
  },
  transactionTitle: {
    color: "#F3F4F6",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  transactionDate: {
    color: "#6B7280",
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Figtree",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  creditAmount: {
    color: "#10B981",
  },
  debitAmount: {
    color: "#F59E0B",
  },
  linkText: {
    color: "#74A9D9",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  withdrawalStatus: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  rejectedAmount: {
    color: "#EF4444",
  },
});
