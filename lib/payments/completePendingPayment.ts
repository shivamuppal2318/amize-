import { Platform } from "react-native";

import {
  ConfigAPI,
  PaymentProviderConfig,
} from "@/lib/api/configService";
import { PaymentAPI, PaymentAttempt } from "@/lib/api/paymentService";

const requireNativeModule = (moduleName: string) => {
  const dynamicRequire = eval("require") as NodeRequire;
  return dynamicRequire(moduleName);
};

const STRIPE_URL_SCHEME = "com.kentom.amize";
const STRIPE_RETURN_URL = `${STRIPE_URL_SCHEME}://stripe-redirect`;
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 8;

let initializedStripePublishableKey: string | null = null;

const getStripeModule = () => {
  if (Platform.OS === "web") {
    return null;
  }

  return requireNativeModule("@stripe/stripe-react-native") as {
    handleNextAction: (
      clientSecret: string,
      returnUrl: string
    ) => Promise<
      | { error?: { message?: string | null } }
      | Record<string, unknown>
    >;
    initStripe: (options: {
      publishableKey: string;
      urlScheme: string;
      setReturnUrlSchemeOnAndroid: boolean;
    }) => Promise<void>;
  };
};

const sleep = (durationMs: number) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

const ensureStripeInitialized = async (config: PaymentProviderConfig) => {
  if (!config.publishableKey) {
    throw new Error("Stripe publishable key is missing.");
  }

  const stripeModule = getStripeModule();

  if (!stripeModule) {
    throw new Error("Stripe native SDK is not available on web.");
  }

  if (initializedStripePublishableKey === config.publishableKey) {
    return;
  }

  await stripeModule.initStripe({
    publishableKey: config.publishableKey,
    urlScheme: STRIPE_URL_SCHEME,
    setReturnUrlSchemeOnAndroid: true,
  });

  initializedStripePublishableKey = config.publishableKey;
};

const pollPaymentAttempt = async (paymentAttemptId: string) => {
  let latestAttempt: PaymentAttempt | null = null;

  for (let index = 0; index < POLL_MAX_ATTEMPTS; index += 1) {
    latestAttempt = await PaymentAPI.getAttempt(paymentAttemptId);

    if (!latestAttempt || latestAttempt.status !== "requires_action") {
      return latestAttempt;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return latestAttempt;
};

export type CompletePendingPaymentInput = {
  paymentAttemptId: string;
  clientSecret?: string | null;
  paymentConfig?: PaymentProviderConfig;
};

export type CompletePendingPaymentResult = {
  success: boolean;
  message: string;
  paymentConfig: PaymentProviderConfig;
  attempt?: PaymentAttempt | null;
  confirmationMode: "manual" | "stripe_next_action";
};

export const completePendingPayment = async ({
  paymentAttemptId,
  clientSecret,
  paymentConfig,
}: CompletePendingPaymentInput): Promise<CompletePendingPaymentResult> => {
  const resolvedConfig =
    paymentConfig || (await ConfigAPI.getPaymentProviderConfig());

  if (
    resolvedConfig.provider === "stripe" &&
    resolvedConfig.requiresClientSecret &&
    resolvedConfig.publishableKey
  ) {
    if (Platform.OS === "web") {
      return {
        success: false,
        message:
          "Stripe payment confirmation is only available in the native app preview.",
        paymentConfig: resolvedConfig,
        confirmationMode: "stripe_next_action",
      };
    }

    if (!clientSecret) {
      return {
        success: false,
        message: "This Stripe payment is missing a client secret.",
        paymentConfig: resolvedConfig,
        confirmationMode: "stripe_next_action",
      };
    }

    await ensureStripeInitialized(resolvedConfig);
    const stripeModule = getStripeModule();

    if (!stripeModule) {
      return {
        success: false,
        message:
          "Stripe payment confirmation is only available in the native app preview.",
        paymentConfig: resolvedConfig,
        confirmationMode: "stripe_next_action",
      };
    }

    const nextActionResult = await stripeModule.handleNextAction(
      clientSecret,
      STRIPE_RETURN_URL
    );

    if (
      "error" in nextActionResult &&
      nextActionResult.error &&
      typeof nextActionResult.error === "object"
    ) {
      const stripeError = nextActionResult.error as { message?: string | null };

      return {
        success: false,
        message:
          stripeError.message || "Payment verification could not be completed.",
        paymentConfig: resolvedConfig,
        confirmationMode: "stripe_next_action",
      };
    }

    const attempt = await pollPaymentAttempt(paymentAttemptId);

    if (attempt?.status === "succeeded") {
      return {
        success: true,
        message: "Payment verification completed successfully.",
        paymentConfig: resolvedConfig,
        attempt,
        confirmationMode: "stripe_next_action",
      };
    }

    if (attempt?.status === "failed") {
      return {
        success: false,
        message: "Payment verification failed.",
        paymentConfig: resolvedConfig,
        attempt,
        confirmationMode: "stripe_next_action",
      };
    }

    return {
      success: false,
      message:
        "Payment verification was completed on-device, but the backend has not confirmed it yet.",
      paymentConfig: resolvedConfig,
      attempt,
      confirmationMode: "stripe_next_action",
    };
  }

  if (resolvedConfig.supportsManualConfirmation) {
    const response = await PaymentAPI.confirmAttempt(paymentAttemptId);
    const attempt = await PaymentAPI.getAttempt(paymentAttemptId);

    return {
      success: !!response.success,
      message:
        response.message ||
        (response.success
          ? "The pending payment was confirmed."
          : "The pending payment could not be confirmed."),
      paymentConfig: resolvedConfig,
      attempt,
      confirmationMode: "manual",
    };
  }

  return {
    success: false,
    message: `${resolvedConfig.displayName} confirmation is not configured for this client flow.`,
    paymentConfig: resolvedConfig,
    confirmationMode: "manual",
  };
};
