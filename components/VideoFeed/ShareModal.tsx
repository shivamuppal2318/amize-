import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Image,
    Dimensions,
    Platform,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import {
    MessageCircle,
    X,
    Flag,
    Save,
    Image as ImageIcon,
    Scissors,
    Bookmark,
    Gift,
    ArrowDownUp, Search, HeartCrack, Download, Wallpaper, Users
} from 'lucide-react-native';
import Svg, {Defs, G, Circle, LinearGradient, Stop, Path, Rect} from "react-native-svg";
import { ApiSharePlatform } from '@/lib/api/types/video';

const {width} = Dimensions.get('window');

interface UserShareOption {
    id: string;
    name: string;
    avatar: string;
}

interface ShareModalProps {
    visible: boolean;
    onClose: () => void;
    onReportPress: () => void;
    onNotInterestedPress: () => void;
    onSaveVideoPress: () => void;
    onSetWallpaperPress: () => void;
    onDuetPress: () => void;
    onStitchPress: () => void;
    onAddToFavoritesPress: () => void;
    onShareAsGifPress: () => void;
    onUserSharePress: (userId: string) => void;
    onSocialSharePress: (platform: ApiSharePlatform) => void;
    videoId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({visible, onClose, onReportPress, onNotInterestedPress, onSaveVideoPress, onSetWallpaperPress, onDuetPress, onStitchPress, onAddToFavoritesPress, onShareAsGifPress, onUserSharePress, onSocialSharePress, videoId,
                                               }) => {
    // Track sharing state for UI feedback
    const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);

    // Sample user data - in a real app, this would come from props or an API
    const userShareOptions: UserShareOption[] = [
        {id: 'repost', name: 'Repost', avatar: 'https://randomuser.me/api/portraits/men/32.jpg'},
        {id: 'johnson', name: 'Johnson', avatar: 'https://randomuser.me/api/portraits/men/32.jpg'},
        {id: 'michal', name: 'Michal', avatar: 'https://randomuser.me/api/portraits/women/44.jpg'},
        {id: 'andrew', name: 'Andrew', avatar: 'https://randomuser.me/api/portraits/men/85.jpg'},
        {id: 'search', name: 'Search', avatar: ''},
    ];

    // Wrapper for social shares to show loading state
    const handleSocialShareWithFeedback = (platform: ApiSharePlatform) => {
        setSharingPlatform(platform);

        // Call the actual share handler
        onSocialSharePress(platform);

        // Reset sharing state after a short delay
        setTimeout(() => {
            setSharingPlatform(null);
        }, 1000);
    };

    // Wrapper for user shares to show loading state
    const handleUserShareWithFeedback = (userId: string) => {
        setSharingPlatform(userId);

        // Call the actual share handler
        onUserSharePress(userId);

        // Reset sharing state after a short delay
        setTimeout(() => {
            setSharingPlatform(null);
        }, 1000);
    };

    const WhatsappIcon = ({color = '#7AD06D;'}: { color?: string }) => {
        return (
            <Svg width="24" height="24" viewBox="0 0 418.135 418.135">
                <G id="SVGRepo_bgCarrier" strokeWidth="0"/>
                <G id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
                <G id="SVGRepo_iconCarrier">
                    <Path fill={color}
                          d="M198.929,0.242C88.5,5.5,1.356,97.466,1.691,208.02c0.102,33.672,8.231,65.454,22.571,93.536 L2.245,408.429c-1.191,5.781,4.023,10.843,9.766,9.483l104.723-24.811c26.905,13.402,57.125,21.143,89.108,21.631 c112.869,1.724,206.982-87.897,210.5-200.724C420.113,93.065,320.295-5.538,198.929,0.242z M323.886,322.197 c-30.669,30.669-71.446,47.559-114.818,47.559c-25.396,0-49.71-5.698-72.269-16.935l-14.584-7.265l-64.206,15.212l13.515-65.607 l-7.185-14.07c-11.711-22.935-17.649-47.736-17.649-73.713c0-43.373,16.89-84.149,47.559-114.819 c30.395-30.395,71.837-47.56,114.822-47.56C252.443,45,293.218,61.89,323.887,92.558c30.669,30.669,47.559,71.445,47.56,114.817 C371.446,250.361,354.281,291.803,323.886,322.197z"/>
                    <Path fill={color}
                          d="M309.712,252.351l-40.169-11.534c-5.281-1.516-10.968-0.018-14.816,3.903l-9.823,10.008 c-4.142,4.22-10.427,5.576-15.909,3.358c-19.002-7.69-58.974-43.23-69.182-61.007c-2.945-5.128-2.458-11.539,1.158-16.218 l8.576-11.095c3.36-4.347,4.069-10.185,1.847-15.21l-16.9-38.223c-4.048-9.155-15.747-11.82-23.39-5.356 c-11.211,9.482-24.513,23.891-26.13,39.854c-2.851,28.144,9.219,63.622,54.862,106.222c52.73,49.215,94.956,55.717,122.449,49.057 c15.594-3.777,28.056-18.919,35.921-31.317C323.568,266.34,319.334,255.114,309.712,252.351z"/>
                </G>
            </Svg>
        );
    };

    const FacebookIcon = ({color = '#FFF'}: { color?: string }) => {
        return (
            <Svg width="24" height="24" viewBox="-5 0 20 20" fill="#000000">
                <G id="SVGRepo_bgCarrier" stroke-width="0"></G>
                <G id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></G>
                <G id="SVGRepo_iconCarrier">
                    <G id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <G id="Dribbble-Light-Preview" transform="translate(-385.000000, -7399.000000)" fill="#ffffff">
                            <G id="icons" transform="translate(56.000000, 160.000000)">
                                <Path
                                    d="M335.821282,7259 L335.821282,7250 L338.553693,7250 L339,7246 L335.821282,7246 L335.821282,7244.052 C335.821282,7243.022 335.847593,7242 337.286884,7242 L338.744689,7242 L338.744689,7239.14 C338.744689,7239.097 337.492497,7239 336.225687,7239 C333.580004,7239 331.923407,7240.657 331.923407,7243.7 L331.923407,7246 L329,7246 L329,7250 L331.923407,7250 L331.923407,7259 L335.821282,7259 Z"
                                    id="facebook-[#ffffff]">
                                </Path>
                            </G>
                        </G>
                    </G>
                </G>
            </Svg>
        );
    };

    const TwitterIcon = ({color = '#FFF'}: { color?: string }) => {
        return (
            <Svg width="24" height="24" id="Layer_1" viewBox="0 0 410.155 410.155" fill="#000000"><G
                id="SVGRepo_bgCarrier" stroke-width="0"></G>
                <G id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></G>
                <G id="SVGRepo_iconCarrier">
                    <Path fill={color}
                          d="M403.632,74.18c-9.113,4.041-18.573,7.229-28.28,9.537c10.696-10.164,18.738-22.877,23.275-37.067 l0,0c1.295-4.051-3.105-7.554-6.763-5.385l0,0c-13.504,8.01-28.05,14.019-43.235,17.862c-0.881,0.223-1.79,0.336-2.702,0.336 c-2.766,0-5.455-1.027-7.57-2.891c-16.156-14.239-36.935-22.081-58.508-22.081c-9.335,0-18.76,1.455-28.014,4.325 c-28.672,8.893-50.795,32.544-57.736,61.724c-2.604,10.945-3.309,21.9-2.097,32.56c0.139,1.225-0.44,2.08-0.797,2.481 c-0.627,0.703-1.516,1.106-2.439,1.106c-0.103,0-0.209-0.005-0.314-0.015c-62.762-5.831-119.358-36.068-159.363-85.14l0,0 c-2.04-2.503-5.952-2.196-7.578,0.593l0,0C13.677,65.565,9.537,80.937,9.537,96.579c0,23.972,9.631,46.563,26.36,63.032 c-7.035-1.668-13.844-4.295-20.169-7.808l0,0c-3.06-1.7-6.825,0.485-6.868,3.985l0,0c-0.438,35.612,20.412,67.3,51.646,81.569 c-0.629,0.015-1.258,0.022-1.888,0.022c-4.951,0-9.964-0.478-14.898-1.421l0,0c-3.446-0.658-6.341,2.611-5.271,5.952l0,0 c10.138,31.651,37.39,54.981,70.002,60.278c-27.066,18.169-58.585,27.753-91.39,27.753l-10.227-0.006 c-3.151,0-5.816,2.054-6.619,5.106c-0.791,3.006,0.666,6.177,3.353,7.74c36.966,21.513,79.131,32.883,121.955,32.883 c37.485,0,72.549-7.439,104.219-22.109c29.033-13.449,54.689-32.674,76.255-57.141c20.09-22.792,35.8-49.103,46.692-78.201 c10.383-27.737,15.871-57.333,15.871-85.589v-1.346c-0.001-4.537,2.051-8.806,5.631-11.712c13.585-11.03,25.415-24.014,35.16-38.591 l0,0C411.924,77.126,407.866,72.302,403.632,74.18L403.632,74.18z" />
                </G>
            </Svg>
        );
    };

    const InstagramIcon = ({color = "#FFF"}) => {
        return (
            <Svg width="24" height="24" viewBox="0 0 551.034 551.034">
                <Defs>
                    <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#E09B3D"/>
                        <Stop offset="30%" stopColor="#C74C4D"/>
                        <Stop offset="60%" stopColor="#C21975"/>
                        <Stop offset="100%" stopColor="#7024C4"/>
                    </LinearGradient>
                </Defs>
                <G>
                    <Path fill="url(#grad)" d="M386.878,0H164.156C73.64,0,0,73.64,0,164.156v222.722c0,90.516,73.64,164.156,164.156,164.156h222.722 c90.516,0,164.156-73.64,164.156-164.156V164.156 C551.033,73.64,477.393,0,386.878,0z M495.6,386.878c0,60.045-48.677,108.722-108.722,108.722H164.156 c-60.045,0-108.722-48.677-108.722-108.722V164.156c0-60.046,48.677-108.722,108.722-108.722h222.722 c60.045,0,108.722,48.676,108.722,108.722L495.6,386.878L495.6,386.878z"/>
                    <Path fill="url(#grad)" d="M275.517,133C196.933,133,133,196.933,133,275.516 s63.933,142.517,142.517,142.517S418.034,354.1,418.034,275.516S354.101,133,275.517,133z M275.517,362.6 c-48.095,0-87.083-38.988-87.083-87.083s38.989-87.083,87.083-87.083c48.095,0,87.083,38.988,87.083,87.083 C362.6,323.611,323.611,362.6,275.517,362.6z"/>
                    <Circle fill="url(#grad)" cx="418.306" cy="134.072" r="34.149"/>
                </G>
            </Svg>
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
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Send to</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color="#fff"/>
                        </TouchableOpacity>
                    </View>

                    {/* User Share Options */}
                    <View style={styles.userShareContainer}>
                        {userShareOptions.map((user) => (
                            <TouchableOpacity
                                key={user.id}
                                style={styles.userShareOption}
                                onPress={() => handleUserShareWithFeedback(user.id)}
                                disabled={Boolean(sharingPlatform)}
                            >
                                {sharingPlatform === user.id ? (
                                    <View style={[styles.userAvatar, {backgroundColor: 'rgba(255, 79, 91, 0.2)'}]}>
                                        <ActivityIndicator size="small" color="#FF4F5B" />
                                    </View>
                                ) : user.id === 'repost' ? (
                                    <View style={[styles.userAvatar, styles.repostCircle]}>
                                        <ArrowDownUp size={24} color="white"/>
                                    </View>
                                ) : user.id === 'search' ? (
                                    <View style={[styles.userAvatar, styles.searchCircle]}>
                                        <Search size={24} color="#FF4F5B"/>
                                    </View>
                                ) : (
                                    <Image source={{uri: user.avatar}} style={styles.userAvatar}/>
                                )}
                                <Text style={styles.userName}>{user.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Social Media Share Options */}
                    <View style={styles.socialShareContainer}>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialShareWithFeedback('whatsapp')}
                            disabled={Boolean(sharingPlatform)}
                        >
                            <View style={[styles.socialIcon, styles.whatsappBg]}>
                                {sharingPlatform === 'whatsapp' ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <WhatsappIcon color={'white'}/>
                                )}
                            </View>
                            <Text style={styles.socialText}>Whatsapp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialShareWithFeedback('facebook')}
                            disabled={Boolean(sharingPlatform)}
                        >
                            <View style={[styles.socialIcon, styles.facebookBg]}>
                                {sharingPlatform === 'facebook' ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <FacebookIcon color={'white'}/>
                                )}
                            </View>
                            <Text style={styles.socialText}>Facebook</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialShareWithFeedback('twitter')}
                            disabled={Boolean(sharingPlatform)}
                        >
                            <View style={[styles.socialIcon, styles.twitterBg]}>
                                {sharingPlatform === 'twitter' ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <TwitterIcon color={'white'}/>
                                )}
                            </View>
                            <Text style={styles.socialText}>Twitter</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialShareWithFeedback('instagram')}
                            disabled={Boolean(sharingPlatform)}
                        >
                            <View style={[styles.socialIcon, styles.instagramBg]}>
                                {sharingPlatform === 'instagram' ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <InstagramIcon color={'white'}/>
                                )}
                            </View>
                            <Text style={styles.socialText}>Instagram</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons - First Row */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onReportPress}
                        >
                            <View style={styles.actionIcon}>
                                <Flag size={20} color="#FF4F5B"/>
                            </View>
                            <Text style={styles.actionText}>Report</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onNotInterestedPress}
                        >
                            <View style={styles.actionIcon}>
                                <HeartCrack size={20} color="#FF4F5B"/>
                            </View>
                            <Text style={styles.actionText}>Not Interested</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onSaveVideoPress}
                        >
                            <View style={styles.actionIcon}>
                                <Download size={20} color="#FF4F5B"/>
                            </View>
                            <Text style={styles.actionText}>Save Video</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onSetWallpaperPress}
                        >
                            <View style={styles.actionIcon}>
                                <Wallpaper size={20} color="#FF4F5B"/>
                            </View>
                            <Text style={styles.actionText}>Set as wallpaper</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons - Second Row */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onDuetPress}
                        >
                            <View style={styles.actionIcon}>
                                <View style={styles.duetIcon}>
                                    <Users size={20} color="#FF4F5B"/>
                                </View>
                            </View>
                            <Text style={styles.actionText}>Duet</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onStitchPress}
                        >
                            <View style={styles.actionIcon}>
                                <Scissors size={24} color="#FF4F5B"/>
                            </View>
                            <Text style={styles.actionText}>Stitch</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onAddToFavoritesPress}
                        >
                            <View style={styles.actionIcon}>
                                <Bookmark size={24} color="#FF4F5B"/>
                            </View>
                            <Text style={styles.actionText}>Add to favorites</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleSocialShareWithFeedback('copy_link')}
                            disabled={Boolean(sharingPlatform)}
                        >
                            <View style={styles.actionIcon}>
                                {sharingPlatform === 'copy_link' ? (
                                    <ActivityIndicator size="small" color="#FF4F5B" />
                                ) : (
                                    <View style={styles.gifIcon}>
                                        <Text style={styles.gifText}>Link</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.actionText}>Copy Link</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginBottom: -35,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    userShareContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    userShareOption: {
        alignItems: 'center',
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    repostCircle: {
        backgroundColor: '#FF4F5B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    repostText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchCircle: {
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchText: {
        fontSize: 20,
    },
    userName: {
        color: 'white',
        marginTop: 4,
        fontSize: 12,
    },
    socialShareContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    socialButton: {
        alignItems: 'center',
    },
    socialIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    whatsappBg: {
        backgroundColor: '#7AD06D',
    },
    facebookBg: {
        backgroundColor: '#2C56E8FF',
    },
    twitterBg: {
        backgroundColor: '#2C56E8FF',
    },
    instagramBg: {
        backgroundColor: '#FFF',
    },
    socialIconText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    socialText: {
        color: 'white',
        marginTop: 4,
        fontSize: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    actionButton: {
        alignItems: 'center',
        width: (width - 40) / 4,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 79, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    duetIcon: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    duetText: {
        fontSize: 20,
    },
    gifIcon: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    gifText: {
        color: '#FF4F5B',
        fontSize: 14,
        fontWeight: 'bold',
    },
    actionText: {
        color: 'white',
        fontSize: 10,
        textAlign: 'center',
    },
});

export default ShareModal;