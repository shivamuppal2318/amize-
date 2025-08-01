import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    Animated,
} from 'react-native';
import {
    Clock,
    X,
    Search,
    Trash2,
    TrendingUp,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface SearchHistoryItem {
    id: string;
    query: string;
    timestamp: number;
    resultCount?: number;
    type?: 'search' | 'trending';
}

// Constants
const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 50;
const TRENDING_SEARCHES_KEY = '@trending_searches';

// Hook for managing search history
export const useSearchHistory = () => {
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Load search history from storage
    const loadSearchHistory = useCallback(async () => {
        try {
            setLoading(true);

            // Load search history
            const historyData = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
            if (historyData) {
                const parsedHistory: SearchHistoryItem[] = JSON.parse(historyData);
                // Sort by timestamp (most recent first) and limit to max items
                const sortedHistory = parsedHistory
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, MAX_HISTORY_ITEMS);
                setSearchHistory(sortedHistory);
            }

            // Load trending searches
            const trendingData = await AsyncStorage.getItem(TRENDING_SEARCHES_KEY);
            if (trendingData) {
                const parsedTrending: string[] = JSON.parse(trendingData);
                setTrendingSearches(parsedTrending);
            } else {
                // Default trending searches
                setTrendingSearches([
                    'funny videos',
                    'music',
                    'cooking',
                    'dance',
                    'travel',
                    'art',
                    'comedy',
                    'pets',
                ]);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Save search history to storage
    const saveSearchHistory = useCallback(async (history: SearchHistoryItem[]) => {
        try {
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }, []);

    // Add search to history
    const addToHistory = useCallback(async (query: string, resultCount?: number) => {
        if (!query.trim()) return;

        const trimmedQuery = query.trim().toLowerCase();

        const newItem: SearchHistoryItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            query: trimmedQuery,
            timestamp: Date.now(),
            resultCount,
            type: 'search',
        };

        setSearchHistory(prevHistory => {
            // Remove existing entry with same query
            const filteredHistory = prevHistory.filter(
                item => item.query.toLowerCase() !== trimmedQuery
            );

            // Add new item at the beginning
            const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

            // Save to storage
            saveSearchHistory(newHistory);

            return newHistory;
        });
    }, [saveSearchHistory]);

    // Remove item from history
    const removeFromHistory = useCallback(async (itemId: string) => {
        setSearchHistory(prevHistory => {
            const newHistory = prevHistory.filter(item => item.id !== itemId);
            saveSearchHistory(newHistory);
            return newHistory;
        });
    }, [saveSearchHistory]);

    // Clear all search history
    const clearHistory = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
            setSearchHistory([]);
        } catch (error) {
            console.error('Error clearing search history:', error);
        }
    }, []);

    // Get recent searches (limited to specified count)
    const getRecentSearches = useCallback((limit = 5) => {
        return searchHistory.slice(0, limit);
    }, [searchHistory]);

    // Get search suggestions based on partial query
    const getSearchSuggestions = useCallback((query: string, limit = 5) => {
        if (!query.trim()) return [];

        const trimmedQuery = query.trim().toLowerCase();

        // Filter history items that start with or include the query
        const historySuggestions = searchHistory
            .filter(item => item.query.toLowerCase().includes(trimmedQuery))
            .slice(0, limit)
            .map(item => item.query);

        // Filter trending searches that include the query
        const trendingSuggestions = trendingSearches
            .filter(search => search.toLowerCase().includes(trimmedQuery))
            .slice(0, Math.min(3, limit));

        // Combine and deduplicate
        const allSuggestions = [...new Set([...historySuggestions, ...trendingSuggestions])];

        return allSuggestions.slice(0, limit);
    }, [searchHistory, trendingSearches]);

    // Load data on mount
    useEffect(() => {
        loadSearchHistory();
    }, [loadSearchHistory]);

    return {
        searchHistory,
        trendingSearches,
        loading,
        addToHistory,
        removeFromHistory,
        clearHistory,
        getRecentSearches,
        getSearchSuggestions,
        refreshHistory: loadSearchHistory,
    };
};

// Search History Component Props
interface SearchHistoryProps {
    onSearchSelect: (query: string) => void;
    onClose?: () => void;
    maxItems?: number;
    showTrending?: boolean;
    showClearOption?: boolean;
    compact?: boolean; // New prop for compact mode
}

// Search History Component
export const SearchHistory: React.FC<SearchHistoryProps> = ({
                                                                onSearchSelect,
                                                                onClose,
                                                                maxItems = 5, // Default to 5 items now
                                                                showTrending = true,
                                                                showClearOption = true,
                                                                compact = false, // Compact mode by default off
                                                            }) => {
    const {
        searchHistory,
        trendingSearches,
        loading,
        removeFromHistory,
        clearHistory,
        getRecentSearches,
    } = useSearchHistory();

    const recentSearches = getRecentSearches(maxItems);

    const handleClearHistory = useCallback(() => {
        Alert.alert(
            'Clear Search History',
            'Are you sure you want to clear all search history?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: clearHistory,
                },
            ]
        );
    }, [clearHistory]);

    const formatTimeAgo = useCallback((timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }, []);

    const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
        <TouchableOpacity
            style={[styles.historyItem, compact && styles.historyItemCompact]}
            onPress={() => onSearchSelect(item.query)}
        >
            <View style={styles.historyItemLeft}>
                <Clock size={compact ? 14 : 16} color="#666" />
                <View style={styles.historyItemText}>
                    <Text style={[styles.historyQuery, compact && styles.historyQueryCompact]}>{item.query}</Text>
                    {!compact && (
                        <Text style={styles.historyTime}>{formatTimeAgo(item.timestamp)}</Text>
                    )}
                </View>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromHistory(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <X size={compact ? 12 : 14} color="#666" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderTrendingItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[styles.trendingItem, compact && styles.trendingItemCompact]}
            onPress={() => onSearchSelect(item)}
        >
            <TrendingUp size={compact ? 14 : 16} color="#FF5A5F" />
            <Text style={[styles.trendingQuery, compact && styles.trendingQueryCompact]}>{item}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
                <View style={[styles.section, compact && styles.sectionCompact]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Recent</Text>
                        {showClearOption && (
                            <TouchableOpacity
                                onPress={handleClearHistory}
                                style={styles.clearButton}
                            >
                                <Trash2 size={compact ? 14 : 16} color="#FF5A5F" />
                                <Text style={[styles.clearButtonText, compact && styles.clearButtonTextCompact]}>
                                    Clear
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <FlatList
                        data={recentSearches}
                        renderItem={renderHistoryItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                    />
                </View>
            )}

            {/* Trending Searches - More compact version */}
            {showTrending && trendingSearches.length > 0 && !compact && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trending</Text>
                    <FlatList
                        data={trendingSearches.slice(0, 4)} // Limit to 4 trending items
                        renderItem={renderTrendingItem}
                        keyExtractor={(item, index) => `trending-${index}`}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                        columnWrapperStyle={styles.trendingRow}
                    />
                </View>
            )}

            {/* Empty State */}
            {recentSearches.length === 0 && (!showTrending || trendingSearches.length === 0) && (
                <View style={[styles.emptyContainer, compact && styles.emptyContainerCompact]}>
                    <Search size={compact ? 32 : 48} color="#666" />
                    <Text style={[styles.emptyTitle, compact && styles.emptyTitleCompact]}>No search history</Text>
                    {!compact && (
                        <Text style={styles.emptySubtitle}>
                            Your recent searches will appear here
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};

// Search Suggestions Component (for dropdown)
interface SearchSuggestionsProps {
    query: string;
    onSuggestionSelect: (suggestion: string) => void;
    maxSuggestions?: number;
    autoHideDelay?: number; // New: auto-hide after delay
    visible?: boolean; // New: control visibility externally
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
                                                                        query,
                                                                        onSuggestionSelect,
                                                                        maxSuggestions = 5,
                                                                        autoHideDelay = 3000, // Default: hide after 3 seconds of inactivity
                                                                        visible = true,
                                                                    }) => {
    const { getSearchSuggestions } = useSearchHistory();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [fadeAnim] = useState(new Animated.Value(1));

    // Auto-hide functionality
    useEffect(() => {
        let hideTimeout: number

        if (visible && query && autoHideDelay > 0) {
            // Reset opacity when visible
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Set timeout to fade out
            hideTimeout = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            }, autoHideDelay);
        }

        return () => {
            if (hideTimeout) clearTimeout(hideTimeout);
        };
    }, [query, visible, autoHideDelay, fadeAnim]);

    // Update suggestions when query changes
    useEffect(() => {
        if (query && query.length >= 2) {
            setSuggestions(getSearchSuggestions(query, maxSuggestions));
        } else {
            setSuggestions([]);
        }
    }, [query, maxSuggestions, getSearchSuggestions]);

    if (!visible || suggestions.length === 0) return null;

    return (
        <Animated.View
            style={[
                styles.suggestionsContainer,
                { opacity: fadeAnim }
            ]}
        >
            {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                    key={`suggestion-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => onSuggestionSelect(suggestion)}
                >
                    <Search size={16} color="#666" />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
            ))}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    containerCompact: {
        padding: 0,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        color: '#999',
        fontSize: 14,
        fontFamily: 'Figtree',
    },
    section: {
        marginBottom: 20,
    },
    sectionCompact: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    sectionTitleCompact: {
        fontSize: 14,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    clearButtonText: {
        color: '#FF5A5F',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    clearButtonTextCompact: {
        fontSize: 12,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    historyItemCompact: {
        paddingVertical: 8,
    },
    historyItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    historyItemText: {
        flex: 1,
    },
    historyQuery: {
        color: 'white',
        fontSize: 15,
        fontFamily: 'Figtree',
    },
    historyQueryCompact: {
        fontSize: 14,
    },
    historyTime: {
        color: '#666',
        fontSize: 12,
        fontFamily: 'Figtree',
        marginTop: 2,
    },
    removeButton: {
        padding: 4,
    },
    trendingRow: {
        justifyContent: 'space-between',
    },
    trendingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
        gap: 6,
        flex: 0.48, // Slightly less than 0.5 to account for gap
    },
    trendingItemCompact: {
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    trendingQuery: {
        color: '#FF5A5F',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Figtree',
        flex: 1,
    },
    trendingQueryCompact: {
        fontSize: 12,
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyContainerCompact: {
        paddingVertical: 20,
    },
    emptyTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Figtree',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyTitleCompact: {
        fontSize: 14,
        marginTop: 8,
        marginBottom: 0,
    },
    emptySubtitle: {
        color: '#666',
        fontSize: 14,
        fontFamily: 'Figtree',
        textAlign: 'center',
        lineHeight: 20,
    },
    // Suggestions dropdown styles
    suggestionsContainer: {
        backgroundColor: 'rgba(30, 30, 50, 0.95)',
        borderRadius: 12,
        paddingVertical: 6,
        marginTop: 4,
        maxHeight: 220,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 12,
    },
    suggestionText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Figtree',
        flex: 1,
    },
});

export default SearchHistory;