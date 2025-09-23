// app/account-setup/success.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useRegistration } from "@/context/RegistrationContext";
import { getFullDeviceDetails } from "@/lib/utils/deviceInfo";

const StyledView = View;

const StyledSafeAreaView = SafeAreaView;

export default function SuccessScreen() {
  const { register, completeSignupFlow, updateUser } = useAuth();
  const { registrationData, clearRegistrationData, getRegistrationRequest } =
    useRegistration();
  const [isRegistering, setIsRegistering] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Complete the registration process when the screen loads
  useEffect(() => {
    const completeRegistration = async () => {
      try {
        console.log("SuccessScreen: Starting registration process...");

        // Ensure we have all required data
        if (!registrationData.email || !registrationData.username) {
          throw new Error("Missing required registration data");
        }

        // Get device info for API call
        const deviceDetails = await getFullDeviceDetails();

        // Get registration data for API call
        const registrationRequest = getRegistrationRequest();

        // Add device details to request
        const finalRequest = {
          ...registrationRequest,
          ...deviceDetails,
        };

        console.log("SuccessScreen: Submitting registration data to API");

        // Submit registration to the API
        console.log("Data:-----------", finalRequest);
        
        const result = await register(finalRequest);
        console.log("SuccessScreen: Registration API response:", result);

        if (!result.success) {
          throw new Error(
            result.message || "Registration failed. Please try again."
          );
        }

        // If registration is successful and verification is required,
        // store verification code if returned in dev mode
        if (result.verificationCode) {
          console.log("SuccessScreen: Verification code received (dev mode)");
        }

        // Set registration complete
        // setRegistrationComplete(true);

        // Clear registration data as it's no longer needed
        clearRegistrationData();

        console.log("SuccessScreen: Registration completed successfully");

        // CRITICAL: Reset the signup flow flag immediately after successful registration
        await completeSignupFlow();
        console.log("SuccessScreen: Signup flow flag cleared successfully");

        // Auto-redirect after a delay
        setTimeout(() => {
          // handleContinue();
        }, 3000);
      } catch (error: any) {
        await completeSignupFlow();
        console.log("Error during registration:", error);

        setError(
          error.message || "There was a problem completing your registration."
        );
      } finally {
        setIsRegistering(false);
      }
    };

    completeRegistration();
  }, []);

  // Handle continue button press
  const handleContinue = async () => {
    try {
      if (registrationComplete) {
        console.log("SuccessScreen: Continuing to main app...");

        // Make ABSOLUTELY sure the signup flow is reset
        await completeSignupFlow();

        // Navigate to main app
        router.replace("/(tabs)");
      } else if (error) {
        // If there was an error, go back to the beginning of account setup
        router.replace("/account-setup/interests");
      }
    } catch (e) {
      console.error("Error during navigation:", e);
    }
  };

  // Show loading if still registering
  if (isRegistering) {
    return (
      <StyledSafeAreaView className="flex-1 bg-[#1a1a2e] justify-center items-center">
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text className="text-white mt-4 text-lg">
          Creating your account...
        </Text>
        <Text className="text-gray-400 mt-2 text-center px-8">
          Please wait while we register your account. This will just take a
          moment.
        </Text>
      </StyledSafeAreaView>
    );
  }

  // Show error if registration failed
  if (error) {
    return (
      <StyledSafeAreaView className="flex-1 bg-[#1a1a2e] justify-center items-center">
        <StatusIndicator
          status="error"
          title="Registration Error"
          message={error}
        />
        <StyledView className="w-full px-6 mt-8">
          <Button
            label="Try Again"
            onPress={handleContinue}
            variant="primary"
            fullWidth
          />
        </StyledView>
      </StyledSafeAreaView>
    );
  }

  // Regular success screen once registration is complete
  return (
    <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
      <StyledView className="flex-1 p-6 justify-center items-center">
        <StatusIndicator
          status="success"
          title="Congratulations!"
          message="Your account has been created successfully. You will be redirected to the home page in a few seconds."
        />

        <StyledView className="w-full mt-auto">
          <Button
            label="Continue"
            onPress={handleContinue}
            variant="primary"
            fullWidth
          />
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
