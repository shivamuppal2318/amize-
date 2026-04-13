import React from 'react';
    import {
        View,
        Text,
        TouchableOpacity,
        StyleSheet,
        SafeAreaView,
        StatusBar,
        Image,
        ScrollView,
        Dimensions
    } from 'react-native';
    import { ArrowLeft, Share2, Play, Bookmark, Music2 } from 'lucide-react-native';
    import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

    const { width } = Dimensions.get('window');

    interface SoundDetailScreenProps {
        onClose: () => void;
        onShare?: () => void;
        onPlay?: () => void;
        onAddToFavorites?: () => void;
        onFollow?: () => void;
        onUseSound?: () => void;
        onVideoPress?: (videoIndex: number) => void;
    }

    // @ts-ignore
    import DefaultImage from '@/assets/images/figma/Mobile inbox-bro 1.png';
    const DEFAULT_IMAGE = DefaultImage;

    const SoundDetailScreen: React.FC<SoundDetailScreenProps> = ({
        onClose,
        onShare,
        onPlay,
        onAddToFavorites,
        onFollow,
        onUseSound,
        onVideoPress
    }) => {
        // Mock data
        const soundData = {
            title: "Beautiful Girl",
            artist: "Sound Store",
            coverImage: "https://via.placeholder.com/150/FFC0B4/FFFFFF",
            profileImage: "https://via.placeholder.com/50",
            videosCount: "28.7",
            profession: "Professional sound maker",
            videoThumbnails: [
                "https://images.pexels.com/photos/1386604/pexels-photo-1386604.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
                "https://images.pexels.com/photos/1557843/pexels-photo-1557843.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
                "https://images.pexels.com/photos/904117/pexels-photo-904117.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
                "https://images.pexels.com/photos/1321909/pexels-photo-1321909.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/2100553/pexels-photo-2100553.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
                "https://images.pexels.com/photos/1279903/pexels-photo-1279903.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/245388/pexels-photo-245388.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
                "https://images.pexels.com/photos/45853/grey-crowned-crane-bird-crane-animal-45853.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            ]
        };

        const PlayButton = ({ size = 60 }) => (
            <View style={[styles.playButtonOverlay, { width: size, height: size, borderRadius: size/2 }]}>
                <Svg width={size*0.7} height={size*0.7} viewBox="0 0 50 50">
                    <Defs>
                        <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#0096FF" />
                            <Stop offset="100%" stopColor="#0044FF" />
                        </LinearGradient>
                    </Defs>
                    <Circle cx="25" cy="25" r="20" fill="url(#gradient)" />
                    <Play x="18" y="15" width="20" height="20" color="#FFF" fill="#FFF" />
                </Svg>
            </View>
        );

        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <ArrowLeft color="#FFF" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                        <Share2 color="#FFF" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Main Content Area */}
                    <View style={styles.mainContentContainer}>
                        {/* Sound Cover and Info */}
                        <View style={styles.soundInfoRow}>
                            {/* Cover Image */}
                            <View style={styles.coverImage}>
                                <TouchableOpacity onPress={onPlay}>
                                    <PlayButton />
                                </TouchableOpacity>
                            </View>

                            {/* Title and Videos count */}
                            <View style={styles.titleContainer}>
                                <Text style={styles.soundTitle}>
                                    {soundData.title} by{'\n'}{soundData.artist}
                                </Text>
                                <Text style={styles.videosCount}>{soundData.videosCount} Videos</Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity
                                style={styles.playButton}
                                onPress={onPlay}
                            >
                                <Play color="#FF4F5B" size={18} />
                                <Text style={styles.playButtonText}>Play Song</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.favoriteButton}
                                onPress={onAddToFavorites}
                            >
                                <Bookmark color="#FF4F5B" size={18} />
                                <Text style={styles.favoriteButtonText}>Add to Favorites</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Artist Info */}
                        <View style={styles.artistInfoContainer}>
                            <View style={styles.artistInfo}>
                                <Image
                                    source={DEFAULT_IMAGE}
                                    style={styles.artistImage}
                                    defaultSource={{ uri: soundData.profileImage }}
                                />
                                <View style={styles.artistDetails}>
                                    <Text style={styles.artistName}>{soundData.artist}</Text>
                                    <Text style={styles.artistProfession}>{soundData.profession}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.followButton}
                                onPress={onFollow}
                            >
                                <Text style={styles.followButtonText}>Follow</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Separator */}
                        <View style={styles.separator} />

                        {/* Videos Grid */}
                        <View style={styles.videosGridContainer}>
                            <View style={styles.videosGrid}>
                                {soundData.videoThumbnails.slice(0, 9).map((thumbnail, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.videoItem}
                                        onPress={() => onVideoPress && onVideoPress(index)}
                                    >
                                        <Image source={{ uri: thumbnail }} style={styles.videoThumbnail} />
                                        <View style={styles.videoPlayButtonOverlay}>
                                            <View style={styles.videoPlayButton}>
                                                <Play color="#FFF" size={16} fill="#FFF" />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Use This Sound Button */}
                <TouchableOpacity
                    style={styles.useSoundButton}
                    onPress={onUseSound}
                >
                    <Music2 color="#FFF" size={20} />
                    <Text style={styles.useSoundButtonText}>Use this Sound</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#1a1a2e',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
        },
        backButton: {},
        shareButton: {},
        content: {
            flex: 1,
        },
        mainContentContainer: {
            padding: 20,
        },
        soundInfoRow: {
            flexDirection: 'row',
            marginBottom: 20,
        },
        coverImage: {
            width: 120,
            height: 120,
            backgroundColor: '#FFC0B4',
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 15,
        },
        playButtonOverlay: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        titleContainer: {
            flex: 1,
            justifyContent: 'center',
        },
        soundTitle: {
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 8,
            lineHeight: 32,
        },
        videosCount: {
            color: '#999',
            fontSize: 14,
        },
        actionButtonsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: 30,
        },
        playButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: '#FF4F5B',
            borderWidth: 1,
            paddingVertical: 10,
            paddingHorizontal: 10,
            borderRadius: 25,
            flex: 1,
            marginRight: 5,
        },
        playButtonText: {
            color: '#FF4F5B',
            fontWeight: 'bold',
            fontSize: 12,
            marginLeft: 8,
        },
        favoriteButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: '#FF4F5B',
            borderWidth: 1,
            paddingVertical: 10,
            paddingHorizontal: 10,
            borderRadius: 25,
            flex: 1,
            marginLeft: 10,
        },
        favoriteButtonText: {
            color: '#FF4F5B',
            fontWeight: 'bold',
            fontSize: 12,
            marginLeft: 8,
        },
        artistInfoContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
        },
        artistInfo: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        artistImage: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#FFF',
        },
        artistDetails: {
            marginLeft: 10,
        },
        artistName: {
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
        },
        artistProfession: {
            color: '#999',
            fontSize: 14,
        },
        followButton: {
            backgroundColor: '#FF4F5B',
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 20,
        },
        followButtonText: {
            color: 'white',
            fontWeight: 'bold',
        },
        separator: {
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            marginVertical: 20,
        },
        videosGridContainer: {
            marginBottom: 20,
        },
        videosGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: 20,
            position: 'relative'
        },
        videoItem: {
            width: (width - 60) / 3,
            height: (width - 60) / 2,
            borderRadius: 10,
            overflow: 'hidden',
            position: 'relative',
            marginBottom: 10,
        },
        videoThumbnail: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        videoPlayButtonOverlay: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
        },
        videoPlayButton: {
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        useSoundButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FF4F5B',
            paddingVertical: 15,
            borderRadius: 30,
            marginTop: 10,
            position: 'absolute',
            bottom: 50,
            left: 20,
            right: 20,
            width: '90%',
            alignSelf: 'center',
            shadowColor: '#000',
        },
        useSoundButtonText: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
            marginLeft: 8,
        },
    });

    export default SoundDetailScreen;
