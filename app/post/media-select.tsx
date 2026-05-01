import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Image,
    ActivityIndicator,
    Platform,
    Alert
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Video, Camera, RefreshCw } from 'lucide-react-native';
import ActionButton from '@/components/shared/UI/ActionButton';
import HeaderBar from '@/components/shared/UI/HeaderBar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { usePostingStore } from '@/stores/postingStore';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;
const MAX_SELECTION = 9;

interface MediaItem {
    id: string;
    uri: string;
    type: 'photo' | 'video';
    mimeType?: string;
    width: number;
    height: number;
    duration?: number;
    size: number;
    assetId?: string; 
    webFile?: File;
}

function inferMimeType(uri: string, isVideo: boolean) {
    const lowerUri = uri.toLowerCase();

    if (lowerUri.endsWith('.mov')) return 'video/quicktime';
    if (lowerUri.endsWith('.webm')) return 'video/webm';
    if (lowerUri.endsWith('.mp4')) return 'video/mp4';
    if (lowerUri.endsWith('.png')) return 'image/png';
    if (lowerUri.endsWith('.webp')) return 'image/webp';
    if (lowerUri.endsWith('.jpg') || lowerUri.endsWith('.jpeg')) return 'image/jpeg';

    return isVideo ? 'video/mp4' : 'image/jpeg';
}

const PICKER_MEDIA_TYPES: ImagePicker.MediaType[] = ['images', 'videos'];
const IMAGE_ONLY_MEDIA_TYPES: ImagePicker.MediaType[] = ['images'];

export default function MediaSelectScreen() {
    const router = useRouter();
    const { addMedia, resetMedia } = usePostingStore();
    const { mode } = useLocalSearchParams<{ mode?: string }>();
    const isWeb = Platform.OS === 'web';
    const isStoryMode = mode === 'story';
    const selectionLimit = isStoryMode ? 1 : MAX_SELECTION;

    const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
    const [galleryItems, setGalleryItems] = useState<MediaLibrary.Asset[]>([]);
    const [galleryItemURIs, setGalleryItemURIs] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'gallery' | 'camera'>('gallery');
    const [hasNextPage, setHasNextPage] = useState(true);
    const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
    const [galleryPermission, setGalleryPermission] = useState(false);
    const [isProcessingSelection, setIsProcessingSelection] = useState(false);

    useEffect(() => {
        resetMedia();
    }, []);

    const buildMediaItem = useCallback(async (asset: ImagePicker.ImagePickerAsset): Promise<MediaItem> => {
        const isVideo =
            asset.type?.startsWith('video') ||
            asset.mimeType?.startsWith('video/') ||
            asset.uri.toLowerCase().endsWith('.mp4') ||
            asset.uri.toLowerCase().endsWith('.mov') ||
            asset.uri.toLowerCase().endsWith('.webm');

        let size = 0;
        if (!isWeb) {
            try {
                const fileInfo = await FileSystem.getInfoAsync(asset.uri);
                size = fileInfo.exists ? fileInfo.size || 0 : 0;
            } catch (e) {
                // Ignore file info errors
            }
        }

        return {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            uri: asset.uri,
            type: isVideo ? 'video' : 'photo',
            mimeType: asset.mimeType || inferMimeType(asset.uri, isVideo),
            width: asset.width || 0,
            height: asset.height || 0,
            duration: isVideo ? asset.duration || 0 : undefined,
            size: size,
            // Store the web File object for upload
            ...(isWeb && (asset as any).file && { webFile: (asset as any).file }),
        };
    }, []);

    const pickFromDevice = useCallback(async () => {
        try {
            setLoading(true);

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: PICKER_MEDIA_TYPES,
                quality: 0.8,
                allowsMultipleSelection: !isStoryMode,
                selectionLimit,
                exif: false,
                ...(Platform.OS === 'android' ? { legacy: true } : {}),
            });

            console.log('[DEBUG] ImagePicker result:', result);

            if (result.canceled || result.assets.length === 0) {
                setLoading(false);
                return;
            }

            const nextItems = await Promise.all(result.assets.map(buildMediaItem));

            if (isStoryMode) {
                setSelectedItems(nextItems.slice(0, 1));
            } else {
                setSelectedItems(prev => {
                    const remainingSlots = selectionLimit - prev.length;
                    if (remainingSlots <= 0) {
                        Alert.alert('Selection Limit', `You can only select up to ${selectionLimit} items`);
                        return prev;
                    }

                    return [...prev, ...nextItems.slice(0, remainingSlots)];
                });
            }
        } catch (error) {
            console.error('Error picking media:', error);
            Alert.alert('Error', 'Failed to open your media library');
        } finally {
            setLoading(false);
        }
    }, [buildMediaItem, isStoryMode, selectionLimit]);

    const checkMediaPermissions = useCallback(async () => {
        try {
            if (isWeb) {
                setGalleryPermission(true);
                return;
            }

            const [galleryStatus, pickerStatus] = await Promise.all([
                MediaLibrary.requestPermissionsAsync(),
                ImagePicker.requestMediaLibraryPermissionsAsync(),
            ]);

            if (galleryStatus.granted && pickerStatus.granted) {
                setGalleryPermission(true);
            } else {
                setGalleryPermission(false);
                Alert.alert('Permission Required', 'This app needs access to your media library');
            }

            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraStatus.granted) {
                Alert.alert('Permission Required', 'This app needs access to your camera');
            }
        } catch (error) {
            console.error('Error checking permissions:', error);
        }
    }, [isWeb]);


    const loadGalleryItems = useCallback(async (refresh = false) => {
        if (isWeb) {
            setGalleryItems([]);
            setHasNextPage(false);
            return;
        }

        if (loading || (!hasNextPage && !refresh)) return;
    
        try {
            setLoading(true);
    
            const options: MediaLibrary.AssetsOptions = {
                mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
                sortBy: [MediaLibrary.SortBy.creationTime],
                first: 20,
            };
    
            if (!refresh && endCursor) {
                options.after = endCursor;
            }
    
            const result = await MediaLibrary.getAssetsAsync(options);
    
            const newAssetURIs = new Map<string, string>();
    
            if (Platform.OS === 'ios') {
                for (const asset of result.assets) {
                    try {
                        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
                        if (assetInfo?.localUri) {
                            newAssetURIs.set(asset.id, assetInfo.localUri);
                        } else {
                            newAssetURIs.set(asset.id, asset.uri ?? '');
                        }
                    } catch (error) {
                        console.error(`Error getting asset info for ${asset.id}:`, error);
                        newAssetURIs.set(asset.id, asset.uri ?? '');
                    }
                }
            } else {
                for (const asset of result.assets) {
                    newAssetURIs.set(asset.id, asset.uri);
                }
            }
    
            setGalleryItemURIs(prev => {
                let changed = false;
                const updated = new Map(prev);
                newAssetURIs.forEach((value, key) => {
                    if (!updated.has(key)) {
                        updated.set(key, value);
                        changed = true;
                    }
                });
                return changed ? updated : prev;
            });
    
            if (refresh) {
                setGalleryItems(result.assets);
            } else {
                setGalleryItems(prev => [...prev, ...result.assets]);
            }
    
            setEndCursor(result.endCursor);
            setHasNextPage(result.hasNextPage);
    
            console.log(`Loaded ${result.assets.length} gallery items`);
        } catch (error) {
            console.error('Error loading gallery items:', error);
            Alert.alert('Error', 'Failed to load media from your device');
        } finally {
            setLoading(false);
        }
    }, [endCursor, hasNextPage, isWeb, loading, setGalleryItems, setGalleryItemURIs, setHasNextPage, setEndCursor]);

    useEffect(() => {
        checkMediaPermissions().then(() => {
        });
    }, [checkMediaPermissions]);

    useEffect(() => {
        if (galleryPermission) {
            loadGalleryItems(true).then(() => {
            });
        }
    }, [galleryPermission, loadGalleryItems]);
    const isAssetSelected = (asset: MediaLibrary.Asset): boolean => {
        return selectedItems.some(item =>
            item.assetId === asset.id ||
            item.uri === galleryItemURIs.get(asset.id)
        );
    };

    const toggleGalleryItem = async (asset: MediaLibrary.Asset) => {
        try {
            const isSelected = isAssetSelected(asset);

            if (isSelected) {
                setSelectedItems(prev =>
                    prev.filter(item =>
                        item.assetId !== asset.id &&
                        item.uri !== galleryItemURIs.get(asset.id)
                    )
                );
                return;
            }

            setLoading(true);

            let mediaUri = galleryItemURIs.get(asset.id) || '';

            if (!mediaUri && Platform.OS === 'ios') {
                try {
                    const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
                    if (assetInfo && assetInfo.localUri) {
                        mediaUri = assetInfo.localUri;
                        setGalleryItemURIs(prev => new Map(prev).set(asset.id, assetInfo.localUri || ''));
                    } else {
                        throw new Error('Could not get local URI for asset');
                    }
                } catch (error) {
                    console.error('Error getting asset URI:', error);
                    Alert.alert('Error', 'Could not access this media item');
                    setLoading(false);
                    return;
                }
            } else if (!mediaUri) {
                mediaUri = asset.uri;
            }

            let fileSize = 0;
            try {
                const fileInfo = await FileSystem.getInfoAsync(mediaUri);
                if (fileInfo.exists) {
                    fileSize = fileInfo.size;
                }
            } catch (error) {
                console.warn('Error getting file size:', error);
            }

            const newMediaItem: MediaItem = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                uri: mediaUri,
                type: asset.mediaType === 'video' ? 'video' : 'photo',
                mimeType: inferMimeType(mediaUri, asset.mediaType === 'video'),
                width: asset.width || 0,
                height: asset.height || 0,
                duration: asset.mediaType === 'video' ? asset.duration : undefined,
                size: fileSize,
                assetId: asset.id
            };

            if (isStoryMode) {
                setSelectedItems([newMediaItem]);
                if (selectedItems.length > 0) {
                    Alert.alert('Story Updated', 'Story mode keeps only the latest selected item');
                }
            } else {
                if (selectedItems.length >= selectionLimit) {
                    Alert.alert('Selection Limit', `You can only select up to ${selectionLimit} items`);
                    return;
                }

                if (isStoryMode) {
                    setSelectedItems([newMediaItem]);
                } else {
                    if (selectedItems.length >= selectionLimit) {
                        Alert.alert('Selection Limit', `You can only select up to ${selectionLimit} items`);
                        return;
                    }

                    setSelectedItems(prev => [...prev, newMediaItem]);
                }
            }
        } catch (error) {
            console.error('Error toggling gallery item:', error);
            Alert.alert('Error', 'Failed to select media item');
        } finally {
            setLoading(false);
        }
    };

    const takePhoto = useCallback(async () => {
        try {
            if (isWeb) {
                await pickFromDevice();
                return;
            }

            setLoading(true);

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: PICKER_MEDIA_TYPES,
                quality: 0.8,
                allowsEditing: true,
                exif: false,
            });

            if (!result.canceled && result.assets.length > 0) {
                const newMediaItem = await buildMediaItem(result.assets[0]);

                setSelectedItems(prev => [...prev, newMediaItem]);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to capture media');
        } finally {
            setLoading(false);
        }
    }, [buildMediaItem, isWeb, pickFromDevice]);

    const clearAllMedia = () => {
        Alert.alert(
            'Clear Selection',
            'Are you sure you want to clear all selected items?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                        setSelectedItems([]);
                    }
                }
            ]
        );
    };

    const handleNext = () => {
        if (selectedItems.length === 0) {
            Alert.alert('No Selection', 'Please select at least one photo or video');
            return;
        }

        try {
            setIsProcessingSelection(true);
            selectedItems.forEach(item => {
                addMedia({
                    uri: item.uri,
                    type: item.type,
                    mimeType: item.mimeType,
                    width: item.width,
                    height: item.height,
                    size: item.size,
                    duration: item.duration ? item.duration * 1000 : undefined,
                    timestamp: new Date().getTime(),
                    webFile: item.webFile,
                });
            });

            // Use setTimeout to avoid navigation during render
            setTimeout(() => {
                router.push({
                    pathname: '/post/edit',
                    params: { mode: isStoryMode ? 'story' : 'post' },
                });
            }, 100);
        } catch (error) {
            console.error('Error proceeding to next screen:', error);
            Alert.alert('Error', 'Failed to process selected media');
            setIsProcessingSelection(false);
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderGalleryItem = ({ item }: { item: MediaLibrary.Asset }) => {
        const thumbnailUri = galleryItemURIs.get(item.id) || '';
        const isUriValid = thumbnailUri !== '';
        const isSelected = isAssetSelected(item);

        return (
            <TouchableOpacity
                style={[
                    styles.galleryItemContainer,
                    isSelected && styles.selectedItemContainer
                ]}
                onPress={() => isUriValid && toggleGalleryItem(item)}
                activeOpacity={0.7}
            >
                {isUriValid ? (
                    <Image
                        source={{ uri: thumbnailUri }}
                        style={[
                            styles.galleryImage,
                            isSelected && styles.selectedImage
                        ]}
                    />
                ) : (
                    <View style={[styles.galleryImage, styles.placeholderContainer]}>
                        <ActivityIndicator size="small" color="#FF4D67" />
                    </View>
                )}

                {item.mediaType === 'video' && (
                    <View style={styles.videoIndicator}>
                        <Video size={16} color="#fff" />
                        <Text style={styles.videoDuration}>
                            {formatDuration(item.duration)}
                        </Text>
                    </View>
                )}

                {isSelected && (
                    <View style={styles.selectionIndicator}>
                        <CheckCircle size={24} color="#fff" fill="#FF4D67" />
                    </View>
                )}

                {isSelected && (
                    <View style={styles.selectionOverlay} />
                )}
            </TouchableOpacity>
        );
    };

    const renderCapturedItem = ({ item }: { item: MediaItem }) => (
        <TouchableOpacity
            style={styles.capturedItemContainer}
            onPress={() => {
                setSelectedItems(prev => prev.filter(selectedItem => selectedItem.id !== item.id));
            }}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: item.uri }}
                style={styles.capturedImage}
            />

            {item.type === 'video' && (
                <View style={styles.videoIndicator}>
                    <Video size={16} color="#fff" />
                    <Text style={styles.videoDuration}>
                        {formatDuration(item.duration)}
                    </Text>
                </View>
            )}

            <View style={styles.selectionIndicator}>
                <CheckCircle 
                    size={24} 
                    color="#fff" 
                    // fill="#FF4D67" 
                    fill="#1E4A72" 
                />
            </View>

            <View style={styles.selectionOverlay} />
        </TouchableOpacity>
    );

    const openSettings = () => {
        if (isWeb) {
            Alert.alert('Use Upload', 'Browser builds should use the upload flow instead of device settings');
            return;
        }

        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:').then(r => {
                if (!r) {
                    Alert.alert('Error', 'Failed to open settings');
                }
            });
        } else {
            Linking.openSettings().then(r => {
                //Ignore
            });
        }
    };

    // Handle reaching the end of the gallery list
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !loading) {
            loadGalleryItems().then(() => {
                // Ignore
            });
        }
    }, [hasNextPage, loading, loadGalleryItems]);

    // Filter captured items (items without assetId)
    const capturedItems = selectedItems.filter(item => !item.assetId);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar  
                backgroundColor="transparent" 
                barStyle="light-content" 
                translucent={true} 
            />
            <LinearGradient
                colors={['#1E4A72', '#000000']}  
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1 }}
            >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <HeaderBar
                title={isStoryMode ? 'Select Story Media' : 'Select Media'}
                onBackPress={() => router.back()}
                rightElement={
                    selectedItems.length > 0 ? (
                        <TouchableOpacity onPress={clearAllMedia}>
                            <Text style={styles.clearText}>Clear All</Text>
                        </TouchableOpacity>
                    ) : null
                }
            />

            {/* Tabs for gallery/camera */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
                    onPress={() => setActiveTab('gallery')}
                >
                    <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>
                        Gallery
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'camera' && styles.activeTab]}
                    onPress={() => setActiveTab('camera')}
                >
                    <Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]}>
                        Camera
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Media content */}
            {activeTab === 'gallery' ? (
                <View style={styles.galleryContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {selectedItems.length > 0
                                ? `Select from Gallery (${selectedItems.length}/${selectionLimit})`
                                : 'Select from Gallery'
                            }
                        </Text>
                        {galleryItems.length > 0 && (
                            <TouchableOpacity onPress={() => loadGalleryItems(true)}>
                                <RefreshCw size={18} color="#FF4D67" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {!galleryPermission ? (
                        <View style={styles.permissionContainer}>
                            <Text style={styles.permissionText}>
                                Please grant media library permission to access your gallery
                            </Text>
                            <TouchableOpacity
                                style={styles.permissionButton}
                                onPress={openSettings}
                            >
                                <Text style={styles.permissionButtonText}>Open Settings</Text>
                            </TouchableOpacity>
                        </View>
                    ) : galleryItems.length === 0 && loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FF4D67" />
                            <Text style={styles.loadingText}>Loading gallery...</Text>
                        </View>
                    ) : isWeb ? (
                        <View style={styles.webPickerContainer}>
                            <TouchableOpacity
                                style={styles.webPickerButton}
                                onPress={pickFromDevice}
                                disabled={loading}
                            >
                                <Video size={44} color="#FFFFFF" />
                                <Text style={styles.webPickerTitle}>Choose media from your device</Text>
                                <Text style={styles.webPickerSubtitle}>
                                    Select photos or videos from your computer instead of using the native gallery API.
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : galleryItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No media found in your gallery</Text>
                            <TouchableOpacity
                                style={styles.refreshButton}
                                onPress={() => loadGalleryItems(true)}
                            >
                                <Text style={styles.refreshButtonText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={galleryItems}
                            renderItem={renderGalleryItem}
                            keyExtractor={(item) => item.id}
                            numColumns={COLUMN_COUNT}
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={styles.gridContainer}
                            onEndReached={handleEndReached}
                            onEndReachedThreshold={0.5}
                            initialNumToRender={15}
                            maxToRenderPerBatch={10}
                            windowSize={10}
                            removeClippedSubviews={true}
                            ListFooterComponent={
                                loading ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#FF4D67"
                                        style={styles.footerLoader}
                                    />
                                ) : null
                            }
                        />
                    )}
                </View>
            ) : (
                // Camera tab
                <View style={styles.cameraContainer}>
                    <TouchableOpacity
                        style={styles.cameraButton}
                        onPress={takePhoto}
                        disabled={loading}
                    >
                        <Camera 
                            size={48} 
                            // color="#FF4D67" 
                            color="#999" 
                        />
                        <Text style={styles.cameraText}>
                            {loading ? 'Processing...' : isWeb ? 'Upload Photo or Video' : 'Take Photo or Video'}
                        </Text>
                    </TouchableOpacity>

                    {capturedItems.length > 0 && (
                        <>
                            <Text style={styles.recentText}>
                                {isStoryMode
                                    ? 'Story Capture Preview'
                                    : `Recently Captured (${capturedItems.length})`}
                            </Text>
                            <FlatList
                                data={capturedItems.slice().reverse()}
                                renderItem={renderCapturedItem}
                                keyExtractor={(item) => item.id}
                                numColumns={COLUMN_COUNT}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.gridContainer}
                            />
                        </>
                    )}
                </View>
            )}

            {/* Bottom action bar */}
            <View style={styles.bottomBar}>
                <Text style={styles.selectionText}>
                    {selectedItems.length > 0
                        ? `Selected ${selectedItems.length} of ${selectionLimit}`
                        : isStoryMode
                        ? 'Select a single photo or video for your story'
                        : 'Tap items to select, tap again to deselect'}
                </Text>
                <ActionButton
                    label={isStoryMode ? 'Continue Story' : 'Continue'}
                    onPress={handleNext}
                    disabled={selectedItems.length === 0 || isProcessingSelection}
                    loading={isProcessingSelection}
                    fullWidth
                />
            </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#1a1a2e',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 0.3,
        borderBottomColor: '#333',
        marginBottom: 4,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#FF4D67',
    },
    tabText: {
        color: '#999',
        fontSize: 16,
    },
    activeTabText: {
        // color: '#FF4D67',
        color: '#fff',
        fontWeight: 'bold',
    },
    galleryContainer: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    gridContainer: {
        padding: 4,
    },
    galleryItemContainer: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        padding: 4,
        position: 'relative',
    },
    selectedItemContainer: {
        // Optional: Add border or shadow for selected items
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#333',
        borderRadius: 8,
        overflow: 'hidden',
    },
    selectedImage: {
        opacity: 0.8,
    },
    placeholderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoIndicator: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        zIndex: 10,
    },
    videoDuration: {
        color: '#fff',
        fontSize: 10,
        marginLeft: 4,
    },
    selectionIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 15,
    },
    selectionOverlay: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: 4,
        bottom: 4,
        backgroundColor: 'rgba(255, 77, 103, 0.2)',
        borderRadius: 8,
        borderWidth: 2,
        // borderColor: '#FF4D67',
        borderColor: '#888',
        zIndex: 5,
    },
    capturedItemContainer: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        padding: 4,
        position: 'relative',
    },
    capturedImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#333',
        borderRadius: 8,
        opacity: 0.8,
    },
    cameraContainer: {
        flex: 1,
        padding: 12,
    },
    cameraButton: {
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 77, 103, 0.1)',
        borderRadius: 12,
        marginBottom: 16,
    },
    cameraText: {
        // color: '#FF4D67',
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 12,
    },
    recentText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginVertical: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 16,
        fontFamily: 'Figtree',
    },
    refreshButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#1a1a2e',
        borderRadius: 8,
    },
    refreshButtonText: {
        color: '#FF4D67',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 16,
        marginTop: 16,
    },
    webPickerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    webPickerButton: {
        width: '100%',
        maxWidth: 520,
        minHeight: 220,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 32,
    },
    webPickerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        marginTop: 18,
        marginBottom: 10,
        textAlign: 'center',
    },
    webPickerSubtitle: {
        color: '#B7C2D0',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        maxWidth: 360,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 16,
    },
    permissionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 77, 103, 0.1)',
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#FF4D67',
        fontSize: 14,
    },
    bottomBar: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
        marginBottom:30
    },
    selectionText: {
        color: '#999',
        textAlign: 'center',
        marginBottom: 12,
    },
    clearText: {
        color: '#FF4D67',
        fontSize: 11,
        fontFamily: 'Figtree',
    },
    footerLoader: {
        paddingVertical: 16,
    },
});
