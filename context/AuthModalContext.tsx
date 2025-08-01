import React, { createContext, useContext, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2, Flag, User, Lock, PlayCircle, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface AuthModalContextType {
    showAuthModal: (action: string) => void;
    hideAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
    showAuthModal: () => {},
    hideAuthModal: () => {},
});

export const useAuthModal = () => useContext(AuthModalContext);

interface AuthModalProviderProps {
    children: React.ReactNode;
}

export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ children }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [currentAction, setCurrentAction] = useState('');
    const router = useRouter();

    const showAuthModal = (action: string) => {
        console.log('Global auth modal - showAuthModal called with:', action);
        setCurrentAction(action);
        setModalVisible(true);
    };

    const hideAuthModal = () => {
        console.log('Global auth modal - hideAuthModal called');
        setModalVisible(false);
        setCurrentAction('');
    };

    const handleLogin = () => {
        hideAuthModal();
        router.push('/(auth)/sign-in');
    };

    const handleSignup = () => {
        hideAuthModal();
        router.push('/(auth)/get-started');
    };

    const getActionContent = (action: string) => {
        switch (action.toLowerCase()) {
            case 'like':
                return {
                    icon: <Heart size={40} color="#FF5A5F" />,
                    title: 'Like this video?',
                    description: 'Join our community to show your appreciation and discover more content you\'ll love.',
                };
            case 'comment':
                return {
                    icon: <MessageCircle size={40} color="#FF5A5F" />,
                    title: 'Join the conversation',
                    description: 'Create an account to comment and connect with creators and the community.',
                };
            case 'share':
                return {
                    icon: <Share2 size={40} color="#FF5A5F" />,
                    title: 'Share this video',
                    description: 'Sign up to share amazing videos with your friends and followers.',
                };
            case 'report':
                return {
                    icon: <Flag size={40} color="#FF5A5F" />,
                    title: 'Report content',
                    description: 'Help us maintain a safe and positive community by creating an account.',
                };
            case 'access_profile':
                return {
                    icon: <User size={40} color="#FF5A5F" />,
                    title: 'Create your profile',
                    description: 'Customize your profile, follow creators, and build your community presence.',
                };
            case 'access_messages':
                return {
                    icon: <MessageCircle size={40} color="#FF5A5F" />,
                    title: 'Connect with creators',
                    description: 'Send messages, get notifications, and stay connected with your favorite creators.',
                };
            case 'create_content':
                return {
                    icon: <PlayCircle size={40} color="#FF5A5F" />,
                    title: 'Start creating',
                    description: 'Share your creativity with the world and build your following.',
                };
            case 'access_subscribed_feed':
                return {
                    icon: <Sparkles size={40} color="#FF5A5F" />,
                    title: 'Access premium content',
                    description: 'Follow creators and unlock exclusive premium content and features.',
                };
            case 'access_following_feed':
                return {
                    icon: <User size={40} color="#FF5A5F" />,
                    title: 'Follow your favorites',
                    description: 'Follow creators and see their latest content in your personalized feed.',
                };
            case 'bookmark':
                return {
                    icon: <Heart size={40} color="#FF5A5F" />,
                    title: 'Save this video',
                    description: 'Create an account to bookmark videos and build your personal collection.',
                };
            default:
                return {
                    icon: <Sparkles size={40} color="#FF5A5F" />,
                    title: 'Join Amize',
                    description: 'Create an account to unlock all features and connect with the community.',
                };
        }
    };

    const actionContent = getActionContent(currentAction);

    console.log('Global auth modal - rendering with modalVisible:', modalVisible, 'currentAction:', currentAction);

    return (
        <AuthModalContext.Provider value={{ showAuthModal, hideAuthModal }}>
            {children}

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={hideAuthModal}
                statusBarTranslucent
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            {actionContent.icon}
                        </View>

                        {/* Content */}
                        <View style={styles.contentContainer}>
                            <Text style={styles.title}>{actionContent.title}</Text>
                            <Text style={styles.description}>
                                {actionContent.description}
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.signupButton}
                                onPress={handleSignup}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.signupButtonText}>Get Started</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.loginButtonText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Skip Action */}
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={hideAuthModal}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.skipButtonText}>Maybe later</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </AuthModalContext.Provider>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(26,26,46,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modal: {
        backgroundColor: '#1a1a2e',
        borderRadius: 24,
        width: Math.min(width - 40, 380),
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 24,
    },
    iconContainer: {
        marginBottom: 24,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 90, 95, 0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.1)',
    },
    iconBackground: {
    },
    contentContainer: {
        alignItems: 'center',
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: 'Figtree',
        lineHeight: 32,
    },
    description: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'Figtree',
        maxWidth: 300,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 20,
    },
    signupButton: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        backgroundColor: '#FF5A5F',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF5A5F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    signupButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Figtree',
    },
    loginButton: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FF5A5F',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    skipButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    skipButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
});