import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    Image,
    ScrollView,
    Dimensions,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { X, Search, Play, Music2 } from 'lucide-react-native';

// Import our search hook
import useExplore from '@/hooks/useExplore';
import { useSearchHistory } from '@/components/explore/SearchHistory';
import { MixedFeedItem } from '@/lib/api/types/video';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Define the tabs
const TABS = ['Top', 'Users', 'Videos', 'Sounds'];

// Define the types of content
type Tab = 'Top' | 'Users' | 'Videos' | 'Sounds';

interface SearchResultsProps {
    initialQuery?: string;
    onClose: () => void;
    onUserPress?: (userId: string) => void;
    onVideoPress?: (videoId: string) => void;
    onSoundPress?: (soundId: string) => void;
}

const SearchResultsScreen: React.FC<SearchResultsProps> = ({initialQuery = '', onClose, onUserPress, onVideoPress, onSoundPress}) => {
    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<Tab>('Top');
    const [showClear, setShowClear] = useState(false);

    // Use our search hooks
    const {
        searchHistory,
        getRecentSearches,
        getSearchSuggestions,
        addToHistory,
        removeFromHistory,
        clearHistory
    } = useSearchHistory();

    // Use our explore hook for search functionality
    const {
        mixedFeed,
        mixedFeedLoading,
        mixedFeedHasMore,
        loadMixedFeed,
        searchQuery: hookSearchQuery,
        setSearchQuery: setHookSearchQuery,
        refreshing,
        handleRefresh,
        searchSuggestions
    } = useExplore({
        initialQuery: initialQuery,
        debounceDelay: 300,
        suggestionsLimit: 5,
        contentLimit: 20,
        enableMixedFeed: true
    });

    // Local state to organize search results
    const [videoResults, setVideoResults] = useState<MixedFeedItem[]>([]);
    const [userResults, setUserResults] = useState<MixedFeedItem[]>([]);
    const [soundResults, setSoundResults] = useState<MixedFeedItem[]>([]);

    // Keep the hooks search query in sync with the local query
    useEffect(() => {
        setHookSearchQuery(query);
    }, [query, setHookSearchQuery]);

    // Organize search results when mixedFeed changes
    useEffect(() => {
        if (mixedFeed && mixedFeed.length > 0) {
            // Filter results by type
            const videos = mixedFeed.filter(item => item.type === 'video');
            const users = mixedFeed.filter(item => item.type === 'user');
            const sounds = mixedFeed.filter(item => item.type === 'sound');

            setVideoResults(videos);
            setUserResults(users);
            setSoundResults(sounds);
        }
    }, [mixedFeed]);

    useEffect(() => {
        setShowClear(query.length > 0);

        // If query is not empty, search and save to history
        if (query.length >= 2) {
            // The hook will handle the debounced search
            // When a user actively searches, add to history
            if (query !== initialQuery) {
                addToHistory(query);
            }
        }
    }, [query, initialQuery, addToHistory]);

    const handleTabPress = (tab: Tab) => {
        setActiveTab(tab);
    };

    const handleClearSearch = () => {
        setQuery('');
    };

    const handleClearAllHistory = () => {
        clearHistory();
    };

    const handleRemoveHistoryItem = (item: string) => {
        removeFromHistory(item);
    };

    const handleSearchSubmit = () => {
        if (query.trim().length > 0) {
            addToHistory(query);
            // The hook already handles the search based on query changes
        }
    };

    // Get suggestions based on current query
    const getDisplaySuggestions = useCallback(() => {
        return searchSuggestions.length > 0
            ? searchSuggestions
            : getSearchSuggestions(query);
    }, [query, searchSuggestions, getSearchSuggestions]);

    // Format view count numbers
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Render the search history and suggestions
    const renderSearchHistoryAndSuggestions = () => {
        const recentSearches = getRecentSearches(5);
        const suggestions = getDisplaySuggestions();

        return (
            <LinearGradient
            colors={["#1E4A72", "#000000"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.fullHeightScrollView}>
                <View style={styles.historyContainer}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Recent Searches</Text>
                        {recentSearches.length > 0 && (
                            <TouchableOpacity onPress={handleClearAllHistory}>
                                <Text style={styles.clearAllText}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {recentSearches.map((item, index) => (
                        <View key={item.id} style={styles.historyItem}>
                            <TouchableOpacity
                                style={styles.historyItemButton}
                                onPress={() => setQuery(item.query)}
                            >
                                <Text style={styles.historyItemText}>{item.query}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveHistoryItem(item.id)}>
                                <X size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <Text style={styles.suggestedTitle}>Suggested Searches</Text>

                    {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => setQuery(suggestion)}
                        >
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                            <Search size={16} color="#666666" />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
            </LinearGradient>
        );
    };

    // Render top search results (mixed)
    const renderTopResults = () => {
        if (mixedFeedLoading && mixedFeed.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            );
        }

        if (mixedFeed.length === 0 && !mixedFeedLoading) {
            return (
                <View style={styles.emptyResultsContainer}>
                    <Text style={styles.emptyResultsText}>No results found for "{query}"</Text>
                </View>
            );
        }

        return (
                <LinearGradient
            colors={["#1E4A72", "#000000"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.fullHeightScrollView}>
                {/* Users Section */}
                {userResults.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Users</Text>
                        <View style={styles.userListContainer}>
                            {userResults.slice(0, 2).map((item) => {
                                const user = item.data;
                                return (
                                    <TouchableOpacity
                                        key={user.id}
                                        style={styles.userItemHorizontal}
                                        onPress={() => onUserPress && onUserPress(user.id)}
                                    >
                                        <Image
                                            source={{ uri: user.profilePhotoUrl || 'https://via.placeholder.com/40' }}
                                            style={styles.userAvatarHorizontal}
                                        />
                                        <View style={styles.userInfoHorizontal}>
                                            <Text style={styles.usernameTextHorizontal}>{user.fullName || user.username}</Text>
                                            <Text style={styles.userHandleText}>
                                                {user.username} • {formatNumber(user.followersCount)} followers
                                            </Text>
                                        </View>
                                        <TouchableOpacity style={styles.followButton}>
                                            <Text style={styles.followButtonText}>Follow</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Videos Section */}
                {videoResults.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Videos</Text>
                        <View style={styles.videosGridContainer}>
                            <FlatList
                                data={videoResults.slice(0, 3)}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => {
                                    const video = item.data;
                                    return (
                                        <TouchableOpacity
                                            style={styles.videoItem}
                                            onPress={() => onVideoPress && onVideoPress(video.id)}
                                        >
                                            <Image
                                                source={{ uri: video.thumbnailUrl || 'https://via.placeholder.com/120x160' }}
                                                style={styles.videoThumbnail}
                                            />
                                            <View style={styles.videoPlayButton}>
                                                <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                                            </View>
                                            <View style={styles.videoInfoOverlay}>
                                                <Text style={styles.videoViewCount}>{formatNumber(video.viewsCount)}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    </View>
                )}

                {/* Sounds Section */}
                {soundResults.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Sounds</Text>
                        <View style={styles.soundsList}>
                            {soundResults.slice(0, 2).map((item) => {
                                const sound = item.data;
                                return (
                                    <TouchableOpacity
                                        key={sound.id}
                                        style={styles.soundItem}
                                        onPress={() => onSoundPress && onSoundPress(sound.id)}
                                    >
                                        <View style={styles.soundImageContainer}>
                                            <Image
                                                source={{ uri: sound.coverUrl || 'https://via.placeholder.com/40' }}
                                                style={styles.soundImage}
                                            />
                                            <View style={styles.soundPlayButton}>
                                                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                                            </View>
                                        </View>
                                        <View style={styles.soundInfo}>
                                            <Text style={styles.soundTitle}>{sound.title}</Text>
                                            <Text style={styles.soundArtist}>{sound.artistName || "Unknown Artist"}</Text>
                                            <Text style={styles.soundPlays}>{formatNumber(sound.videosCount)} videos</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Load more button if there are more results */}
                {mixedFeedHasMore && !mixedFeedLoading && (
                    <TouchableOpacity
                        style={styles.loadMoreButton}
                        onPress={() => loadMixedFeed(false)}
                    >
                        <Text style={styles.loadMoreText}>Load More</Text>
                    </TouchableOpacity>
                )}

                {/* Loading indicator when loading more */}
                {mixedFeedLoading && mixedFeed.length > 0 && (
                    <View style={styles.loadingMoreContainer}>
                        <ActivityIndicator size="small" color="#FF5A5F" />
                        <Text style={styles.loadingMoreText}>Loading more...</Text>
                    </View>
                )}
            </ScrollView>
                </LinearGradient>
        );
    };

    // Render users search results
    const renderUsersResults = () => {
        if (mixedFeedLoading && userResults.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                    <Text style={styles.loadingText}>Searching for users...</Text>
                </View>
            );
        }

        if (userResults.length === 0 && !mixedFeedLoading) {
            return (
                <View style={styles.emptyResultsContainer}>
                    <Text style={styles.emptyResultsText}>No users found for "{query}"</Text>
                </View>
            );
        }

        return (
            <FlatList
                key="users-list"
                style={styles.fullHeightList}
                numColumns={1}
                data={userResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const user = item.data;
                    return (
                        <TouchableOpacity
                            style={styles.userItemVertical}
                            onPress={() => onUserPress && onUserPress(user.id)}
                        >
                            <Image
                                source={{ uri: user.profilePhotoUrl || 'https://via.placeholder.com/50' }}
                                style={styles.userAvatarVertical}
                            />
                            <View style={styles.userInfoVertical}>
                                <Text style={styles.usernameTextVertical}>{user.fullName || user.username}</Text>
                                <Text style={styles.userHandleText}>
                                    {user.username} • {formatNumber(user.followersCount)} followers
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.followButton}>
                                <Text style={styles.followButtonText}>Follow</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                }}
                onEndReached={() => {
                    if (mixedFeedHasMore && !mixedFeedLoading) {
                        loadMixedFeed(false);
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => (
                    mixedFeedLoading ? (
                        <View style={styles.loadingMoreContainer}>
                            <ActivityIndicator size="small" color="#FF5A5F" />
                            <Text style={styles.loadingMoreText}>Loading more users...</Text>
                        </View>
                    ) : null
                )}
            />
        );
    };

    // Render videos search results
    const renderVideosResults = () => {
        if (mixedFeedLoading && videoResults.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                    <Text style={styles.loadingText}>Searching for videos...</Text>
                </View>
            );
        }

        if (videoResults.length === 0 && !mixedFeedLoading) {
            return (
                <View style={styles.emptyResultsContainer}>
                    <Text style={styles.emptyResultsText}>No videos found for "{query}"</Text>
                </View>
            );
        }

        return (
            <FlatList
                key="videos-grid"
                style={styles.fullHeightList}
                contentContainerStyle={styles.videoGridContent}
                data={videoResults}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const video = item.data;
                    return (
                        <TouchableOpacity
                            style={styles.videoItemFull}
                            onPress={() => onVideoPress && onVideoPress(video.id)}
                        >
                            <Image
                                source={{ uri: video.thumbnailUrl || 'https://via.placeholder.com/160x220' }}
                                style={styles.videoThumbnailFull}
                            />
                            <View style={styles.videoPlayButtonFull}>
                                <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                            </View>
                            <View style={styles.videoInfoOverlayFull}>
                                <Text style={styles.videoViewCountFull}>{formatNumber(video.viewsCount)}</Text>
                            </View>
                            <View style={styles.videoUserInfo}>
                                <Image
                                    source={{ uri: video.user.profilePhotoUrl || 'https://via.placeholder.com/24' }}
                                    style={styles.videoUserAvatar}
                                />
                                <Text style={styles.videoUsername}>{video.user.fullName || video.user.username}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                onEndReached={() => {
                    if (mixedFeedHasMore && !mixedFeedLoading) {
                        loadMixedFeed(false);
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => (
                    mixedFeedLoading ? (
                        <View style={styles.loadingMoreContainer}>
                            <ActivityIndicator size="small" color="#FF5A5F" />
                            <Text style={styles.loadingMoreText}>Loading more videos...</Text>
                        </View>
                    ) : null
                )}
            />
        );
    };

    // Render sounds search results
    const renderSoundsResults = () => {
        if (mixedFeedLoading && soundResults.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                    <Text style={styles.loadingText}>Searching for sounds...</Text>
                </View>
            );
        }

        if (soundResults.length === 0 && !mixedFeedLoading) {
            return (
                <View style={styles.emptyResultsContainer}>
                    <Text style={styles.emptyResultsText}>No sounds found for "{query}"</Text>
                </View>
            );
        }

        return (
            <FlatList
                key="sounds-list"
                style={styles.fullHeightList}
                numColumns={1}
                data={soundResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const sound = item.data;
                    return (
                        <TouchableOpacity
                            style={styles.soundItemFull}
                            onPress={() => onSoundPress && onSoundPress(sound.id)}
                        >
                            <View style={styles.soundImageContainer}>
                                <Image
                                    source={{ uri: sound.coverUrl || 'https://via.placeholder.com/40' }}
                                    style={styles.soundImage}
                                />
                                <View style={styles.soundPlayButton}>
                                    <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                                </View>
                            </View>
                            <View style={styles.soundInfo}>
                                <Text style={styles.soundTitle}>{sound.title}</Text>
                                <Text style={styles.soundArtist}>{sound.artistName || "Unknown Artist"}</Text>
                                <Text style={styles.soundPlays}>{formatNumber(sound.videosCount)} videos</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                onEndReached={() => {
                    if (mixedFeedHasMore && !mixedFeedLoading) {
                        loadMixedFeed(false);
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => (
                    mixedFeedLoading ? (
                        <View style={styles.loadingMoreContainer}>
                            <ActivityIndicator size="small" color="#FF5A5F" />
                            <Text style={styles.loadingMoreText}>Loading more sounds...</Text>
                        </View>
                    ) : null
                )}
            />
        );
    };

    // Render content based on active tab
    const renderContent = () => {
        if (query.length === 0) {
            return renderSearchHistoryAndSuggestions();
        }

        switch (activeTab) {
            case 'Top':
                return renderTopResults();
            case 'Users':
                return renderUsersResults();
            case 'Videos':
                return renderVideosResults();
            case 'Sounds':
                return renderSoundsResults();
            default:
                return renderTopResults();
        }
    };

    return (
        <LinearGradient
            colors={["#1E4A72", "#000000"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
          >
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.fixedTopSection}>
                {/* Search Bar */}
                <View style={styles.searchBarContainer}>
                    <View style={styles.searchBar}>
                        <Search size={16} color="#AAAAAA" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search"
                            placeholderTextColor="#AAAAAA"
                            autoFocus
                            onSubmitEditing={handleSearchSubmit}
                            returnKeyType="search"
                        />
                        {showClear && (
                            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                                <X size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                        <X size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                {query.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabsContainer}
                        contentContainerStyle={styles.tabsContentContainer}
                    >
                        {TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tabButton,
                                    activeTab === tab && styles.activeTabButton
                                ]}
                                onPress={() => handleTabPress(tab as Tab)}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === tab && styles.activeTabText
                                    ]}
                                >
                                    {tab}
                                </Text>
                                {activeTab === tab && <View style={styles.activeTabIndicator} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Main Content - Takes all remaining space */}
            <View style={styles.expandedContentContainer}>
                {renderContent()}
            </View>
        </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#1a1a2e',
        backgroundColor: '#1E4A72',
    },
    fixedTopSection: {
        // backgroundColor: '#1a1a2e',
        zIndex: 10,
    },
    expandedContentContainer: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8, // Reduced padding
        borderBottomColor: '#333333',
        borderBottomWidth: 0.5,
        height: 50, // Fixed height
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34,34,34,0.1)',
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 36, // Reduced height
        borderWidth: 1,
        borderColor: '#FF4F5B',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        height: 40,
        padding: 0,
    },
    clearButton: {
        padding: 4,
    },
    cancelButton: {
        marginLeft: 12,
        padding: 4,
    },
    tabsContainer: {
        borderBottomColor: '#333333',
        borderBottomWidth: 0.5,
        height: 35, // Fixed height
    },
    tabsContentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 35, // Fixed height
    },
    tabButton: {
        paddingHorizontal: 16,
        paddingBottom: 5, // Reduced padding
        paddingTop: 10,
        position: 'relative',
        height: 35,
    },
    activeTabButton: {
        borderBottomColor: '#FF4F5B',
    },
    tabText: {
        color: '#999999',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Figtree'
    },
    activeTabText: {
        color: '#FF4F5B',
    },
    activeTabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        height: 2,
        backgroundColor: '#FF4F5B',
        borderRadius: 1,
    },
    contentContainer: {
        flex: 1,
        height: '100%',
    },
    fullHeightScrollView: {
        flex: 1,
        height: '100%',
    },
    fullHeightList: {
        flex: 1,
        height: '100%',
    },
    videoGridContent: {
        paddingBottom: 20,
    },
    historyContainer: {
        padding: 16,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    historyTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    clearAllText: {
        color: '#FF4F5B',
        fontSize: 14,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomColor: '#333333',
        borderBottomWidth: 0.5,
    },
    historyItemButton: {
        flex: 1,
    },
    historyItemText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    suggestedTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 16,
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    suggestionText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 16,
        marginTop: 16,
        marginBottom: 12,
        fontFamily: 'Figtree'
    },
    userListContainer: {
        paddingHorizontal: 16,
    },
    userItemHorizontal: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    userItemVertical: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomColor: '#333333',
        borderBottomWidth: 0.5,
    },
    userAvatarHorizontal: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#ffffff',
    },
    userAvatarVertical: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#ffffff',
    },
    userInfoHorizontal: {
        flex: 1,
    },
    userInfoVertical: {
        flex: 1,
    },
    usernameTextHorizontal: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Figtree'
    },
    usernameTextVertical: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    userHandleText: {
        color: '#AAAAAA',
        fontSize: 12,
        fontFamily: 'Figtree'
    },
    followButton: {
        backgroundColor: '#FF4F5B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    followButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Figtree'
    },
    videosGridContainer: {
        marginTop: 8,
    },
    videoItem: {
        width: 120,
        height: 160,
        marginRight: 8,
        marginLeft: 8,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    videoPlayButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateX: -20 }, { translateY: -20 }],
    },
    videoInfoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    videoViewCount: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    videosGridFull: {
        flex: 1,
        padding: 4,
        height: '100%',
    },
    videoItemFull: {
        flex: 1,
        margin: 4,
        height: 220,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    videoThumbnailFull: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    videoPlayButtonFull: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateX: -25 }, { translateY: -25 }],
    },
    videoInfoOverlayFull: {
        position: 'absolute',
        bottom: 40,
        right: 8,
        padding: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 4,
    },
    videoViewCountFull: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    videoUserInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    videoUserAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    videoUsername: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    soundsList: {
        paddingHorizontal: 16,
    },
    soundItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    soundItemFull: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomColor: '#333333',
        borderBottomWidth: 0.5,
    },
    soundImageContainer: {
        width: 40,
        height: 40,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        marginRight: 12,
    },
    soundImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    soundPlayButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soundInfo: {
        flex: 1,
    },
    soundTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    soundArtist: {
        color: '#AAAAAA',
        fontSize: 12,
    },
    soundPlays: {
        color: '#AAAAAA',
        fontSize: 12,
    },
    liveBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#FF4F5B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    liveText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    hashtagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomColor: '#333333',
        borderBottomWidth: 0.5,
    },
    hashtagIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    hashtagSymbol: {
        color: '#FF4F5B',
        fontSize: 20,
        fontWeight: 'bold',
    },
    hashtagInfo: {
        flex: 1,
    },
    hashtagName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    hashtagCount: {
        color: '#AAAAAA',
        fontSize: 12,
    },
    // New loading styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    loadingText: {
        color: '#AAAAAA',
        fontSize: 14,
        marginTop: 12,
    },
    loadingMoreContainer: {
        padding: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loadingMoreText: {
        color: '#AAAAAA',
        fontSize: 12,
        marginLeft: 8,
    },
    loadMoreButton: {
        backgroundColor: 'rgba(255, 79, 91, 0.2)',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 20,
        alignItems: 'center',
    },
    loadMoreText: {
        color: '#FF4F5B',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Figtree'
    },
    emptyResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyResultsText: {
        color: '#AAAAAA',
        fontSize: 16,
        textAlign: 'center',
        marginHorizontal: 40,
        fontFamily: 'Figtree'
    },
});

export default SearchResultsScreen;
