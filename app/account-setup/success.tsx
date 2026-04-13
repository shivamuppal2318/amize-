import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useRegistration } from "@/context/RegistrationContext";

const StyledView = View;
const StyledSafeAreaView = SafeAreaView;

export default function SuccessScreen() {
  const { register } = useAuth();
  const { registrationData } = useRegistration();
  const [isRegistering, setIsRegistering] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeRegistration = async () => {
      try {
        if (
          !registrationData.email ||
          !registrationData.username ||
          !registrationData.password ||
          !registrationData.confirmPassword
        ) {
          throw new Error("Missing required registration data");
        }

        const finalRequest = {
          username: registrationData.username,
          email: registrationData.email,
          password: registrationData.password,
          confirmPassword: registrationData.confirmPassword,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          gender: registrationData.gender,
          dateOfBirth: registrationData.dateOfBirth,
          interests: registrationData.interests,
          profilePhotoUrl: registrationData.profilePhotoUrl,
        };

        const result = await register(finalRequest);

        if (!result.success) {
          throw new Error(
            result.message || "Registration failed. Please try again."
          );
        }

        setRegistrationComplete(true);
      } catch (registrationError: any) {
        setError(
          registrationError.message ||
            "There was a problem completing your registration."
        );
      } finally {
        setIsRegistering(false);
      }
    };

    completeRegistration();
  }, [register, registrationData]);

  const handleContinue = () => {
    if (registrationComplete) {
      router.replace("/account-setup/verify");
      return;
    }

    if (error) {
      router.replace("/account-setup/profile");
    }
  };

  if (isRegistering) {
    return (
      <StyledSafeAreaView className="flex-1 bg-[#1a1a2e] justify-center items-center">
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text className="text-white mt-4 text-lg">
          Creating your account...
        </Text>
        <Text className="text-gray-400 mt-2 text-center px-8">
          Please wait while we prepare email verification.
        </Text>
      </StyledSafeAreaView>
    );
  }

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
            label="Back to Profile"
            onPress={handleContinue}
            variant="primary"
            fullWidth
          />
        </StyledView>
      </StyledSafeAreaView>
    );
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
      <StyledView className="flex-1 p-6 justify-center items-center">
        <StatusIndicator
          status="success"
          title="Almost There"
          message="Your account has been created. Verify your email to finish signup."
        />

        <StyledView className="w-full mt-auto">
          <Button
            label="Continue to Verification"
            onPress={handleContinue}
            variant="primary"
            fullWidth
          />
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
