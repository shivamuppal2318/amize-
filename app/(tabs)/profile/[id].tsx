import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Image,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Animated,
    Easing,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Lock,
    AlertTriangle,
    ChevronLeft,
    MoreHorizontal,
    Play,
    Heart,
    Share,
    Grid3X3,
    BookmarkPlus,
    EyeOff,
    CheckCircle,
    Star,
    Users,
    Video,
    Eye,
    MessageCircle,
    Settings,
    Edit3,
    UserPlus,
    UserCheck,
    Calendar,
    MapPin
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/lib/api/client';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 18) / 3;

type TabType = 'videos' | 'likes' | 'saved' | 'private';

interface User {
    id: string;
    username: string;
    fullName?: string;
    bio?: string;
    profilePhotoUrl?: string;
    creatorVerified: boolean;
    creatorCategory?: string;
    role: string;
    isEligibleForCreator: boolean;
    location?: string;
    joinedAt?: string;
    _count: {
        videos: number;
        following: number;
        followers: number;
    };
}

interface Video {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    videoUrl: string;
    duration: number;
    isPublic: boolean;
    createdAt: string;
    user: {
        id: string;
        username: string;
        profilePhotoUrl?: string;
        creatorVerified: boolean;
    };
    _count: {
        likes: number;
        comments: number;
        views: number;
    };
}

export default function ProfilePage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('videos');
    const [videos, setVideos] = useState<Video[]>([]);
    const [likes, setLikes] = useState<Video[]>([]);
    const [savedVideos, setSavedVideos] = useState<Video[]>([]);
    const [privateVideos, setPrivateVideos] = useState<Video[]>([]);
    const [loadingTab, setLoadingTab] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
    const profileImageScale = useRef(new Animated.Value(0.8)).current;
    const statsOpacity = useRef(new Animated.Value(0)).current;

    const fetchUserProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get(`/users/${id}`);

            if (response.data.success) {
                setUser(response.data.user);
                setIsOwnProfile(response.data.isOwnProfile);
                setIsFollowing(response.data.isFollowing);
            } else {
                setError(response.data.message || 'Failed to load profile');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchTabContent = useCallback(async (tab: TabType) => {
        try {
            setLoadingTab(true);

            switch (tab) {
                case 'videos':
                    await fetchUserVideos();
                    break;
                case 'likes':
                    await fetchUserLikes();
                    break;
                case 'saved':
                    await fetchSavedVideos();
                    break;
                case 'private':
                    await fetchPrivateVideos();
                    break;
            }
        } catch (err) {
            console.error(`Error fetching ${tab}:`, err);
        } finally {
            setLoadingTab(false);
        }
    }, [id]);

    const animateTabChange = useCallback(() => {
        const tabIndex = ['videos', 'likes', 'saved', 'private'].indexOf(activeTab);
        const visibleTabs = isOwnProfile ? 4 : 2;
        const indicatorPosition = (width / visibleTabs) * tabIndex;

        Animated.spring(tabIndicatorAnim, {
            toValue: indicatorPosition,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, [activeTab, isOwnProfile, tabIndicatorAnim]);

    // Load user profile and initial data
    useEffect(() => {
        if (id) {
            fetchUserProfile();
        }
    }, [id, fetchUserProfile]);

    // Load tab content when tab changes
    useEffect(() => {
        if (user && activeTab) {
            fetchTabContent(activeTab);
            animateTabChange();
        }
    }, [activeTab, user, fetchTabContent, animateTabChange]);

    const startEntranceAnimations = useCallback(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(profileImageScale, {
                toValue: 1,
                duration: 1000,
                easing: Easing.elastic(1.2),
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Animate stats after profile loads
            Animated.timing(statsOpacity, {
                toValue: 1,
                duration: 600,
                delay: 200,
                useNativeDriver: true,
            }).start();
        });
    }, [fadeAnim, slideAnim, scaleAnim, profileImageScale, statsOpacity]);

    // Entrance animations
    useEffect(() => {
        if (!loading && user) {
            startEntranceAnimations();
        }
    }, [loading, user, startEntranceAnimations]);

    const fetchUserVideos = useCallback(async () => {
        try {
            const response = await apiClient.get(`/users/${id}/videos`);
            if (response.data.success) {
                setVideos(response.data.videos);
            }
        } catch (err) {
            console.error('Error fetching videos:', err);
        }
    }, [id]);

    const fetchUserLikes = useCallback(async () => {
        setLikes([]);
    }, []);

    const fetchSavedVideos = useCallback(async () => {
        setSavedVideos([]);
    }, []);

    const fetchPrivateVideos = useCallback(async () => {
        setPrivateVideos([]);
    }, []);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
    };

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUserProfile();
        if (user && activeTab) {
            await fetchTabContent(activeTab);
        }
        setRefreshing(false);
    }, [activeTab, user, fetchTabContent, fetchUserProfile]);

    const handleFollowChange = (newFollowState: boolean) => {
        setIsFollowing(newFollowState);
        if (user) {
            setUser({
                ...user,
                _count: {
                    ...user._count,
                    followers: newFollowState
                        ? user._count.followers + 1
                        : Math.max(0, user._count.followers - 1),
                },
            });
        }
    };

    const handleVideoPress = useCallback((video: Video) => {
        console.log('Navigating to video in feed:', video.id);
        router.push({
            //@ts-ignore
            pathname: '/(tabs)/',
            params: {
                videoId: video.id,
                userId: video.user.id,
                fromProfile: 'true'
            }
        });
    }, []);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            //@ts-ignore
            router.replace('/(tabs)/');
        }
    };

    const handleMessage = () => {
        router.push({
            pathname: '/(tabs)/inbox/new',
            params: { userId: user?.id }
        });
    };

    const handleMoreOptions = () => {
        console.log('More options');
    };

    const handleEditProfile = () => {
        router.push('/settings');
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const roundedSecs = Math.round(secs);
        return `${mins}:${roundedSecs < 10 ? '0' : ''}${roundedSecs}`;
    };

    const formatJoinDate = (dateString?: string) => {
        if (!dateString) return 'Member since 2024';
        const date = new Date(dateString);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `Joined ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getActiveData = () => {
        switch (activeTab) {
            case 'videos':
                return videos;
            case 'likes':
                return likes;
            case 'saved':
                return savedVideos;
            case 'private':
                return privateVideos;
            default:
                return [];
        }
    };

    // Create separate VideoItem component to properly use hooks
    const VideoItem = ({ item, index, onPress }: { item: Video, index: number, onPress: (video: Video) => void }) => {
        const animatedScale = useRef(new Animated.Value(0.8)).current;
        const animatedOpacity = useRef(new Animated.Value(0)).current;
        const pressScale = useRef(new Animated.Value(1)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.timing(animatedScale, {
                    toValue: 1,
                    duration: 400,
                    delay: index * 50,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(animatedOpacity, {
                    toValue: 1,
                    duration: 400,
                    delay: index * 50,
                    useNativeDriver: true,
                }),
            ]).start();
        }, []);

        const handlePressIn = () => {
            Animated.spring(pressScale, {
                toValue: 0.95,
                tension: 100,
                friction: 5,
                useNativeDriver: true,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(pressScale, {
                toValue: 1,
                tension: 100,
                friction: 5,
                useNativeDriver: true,
            }).start();
        };

        const handlePress = () => {
            Animated.sequence([
                Animated.spring(pressScale, {
                    toValue: 0.9,
                    tension: 100,
                    friction: 5,
                    useNativeDriver: true,
                }),
                Animated.spring(pressScale, {
                    toValue: 1,
                    tension: 100,
                    friction: 5,
                    useNativeDriver: true,
                })
            ]).start(() => {
                onPress(item);
            });
        };

        return (
            <Animated.View
                style={[
                    styles.videoItem,
                    {
                        transform: [
                            { scale: animatedScale },
                            { scale: pressScale }
                        ],
                        opacity: animatedOpacity,
                    }
                ]}
            >
                <TouchableOpacity
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.9}
                    style={styles.videoTouchable}
                >
                    <Image
                        source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/300x400' }}
                        style={styles.videoThumbnail}
                        resizeMode="cover"
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.videoGradient}
                    />

                    <View style={styles.videoOverlay}>
                        <View style={styles.videoStats}>
                            <View style={styles.videoStat}>
                                <Eye size={12} color="white" />
                                <Text style={styles.videoStatText}>
                                    {formatNumber(item._count.views)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.videoDuration}>
                            <Text style={styles.videoDurationText}>
                                {formatDuration(item.duration)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.playButtonOverlay}>
                        <LinearGradient
                            colors={['#FF5A5F', '#FF5A5F']}
                            style={styles.playButton}
                        >
                            <Play size={16} color="white" fill="white" />
                        </LinearGradient>

                        <Animated.View
                            style={[
                                styles.pulseRing,
                                {
                                    transform: [{ scale: pressScale }]
                                }
                            ]}
                        />
                    </View>

                    {!item.isPublic && (
                        <View style={styles.privateIndicator}>
                            <EyeOff size={12} color="white" />
                        </View>
                    )}

                    <View style={styles.navigationHint}>
                        <Text style={styles.navigationHintText}>Tap to watch</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderVideoItem = ({ item, index }: { item: Video, index: number }) => (
        <VideoItem item={item} index={index} onPress={handleVideoPress} />
    );

    const renderTabButton = (tab: TabType, icon: React.ReactNode, label: string) => {
        const isActive = activeTab === tab;
        const isVisible = (tab !== 'private' && tab !== 'saved') || isOwnProfile;

        if (!isVisible) return null;

        return (
            <TouchableOpacity
                key={tab}
                style={[styles.tabButton]}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.7}
            >
                <View style={[styles.tabContent, isActive && styles.activeTabContent]}>
                    {icon}
                    <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                        {label}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => {
        if (loadingTab) {
            return (
                <View style={styles.emptyStateContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                    <Text style={styles.emptyStateText}>Loading...</Text>
                </View>
            );
        }

        let message = '';
        let icon = null;
        let description = '';

        switch (activeTab) {
            case 'videos':
                message = isOwnProfile ? 'Share your first video' : `No videos yet`;
                description = isOwnProfile
                    ? 'Start creating and sharing your amazing content with the world'
                    : `${user?.username} hasn't posted any videos yet. Check back later!`;
                icon = <Video size={64} color="#6B7280" />;
                break;
            case 'likes':
                message = 'No liked videos';
                description = isOwnProfile
                    ? 'Videos you like will appear here'
                    : `${user?.username}'s liked videos will appear here`;
                icon = <Heart size={64} color="#6B7280" />;
                break;
            case 'saved':
                message = 'No saved videos';
                description = 'Videos you save will appear here';
                icon = <BookmarkPlus size={64} color="#6B7280" />;
                break;
            case 'private':
                message = 'No private videos';
                description = 'Your private videos will appear here';
                icon = <Lock size={64} color="#6B7280" />;
                break;
        }

        return (
            <View style={styles.emptyStateContainer}>
                {icon}
                <Text style={styles.emptyStateTitle}>{message}</Text>
                <Text style={styles.emptyStateDescription}>{description}</Text>
                {isOwnProfile && activeTab === 'videos' && (
                    <TouchableOpacity
                        style={styles.createVideoButton}
                        onPress={() => router.push('/(tabs)/create')}
                    >
                        <LinearGradient
                            colors={['#FF5A5F', '#FF5A5F']}
                            style={styles.createVideoGradient}
                        >
                            <Play size={20} color="white" />
                            <Text style={styles.createVideoText}>Create Video</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {!isOwnProfile && activeTab === 'videos' && (
                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={() => router.push('/(tabs)/explore')}
                    >
                        <Text style={styles.exploreButtonText}>Explore other creators</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                    <Animated.View style={[styles.loadingSpinner, { transform: [{ scale: scaleAnim }] }]}>
                        <ActivityIndicator size="large" color="#FF5A5F" />
                    </Animated.View>
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || !user) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <AlertTriangle size={64} color="#FF5A5F" />
                <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                <Text style={styles.errorText}>{error || 'User not found'}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchUserProfile}
                >
                    <LinearGradient
                        colors={['#FF5A5F', '#FF5A5F']}
                        style={styles.retryGradient}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const activeData = getActiveData();
    const visibleTabs = isOwnProfile ? 4 : 2;

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>

                <Animated.Text
                    style={[
                        styles.headerTitle,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    @{user.username}
                </Animated.Text>

                {!isOwnProfile ? (
                    <TouchableOpacity onPress={handleMoreOptions} style={styles.headerButton}>
                        <MoreHorizontal size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleEditProfile} style={styles.headerButton}>
                        <Settings size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={activeData}
                renderItem={renderVideoItem}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                numColumns={3}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#FF5A5F"
                        colors={['#FF5A5F']}
                    />
                }
                ListHeaderComponent={
                    <Animated.View
                        style={[
                            styles.profileContainer,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideAnim },
                                    { scale: scaleAnim }
                                ]
                            }
                        ]}
                    >
                        {/* Profile Section */}
                        <View style={styles.profileSection}>
                            {/* Profile Image with Animation */}
                            <Animated.View
                                style={[
                                    styles.profileImageContainer,
                                    { transform: [{ scale: profileImageScale }] }
                                ]}
                            >
                                <Image
                                    source={{
                                        uri: user.profilePhotoUrl || 'https://via.placeholder.com/150'
                                    }}
                                    style={styles.profileImage}
                                />
                                {user.creatorVerified && (
                                    <View style={styles.verifiedBadge}>
                                        <CheckCircle size={20} color="white" fill="#FF5A5F" />
                                    </View>
                                )}
                            </Animated.View>

                            {/* User Info */}
                            <View style={styles.userInfo}>
                                <Text style={styles.displayName}>
                                    {user.fullName || `@${user.username}`}
                                </Text>

                                <View style={styles.usernameRow}>
                                    <Text style={styles.username}>@{user.username}</Text>
                                    {user.creatorCategory && (
                                        <View style={styles.categoryBadge}>
                                            <Star size={12} color="#FF5A5F" fill="#FF5A5F" />
                                            <Text style={styles.categoryText}>{user.creatorCategory}</Text>
                                        </View>
                                    )}
                                </View>

                                {user.bio && (
                                    <Text style={styles.bio}>{user.bio}</Text>
                                )}

                                {/* Additional Info */}
                                <View style={styles.additionalInfo}>
                                    {user.location && (
                                        <View style={styles.infoItem}>
                                            <MapPin size={14} color="#9CA3AF" />
                                            <Text style={styles.infoText}>{user.location}</Text>
                                        </View>
                                    )}
                                    <View style={styles.infoItem}>
                                        <Calendar size={14} color="#9CA3AF" />
                                        <Text style={styles.infoText}>{formatJoinDate(user.joinedAt)}</Text>
                                    </View>
                                </View>

                                {/* Stats */}
                                <Animated.View
                                    style={[
                                        styles.statsContainer,
                                        { opacity: statsOpacity }
                                    ]}
                                >
                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>
                                            {formatNumber(user._count.videos)}
                                        </Text>
                                        <Text style={styles.statLabel}>Videos</Text>
                                    </View>

                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>
                                            {formatNumber(user._count.followers)}
                                        </Text>
                                        <Text style={styles.statLabel}>Followers</Text>
                                    </View>

                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>
                                            {formatNumber(user._count.following)}
                                        </Text>
                                        <Text style={styles.statLabel}>Following</Text>
                                    </View>
                                </Animated.View>

                                {/* Action Buttons */}
                                <View style={styles.actionButtons}>
                                    {isOwnProfile ? (
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={handleEditProfile}
                                        >
                                            <Edit3 size={18} color="white" />
                                            <Text style={styles.editButtonText}>Edit Profile</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                style={[
                                                    styles.followButton,
                                                    isFollowing && styles.followingButton
                                                ]}
                                                onPress={() => handleFollowChange(!isFollowing)}
                                            >
                                                <LinearGradient
                                                    colors={isFollowing ? ['#374151', '#374151'] : ['#FF5A5F', '#FF5A5F']}
                                                    style={styles.followGradient}
                                                >
                                                    {isFollowing ? (
                                                        <UserCheck size={18} color="white" />
                                                    ) : (
                                                        <UserPlus size={18} color="white" />
                                                    )}
                                                    <Text style={styles.followButtonText}>
                                                        {isFollowing ? 'Following' : 'Follow'}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.messageButton}
                                                onPress={handleMessage}
                                            >
                                                <MessageCircle size={20} color="white" />
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.shareButton}>
                                                <Share size={20} color="white" />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Enhanced Tabs */}
                        <View style={styles.tabsContainer}>
                            <View style={styles.tabsWrapper}>
                                {renderTabButton('videos',
                                    <Grid3X3 size={20} color={activeTab === 'videos' ? '#FF5A5F' : '#6B7280'} />,
                                    'Videos'
                                )}
                                {renderTabButton('likes',
                                    <Heart size={20} color={activeTab === 'likes' ? '#FF5A5F' : '#6B7280'} />,
                                    'Likes'
                                )}
                                {isOwnProfile && renderTabButton('saved',
                                    <BookmarkPlus size={20} color={activeTab === 'saved' ? '#FF5A5F' : '#6B7280'} />,
                                    'Saved'
                                )}
                                {isOwnProfile && renderTabButton('private',
                                    <Lock size={20} color={activeTab === 'private' ? '#FF5A5F' : '#6B7280'} />,
                                    'Private'
                                )}
                            </View>

                            {/* Animated Tab Indicator */}
                            <Animated.View
                                style={[
                                    styles.tabIndicator,
                                    {
                                        width: width / visibleTabs,
                                        transform: [{ translateX: tabIndicatorAnim }]
                                    }
                                ]}
                            />
                        </View>
                    </Animated.View>
                }
                ListEmptyComponent={renderEmptyState}
                ItemSeparatorComponent={() => <View style={styles.videoSeparator} />}
                columnWrapperStyle={styles.videoRow}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#1a1a2e',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(55,65,81,0.1)',
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Figtree',
    },
    profileContainer: {
        backgroundColor: '#1a1a2e',
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: 10,
    },
    profileSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },
    profileImageContainer: {
        alignSelf: 'center',
        position: 'relative',
        marginBottom: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#FF5A5F',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#1a1a2e',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1a1a2e',
    },
    userInfo: {
        alignItems: 'center',
    },
    displayName: {
        color: 'white',
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: 'Figtree',
    },
    usernameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    username: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '500',
        marginRight: 12,
        fontFamily: 'Figtree',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    categoryText: {
        color: '#FF5A5F',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    bio: {
        color: '#F3F4F6',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
        paddingHorizontal: 20,
        fontFamily: 'Figtree',
    },
    additionalInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontFamily: 'Figtree',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 40,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        color: 'white',
        fontSize: 22,
        fontWeight: '800',
        fontFamily: 'Figtree',
    },
    statLabel: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 4,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        padding: 4,
    },
    followButton: {
        flex: 1,
        borderRadius: 25,
        overflow: 'hidden',
    },
    followingButton: {
        borderWidth: 1,
        borderColor: '#374151',
    },
    followGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    followButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        fontFamily: 'Figtree',
    },
    messageButton: {
        backgroundColor: '#1a1a2e',
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#4B5563',
    },
    editButton: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#4B5563',
        gap: 8,
    },
    editButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        fontFamily: 'Figtree',
    },
    shareButton: {
        backgroundColor: '#1a1a2e',
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#4B5563',
    },
    tabsContainer: {
        backgroundColor: '#1a1a2e',
        position: 'relative',
        marginBottom: 10,
    },
    tabsWrapper: {
        flexDirection: 'row',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 16,
    },
    tabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    activeTabContent: {
        transform: [{ scale: 1.05 }],
    },
    tabLabel: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    activeTabLabel: {
        color: '#FF5A5F',
        fontWeight: '700',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        backgroundColor: '#FF5A5F',
        borderRadius: 2,
    },
    videoRow: {
        justifyContent: 'flex-start',
        paddingHorizontal: 0,
        gap: 10
    },
    videoSeparator: {
        height: 8,
    },
    videoItem: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.6,
        marginBottom: 8,
    },
    videoTouchable: {
        flex: 1,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        position: 'relative',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
    },
    videoGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    videoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    videoStats: {
        flexDirection: 'row',
        gap: 8,
    },
    videoStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    videoStatText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    videoDuration: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    videoDurationText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    playButtonOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    privateIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateContainer: {
        alignItems: 'center',
        padding: 40,
        minHeight: 400,
        justifyContent: 'center',
    },
    emptyStateTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 8,
        fontFamily: 'Figtree',
    },
    emptyStateDescription: {
        color: '#9CA3AF',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 30,
        fontFamily: 'Figtree',
    },
    emptyStateText: {
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Figtree',
    },
    createVideoButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    createVideoGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 8,
    },
    createVideoText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        fontFamily: 'Figtree',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingSpinner: {
        marginBottom: 20,
    },
    loadingText: {
        color: '#F3F4F6',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        padding: 20,
    },
    errorTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: 'Figtree',
    },
    errorText: {
        color: '#9CA3AF',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 30,
        lineHeight: 24,
        fontFamily: 'Figtree',
    },
    retryButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    retryGradient: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        fontFamily: 'Figtree',
    },
    pulseRing: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'rgba(255, 90, 95, 0.3)',
        top: -5,
        left: -5,
    },
    navigationHint: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        opacity: 0.8,
    },
    navigationHintText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        fontFamily: 'Figtree',
    },
    exploreButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#4B5563',
        backgroundColor: '#1a1a2e',
    },
    exploreButtonText: {
        color: '#F3F4F6',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        fontFamily: 'Figtree',
    },
});