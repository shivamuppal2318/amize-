import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "@/context/NotificationContext";

interface NotificationBellProps {
  size?: number;
  color?: string;
  onPress?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 24,
  color = "#ffffff",
  onPress,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const {
    unreadCount,
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications(1, 10);
  }, []);

  const handleBellPress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const handleNotificationPress = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      // You can add navigation logic here based on notification type
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      Alert.alert("Success", "All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      Alert.alert("Error", "Failed to mark all notifications as read");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Error", "Failed to delete notification");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return "person-add";
      case "like":
        return "heart";
      case "comment":
        return "chatbubble";
      case "message":
        return "mail";
      case "mention":
        return "at";
      case "system":
        return "information-circle";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "follow":
        return "#4CAF50";
      case "like":
        return "#E91E63";
      case "comment":
        return "#2196F3";
      case "message":
        return "#FF9800";
      case "mention":
        return "#9C27B0";
      case "system":
        return "#607D8B";
      default:
        return "#757575";
    }
  };

  return (
    <View style={styles.container}>
      {/* Notification Bell */}
      <TouchableOpacity onPress={handleBellPress} style={styles.bellContainer}>
        <Ionicons name="notifications" size={size} color={color} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notification Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markAllRead}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView
            style={styles.notificationsList}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.isRead && styles.unreadNotification,
                  ]}
                  onPress={() => handleNotificationPress(notification.id)}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Ionicons
                        name={getNotificationIcon(notification.type)}
                        size={20}
                        color={getNotificationColor(notification.type)}
                        style={styles.notificationIcon}
                      />
                      <Text
                        style={[
                          styles.notificationMessage,
                          !notification.isRead && styles.unreadText,
                        ]}
                        numberOfLines={2}
                      >
                        {notification.message}
                      </Text>
                    </View>

                    <View style={styles.notificationFooter}>
                      <Text style={styles.notificationTime}>
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                      {!notification.isRead && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNotification(notification.id)}
                  >
                    <Ionicons name="close" size={16} color="#999999" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {notifications.length > 10 && (
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View all notifications</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowDropdown(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  bellContainer: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FF4757",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  dropdown: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 320,
    maxHeight: 400,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  markAllRead: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#666666",
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#FF4757",
    fontSize: 14,
    textAlign: "center",
  },
  notificationsList: {
    maxHeight: 300,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#CCCCCC",
    fontSize: 16,
    marginTop: 8,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    alignItems: "flex-start",
  },
  unreadNotification: {
    backgroundColor: "#F8F9FA",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notificationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  notificationMessage: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  unreadText: {
    fontWeight: "600",
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999999",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  viewAllButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    alignItems: "center",
  },
  viewAllText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

export default NotificationBell;
