import React, { useMemo } from "react";
import { View, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { useRegistration } from "@/context/RegistrationContext";

const StyledView = View;
const StyledSafeAreaView = SafeAreaView;

export default function SuccessScreen() {
  const { registrationData } = useRegistration();
  const hasRegistrationData = useMemo(
    () =>
      Boolean(
        registrationData.email &&
          registrationData.username &&
          registrationData.password &&
          registrationData.confirmPassword
      ),
    [
      registrationData.confirmPassword,
      registrationData.email,
      registrationData.password,
      registrationData.username,
    ]
  );

  const handleContinue = () => {
    if (hasRegistrationData) {
      router.replace("/account-setup/verify");
      return;
    }

    router.replace("/account-setup/profile");
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
      <StyledView className="flex-1 p-6 justify-center items-center">
        <StatusIndicator
          status={hasRegistrationData ? "success" : "error"}
          title={hasRegistrationData ? "Almost There" : "Registration Error"}
          message={
            hasRegistrationData
              ? "Your account is ready for verification. Continue to confirm your email and finish signup."
              : "Required signup data is missing. Go back to your profile step and complete registration first."
          }
        />

        <StyledView className="w-full mt-auto">
          <Button
            label={hasRegistrationData ? "Continue to Verification" : "Back to Profile"}
            onPress={handleContinue}
            variant="primary"
            fullWidth
          />
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
