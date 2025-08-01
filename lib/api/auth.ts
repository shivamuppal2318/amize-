import client from './client';
import { AUTH_ENDPOINTS } from './config';
import {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    VerifyCodeRequest,
    VerifyCodeResponse,
    ResendCodeResponse
} from './types';
import { getDeviceId } from "@/lib/utils/deviceInfo";

export const authApi = {
    // Login with email and password
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await client.post(AUTH_ENDPOINTS.LOGIN, data);
        return response.data;
    },

    // Register a new user
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await client.post(AUTH_ENDPOINTS.REGISTER, data);
        return response.data;
    },

    // Verify account with verification code
    verifyCode: async (data: VerifyCodeRequest): Promise<VerifyCodeResponse> => {
        const response = await client.post(AUTH_ENDPOINTS.VERIFY_CODE, data);
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