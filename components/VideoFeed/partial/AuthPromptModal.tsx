import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { X, Heart, MessageCircle, Share2, Flag } from "lucide-react-native";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

interface AuthPromptModalProps {
  visible: boolean;
  action: string; // 'like', 'comment', 'share', 'report', etc.
  onClose: () => void;
  onLogin?: () => void;
  onSignup?: () => void;
}

const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  visible,
  action,
  onClose,
  onLogin,
  onSignup,
}) => {
  const router = useRouter();

  // Get action-specific content
  const getActionContent = (action: string) => {
    switch (action.toLowerCase()) {
      case "like":
        return {
          icon: <Heart size={48} color="#FF5A5F" />,
          title: "Like this video?",
          description:
            "Sign up to show your appreciation and discover more content you'll love.",
        };
      case "comment":
        return {
          icon: <MessageCircle size={48} color="#FF5A5F" />,
          title: "Join the conversation",
          description: "Sign up to comment and connect with the community.",
        };
      case "share":
        return {
          icon: <Share2 size={48} color="#FF5A5F" />,
          title: "Share this video",
          description:
            "Sign up to share videos with your friends and followers.",
        };
      case "report":
        return {
          icon: <Flag size={48} color="#FF5A5F" />,
          title: "Report content",
          description:
            "Sign up to help us maintain a safe and positive community.",
        };
      default:
        return {
          icon: <Heart size={48} color="#FF5A5F" />,
          title: "Join the community",
          description:
            "Sign up to interact with videos and connect with creators.",
        };
    }
  };

  const actionContent = getActionContent(action);

  const handleLogin = () => {
    onClose();
    if (onLogin) {
      onLogin();
    } else {
      router.push("/(auth)/sign-in");
    }
  };

  const handleSignup = () => {
    onClose();
    if (onSignup) {
      onSignup();
    } else {
      router.push("/(auth)/get-started");
    }
  };

  if (!visible) return null;

  console.log("AuthPromptModal rendering with action:", action);

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modal}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>{actionContent.icon}</View>

            {/* Title */}
            <Text style={styles.title}>{actionContent.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{actionContent.description}</Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.signupButton]}
                onPress={handleSignup}
              >
                <Text style={styles.signupButtonText}>Sign up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.loginButton]}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Log in</Text>
              </TouchableOpacity>
            </View>

            {/* Alternative Action */}
            <TouchableOpacity style={styles.skipButton} onPress={onClose}>
              <Text style={styles.skipButtonText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26, 26, 46, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    elevation: 10000,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modal: {
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    width: Math.min(width - 48, 360),
    maxHeight: height * 0.8,
    position: "relative",
    zIndex: 10001,
    elevation: 10001,
    borderWidth: 1,
    borderColor: "rgba(55,65,81,0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 32,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 90, 95, 0.04)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 90, 95, 0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F3F4F6",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "Figtree",
  },
  description: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: "Figtree",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  signupButton: {
    backgroundColor: "#FF5A5F",
    shadowColor: "#FF5A5F",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: "#F3F4F6",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  loginButton: {
    backgroundColor: "#1a1a2e",
    borderWidth: 2,
    borderColor: "#FF5A5F",
  },
  loginButtonText: {
    color: "#FF5A5F",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Figtree",
    fontWeight: "500",
  },
});

export default AuthPromptModal;
