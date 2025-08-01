import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { CustomModal } from "@/components/ui/CustomModal";
import { User, Heart, CheckCircle, UserCheck, Star, Lock, ArrowRight, Copy, X, AlertTriangle, CreditCard } from 'lucide-react-native';
import { CreatorAPI, SubscriptionPlan, SocialAPI } from '@/lib/api/CreatorAPI';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import FollowButton from "@/components/VideoFeed/partial/FollowButton";
import {router} from "expo-router";

// Types
interface Creator {
    id: string;
    username: string;
    profilePhotoUrl: string;
    verified: boolean;
    category: string;
    subscriberCount: number;
}

interface FollowStats {
    followers: number;
    following: number;
    isFollowing: boolean;
}

interface UserProfileModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
    username?: string;
    avatar?: string;
    onViewFullProfile?: (userId: string) => void;
}

export const UserProfileModal = ({
                                     visible,
                                     onClose,
                                     userId,
                                     username: initialUsername,
                                     avatar: initialAvatar,
                                     onViewFullProfile,
                                 }: UserProfileModalProps) => {
    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creator, setCreator] = useState<Creator | null>(null);
    const [isCreator, setIsCreator] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPlans, setShowPlans] = useState(false);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [username, setUsername] = useState(initialUsername || '');
    const [avatar, setAvatar] = useState(initialAvatar || '');
    const [followStats, setFollowStats] = useState<FollowStats>({ followers: 0, following: 0, isFollowing: false });
    const [followLoading, setFollowLoading] = useState(false);
    const [thankYouVisible, setThankYouVisible] = useState(false);

    // Animation values
    const [scaleAnim] = useState(new Animated.Value(0.95));
    const [opacityAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    // Auth context
    const { isAuthenticated, user } = useAuth();

    // Fetch user/creator data when modal becomes visible
    useEffect(() => {
        if (visible && userId) {
            fetchUserData();
            fetchFollowStatus();

            // Run entrance animation
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
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
        }
    }, [visible, userId]);

    const fetchUserData = async () => {
        setLoading(true);
        setError(null);
        try {
            // First check if user is a creator
            const creatorStatusResponse = await CreatorAPI.getUserCreatorStatus(userId);

            if (creatorStatusResponse.success) {
                const creatorData = creatorStatusResponse.creator;

                // Check if user is a creator based on role
                const userIsCreator = creatorData.isCreator;
                const userIsEligible = creatorData.isEligibleForCreator;

                setIsCreator(userIsCreator);

                // Set username if not provided
                if (!initialUsername) {
                    // Try to get username from creator status or use fallback
                    if (creatorData.username) {
                        setUsername(creatorData.username);
                    } else {
                        setUsername(creatorData.creatorCategory || 'User');
                    }
                }

                // If user is a creator and eligible, fetch their plans
                if (userIsCreator && userIsEligible) {
                    // Fetch creator details and plans
                    const creatorPlansResponse = await CreatorAPI.getCreatorPlans(userId);

                    if (creatorPlansResponse.success) {
                        setCreator({
                            id: userId,
                            username: creatorPlansResponse.creator.username,
                            profilePhotoUrl: creatorPlansResponse.creator.profilePhotoUrl,
                            verified: creatorPlansResponse.creator.verified,
                            category: creatorPlansResponse.creator.category || 'Content Creator',
                            subscriberCount: creatorPlansResponse.creator.subscriberCount
                        });

                        // Set the plans from the response
                        if (creatorPlansResponse.plans && Array.isArray(creatorPlansResponse.plans)) {
                            setPlans(creatorPlansResponse.plans);
                        }

                        // Set avatar if not provided initially
                        if (!initialAvatar && creatorPlansResponse.creator.profilePhotoUrl) {
                            setAvatar(creatorPlansResponse.creator.profilePhotoUrl);
                        }

                        // Check if current user is subscribed
                        if (isAuthenticated && user) {
                            try {
                                const isUserSubscribed = await CreatorAPI.checkSubscriptionStatus(user.id, userId);
                                setIsSubscribed(isUserSubscribed);
                            } catch (subError) {
                                console.error('Error checking subscription status:', subError);
                            }
                        }
                    } else {
                        console.error('Failed to fetch creator plans:', creatorPlansResponse);
                    }
                } else if (creatorData.subscriptionPlans && Array.isArray(creatorData.subscriptionPlans)) {
                    // If the user status endpoint returned plans directly, use those
                    setPlans(creatorData.subscriptionPlans);

                    // Set basic creator info from the creator status response
                    if (userIsCreator) {
                        setCreator({
                            id: userId,
                            username: initialUsername || 'Creator',
                            profilePhotoUrl: initialAvatar || '',
                            verified: creatorData.creatorVerified || false,
                            category: creatorData.creatorCategory || 'Content Creator',
                            subscriberCount: creatorData.stats?.subscribers || 0
                        });
                    }
                }
            } else {
                console.error('Creator status API returned error:', creatorStatusResponse);
                // Set minimal info from props in case of API error
                if (!initialUsername) {
                    setUsername('User');
                }
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Could not load user profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowStatus = async () => {
        if (!userId) return;

        try {
            const response = await SocialAPI.getFollowStatus(userId);
            if (response.success) {
                setFollowStats({
                    followers: response.follow.stats.followers,
                    following: response.follow.stats.following,
                    isFollowing: response.follow.isFollowing
                });
            }
        } catch (error) {
            console.error('Error fetching follow status:', error);
        }
    };

    const handleFollow = async () => {
        if (!isAuthenticated) {
            alert('Please log in to follow this user');
            return;
        }

        setFollowLoading(true);
        try {
            if (followStats.isFollowing) {
                const response = await SocialAPI.unfollowUser(userId);
                if (response.success) {
                    setFollowStats(prev => ({
                        ...prev,
                        isFollowing: false,
                        followers: (prev.followers > 0) ? prev.followers - 1 : 0
                    }));
                }
            } else {
                const response = await SocialAPI.followUser(userId);
                if (response.success) {
                    setFollowStats(prev => ({
                        ...prev,
                        isFollowing: true,
                        followers: prev.followers + 1
                    }));
                }
            }
        } catch (error) {
            console.error('Error updating follow status:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            // Prompt user to login
            alert('Please log in to subscribe to this creator');
            return;
        }

        if (isSubscribed) {
            // Show subscription management
            setShowPlans(true);
        } else {
            // Show subscription plans
            setShowPlans(true);
        }
    };

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
    };

    const handleSubscribeToPlan = async () => {
        if (!selectedPlan || !isAuthenticated) return;

        setIsProcessing(true);
        try {
            // Use the CreatorAPI to handle subscription
            const success = await CreatorAPI.subscribeToPlan(userId, selectedPlan);

            if (success) {
                setIsSubscribed(true);
                setShowPlans(false);
                setThankYouVisible(true);

                // Hide thank you message after 3 seconds
                setTimeout(() => {
                    setThankYouVisible(false);
                }, 3000);
            } else {
                alert('Failed to subscribe. Please try again later.');
            }
        } catch (err) {
            console.error('Error subscribing to plan:', err);
            alert('Failed to subscribe. Please try again later.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleViewFullProfile = () => {
        onClose();
        // Navigate to the full profile page
        if (onViewFullProfile) {
            onViewFullProfile(userId);
        } else {
            // Default navigation if no handler provided
            router.push(`/(tabs)/profile/${userId}`);
        }
    };

    const handleShare = () => {
        // In a real app, this would open the platform's native share dialog
        alert(`Profile link for @${username} copied to clipboard!`);
    };

    // Format numbers
    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    // Render loading state
    if (loading) {
        return (
            <CustomModal
                visible={visible}
                onClose={onClose}
                title="Loading Profile"
            >
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingSpinner}>
                        <ActivityIndicator size="large" color="#FF5A5F" />
                    </View>
                    <Text style={styles.loadingText}>Loading user profile...</Text>
                </View>
            </CustomModal>
        );
    }

    // Render error state
    if (error) {
        return (
            <CustomModal
                visible={visible}
                onClose={onClose}
                title="Error"
                primaryAction={{
                    label: "Try Again",
                    onPress: fetchUserData
                }}
            >
                <View style={styles.errorContainer}>
                    <View style={styles.errorIcon}>
                        <AlertTriangle size={48} color="#FF5A5F" />
                    </View>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </CustomModal>
        );
    }

    // Render "Thank You" overlay
    const renderThankYou = () => {
        if (!thankYouVisible) return null;

        return (
            <View style={styles.thankYouOverlay}>
                <Animated.View style={[
                    styles.thankYouCard,
                    {
                        transform: [{
                            scale: scaleAnim.interpolate({
                                inputRange: [0.95, 1],
                                outputRange: [0.8, 1],
                            })
                        }]
                    }
                ]}>
                    <LinearGradient
                        colors={['rgba(255, 90, 95, 0.2)', 'rgba(255, 90, 95, 0.1)']}
                        style={styles.thankYouGradient}
                    >
                        <View style={styles.thankYouIconContainer}>
                            <Star size={48} color="#FF5A5F" />
                        </View>
                        <Text style={styles.thankYouTitle}>Thank You!</Text>
                        <Text style={styles.thankYouText}>
                            You are now subscribed to {creator?.username || username}'s content.
                        </Text>
                    </LinearGradient>
                </Animated.View>
            </View>
        );
    };

    // Render subscription plans view
    if (showPlans && isCreator) {
        return (
            <CustomModal
                visible={visible}
                onClose={() => setShowPlans(false)}
                title="Subscription Plans"
                primaryAction={
                    selectedPlan && !isProcessing
                        ? {
                            label: isSubscribed ? "Manage Subscription" : "Subscribe",
                            onPress: handleSubscribeToPlan
                        }
                        : undefined
                }
                secondaryAction={{
                    label: "Back",
                    onPress: () => setShowPlans(false)
                }}
            >
                <View style={styles.plansContainer}>
                    {isProcessing ? (
                        <View style={styles.processingContainer}>
                            <View style={styles.processingSpinner}>
                                <ActivityIndicator size="large" color="#FF5A5F" />
                            </View>
                            <Text style={styles.processingText}>Processing your subscription...</Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.plansScrollContent}
                        >
                            {plans.length > 0 ? (
                                plans.map((plan, index) => (
                                    <Animated.View
                                        key={plan.id}
                                        style={[
                                            { transform: [{ translateY: slideAnim }] },
                                            { opacity: opacityAnim }
                                        ]}
                                    >
                                        <TouchableOpacity
                                            style={[
                                                styles.planCard,
                                                selectedPlan === plan.id && styles.selectedPlanCard
                                            ]}
                                            onPress={() => handleSelectPlan(plan.id)}
                                            activeOpacity={0.8}
                                        >
                                            {selectedPlan === plan.id && (
                                                <LinearGradient
                                                    colors={['#FF5A5F', '#FF7A7F']}
                                                    style={styles.selectedBadge}
                                                >
                                                    <CheckCircle size={16} color="white" />
                                                </LinearGradient>
                                            )}

                                            <View style={styles.planHeader}>
                                                <View style={styles.planNameSection}>
                                                    <Text style={styles.planName}>{plan.name}</Text>
                                                    {plan.features.length > 3 && (
                                                        <View style={styles.popularBadge}>
                                                            <Text style={styles.popularText}>Popular</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={styles.priceTag}>
                                                    <Text style={styles.planPrice}>
                                                        {plan.currency === 'USD' ? '$' : plan.currency}{plan.price.toFixed(2)}
                                                    </Text>
                                                    <Text style={styles.planInterval}>/{plan.intervalType}</Text>
                                                </View>
                                            </View>

                                            {plan.description && (
                                                <Text style={styles.planDescription}>{plan.description}</Text>
                                            )}

                                            <View style={styles.divider} />

                                            <View style={styles.planFeatures}>
                                                {plan.features.map((feature, featureIndex) => (
                                                    <View key={featureIndex} style={styles.featureItem}>
                                                        <View style={styles.featureIcon}>
                                                            <CheckCircle size={16} color="#10B981" />
                                                        </View>
                                                        <Text style={styles.featureText}>{feature}</Text>
                                                    </View>
                                                ))}
                                            </View>

                                            {selectedPlan === plan.id && (
                                                <Animated.View
                                                    style={[
                                                        styles.paymentInfo,
                                                        {
                                                            opacity: opacityAnim,
                                                            transform: [{ translateY: slideAnim }]
                                                        }
                                                    ]}
                                                >
                                                    <CreditCard size={16} color="#9CA3AF" />
                                                    <Text style={styles.paymentInfoText}>
                                                        You'll be charged {plan.currency === 'USD' ? '$' : plan.currency}{plan.price.toFixed(2)} {plan.intervalType}.
                                                    </Text>
                                                </Animated.View>
                                            )}
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))
                            ) : (
                                <View style={styles.noPlansContainer}>
                                    <View style={styles.noPlansIcon}>
                                        <Lock size={48} color="#FF5A5F" />
                                    </View>
                                    <Text style={styles.noPlansTitle}>Coming Soon</Text>
                                    <Text style={styles.noPlansText}>
                                        Premium plans are being prepared for this creator.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>
            </CustomModal>
        );
    }

    // Render main profile view
    return (
        <CustomModal
            visible={visible}
            onClose={onClose}
            title={isCreator ? "Creator Profile" : "User Profile"}
        >
            <View style={styles.profileContainer}>
                {renderThankYou()}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.profileScrollContent}
                >
                    <Animated.View style={[
                        {
                            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                            opacity: opacityAnim
                        }
                    ]}>
                        {/* Profile Header */}
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarSection}>
                                <View style={styles.avatarContainer}>
                                    <Image
                                        source={{ uri: avatar || 'https://via.placeholder.com/150' }}
                                        style={styles.profileImage}
                                    />
                                    {isCreator && creator?.verified && (
                                        <View style={styles.verifiedBadge}>
                                            <CheckCircle size={16} color="white" />
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={styles.profileInfo}>
                                <View style={styles.usernameSection}>
                                    <Text style={styles.username}>@{username}</Text>
                                    {isCreator && creator && (
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>{creator.category}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Stats Grid */}
                                <View style={styles.statsGrid}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>{formatNumber(followStats.followers)}</Text>
                                        <Text style={styles.statLabel}>Followers</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>{formatNumber(followStats.following)}</Text>
                                        <Text style={styles.statLabel}>Following</Text>
                                    </View>
                                    {isCreator && creator && (
                                        <>
                                            <View style={styles.statDivider} />
                                            <View style={styles.statItem}>
                                                <Text style={styles.statNumber}>{formatNumber(creator.subscriberCount)}</Text>
                                                <Text style={styles.statLabel}>Subscribers</Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtonsContainer}>
                            {isCreator ? (
                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        isSubscribed && styles.subscribedButton
                                    ]}
                                    onPress={handleSubscribe}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={isSubscribed ? ['#10B981', '#059669'] : ['#FF5A5F', '#FF7A7F']}
                                        style={styles.buttonGradient}
                                    >
                                        <Star size={20} color="white" />
                                        <Text style={styles.primaryButtonText}>
                                            {isSubscribed ? 'Subscribed' : 'Subscribe'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.followButtonContainer}>
                                    <FollowButton
                                        userId={userId}
                                        initialFollowState={followStats.isFollowing}
                                        size="medium"
                                        style={styles.followButton}
                                        onFollowChange={(isFollowing) => {
                                            setFollowStats(prev => ({
                                                ...prev,
                                                isFollowing,
                                                followers: isFollowing ? prev.followers + 1 : prev.followers - 1
                                            }));
                                        }}
                                    />
                                </View>
                            )}

                            <TouchableOpacity style={styles.secondaryButton} onPress={handleShare} activeOpacity={0.8}>
                                <View style={styles.secondaryButtonContent}>
                                    <Copy size={18} color="#9CA3AF" />
                                    <Text style={styles.secondaryButtonText}>Share</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* View Full Profile */}
                        <TouchableOpacity
                            style={styles.viewProfileButton}
                            onPress={handleViewFullProfile}
                            activeOpacity={0.8}
                        >
                            <View style={styles.viewProfileContent}>
                                <Text style={styles.viewProfileText}>View Full Profile</Text>
                                <ArrowRight size={20} color="#FF5A5F" />
                            </View>
                        </TouchableOpacity>

                        {/* Recent Content Section for Creators */}
                        {isCreator && creator && (
                            <View style={styles.recentContentSection}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Recent Content</Text>
                                    <TouchableOpacity style={styles.seeAllButton} activeOpacity={0.7}>
                                        <Text style={styles.seeAllText}>See All</Text>
                                        <ArrowRight size={16} color="#FF5A5F" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.contentGrid}>
                                    {/* Content Placeholders */}
                                    {[1, 2].map((item) => (
                                        <View key={item} style={styles.contentItem}>
                                            <View style={styles.contentThumbnail}>
                                                <View style={styles.thumbnailPlaceholder} />
                                                <View style={styles.playIconContainer}>
                                                    <View style={styles.playIcon} />
                                                </View>
                                            </View>
                                            <View style={styles.contentInfo}>
                                                <View style={styles.contentTitlePlaceholder} />
                                                <View style={styles.contentMetaPlaceholder} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    // Container
    profileContainer: {
        maxHeight: 600, // Limit height to ensure it fits in modal
    },
    profileScrollContent: {
        paddingBottom: 20,
    },

    // Plans container
    plansContainer: {
        maxHeight: 500, // Limit height for plans modal
    },
    plansScrollContent: {
        paddingBottom: 20,
    },

    // Loading and Error states
    loadingContainer: {
        paddingVertical: 60,
        paddingHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingSpinner: {
        padding: 20,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 50,
        marginBottom: 24,
    },
    loadingText: {
        color: '#F3F4F6',
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    errorContainer: {
        paddingVertical: 60,
        paddingHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorIcon: {
        padding: 20,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 50,
        marginBottom: 24,
    },
    errorText: {
        color: '#FF5A5F',
        textAlign: 'center',
        fontSize: 16,
        fontFamily: 'Figtree',
        fontWeight: '500',
        lineHeight: 24,
    },

    // Processing state
    processingContainer: {
        paddingVertical: 60,
        paddingHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingSpinner: {
        padding: 20,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 50,
        marginBottom: 24,
    },
    processingText: {
        color: '#F3F4F6',
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Figtree',
        fontWeight: '500',
    },

    // Thank you overlay
    thankYouOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        padding: 20,
    },
    thankYouCard: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    thankYouGradient: {
        padding: 32,
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    thankYouIconContainer: {
        padding: 16,
        backgroundColor: 'rgba(255, 90, 95, 0.2)',
        borderRadius: 50,
        marginBottom: 20,
    },
    thankYouTitle: {
        color: '#F3F4F6',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        fontFamily: 'Figtree',
    },
    thankYouText: {
        color: '#9CA3AF',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'Figtree',
        fontWeight: '400',
    },

    // Profile Header
    profileHeader: {
        marginBottom: 32,
        paddingHorizontal: 4,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#FF5A5F',
        shadowColor: '#FF5A5F',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#FF5A5F',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
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

    profileInfo: {
        alignItems: 'center',
    },
    usernameSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    username: {
        color: '#F3F4F6',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        fontFamily: 'Figtree',
        textAlign: 'center',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 90, 95, 0.2)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    categoryText: {
        color: '#FF5A5F',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(26, 26, 46, 0.5)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#4B5563',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        color: '#F3F4F6',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Figtree',
        marginBottom: 4,
    },
    statLabel: {
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#4B5563',
        marginHorizontal: 16,
    },

    // Action Buttons
    actionButtonsContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    primaryButton: {
        flex: 2,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#FF5A5F',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    primaryButtonText: {
        color: '#F3F4F6',
        fontWeight: '700',
        marginLeft: 8,
        fontFamily: 'Figtree',
        fontSize: 16,
    },
    subscribedButton: {
        shadowColor: '#10B981',
    },
    followButtonContainer: {
        flex: 2,
    },
    followButton: {
        shadowColor: '#FF5A5F',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#4B5563',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    secondaryButtonText: {
        color: '#9CA3AF',
        fontWeight: '600',
        marginLeft: 6,
        fontFamily: 'Figtree',
        fontSize: 15,
    },

    // View Profile Button
    viewProfileButton: {
        marginBottom: 32,
        backgroundColor: 'rgba(26, 26, 46, 0.6)',
        borderWidth: 1,
        borderColor: '#4B5563',
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
    viewProfileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
    },
    viewProfileText: {
        color: '#F3F4F6',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
        fontFamily: 'Figtree',
    },

    // Recent Content Section
    recentContentSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        color: '#F3F4F6',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.2)',
    },
    seeAllText: {
        color: '#FF5A5F',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Figtree',
        marginRight: 4,
    },

    contentGrid: {
        gap: 16,
    },
    contentItem: {
        backgroundColor: 'rgba(26, 26, 46, 0.6)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#4B5563',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    contentThumbnail: {
        position: 'relative',
        height: 120,
        backgroundColor: '#4B5563',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#6B7280',
    },
    playIconContainer: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 90, 95, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playIcon: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 0,
        borderBottomWidth: 6,
        borderTopWidth: 6,
        borderLeftColor: '#FFFFFF',
        borderRightColor: 'transparent',
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        marginLeft: 2,
    },
    contentInfo: {
        padding: 16,
    },
    contentTitlePlaceholder: {
        height: 16,
        width: '85%',
        backgroundColor: '#6B7280',
        borderRadius: 4,
        marginBottom: 8,
    },
    contentMetaPlaceholder: {
        height: 12,
        width: '50%',
        backgroundColor: '#6B7280',
        borderRadius: 4,
    },

    // Subscription Plans
    planCard: {
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#4B5563',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    selectedPlanCard: {
        borderColor: '#FF5A5F',
        backgroundColor: 'rgba(42, 42, 58, 0.9)',
        shadowColor: '#FF5A5F',
        shadowOpacity: 0.4,
    },
    selectedBadge: {
        position: 'absolute',
        top: -10,
        right: -10,
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        borderWidth: 3,
        borderColor: '#1a1a2e',
    },
    planHeader: {
        marginBottom: 16,
    },
    planNameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    planName: {
        color: '#F3F4F6',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Figtree',
        flex: 1,
    },
    popularBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    popularText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    priceTag: {
        backgroundColor: 'rgba(255, 90, 95, 0.2)',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'baseline',
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    planPrice: {
        color: '#F3F4F6',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    planInterval: {
        color: '#9CA3AF',
        fontSize: 14,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    planDescription: {
        color: '#9CA3AF',
        marginBottom: 20,
        lineHeight: 22,
        fontFamily: 'Figtree',
        fontSize: 15,
    },
    divider: {
        height: 1,
        backgroundColor: '#4B5563',
        marginBottom: 20,
    },
    planFeatures: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureIcon: {
        marginRight: 12,
        width: 16,
        height: 16,
    },
    featureText: {
        color: '#F3F4F6',
        fontFamily: 'Figtree',
        fontSize: 15,
        flex: 1,
        lineHeight: 20,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        padding: 16,
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#4B5563',
    },
    paymentInfoText: {
        color: '#9CA3AF',
        fontSize: 13,
        marginLeft: 8,
        fontFamily: 'Figtree',
        flex: 1,
        lineHeight: 18,
    },
    noPlansContainer: {
        alignItems: 'center',
        padding: 60,
    },
    noPlansIcon: {
        padding: 20,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 50,
        marginBottom: 24,
    },
    noPlansTitle: {
        color: '#F3F4F6',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'Figtree',
    },
    noPlansText: {
        color: '#9CA3AF',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'Figtree',
    },
});