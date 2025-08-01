import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';
import {
    ArrowLeft,
    Grid,
    List,
    Filter,
    TrendingUp as Trending,
    Clock,
    Heart,
    Eye,
    Play,
    Crown,
    Share,
    MessageCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import SearchService, { SearchVideo, ExploreCreator } from '@/lib/api/exploreService';

const { width } = Dimensions.get('window');

interface CategoryScreenProps {}

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'popular' | 'trending';
type ContentType = 'videos' | 'creators';

const CategoryScreen: React.FC<CategoryScreenProps> = () => {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ category: string }>();
    const category = params.category || '';

    // State
    const [contentType, setContentType] = useState<ContentType>('videos');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortOption, setSortOption] = useState<SortOption>('trending');
    const [videos, setVideos] = useState<SearchVideo[]>([]);
    const [creators, setCreators] = useState<ExploreCreator[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [offset, setOffset] = useState(0);
    const limit = 20;

    // Refs
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Load content
    const loadContent = useCallback(async (refresh = false) => {
        if (!category || !isMounted.current) return;

        try {
            if (refresh) {
                setRefreshing(true);
                setOffset(0);
            } else if (offset === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const currentOffset = refresh ? 0 : offset;

            if (contentType === 'videos') {
                const newVideos = await SearchService.getCategoryContent(
                    category,
                    limit,
                    currentOffset
                );

                if (isMounted.current) {
                    if (refresh || currentOffset === 0) {
                        setVideos(newVideos);
                    } else {
                        setVideos(prev => [...prev, ...newVideos]);
                    }
                    setHasMore(newVideos.length === limit);
                }
            } else {
                // Get creators from this category
                const allCreators = await SearchService.getPopularCreators('all', limit, currentOffset);
                // Filter by category if possible (this might need backend support)
                const categoryCreators = allCreators; // For now, return all

                if (isMounted.current) {
                    if (refresh || currentOffset === 0) {
                        setCreators(categoryCreators);
                    } else {
                        setCreators(prev => [...prev, ...categoryCreators]);
                    }
                    setHasMore(categoryCreators.length === limit);
                }
            }

            if (!refresh && currentOffset === 0) {
                setOffset(limit);
            } else if (!refresh) {
                setOffset(prev => prev + limit);
            } else {
                setOffset(limit);
            }
        } catch (error) {
            console.error('Failed to load category content:', error);
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        }
    }, [category, contentType, offset, limit]);

    // Load more content
    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            loadContent(false);
        }
    }, [loadingMore, hasMore, loading, loadContent]);

    // Refresh handler
    const handleRefresh = useCallback(() => {
        loadContent(true);
    }, [loadContent]);

    // Initial load and when content type changes
    useEffect(() => {
        setOffset(0);
        setVideos([]);
        setCreators([]);
        setHasMore(true);
        loadContent(true);
    }, [category, contentType]);

    // Navigation handlers
    const handleVideoPress = useCallback((video: SearchVideo) => {
        router.push({
            pathname: '/(tabs)',
            params: { videoId: video.id }
        });
    }, []);

    const handleCreatorPress = useCallback((creator: ExploreCreator) => {
        router.push(`/(tabs)/profile/${creator.id}`);
    }, []);

    const handleBack = useCallback(() => {
        router.back();
    }, []);

    // Format number utility
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Render video item
    const renderVideoItem = ({ item, index }: { item: SearchVideo; index: number }) => {
        if (viewMode === 'grid') {
            const itemWidth = (width - 60) / 2; // 2 columns with padding
            return (
                <TouchableOpacity
                    style={[styles.gridVideoItem, { width: itemWidth }]}
                    onPress={() => handleVideoPress(item)}
                >
                    <Image
                        source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/160x200' }}
                        style={[styles.gridVideoThumbnail, { width: itemWidth, height: itemWidth * 1.25 }]}
                        resizeMode="cover"
                    />
                    <View style={styles.gridVideoOverlay}>
                        <Play size={16} color="white" />
                    </View>
                    <View style={styles.gridVideoInfo}>
                        <Text style={styles.gridVideoTitle} numberOfLines={2}>
                            {item.title || 'Untitled'}
                        </Text>
                        <View style={styles.gridVideoStats}>
                            <View style={styles.gridStatItem}>
                                <Eye size={10} color="#999" />
                                <Text style={styles.gridStatText}>{formatNumber(item.viewsCount)}</Text>
                            </View>
                            <View style={styles.gridStatItem}>
                                <Heart size={10} color="#999" />
                                <Text style={styles.gridStatText}>{formatNumber(item.likesCount)}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        } else {
            return (
                <TouchableOpacity
                    style={styles.listVideoItem}
                    onPress={() => handleVideoPress(item)}
                >
                    <Image
                        source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/120x160' }}
                        style={styles.listVideoThumbnail}
                        resizeMode="cover"
                    />
                    <View style={styles.listVideoInfo}>
                        <Text style={styles.listVideoTitle} numberOfLines={2}>
                            {item.title || 'Untitled'}
                        </Text>
                        <View style={styles.listVideoCreator}>
                            <Image
                                source={{ uri: item.user.profilePhotoUrl || 'https://via.placeholder.com/24' }}
                                style={styles.listCreatorAvatar}
                            />
                            <Text style={styles.listCreatorName}>
                                {item.user.fullName || item.user.username}
                            </Text>
                            {item.user.creatorVerified && (
                                <Crown size={12} color="#FFD700" />
                            )}
                        </View>
                        <View style={styles.listVideoStats}>
                            <View style={styles.listStatGroup}>
                                <View style={styles.listStatItem}>
                                    <Eye size={12} color="#999" />
                                    <Text style={styles.listStatText}>{formatNumber(item.viewsCount)}</Text>
                                </View>
                                <View style={styles.listStatItem}>
                                    <Heart size={12} color="#999" />
                                    <Text style={styles.listStatText}>{formatNumber(item.likesCount)}</Text>
                                </View>
                            </View>
                            <View style={styles.listStatGroup}>
                                <View style={styles.listStatItem}>
                                    <MessageCircle size={12} color="#999" />
                                    <Text style={styles.listStatText}>{formatNumber(item.commentsCount)}</Text>
                                </View>
                                <View style={styles.listStatItem}>
                                    <Share size={12} color="#999" />
                                    <Text style={styles.listStatText}>{formatNumber(item.sharesCount)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }
    };

    // Render creator item
    const renderCreatorItem = ({ item }: { item: ExploreCreator }) => (
        <TouchableOpacity
            style={styles.creatorItem}
            onPress={() => handleCreatorPress(item)}
        >
            <Image
                source={{ uri: item.profilePhotoUrl || 'https://via.placeholder.com/60' }}
                style={styles.creatorAvatar}
            />
            {item.verified && (
                <View style={styles.creatorVerifiedBadge}>
                    <Crown size={12} color="#FFD700" />
                </View>
            )}
            <View style={styles.creatorInfo}>
                <Text style={styles.creatorName}>
                    {item.fullName || item.username}
                </Text>
                {item.bio && (
                    <Text style={styles.creatorBio} numberOfLines={2}>
                        {item.bio}
                    </Text>
                )}
                <View style={styles.creatorStats}>
                    <Text style={styles.creatorStat}>
                        {formatNumber(item.followersCount)} followers
                    </Text>
                    <Text style={styles.creatorStat}>
                        {formatNumber(item.videosCount)} videos
                    </Text>
                </View>
                {item.category && (
                    <Text style={styles.creatorCategory}>{item.category}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    // Render footer
    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color="#FF5A5F" />
                <Text style={styles.footerText}>Loading more...</Text>
            </View>
        );
    };

    // Render empty state
    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No {contentType} found</Text>
                <Text style={styles.emptySubtitle}>
                    Try changing your filters or check back later for new content.
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{category}</Text>
                    <Text style={styles.headerSubtitle}>
                        {contentType === 'videos' ? videos.length : creators.length} {contentType}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowFilters(true)}
                    style={styles.filterButton}
                >
                    <Filter size={20} color="#FF5A5F" />
                </TouchableOpacity>
            </View>

            {/* Content Type Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, contentType === 'videos' && styles.activeTab]}
                    onPress={() => setContentType('videos')}
                >
                    <Play size={16} color={contentType === 'videos' ? '#FF5A5F' : '#999'} />
                    <Text style={[
                        styles.tabText,
                        contentType === 'videos' && styles.activeTabText
                    ]}>
                        Videos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, contentType === 'creators' && styles.activeTab]}
                    onPress={() => setContentType('creators')}
                >
                    <Crown size={16} color={contentType === 'creators' ? '#FF5A5F' : '#999'} />
                    <Text style={[
                        styles.tabText,
                        contentType === 'creators' && styles.activeTabText
                    ]}>
                        Creators
                    </Text>
                </TouchableOpacity>
            </View>

            {/* View Mode and Sort Controls */}
            {contentType === 'videos' && (
                <View style={styles.controls}>
                    <View style={styles.viewModeContainer}>
                        <TouchableOpacity
                            style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
                            onPress={() => setViewMode('grid')}
                        >
                            <Grid size={16} color={viewMode === 'grid' ? '#FF5A5F' : '#999'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
                            onPress={() => setViewMode('list')}
                        >
                            <List size={16} color={viewMode === 'list' ? '#FF5A5F' : '#999'} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.sortContainer}>
                        <TouchableOpacity
                            style={[styles.sortButton, sortOption === 'trending' && styles.activeSortButton]}
                            onPress={() => setSortOption('trending')}
                        >
                            <Trending size={14} color={sortOption === 'trending' ? '#FF5A5F' : '#999'} />
                            <Text style={[
                                styles.sortButtonText,
                                sortOption === 'trending' && styles.activeSortButtonText
                            ]}>
                                Trending
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.sortButton, sortOption === 'recent' && styles.activeSortButton]}
                            onPress={() => setSortOption('recent')}
                        >
                            <Clock size={14} color={sortOption === 'recent' ? '#FF5A5F' : '#999'} />
                            <Text style={[
                                styles.sortButtonText,
                                sortOption === 'recent' && styles.activeSortButtonText
                            ]}>
                                Recent
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.sortButton, sortOption === 'popular' && styles.activeSortButton]}
                            onPress={() => setSortOption('popular')}
                        >
                            <Heart size={14} color={sortOption === 'popular' ? '#FF5A5F' : '#999'} />
                            <Text style={[
                                styles.sortButtonText,
                                sortOption === 'popular' && styles.activeSortButtonText
                            ]}>
                                Popular
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Content List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                    <Text style={styles.loadingText}>Loading {category} content...</Text>
                </View>
            ) : (
                <View>
                    {contentType === 'videos' ? (
                        <FlatList<SearchVideo>
                            data={videos}
                            renderItem={renderVideoItem}
                            keyExtractor={(item) => `video-${item.id}`}
                            numColumns={viewMode === 'grid' ? 2 : 1}
                            key={`videos-${viewMode}`}
                            contentContainerStyle={styles.listContainer}
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.3}
                            ListFooterComponent={renderFooter}
                            ListEmptyComponent={renderEmpty}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    tintColor="#FF5A5F"
                                    colors={["#FF5A5F"]}
                                />
                            }
                            showsVerticalScrollIndicator={false}
                            columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
                        />
                    ) : (
                        <FlatList<ExploreCreator>
                            data={creators}
                            renderItem={renderCreatorItem}
                            keyExtractor={(item) => `creator-${item.id}`}
                            contentContainerStyle={styles.listContainer}
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.3}
                            ListFooterComponent={renderFooter}
                            ListEmptyComponent={renderEmpty}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    tintColor="#FF5A5F"
                                    colors={["#FF5A5F"]}
                                />
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Figtree',
        textTransform: 'capitalize',
    },
    headerSubtitle: {
        color: '#999',
        fontSize: 14,
        fontFamily: 'Figtree',
        marginTop: 2,
    },
    filterButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 16,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        gap: 8,
    },
    activeTab: {
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    tabText: {
        color: '#999',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    activeTabText: {
        color: '#FF5A5F',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    viewModeContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 4,
    },
    viewModeButton: {
        padding: 8,
        borderRadius: 12,
    },
    activeViewMode: {
        backgroundColor: 'rgba(255, 90, 95, 0.2)',
    },
    sortContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        gap: 4,
    },
    activeSortButton: {
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    sortButtonText: {
        color: '#999',
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    activeSortButtonText: {
        color: '#FF5A5F',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#999',
        fontSize: 16,
        fontFamily: 'Figtree',
        marginTop: 12,
    },
    listContainer: {
        padding: 20,
    },
    // Grid video styles
    gridRow: {
        justifyContent: 'space-between',
    },
    gridVideoItem: {
        marginBottom: 20,
    },
    gridVideoThumbnail: {
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    gridVideoOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        padding: 4,
    },
    gridVideoInfo: {
        marginTop: 8,
    },
    gridVideoTitle: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Figtree',
        lineHeight: 16,
    },
    gridVideoStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    gridStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    gridStatText: {
        color: '#999',
        fontSize: 10,
        fontFamily: 'Figtree',
    },
    // List video styles
    listVideoItem: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    listVideoThumbnail: {
        width: 120,
        height: 160,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    listVideoInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    listVideoTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Figtree',
        lineHeight: 20,
    },
    listVideoCreator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 8,
    },
    listCreatorAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    listCreatorName: {
        color: '#999',
        fontSize: 14,
        fontFamily: 'Figtree',
    },
    listVideoStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    listStatGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    listStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    listStatText: {
        color: '#999',
        fontSize: 12,
        fontFamily: 'Figtree',
    },
    // Creator styles
    creatorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        gap: 16,
    },
    creatorAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    creatorVerifiedBadge: {
        position: 'absolute',
        left: 45,
        top: 45,
        backgroundColor: '#1a1a2e',
        borderRadius: 8,
        padding: 2,
    },
    creatorInfo: {
        flex: 1,
    },
    creatorName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    creatorBio: {
        color: '#999',
        fontSize: 14,
        fontFamily: 'Figtree',
        marginTop: 4,
        lineHeight: 18,
    },
    creatorStats: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    creatorStat: {
        color: '#666',
        fontSize: 12,
        fontFamily: 'Figtree',
    },
    creatorCategory: {
        color: '#FF5A5F',
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Figtree',
        marginTop: 4,
    },
    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    footerText: {
        color: '#999',
        fontSize: 14,
        fontFamily: 'Figtree',
    },
    // Empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'Figtree',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#999',
        fontSize: 16,
        fontFamily: 'Figtree',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default CategoryScreen;