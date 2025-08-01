import { useEffect, useCallback, useRef } from 'react';
import { socketManager } from '@/lib/socket/socketManager';
import { useNotifications } from '@/context/NotificationContext';
import {
    Notification,
    NotificationReceivedHandler,
    NotificationCountUpdatedHandler,
} from '@/lib/socket/socketEvents';

export interface UseRealTimeNotificationsOptions {
    onNotificationReceived?: (notification: Notification) => void;
    onNotificationCountUpdated?: (unreadCount: number) => void;
}

export interface UseRealTimeNotificationsReturn {
    fetchNotifications: (page?: number, limit?: number) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    updateSettings: (settings: any) => Promise<void>;
}

export const useRealTimeNotifications = (
    options: UseRealTimeNotificationsOptions = {}
): UseRealTimeNotificationsReturn => {
    const {
        onNotificationReceived,
        onNotificationCountUpdated,
    } = options;

    const {
        addNotification,
        updateNotificationReadStatus,
        setUnreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updateSettings,
    } = useNotifications();

    const listenersRegistered = useRef(false);
    const unsubscribeFunctions = useRef<Array<() => void>>([]);

    // 🔥 EXACT SAME pattern as useRealTimeMessages handlers
    const handleNotificationReceived = useCallback<NotificationReceivedHandler>((data) => {
        console.log('🔥 [useRealTimeNotifications] NOTIFICATION_RECEIVED HANDLER CALLED:', data);

        const { notification } = data;

        try {
            // Call custom handler if provided
            onNotificationReceived?.(notification);

            console.log('✅ [useRealTimeNotifications] Notification received handler completed');
        } catch (error) {
            console.error('❌ [useRealTimeNotifications] Error processing received notification:', error);
        }
    }, [onNotificationReceived]);

    const handleNotificationCountUpdated = useCallback<NotificationCountUpdatedHandler>((data) => {
        console.log('🔥 [useRealTimeNotifications] NOTIFICATION_COUNT_UPDATED HANDLER CALLED:', data);
        const { unreadCount } = data;

        // Call custom handler if provided
        onNotificationCountUpdated?.(unreadCount);
        console.log('✅ [useRealTimeNotifications] Notification count updated processed');
    }, [onNotificationCountUpdated]);

    // 🔥 EXACT SAME listener setup pattern as useRealTimeMessages
    useEffect(() => {
        console.log('🔧 [useRealTimeNotifications] Setting up socketManager event listeners...');

        // Clean up any existing listeners first
        unsubscribeFunctions.current.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.error('[useRealTimeNotifications] Error during unsubscribe:', error);
            }
        });
        unsubscribeFunctions.current = [];

        if (listenersRegistered.current) {
            console.log('⚠️ [useRealTimeNotifications] Listeners already registered, skipping');
            return;
        }

        console.log('🔧 [useRealTimeNotifications] Registering socketManager event handlers...');

        // Register event handlers through socketManager - EXACT same pattern
        const unsubscribers = [
            socketManager.onNotificationReceived(handleNotificationReceived),
            socketManager.onNotificationCountUpdated(handleNotificationCountUpdated),
        ];

        unsubscribeFunctions.current = unsubscribers;
        listenersRegistered.current = true;

        return () => {
            unsubscribers.forEach((unsubscribe, index) => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error(`❌ [useRealTimeNotifications] Error unsubscribing handler ${index + 1}:`, error);
                }
            });
            listenersRegistered.current = false;
        };
    }, [handleNotificationReceived, handleNotificationCountUpdated]);

    // 🔥 EXACT SAME connection monitoring as useRealTimeMessages
    useEffect(() => {
        const handleConnectionStatusChange = (status: any) => {
            console.log('🔌 [useRealTimeNotifications] Connection status changed:', status);
            if (status.isConnected && !listenersRegistered.current) {
                console.log('🔄 [useRealTimeNotifications] Reconnected, will re-register listeners on next effect run');
                listenersRegistered.current = false;
            }
        };

        const unsubscribe = socketManager.onConnectionStateChange(handleConnectionStatusChange);

        return () => {
            unsubscribe();
        };
    }, []);

    // 🔥 EXACT SAME cleanup pattern as useRealTimeMessages
    useEffect(() => {
        return () => {
            // Clean up all listeners
            unsubscribeFunctions.current.forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error('[useRealTimeNotifications] Error during cleanup:', error);
                }
            });
            unsubscribeFunctions.current = [];
            listenersRegistered.current = false;
        };
    }, []);

    return {
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updateSettings,
    };
};