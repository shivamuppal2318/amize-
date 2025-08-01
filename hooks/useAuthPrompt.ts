import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';

interface AuthPromptState {
    visible: boolean;
    action: string;
    context?: any; // Additional context about the action
}

interface UseAuthPromptReturn {
    // State
    authPrompt: AuthPromptState;

    // Actions
    requireAuth: (action: string, callback?: () => void, context?: any) => boolean;
    showAuthPrompt: (action: string, context?: any) => void;
    hideAuthPrompt: () => void;
    handleLogin: () => void;
    handleSignup: () => void;

    // Utilities
    isAuthenticated: boolean;
    withAuth: <T extends any[]>(callback: (...args: T) => void) => (...args: T) => void;
}

/**
 * Hook to manage authentication prompts and auth-required actions
 *
 * Usage:
 * ```
 * const { requireAuth, authPrompt, hideAuthPrompt } = useAuthPrompt();
 *
 * const handleLike = () => {
 *   if (requireAuth('like', () => {
 *     // This callback runs if user is authenticated
 *     performLikeAction();
 *   })) {
 *     return; // Auth prompt was shown
 *   }
 * };
 * ```
 */
export const useAuthPrompt = (): UseAuthPromptReturn => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const [authPrompt, setAuthPrompt] = useState<AuthPromptState>({
        visible: false,
        action: '',
        context: undefined,
    });

    // Show authentication prompt
    const showAuthPrompt = useCallback((action: string, context?: any) => {
        setAuthPrompt({
            visible: true,
            action,
            context,
        });
    }, []);

    // Hide authentication prompt
    const hideAuthPrompt = useCallback(() => {
        setAuthPrompt({
            visible: false,
            action: '',
            context: undefined,
        });
    }, []);

    // Handle login navigation
    const handleLogin = useCallback(() => {
        hideAuthPrompt();
        router.push('/(auth)/sign-in');
    }, [hideAuthPrompt, router]);

    // Handle signup navigation
    const handleSignup = useCallback(() => {
        hideAuthPrompt();
        router.push('/(auth)/get-started');
    }, [hideAuthPrompt, router]);

    // Main function to require authentication for an action
    const requireAuth = useCallback((
        action: string,
        callback?: () => void,
        context?: any
    ): boolean => {
        if (isAuthenticated) {
            // User is authenticated, execute callback immediately
            if (callback) {
                callback();
            }
            return false; // No auth prompt shown
        } else {
            // User is not authenticated, show prompt
            showAuthPrompt(action, context);
            return true; // Auth prompt was shown
        }
    }, [isAuthenticated, showAuthPrompt]);

    // Higher-order function to wrap callbacks with auth requirement
    const withAuth = useCallback(<T extends any[]>(
        callback: (...args: T) => void
    ) => {
        return (...args: T) => {
            if (isAuthenticated) {
                callback(...args);
            } else {
                showAuthPrompt('action');
            }
        };
    }, [isAuthenticated, showAuthPrompt]);

    return {
        // State
        authPrompt,

        // Actions
        requireAuth,
        showAuthPrompt,
        hideAuthPrompt,
        handleLogin,
        handleSignup,

        // Utilities
        isAuthenticated,
        withAuth,
    };
};

// Specific auth prompt hooks for common actions
export const useAuthActions = () => {
    const { requireAuth, isAuthenticated } = useAuthPrompt();

    return {
        isAuthenticated,

        // Common action wrappers
        requireAuthForLike: (callback: () => void) =>
            requireAuth('like', callback),

        requireAuthForComment: (callback: () => void) =>
            requireAuth('comment', callback),

        requireAuthForShare: (callback: () => void) =>
            requireAuth('share', callback),

        requireAuthForFollow: (callback: () => void) =>
            requireAuth('follow', callback),

        requireAuthForBookmark: (callback: () => void) =>
            requireAuth('bookmark', callback),

        requireAuthForReport: (callback: () => void) =>
            requireAuth('report', callback),
    };
};

// Context-aware auth prompt hook for specific features
export const useFeatureAuth = (featureName: string) => {
    const { requireAuth, authPrompt, hideAuthPrompt, handleLogin, handleSignup, isAuthenticated } = useAuthPrompt();

    const requireFeatureAuth = useCallback((
        action: string,
        callback?: () => void
    ) => {
        return requireAuth(
            action,
            callback,
            { feature: featureName }
        );
    }, [requireAuth, featureName]);

    return {
        isAuthenticated,
        requireFeatureAuth,
        authPrompt,
        hideAuthPrompt,
        handleLogin,
        handleSignup,
    };
};

export default useAuthPrompt;