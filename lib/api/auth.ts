import axios from "axios";
import client from "./client";
import { API_CONFIG, AUTH_ENDPOINTS } from "./config";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  ResendCodeResponse,
} from "./types";
import { getDeviceId } from "@/lib/utils/deviceInfo";
import { API_URL } from "../settings/constants";

export const authApi = {
  // Login with email and password
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    console.log("Login data:", data);
    try {
      const response = await axios.post(API_URL + AUTH_ENDPOINTS.LOGIN, data);
      console.log("Login response:", response.data);

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Register a new user
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axios.post(
      API_CONFIG.BASE_URL + AUTH_ENDPOINTS.REGISTER,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Register response:", response.data);
    return response.data;
  },

  // Verify account with verification code
  verifyCode: async (data: VerifyCodeRequest): Promise<VerifyCodeResponse> => {
    const response = await axios.post(
      API_CONFIG.BASE_URL + AUTH_ENDPOINTS.VERIFY_CODE,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Verify code response:", response.data);

    return response.data;
  },

  // Resend verification code
  resendCode: async (email: string): Promise<ResendCodeResponse> => {
    const response = await client.post(AUTH_ENDPOINTS.RESEND_CODE, { email });
    return response.data;
  },

  // Refresh an expired token
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const request: RefreshTokenRequest = { refreshToken };
    const response = await client.post(AUTH_ENDPOINTS.REFRESH_TOKEN, request);
    return response.data;
  },

  // Logout the user
  logout: async (): Promise<void> => {
    // Await the Promise to get the actual string value
    const deviceId = await getDeviceId();

    const data = {
      deviceId: deviceId,
    };

    console.log(data);

    try {
      const response = await client.post(AUTH_ENDPOINTS.LOGOUT, data);
      console.log("Logout successful:", response.data);
    } catch (error) {
      console.error("Logout failed:", error);
      // The error handler will display a modal to the user
    }
  },
};
