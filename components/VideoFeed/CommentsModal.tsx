import React, { useState, useRef, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  SafeAreaView,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { X, Heart, Send, MoreVertical } from "lucide-react-native";
import useComments from "@/hooks/useComments";
import { UIComment } from "@/lib/adapters/videoAdapter";

const { width, height } = Dimensions.get("window");

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  videoId: string;
  commentsCount: number;
  parentId?: string; // For displaying replies to a specific comment
  parentUsername?: string; // To show "Replying to @username"
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  onClose,
  videoId,
  commentsCount,
  parentId,
  parentUsername,
}) => {
  // Use our comments hook
  const {
    comments,
    loading,
    error,
    hasMore,
    totalComments,
    loadMoreComments,
    refreshComments,
    addComment,
    likeComment,
  } = useComments({
    videoId,
    parentId,
    autoLoad: false, // We'll load when the modal becomes visible
  });

  console.log(comments);

  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [replyTarget, setReplyTarget] = useState<UIComment | null>(null);
  const [repliesVisible, setRepliesVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  // Load comments when modal becomes visible
  useEffect(() => {
    if (visible) {
      refreshComments();
    }
  }, [visible, refreshComments]);

  // Reset reply modal when parent modal closes
  useEffect(() => {
    if (!visible) {
      setRepliesVisible(false);
      setReplyTarget(null);
    }
  }, [visible]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleLikeComment = (commentId: string, isLiked: boolean) => {
    likeComment(commentId, !isLiked);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(commentText);
      setCommentText("");

      // Scroll to the top to see the new comment
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }

    // Hide keyboard
    Keyboard.dismiss();
  };

  const handleViewReplies = (comment: UIComment) => {
    setReplyTarget(comment);
    setRepliesVisible(true);
  };

  const handleCommentMore = (comment: UIComment) => {
    Alert.alert(
      "Comment",
      `@${comment.user.username}`,
      [
        {
          text: "Reply",
          onPress: () => handleViewReplies(comment),
        },
        {
          text: "Report",
          onPress: () => {
            // Placeholder until backend/report flow exists
            Alert.alert("Reported", "Thanks — we’ll review this comment.");
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const renderCommentItem = ({ item }: { item: UIComment }) => (
    <View style={styles.commentItem}>
      <View style={styles.topCommentRow}>
        <View style={styles.userDetails}>
          <Image
            source={{
              uri:
                item.user.avatar ||
                "https://cdn-icons-png.flaticon.com/512/219/219983.png",
            }}
            style={styles.userAvatar}
            onError={(e) => {
              // replace with dummy fallback if original image fails
              e.currentTarget.setNativeProps({
                src: [
                  {
                    uri: "https://cdn-icons-png.flaticon.com/512/219/219983.png",
                  },
                ],
              });
            }}
          />
          <View style={styles.commentHeader}>
            <Text style={styles.username}>@{item.user.username}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => handleCommentMore(item)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.8}
        >
          <MoreVertical size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.commentContent}>
        <Text style={styles.commentText}>{item.text}</Text>

        <View style={styles.commentFooter}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLikeComment(item.id, item.isLiked)}
          >
            <Heart
              size={16}
              color={item.isLiked ? "#FF4F5B" : "#FFF"}
              fill={item.isLiked ? "#FF4F5B" : "transparent"}
            />
            <Text style={styles.likeCount}>{item.likes}</Text>
          </TouchableOpacity>
          <Text style={styles.timestamp}>{item.timestamp}</Text>

          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => handleViewReplies(item)}
          >
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>

          {item.repliesCount > 0 && (
            <TouchableOpacity
              style={styles.viewRepliesButton}
              onPress={() => handleViewReplies(item)}
            >
              <Text style={styles.viewRepliesText}>
                View {item.repliesCount} replies
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#FF4F5B" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No comments yet. Be the first to comment!
        </Text>
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshComments}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoidView}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.headerTitle}>
                {parentId
                  ? totalComments === 0 && loading
                    ? "Loading replies..."
                    : `${totalComments.toLocaleString()} Replies`
                  : totalComments === 0 && loading
                    ? "Loading..."
                    : `${totalComments.toLocaleString()} Comments`}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Show error if any */}
            {renderError()}

            {/* Comments list */}
            <FlatList
              ref={flatListRef}
              data={comments}
              renderItem={renderCommentItem}
              keyExtractor={(item) => item.id}
              style={styles.commentsList}
              contentContainerStyle={styles.commentsListContent}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              onEndReached={hasMore ? loadMoreComments : undefined}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
              refreshing={loading && comments.length === 0}
              onRefresh={refreshComments}
            />

            {/* Comment input area */}
            <View style={styles.inputContainer}>
              {parentUsername && (
                <Text style={styles.replyingToText}>
                  Replying to @{parentUsername}
                </Text>
              )}
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={
                  parentUsername
                    ? `Reply to @${parentUsername}...`
                    : "Add comment..."
                }
                placeholderTextColor="#666"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              {isSubmitting ? (
                <View style={styles.sendButton}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !commentText.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <Send size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {replyTarget ? (
        <CommentsModal
          visible={repliesVisible}
          onClose={() => setRepliesVisible(false)}
          videoId={videoId}
          commentsCount={replyTarget.repliesCount}
          parentId={replyTarget.id}
          parentUsername={replyTarget.user.username}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  keyboardAvoidView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: 0,
    paddingBottom: Platform.OS === "ios" ? 30 : 30,
    height: height * 0.7,
  },
  header: {
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#888",
    borderRadius: 2,
    marginBottom: 10,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  commentItem: {
    flexDirection: "column",
    marginBottom: 20,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  username: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  commentText: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
  commentFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  likeCount: {
    color: "white",
    fontSize: 12,
    marginLeft: 4,
  },
  timestamp: {
    color: "#999",
    fontSize: 12,
    marginRight: 16,
  },
  viewRepliesButton: {
    marginLeft: "auto",
  },
  viewRepliesText: {
    color: "#999",
    fontSize: 12,
  },
  replyButton: {
    marginLeft: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  replyText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  moreButton: {
    paddingHorizontal: 8,
    height: 30,
    justifyContent: "center",
  },
  inputContainer: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#1a1a2e",
  },
  replyingToText: {
    color: "#FF4F5B",
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    backgroundColor: "#262626",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "white",
    maxHeight: 80,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF4F5B",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 16,
    bottom: 12,
  },
  sendButtonDisabled: {
    backgroundColor: "#3A3A3A",
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    textAlign: "center",
  },
  errorContainer: {
    margin: 16,
    padding: 10,
    backgroundColor: "rgba(255, 79, 91, 0.1)",
    borderRadius: 8,
    alignItems: "center",
  },
  errorText: {
    color: "#FF4F5B",
    textAlign: "center",
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: "#FF4F5B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  topCommentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
});

export default CommentsModal;
