// hooks/useSocket.ts - Updated to use centralized connection state
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from "@/hooks/useAuth";
import { socketManager } from '@/lib/socket/socketManager';
import { ConnectionStatus, ConnectionState, connectionStateManager } from '@/types/messaging';

export interface UseSocketReturn {
    isConnected: boolean;
    connectionStatus: ConnectionStatus; // Unified connection status
    connectionState: ConnectionState; // For backward compatibility
    reconnect: () => Promise<void>;
    disconnect: () => void;
    reconnectAttempts: number;
    lastConnectedAt?: string;
    error?: string;
}

export const useSocket = (): UseSocketReturn => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
        connectionStateManager.getStatus()
    );
    const { isAuthenticated, user } = useAuth();
    const appState = useRef(AppState.currentState);
    const isInitialized = useRef(false);

    // Handle app state changes (background/foreground)
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            console.log('[useSocket] App state changed:', appState.current, '->', nextAppState);

            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came to foreground
                if (isAuthenticated && !connectionStatus.isConnected) {
                    console.log('[useSocket] App foregrounded, reconnecting socket');
                    socketManager.initialize().catch(error => {
                        console.error('[useSocket] Failed to reconnect on foreground:', error);
                    });
                }
            } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
                // App went to background
                console.log('[useSocket] App backgrounded');
                // Note: We don't disconnect on background to maintain real-time updates
                // The socket will handle connection lifecycle automatically
            }

            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [isAuthenticated, connectionStatus.isConnected]);

    // Initialize socket when user is authenticated
    useEffect(() => {
        if (isAuthenticated && user && !isInitialized.current) {
            console.log('[useSocket] Initializing socket for authenticated user', {
                username: user.username,
                userId: user.id
            });
            isInitialized.current = true;

            socketManager.initialize().catch(error => {
                console.error('[useSocket] Failed to initialize socket:', error);
                isInitialized.current = false;
            });
        } else if (!isAuthenticated && isInitialized.current) {
            console.log('[useSocket] User logged out, cleaning up socket');
            isInitialized.current = false;
            socketManager.cleanup();
        }
    }, [isAuthenticated, user]);

    // Subscribe to centralized connection state changes
    useEffect(() => {
        console.log('[useSocket] Setting up connection state listener');

        const unsubscribe = connectionStateManager.subscribe((status) => {
            console.log('[useSocket] Connection status updated:', {
                state: status.state,
                isConnected: status.isConnected,
                reconnectAttempts: status.reconnectAttempts,
                error: status.error
            });
            setConnectionStatus(status);
        });

        return () => {
            console.log('[useSocket] Cleaning up connection state listener');
            unsubscribe();
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isInitialized.current) {
                console.log('[useSocket] Cleaning up socket on unmount');
                socketManager.cleanup();
                isInitialized.current = false;
            }
        };
    }, []);

    // Manual reconnect function
    const reconnect = async (): Promise<void> => {
        console.log('[useSocket] Manual reconnect requested', {
            currentState: connectionStatus.state,
            isAuthenticated,
            hasUser: !!user
        });

        if (!isAuthenticated || !user) {
            console.warn('[useSocket] Cannot reconnect - user not authenticated');
            return;
        }

        try {
            // Reset connection state and reinitialize
            isInitialized.current = false;
            await socketManager.cleanup();

            isInitialized.current = true;
            await socketManager.initialize();

            console.log('[useSocket] Manual reconnect completed successfully');
        } catch (error) {
            console.error('[useSocket] Manual reconnect failed:', error);
            isInitialized.current = false;
            throw error;
        }
    };

    // Manual disconnect function
    const disconnect = (): void => {
        console.log('[useSocket] Manual disconnect requested');
        isInitialized.current = false;
        socketManager.cleanup();
    };

    // Debug logging for state changes
    useEffect(() => {
        console.log('[useSocket] Hook state update:', {
            isConnected: connectionStatus.isConnected,
            state: connectionStatus.state,
            reconnectAttempts: connectionStatus.reconnectAttempts,
            isAuthenticated,
            isInitialized: isInitialized.current,
            error: connectionStatus.error
        });
    }, [connectionStatus, isAuthenticated]);

    return {
        isConnected: connectionStatus.isConnected,
        connectionStatus, // Full unified status object
        connectionState: connectionStatus.state, // For backward compatibility
        reconnect,
        disconnect,
        reconnectAttempts: connectionStatus.reconnectAttempts,
        lastConnectedAt: connectionStatus.lastConnectedAt,
        error: connectionStatus.error,
    };
};

export default useSocket;