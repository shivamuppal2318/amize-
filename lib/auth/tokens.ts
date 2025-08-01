import { secureStorage, STORAGE_KEYS } from './storage';
import { authApi } from '../api/auth';
import { TokenPair } from './types';

// Get tokens from secure storage
export const getTokens = async (): Promise<TokenPair | null> => {
    const accessToken = await secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await secureStorage.get(STORAGE_KEYS.REFRESH_TOKEN);

    if (!accessToken || !refreshToken) {
        return null;
    }

    return { accessToken, refreshToken };
};

// Store tokens in secure storage
export const storeTokens = async (tokens: TokenPair): Promise<void> => {
    await secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await secureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
};

// Remove tokens from secure storage
export const removeTokens = async (): Promise<void> => {
    await secureStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    await secureStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
};

// Validate if current tokens exist and are properly formatted
export const validateTokens = async (): Promise<boolean> => {
    try {
        const tokens = await getTokens();
        return tokens !== null &&
            typeof tokens.accessToken === 'string' &&
            tokens.accessToken.length > 0 &&
            typeof tokens.refreshToken === 'string' &&
            tokens.refreshToken.length > 0;
    } catch {
        return false;
    }
};

// Check if user has valid authentication (tokens exist)
export const isTokenAuthenticated = async (): Promise<boolean> => {
    return await validateTokens();
};

// Refresh tokens using refresh token with proper error handling
export const refreshTokens = async (): Promise<TokenPair> => {
    const currentTokens = await getTokens();

    if (!currentTokens?.refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await authApi.refreshToken(currentTokens.refreshToken);

        if (response.success && response.token && response.refreshToken) {
            // Ensure we have valid strings for tokens
            const newTokens: TokenPair = {
                accessToken: response.token,
                refreshToken: response.refreshToken
            };

            await storeTokens(newTokens);
            return newTokens;
        } else {
            throw new Error('Token refresh failed - invalid response');
        }
    } catch (error) {
        // If refresh fails, clear all tokens
        await removeTokens();
        throw error;
    }
};

// Attempt to refresh tokens if they exist, otherwise return false
export const tryRefreshTokens = async (): Promise<boolean> => {
    try {
        await refreshTokens();
        return true;
    } catch (error) {
        console.log('Token refresh failed:', error);
        return false;
    }
};

// Clear all authentication data
export const clearAuthData = async (): Promise<void> => {
    await removeTokens();
    await secureStorage.clearMultiple([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.SIGNUP_FLOW,
    ]);
};