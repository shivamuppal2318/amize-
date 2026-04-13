import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Share as NativeShare } from 'react-native';
import { Share as ShareIcon, CheckCircle, Star, UserPlus, UserCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { SocialAPI } from '@/lib/api/SocialAPI';
import { SITE_URL } from '@/lib/settings/constants';

interface User {
    id: string;
    username: string;
    fullName?: string;
    bio?: string;
    profilePhotoUrl?: string;
    creatorVerified: boolean;
    creatorCategory?: string;
    role: string;
    _count: {
        videos: number;
        following: number;
        followers: number;
    };
}

interface ProfileHeaderProps {
    user: User;
    isOwnProfile: boolean;
    isFollowing: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
                                                                user,
                                                                isOwnProfile,
                                                                isFollowing,
                                                                onFollowChange,
                                                            }) => {
    const [followLoading, setFollowLoading] = useState(false);

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    const handleFollow = async () => {
        if (followLoading) return;

        setFollowLoading(true);
        try {
            const response = isFollowing
                ? await SocialAPI.unfollowUser(user.id)
                : await SocialAPI.followUser(user.id);

            if (response.success && onFollowChange) {
                onFollowChange(!isFollowing);
            }
        } catch (error) {
            console.error('Error updating follow status:', error);
            Alert.alert('Error', 'Failed to update follow status');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            const profileUrl = `${SITE_URL}/profile/${user.id}`;
            await NativeShare.share({
                title: `@${user.username} on Amize`,
                message: `Check out @${user.username} on Amize: ${profileUrl}`,
                url: profileUrl,
            });
        } catch (error) {
            console.error('Error sharing profile:', error);
        }
    };

    const handleEditProfile = () => {
        router.push('/settings/edit-profile');
    };

    return (
        <View style={styles.container}>
            {/* Profile Image and Basic Info */}
            <View style={styles.profileInfo}>
                <Image
                    source={{
                        uri: user.profilePhotoUrl || 'https://via.placeholder.com/150'
                    }}
                    style={styles.profileImage}
                />

                <View style={styles.infoContainer}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.displayName}>
                            {user.fullName || `@${user.username}`}
                        </Text>
                        {user.creatorVerified && (
                            <View style={styles.verifiedBadge}>
                                <CheckCircle size={16} color="white" />
                            </View>
                        )}
                    </View>

                    <Text style={styles.username}>@{user.username}</Text>

                    {user.creatorCategory && (
                        <View style={styles.categoryContainer}>
                            <Star size={14} color="#FF4D67" />
                            <Text style={styles.category}>{user.creatorCategory}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Bio */}
            {user.bio && (
                <Text style={styles.bio}>{user.bio}</Text>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.stat}>
                    <Text style={styles.statNumber}>
                        {formatNumber(user._count.videos)}
                    </Text>
                    <Text style={styles.statLabel}>Videos</Text>
                </View>

                <View style={styles.stat}>
                    <Text style={styles.statNumber}>
                        {formatNumber(user._count.followers)}
                    </Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </View>

                <View style={styles.stat}>
                    <Text style={styles.statNumber}>
                        {formatNumber(user._count.following)}
                    </Text>
                    <Text style={styles.statLabel}>Following</Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                {isOwnProfile ? (
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleEditProfile}
                    >
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.followButton,
                            isFollowing && styles.followingButton
                        ]}
                        onPress={handleFollow}
                        disabled={followLoading}
                    >
                        {isFollowing ? (
                            <UserCheck size={20} color="white" />
                        ) : (
                            <UserPlus size={20} color="white" />
                        )}
                        <Text style={styles.followButtonText}>
                            {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                >
                    <ShareIcon size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#1a1a2e',
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#FF4D67',
    },
    infoContainer: {
        flex: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    displayName: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginRight: 8,
    },
    verifiedBadge: {
        backgroundColor: '#1DA1F2',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    username: {
        color: '#BBBBBB',
        fontSize: 16,
        marginBottom: 4,
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    category: {
        color: '#FF4D67',
        fontSize: 14,
        fontWeight: '500',
    },
    bio: {
        color: '#BBBBBB',
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#2A2A2A',
    },
    stat: {
        alignItems: 'center',
    },
    statNumber: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        color: '#BBBBBB',
        fontSize: 14,
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    followButton: {
        flex: 1,
        backgroundColor: '#FF4D67',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    followingButton: {
        backgroundColor: '#333333',
        borderWidth: 1,
        borderColor: '#555555',
    },
    followButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    editButton: {
        flex: 1,
        backgroundColor: '#333333',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#555555',
    },
    editButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    shareButton: {
        backgroundColor: '#333333',
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
