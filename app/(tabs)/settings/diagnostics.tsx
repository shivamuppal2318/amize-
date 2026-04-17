import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { makeRedirectUri } from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";

import { releaseConfig } from "@/lib/release/releaseConfig";
import {
  authProviderConfig,
  isAnyGoogleProviderConfigured,
  isFacebookConfigured,
  isGoogleConfiguredForCurrentPlatform,
  isNonPlaceholderValue,
} from "@/lib/auth/providerConfig";
import { AD_CONFIG, isAdMobProductionReady } from "@/lib/ads/config";
import { canUseLocalDemoAuth } from "@/lib/auth/localDemoAuth";

const APP_SCHEME = Constants.expoConfig?.scheme || "com.kentom.amize";
const getNativeRedirectUri = (provider: string) =>
  `${APP_SCHEME}:/oauth2redirect/${provider}`;

const maskValue = (value: string, opts?: { head?: number; tail?: number }) => {
  const head = opts?.head ?? 6;
  const tail = opts?.tail ?? 4;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= head + tail + 3) return trimmed;
  return `${trimmed.slice(0, head)}…${trimmed.slice(-tail)}`;
};

const keyStatus = (value?: string) => {
  if (!value || !value.trim()) return "missing";
  return isNonPlaceholderValue(value) ? "configured" : "placeholder";
};

export default function DiagnosticsScreen() {
  const webRedirectUri = useMemo(() => makeRedirectUri(), []);
  const nativeGoogleRedirectUri = useMemo(
    () => makeRedirectUri({ native: getNativeRedirectUri("google") }),
    []
  );

  const stripePublishablePresent = Boolean(
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  );

  return (
    <LinearGradient
      colors={["#1E4A72", "#000000"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Diagnostics</Text>
        <Text style={styles.subtitle}>
          Use this screen to verify runtime config for Google Auth, Stripe, and
          AdMob (and see what demo mode disables).
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Build Flags</Text>
          <Row label="Demo mode" value={releaseConfig.demoMode ? "ON" : "OFF"} />
          <Row
            label="Local test credentials"
            value={canUseLocalDemoAuth() ? "ON" : "OFF"}
          />
          <Row
            label="Live streaming"
            value={releaseConfig.enableLiveStreaming ? "ON" : "OFF"}
          />
          <Row
            label="AdMob enabled"
            value={AD_CONFIG.enabled ? "ON" : "OFF"}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Google Auth</Text>
          <Row
            label="Any provider configured"
            value={isAnyGoogleProviderConfigured ? "YES" : "NO"}
          />
          <Row
            label="Current platform configured"
            value={isGoogleConfiguredForCurrentPlatform() ? "YES" : "NO"}
          />
          <Row
            label="Web client ID"
            value={`${keyStatus(authProviderConfig.googleWebClientId)} (${maskValue(
              authProviderConfig.googleWebClientId
            )})`}
          />
          <Row
            label="Android client ID"
            value={`${keyStatus(
              authProviderConfig.googleAndroidClientId
            )} (${maskValue(authProviderConfig.googleAndroidClientId)})`}
          />
          <Row
            label="iOS client ID"
            value={`${keyStatus(authProviderConfig.googleIosClientId)} (${maskValue(
              authProviderConfig.googleIosClientId
            )})`}
          />
          <Row label="Web redirect URI" value={webRedirectUri} mono />
          <Row label="Native redirect URI" value={nativeGoogleRedirectUri} mono />
          <Text style={styles.help}>
            Google Console must include the exact redirect URI above. For web
            dev on localhost, also add your dev origin (e.g.{" "}
            <Text style={styles.mono}>http://localhost:8081</Text>) to Authorized
            JavaScript origins.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Facebook Auth</Text>
          <Row label="Configured" value={isFacebookConfigured ? "YES" : "NO"} />
          <Row
            label="App ID"
            value={`${keyStatus(authProviderConfig.facebookAppId)} (${maskValue(
              authProviderConfig.facebookAppId,
              { head: 4, tail: 2 }
            )})`}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stripe</Text>
          <Row
            label="Publishable key present"
            value={stripePublishablePresent ? "YES" : "NO"}
          />
          <Text style={styles.help}>
            Secret keys must stay on the backend only. If publishable key is
            missing, set it in your local env (or build env) and restart.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>AdMob</Text>
          <Row label="Production ready" value={isAdMobProductionReady() ? "YES" : "NO"} />
          <Row
            label="Android App ID"
            value={maskValue(releaseConfig.admobAndroidAppId) || "(missing)"}
            mono
          />
          <Row
            label="iOS App ID"
            value={maskValue(releaseConfig.admobIosAppId) || "(missing)"}
            mono
          />
          <Row
            label="Explore banner unit"
            value={AD_CONFIG.placements.exploreBanner || "(missing)"}
            mono
          />
          <Row
            label="Nearby banner unit"
            value={AD_CONFIG.placements.nearbyBanner || "(missing)"}
            mono
          />
          <Text style={styles.help}>
            AdMob only loads real ads when App IDs and all placements are set and
            not using Google test IDs. Web always shows placeholders.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Figtree",
  },
  subtitle: {
    color: "#CBD5E1",
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Figtree",
  },
  card: {
    marginTop: 18,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(12, 18, 32, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    fontFamily: "Figtree",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.12)",
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Figtree",
  },
  rowValue: {
    flex: 1.2,
    color: "#E2E8F0",
    fontSize: 12,
    fontFamily: "Figtree",
    textAlign: "right",
  },
  help: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    fontFamily: "Figtree",
  },
  mono: {
    fontFamily: "Courier New",
  },
});
