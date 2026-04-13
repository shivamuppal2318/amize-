import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Notification } from '@/lib/socket/socketEvents';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export interface LocalNotificationData {
    notificationId: string;
    type: string;
    userId?: string;
    conversationId?: string;
    videoId?: string;
    [key: string]: any;
}

class NotificationService {
    private isConfigured = false;

    async initialize() {
        if (this.isConfigured) return;

        if (Platform.OS === 'web') {
            return false;
        }

        try {
            // Request permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('⚠️ [NotificationService] Notification permissions not granted');
                return false;
            }

            // Configure Android channel
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF4D67',
                    sound: 'default',
                });

                // Create specific channels for different notification types
                await Notifications.setNotificationChannelAsync('messages', {
                    name: 'Messages',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF4D67',
                    sound: 'default',
                    description: 'New message notifications',
                });

                await Notifications.setNotificationChannelAsync('social', {
                    name: 'Social',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    vibrationPattern: [0, 150, 150, 150],
                    lightColor: '#FF4D67',
                    sound: 'default',
                    description: 'Follows, likes, and comments',
                });
            }

            this.isConfigured = true;
            console.log('✅ [NotificationService] Initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ [NotificationService] Initialization failed:', error);
            return false;
        }
    }

    async showNotification(notification: Notification) {
        if (Platform.OS === 'web') {
            return;
        }

        if (!this.isConfigured) {
            const initialized = await this.initialize();
            if (!initialized) {
                console.warn('⚠️ [NotificationService] Cannot show notification - not initialized');
                return;
            }
        }

        try {
            const { title, body, data } = this.formatNotification(notification);

            console.log('📱 [NotificationService] Showing system notification:', {
                title,
                body: body.substring(0, 50) + '...',
                type: notification.type
            });

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: {
                        notificationId: notification.id,
                        type: notification.type,
                        userId: notification.causerUser?.id,
                        videoId: notification.videoId,
                        originalMessage: notification.message,
                        ...data,
                    } as LocalNotificationData,
                    sound: this.getSoundForType(notification.type),
                    priority: this.getPriorityForType(notification.type),
                    categoryIdentifier: this.getCategoryForType(notification.type),
                },
                trigger: null, // Show immediately
            });

            console.log('✅ [NotificationService] System notification scheduled');

        } catch (error) {
            console.error('❌ [NotificationService] Failed to show notification:', error);
        }
    }

    private formatNotification(notification: Notification): {
        title: string;
        body: string;
        data: any;
    } {
        const { type, message, causerUser } = notification;
        let title = '';
        let body = message || '';
        const data = {};

        switch (type) {
            case 'follow':
                title = 'New Follower';
                body = causerUser?.username
                    ? `${causerUser.username} started following you`
                    : 'Someone started following you';
                break;

            case 'message':
                title = 'New Message';
                // Extract sender and message from the formatted message
                const messageMatch = message?.match(/^(.+?):\s*(.+)$/);
                if (messageMatch) {
                    const [, sender, content] = messageMatch;
                    title = `Message from ${sender}`;
                    body = content;
                } else {
                    body = message || 'You have a new message';
                }
                break;

            case 'like':
                title = 'New Like';
                body = causerUser?.username
                    ? `${causerUser.username} liked your post`
                    : 'Someone liked your post';
                break;

            case 'comment':
                title = 'New Comment';
                body = causerUser?.username
                    ? `${causerUser.username} commented on your post`
                    : 'Someone commented on your post';
                break;

            case 'mention':
                title = 'Mention';
                body = causerUser?.username
                    ? `${causerUser.username} mentioned you`
                    : 'You were mentioned';
                break;

            case 'system':
                title = 'System Notification';
                body = message || 'System notification';
                break;

            default:
                title = 'Notification';
                body = message || 'You have a new notification';
                break;
        }

        return { title, body, data };
    }

    private getSoundForType(type: string): string | boolean {
        switch (type) {
            case 'message':
                return 'default'; // or custom sound file
            case 'follow':
            case 'like':
            case 'comment':
            case 'mention':
                return 'default';
            default:
                return true;
        }
    }

    private getPriorityForType(type: string): Notifications.AndroidNotificationPriority {
        switch (type) {
            case 'message':
                return Notifications.AndroidNotificationPriority.HIGH;
            case 'follow':
            case 'like':
            case 'comment':
            case 'mention':
                return Notifications.AndroidNotificationPriority.DEFAULT;
            default:
                return Notifications.AndroidNotificationPriority.DEFAULT;
        }
    }

    private getCategoryForType(type: string): string {
        switch (type) {
            case 'message':
                return 'messages';
            case 'follow':
            case 'like':
            case 'comment':
            case 'mention':
                return 'social';
            default:
                return 'default';
        }
    }

    // Setup notification response handler
    setupNotificationHandlers(
        onNotificationTap: (notification: Notifications.NotificationResponse) => void
    ) {
        if (Platform.OS === 'web') {
            return () => {};
        }

        // Handle notification tap when app is running
        const subscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log('📱 [NotificationService] Notification tapped:', {
                    notificationId: response.notification.request.content.data?.notificationId,
                    type: response.notification.request.content.data?.type,
                    actionIdentifier: response.actionIdentifier,
                });

                onNotificationTap(response);
            }
        );

        return () => subscription.remove();
    }

    async getInitialNotification(): Promise<Notifications.NotificationResponse | null> {
        try {
            if (Platform.OS === 'ios') {
                console.log('📱 [NotificationService] iOS: getLastNotificationResponseAsync not supported, skipping');
                return null;
            }

            const lastResponse = await Notifications.getLastNotificationResponseAsync();

            if (lastResponse) {
                console.log('📱 [NotificationService] Found initial notification:', {
                    notificationId: lastResponse.notification.request.content.data?.notificationId,
                    type: lastResponse.notification.request.content.data?.type,
                });
            }

            return lastResponse;
        } catch (error) {
            console.log('📱 [NotificationService] getInitialNotification not available on this platform, skipping');
            return null;
        }
    }

    async updateBadgeCount(count: number) {
        if (Platform.OS === 'web') {
            return;
        }

        try {
            await Notifications.setBadgeCountAsync(count);
            console.log('📱 [NotificationService] Badge count updated:', count);
        } catch (error) {
            console.error('❌ [NotificationService] Failed to update badge count:', error);
        }
    }

    async clearBadge() {
        if (Platform.OS === 'web') {
            return;
        }

        try {
            await Notifications.setBadgeCountAsync(0);
            console.log('📱 [NotificationService] Badge cleared');
        } catch (error) {
            console.error('❌ [NotificationService] Failed to clear badge:', error);
        }
    }

    async checkPermissions(): Promise<boolean> {
        if (Platform.OS === 'web') {
            return false;
        }

        try {
            const { status } = await Notifications.getPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('❌ [NotificationService] Error checking permissions:', error);
            return false;
        }
    }

    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'web') {
            return false;
        }

        try {
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('❌ [NotificationService] Error requesting permissions:', error);
            return false;
        }
    }

    async clearAllNotifications() {
        if (Platform.OS === 'web') {
            return;
        }

        try {
            await Notifications.dismissAllNotificationsAsync();
            console.log('📱 [NotificationService] All notifications cleared');
        } catch (error) {
            console.error('❌ [NotificationService] Failed to clear notifications:', error);
        }
    }

    async cancelNotification(notificationId: string) {
        if (Platform.OS === 'web') {
            return;
        }

        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            console.log('📱 [NotificationService] Notification cancelled:', notificationId);
        } catch (error) {
            console.error('❌ [NotificationService] Failed to cancel notification:', error);
        }
    }
}

export const notificationService = new NotificationService();
