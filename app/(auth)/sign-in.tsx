import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Mail, Lock } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import {
  authProviderConfig,
  isFacebookConfigured,
  isGoogleConfiguredForCurrentPlatform,
} from "@/lib/auth/providerConfig";
import {
  canUseLocalDemoAuth,
  LOCAL_DEMO_ACCOUNTS,
} from "@/lib/auth/localDemoAuth";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import { useI18n } from "@/hooks/useI18n";
import { isDemoMode } from "@/lib/release/releaseConfig";

// Assets Imports
// @ts-ignore
import FacebookIcon from "@/assets/images/figma/facebook.png";

// @ts-ignore
import GoogleIcon from "@/assets/images/figma/google.png";
// @ts-ignore
import AppleIcon from "@/assets/images/figma/apple.png";
// @ts-ignore
import AmizeLogo from "@/assets/images/amize.png";

WebBrowser.maybeCompleteAuthSession();

const AMIZE_LOGO = AmizeLogo;
const GOOGLE_ICON = GoogleIcon;
const FACEBOOK_ICON = FacebookIcon;
const APPLE_ICON = AppleIcon;

const GOOGLE_WEB_CLIENT_ID = authProviderConfig.googleWebClientId;
const GOOGLE_ANDROID_CLIENT_ID = authProviderConfig.googleAndroidClientId;
const GOOGLE_IOS_CLIENT_ID = authProviderConfig.googleIosClientId;
const FACEBOOK_APP_ID = authProviderConfig.facebookAppId;
const APP_SCHEME = Constants.expoConfig?.scheme || "com.kentom.amize";

const getNativeRedirectUri = (provider: string) =>
  `${APP_SCHEME}:/oauth2redirect/${provider}`;

export default function SignInScreen() {
  const { t } = useI18n();
  const { autoProvider, prefillEmail, prefillPassword, autoSubmit } =
    useLocalSearchParams<{
      autoProvider?: string;
      prefillEmail?: string;
      prefillPassword?: string;
      autoSubmit?: string;
    }>();
  const { login, loginWithGoogle, loginWithFacebook, loginWithApple, loading } =
    useAuth();
  const localDemoEnabled = canUseLocalDemoAuth();
  const demoMode = isDemoMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [hasTriggeredAutoProvider, setHasTriggeredAutoProvider] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const isEmailIdentifier = /\S+@\S+\.\S+/.test(email.trim());
  const normalizedIdentifier = isEmailIdentifier
    ? email.trim().toLowerCase()
    : email.trim().replace(/[^\d+]/g, "");

  // -----------------------------
  // GOOGLE AUTH HOOK
  // -----------------------------
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    redirectUri:
      Platform.OS === "web"
        ? makeRedirectUri()
        : makeRedirectUri({
            native: getNativeRedirectUri("google"),
          }),
  });

  const [facebookAuthState, setFacebookAuthState] = useState<{
    request: any | null;
    response: any | null;
    promptAsync: (() => Promise<void>) | null;
  }>({ request: null, response: null, promptAsync: null });

  const FacebookAuthBridge = () => {
    const [request, response, promptAsync] = Facebook.useAuthRequest({
      clientId: FACEBOOK_APP_ID,
      androidClientId: FACEBOOK_APP_ID,
      responseType: "token",
      redirectUri:
        Platform.OS === "web"
          ? makeRedirectUri()
          : makeRedirectUri({
              native: getNativeRedirectUri("facebook"),
            }),
    });

    useEffect(() => {
      setFacebookAuthState({
        request,
        response,
        promptAsync: async () => {
          await promptAsync();
        },
      });
    }, [request, response, promptAsync]);

    return null;
  };

  const showFacebookButton =
    Boolean(facebookAuthState.request) && isFacebookConfigured;
  const showGoogleButton =
    Boolean(request) && isGoogleConfiguredForCurrentPlatform();
  const showAppleButton = appleAvailable;
  const showSocialButtons =
    !demoMode && (showFacebookButton || showGoogleButton || showAppleButton);

  // Render Facebook auth hook only when configured to avoid crash on Android
  const facebookAuthView = isFacebookConfigured ? <FacebookAuthBridge /> : null;

  useEffect(() => {
    if (response?.type === "success" && response.params.id_token) {
      handleGoogleFirebaseLogin(response.params.id_token);
    }
  }, [response]);

  useEffect(() => {
    if (facebookAuthState.response?.type !== "success") {
      return;
    }

    const accessToken =
      facebookAuthState.response.authentication?.accessToken ||
      facebookAuthState.response.params?.access_token;

    if (accessToken) {
      handleFacebookBackendLogin(accessToken);
    }
  }, [facebookAuthState.response]);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  useEffect(() => {
    if (
      (autoProvider === "google" ||
        autoProvider === "facebook" ||
        autoProvider === "apple") &&
      !hasTriggeredAutoProvider
    ) {
      setHasTriggeredAutoProvider(true);

      if (autoProvider === "google") {
        if (!isGoogleConfiguredForCurrentPlatform()) {
          Alert.alert(
            "Google Login",
            "Google login is not configured for this platform in this build yet."
          );
          return;
        }

        if (request) {
          promptAsync();
        }
      }

      if (autoProvider === "facebook") {
        if (!isFacebookConfigured) {
          Alert.alert(
            "Facebook Login",
            "Facebook login is not configured for this build yet."
          );
          return;
        }

        facebookAuthState.promptAsync?.();
      }

      if (autoProvider === "apple") {
        handleAppleSignIn();
      }
    }
  }, [
    autoProvider,
    facebookAuthState.request,
    hasTriggeredAutoProvider,
    appleAvailable,
    promptAsync,
    request,
    facebookAuthState.promptAsync,
  ]);

  useEffect(() => {
    if (!prefillEmail && !prefillPassword) {
      return;
    }

    setEmail(typeof prefillEmail === "string" ? prefillEmail : "");
    setPassword(typeof prefillPassword === "string" ? prefillPassword : "");
  }, [prefillEmail, prefillPassword]);

  useEffect(() => {
    if (!localDemoEnabled) {
      return;
    }

    if (email || password) {
      return;
    }

    const primaryDemo = LOCAL_DEMO_ACCOUNTS[0];
    if (!primaryDemo) {
      return;
    }

    setEmail(primaryDemo.identifier);
    setPassword(primaryDemo.password);
  }, [localDemoEnabled, email, password]);

  useEffect(() => {
    if (
      autoSubmit !== "true" ||
      hasAutoSubmitted ||
      !prefillEmail ||
      !prefillPassword
    ) {
      return;
    }

    setHasAutoSubmitted(true);
    submitSignIn(
      typeof prefillEmail === "string" ? prefillEmail : "",
      typeof prefillPassword === "string" ? prefillPassword : ""
    );
  }, [autoSubmit, hasAutoSubmitted, prefillEmail, prefillPassword]);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setAuthError("");

    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setAuthError("");

    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors = { email: "", password: "" };
    const trimmedIdentifier = email.trim();

    if (!trimmedIdentifier) {
      nextErrors.email = "Email or phone number is required";
    } else {
      const normalizedPhone = trimmedIdentifier.replace(/[^\d+]/g, "");
      const isPhoneIdentifier = /^\+?\d{7,15}$/.test(normalizedPhone);
      if (!isEmailIdentifier && !isPhoneIdentifier) {
        nextErrors.email = "Enter a valid email address or phone number";
      }
    }

    if (!password) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleGoogleFirebaseLogin = async (idToken: string) => {
    try {
      setGoogleLoading(true);
      const result = await loginWithGoogle(idToken);

      if (!result.success) {
        Alert.alert("Login Failed", result.message || "Google sign-in failed");
        return;
      }

      router.replace("/(tabs)");
    } catch (e) {
      console.error("Google login failed:", e);
      Alert.alert("Login Failed", "Google authentication failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookBackendLogin = async (accessToken: string) => {
    try {
      setFacebookLoading(true);
      const result = await loginWithFacebook(accessToken);

      if (!result.success) {
        Alert.alert("Login Failed", result.message || "Facebook sign-in failed");
        return;
      }

      router.replace("/(tabs)");
    } catch (e) {
      console.error("Facebook login failed:", e);
      Alert.alert("Login Failed", "Facebook authentication failed");
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!appleAvailable) {
      Alert.alert(
        "Apple Login",
        "Apple login is only available on supported Apple devices for this build."
      );
      return;
    }

    try {
      setAppleLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert("Apple Login", "Apple did not return an identity token.");
        return;
      }

      const result = await loginWithApple({
        identityToken: credential.identityToken,
        userIdentifier: credential.user,
        email: credential.email || undefined,
        fullName:
          credential.fullName?.givenName || credential.fullName?.familyName
            ? `${credential.fullName?.givenName || ""} ${
                credential.fullName?.familyName || ""
              }`.trim()
            : undefined,
        firstName: credential.fullName?.givenName || undefined,
        lastName: credential.fullName?.familyName || undefined,
      });

      if (!result.success) {
        Alert.alert("Login Failed", result.message || "Apple sign-in failed");
        return;
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      if (error?.code === "ERR_REQUEST_CANCELED") {
        return;
      }

      console.error("Apple login failed:", error);
      Alert.alert("Login Failed", "Apple authentication failed");
    } finally {
      setAppleLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    await submitSignIn(normalizedIdentifier, password);
  };

  const submitSignIn = async (identifier: string, secret: string) => {
    try {
      const result = await login(identifier, secret);
      if (result.success) {
        router.replace("/(tabs)");
        return;
      }

      setAuthError(result.message || "Unable to sign in right now.");
    } catch (e) {
      setAuthError("Something went wrong while signing in.");
    }
  };

  const handleDemoSignIn = async (identifier: string, secret: string) => {
    setEmail(identifier);
    setPassword(secret);
    setAuthError("");
    await submitSignIn(identifier, secret);
  };

  const handleBack = () => {
    router.replace("/(auth)/get-started");
  };

  const handleForgotPassword = () => {
    router.push("/password-reset");
  };

  const handleSignUp = () => {
    router.push("/(auth)/sign-up");
  };

  const handleFacebookPress = async () => {
    if (!isFacebookConfigured) {
      Alert.alert(
        "Facebook Login",
        "Facebook login is not configured for this build yet."
      );
      return;
    }

    await facebookAuthState.promptAsync?.();
  };

  const handleGooglePress = async () => {
    if (!isGoogleConfiguredForCurrentPlatform()) {
      Alert.alert(
        "Google Login",
        "Google login is not configured for this platform in this build yet."
      );
      return;
    }

    await promptAsync();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {facebookAuthView}
      <LinearGradient colors={["#1E4A72", "#000000"]} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E4A72" />
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 30 }}>
          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>

            {/* HEADER */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View style={styles.logoBadge}>
              <Image source={AMIZE_LOGO} style={styles.logo} />
            </View>
            <Text style={styles.headerTitle}>{t("auth.signIn.title")}</Text>
            <Text style={styles.headerSubtitle}>{t("auth.signIn.subtitle")}</Text>
            {demoMode ? (
              <View style={styles.demoNotice}>
                <Text style={styles.demoNoticeTitle}>Demo build</Text>
                <Text style={styles.demoNoticeText}>
                  Social login is disabled in demo mode. Use a demo account below.
                </Text>
              </View>
            ) : null}
          </View>

            {/* FORM SECTION */}
            <View style={{ width: "100%", maxWidth: 400 }}>
              <Input
                label={t("auth.signIn.emailLabel")}
                placeholder={t("auth.signIn.emailPlaceholder")}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType={isEmailIdentifier ? "email-address" : "default"}
                autoCapitalize="none"
                error={errors.email}
                icon={<Mail size={20} color="#9CA3AF" />}
              />
              <Input
                label={t("auth.signIn.passwordLabel")}
                placeholder={t("auth.signIn.passwordPlaceholder")}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                error={errors.password}
                icon={<Lock size={20} color="#9CA3AF" />}
              />
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  {t("auth.signIn.forgotPassword")}
                </Text>
              </TouchableOpacity>
              {!!authError && <Text style={styles.formError}>{authError}</Text>}
              <Button
                label={t("auth.signIn.signIn")}
                onPress={handleSignIn}
                variant="primary"
                fullWidth
                loading={loading}
              />

              {localDemoEnabled && (
                <View style={styles.demoCard}>
                  <Text style={styles.demoTitle}>
                    {t("auth.signIn.localDemoTitle")}
                  </Text>
                  <Text style={styles.demoText}>
                    {t("auth.signIn.localDemoText")}
                  </Text>
                  {LOCAL_DEMO_ACCOUNTS.map((account) => (
                    <View key={account.label} style={styles.demoRow}>
                      <View style={styles.demoCopy}>
                        <Text style={styles.demoLabel}>{account.label}</Text>
                        <Text style={styles.demoCredential}>
                          {account.identifier}
                        </Text>
                        <Text style={styles.demoCredential}>
                          {account.password}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.demoAction}
                        onPress={() =>
                          handleDemoSignIn(account.identifier, account.password)
                        }
                      >
                        <Text style={styles.demoActionText}>{t("common.use")}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* SOCIAL LOGIN BUTTONS */}
              {showSocialButtons && (
                <View style={styles.socialContainer}>
                  {showFacebookButton && (
                    <TouchableOpacity
                      style={styles.socialButtonStyle}
                      disabled={facebookLoading}
                      onPress={handleFacebookPress}
                    >
                      <Image source={FACEBOOK_ICON} style={styles.icon} />
                    </TouchableOpacity>
                  )}

                  {showGoogleButton && (
                    <TouchableOpacity
                      style={styles.socialButtonStyle}
                      disabled={googleLoading}
                      onPress={handleGooglePress}
                    >
                      <Image source={GOOGLE_ICON} style={styles.icon} />
                    </TouchableOpacity>
                  )}

                  {showAppleButton && (
                    <TouchableOpacity
                      style={styles.socialButtonStyle}
                      disabled={appleLoading}
                      onPress={handleAppleSignIn}
                    >
                      <Image source={APPLE_ICON} style={styles.icon} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>{t("auth.signIn.noAccount")}</Text>
                <TouchableOpacity onPress={handleSignUp}>
                  <Text style={styles.footerLink}>
                    {" "}
                    {t("auth.signIn.signUp")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginLeft: -8,
    marginBottom: 12,
  },
  logoBadge: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "rgba(3,5,16,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 80, height: 80, borderRadius: 40 },
  headerTitle: { color: "white", fontSize: 32, fontWeight: "bold", marginTop: 12 },
  headerSubtitle: { color: "#9CA3AF", fontSize: 16, textAlign: "center", marginTop: 4 },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Figtree",
  },
  formError: {
    color: "#FCA5A5",
    marginBottom: 16,
    fontSize: 14,
    fontFamily: "Figtree",
  },
  demoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  demoTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Figtree",
    marginBottom: 6,
  },
  demoText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Figtree",
    marginBottom: 12,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 12,
    marginTop: 12,
  },
  demoCopy: {
    flex: 1,
    paddingRight: 12,
  },
  demoLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Figtree",
    marginBottom: 2,
  },
  demoCredential: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Figtree",
  },
  demoAction: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#1E4A72",
  },
  demoActionText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  demoNotice: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.35)",
    backgroundColor: "rgba(17, 24, 39, 0.75)",
  },
  demoNoticeTitle: {
    color: "#FDBA74",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Figtree",
    textTransform: "uppercase",
  },
  demoNoticeText: {
    color: "#FDE68A",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Figtree",
    textAlign: "center",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 32,
  },
  socialButtonStyle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontFamily: "Figtree",
  },
  footerLink: {
    color: "#FF5A5F",
    fontSize: 15,
    fontFamily: "Figtree",
    fontWeight: "600",
  },
  icon: { width: 24, height: 24 },
});
