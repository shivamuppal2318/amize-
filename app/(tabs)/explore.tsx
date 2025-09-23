import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import {
    Search,
    X,
    Filter,
    ArrowLeft,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import useExplore from '@/hooks/useExplore';
import { useSearchHistory, SearchHistory, SearchSuggestions } from '@/components/explore/SearchHistory';
import AdvancedFilters, { FilterOptions } from '@/components/explore/AdvancedFilters';
import MasonryGrid from '@/components/explore/MasonryGrid';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ExploreScreen = () => {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();
    const { addToHistory } = useSearchHistory();

    // Animated values for suggestions panel
    const suggestionsOpacity = useRef(new Animated.Value(0)).current;
    const suggestionsHeight = useRef(new Animated.Value(0)).current;

    // State management
    const [showFilters, setShowFilters] = useState(false);
    const [showSearchHistory, setShowSearchHistory] = useState(false);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        contentType: 'all',
        sortBy: 'relevance',
        timeRange: 'all',
        duration: 'all',
        verified: 'all',
        category: null,
        minViews: null,
        minLikes: null,
        minFollowers: null,
        originalSounds: false,
        includePrivate: false,
    });

    // Search state refs to avoid unnecessary renders
    const searchFocusedRef = useRef(false);
    const lastSearchTimestampRef = useRef(0);
    const lastTypingTimestampRef = useRef(0);
    const autoHideTimeoutRef = useRef<number | null>(null);

    // Categories for filters
    const categories = useMemo(() => [
        'Comedy', 'Music', 'Dance', 'Food', 'Travel', 'Art', 'Sports',
        'Gaming', 'Education', 'Fashion', 'Beauty', 'Pets', 'DIY'
    ], []);

    // Use the enhanced explore hook with mixed feed enabled
    const {
        searchQuery,
        setSearchQuery,
        mixedFeed,
        mixedFeedLoading,
        mixedFeedHasMore,
        loadMixedFeed,
        refreshing,
        handleRefresh,
        clearSearch,
        searchSuggestions,
        hasSuggestions,
        isSearchActive,
    } = useExplore({
        debounceDelay: 500, // Increased delay to reduce API calls
        suggestionsLimit: 5,
        contentLimit: 20,
        enableMixedFeed: true,
        minLoadInterval: 2000, // 2 seconds between load more calls
    });

    const searchInputRef = useRef<TextInput>(null);
    const userQueryChangeRef = useRef(false);

    // Auto-hide suggestions after inactivity
    const scheduleAutoHideSuggestions = useCallback(() => {
        // Clear any existing timeout
        if (autoHideTimeoutRef.current) {
            clearTimeout(autoHideTimeoutRef.current);
        }

        // Set new timeout to hide suggestions
        autoHideTimeoutRef.current = setTimeout(() => {
            if (showSearchSuggestions) {
                // Animate hiding
                Animated.parallel([
                    Animated.timing(suggestionsOpacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                    Animated.timing(suggestionsHeight, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: false,
                    })
                ]).start(() => {
                    setShowSearchSuggestions(false);
                });
            }
        }, 3000); // Hide after 3 seconds of inactivity
    }, [showSearchSuggestions, suggestionsOpacity, suggestionsHeight]);

    // Animate showing/hiding suggestions
    useEffect(() => {
        if (showSearchSuggestions) {
            // Animate showing
            Animated.parallel([
                Animated.timing(suggestionsOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(suggestionsHeight, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                })
            ]).start();

            // Schedule auto-hide
            scheduleAutoHideSuggestions();
        }
    }, [showSearchSuggestions, suggestionsOpacity, suggestionsHeight, scheduleAutoHideSuggestions]);

    // Clean up timeouts
    useEffect(() => {
        return () => {
            if (autoHideTimeoutRef.current) {
                clearTimeout(autoHideTimeoutRef.current);
            }
        };
    }, []);

    // Navigation handlers
    const handleVideoPress = useCallback((video: any) => {
        router.push({
            pathname: '/(tabs)',
            params: { videoId: video.id }
        });
    }, []);

    const handleUserPress = useCallback((user: any) => {
        router.push(`/(tabs)/profile/${user.id}`);
    }, []);

    const handleSoundPress = useCallback((sound: any) => {
        console.log('Sound pressed:', sound.id);
        // Could navigate to sound details or videos using this sound
    }, []);

    // Search handlers with debouncing to limit state updates
    const handleSearchWithHistory = useCallback(async (query: string, saveToHistory = true) => {
        if (!query.trim()) return;

        // Prevent duplicate or very fast queries
        const now = Date.now();
        if (now - lastSearchTimestampRef.current < 300) {
            return;
        }
        lastSearchTimestampRef.current = now;

        // Mark that the user initiated this query (not a suggestion)
        userQueryChangeRef.current = true;
        setSearchQuery(query);

        // Hide all dropdowns
        setShowSearchHistory(false);
        setShowSearchSuggestions(false);

        if (saveToHistory) {
            await addToHistory(query);
        }
    }, [setSearchQuery, addToHistory]);

    const handleSearchFocus = useCallback(() => {
        searchFocusedRef.current = true;

        if (!searchQuery.trim()) {
            // Show history when focusing with empty query
            setShowSearchHistory(true);
            setShowSearchSuggestions(false);
        } else if (searchQuery.trim().length >= 2 && hasSuggestions) {
            // Show suggestions when focusing with valid query
            setShowSearchSuggestions(true);
            setShowSearchHistory(false);
            // Reset auto-hide timer
            scheduleAutoHideSuggestions();
        }
    }, [searchQuery, hasSuggestions, scheduleAutoHideSuggestions]);

    const handleSearchBlur = useCallback(() => {
        searchFocusedRef.current = false;

        // Delay hiding to allow for suggestion selection
        setTimeout(() => {
            if (!searchFocusedRef.current) {
                // Hide both panels when blurring
                setShowSearchHistory(false);

                // Animate hiding suggestions
                if (showSearchSuggestions) {
                    Animated.parallel([
                        Animated.timing(suggestionsOpacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: false,
                        }),
                        Animated.timing(suggestionsHeight, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: false,
                        })
                    ]).start(() => {
                        setShowSearchSuggestions(false);
                    });
                }
            }
        }, 200);
    }, [showSearchSuggestions, suggestionsOpacity, suggestionsHeight]);

    const handleSearchSubmit = useCallback(() => {
        if (searchQuery.trim()) {
            handleSearchWithHistory(searchQuery);
        }
        searchInputRef.current?.blur();
    }, [searchQuery, handleSearchWithHistory]);

    const handleSuggestionSelect = useCallback((suggestion: string) => {
        // Prevent focus/blur issues during selection
        searchFocusedRef.current = true;

        setSearchQuery(suggestion);
        handleSearchWithHistory(suggestion, true);

        // Hide suggestions after selection
        setShowSearchSuggestions(false);
    }, [handleSearchWithHistory, setSearchQuery]);

    // Controlled input change handler with improved typing detection
    const handleSearchInputChange = useCallback((text: string) => {
        // Mark that the user initiated this query
        userQueryChangeRef.current = true;
        setSearchQuery(text);

        // Update last typing timestamp
        lastTypingTimestampRef.current = Date.now();

        // Show appropriate panels based on text
        if (text.trim().length >= 2) {
            setShowSearchSuggestions(true);
            setShowSearchHistory(false);
            // Reset auto-hide timer
            scheduleAutoHideSuggestions();
        } else {
            setShowSearchSuggestions(false);
            if (text.trim().length === 0) {
                setShowSearchHistory(true);
            } else {
                setShowSearchHistory(false);
            }
        }
    }, [setSearchQuery, scheduleAutoHideSuggestions]);

    const handleClearSearch = useCallback(() => {
        userQueryChangeRef.current = true;
        setSearchQuery('');
        clearSearch();
        setShowSearchSuggestions(false);
        setShowSearchHistory(false);
        searchInputRef.current?.blur();
    }, [setSearchQuery, clearSearch]);

    const handleApplyFilters = useCallback((newFilters: FilterOptions) => {
        setFilters(newFilters);
        // Could implement filter application logic here
    }, []);

    const handleLoadMore = useCallback(() => {
        if (mixedFeedHasMore && !mixedFeedLoading && !refreshing) {
            loadMixedFeed(false);
        }
    }, [mixedFeedHasMore, mixedFeedLoading, refreshing, loadMixedFeed]);

    // Render search suggestions dropdown with improved animation
    const renderSearchSuggestions = useMemo(() => {
        const suggestionsAnimatedStyle = {
            opacity: suggestionsOpacity,
            maxHeight: suggestionsHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 220]
            }),
            transform: [{
                translateY: suggestionsHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0]
                })
            }]
        };

        if (!showSearchSuggestions || !hasSuggestions) {
            return null;
        }

        return (
            <Animated.View
                style={[
                    styles.suggestionsContainer,
                    { top: insets.top + 70 },
                    suggestionsAnimatedStyle
                ]}
                pointerEvents={showSearchSuggestions ? 'auto' : 'none'}
            >
                <SearchSuggestions
                    query={searchQuery}
                    onSuggestionSelect={handleSuggestionSelect}
                    maxSuggestions={5}
                    autoHideDelay={3000}
                    visible={showSearchSuggestions}
                />
            </Animated.View>
        );
    }, [
        showSearchSuggestions,
        hasSuggestions,
        suggestionsOpacity,
        suggestionsHeight,
        insets.top,
        searchQuery,
        handleSuggestionSelect
    ]);

    // Render main content with memoization to reduce rerenders
    const renderContent = useMemo(() => {
        if (mixedFeedLoading && mixedFeed.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                    <Text style={styles.loadingText}>Discovering amazing content...</Text>
                </View>
            );
        }

        return (
            <MasonryGrid
                data={mixedFeed}
                onLoadMore={handleLoadMore}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                loading={mixedFeedLoading}
                hasMore={mixedFeedHasMore}
                onVideoPress={handleVideoPress}
                onUserPress={handleUserPress}
                onSoundPress={handleSoundPress}
                numColumns={2}
                spacing={8}
                contentContainerStyle={styles.gridContent}
            />
        );
    }, [
        mixedFeed,
        mixedFeedLoading,
        refreshing,
        mixedFeedHasMore,
        handleLoadMore,
        handleRefresh,
        handleVideoPress,
        handleUserPress,
        handleSoundPress
    ]);

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: 50,  }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={-insets.bottom}
        >
            <LinearGradient
                colors={['#1E4A72', '#000000']}  
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1 }}
            >
            {/* Header */}
                <View style={styles.header}>
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Search size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                ref={searchInputRef}
                                style={styles.searchInput}
                                placeholder="Search for videos, users, sounds..."
                                placeholderTextColor="#999"
                                value={searchQuery}
                                onChangeText={handleSearchInputChange}
                                onFocus={handleSearchFocus}
                                onBlur={handleSearchBlur}
                                returnKeyType="search"
                                onSubmitEditing={handleSearchSubmit}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                                    <X size={16} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
                            <Filter size={20} color="#FF5A5F" />
                        </TouchableOpacity>
                    </View>

                    {/* Search state indicator */}
                    {isSearchActive && (
                        <View style={styles.searchIndicator}>
                            <Text style={styles.searchIndicatorText}>
                                Searching for "{searchQuery}"
                            </Text>
                            <TouchableOpacity onPress={handleClearSearch}>
                                <Text style={styles.clearSearchText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Search suggestions dropdown - with auto-hide */}
                {renderSearchSuggestions}

                {/* Main content */}
                <View style={styles.content}>
                    {renderContent}
                </View>

                {/* Search History Modal - More compact */}
                <Modal
                    visible={showSearchHistory}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setShowSearchHistory(false)}
                >
                    <TouchableOpacity
                        style={styles.searchHistoryOverlay}
                        activeOpacity={1}
                        onPress={() => setShowSearchHistory(false)}
                    >
                        <View style={[styles.searchHistoryModal, { top: insets.top + 70 }]}>
                            <SearchHistory
                                onSearchSelect={(query) => {
                                    handleSearchWithHistory(query, false);
                                }}
                                maxItems={5}  // Only show 5 recent searches
                                showTrending={true}
                                showClearOption={true}
                                compact={true}  // Use compact mode
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Advanced Filters Modal */}
                <AdvancedFilters
                    visible={showFilters}
                    onClose={() => setShowFilters(false)}
                    filters={filters}
                    onApplyFilters={handleApplyFilters}
                    categories={categories}
                    isAuthenticated={isAuthenticated}
                />
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#1a1a2e',
        backgroundColor: '#1E4A72',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontFamily: 'Figtree',
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    filterButton: {
        padding: 12,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    searchIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 90, 95, 0.2)',
    },
    searchIndicatorText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Figtree',
        flex: 1,
    },
    clearSearchText: {
        color: '#FF5A5F',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    suggestionsContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: 'rgba(30, 30, 50, 0.95)',
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    searchHistoryOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    searchHistoryModal: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        maxHeight: 300, // Smaller height
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        color: '#999',
        fontSize: 16,
        fontFamily: 'Figtree',
        marginTop: 12,
    },
    gridContent: {
        paddingVertical: 8,
    },
});

export default ExploreScreen;