import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { StatusBar } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, Mail, Phone, Shield, CheckCircle, Clock } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useRegistration } from "@/context/RegistrationContext";
import { canBypassVerification, isDemoMode } from "@/lib/release/releaseConfig";

// @ts-ignore
import AmizeLogo from "@/assets/images/amize.png";
import { LinearGradient } from "expo-linear-gradient";

const AMIZE_LOGO = AmizeLogo;

export default function VerifyScreen() {
  const {
    user,
    updateUser,
    verifyCode,
    resendVerificationCode,
    completeSignupFlow,
    hasCompletedOnboarding,
  } = useAuth();
  const { registrationData, clearRegistrationData, isHydrated } = useRegistration();

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [inputValues, setInputValues] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const verificationTarget =
    registrationData.email ||
    registrationData.phoneNumber ||
    user?.email ||
    "";
  const isEmailTarget = Boolean(registrationData.email || user?.email);
  const allowLocalBypass = isDemoMode() || canBypassVerification();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!verificationTarget && !user) {
      router.replace("/sign-up");
    }
  }, [isHydrated, verificationTarget, user]);

  useEffect(() => {
    if (timer <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleInputChange = (text: string, index: number) => {
    if (text.length > 1) {
      handleCodePaste(text);
      return;
    }

    const newInputValues = [...inputValues];
    newInputValues[index] = text.slice(-1);
    setInputValues(newInputValues);

    const fullCode = newInputValues.join("");
    setCode(fullCode);

    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (text.length === 0 && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (pastedText: string) => {
    const cleanedText = pastedText.slice(0, 6);

    if (cleanedText.length === 6) {
      const chars = cleanedText.split("");
      setInputValues(chars);
      setCode(cleanedText);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!verificationTarget) {
      Alert.alert(
        "Missing Contact",
        "Your signup contact is missing. Go back and complete the profile step again."
      );
      return;
    }

    if (!allowLocalBypass && code.length !== 6) {
      Alert.alert(
        "Invalid Code",
        "Please enter the complete 6-digit verification code."
      );
      return;
    }

    try {
      setVerifying(true);

      if (allowLocalBypass) {
        updateUser({ verified: true });
        await completeSignupFlow();
        clearRegistrationData();
        router.replace(hasCompletedOnboarding ? "/(tabs)" : "/onboarding/step1");
        return;
      }

      const result = await verifyCode(verificationTarget, code);

      if (!result.success) {
        Alert.alert(
          "Verification Failed",
          result.message || "Invalid verification code. Please try again."
        );
        return;
      }

      await completeSignupFlow();
      clearRegistrationData();
      router.replace(hasCompletedOnboarding ? "/(tabs)" : "/onboarding/step1");
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !verificationTarget) {
      return;
    }

    try {
      setResending(true);
      const result = await resendVerificationCode(verificationTarget);

      if (!result.success) {
        Alert.alert(
          "Error",
          result.message || "Failed to resend verification code. Please try again."
        );
        return;
      }

      setTimer(60);
      setInputValues(["", "", "", "", "", ""]);
      setCode("");
      inputRefs.current[0]?.focus();

      Alert.alert(
        "Code Sent",
        `A new verification code has been sent to your ${isEmailTarget ? "email" : "phone"}.`
      );
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#1E4A72", "#000000"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.content}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <ChevronLeft size={24} color="white" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Account Verification</Text>

                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.mainContent}>
                <View style={styles.logoSection}>
                  <View style={styles.logoContainer}>
                    <Image
                      source={AMIZE_LOGO}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={styles.title}>
                    {isEmailTarget ? "Check Your Email" : "Check Your Phone"}
                  </Text>

                  <View style={styles.subtitleContainer}>
                    <Text style={styles.subtitle}>
                      We have sent a 6-digit verification code to
                    </Text>
                    <View style={styles.emailContainer}>
                      {isEmailTarget ? (
                        <Mail size={16} color="#fff" style={styles.emailIcon} />
                      ) : (
                        <Phone size={16} color="#fff" style={styles.emailIcon} />
                      )}
                      <Text style={styles.emailText}>
                        {verificationTarget || "No contact found"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.codeSection}>
                  <View style={styles.codeInputContainer}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <TextInput
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        style={[
                          styles.codeInput,
                          inputValues[index] && styles.codeInputFilled,
                        ]}
                        keyboardType={allowLocalBypass ? "default" : "number-pad"}
                        maxLength={1}
                        value={inputValues[index]}
                        onChangeText={(text) => handleInputChange(text, index)}
                        onKeyPress={({ nativeEvent }) => {
                          if (
                            nativeEvent.key === "Backspace" &&
                            !inputValues[index] &&
                            index > 0
                          ) {
                            inputRefs.current[index - 1]?.focus();
                          }
                        }}
                        textContentType="oneTimeCode"
                      />
                    ))}
                  </View>

                  {code.length === 6 && (
                    <View style={styles.successIndicator}>
                      <CheckCircle size={16} color="#10B981" />
                      <Text style={styles.successText}>
                        {allowLocalBypass
                          ? "Verification bypass is enabled for this build"
                          : "Code entered successfully"}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.resendSection}>
                  <Text style={styles.resendPrompt}>
                    Did not receive the code?
                  </Text>

                  {timer > 0 ? (
                    <View style={styles.timerContainer}>
                      <Clock size={16} color="#FF5A5F" />
                      <Text style={styles.timerText}>
                        Resend available in {formatTimer(timer)}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleResend}
                      disabled={resending}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resendButtonText}>
                        {resending ? "Sending..." : "Resend Code"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.securityNotice}>
                  <Shield size={20} color="#9CA3AF" />
                  <Text style={styles.securityText}>
                    This step verifies your identity before you enter the app.
                  </Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  label={verifying ? "Verifying..." : "Verify Account"}
                  onPress={handleVerify}
                  variant="primary"
                  fullWidth
                  loading={verifying}
                  disabled={(!allowLocalBypass && code.length !== 6) || verifying}
                />
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingTop: 30,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF5A5F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontFamily: "Figtree",
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitleContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Figtree",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 90, 95, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.2)",
  },
  emailIcon: {
    marginRight: 6,
  },
  emailText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Figtree",
    fontWeight: "600",
  },
  codeSection: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    marginBottom: 32,
  },
  codeInputContainer: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 16,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    color: "white",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Figtree",
    borderWidth: 2,
    borderColor: "#374151",
  },
  codeInputFilled: {
    borderColor: "#FF5A5F",
    backgroundColor: "rgba(255, 90, 95, 0.05)",
  },
  successIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  successText: {
    color: "#10B981",
    fontSize: 14,
    fontFamily: "Figtree",
    fontWeight: "500",
    marginLeft: 6,
  },
  resendSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  resendPrompt: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Figtree",
    marginBottom: 12,
    textAlign: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 90, 95, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.2)",
  },
  timerText: {
    color: "#FF5A5F",
    fontSize: 14,
    fontFamily: "Figtree",
    fontWeight: "600",
    marginLeft: 6,
  },
  resendButton: {
    backgroundColor: "rgba(255, 90, 95, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.3)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  resendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Figtree",
    fontWeight: "600",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    padding: 16,
    maxWidth: 400,
  },
  securityText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Figtree",
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: 32,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
});
