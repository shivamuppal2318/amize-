import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { socketManager } from '@/lib/socket/socketManager';

export const useSocketInitialization = () => {
    const { isAuthenticated, user } = useAuth();
    const initializationAttempted = useRef(false);
    const appStateRef = useRef(AppState.currentState);

    // Initialize socket when user becomes authenticated
    useEffect(() => {
        if (isAuthenticated && user && !initializationAttempted.current) {
            initializationAttempted.current = true;

            console.log('[Socket] Initializing socket manager for user:', user.username);
            socketManager.initialize().catch(error => {
                console.error('[Socket] Failed to initialize:', error);
                initializationAttempted.current = false; // Allow retry
            });
        } else if (!isAuthenticated && initializationAttempted.current) {
            // Clean up when user logs out
            console.log('[Socket] Cleaning up socket connection');
            socketManager.cleanup();
            initializationAttempted.current = false;
        }
    }, [isAuthenticated, user]);

    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came to foreground
                if (isAuthenticated && user) {
                    console.log('[Socket] App became active, reconnecting socket');
                    socketManager.initialize();
                }
            } else if (nextAppState.match(/inactive|background/)) {
                // App went to background
                console.log('[Socket] App went to background');
                socketManager.updateStatus(false);
            }
            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [isAuthenticated, user]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (initializationAttempted.current) {
                socketManager.cleanup();
            }
        };
    }, []);
};