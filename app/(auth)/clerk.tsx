import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth as useClerkAuth, useSSO } from "@clerk/clerk-expo";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";

import { useAuth } from "@/hooks/useAuth";
import { isClerkConfigured } from "@/lib/auth/clerkConfig";

// @ts-ignore
import GoogleIcon from "@/assets/images/figma/google.png";
// @ts-ignore
import FacebookIcon from "@/assets/images/figma/facebook.png";
// @ts-ignore
import AppleIcon from "@/assets/images/figma/apple.png";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ICON = GoogleIcon;
const FACEBOOK_ICON = FacebookIcon;
const APPLE_ICON = AppleIcon;

type ClerkStrategy = "oauth_google" | "oauth_facebook" | "oauth_x" | "oauth_apple";

const PROVIDERS: Array<{
  strategy: ClerkStrategy;
  title: string;
  subtitle: string;
  iconType: "image" | "text";
  iconSource?: any;
  iconLabel?: string;
}> = [
  {
    strategy: "oauth_google",
    title: "Continue with Google",
    subtitle: "Use your Google account through Clerk",
    iconType: "image",
    iconSource: GOOGLE_ICON,
  },
  {
    strategy: "oauth_facebook",
    title: "Continue with Facebook",
    subtitle: "Use your Facebook account through Clerk",
    iconType: "image",
    iconSource: FACEBOOK_ICON,
  },
  {
    strategy: "oauth_x",
    title: "Continue with X",
    subtitle: "Use your X account through Clerk",
    iconType: "text",
    iconLabel: "X",
  },
  {
    strategy: "oauth_apple",
    title: "Continue with Apple",
    subtitle: "Use your Apple account through Clerk",
    iconType: "image",
    iconSource: APPLE_ICON,
  },
];

export default function ClerkAuthScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useClerkAuth();
  const { startSSOFlow } = useSSO();
  const appAuth = useAuth();
  const [exchanging, setExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [ssoLoadingStrategy, setSsoLoadingStrategy] = useState<ClerkStrategy | null>(null);
  const hasAutoExchangedRef = useRef(false);

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

  useEffect(() => {
    if (!isLoaded || !isSignedIn || exchanging) {
      return;
    }

    if (hasAutoExchangedRef.current) {
      return;
    }

    hasAutoExchangedRef.current = true;
    exchangeToken().catch((error) => {
      console.error("[ClerkAuth] auto exchangeToken error:", error);
      hasAutoExchangedRef.current = false;
    });
  }, [isLoaded, isSignedIn, exchanging]);

  useEffect(() => {
    if (appAuth.loading || !appAuth.isAuthenticated) {
      return;
    }

    console.log("[ClerkAuth] app auth is ready, routing to feed");
    router.replace("/(tabs)/index");
  }, [
    appAuth.isAuthenticated,
    appAuth.loading,
    router,
  ]);

  const startProviderSSO = async (strategy: ClerkStrategy) => {
    if (ssoLoadingStrategy) return;
    setExchangeError(null);
    setSsoLoadingStrategy(strategy);
    console.log("[ClerkAuth] startProviderSSO called:", strategy);
    try {
      const redirectUrl =
        Platform.OS === "web"
          ? makeRedirectUri()
          : makeRedirectUri({
              scheme: APP_SCHEME,
              path: "oauth-callback",
            });

      const result = await startSSOFlow({
        strategy,
        redirectUrl,
      });

      console.log("[ClerkAuth] startSSOFlow result:", result);

      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        await exchangeToken();
      } else if (result.authSessionResult?.type === "dismiss") {
        console.log("[ClerkAuth] startProviderSSO dismissed by user:", strategy);
      } else {
        console.log("[ClerkAuth] startProviderSSO incomplete result", result);
        setExchangeError("Social sign-in did not complete. Please try again.");
      }
    } catch (e: any) {
      console.error("[ClerkAuth] startProviderSSO error:", e);
      setExchangeError(e?.message || "Social sign-in failed. Please try again.");
    } finally {
      setSsoLoadingStrategy(null);
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
        hasAutoExchangedRef.current = false;
        setExchangeError(result.message || "Login failed. Please try again.");
        return;
      }
    } catch (e: any) {
      console.error('[ClerkAuth] exchangeToken error:', e);
      hasAutoExchangedRef.current = false;
      setExchangeError(e?.message || "Login failed. Please try again.");
    } finally {
      setExchanging(false);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0B1220" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color="#FF5A5F" />
        </View>
      </SafeAreaView>
    );
  }

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

        {!isSignedIn ? (
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
              Choose a social provider, complete sign-in with Clerk, then exchange the Clerk session for your backend JWT so feed, posting, and messaging keep working.
            </Text>

            <View style={{ width: "100%", maxWidth: 420, gap: 12 }}>
              {PROVIDERS.map((provider) => {
                const isLoading = ssoLoadingStrategy === provider.strategy;
                return (
                  <TouchableOpacity
                    key={provider.strategy}
                    onPress={() => startProviderSSO(provider.strategy)}
                    disabled={Boolean(ssoLoadingStrategy)}
                    style={{
                      width: "100%",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 14,
                      backgroundColor: isLoading ? "rgba(30, 74, 114, 0.5)" : "#1E4A72",
                      alignItems: "center",
                      flexDirection: "row",
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor:
                          provider.iconType === "text" ? "rgba(11, 18, 32, 0.35)" : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      {provider.iconType === "image" ? (
                        <Image
                          source={provider.iconSource}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
                          {provider.iconLabel}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                        {isLoading ? "Opening…" : provider.title}
                      </Text>
                      <Text style={{ color: "#BFDBFE", fontSize: 12, marginTop: 2 }}>
                        {provider.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {ssoLoadingStrategy ? (
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
        ) : (
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
        )}
      </View>
    </SafeAreaView>
  );
}
