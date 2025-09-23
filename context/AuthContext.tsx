import React, { createContext, useState, useEffect, useCallback } from "react";
import { secureStorage, STORAGE_KEYS } from "@/lib/auth/storage";
import {
  storeTokens,
  removeTokens,
  validateTokens,
  isTokenAuthenticated,
  tryRefreshTokens,
  clearAuthData,
} from "@/lib/auth/tokens";
import { authApi } from "@/lib/api/auth";
import { getFullDeviceDetails } from "@/lib/utils/deviceInfo";
import {
  User,
  RegisterRequest,
  VerifyCodeResponse,
  ResendCodeResponse,
} from "@/lib/api/types";
import { AuthContextValue, LoginResult, RegisterResult } from "@/lib/api/types";
import { socketManager } from "@/lib/socket/socketManager";

// Default context value
const defaultContextValue: AuthContextValue = {
  isAuthenticated: false,
  user: null,
  interests: [],
  loading: true,
  hasCompletedOnboarding: false,
  isInSignupFlow: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  updateUser: () => {},
  addInterest: () => {},
  removeInterest: () => {},
  setOnboardingComplete: async () => {},
  completeSignupFlow: async () => {},
  verifyCode: async () => ({ success: false }),
  resendVerificationCode: async () => ({ success: false }),
  startSignupFlow: async () => {},
};

// Create the context
export const AuthContext = createContext<AuthContextValue>(defaultContextValue);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] =
    useState<boolean>(false);
  const [isInSignupFlow, setIsInSignupFlow] = useState<boolean>(false);

  // Socket initialization helper
  const initializeSocketForUser = async (
    userData: User,
    onboardingComplete: boolean
  ) => {
    try {
      // Only initialize socket if user is verified and onboarding is complete
      if (userData.verified && onboardingComplete && !isInSignupFlow) {
        console.log("[AuthContext] Initializing socket for authenticated user");
        await socketManager.initialize();
      } else {
        console.log(
          "[AuthContext] Skipping socket initialization - user not ready"
        );
      }
    } catch (error) {
      console.error("[AuthContext] Failed to initialize socket:", error);
    }
  };

  // Socket cleanup helper
  const cleanupSocket = () => {
    try {
      console.log("[AuthContext] Cleaning up socket connection");
      socketManager.cleanup();
    } catch (error) {
      console.error("[AuthContext] Error cleaning up socket:", error);
    }
  };

  // Validate authentication state against actual tokens
  const validateAuthState = useCallback(async (): Promise<boolean> => {
    try {
      const hasValidTokens = await isTokenAuthenticated();
      const userJSON = await secureStorage.get(STORAGE_KEYS.USER_DATA);

      // User is truly authenticated if they have both valid tokens AND user data
      const isValid = hasValidTokens && !!userJSON;

      if (!isValid && (hasValidTokens || userJSON)) {
        // Inconsistent state - clear everything
        console.log(
          "[AuthContext] Inconsistent auth state detected, clearing data"
        );
        await clearAuthData();
        return false;
      }

      return isValid;
    } catch (error) {
      console.error("[AuthContext] Error validating auth state:", error);
      return false;
    }
  }, []);

  // Update authentication state based on token validity
  const syncAuthState = useCallback(
    async (forceRefresh = false) => {
      try {
        const isValid = await validateAuthState();

        if (!isValid && isAuthenticated && !forceRefresh) {
          // Try to refresh tokens once
          console.log(
            "[AuthContext] Auth state invalid, attempting token refresh"
          );
          const refreshSuccessful = await tryRefreshTokens();

          if (refreshSuccessful) {
            // Re-validate after refresh
            const refreshedValid = await validateAuthState();
            setIsAuthenticated(refreshedValid);
            return refreshedValid;
          } else {
            // Refresh failed, log out
            await handleAuthFailure();
            return false;
          }
        }

        setIsAuthenticated(isValid);
        return isValid;
      } catch (error) {
        console.error("[AuthContext] Error syncing auth state:", error);
        setIsAuthenticated(false);
        return false;
      }
    },
    [isAuthenticated, validateAuthState]
  );

  // Handle authentication failure (invalid/expired tokens)
  const handleAuthFailure = useCallback(async () => {
    console.log("[AuthContext] Handling auth failure - clearing all data");
    try {
      cleanupSocket();
      await clearAuthData();

      // Reset all state
      setUser(null);
      setInterests([]);
      setIsAuthenticated(false);
      setIsInSignupFlow(false);
    } catch (error) {
      console.error("[AuthContext] Error handling auth failure:", error);
    }
  }, []);

  // Initialize auth state from storage with token validation
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("[AuthContext] Initializing authentication state");

        // Check if onboarding is completed
        const onboardingCompleted = await secureStorage.get(
          STORAGE_KEYS.ONBOARDING_COMPLETED
        );
        const onboardingComplete = onboardingCompleted === "true";
        setHasCompletedOnboarding(onboardingComplete);

        // Check if user is in signup flow
        const signupFlow = await secureStorage.get(STORAGE_KEYS.SIGNUP_FLOW);
        const inSignupFlow = !!signupFlow;
        setIsInSignupFlow(inSignupFlow);

        // Validate authentication state
        const isValid = await validateAuthState();

        if (isValid) {
          // Load user data
          const userJSON = await secureStorage.get(STORAGE_KEYS.USER_DATA);

          if (userJSON) {
            try {
              const userData = JSON.parse(userJSON) as User;
              setUser(userData);
              setInterests(userData.interests?.map((i) => i.name) || []);
              setIsAuthenticated(true);

              console.log("[AuthContext] User authenticated with valid tokens");

              // Initialize socket if conditions are met
              await initializeSocketForUser(userData, onboardingComplete);
            } catch (parseError) {
              console.error(
                "[AuthContext] Error parsing user data:",
                parseError
              );
              await clearAuthData();
              setIsAuthenticated(false);
            }
          }
        } else {
          console.log("[AuthContext] No valid authentication found");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("[AuthContext] Error retrieving auth state:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        console.log("[AuthContext] Initial loading complete");
      }
    };

    initializeAuth();
  }, [validateAuthState]);

  // Periodic auth state validation (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      await syncAuthState();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, syncAuthState]);

  // Update user data
  const updateUser = useCallback(
    (data: Partial<User>) => {
      console.log(`[AuthContext] Updating user with:`, data);
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);

        // Save to secure storage
        secureStorage
          .set(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
          .then(() => console.log("[AuthContext] User data saved"))
          .catch((error) =>
            console.error("[AuthContext] Error saving user data:", error)
          );

        // If user verification status changed, handle socket accordingly
        if (data.verified !== undefined && data.verified !== user.verified) {
          if (data.verified && hasCompletedOnboarding && !isInSignupFlow) {
            console.log("[AuthContext] User verified, initializing socket");
            initializeSocketForUser(updatedUser, hasCompletedOnboarding);
          } else if (!data.verified) {
            console.log("[AuthContext] User unverified, cleaning up socket");
            cleanupSocket();
          }
        }
      }
    },
    [user, hasCompletedOnboarding, isInSignupFlow]
  );

  // Interest management
  const addInterest = useCallback(
    (interest: string) => {
      if (!interests.includes(interest)) {
        const newInterests = [...interests, interest];
        setInterests(newInterests);

        if (user) {
          // Map interests to match API structure
          const interestObjects = newInterests.map((name) => {
            // Try to find existing interest object with this name
            const existing = user.interests.find((i) => i.name === name);
            return existing || { id: `temp-${Date.now()}`, name };
          });

          updateUser({ interests: interestObjects });
        }
      }
    },
    [interests, user, updateUser]
  );

  const removeInterest = useCallback(
    (interest: string) => {
      const newInterests = interests.filter((i) => i !== interest);
      setInterests(newInterests);

      if (user) {
        // Map interests to match API structure
        const interestObjects = newInterests.map((name) => {
          // Try to find existing interest object with this name
          const existing = user.interests.find((i) => i.name === name);
          return existing || { id: `temp-${Date.now()}`, name };
        });

        updateUser({ interests: interestObjects });
      }
    },
    [interests, user, updateUser]
  );

  // Start signup flow
  const startSignupFlow = useCallback(async () => {
    try {
      await secureStorage.set(STORAGE_KEYS.SIGNUP_FLOW, "true");
      setIsInSignupFlow(true);
    } catch (error) {
      throw error;
    }
  }, []);

  // Set onboarding complete
  const setOnboardingComplete = useCallback(async (): Promise<void> => {
    try {
      await secureStorage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, "true");
      setHasCompletedOnboarding(true);

      // Initialize socket if user is authenticated and verified
      if (isAuthenticated && user?.verified && !isInSignupFlow) {
        console.log("[AuthContext] Onboarding completed, initializing socket");
        await initializeSocketForUser(user, true);
      }
    } catch (error) {
      console.error("[AuthContext] Error saving onboarding state:", error);
    }
  }, [isAuthenticated, user, isInSignupFlow]);

  // Mark signup flow as complete
  const completeSignupFlow = useCallback(async () => {
    try {
      await secureStorage.remove(STORAGE_KEYS.SIGNUP_FLOW);
      setIsInSignupFlow(false);

      // Initialize socket now that signup flow is complete
      if (isAuthenticated && user?.verified && hasCompletedOnboarding) {
        console.log("[AuthContext] Signup flow completed, initializing socket");
        await initializeSocketForUser(user, hasCompletedOnboarding);
      }
    } catch (error) {
      console.error("[AuthContext] Error updating signup flow state:", error);
    }
  }, [isAuthenticated, user, hasCompletedOnboarding]);

  // Login with token validation
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      setLoading(true);

      try {
        // Get device info
        const deviceDetails = await getFullDeviceDetails();

        // Call login API
        const response = await authApi.login({
          email,
          password,
          ...deviceDetails,
        });

        console.log("[AuthContext] Login response:", response);

        // if (response.success && response.token && response.refreshToken && response.user) {
        if (
          response.success &&
          response.user.id &&
          response.user.id &&
          response.user
        ) {
          // Store tokens
          await storeTokens({
            accessToken: response.token,
            refreshToken: response.refreshToken,
          });

          // Store user data
          await secureStorage.set(
            STORAGE_KEYS.USER_DATA,
            JSON.stringify(response.user)
          );

          // Update state
          setUser(response.user);
          setInterests(response.user.interests?.map((i) => i.name) || []);
          setIsAuthenticated(true);

          console.log("[AuthContext] User logged in successfully");

          // Initialize socket for logged in user
          await initializeSocketForUser(response.user, hasCompletedOnboarding);

          return { success: true };
        }

        return { success: false, message: response.message || "Login failed" };
      } catch (error: any) {
        console.error("[AuthContext] Login error:", error);
        return {
          success: false,
          message:
            error?.response?.data?.message || "Login failed. Please try again.",
        };
      } finally {
        setLoading(false);
      }
    },
    [hasCompletedOnboarding]
  );

  // Register
  const register = useCallback(
    async (userData: RegisterRequest): Promise<RegisterResult> => {
      setLoading(true);

      try {
        // Mark that we're entering signup flow BEFORE authentication
        await secureStorage.set(STORAGE_KEYS.SIGNUP_FLOW, "true");
        setIsInSignupFlow(true);
        console.log("[AuthContext] Marked as in signup flow");

        // Get device info
        const deviceDetails = await getFullDeviceDetails();

        // Call register API
        const response = await authApi.register({
          ...userData,
          ...deviceDetails,
        });
        console.log("[AuthContext] Registered user:", response);

        if (response.success) {
          console.log(
            `[AuthContext] Registration initiated for ${userData.email}`
          );

          // Return verification code if provided by the backend
          return {
            success: true,
            verificationCode: response.verificationCode,
            message: response.message,
          };
        }

        return {
          success: false,
          message: response.message || "Registration failed",
        };
      } catch (error: any) {
        // Clear signup flow flag on error
        await secureStorage.remove(STORAGE_KEYS.SIGNUP_FLOW);
        setIsInSignupFlow(false);

        console.error(
          "[AuthContext] Registration error:",
          error?.response?.data?.message
        );
        return {
          success: false,
          message:
            error?.response?.data?.message ||
            "Registration failed. Please try again.",
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Verify account with code
  const verifyCode = useCallback(
    async (email: string, code: string): Promise<VerifyCodeResponse> => {
      setLoading(true);

      try {
        const response = await authApi.verifyCode({ email, code });
        console.log("[AuthContext] Verification response:", response);

        if (
          response.success &&
          response.token &&
          response.refreshToken &&
          response.user
        ) {
          // Store tokens
          await storeTokens({
            accessToken: response.token,
            refreshToken: response.refreshToken,
          });

          // Store user data
          await secureStorage.set(
            STORAGE_KEYS.USER_DATA,
            JSON.stringify(response.user)
          );

          // Update state
          setUser(response.user);
          setInterests(response.user.interests?.map((i) => i.name) || []);
          setIsAuthenticated(true);

          console.log("[AuthContext] User verified successfully");

          // Don't initialize socket yet if still in signup flow
          // Socket will be initialized when signup flow completes
          if (!isInSignupFlow && hasCompletedOnboarding) {
            await initializeSocketForUser(
              response.user,
              hasCompletedOnboarding
            );
          }
        }

        return response;
      } catch (error: any) {
        console.error("[AuthContext] Verification error:", error?.response);
        // return {
        //   success: false,
        //   message:
        //     error?.response?.data?.message ||
        //     "Verification failed. Please try again.",
        // };
        return {
          success: false,
        };
      } finally {
        setLoading(false);
      }
    },
    [isInSignupFlow, hasCompletedOnboarding]
  );

  // Resend verification code
  const resendVerificationCode = useCallback(
    async (email: string): Promise<ResendCodeResponse> => {
      console.log(`[AuthContext] Resending verification code for ${email}`);

      try {
        const response = await authApi.resendCode(email);
        return response;
      } catch (error: any) {
        console.error(
          "[AuthContext] Error resending verification code:",
          error
        );
        return {
          success: false,
          message:
            error?.response?.data?.message ||
            "Failed to resend verification code. Please try again.",
        };
      }
    },
    []
  );

  // Logout (enhanced with proper cleanup)
  const logout = useCallback(async () => {
    console.log("[AuthContext] Logging out");
    try {
      // Cleanup socket connection first
      cleanupSocket();

      // Call logout API
      await authApi.logout();
    } catch (error) {
      console.error("[AuthContext] Logout API error:", error);
      // Continue with cleanup even if API call fails
    } finally {
      // Clear all auth data
      await clearAuthData();

      // Update state
      setUser(null);
      setInterests([]);
      setIsAuthenticated(false);
      setIsInSignupFlow(false);

      console.log("[AuthContext] Logout complete");
    }
  }, []);

  // Cleanup socket when component unmounts
  useEffect(() => {
    return () => {
      cleanupSocket();
    };
  }, []);

  // Create context value
  const contextValue: AuthContextValue = {
    isAuthenticated,
    user,
    interests,
    loading,
    hasCompletedOnboarding,
    isInSignupFlow,
    login,
    register,
    logout,
    updateUser,
    addInterest,
    removeInterest,
    setOnboardingComplete,
    completeSignupFlow,
    verifyCode,
    resendVerificationCode,
    startSignupFlow,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
