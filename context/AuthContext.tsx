import React, { createContext, useState, useEffect, useCallback } from "react";
import { secureStorage, STORAGE_KEYS } from "@/lib/auth/storage";
import {
  resolveLocalDemoSession,
  LOCAL_DEMO_ACCOUNTS,
  canUseLocalDemoAuth,
} from "@/lib/auth/localDemoAuth";
import { isDemoMode } from "@/lib/release/releaseConfig";
import {
  storeTokens,
  removeTokens,
  validateTokens,
  isTokenAuthenticated,
  tryRefreshTokens,
  clearAuthData,
  getTokens,
} from "@/lib/auth/tokens";
import { authApi } from "@/lib/api/auth";
import { getFullDeviceDetails } from "@/lib/utils/deviceInfo";
import {
  User,
  RegisterRequest,
  VerifyCodeResponse,
  ResendCodeResponse,
  AppleLoginRequest,
} from "@/lib/api/types";
import { AuthContextValue, LoginResult, RegisterResult } from "@/lib/api/types";
import { socketManager } from "@/lib/socket/socketManager";
import { socketClient } from "@/lib/socket/socketClient";

// Default context value
const defaultContextValue: AuthContextValue = {
  isAuthenticated: false,
  user: null,
  interests: [],
  loading: true,
  hasCompletedOnboarding: false,
  isInSignupFlow: false,
  login: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
  loginWithClerk: async () => ({ success: false }),
  loginWithFacebook: async () => ({ success: false }),
  loginWithApple: async () => ({ success: false }),
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
      // Demo/local-demo sessions should not attempt realtime sockets.
      // They use placeholder tokens which would cause auth failures and force logout.
      const tokens = await getTokens();
      const isLocalDemoToken =
        tokens?.accessToken?.startsWith("local-demo-token-") ||
        tokens?.refreshToken?.startsWith("local-demo-refresh-");
      if (isDemoMode() || isLocalDemoToken) {
        console.log("[AuthContext] Demo session - skipping socket initialization");
        return;
      }

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
      const tokens = await getTokens();
      const isLocalDemoToken =
        tokens?.accessToken?.startsWith("local-demo-token-") ||
        tokens?.refreshToken?.startsWith("local-demo-refresh-");

      if (isLocalDemoToken && !canUseLocalDemoAuth()) {
        console.log(
          "[AuthContext] Local demo tokens present but demo auth disabled. Clearing."
        );
        await clearAuthData();
        return false;
      }

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

  const applyAuthenticatedUser = useCallback(
    async (authenticatedUser: User, token: string, refreshToken: string) => {
      console.log('[AUTH DEBUG] applyAuthenticatedUser for user:', authenticatedUser.id);
      await storeTokens({
        accessToken: token,
        refreshToken,
      });

      await secureStorage.set(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(authenticatedUser)
      );

      setUser(authenticatedUser);
      setInterests(authenticatedUser.interests?.map((i) => i.name) || []);
      console.log('[AUTH DEBUG] setIsAuthenticated(true) - triggering layout redirect');
      setIsAuthenticated(true);

      await initializeSocketForUser(authenticatedUser, hasCompletedOnboarding);
    },
    [hasCompletedOnboarding]
  );

  const finalizeReturningUserSession = useCallback(async () => {
    await secureStorage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, "true");
    await secureStorage.remove(STORAGE_KEYS.SIGNUP_FLOW);
    await secureStorage.remove(STORAGE_KEYS.REGISTRATION_DATA);
    setHasCompletedOnboarding(true);
    setIsInSignupFlow(false);
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

  useEffect(() => {
    socketClient.setAuthFailureCallback(() => {
      handleAuthFailure().catch((error) => {
        console.error("[AuthContext] Socket auth failure callback error:", error);
      });
    });
  }, [handleAuthFailure]);

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
          if (isDemoMode() && canUseLocalDemoAuth()) {
            const demoAccount =
              LOCAL_DEMO_ACCOUNTS.find(
                (account) => account.label === "Demo Admin"
              ) || LOCAL_DEMO_ACCOUNTS[0];
            if (demoAccount) {
              const demoSession = resolveLocalDemoSession(
                demoAccount.identifier,
                demoAccount.password
              );
              if (demoSession) {
                await secureStorage.set(
                  STORAGE_KEYS.ONBOARDING_COMPLETED,
                  "true"
                );
                await secureStorage.remove(STORAGE_KEYS.SIGNUP_FLOW);
                setHasCompletedOnboarding(true);
                setIsInSignupFlow(false);

                await applyAuthenticatedUser(
                  demoSession.user,
                  demoSession.token,
                  demoSession.refreshToken
                );

                console.log(
                  "[AuthContext] Demo mode active - auto signed in demo admin"
                );
                setLoading(false);
                return;
              }
            }
          }
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
    async (identifier: string, password: string): Promise<LoginResult> => {
      setLoading(true);

      try {
        const localDemoSession = resolveLocalDemoSession(identifier, password);
        if (localDemoSession) {
          await finalizeReturningUserSession();

          await applyAuthenticatedUser(
            localDemoSession.user,
            localDemoSession.token,
            localDemoSession.refreshToken
          );

          console.log("[AuthContext] Local demo user logged in successfully");
          return { success: true, message: "Signed in with local demo user" };
        }

        // Get device info
        const deviceDetails = await getFullDeviceDetails();

        // Call login API
        const response = await authApi.login({
          identifier,
          password,
          ...deviceDetails,
        });

        console.log("[AuthContext] Login response:", response);

        // if (response.success && response.token && response.refreshToken && response.user) {
        if (
          response.success &&
          response.user &&
          response.token &&
          response.refreshToken
        ) {
          await finalizeReturningUserSession();
          await applyAuthenticatedUser(
            response.user,
            response.token,
            response.refreshToken
          );

          console.log("[AuthContext] User logged in successfully");

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
    [applyAuthenticatedUser, finalizeReturningUserSession]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string): Promise<LoginResult> => {
      setLoading(true);

      try {
        const response = await authApi.googleLogin({ idToken });

        if (
          response.success &&
          response.token &&
          response.refreshToken &&
          response.user
        ) {
          console.log('[AUTH DEBUG] clerkLogin SUCCESS - applying user:', response.user.id);
          await finalizeReturningUserSession();
          await applyAuthenticatedUser(
            response.user,
            response.token,
            response.refreshToken
          );
          console.log('[AUTH DEBUG] clerkLogin COMPLETE - isAuthenticated should now be true');

          return { success: true };
        }

        return {
          success: false,
          message: response.message || "Google login failed",
        };
      } catch (error: any) {
        console.error("[AuthContext] Google login error:", error);
        return {
          success: false,
          message:
            error?.response?.data?.message ||
            "Google login failed. Please try again.",
        };
      } finally {
        setLoading(false);
      }
    },
    [applyAuthenticatedUser, finalizeReturningUserSession]
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

        console.log("[AuthContext] Register request (sanitized):", {
          username: userData.username,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          hasPassword: Boolean(userData.password),
          hasDob: Boolean(userData.dateOfBirth),
          hasFirstName: Boolean(userData.firstName),
          hasLastName: Boolean(userData.lastName),
        });

        // Call register API
        const response = await authApi.register({
          ...userData,
          ...deviceDetails,
        });
        console.log("[AuthContext] Register response:", {
          success: response?.success,
          message: response?.message,
          hasToken: Boolean(response?.token),
          hasRefreshToken: Boolean(response?.refreshToken),
          userId: response?.user?.id,
          verified: response?.user?.verified,
          verificationCodeProvided: Boolean(response?.verificationCode),
        });

        if (response.success) {
          console.log(
            `[AuthContext] Registration initiated for ${userData.email}`
          );

          // Backend already returns a token + refreshToken for newly registered users.
          // Store it so the app can proceed through the onboarding/verification flow
          // even if a web refresh clears the in-memory registration context.
          if (response.token && response.refreshToken && response.user) {
            await applyAuthenticatedUser(
              response.user,
              response.token,
              response.refreshToken
            );
          } else {
            console.warn(
              "[AuthContext] Register succeeded but did not return tokens/user. Signup may require OTP screen.",
              {
                hasToken: Boolean(response.token),
                hasRefreshToken: Boolean(response.refreshToken),
                hasUser: Boolean(response.user),
              }
            );
          }

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
    [applyAuthenticatedUser]
  );

  const loginWithClerk = useCallback(
    async (token: string): Promise<LoginResult> => {
      console.log('[AUTH DEBUG] loginWithClerk STARTED with token length:', token.length);
      setLoading(true);

      try {
        console.log('[AUTH DEBUG] Calling authApi.clerkLogin...');
        const response = await authApi.clerkLogin({ token });
        console.log('[AUTH DEBUG] clerkLogin response:', { success: response.success, userId: response.user?.id });

        if (
          response.success &&
          response.token &&
          response.refreshToken &&
          response.user
        ) {
          await finalizeReturningUserSession();
          await applyAuthenticatedUser(
            response.user,
            response.token,
            response.refreshToken
          );

          return { success: true };
        }

        return {
          success: false,
          message: response.message || "Clerk login failed",
        };
      } catch (error: any) {
        console.error("[AuthContext] Clerk login error:", error);
        return {
          success: false,
          message:
            error?.response?.data?.message ||
            error?.message ||
            "Clerk login failed. Please try again.",
        };
      } finally {
        setLoading(false);
      }
    },
    [applyAuthenticatedUser, finalizeReturningUserSession]
  );

  const loginWithFacebook = useCallback(
    async (accessToken: string): Promise<LoginResult> => {
      setLoading(true);

      try {
        const response = await authApi.facebookLogin({ accessToken });

        if (
          response.success &&
          response.token &&
          response.refreshToken &&
          response.user
        ) {
          await finalizeReturningUserSession();
          await applyAuthenticatedUser(
            response.user,
            response.token,
            response.refreshToken
          );

          return { success: true };
        }

        return {
          success: false,
          message: response.message || "Facebook login failed",
        };
      } catch (error: any) {
        console.error("[AuthContext] Facebook login failed:", error);
        return {
          success: false,
          message:
            error?.response?.data?.message ||
            error?.message ||
            "Facebook login failed",
        };
      } finally {
        setLoading(false);
      }
    },
    [applyAuthenticatedUser, finalizeReturningUserSession]
  );

  const loginWithApple = useCallback(
    async (data: AppleLoginRequest): Promise<LoginResult> => {
      setLoading(true);

      try {
        const response = await authApi.appleLogin(data);

        if (
          response.success &&
          response.token &&
          response.refreshToken &&
          response.user
        ) {
          await finalizeReturningUserSession();
          await applyAuthenticatedUser(
            response.user,
            response.token,
            response.refreshToken
          );

          return { success: true };
        }

        return {
          success: false,
          message: response.message || "Apple login failed",
        };
      } catch (error: any) {
        console.error("[AuthContext] Apple login failed:", error);
        return {
          success: false,
          message:
            error?.response?.data?.message ||
            error?.message ||
            "Apple login failed",
        };
      } finally {
        setLoading(false);
      }
    },
    [applyAuthenticatedUser, finalizeReturningUserSession]
  );

  // Verify account with code
  const verifyCode = useCallback(
    async (identifier: string, code: string): Promise<VerifyCodeResponse> => {
      setLoading(true);

      try {
        const response = await authApi.verifyCode({ identifier, code });
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
    async (identifier: string): Promise<ResendCodeResponse> => {
      console.log(`[AuthContext] Resending verification code for ${identifier}`);

      try {
        const response = await authApi.resendCode(identifier);
        return response;
      } catch (error: any) {
        console.error(
          "[AuthContext] Error resending verification code:",
          error?.response
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
    loginWithGoogle,
    loginWithClerk,
    loginWithFacebook,
    loginWithApple,
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
