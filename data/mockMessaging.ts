import { Conversation, Message, MessageUtils, Participant } from "@/types/messaging";

const now = Date.now();

const minutesAgo = (minutes: number) =>
  new Date(now - minutes * 60 * 1000).toISOString();

const createParticipant = (overrides: Partial<Participant>): Participant => ({
  id: overrides.id || "user",
  username: overrides.username || "user",
  profilePhotoUrl:
    overrides.profilePhotoUrl ||
    "https://randomuser.me/api/portraits/men/32.jpg",
  ...overrides,
});

export const buildMockMessagingData = (currentUserId = "demo-user") => {
  const currentUser = createParticipant({
    id: currentUserId,
    username: "you",
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/75.jpg",
  });

  const maya = createParticipant({
    id: "mock-user-1",
    username: "maya.c",
    profilePhotoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  });

  const theo = createParticipant({
    id: "mock-user-2",
    username: "theo.dev",
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/85.jpg",
  });

  const crew = createParticipant({
    id: "mock-user-3",
    username: "studio.crew",
    profilePhotoUrl: "https://randomuser.me/api/portraits/women/65.jpg",
  });

  const conversations: Conversation[] = [
    {
      id: "mock-convo-1",
      type: "direct",
      name: maya.username,
      avatar: maya.profilePhotoUrl,
      participants: [currentUser, maya],
      lastMessage: "Love the new edit!",
      lastMessageContent: "Love the new edit! Let’s post tonight.",
      lastMessageAt: minutesAgo(18),
      lastMessageSender: maya.id,
      timestamp: MessageUtils.formatTimestamp(minutesAgo(18)),
      unreadCount: 1,
      isOnline: true,
      isActive: true,
      createdAt: minutesAgo(600),
      updatedAt: minutesAgo(18),
    },
    {
      id: "mock-convo-2",
      type: "direct",
      name: theo.username,
      avatar: theo.profilePhotoUrl,
      participants: [currentUser, theo],
      lastMessage: "I'll send the thumbnail options.",
      lastMessageContent: "I’ll send the thumbnail options in 10 minutes.",
      lastMessageAt: minutesAgo(72),
      lastMessageSender: currentUser.id,
      timestamp: MessageUtils.formatTimestamp(minutesAgo(72)),
      unreadCount: 0,
      isOnline: false,
      isActive: true,
      createdAt: minutesAgo(900),
      updatedAt: minutesAgo(72),
    },
    {
      id: "mock-convo-3",
      type: "group",
      name: "Launch Crew",
      avatar: crew.profilePhotoUrl,
      participants: [currentUser, maya, theo],
      lastMessage: "Assets are ready for review.",
      lastMessageContent: "Assets are ready for review. Check the drive.",
      lastMessageAt: minutesAgo(140),
      lastMessageSender: theo.id,
      timestamp: MessageUtils.formatTimestamp(minutesAgo(140)),
      unreadCount: 2,
      isOnline: true,
      isActive: true,
      createdAt: minutesAgo(1440),
      updatedAt: minutesAgo(140),
    },
  ];

  const messages: Record<string, Message[]> = {
    "mock-convo-1": [
      {
        id: "mock-msg-1",
        content: "Just finished the color grade.",
        messageType: "text",
        senderId: currentUser.id,
        receiverId: maya.id,
        conversationId: "mock-convo-1",
        createdAt: minutesAgo(42),
        updatedAt: minutesAgo(42),
        timestamp: MessageUtils.formatTimestamp(minutesAgo(42)),
        status: "delivered",
        isFromCurrentUser: true,
      },
      {
        id: "mock-msg-2",
        content: "Love the new edit! Let’s post tonight.",
        messageType: "text",
        senderId: maya.id,
        receiverId: currentUser.id,
        conversationId: "mock-convo-1",
        createdAt: minutesAgo(18),
        updatedAt: minutesAgo(18),
        timestamp: MessageUtils.formatTimestamp(minutesAgo(18)),
        status: "read",
        isFromCurrentUser: false,
      },
    ],
    "mock-convo-2": [
      {
        id: "mock-msg-3",
        content: "Can you review the captions?",
        messageType: "text",
        senderId: theo.id,
        receiverId: currentUser.id,
        conversationId: "mock-convo-2",
        createdAt: minutesAgo(95),
        updatedAt: minutesAgo(95),
        timestamp: MessageUtils.formatTimestamp(minutesAgo(95)),
        status: "read",
        isFromCurrentUser: false,
      },
      {
        id: "mock-msg-4",
        content: "On it. I’ll send the thumbnail options in 10 minutes.",
        messageType: "text",
        senderId: currentUser.id,
        receiverId: theo.id,
        conversationId: "mock-convo-2",
        createdAt: minutesAgo(72),
        updatedAt: minutesAgo(72),
        timestamp: MessageUtils.formatTimestamp(minutesAgo(72)),
        status: "delivered",
        isFromCurrentUser: true,
      },
    ],
    "mock-convo-3": [
      {
        id: "mock-msg-5",
        content: "Reminder: launch checklist at 4 PM.",
        messageType: "text",
        senderId: maya.id,
        receiverId: currentUser.id,
        conversationId: "mock-convo-3",
        createdAt: minutesAgo(210),
        updatedAt: minutesAgo(210),
        timestamp: MessageUtils.formatTimestamp(minutesAgo(210)),
        status: "read",
        isFromCurrentUser: false,
      },
      {
        id: "mock-msg-6",
        content: "Assets are ready for review. Check the drive.",
        messageType: "text",
        senderId: theo.id,
        receiverId: currentUser.id,
        conversationId: "mock-convo-3",
        createdAt: minutesAgo(140),
        updatedAt: minutesAgo(140),
        timestamp: MessageUtils.formatTimestamp(minutesAgo(140)),
        status: "delivered",
        isFromCurrentUser: false,
      },
    ],
  };

  return { conversations, messages };
};
