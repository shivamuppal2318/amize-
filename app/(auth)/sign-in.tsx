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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";
import { Mail, Lock } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../firebase/config";
import { makeRedirectUri } from "expo-auth-session";

import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId:
    "209523351860-hv5rn2970io3ss52krrnebj5cd88kf4g.apps.googleusercontent.com",
  //  iosClientId: '<FROM DEVELOPER CONSOLE>'
});

WebBrowser.maybeCompleteAuthSession();

// Resolve icons
// @ts-ignore
import FacebookIcon from "@/assets/images/figma/facebook.png";
// @ts-ignore
import GoogleIcon from "@/assets/images/figma/google.png";
// @ts-ignore
import AppleIcon from "@/assets/images/figma/apple.png";
// @ts-ignore
import AmizeLogo from "@/assets/images/amize.png";

const AMIZE_LOGO = Image.resolveAssetSource(AmizeLogo).uri;
const FACEBOOK_ICON = Image.resolveAssetSource(FacebookIcon).uri;
const GOOGLE_ICON = Image.resolveAssetSource(GoogleIcon).uri;
const APPLE_ICON = Image.resolveAssetSource(AppleIcon).uri;

export default function SignInScreen() {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [userInformation, setUserInformation] = useState<any>(null);

  // -----------------------------
  // GOOGLE AUTH HOOK

  // const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  //   clientId:
  //     "188596080280-jftm5uhn8q9hk1repn686tbk5urh4b7u.apps.googleusercontent.com",
  //   iosClientId: "",
  //   androidClientId: "",
  //   redirectUri: makeRedirectUri({
  //     native: "com.amize:/oauth2redirect/google",
  //   }),
  // });

  // useEffect(() => {
  //   if (response?.type === "success" && response.params.id_token) {
  //     const idToken = response.params.id_token;
  //     handleGoogleFirebaseLogin(idToken);
  //   }
  // }, [response]);

  // const handleGoogleFirebaseLogin = async (idToken: string) => {
  //   try {
  //     const credential = GoogleAuthProvider.credential(idToken);
  //     await signInWithCredential(auth, credential);
  //     router.replace("/(tabs)");
  //   } catch (e) {
  //     console.error("Firebase Google login failed:", e);
  //     Alert.alert("Login Failed", "Firebase authentication failed");
  //   }
  // };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      console.log("Sign in with google user data: ", response);
      if (isSuccessResponse(response)) {
        setUserInformation(response.data);
      } else {
        console.info("Google login failed:", response);
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Alert.alert("Google login failed", "Google login in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert("Google login failed", "Play services not available");
            break;
          default:
        }
      } else {
        Alert.alert("Google login failed", "Something went wrong");
      }
    }
  };

  // -----------------------------
  // EMAIL LOGIN
  // -----------------------------
  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    try {
      const result = await login(email, password);
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (e) {
      console.error("Email login failed:", e);
      Alert.alert("Login Error", "Something went wrong");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E4A72" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 30 }}>
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          {/* HEADER */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: 85,
                height: 85,
                borderRadius: 42.5,
                backgroundColor: "rgba(3,5,16,0.45)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri: AMIZE_LOGO }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            </View>

            <Text
              style={{
                fontFamily: "Figtree",
                color: "white",
                fontSize: 32,
                fontWeight: "bold",
                marginTop: 12,
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              Amize Login
            </Text>

            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 16,
                textAlign: "center",
                lineHeight: 24,
                maxWidth: 320,
              }}
            >
              Sign in to continue to your account
            </Text>
          </View>

          {/* FORM */}
          <View style={{ width: "100%", maxWidth: 400 }}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon={<Mail size={20} color="#9CA3AF" />}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Lock size={20} color="#9CA3AF" />}
              error={errors.password}
            />

            <Button
              label="Sign In"
              onPress={handleSignIn}
              variant="primary"
              fullWidth
              loading={loading}
            />

            {/* DIVIDER */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 32,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#1a1a2e" }}
              />
              <Text style={{ color: "#6B7280", marginHorizontal: 16 }}>
                or continue with
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#1a1a2e" }}
              />
            </View>

            {/* SOCIAL LOGIN */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              {/* <TouchableOpacity style={styles.socialButtonStyle}>
                <Image
                  source={{ uri: FACEBOOK_ICON }}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity> */}

              <TouchableOpacity
                style={styles.socialButtonStyle}
                // disabled={!request}
                // onPress={() => promptAsync()} // Only triggers on button press
                onPress={() => signInWithGoogle()}
              >
                <Image
                  source={{ uri: GOOGLE_ICON }}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>

              {/* <TouchableOpacity style={styles.socialButtonStyle}>
                <Image
                  source={{ uri: APPLE_ICON }}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  socialButtonStyle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
});
