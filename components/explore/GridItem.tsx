import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Animated,
    ActivityIndicator,
    Platform,
} from 'react-native';
import {
    Play,
    Heart,
    Eye,
    Crown,
    Music,
    Users,
    Sparkles,
    Volume2,
    Check,
} from 'lucide-react-native';
import { useVideoPlayer, VideoView, VideoSource } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { MixedFeedItem } from "@/lib/api/types/video";
import { isDemoMode } from "@/lib/release/releaseConfig";
import { canUseLocalDemoAuth } from "@/lib/auth/localDemoAuth";
import { getSafePosterUri, getSafeVideoUri } from "@/utils/mediaHelpers";

interface GridItemProps {
    item: MixedFeedItem;
    width: number;
    height: number;
    onVideoPress: (video: any) => void;
    onUserPress: (user: any) => void;
    onSoundPress: (sound: any) => void;
}

const GridItem: React.FC<GridItemProps> = memo(({
                                                    item,
                                                    width,
                                                    height,
                                                    onVideoPress,
                                                    onUserPress,
                                                    onSoundPress,
                                                }) => {
    const demoMode = isDemoMode() || canUseLocalDemoAuth();
    const staticPreviewOnly = Platform.OS === 'web';
    // State
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [mediaFailed, setMediaFailed] = useState(false);

    // Animation refs
    const scaleAnim = useRef(new Animated.Value(0.98)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // Component mounted ref
    const isMounted = useRef(true);

    // Animation on mount
    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        setMediaFailed(false);
        setIsLoading(true);
        setVideoReady(false);
        setIsPlaying(false);
    }, [item.id]);

    // Format numbers for display (1K, 1M, etc.)
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Get image URL or fallback
    const getImageUrl = (url?: string, type: string = 'default') => {
        if (url) return url;

        // Fallback placeholder URLs
        switch (type) {
            case 'video':
                return 'https://via.placeholder.com/300x400/1a1a2e/FF5A5F?text=Video';
            case 'user':
                return 'https://via.placeholder.com/500x500/1a1a2e/8B5CF6?text=User';
            default:
                return 'https://via.placeholder.com/300x300/1a1a2e/666?text=Content';
        }
    };

    // Video item component with Expo Video
    const VideoItem = ({ video }: { video: any }) => {
        // Create video player using Expo Video
        const videoSource: VideoSource = {
            uri: getSafeVideoUri(video.videoUrl || video.url || video.thumbnailUrl, video.id || item.id)
        };
        const player = useVideoPlayer(videoSource, (player) => {
            player.loop = true;
            player.muted = true;
        });
        const posterUri = getSafePosterUri(video.thumbnailUrl || video.poster || video.videoUrl, video.id || item.id);

        // Handle first frame render
        const handleFirstFrameRender = useCallback(() => {
            if (isMounted.current) {
                setIsLoading(false);
                setVideoReady(true);
            }
        }, []);

        // Open full video
        const handleOpenVideo = useCallback(() => {
            onVideoPress(video);
        }, [video]);

        // Preview video on press-in
        const handlePressIn = useCallback(() => {
            if (videoReady && !isPlaying) {
                player.play();
                setIsPlaying(true);
            }
        }, [videoReady, isPlaying, player]);

        // Pause video on press-out
        const handlePressOut = useCallback(() => {
            if (videoReady && isPlaying) {
                player.pause();
                setIsPlaying(false);
            }
        }, [videoReady, isPlaying, player]);

        return (
            <Animated.View
                style={[
                    styles.itemContainer,
                    { width, height, transform: [{ scale: scaleAnim }], opacity: opacityAnim }
                ]}
            >
                <TouchableOpacity
                    style={styles.videoTouchable}
                    onPress={handleOpenVideo}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.95}
                >
                    {/* Video Player */}
                    <VideoView
                        style={styles.videoThumbnail}
                        player={player}
                        contentFit="cover"
                        onFirstFrameRender={handleFirstFrameRender}
                    />

                    {!videoReady && (
                        <Image
                            source={{ uri: posterUri }}
                            style={styles.videoThumbnail}
                            resizeMode="cover"
                        />
                    )}

                    {/* Loading indicator */}
                    {isLoading && (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="small" color="#FF5A5F" />
                        </View>
                    )}

                    {/* Gradient overlay for better text visibility */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        locations={[0.6, 1]}
                        style={styles.gradientOverlay}
                    />

                    {/* Duration badge */}
                    {video.duration && (
                        <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>
                                {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                            </Text>
                        </View>
                    )}

                    {/* Minimal info overlay */}
                    <View style={styles.videoOverlay}>
                        {video.title && (
                            <Text style={styles.videoTitle} numberOfLines={1}>
                                {video.title}
                            </Text>
                        )}

                        <View style={styles.videoMeta}>
                            <TouchableOpacity
                                style={styles.creatorInfo}
                                onPress={() => onUserPress(video.user)}
                            >
                                <Text style={styles.creatorName} numberOfLines={1}>
                                    {video.user.fullName || video.user.username}
                                </Text>
                                {video.user.creatorVerified && (
                                    <View style={styles.verifiedBadge}>
                                        <Check size={8} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.videoStats}>
                                <View style={styles.statItem}>
                                    <Eye size={8} color="#DDD" />
                                    <Text style={styles.statText}>{formatNumber(video.viewsCount)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const DemoVideoItem = ({ video }: { video: any }) => {
        const thumbnail = getImageUrl(video.thumbnailUrl || video.poster, 'video');

        const handleOpenVideo = useCallback(() => {
            onVideoPress(video);
        }, [video]);

        return (
            <Animated.View
                style={[
                    styles.itemContainer,
                    { width, height, transform: [{ scale: scaleAnim }], opacity: opacityAnim }
                ]}
            >
                <TouchableOpacity
                    style={styles.videoTouchable}
                    onPress={handleOpenVideo}
                    activeOpacity={0.95}
                >
                    <Image
                        source={{ uri: thumbnail }}
                        style={styles.videoThumbnail}
                        resizeMode="cover"
                        onLoadEnd={() => setIsLoading(false)}
                        onError={() => {
                            setIsLoading(false);
                            setMediaFailed(true);
                        }}
                    />

                    {mediaFailed && (
                        <View style={styles.mediaFallback}>
                            <Play size={26} color="rgba(255,255,255,0.92)" />
                            <Text style={styles.mediaFallbackText}>Preview unavailable</Text>
                        </View>
                    )}

                    {isLoading && (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="small" color="#FF5A5F" />
                        </View>
                    )}

                    <LinearGradient
                        colors={['rgba(5, 14, 28, 0.08)', 'rgba(5, 14, 28, 0.28)', 'rgba(0,0,0,0.68)']}
                        locations={[0, 0.55, 1]}
                        style={styles.gradientOverlay}
                    />

                    {video.duration && (
                        <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>
                                {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                            </Text>
                        </View>
                    )}

                    <View style={styles.videoOverlay}>
                        {video.title && (
                            <Text style={styles.videoTitle} numberOfLines={1}>
                                {video.title}
                            </Text>
                        )}

                        <View style={styles.videoMeta}>
                            <TouchableOpacity
                                style={styles.creatorInfo}
                                onPress={() => onUserPress(video.user)}
                            >
                                <Text style={styles.creatorName} numberOfLines={1}>
                                    {video.user.fullName || video.user.username}
                                </Text>
                                {video.user.creatorVerified && (
                                    <View style={styles.verifiedBadge}>
                                        <Check size={8} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.videoStats}>
                                <View style={styles.statItem}>
                                    <Eye size={8} color="#DDD" />
                                    <Text style={styles.statText}>{formatNumber(video.viewsCount)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // User item component (full image fill)
    const UserItem = ({ user }: { user: any }) => {
        // Animation for hover effect
        const [isPressed, setIsPressed] = useState(false);
        const scaleProfileAnim = useRef(new Animated.Value(1)).current;

        useEffect(() => {
            Animated.spring(scaleProfileAnim, {
                toValue: isPressed ? 1.03 : 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }).start();
        }, [isPressed]);

        return (
            <Animated.View
                style={[
                    styles.itemContainer,
                    { width, height, transform: [{ scale: scaleAnim }], opacity: opacityAnim }
                ]}
            >
                <TouchableOpacity
                    style={styles.userTouchable}
                    onPress={() => onUserPress(user)}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                    activeOpacity={0.92}
                >
                    {/* Fill entire card with user image */}
                    <Image
                        source={{ uri: getImageUrl(user.profilePhotoUrl, 'user') }}
                        style={styles.userImageFill}
                        resizeMode="cover"
                        onError={() => setMediaFailed(true)}
                    />

                    {mediaFailed && (
                        <View style={styles.mediaFallback}>
                            <Users size={28} color="rgba(255,255,255,0.92)" />
                            <Text style={styles.mediaFallbackText}>Creator preview</Text>
                        </View>
                    )}

                    {/* Gradient overlay for better text visibility */}
                    <LinearGradient
                        colors={['rgba(8, 22, 42, 0.05)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.78)']}
                        locations={[0.25, 0.68, 1]}
                        style={styles.userGradient}
                    />

                    {/* User info on bottom */}
                    <View style={styles.userInfo}>
                        <View style={styles.userNameRow}>
                            <Text style={styles.userName} numberOfLines={1}>
                                {user.fullName || user.username}
                            </Text>
                            {user.verified && (
                                <Crown size={10} color="#FFD700" />
                            )}
                        </View>

                        <Text style={styles.userUsername} numberOfLines={1}>
                            @{user.username}
                        </Text>

                        <View style={styles.userStats}>
                            <View style={styles.userStatItem}>
                                <Users size={10} color="#DDD" />
                                <Text style={styles.userStatText}>
                                    {formatNumber(user.followersCount)}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.userStatItem}>
                                <Play size={10} color="#DDD" />
                                <Text style={styles.userStatText}>
                                    {formatNumber(user.videosCount)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Category badge if available */}
                    {user.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                                {user.category}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Sound item component (minimalist)
    const SoundItem = ({ sound }: { sound: any }) => {
        const isWideCard = item.aspectRatio === '2:1';

        // Animation for interaction
        const [isPressed, setIsPressed] = useState(false);
        const pulseAnim = useRef(new Animated.Value(1)).current;

        // Pulse animation when pressed
        useEffect(() => {
            if (isPressed) {
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 150,
                        useNativeDriver: true
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    })
                ]).start();
            }
        }, [isPressed]);

        return (
            <Animated.View
                style={[
                    styles.itemContainer,
                    styles.soundContainer,
                    { width, height, transform: [{ scale: scaleAnim }], opacity: opacityAnim }
                ]}
            >
                <TouchableOpacity
                    style={styles.soundTouchable}
                    onPress={() => onSoundPress(sound)}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                    activeOpacity={0.92}
                >
                    <LinearGradient
                        colors={['rgba(29, 185, 84, 0.05)', 'rgba(29, 185, 84, 0.12)']}
                        style={styles.soundBackground}
                    />

                    <View style={[styles.soundContent, isWideCard && styles.soundContentWide]}>
                        <Animated.View
                            style={[
                                styles.soundIconContainer,
                                { transform: [{ scale: pulseAnim }] }
                            ]}
                        >
                            <View style={styles.soundIcon}>
                                <Music size={isWideCard ? 20 : 16} color="#1DB954" />
                            </View>
                        </Animated.View>

                        <View style={styles.soundInfo}>
                            <Text style={styles.soundTitle} numberOfLines={1}>
                                {sound.title}
                            </Text>

                            {sound.artistName && (
                                <Text style={styles.soundArtist} numberOfLines={1}>
                                    {sound.artistName}
                                </Text>
                            )}

                            <View style={styles.soundMeta}>
                                {sound.isOriginal && (
                                    <View style={styles.originalBadge}>
                                        <Sparkles size={8} color="#FFD700" />
                                        <Text style={styles.originalText}>Original</Text>
                                    </View>
                                )}

                                <View style={styles.soundStatItem}>
                                    <Volume2 size={10} color="#1DB954" />
                                    <Text style={styles.soundStatText}>
                                        {formatNumber(sound.videosCount)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Sound visualization */}
                        {isWideCard && (
                            <View style={styles.waveformContainer}>
                                {Array.from({ length: 10 }).map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.waveformBar,
                                            {
                                                height: Math.random() * 15 + 5,
                                                backgroundColor:
                                                    index % 2 === 0
                                                        ? 'rgba(29, 185, 84, 0.9)'
                                                        : 'rgba(29, 185, 84, 0.3)',
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Render based on item type
    switch (item.type) {
        case 'video':
            return (demoMode || staticPreviewOnly) ? <DemoVideoItem video={item.data} /> : <VideoItem video={item.data} />;
        case 'user':
            return <UserItem user={item.data} />;
        case 'sound':
            return <SoundItem sound={item.data} />;
        default:
            return null;
    }
});

const styles = StyleSheet.create({
    itemContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#122843',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },

    // Video styles
    videoTouchable: {
        flex: 1,
    },
    videoThumbnail: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#16324F',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(12, 26, 44, 0.26)',
        zIndex: 5,
    },
    mediaFallback: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(16, 35, 58, 0.92)',
    },
    mediaFallbackText: {
        color: 'rgba(255,255,255,0.92)',
        fontSize: 11,
        fontWeight: '600',
        fontFamily: 'Figtree',
        letterSpacing: 0.2,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2,
    },
    durationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(6, 12, 22, 0.65)',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    durationText: {
        color: 'white',
        fontSize: 10,
        fontFamily: 'Figtree',
        fontWeight: '500',
    },
    videoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        zIndex: 3,
    },
    videoTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Figtree',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    videoMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    creatorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 4,
    },
    creatorName: {
        color: '#DDD',
        fontSize: 11,
        fontFamily: 'Figtree',
        flex: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    verifiedBadge: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF5A5F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    statText: {
        color: '#DDD',
        fontSize: 10,
        fontFamily: 'Figtree',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },

    // User styles - full image fill
    userTouchable: {
        flex: 1,
    },
    userImageFill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#16324F',
    },
    userGradient: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2,
    },
    userInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        zIndex: 3,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    userName: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Figtree',
        flex: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    userUsername: {
        color: '#DDD',
        fontSize: 11,
        fontFamily: 'Figtree',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    userStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    divider: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#DDD',
        marginHorizontal: 5,
    },
    userStatText: {
        color: '#DDD',
        fontSize: 10,
        fontFamily: 'Figtree',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    categoryBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(6, 12, 22, 0.58)',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    categoryText: {
        color: '#FF5A5F',
        fontSize: 9,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },

    // Sound styles - minimalist
    soundTouchable: {
        flex: 1,
    },
    soundContainer: {
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(29, 185, 84, 0.2)',
    },
    soundBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    soundContent: {
        flex: 1,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    soundContentWide: {
        padding: 12,
    },
    soundIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    soundIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(29, 185, 84, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(29, 185, 84, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    soundInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    soundTitle: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Figtree',
        marginBottom: 2,
    },
    soundArtist: {
        color: '#1DB954',
        fontSize: 10,
        fontFamily: 'Figtree',
        marginBottom: 4,
    },
    soundMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    originalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    originalText: {
        color: '#FFD700',
        fontSize: 8,
        fontFamily: 'Figtree',
    },
    soundStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    soundStatText: {
        color: '#DDD',
        fontSize: 9,
        fontFamily: 'Figtree',
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        height: 24,
        marginLeft: 'auto',
    },
    waveformBar: {
        width: 2,
        borderRadius: 1,
    }
});

GridItem.displayName = 'GridItem';

export default GridItem;
