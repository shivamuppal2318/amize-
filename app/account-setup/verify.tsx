import React, { useState, useEffect, useRef } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Mail,
  Shield,
  CheckCircle,
  Clock,
} from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useRegistration } from "@/context/RegistrationContext";

// @ts-ignore
import AmizeLogo from "@/assets/images/amize.png";
import { LinearGradient } from "expo-linear-gradient";
const AMIZE_LOGO = Image.resolveAssetSource(AmizeLogo).uri;

type RegistrationData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  interests?: string[];
  profilePhotoUrl?: string;
  deviceId?: string;
  deviceInfo?: any;
};

export default function VerifyScreen() {
  const { updatedData } = useLocalSearchParams<{ updatedData?: string }>();
  const parsed_User_Data = updatedData
    ? (JSON.parse(updatedData) as RegistrationData)
    : null;

  const { verifyCode, resendVerificationCode, user, logout } = useAuth();
  const { registrationData, updateRegistrationData, getRegistrationRequest } =
    useRegistration();

  const [code, setCode] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(60);
  const [inputValues, setInputValues] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const userEmail =
    parsed_User_Data?.email || registrationData.email || user?.email;
  // const userEmail = "abhisheks@pearlorganisation.com";
  // const userEmail = "pranjal@pearlorganisation.com";

  // Set up resend timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Handle code input
  const handleInputChange = (text: string, index: number) => {
    // Check if this might be a paste operation (text longer than 1 character)
    if (text.length > 1) {
      handleCodePaste(text);
      return;
    }

    // Allow only digits
    if (!/^\d*$/.test(text)) return;

    // Update input values
    const newInputValues = [...inputValues];
    newInputValues[index] = text;
    setInputValues(newInputValues);

    // Combine all inputs to form the complete code
    const fullCode = newInputValues.join("");
    setCode(fullCode);

    // Move focus to next input or previous input based on whether text was entered or deleted
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (text.length === 0 && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle code paste
  const handleCodePaste = (pastedText: string) => {
    // Clean the pasted text to include only digits
    const cleanedText = pastedText.replace(/[^0-9]/g, "").slice(0, 6);

    if (cleanedText.length === 6) {
      // Fill all inputs
      const chars = cleanedText.split("");
      setInputValues(chars);
      setCode(cleanedText);

      // Focus the last input
      inputRefs.current[5]?.focus();
    }
  };

  // Handle verification
  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert(
        "Invalid Code",
        "Please enter the complete 6-digit verification code."
      );
      return;
    }

    // setVerifying(true);

    try {
      console.log("Verifying code for email:", userEmail, "Code:", code);

      const result = await verifyCode(userEmail ? userEmail : "", code);
      console.log("Verification result:", result);

      if (result.success) {
        // Navigate to main app after successful verification
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Verification Failed",
          result.message || "Invalid verification code. Please try again."
        );
        // Clear inputs on failed verification
        // setInputValues(['', '', '', '', '', '']);
        // setCode('');
        // inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.log("Verification error:", error);
    } finally {
      // setVerifying(false);
    }
  };

  // Handle resend
  const handleResend = async () => {
    if (timer > 0) return;

    setResending(true);

    try {
      const result = await resendVerificationCode(userEmail ? userEmail : "");

      if (result.success) {
        // Reset timer
        setTimer(60);

        // Reset code inputs
        setInputValues(["", "", "", "", "", ""]);
        setCode("");

        // Focus first input
        inputRefs.current[0]?.focus();

        Alert.alert(
          "Code Sent",
          "A new verification code has been sent to your email."
        );
      } else {
        Alert.alert(
          "Error",
          result.message ||
            "Failed to resend verification code. Please try again."
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.error("Resend error:", error);
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
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={async () => {
                    console.log("Navigating back to Get Started");
                    await logout();
                    await router.replace("/(auth)/get-started");
                  }}
                >
                  <ChevronLeft size={24} color="white" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Email Verification</Text>

                <View style={styles.headerSpacer} />
              </View>

              {/* Content Container */}
              <View style={styles.mainContent}>
                {/* Logo and Header Section */}
                <View style={styles.logoSection}>
                  {/* Logo */}
                  <View style={styles.logoContainer}>
                    <Image
                      source={{ uri: AMIZE_LOGO }}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Title */}
                  <Text style={styles.title}>Check Your Email</Text>

                  {/* Subtitle */}
                  <View style={styles.subtitleContainer}>
                    <Text style={styles.subtitle}>
                      We've sent a 6-digit verification code to
                    </Text>
                    <View style={styles.emailContainer}>
                      <Mail size={16} color="#fff" style={styles.emailIcon} />
                      <Text style={styles.emailText}>{userEmail}</Text>
                    </View>
                  </View>
                </View>

                {/* Verification Code Input */}
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
                        keyboardType="number-pad"
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

                  {/* Code Success Indicator */}
                  {code.length === 6 && (
                    <View style={styles.successIndicator}>
                      <CheckCircle size={16} color="#10B981" />
                      <Text style={styles.successText}>
                        Code entered successfully
                      </Text>
                    </View>
                  )}
                </View>

                {/* Resend Section */}
                <View style={styles.resendSection}>
                  <Text style={styles.resendPrompt}>
                    Didn't receive the code?
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

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                  <Shield size={20} color="#9CA3AF" />
                  <Text style={styles.securityText}>
                    This step helps us verify your identity and secure your
                    account
                  </Text>
                </View>
              </View>

              {/* Verify Button */}
              <View style={styles.buttonContainer}>
                <Button
                  label={verifying ? "Verifying..." : "Verify Email"}
                  onPress={handleVerify}
                  variant="primary"
                  fullWidth
                  loading={verifying}
                  disabled={code.length !== 6 || verifying}
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
    // color: "#FF5A5F",
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
  codeLabel: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Figtree",
    fontWeight: "500",
    marginBottom: 20,
    textAlign: "center",
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
    // color: "#FF5A5F",
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
