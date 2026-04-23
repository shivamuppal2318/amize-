import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SignedIn, SignedOut, useAuth as useClerkAuth, useSSO } from "@clerk/clerk-expo";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";

import { useAuth } from "@/hooks/useAuth";
import { isClerkConfigured } from "@/lib/auth/clerkConfig";

WebBrowser.maybeCompleteAuthSession();

export default function ClerkAuthScreen() {
  const router = useRouter();
  const { getToken } = useClerkAuth();
  const { startSSOFlow } = useSSO();
  const appAuth = useAuth();
  const [exchanging, setExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = useState(false);

  const clerkReady = useMemo(() => isClerkConfigured(), []);

  const APP_SCHEME =
    (Array.isArray(Constants.expoConfig?.scheme)
      ? Constants.expoConfig?.scheme[0]
      : Constants.expoConfig?.scheme) || "com.kentom.amize";

  useEffect(() => {
    if (!clerkReady) {
      setExchangeError(
        "Clerk is not configured. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY and rebuild the app."
      );
    }
  }, [clerkReady]);

  const startGoogleSSO = async () => {
    if (ssoLoading) return;
    setExchangeError(null);
    setSsoLoading(true);
    console.log('[ClerkAuth] startGoogleSSO called');
    try {
      // Must match Clerk Dashboard "Allowed Redirect URIs" for APK deep linking.
      const redirectUrl =
        Platform.OS === "web"
          ? makeRedirectUri()
          : makeRedirectUri({
              scheme: APP_SCHEME,
              path: "oauth-callback",
            });

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      console.log('[ClerkAuth] startSSOFlow result:', result);

      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        // After the session is active, exchange Clerk token for backend JWT.
        await exchangeToken();
      } else if (result.authSessionResult?.type === "dismiss") {
        console.log('[ClerkAuth] startGoogleSSO dismissed by user');
      } else {
        console.log('[ClerkAuth] startGoogleSSO incomplete result', result);
        setExchangeError("Google sign-in did not complete. Please try again.");
      }
    } catch (e: any) {
      console.error('[ClerkAuth] startGoogleSSO error:', e);
      setExchangeError(e?.message || "Google sign-in failed. Please try again.");
    } finally {
      setSsoLoading(false);
    }
  };

  const exchangeToken = async () => {
    if (exchanging) return;
    setExchangeError(null);
    setExchanging(true);
    console.log('[ClerkAuth] exchangeToken called');
    try {
      const token = await getToken();
      console.log('[ClerkAuth] getToken result:', token ? `token length ${token.length}` : token);
      if (!token) {
        setExchangeError("Failed to obtain Clerk token. Please try again.");
        return;
      }

      const result = await appAuth.loginWithClerk(token);
      console.log('[ClerkAuth] loginWithClerk returned:', result);
      if (!result.success) {
        setExchangeError(result.message || "Login failed. Please try again.");
        return;
      }

      console.log('[ClerkAuth] loginWithClerk succeeded, navigating to tabs VIDEO FEED');
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error('[ClerkAuth] exchangeToken error:', e);
      setExchangeError(e?.message || "Login failed. Please try again.");
    } finally {
      setExchanging(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8 }}>
          <Text style={{ color: "white", fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16, justifyContent: "center" }}>
        {exchangeError ? (
          <Text style={{ color: "#FCA5A5", marginBottom: 12, textAlign: "center" }}>
            {exchangeError}
          </Text>
        ) : null}

        <SignedOut>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Continue with Clerk
            </Text>

            <Text
              style={{
                color: "#94A3B8",
                marginBottom: 18,
                fontSize: 13,
                textAlign: "center",
                maxWidth: 440,
              }}
            >
              This uses Clerk to complete Google sign-in, then exchanges the Clerk session for your backend JWT so posting, feed, and messaging keep working.
            </Text>

            <TouchableOpacity
              onPress={startGoogleSSO}
              disabled={ssoLoading}
              style={{
                width: "100%",
                maxWidth: 420,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: ssoLoading ? "rgba(30, 74, 114, 0.5)" : "#1E4A72",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                {ssoLoading ? "Opening Google…" : "Continue with Google"}
              </Text>
            </TouchableOpacity>

            {ssoLoading ? (
              <View style={{ marginTop: 14 }}>
                <ActivityIndicator color="#FF5A5F" />
              </View>
            ) : null}

            {Platform.OS === "web" ? (
              <Text style={{ color: "#94A3B8", marginTop: 10, fontSize: 12, textAlign: "center" }}>
                If you are testing on web, ensure the Clerk allowed origins include localhost.
              </Text>
            ) : null}
          </View>
        </SignedOut>

        <SignedIn>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "white", fontSize: 18, marginBottom: 14 }}>
              Completing sign-in…
            </Text>
            <TouchableOpacity
              onPress={exchangeToken}
              disabled={exchanging}
              style={{
                width: "100%",
                maxWidth: 420,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: exchanging ? "rgba(30, 74, 114, 0.5)" : "#1E4A72",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                {exchanging ? "Signing in…" : "Continue"}
              </Text>
            </TouchableOpacity>
            {exchanging ? (
              <View style={{ marginTop: 14 }}>
                <ActivityIndicator color="#FF5A5F" />
              </View>
            ) : null}
          </View>
        </SignedIn>
      </View>
    </SafeAreaView>
  );
}
