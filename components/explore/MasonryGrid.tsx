import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Text,
    useWindowDimensions,
} from 'react-native';
import { MixedFeedItem } from "@/lib/api/types/video";
import GridItem from './GridItem';

interface MasonryGridProps {
    data: MixedFeedItem[];
    onLoadMore: () => void;
    onRefresh: () => void;
    refreshing: boolean;
    loading: boolean;
    hasMore: boolean;
    onVideoPress: (video: any) => void;
    onUserPress: (user: any) => void;
    onSoundPress: (sound: any) => void;
    numColumns?: number;
    spacing?: number;
    contentContainerStyle?: any;
}

interface GridColumn {
    items: (MixedFeedItem & { height: number; y: number })[];
    height: number;
}

const MasonryGrid: React.FC<MasonryGridProps> = memo(({
                                                          data,
                                                          onLoadMore,
                                                          onRefresh,
                                                          refreshing,
                                                          loading,
                                                          hasMore,
                                                          onVideoPress,
                                                          onUserPress,
                                                          onSoundPress,
                                                      numColumns = 2,
                                                      spacing = 8,
                                                      contentContainerStyle,
                                                  }) => {
    const { width: windowWidth } = useWindowDimensions();
    const [columns, setColumns] = useState<GridColumn[]>([]);
    const [containerHeight, setContainerHeight] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const loadMoreThreshold = 200; // Distance from bottom to trigger load more
    const isLoadingMore = useRef(false);
    const prevDataLength = useRef(0);
    const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastScrollY = useRef(0);

    // Prevent excessive re-renders when props don't change
    const dataRef = useRef(data);
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Calculate item dimensions based on aspect ratio
    const getItemDimensions = useCallback((item: MixedFeedItem) => {
        const horizontalPadding = spacing * (numColumns + 1);
        const columnWidth = Math.max(
            150,
            (windowWidth - horizontalPadding) / numColumns
        );

        let itemHeight: number;

        switch (item.aspectRatio) {
            case '1:1':
                itemHeight = columnWidth;
                break;
            case '1:2':
                itemHeight = columnWidth * 2;
                break;
            case '2:3':
                itemHeight = columnWidth * 1.5;
                break;
            case '9:16':
                itemHeight = columnWidth * 1.78;
                break;
            case '2:1':
                itemHeight = columnWidth * 0.5;
                break;
            default:
                itemHeight = columnWidth;
        }

        // Add padding for content inside item
        const contentPadding = item.type === 'user' ? 60 : 40;

        return {
            width: columnWidth,
            height: itemHeight + contentPadding,
        };
    }, [numColumns, spacing, windowWidth]);

    // Layout algorithm for masonry grid
    const calculateLayout = useCallback((items: MixedFeedItem[]) => {
        if (items.length === 0) {
            setColumns([]);
            setContainerHeight(0);
            return;
        }

        const newColumns: GridColumn[] = Array.from({ length: numColumns }, () => ({
            items: [],
            height: 0,
        }));

        items.forEach((item) => {
            const dimensions = getItemDimensions(item);

            // Find column with minimum height
            const shortestColumnIndex = newColumns.reduce((minIndex, column, index) => {
                return column.height < newColumns[minIndex].height ? index : minIndex;
            }, 0);

            const shortestColumn = newColumns[shortestColumnIndex];

            // Add item to shortest column
            const itemWithLayout = {
                ...item,
                height: dimensions.height,
                y: shortestColumn.height,
            };

            shortestColumn.items.push(itemWithLayout);
            shortestColumn.height += dimensions.height + spacing;
        });

        const maxHeight = Math.max(...newColumns.map(col => col.height));

        setColumns(newColumns);
        setContainerHeight(maxHeight);
    }, [numColumns, getItemDimensions, spacing]);

    // Recalculate layout when data changes with debouncing
    useEffect(() => {
        if (data.length !== prevDataLength.current) {
            // Performance optimization: Only recalculate if data length changed
            calculateLayout(data);
            prevDataLength.current = data.length;
        }
    }, [data, calculateLayout]);

    // Handle scroll to trigger load more with throttling
    const handleScroll = useCallback((event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        lastScrollY.current = contentOffset.y;

        // Skip if refreshing or already loading
        if (refreshing || isLoadingMore.current || loading) {
            return;
        }

        const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;

        if (distanceFromBottom < loadMoreThreshold && hasMore) {
            // Prevent multiple calls while scrolling
            if (!isLoadingMore.current) {
                isLoadingMore.current = true;

                // Clear any existing timeout
                if (loadMoreTimeoutRef.current) {
                    clearTimeout(loadMoreTimeoutRef.current);
                }

                // Debounce load more calls to prevent spamming
                loadMoreTimeoutRef.current = setTimeout(() => {
                    onLoadMore();
                    // Reset after a short delay to allow the loading state to propagate
                    setTimeout(() => {
                        isLoadingMore.current = false;
                    }, 300);
                }, 100);
            }
        }
    }, [onLoadMore, hasMore, loading, loadMoreThreshold, refreshing]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (loadMoreTimeoutRef.current) {
                clearTimeout(loadMoreTimeoutRef.current);
            }
        };
    }, []);

    // Render individual column
    const renderColumn = useCallback((column: GridColumn, columnIndex: number) => {
        const horizontalPadding = spacing * (numColumns + 1);
        const columnWidth = Math.max(
            150,
            (windowWidth - horizontalPadding) / numColumns
        );
        const columnLeft = spacing + columnIndex * (columnWidth + spacing);

        return (
            <View
                key={`column-${columnIndex}`}
                style={[
                    styles.column,
                    {
                        left: columnLeft,
                        width: columnWidth,
                    },
                ]}
            >
                {column.items.map((item, itemIndex) => (
                    <View
                        key={item.id}
                        style={[
                            styles.gridItemContainer,
                            {
                                marginBottom: spacing,
                                height: item.height,
                            },
                        ]}
                    >
                        <GridItem
                            item={item}
                            onVideoPress={onVideoPress}
                            onUserPress={onUserPress}
                            onSoundPress={onSoundPress}
                            width={columnWidth}
                            height={item.height}
                        />
                    </View>
                ))}
            </View>
        );
    }, [numColumns, spacing, onVideoPress, onUserPress, onSoundPress, windowWidth]);

    // Render loading footer with improved display logic
    const renderLoadingFooter = useCallback(() => {
        if (!loading || refreshing) return null;

        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#FF5A5F" />
                <Text style={styles.loadingText}>Loading more content...</Text>
            </View>
        );
    }, [loading, refreshing]);

    // Render empty state
    const renderEmptyState = useCallback(() => {
        if (loading || data.length > 0) return null;

        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No content available</Text>
                <Text style={styles.emptySubtitle}>
                    Try refreshing or changing your search filters
                </Text>
            </View>
        );
    }, [loading, data.length]);

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={[
                    contentContainerStyle,
                    { paddingBottom: 100 } // Extra padding for load more
                ]}
                onScroll={handleScroll}
                scrollEventThrottle={16} // Standard frame rate throttling
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FF5A5F"
                        colors={["#FF5A5F"]}
                    />
                }
                showsVerticalScrollIndicator={false}
                scrollsToTop={true}
                maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 10,
                }}
            >
                {data.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <View style={[styles.gridContainer, { height: containerHeight }]}>
                        {columns.map((column, index) => renderColumn(column, index))}
                    </View>
                )}

                {renderLoadingFooter()}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    gridContainer: {
        position: 'relative',
        paddingTop: 10,
        minHeight: 240,
    },
    column: {
        position: 'absolute',
        top: 0,
    },
    gridItemContainer: {
        overflow: 'hidden',
    },
    loadingFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    loadingText: {
        color: '#999',
        fontSize: 14,
        fontFamily: 'Figtree',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
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

// Use displayName for better debugging
MasonryGrid.displayName = 'MasonryGrid';

export default MasonryGrid;
