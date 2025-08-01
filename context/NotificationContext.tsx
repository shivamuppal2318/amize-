import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { socketManager } from '@/lib/socket/socketManager';
import { Notification, NotificationSettings } from '@/lib/socket/socketEvents';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';

const log = (level: 'info' | 'error' | 'debug' | 'success', message: string, data?: any) => {
    const emoji = { info: 'ℹ️', error: '❌', debug: '🐛', success: '✅' };
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${emoji[level]} [${timestamp}] [NotificationContext] ${message}`, data || '');
};

const defaultSettings: NotificationSettings = {
    follows: true,
    messages: true,
    likes: true,
    comments: true,
    mentions: true,
    pushNotifications: true
};

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    settings: NotificationSettings;

    fetchNotifications: (page?: number, limit?: number) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    clearError: () => void;
    updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
    refreshSettings: () => Promise<void>;
    getNotificationsByType: (type: string) => Notification[];
    getUnreadNotifications: () => Notification[];
    hasUnreadNotifications: () => boolean;

    // System notification functions
    requestNotificationPermissions: () => Promise<boolean>;
    checkNotificationPermissions: () => Promise<boolean>;

    // Internal functions - SAME pattern as MessageContext
    addNotification: (notification: Notification) => void;
    updateNotificationReadStatus: (notificationId: string, isRead: boolean) => void;
    setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    settings: defaultSettings,
    fetchNotifications: async () => {},
    markAsRead: async () => {},
    markAllAsRead: async () => {},
    deleteNotification: async () => {},
    clearError: () => {},
    updateSettings: async () => {},
    refreshSettings: async () => {},
    getNotificationsByType: () => [],
    getUnreadNotifications: () => [],
    hasUnreadNotifications: () => false,
    requestNotificationPermissions: async () => false,
    checkNotificationPermissions: async () => false,
    addNotification: () => {},
    updateNotificationReadStatus: () => {},
    setUnreadCount: () => {},
});

export const NotificationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    // 🔥 SAME state pattern as MessageContext
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

    const { user, isAuthenticated } = useAuth();

    // 🔥 SAME ref pattern as MessageContext
    const socketInitialized = useRef(false);
    const listenersRegistered = useRef(false);
    const unsubscribeFunctions = useRef<Array<() => void>>([]);

    // 🔥 NEW: Use system notifications hook
    const systemNotifications = useSystemNotifications({
        enableBadgeCount: true,
        enableNavigationOnTap: true,
        onNotificationTap: (data) => {
            log('info', 'System notification tapped', {
                type: data.type,
                notificationId: data.notificationId
            });
        }
    });

    // 🔥 ENHANCED notification handlers - Following message pattern exactly
    const handleNotificationReceived = useCallback((data: { notification: Notification }) => {
        if (!user) {
            log('error', 'No user available for notification received');
            return;
        }

        log('success', 'Notification received via socket', {
            id: data.notification.id,
            type: data.notification.type,
            message: data.notification.message?.substring(0, 50),
            isRead: data.notification.isRead,
            userId: data.notification.userId,
            currentUserId: user.id
        });

        try {
            const { notification } = data;

            // Add to notifications list - SAME pattern as messages
            setNotifications(prev => {
                const exists = prev.find(n => n.id === notification.id);
                if (exists) {
                    log('debug', 'Notification already exists, updating', { id: notification.id });
                    return prev.map(n => n.id === notification.id ? notification : n);
                }

                const updated = [notification, ...prev];
                log('success', 'New notification added to list', {
                    total: updated.length,
                    unread: updated.filter(n => !n.isRead).length
                });
                return updated;
            });

            // Update unread count if notification is unread - SAME pattern as messages
            if (!notification.isRead) {
                setUnreadCount(prev => {
                    const newCount = prev + 1;
                    log('info', 'Unread count incremented', { from: prev, to: newCount });
                    return newCount;
                });
            }

            // 🔥 UPDATED: Show system notification instead of alert
            showSystemNotification(notification);

            log('success', 'Notification processed successfully');
        } catch (error) {
            log('error', 'Error processing received notification', error);
        }
    }, [user]);

    const handleNotificationCountUpdated = useCallback((data: { unreadCount: number }) => {
        log('info', 'Unread count updated via socket', data);
        setUnreadCount(data.unreadCount);
    }, []);

    // 🔥 NEW: Show system notification function
    const showSystemNotification = useCallback(async (notification: Notification) => {
        if (!notification || notification.type === 'system') {
            return; // Skip system notifications or invalid notifications
        }

        try {
            log('info', 'Showing system notification', {
                id: notification.id,
                type: notification.type,
                message: notification.message?.substring(0, 50)
            });

            // Use the system notification service
            await systemNotifications.showNotification(notification);

            log('success', 'System notification displayed');
        } catch (error) {
            log('error', 'Failed to show system notification', error);
            // Fallback: could show in-app notification or ignore
        }
    }, [systemNotifications]);

    // 🔥 SOCKET INITIALIZATION - Following EXACT message pattern
    useEffect(() => {
        if (isAuthenticated && user && !socketInitialized.current) {
            log('info', 'Initializing socket connection for notifications', {
                username: user.username,
                userId: user.id
            });
            socketInitialized.current = true;

            socketManager.initialize()
                .then(() => {
                    log('success', 'Socket initialized successfully for notifications');
                })
                .catch(error => {
                    log('error', 'Socket initialization failed for notifications', error);
                    socketInitialized.current = false;
                    setError('Failed to connect to notification service');
                });
        } else if (!isAuthenticated && socketInitialized.current) {
            log('info', 'User logged out, cleaning up notification socket');
            socketManager.cleanup();
            socketInitialized.current = false;

            // Clear all data - SAME pattern as messages
            setNotifications([]);
            setUnreadCount(0);
            setError(null);
            setSettings(defaultSettings);
        }
    }, [isAuthenticated, user]);

    // 🔥 LISTENER SETUP - Following EXACT message pattern from useRealTimeMessages
    useEffect(() => {
        if (!isAuthenticated || !user || listenersRegistered.current) {
            return;
        }

        log('info', 'Setting up notification socket listeners', {
            username: user.username,
            userId: user.id
        });

        // Clean up any existing listeners - SAME pattern as messages
        unsubscribeFunctions.current.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                log('error', 'Error during unsubscribe', error);
            }
        });
        unsubscribeFunctions.current = [];

        if (listenersRegistered.current) {
            log('info', 'Listeners already registered, skipping');
            return;
        }

        log('info', 'Registering notification socket event handlers...');

        // 🔥 EXACT SAME pattern as useRealTimeMessages
        const unsubscribers = [
            socketManager.onNotificationReceived(handleNotificationReceived),
            socketManager.onNotificationCountUpdated(handleNotificationCountUpdated),
        ];

        unsubscribeFunctions.current = unsubscribers;
        listenersRegistered.current = true;

        log('success', 'Notification socket listeners registered successfully');

        // Fetch initial data - SAME as messages
        fetchNotifications(1, 20);
        refreshSettings();

        return () => {
            log('info', 'Cleaning up notification socket listeners');
            unsubscribers.forEach((unsubscribe, index) => {
                try {
                    unsubscribe();
                } catch (error) {
                    log('error', `Error unsubscribing notification handler ${index + 1}:`, error);
                }
            });
            unsubscribeFunctions.current = [];
            listenersRegistered.current = false;
        };
    }, [isAuthenticated, user, handleNotificationReceived, handleNotificationCountUpdated]);

    // 🔥 CONNECTION MONITORING - Following message pattern
    useEffect(() => {
        const handleConnectionStatusChange = (status: any) => {
            log('info', 'Connection status changed for notifications', status);

            if (status.isConnected && isAuthenticated && user) {
                log('info', 'Connected! Refreshing notifications');
                fetchNotifications(1, 20).catch(error => {
                    log('error', 'Failed to refresh notifications on connect', error);
                });
            }

            // Update error state based on connection - SAME as messages
            if (status.state === 'error' && status.error) {
                setError(status.error);
            } else if (status.isConnected) {
                setError(null);
            }
        };

        const unsubscribe = socketManager.onConnectionStateChange(handleConnectionStatusChange);
        return unsubscribe;
    }, [isAuthenticated, user]);

    // 🔥 FETCH NOTIFICATIONS - Enhanced with retry logic
    const fetchNotifications = useCallback(async (page: number = 1, limit: number = 20) => {
        if (!isAuthenticated || !user) {
            log('error', 'Cannot fetch notifications - not authenticated');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            log('info', 'Fetching notifications from server', { page, limit });

            const response = await socketManager.getNotifications(page, limit);
            log('debug', 'Server response received', { success: response.success });

            if (response.success) {
                const { notifications: fetchedNotifications, unreadCount: fetchedUnreadCount } = response;

                if (page === 1) {
                    setNotifications(fetchedNotifications || []);
                    log('success', 'Notifications replaced (page 1)', {
                        count: fetchedNotifications?.length || 0
                    });
                } else {
                    setNotifications(prev => {
                        const updated = [...prev, ...(fetchedNotifications || [])];
                        log('success', 'Notifications appended', {
                            previous: prev.length,
                            added: fetchedNotifications?.length || 0,
                            total: updated.length
                        });
                        return updated;
                    });
                }

                setUnreadCount(fetchedUnreadCount || 0);
                log('success', 'Notifications fetch completed', {
                    count: fetchedNotifications?.length || 0,
                    unreadCount: fetchedUnreadCount || 0
                });
            } else {
                throw new Error(response.error || 'Failed to fetch notifications');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
            log('error', 'Error fetching notifications', error);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    // 🔥 MARK AS READ - Following message pattern
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!isAuthenticated || !user) {
            log('error', 'Cannot mark notification as read - not authenticated');
            return;
        }

        try {
            log('info', 'Marking notification as read', { notificationId });

            const response = await socketManager.markNotificationRead(notificationId);

            if (response?.success) {
                // Update local state - SAME pattern as messages
                setNotifications(prev =>
                    prev.map(notification =>
                        notification.id === notificationId
                            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                            : notification
                    )
                );

                if (response.unreadCount !== undefined) {
                    setUnreadCount(response.unreadCount);
                }

                log('success', 'Notification marked as read', {
                    notificationId,
                    newUnreadCount: response.unreadCount
                });
            } else {
                throw new Error(response?.error || 'Failed to mark notification as read');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
            log('error', 'Error marking notification as read', error);
            setError(errorMessage);
        }
    }, [isAuthenticated, user]);

    // Other methods with enhanced logging
    const markAllAsRead = useCallback(async () => {
        if (!isAuthenticated || !user) return;

        try {
            log('info', 'Marking all notifications as read');
            const response = await socketManager.markAllNotificationsRead();

            if (response?.success) {
                setNotifications(prev =>
                    prev.map(notification => ({
                        ...notification,
                        isRead: true,
                        readAt: new Date().toISOString()
                    }))
                );
                setUnreadCount(0);
                log('success', 'All notifications marked as read');

                // Clear badge when all notifications are read
                await systemNotifications.clearBadge();
            } else {
                throw new Error(response?.error || 'Failed to mark all notifications as read');
            }
        } catch (error) {
            log('error', 'Error marking all notifications as read', error);
            setError(error instanceof Error ? error.message : 'Failed to mark all notifications as read');
        }
    }, [isAuthenticated, user, systemNotifications]);

    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!isAuthenticated || !user) return;

        try {
            log('info', 'Deleting notification', { notificationId });
            const response = await socketManager.deleteNotification(notificationId);

            if (response?.success) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                if (response.unreadCount !== undefined) {
                    setUnreadCount(response.unreadCount);
                }
                log('success', 'Notification deleted', { notificationId });
            } else {
                throw new Error(response?.error || 'Failed to delete notification');
            }
        } catch (error) {
            log('error', 'Error deleting notification', error);
            setError(error instanceof Error ? error.message : 'Failed to delete notification');
        }
    }, [isAuthenticated, user]);

    const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
        if (!isAuthenticated || !user) return;

        try {
            log('info', 'Updating notification settings', newSettings);
            const updatedSettings = { ...settings, ...newSettings };
            const response = await socketManager.updateNotificationSettings(updatedSettings);

            if (response?.success) {
                setSettings(updatedSettings);
                log('success', 'Notification settings updated');
            } else {
                throw new Error(response?.error || 'Failed to update notification settings');
            }
        } catch (error) {
            log('error', 'Error updating notification settings', error);
            setError(error instanceof Error ? error.message : 'Failed to update notification settings');
        }
    }, [isAuthenticated, user, settings]);

    const refreshSettings = useCallback(async () => {
        if (!isAuthenticated || !user) return;

        try {
            log('info', 'Refreshing notification settings');
            const response = await socketManager.getNotificationSettings();

            if (response?.success && response.settings) {
                setSettings(response.settings);
                log('success', 'Notification settings refreshed');
            }
        } catch (error) {
            log('error', 'Error refreshing notification settings', error);
        }
    }, [isAuthenticated, user]);

    const requestNotificationPermissions = useCallback(async (): Promise<boolean> => {
        try {
            log('info', 'Requesting notification permissions');
            const granted = await systemNotifications.requestPermissions();
            log(granted ? 'success' : 'error', 'Permission request result', { granted });
            return granted;
        } catch (error) {
            log('error', 'Error requesting permissions', error);
            return false;
        }
    }, [systemNotifications]);

    const checkNotificationPermissions = useCallback(async (): Promise<boolean> => {
        try {
            const granted = await systemNotifications.checkPermissions();
            log('info', 'Permission check result', { granted });
            return granted;
        } catch (error) {
            log('error', 'Error checking permissions', error);
            return false;
        }
    }, [systemNotifications]);

    // Utility functions - SAME pattern as messages
    const getNotificationsByType = useCallback((type: string) => {
        return notifications.filter(notification => notification.type === type);
    }, [notifications]);

    const getUnreadNotifications = useCallback(() => {
        return notifications.filter(notification => !notification.isRead);
    }, [notifications]);

    const hasUnreadNotifications = useCallback(() => {
        return unreadCount > 0;
    }, [unreadCount]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Internal functions for socket integration - SAME pattern as messages
    const addNotification = useCallback((notification: Notification) => {
        log('success', 'Adding notification to list', {
            id: notification.id,
            type: notification.type,
            message: notification.message?.substring(0, 50)
        });

        setNotifications(prev => {
            const exists = prev.find(n => n.id === notification.id);
            if (exists) {
                log('debug', 'Notification already exists, skipping', { id: notification.id });
                return prev;
            }

            const updated = [notification, ...prev];
            log('success', 'New notification added', { total: updated.length });
            return updated;
        });

        if (!notification.isRead) {
            setUnreadCount(prev => {
                const newCount = prev + 1;
                log('info', 'Unread count incremented via addNotification', { from: prev, to: newCount });
                return newCount;
            });
        }
    }, []);

    const updateNotificationReadStatus = useCallback((notificationId: string, isRead: boolean) => {
        log('info', 'Updating notification read status', { notificationId, isRead });
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, isRead, readAt: isRead ? new Date().toISOString() : undefined }
                    : notification
            )
        );
    }, []);

    // Cleanup on unmount - SAME pattern as messages
    useEffect(() => {
        return () => {
            if (socketInitialized.current) {
                log('info', 'Cleaning up on unmount');
                socketManager.cleanup();
                socketInitialized.current = false;
            }
        };
    }, []);

    const contextValue: NotificationContextType = {
        notifications,
        unreadCount,
        loading,
        error,
        settings,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearError,
        updateSettings,
        refreshSettings,
        getNotificationsByType,
        getUnreadNotifications,
        hasUnreadNotifications,
        requestNotificationPermissions,
        checkNotificationPermissions,
        addNotification,
        updateNotificationReadStatus,
        setUnreadCount,
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationProvider;