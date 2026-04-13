import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { useMessages } from "@/context/MessageContext";
import { Conversation, ConversationUtils } from "@/types/messaging";
import { useAuth } from "@/hooks/useAuth";

import { ANIMATION } from "./constants";
import CustomStatusBar from "./CustomStatusBar";
import ConnectionStatus from "./ConnectionStatus";
import ConversationsList from "./ConversationsList";
import ConversationDetail from "./ConversationDetail";
import LoadingScreen from "./LoadingScreen";

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
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("Chats");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const hasAutoOpened = useRef(false);
  const autoOpenConversationRef = useRef(autoOpenConversation);
  const screenWidth = Dimensions.get("window").width;
  const listPosition = useRef(new Animated.Value(0)).current;
  const detailPosition = useRef(new Animated.Value(screenWidth)).current;

  const { user } = useAuth();
  const {
    conversations,
    messages,
    markAsRead,
    connectionStatus,
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

  const handleConversationPress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsAnimating(true);
    markAsRead(conversation.id);
    joinConversation(conversation.id);
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

  useEffect(() => {
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
      let conversation = conversations.find(
        (item) => item.id === autoOpenConversation.id
      );

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
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      hasAutoOpened.current = true;
      setTimeout(() => {
        handleConversationPress(conversation!);
      }, 100);
    }
  }, [autoOpenConversation, conversations, selectedConversation]);

  useEffect(() => {
    if (autoOpenConversation && !selectedConversation) {
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
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      listPosition.setValue(-screenWidth);
      detailPosition.setValue(0);
    }
  }, [autoOpenConversation, detailPosition, listPosition, screenWidth, selectedConversation]);

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

      if (autoOpenConversation) {
        hasAutoOpened.current = false;
        router.replace("/(tabs)/inbox");
      }
    });
  };

  const handleRetryConnection = () => {
    refreshConversations();
  };

  const currentMessages = selectedConversation
    ? messages[selectedConversation.id] || []
    : [];
  const typingUsers = selectedConversation
    ? getTypingUsers(selectedConversation.id).map((item) => item.username)
    : [];

  const handleTypingStart = () => {
    if (!selectedConversation?.participants || !user) {
      console.warn(
        "[MessagingSection] Cannot start typing - missing conversation participants or user"
      );
      return;
    }

    const otherParticipant = selectedConversation.participants.find(
      (participant) => participant.id !== user.id
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
        participants: selectedConversation.participants.map((participant) => ({
          id: participant.id,
          username: participant.username,
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

    const otherParticipant = selectedConversation.participants.find(
      (participant) => participant.id !== user.id
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

  const getConversationOnlineStatus = (conversation: Conversation): boolean => {
    if (!user || !conversation.participants) return false;

    const otherParticipants = ConversationUtils.getOtherParticipants(
      conversation,
      user.id
    );

    if (conversation.type === "group") {
      return otherParticipants.some((participant) => isUserOnline(participant.id));
    }

    const otherParticipant = otherParticipants[0];
    return otherParticipant ? isUserOnline(otherParticipant.id) : false;
  };

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
        <ConnectionStatus
          isConnected={connectionStatus.isConnected}
          onRetry={handleRetryConnection}
        />

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
            isConnected={connectionStatus.isConnected}
            loading={loading}
            onRetry={handleRetryConnection}
            onRefresh={refreshConversations}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateX: detailPosition }],
            },
          ]}
        >
          {selectedConversation ? (
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
          ) : null}
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});

export default MessagingSection;
