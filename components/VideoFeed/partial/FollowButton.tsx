import React, { useState, useEffect, useRef } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    View,
    Animated
} from 'react-native';
import { SocialAPI } from '@/lib/api/CreatorAPI';
import { useAuth } from '@/hooks/useAuth';

interface FollowButtonProps {
    userId: string;
    initialFollowState?: boolean;
    size?: 'small' | 'medium' | 'large';
    variant?: 'filled' | 'outlined' | 'transparent';
    onFollowChange?: (isFollowing: boolean) => void;
    iconOnly?: boolean;
    style?: any;
}

const FollowButton: React.FC<FollowButtonProps> = ({
                                                       userId,
                                                       initialFollowState = false,
                                                       size = 'medium',
                                                       variant = 'filled',
                                                       onFollowChange,
                                                       iconOnly = false,
                                                       style
                                                   }) => {
    const [isFollowing, setIsFollowing] = useState(initialFollowState);
    const [followLoading, setFollowLoading] = useState(false);

    const { isAuthenticated, user } = useAuth();
    const loadingStartTime = useRef<number>(0);

    // Update state if prop changes
    useEffect(() => {
        setIsFollowing(initialFollowState);
    }, [initialFollowState]);

    // Fetch initial follow status if not provided
    useEffect(() => {
        if (!initialFollowState && userId) {
            fetchFollowStatus();
        }
    }, [userId]);

    const fetchFollowStatus = async () => {
        if (!userId || !isAuthenticated) return;

        try {
            const response = await SocialAPI.getFollowStatus(userId);
            if (response.success) {
                setIsFollowing(response.follow.isFollowing);
            }
        } catch (error) {
            console.error('Error fetching follow status:', error);
        }
    };

    const ensureMinimumLoadingTime = async (asyncOperation: () => Promise<any>) => {
        loadingStartTime.current = Date.now();

        try {
            const result = await asyncOperation();
            const elapsedTime = Date.now() - loadingStartTime.current;
            const remainingTime = Math.max(0, 600 - elapsedTime);

            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }

            return result;
        } catch (error) {
            const elapsedTime = Date.now() - loadingStartTime.current;
            const remainingTime = Math.max(0, 600 - elapsedTime);

            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }

            throw error;
        }
    };

    const handleFollow = async () => {
        if (!isAuthenticated) {
            alert('Please log in to follow this user');
            return;
        }

        if (user?.id === userId) {
            return;
        }

        setFollowLoading(true);

        try {
            await ensureMinimumLoadingTime(async () => {
                if (isFollowing) {
                    const response = await SocialAPI.unfollowUser(userId);
                    if (response.success) {
                        setIsFollowing(false);
                        if (onFollowChange) onFollowChange(false);
                    }
                } else {
                    const response = await SocialAPI.followUser(userId);
                    if (response.success) {
                        setIsFollowing(true);
                        if (onFollowChange) onFollowChange(true);
                    }
                }
            });
        } catch (error) {
            console.error('Error updating follow status:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    // Calculate sizes based on prop
    const getButtonStyles = () => {
        switch (size) {
            case 'small':
                return {
                    height: 24,
                    paddingHorizontal: 16,
                    borderRadius: 16,
                    fontSize: 12,
                };
            case 'large':
                return {
                    height: 48,
                    paddingHorizontal: 24,
                    borderRadius: 24,
                    fontSize: 16,
                };
            default: // medium
                return {
                    height: 40,
                    paddingHorizontal: 20,
                    borderRadius: 20,
                    fontSize: 14,
                };
        }
    };

    const getVariantStyles = () => {
        const followColor = '#FFF'; // App's pink color
        const followingColor = 'rgba(255,255,255,0.73)'; // Success green

        switch (variant) {
            case 'outlined':
                return {
                    backgroundColor: 'transparent',
                    borderColor: isFollowing ? followingColor : followColor,
                    borderWidth: 2,
                    textColor: isFollowing ? followingColor : followColor,
                };
            case 'transparent':
                return {
                    backgroundColor: isFollowing ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 90, 95, 0.15)',
                    borderColor: 'transparent',
                    borderWidth: 0,
                    textColor: isFollowing ? followingColor : followColor,
                };
            default: // filled
                return {
                    backgroundColor: isFollowing ? followingColor : followColor,
                    borderColor: isFollowing ? followingColor : followColor,
                    borderWidth: 0,
                    textColor: '#F3F4F6',
                };
        }
    };

    const sizeStyles = getButtonStyles();
    const variantStyles = getVariantStyles();

    const renderLoadingBorder = () => {
        if (!followLoading) return null;

        const borderColor = isFollowing ? '#10B981' : '#FF5A5F';

        return (
            <Animated.View
                style={[
                    styles.loadingBorder,
                    {
                        height: sizeStyles.height + 4,
                        width: '100%',
                        borderRadius: sizeStyles.borderRadius,
                        borderColor: borderColor
                    }
                ]}
            />
        );
    };

    return (
        <Animated.View>
            <View style={{ position: 'relative' }}>
                {renderLoadingBorder()}

                <TouchableOpacity
                    style={[
                        styles.button,
                        {
                            height: sizeStyles.height,
                            paddingHorizontal: sizeStyles.paddingHorizontal,
                            borderRadius: sizeStyles.borderRadius,
                            backgroundColor: variantStyles.backgroundColor,
                            borderColor: variantStyles.borderColor,
                            borderWidth: variantStyles.borderWidth,
                        },
                        followLoading && styles.loadingButton,
                        style
                    ]}
                    onPress={handleFollow}
                    disabled={followLoading}
                    activeOpacity={0.8}
                >
                    <View style={styles.buttonContent}>
                        <Text style={[
                            styles.buttonText,
                            {
                                fontSize: sizeStyles.fontSize,
                                color: variantStyles.textColor,
                            }
                        ]}>
                            {followLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingButton: {
        shadowOpacity: 0.4,
        elevation: 5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    buttonText: {
        textAlign: 'center',
        fontFamily: 'Figtree',
        letterSpacing: 0.3,
    },
    loadingBorder: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        borderWidth: 2,
        borderStyle: 'solid',
        zIndex: 1,
    },
});

export default FollowButton