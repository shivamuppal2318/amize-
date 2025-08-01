import { useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { notificationService, LocalNotificationData } from '@/lib/notifications/NotificationService';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/context/NotificationContext';

export interface UseSystemNotificationsOptions {
    enableBadgeCount?: boolean;
    enableNavigationOnTap?: boolean;
    onNotificationTap?: (data: LocalNotificationData) => void;
}

export const useSystemNotifications = (options: UseSystemNotificationsOptions = {}) => {
    const {
        enableBadgeCount = true,
        enableNavigationOnTap = true,
        onNotificationTap
    } = options;

    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { unreadCount, markAsRead } = useNotifications();
    const isInitialized = useRef(false);

    // Initialize notification service
    useEffect(() => {
        if (isAuthenticated && !isInitialized.current) {
            console.log('📱 [useSystemNotifications] Initializing notification service...');

            notificationService.initialize()
                .then((success) => {
                    if (success) {
                        isInitialized.current = true;
                        console.log('✅ [useSystemNotifications] Notification service initialized');
                    } else {
                        console.warn('⚠️ [useSystemNotifications] Failed to initialize notification service');
                    }
                })
                .catch((error) => {
                    console.error('❌ [useSystemNotifications] Initialization error:', error);
                });
        }
    }, [isAuthenticated]);

    // Handle notification tap navigation
    const handleNotificationTap = useCallback(async (response: Notifications.NotificationResponse) => {
        const data = response.notification.request.content.data as LocalNotificationData;

        if (!data) {
            console.warn('⚠️ [useSystemNotifications] No data in notification response');
            return;
        }

        console.log('📱 [useSystemNotifications] Handling notification tap:', {
            type: data.type,
            notificationId: data.notificationId,
            actionIdentifier: response.actionIdentifier
        });

        // Mark notification as read if we have the ID
        if (data.notificationId) {
            try {
                await markAsRead(data.notificationId);
                console.log('✅ [useSystemNotifications] Marked notification as read:', data.notificationId);
            } catch (error) {
                console.error('❌ [useSystemNotifications] Failed to mark as read:', error);
            }
        }

        // Call custom handler if provided
        if (onNotificationTap) {
            try {
                onNotificationTap(data);
            } catch (error) {
                console.error('❌ [useSystemNotifications] Error in custom tap handler:', error);
            }
        }

        // Navigate based on the notification type
        if (enableNavigationOnTap) {
            navigateBasedOnNotification(data);
        }
    }, [markAsRead, onNotificationTap, enableNavigationOnTap]);

    // Navigation logic based on notification type
    const navigateBasedOnNotification = useCallback((data: LocalNotificationData) => {
        try {
            switch (data.type) {
                case 'message':
                    // Navigate to messages/conversation
                    if (data.conversationId) {
                        router.push(`/(tabs)/inbox/${data.conversationId}`);
                    } else if (data.userId) {
                        router.push(`/(tabs)/inbox?userId=${data.userId}`);
                    } else {
                        router.push('/(tabs)/inbox');
                    }
                    break;

                case 'follow':
                    // Navigate to follower's profile
                    if (data.userId) {
                        router.push(`/profile/${data.userId}`);
                    } else {
                        router.push('/(tabs)/profile'); // Current user profile to see followers
                    }
                    break;

                case 'like':
                case 'comment':
                    // Navigate to the post
                    if (data.videoId) {
                        router.push(`/post/${data.videoId}`);
                    } else {
                        router.push('/(tabs)/profile'); // Fallback to profile
                    }
                    break;

                case 'mention':
                    // Navigate to the post where user was mentioned
                    if (data.videoId) {
                        router.push(`/post/${data.videoId}`);
                    } else {
                        router.push('/(tabs)'); // Fallback to home
                    }
                    break;

                case 'system':
                default:
                    // Navigate to notifications or settings
                    router.push('/(tabs)/profile?tab=notifications');
                    break;
            }

            console.log('✅ [useSystemNotifications] Navigation completed for type:', data.type);
        } catch (error) {
            console.error('❌ [useSystemNotifications] Navigation error:', error);
            // Fallback to home
            router.push('/(tabs)');
        }
    }, [router]);

    // Setup notification response handlers
    useEffect(() => {
        if (!isAuthenticated || !isInitialized.current) return;

        console.log('📱 [useSystemNotifications] Setting up notification handlers...');

        // Handle notification taps when app is running
        const subscription = notificationService.setupNotificationHandlers(handleNotificationTap);

        // ✅ FIXED: Check for notification that opened the app (with iOS compatibility)
        const checkInitialNotification = async () => {
            try {
                const response = await notificationService.getInitialNotification();
                if (response) {
                    console.log('📱 [useSystemNotifications] App opened from notification:', {
                        type: response.notification.request.content.data?.type,
                        notificationId: response.notification.request.content.data?.notificationId,
                    });

                    // Small delay to ensure the app is fully loaded
                    setTimeout(() => {
                        handleNotificationTap(response);
                    }, 1000);
                }
            } catch (error) {
                // This is expected on iOS, so don't log as error
                console.log('📱 [useSystemNotifications] Initial notification check not available on this platform');
            }
        };

        checkInitialNotification();

        return subscription;
    }, [isAuthenticated, isInitialized.current, handleNotificationTap]);

    // Update badge count when unread count changes
    useEffect(() => {
        if (!enableBadgeCount || !isInitialized.current) return;

        console.log('📱 [useSystemNotifications] Updating badge count:', unreadCount);

        notificationService.updateBadgeCount(unreadCount)
            .catch((error) => {
                console.error('❌ [useSystemNotifications] Failed to update badge count:', error);
            });
    }, [unreadCount, enableBadgeCount, isInitialized.current]);

    // ✅ NEW: Handle app state changes for better notification management
    useEffect(() => {
        if (!isAuthenticated || !isInitialized.current) return;

        // Listen for when the app comes to foreground
        const subscription = Notifications.addNotificationReceivedListener((notification) => {
            console.log('📱 [useSystemNotifications] Notification received while app is open:', {
                title: notification.request.content.title,
                body: notification.request.content.body,
                type: notification.request.content.data?.type,
            });

            // Optionally handle notifications received while app is in foreground
            // You might want to show an in-app notification or update the badge
        });

        return () => subscription.remove();
    }, [isAuthenticated, isInitialized.current]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isInitialized.current) {
                console.log('📱 [useSystemNotifications] Cleaning up...');
                // Clear badge on cleanup if desired
                if (enableBadgeCount) {
                    notificationService.clearBadge().catch(console.error);
                }
            }
        };
    }, [enableBadgeCount]);

    // Return utility functions
    return {
        // Notification service functions
        showNotification: notificationService.showNotification.bind(notificationService),
        updateBadgeCount: notificationService.updateBadgeCount.bind(notificationService),
        clearBadge: notificationService.clearBadge.bind(notificationService),
        clearAllNotifications: notificationService.clearAllNotifications.bind(notificationService),

        // Permission functions
        checkPermissions: notificationService.checkPermissions.bind(notificationService),
        requestPermissions: notificationService.requestPermissions.bind(notificationService),

        // State
        isInitialized: isInitialized.current,

        // Platform info
        platform: Platform.OS,
        supportsInitialNotification: Platform.OS !== 'ios', // iOS doesn't support getLastNotificationResponseAsync
    };
};