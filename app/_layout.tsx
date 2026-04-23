import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { registerForPushNotificationsAsync } from "@/Notification";
import { shouldInitializeMobileAds } from "@/lib/ads/config";
import { initializeMobileAds } from "@/lib/ads/native";
import { ClerkProvider } from "@clerk/clerk-expo";
import { clerkPublishableKey, isClerkConfigured } from "@/lib/auth/clerkConfig";
import { clerkTokenCache } from "@/lib/auth/clerkTokenCache";

import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";

import { ActivityIndicator, View, Platform } from "react-native";
import "react-native-reanimated";
import { RegistrationProvider } from "@/context/RegistrationContext";
import { ErrorProvider } from "@/context/ErrorContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { MessageProvider } from "@/context/MessageContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/context/LanguageContext";
import { useFonts } from "@expo-google-fonts/figtree/useFonts";
import { Figtree_300Light } from "@expo-google-fonts/figtree/300Light";
import { Figtree_400Regular } from "@expo-google-fonts/figtree/400Regular";
import { Figtree_500Medium } from "@expo-google-fonts/figtree/500Medium";
import { Figtree_600SemiBold } from "@expo-google-fonts/figtree/600SemiBold";
import { Figtree_700Bold } from "@expo-google-fonts/figtree/700Bold";
import { Figtree_800ExtraBold } from "@expo-google-fonts/figtree/800ExtraBold";
import { Figtree_900Black } from "@expo-google-fonts/figtree/900Black";
import { Figtree_300Light_Italic } from "@expo-google-fonts/figtree/300Light_Italic";
import { Figtree_400Regular_Italic } from "@expo-google-fonts/figtree/400Regular_Italic";
import { Figtree_500Medium_Italic } from "@expo-google-fonts/figtree/500Medium_Italic";
import { Figtree_600SemiBold_Italic } from "@expo-google-fonts/figtree/600SemiBold_Italic";
import { Figtree_700Bold_Italic } from "@expo-google-fonts/figtree/700Bold_Italic";
import { Figtree_800ExtraBold_Italic } from "@expo-google-fonts/figtree/800ExtraBold_Italic";
import { Figtree_900Black_Italic } from "@expo-google-fonts/figtree/900Black_Italic";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { useSocketInitialization } from "@/hooks/useSocketInitialization";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { AppErrorBoundary } from "@/components/error/AppErrorBoundary";
import { captureException } from "@/utils/errorReporting";

// Import css for global styles
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().then(() => {
  //Ignore
});

// Authentication state provider component
function RootLayoutNavigation() {
  const router = useRouter();
  const segments = useSegments(); // This gives us the current route segments
  const segmentList = segments as string[];
  const rootSegment = segmentList[0];
  const childSegment = segmentList[1];
  const {
    isAuthenticated,
    hasCompletedOnboarding,
    loading,
    isInSignupFlow,
    user,
  } = useAuth();

  // 🔍 DEBUG: Auth state logging
  useEffect(() => {
    console.log('[LAYOUT DEBUG] Auth state changed:', {
      isAuthenticated,
      hasCompletedOnboarding: hasCompletedOnboarding,
      loading,
      isInSignupFlow,
      userId: user?.id,
      currentRoot: rootSegment,
      currentChild: childSegment,
    });
  }, [isAuthenticated, hasCompletedOnboarding, loading, isInSignupFlow, user?.id, rootSegment, childSegment]);

  useApiErrorHandler();
  // Initialize socket connection
  useSocketInitialization();

  useEffect(() => {
    if (loading) return;

    // ✅ protect verify route
    const isVerifyRoute =
      rootSegment === "account-setup" && childSegment === "verify";

    if (isVerifyRoute) {
      return;
    }

    const inAuthFlow = rootSegment === "(auth)";
    const inOnboardingFlow = rootSegment === "onboarding";
    const inAccountSetupFlow = rootSegment === "account-setup";
    const inPasswordResetFlow = rootSegment === "password-reset";
    const inTabsFlow = rootSegment === "(tabs)";
    const inPublicGuestTab =
      inTabsFlow && (childSegment === "explore" || childSegment === "nearby");
    const inPostFlow = rootSegment === "post";
    const inLiveFlow = rootSegment === "live";
    const inAdminFlow = rootSegment === "admin";
    const inSupportedFlows = inTabsFlow || inPostFlow || inLiveFlow || inAdminFlow;

    console.log("[Layout] Navigation check - RULES:", {
      isAuthenticated,
      hasCompletedOnboarding,
      isInSignupFlow,
      currentSegment: rootSegment,
      inAuthFlow,
      inOnboardingFlow,
      inAccountSetupFlow,
      inPasswordResetFlow,
      inSupportedFlows,
      redirectTarget: 'none',
    });

    // RULE 0
    if (isInSignupFlow && !inAccountSetupFlow && !inAuthFlow) {
      router.replace("/account-setup/birthday");
      return;
    }

    // RULE 1
    if (inAccountSetupFlow) return;

    // RULE 2
    if (!hasCompletedOnboarding) {
      if (!inOnboardingFlow) router.replace("/onboarding");
      return;
    }

    // RULE 3
    if (!isAuthenticated) {
      if (inAuthFlow) return;
      if (inPasswordResetFlow) return;
      if (inPublicGuestTab) return;
      if (!inOnboardingFlow && !inAccountSetupFlow && !inPasswordResetFlow) {
        router.replace("/get-started");
        return;
      }
    }

    // RULE 4
    if (isAuthenticated && inAuthFlow && !isInSignupFlow) {
      console.log('[LAYOUT DEBUG] RULE 4 TRIGGERED: auth → tabs');
      router.replace("/");
      return;
    }

    // RULE 5
    if (
      isAuthenticated &&
      hasCompletedOnboarding &&
      !inSupportedFlows &&
      !isInSignupFlow
    ) {
      console.log('[LAYOUT DEBUG] RULE 5 TRIGGERED: unsupported → tabs');
      router.replace("/");
      return;
    }

    // RULE 6
    if (
      isAuthenticated &&
      hasCompletedOnboarding &&
      !isInSignupFlow &&
      user &&
      !user.verified
    ) {
      // ❗️Only block sensitive flows, NOT tabs
      if (rootSegment === "live") {
        router.navigate("/account-setup/verify");
        return;
      }
    }
  }, [
    loading,
    isAuthenticated,
    hasCompletedOnboarding,
    isInSignupFlow,
    router,
    rootSegment,
    childSegment,
    user,
  ]);

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a2e",
        }}
      >
        <ActivityIndicator size="large" color="#FF5A5F" />
      </View>
    );
  }

  // Important: Always render a Slot first before any navigation happens
  return (
    <AppErrorBoundary>
      <View style={{ flex: 1 }}>
        <DemoBanner />
        <Slot />
      </View>
    </AppErrorBoundary>
  );
}

// Root layout wrapper
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    Figtree_300Light,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Figtree_900Black,
    Figtree_300Light_Italic,
    Figtree_400Regular_Italic,
    Figtree_500Medium_Italic,
    Figtree_600SemiBold_Italic,
    Figtree_700Bold_Italic,
    Figtree_800ExtraBold_Italic,
    Figtree_900Black_Italic,
  });

  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const globalErrorHandlerSet = useRef(false);
  const splashHiddenRef = useRef(false);

useEffect(() => {
  if (Platform.OS === "web" || Constants.appOwnership === "expo") {
    return;
  }

  //  Get FCM token
  registerForPushNotificationsAsync()
    .then((t) => {
      if (t) setToken(t);
    })
    .catch((error) => {
      console.warn("[Notification] FCM registration failed (non-blocking):", error);
    });

  try {
    //  Listen for incoming notifications (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener(
        (notification: Notifications.Notification) => {
          console.log("📩 Notification Received:", notification);
        }
      );

    //  Listen for user tapping on notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          console.log("👆 Notification Response:", response);
        }
      );
  } catch (error) {
    console.warn("[Notification] Listener setup failed (non-blocking):", error);
  }

  return () => {
    // ✅ FIXED CLEANUP
    try {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    } catch (error) {
      console.warn("[Notification] Cleanup error:", error);
    }
  };
}, []);

  useEffect(() => {
    if (globalErrorHandlerSet.current) {
      return;
    }

    globalErrorHandlerSet.current = true;
    const errorUtils = (global as any)?.ErrorUtils;
    if (!errorUtils?.setGlobalHandler) {
      return;
    }

    const defaultHandler = errorUtils.getGlobalHandler
      ? errorUtils.getGlobalHandler()
      : null;

    errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      captureException(error, {
        tags: { scope: "global-handler" },
        extra: { isFatal: Boolean(isFatal) },
      });

      if (defaultHandler) {
        defaultHandler(error, isFatal);
      }
    });
  }, []);

  useEffect(() => {
    if (!shouldInitializeMobileAds() || Constants.appOwnership === "expo") {
      return;
    }

    initializeMobileAds()
      .catch((error: unknown) => {
        console.warn("[Ads] Mobile Ads initialization failed (non-blocking):", error);
        // Ads failure should not crash the app
      });
  }, []);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIsBootstrapped(true);
    }, 3000);

    if (loaded || error) {
      setIsBootstrapped(true);
    }

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [loaded, error]);

  useEffect(() => {
    if (!isBootstrapped || splashHiddenRef.current) {
      return;
    }

    splashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {
      // Ignore any errors here, just ensure splash screen is hidden
    });
  }, [isBootstrapped]);

  if (!isBootstrapped) {
    return null;
  }

  const appTree = (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <ErrorProvider>
          <RegistrationProvider>
            <LanguageProvider>
              <AuthProvider>
                <AuthModalProvider>
                  <SocketProvider>
                    <MessageProvider>
                      <NotificationProvider>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                          {/* Configure StatusBar properly for both platforms */}
                          <StatusBar
                            style="light"
                            backgroundColor="#1a1a2e"
                            translucent={Platform.OS === "android"}
                          />
                          {/* Remove nested SafeAreaView - let individual screens handle it */}
                          <RootLayoutNavigation />
                        </GestureHandlerRootView>
                      </NotificationProvider>
                    </MessageProvider>
                  </SocketProvider>
                </AuthModalProvider>
              </AuthProvider>
            </LanguageProvider>
          </RegistrationProvider>
        </ErrorProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );

  try {
    // Wrap Clerk initialization in try-catch to prevent app crash if Clerk is misconfigured
    if (!isClerkConfigured()) {
      console.warn("[Clerk] Clerk not properly configured, skipping ClerkProvider");
      return appTree;
    }

    return (
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={clerkTokenCache}>
        {appTree}
      </ClerkProvider>
    );
  } catch (error) {
    console.error("[Clerk] Failed to initialize Clerk provider:", error);
    // Return app tree without Clerk if initialization fails
    return appTree;
  }
}
