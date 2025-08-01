import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    StatusBar,
    Platform,
    Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
    ArrowLeft,
    Search,
    MessageCircle,
    CheckCircle,
    Users,
    Sparkles,
    MessageSquare,
    Check
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/lib/api/client';
import { useMessages } from '@/context/MessageContext';
import { useAuth } from '@/hooks/useAuth';

interface User {
    id: string;
    username: string;
    fullName?: string;
    profilePhotoUrl?: string;
    creatorVerified: boolean;
    isOnline?: boolean;
    followersCount?: number;
    isCreator?: boolean;
}

export default function NewConversationScreen() {
    const { userId: targetUserId } = useLocalSearchParams<{ userId?: string }>();
    const [searchText, setSearchText] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [creatingConversation, setCreatingConversation] = useState<string | null>(null);
    const { createConversation, conversations } = useMessages();
    const { user: currentUser } = useAuth();

    // Animation values
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(30));

    useEffect(() => {
        // Run entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // If targetUserId is provided, directly create conversation
    useEffect(() => {
        if (targetUserId && currentUser) {
            handleCreateConversation(targetUserId);
        }
    }, [targetUserId, currentUser]);

    const searchUsers = useCallback(async (query: string) => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.get('/users/search', {
                params: {
                    q: query.trim(),
                    limit: 20
                }
            });

            if (response.data.success) {
                // Filter out current user
                const filteredUsers = response.data.users.filter(
                    (user: User) => user.id !== currentUser?.id
                );
                setUsers(filteredUsers);
            }
        } catch (error) {
            console.error('Error searching users:', error);
            Alert.alert('Error', 'Failed to search users. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchUsers(searchText);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchText, searchUsers]);

    const handleCreateConversation = async (userId: string) => {
        try {
            setCreatingConversation(userId);

            // Check if conversation already exists
            const existingConversation = conversations.find(conv =>
                conv.participants?.some(p => p.id === userId)
            );

            if (existingConversation) {
                // Open existing conversation directly
                router.replace({
                    pathname: '/(tabs)/inbox',
                    params: {
                        openConversationId: existingConversation.id,
                        openConversationName: existingConversation.name,
                        openConversationAvatar: existingConversation.avatar
                    }
                });
                return;
            }

            // Create new conversation
            const conversation = await createConversation(userId);

            if (conversation) {
                // Open the new conversation directly
                router.replace({
                    pathname: '/(tabs)/inbox',
                    params: {
                        openConversationId: conversation.id,
                        openConversationName: conversation.name,
                        openConversationAvatar: conversation.avatar
                    }
                });
            } else {
                Alert.alert('Error', 'Failed to create conversation. Please try again.');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            Alert.alert('Error', 'Failed to create conversation. Please try again.');
        } finally {
            setCreatingConversation(null);
        }
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/inbox');
        }
    };

    const formatFollowersCount = (count: number = 0) => {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    };

    const renderUserItem = ({ item, index }: { item: User; index: number }) => {
        const isCreating = creatingConversation === item.id;
        const existingConversation = conversations.find(conv =>
            conv.participants?.some(p => p.id === item.id)
        );

        return (
            <Animated.View
                style={[
                    styles.userItemContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 30],
                                outputRange: [0, 30],
                                extrapolate: 'clamp',
                            })
                        }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={[styles.userItem, isCreating && styles.userItemCreating]}
                    onPress={() => handleCreateConversation(item.id)}
                    disabled={!!creatingConversation}
                    activeOpacity={0.8}
                >
                    <View style={styles.userInfo}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{
                                    uri: item.profilePhotoUrl || 'https://via.placeholder.com/60'
                                }}
                                style={styles.avatar}
                            />
                            {item.isOnline && (
                                <View style={styles.onlineIndicator}>
                                    <View style={styles.onlineIndicatorInner} />
                                </View>
                            )}
                            {item.creatorVerified && (
                                <View style={styles.verifiedBadge}>
                                    <Check size={10} color="white" />
                                </View>
                            )}
                        </View>

                        <View style={styles.userDetails}>
                            <View style={styles.userNameRow}>
                                <Text style={styles.userName} numberOfLines={1}>
                                    {item.fullName || `@${item.username}`}
                                </Text>
                                {item.isCreator && (
                                    <View style={styles.creatorBadge}>
                                        <Sparkles size={12} color="#FF5A5F" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.userMetaRow}>
                                <Text style={styles.userUsername} numberOfLines={1}>
                                    @{item.username}
                                </Text>
                                {item.followersCount && item.followersCount > 0 && (
                                    <>
                                        <View style={styles.metaDivider} />
                                        <Text style={styles.followersCount}>
                                            {formatFollowersCount(item.followersCount)} followers
                                        </Text>
                                    </>
                                )}
                            </View>

                            {existingConversation && (
                                <View style={styles.existingConversationBadge}>
                                    <Text style={styles.existingConversationText}>Connected</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.messageButtonContainer}>
                        {isCreating ? (
                            <View style={styles.loadingButton}>
                                <ActivityIndicator size="small" color="#FF5A5F" />
                                <Text style={styles.loadingText}>
                                    {existingConversation ? 'Opening...' : 'Creating...'}
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.messageButton}
                                onPress={() => handleCreateConversation(item.id)}
                                disabled={!!creatingConversation}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={existingConversation ? ['#10B981', '#059669'] : ['#FF5A5F', '#FF7A7F']}
                                    style={styles.messageButtonGradient}
                                >
                                    <MessageSquare size={16} color="white" />
                                    <Text style={styles.messageButtonText}>
                                        {existingConversation ? 'Message' : 'Chat'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmptyState = () => {
        if (loading) {
            return (
                <View style={styles.emptyStateContainer}>
                    <View style={styles.loadingSpinner}>
                        <ActivityIndicator size="large" color="#FF5A5F" />
                    </View>
                    <Text style={styles.emptyStateText}>Searching users...</Text>
                </View>
            );
        }

        if (!searchText.trim()) {
            return (
                <Animated.View
                    style={[
                        styles.emptyStateContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['rgba(255, 90, 95, 0.1)', 'rgba(255, 90, 95, 0.05)']}
                        style={styles.emptyStateGradient}
                    >
                        <View style={styles.emptyStateIcon}>
                            <Users size={64} color="#FF5A5F" />
                        </View>
                        <Text style={styles.emptyStateTitle}>Find someone to message</Text>
                        <Text style={styles.emptyStateDescription}>
                            Search for users by their username or name to start a conversation
                        </Text>
                    </LinearGradient>
                </Animated.View>
            );
        }

        return (
            <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIcon}>
                    <Search size={64} color="#6B7280" />
                </View>
                <Text style={styles.emptyStateTitle}>No users found</Text>
                <Text style={styles.emptyStateDescription}>
                    Try searching with a different username or name
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={styles.container.backgroundColor}
                translucent={Platform.OS === 'android'}
            />

            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
                    <View style={styles.backButtonContent}>
                        <ArrowLeft size={22} color="white" />
                    </View>
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>New Message</Text>
                    <Text style={styles.headerSubtitle}>Start a conversation</Text>
                </View>

                <View style={styles.headerRight}>
                    <View style={styles.headerIcon}>
                        <MessageSquare size={20} color="#FF5A5F" />
                    </View>
                </View>
            </Animated.View>

            {/* Search */}
            <Animated.View
                style={[
                    styles.searchSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.searchContainer}>
                    <LinearGradient
                        colors={['rgba(255, 90, 95, 0.1)', 'rgba(255, 90, 95, 0.05)']}
                        style={styles.searchGradient}
                    >
                        <View style={styles.searchContent}>
                            <View style={styles.searchIconContainer}>
                                <Search size={20} color="#9CA3AF" />
                            </View>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search users..."
                                placeholderTextColor="#9CA3AF"
                                value={searchText}
                                onChangeText={setSearchText}
                                autoFocus={!targetUserId}
                                editable={!creatingConversation}
                                selectionColor="#FF5A5F"
                            />
                            {loading && (
                                <View style={styles.searchLoader}>
                                    <ActivityIndicator size="small" color="#FF5A5F" />
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </View>
            </Animated.View>

            {/* User List */}
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!creatingConversation}
                ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />

            {/* Creating overlay */}
            {creatingConversation && (
                <View style={styles.creatingOverlay}>
                    <Animated.View
                        style={[
                            styles.creatingContent,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: fadeAnim }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#1a1a2e', '#1a1a2e']}
                            style={styles.creatingGradient}
                        >
                            <View style={styles.creatingSpinner}>
                                <ActivityIndicator size="large" color="#FF5A5F" />
                            </View>
                            <Text style={styles.creatingText}>Starting conversation...</Text>
                            <Text style={styles.creatingSubtext}>This will only take a moment</Text>
                        </LinearGradient>
                    </Animated.View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(75, 85, 99, 0.3)',
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.2)',
    },
    backButtonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#F3F4F6',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Figtree',
        marginBottom: 2,
    },
    headerSubtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    headerRight: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.2)',
    },

    // Search
    searchSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    searchContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    searchGradient: {
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.2)',
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderRadius: 16,
    },
    searchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchIconContainer: {
        marginRight: 12,
        padding: 4,
    },
    searchInput: {
        flex: 1,
        color: '#F3F4F6',
        fontSize: 16,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    searchLoader: {
        marginLeft: 12,
        padding: 4,
    },

    // List
    listContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    itemSeparator: {
        height: 8,
    },

    // User Item
    userItemContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(26, 26, 46, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
    },
    userItemCreating: {
        opacity: 0.7,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1a1a2e',
    },
    onlineIndicatorInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
    },
    verifiedBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#0c3eff',
        borderRadius: 12,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1a1a2e',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    userDetails: {
        flex: 1,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        color: '#F3F4F6',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Figtree',
        flex: 1,
    },
    creatorBadge: {
        marginLeft: 8,
        padding: 4,
        backgroundColor: 'rgba(255, 90, 95, 0.2)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    userMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    userUsername: {
        color: '#9CA3AF',
        fontSize: 15,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    metaDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#6B7280',
        marginHorizontal: 8,
    },
    followersCount: {
        color: '#9CA3AF',
        fontSize: 14,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    existingConversationBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    existingConversationText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },

    // Message Button
    messageButtonContainer: {
        alignItems: 'flex-end',
    },
    messageButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#FF5A5F',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    messageButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 6,
    },
    messageButtonText: {
        color: '#F3F4F6',
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    loadingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.2)',
    },
    loadingText: {
        color: '#FF5A5F',
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },

    // Empty State
    emptyStateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyStateGradient: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 32,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.2)',
        backgroundColor: 'rgba(26, 26, 46, 0.6)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    emptyStateIcon: {
        padding: 24,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 50,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.2)',
    },
    emptyStateTitle: {
        color: '#F3F4F6',
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Figtree',
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyStateDescription: {
        color: '#9CA3AF',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'Figtree',
        fontWeight: '400',
        marginBottom: 20,
    },
    emptyStateText: {
        color: '#9CA3AF',
        textAlign: 'center',
        fontSize: 16,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    searchTip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#4B5563',
        gap: 8,
    },
    searchTipText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    loadingSpinner: {
        padding: 20,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 50,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.2)',
    },

    // Creating Overlay
    creatingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(14,14,24,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    creatingContent: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 16,
    },
    creatingGradient: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 62,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.04)',
        backgroundColor: '#1a1a2e',
        borderRadius: 24,
    },
    creatingSpinner: {
        padding: 16,
        borderRadius: 50,
        marginBottom: 20,
    },
    creatingText: {
        color: '#F3F4F6',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Figtree',
        marginBottom: 8,
    },
    creatingSubtext: {
        color: '#9CA3AF',
        fontSize: 16,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
});