// components/MessagingSection.tsx - Updated with unified interfaces and fixed typing logic
import React, { useState, useRef, useEffect } from "react";
import { View, Animated, Dimensions, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useMessages } from "@/context/MessageContext";
import { Conversation } from "@/types/messaging";
import { useAuth } from "@/hooks/useAuth";
import { ConversationUtils } from "@/types/messaging";
import { COLORS, ANIMATION } from "./constants";

// Component imports
import CustomStatusBar from "./CustomStatusBar";
import ConnectionStatus from "./ConnectionStatus";
import ConversationsList from "./ConversationsList";
import ConversationDetail from "./ConversationDetail";
import LoadingScreen from "./LoadingScreen";
import { LinearGradient } from "expo-linear-gradient";

interface AutoOpenConversation {
  id: string;
  name: string;
  avatar: string;
}

interface MessagingSectionProps {
  autoOpenConversation?: AutoOpenConversation;
}

const MessagingSection: React.FC<MessagingSectionProps> = ({
  autoOpenConversation,
}) => {
  // State
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("Chats");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs
  const hasAutoOpened = useRef(false);
  const autoOpenConversationRef = useRef(autoOpenConversation);
  const screenWidth = Dimensions.get("window").width;
  const listPosition = useRef(new Animated.Value(0)).current;
  const detailPosition = useRef(new Animated.Value(screenWidth)).current;

  // Auth and Context - FIXED: Added user context for typing logic
  const { user } = useAuth();
  const {
    conversations,
    messages,
    markAsRead,
    connectionStatus, // FIXED: Use unified connection status
    loading,
    refreshConversations,
    refreshMessages,
    startTyping,
    stopTyping,
    getTypingUsers,
    joinConversation,
    leaveConversation,
    isUserOnline,
  } = useMessages();

  // Handle auto-opening conversation
  useEffect(() => {
    // Reset the flag when autoOpenConversation changes
    if (autoOpenConversationRef.current?.id !== autoOpenConversation?.id) {
      hasAutoOpened.current = false;
      autoOpenConversationRef.current = autoOpenConversation;
    }

    if (
      autoOpenConversation &&
      conversations.length > 0 &&
      !hasAutoOpened.current &&
      !selectedConversation
    ) {
      // Find the conversation in the list
      let conversation = conversations.find(
        (c) => c.id === autoOpenConversation.id
      );

      // If not found, create a temporary conversation object using unified interface
      if (!conversation) {
        conversation = {
          id: autoOpenConversation.id,
          name: autoOpenConversation.name,
          avatar: autoOpenConversation.avatar,
          lastMessage: "",
          timestamp: "",
          unreadCount: 0,
          participants: [],
          type: "direct" as const,
          isOnline: false,
          // Required unified fields
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Mark as handled BEFORE calling handleConversationPress
      hasAutoOpened.current = true;

      // Auto-open the conversation
      setTimeout(() => {
        handleConversationPress(conversation!);
      }, 100);
    }
  }, [autoOpenConversation, conversations, selectedConversation]);

  // Add loading state for auto-opening
  useEffect(() => {
    if (autoOpenConversation && !selectedConversation) {
      // Show loading state while waiting for conversations to load
      setSelectedConversation({
        id: autoOpenConversation.id,
        name: autoOpenConversation.name,
        avatar: autoOpenConversation.avatar,
        lastMessage: "",
        timestamp: "",
        unreadCount: 0,
        participants: [],
        type: "direct" as const,
        isOnline: false,
        // Required unified fields
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Start with conversation view open
      listPosition.setValue(-screenWidth);
      detailPosition.setValue(0);
    }
  }, [autoOpenConversation]);

  // Handlers
  const handleConversationPress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsAnimating(true);
    markAsRead(conversation.id);
    joinConversation(conversation.id);

    // Load messages for this conversation
    refreshMessages(conversation.id);

    Animated.parallel([
      Animated.timing(listPosition, {
        toValue: -screenWidth,
        duration: ANIMATION.SLIDE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(detailPosition, {
        toValue: 0,
        duration: ANIMATION.SLIDE_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => setIsAnimating(false));
  };

  const handleBackPress = () => {
    if (selectedConversation) {
      leaveConversation(selectedConversation.id);
    }

    setIsAnimating(true);

    Animated.parallel([
      Animated.timing(listPosition, {
        toValue: 0,
        duration: ANIMATION.SLIDE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(detailPosition, {
        toValue: screenWidth,
        duration: ANIMATION.SLIDE_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
      setSelectedConversation(null);

      // Reset the auto-open flag when going back
      if (autoOpenConversation) {
        hasAutoOpened.current = false;
        router.replace("/(tabs)/inbox");
      }
    });
  };

  const handleRetryConnection = () => {
    refreshConversations();
  };

  // Get current conversation data
  const currentMessages = selectedConversation
    ? messages[selectedConversation.id] || []
    : [];
  const typingUsers = selectedConversation
    ? getTypingUsers(selectedConversation.id).map((user) => user.username)
    : [];

  // FIXED: Handle typing for current conversation with correct user ID logic
  const handleTypingStart = () => {
    if (!selectedConversation?.participants || !user) {
      console.warn(
        "[MessagingSection] Cannot start typing - missing conversation participants or user"
      );
      return;
    }

    // ✅ FIXED: Use current user ID instead of conversation ID
    const otherParticipant = selectedConversation.participants.find(
      (p) => p.id !== user.id // ✅ Compare with current user ID, not conversation ID
    );

    if (otherParticipant) {
      console.log("[MessagingSection] Starting typing:", {
        conversationId: selectedConversation.id,
        currentUserId: user.id,
        otherParticipantId: otherParticipant.id,
        otherParticipantName: otherParticipant.username,
      });
      startTyping(selectedConversation.id, otherParticipant.id);
    } else {
      console.warn("[MessagingSection] No other participant found for typing", {
        conversationId: selectedConversation.id,
        currentUserId: user.id,
        participants: selectedConversation.participants.map((p) => ({
          id: p.id,
          username: p.username,
        })),
      });
    }
  };

  const handleTypingStop = () => {
    if (!selectedConversation?.participants || !user) {
      console.warn(
        "[MessagingSection] Cannot stop typing - missing conversation participants or user"
      );
      return;
    }

    // ✅ FIXED: Use current user ID instead of conversation ID
    const otherParticipant = selectedConversation.participants.find(
      (p) => p.id !== user.id // ✅ Compare with current user ID, not conversation ID
    );

    if (otherParticipant) {
      console.log("[MessagingSection] Stopping typing:", {
        conversationId: selectedConversation.id,
        currentUserId: user.id,
        otherParticipantId: otherParticipant.id,
        otherParticipantName: otherParticipant.username,
      });
      stopTyping(selectedConversation.id, otherParticipant.id);
    }
  };

  // Enhanced online status check using unified utilities
  const getConversationOnlineStatus = (conversation: Conversation): boolean => {
    if (!user || !conversation.participants) return false;

    if (conversation.type === "group") {
      // For groups, check if any other participant is online
      const otherParticipants = ConversationUtils.getOtherParticipants(
        conversation,
        user.id
      );
      return otherParticipants.some((p) => isUserOnline(p.id));
    } else {
      // For direct conversations, check the other participant
      const otherParticipants = ConversationUtils.getOtherParticipants(
        conversation,
        user.id
      );
      const otherParticipant = otherParticipants[0];
      return otherParticipant ? isUserOnline(otherParticipant.id) : false;
    }
  };

  // Loading states
  if (autoOpenConversation && loading && conversations.length === 0) {
    return (
      <View style={styles.container}>
        <CustomStatusBar />
        <LoadingScreen text="Opening conversation..." />
      </View>
    );
  }

  if (loading && conversations.length === 0 && !autoOpenConversation) {
    return (
      <View style={styles.container}>
        <CustomStatusBar />
        <LoadingScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <CustomStatusBar />
        {/* FIXED: Use unified connection status */}
        <ConnectionStatus
          isConnected={connectionStatus.isConnected}
          onRetry={handleRetryConnection}
        />

        {/* Messages List */}
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateX: listPosition }],
            },
          ]}
        >
          <ConversationsList
            conversations={conversations}
            searchText={searchText}
            setSearchText={setSearchText}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onConversationPress={handleConversationPress}
            isConnected={connectionStatus.isConnected} // FIXED: Use unified connection status
            loading={loading}
            onRetry={handleRetryConnection}
            onRefresh={refreshConversations}
          />
        </Animated.View>

        {/* Conversation Detail */}
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateX: detailPosition }],
            },
          ]}
        >
          {selectedConversation && (
            <ConversationDetail
              conversation={selectedConversation}
              messages={currentMessages}
              typingUsers={typingUsers}
              isOnline={getConversationOnlineStatus(selectedConversation)}
              isConnected={connectionStatus.isConnected}
              onBack={handleBackPress}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
            />
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: COLORS.background,
  },
  animatedContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});

export default MessagingSection;
