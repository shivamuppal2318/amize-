import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
    Dimensions,
    Switch,
} from 'react-native';
import {
    X,
    Filter,
    Clock,
    Calendar,
    Users,
    Heart,
    Eye,
    Play,
    Music,
    Crown,
    Check,
    RotateCcw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export interface FilterOptions {
    contentType: 'all' | 'videos' | 'users' | 'sounds';
    sortBy: 'relevance' | 'recent' | 'popular' | 'trending';
    timeRange: 'all' | 'hour' | 'day' | 'week' | 'month';
    duration: 'all' | 'short' | 'medium' | 'long'; // For videos
    verified: 'all' | 'verified' | 'unverified'; // For users
    category: string | null;
    minViews: number | null;
    minLikes: number | null;
    minFollowers: number | null; // For users
    originalSounds: boolean; // For sounds
    includePrivate: boolean; // If user is authenticated
}

interface AdvancedFiltersProps {
    visible: boolean;
    onClose: () => void;
    filters: FilterOptions;
    onApplyFilters: (filters: FilterOptions) => void;
    categories: string[];
    isAuthenticated?: boolean;
}

const defaultFilters: FilterOptions = {
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
};

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
                                                             visible,
                                                             onClose,
                                                             filters,
                                                             onApplyFilters,
                                                             categories,
                                                             isAuthenticated = false,
                                                         }) => {
    const insets = useSafeAreaInsets();
    const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

    // Filter options
    const contentTypes = [
        { value: 'all', label: 'All Content', icon: <Filter size={16} color="#666" /> },
        { value: 'videos', label: 'Videos', icon: <Play size={16} color="#666" /> },
        { value: 'users', label: 'Users', icon: <Users size={16} color="#666" /> },
        { value: 'sounds', label: 'Sounds', icon: <Music size={16} color="#666" /> },
    ];

    const sortOptions = [
        { value: 'relevance', label: 'Most Relevant', icon: <Filter size={16} color="#666" /> },
        { value: 'recent', label: 'Most Recent', icon: <Clock size={16} color="#666" /> },
        { value: 'popular', label: 'Most Popular', icon: <Heart size={16} color="#666" /> },
        { value: 'trending', label: 'Trending', icon: <Eye size={16} color="#666" /> },
    ];

    const timeRanges = [
        { value: 'all', label: 'All Time' },
        { value: 'hour', label: 'Past Hour' },
        { value: 'day', label: 'Past Day' },
        { value: 'week', label: 'Past Week' },
        { value: 'month', label: 'Past Month' },
    ];

    const durations = [
        { value: 'all', label: 'Any Duration' },
        { value: 'short', label: 'Short (< 15s)' },
        { value: 'medium', label: 'Medium (15s - 60s)' },
        { value: 'long', label: 'Long (> 60s)' },
    ];

    const verificationOptions = [
        { value: 'all', label: 'All Users' },
        { value: 'verified', label: 'Verified Only', icon: <Crown size={16} color="#FFD700" /> },
        { value: 'unverified', label: 'Unverified Only' },
    ];

    const viewsThresholds = [
        { value: null, label: 'Any Views' },
        { value: 1000, label: '1K+ Views' },
        { value: 10000, label: '10K+ Views' },
        { value: 100000, label: '100K+ Views' },
        { value: 1000000, label: '1M+ Views' },
    ];

    const likesThresholds = [
        { value: null, label: 'Any Likes' },
        { value: 100, label: '100+ Likes' },
        { value: 1000, label: '1K+ Likes' },
        { value: 10000, label: '10K+ Likes' },
        { value: 100000, label: '100K+ Likes' },
    ];

    const followersThresholds = [
        { value: null, label: 'Any Followers' },
        { value: 1000, label: '1K+ Followers' },
        { value: 10000, label: '10K+ Followers' },
        { value: 100000, label: '100K+ Followers' },
        { value: 1000000, label: '1M+ Followers' },
    ];

    // Handlers
    const updateFilter = useCallback(<K extends keyof FilterOptions>(
        key: K,
        value: FilterOptions[K]
    ) => {
        setTempFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleReset = useCallback(() => {
        setTempFilters(defaultFilters);
    }, []);

    const handleApply = useCallback(() => {
        onApplyFilters(tempFilters);
        onClose();
    }, [tempFilters, onApplyFilters, onClose]);

    const handleClose = useCallback(() => {
        setTempFilters(filters); // Reset to original filters
        onClose();
    }, [filters, onClose]);

    // Render section
    const renderSection = (title: string, children: React.ReactNode) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    // Render option group
    const renderOptionGroup = <T extends string | number | null>(
        options: Array<{ value: T; label: string; icon?: React.ReactNode }>,
        currentValue: T,
        onSelect: (value: T) => void
    ) => (
        <View style={styles.optionGroup}>
            {options.map((option) => (
                <TouchableOpacity
                    key={String(option.value)}
                    style={[
                        styles.option,
                        currentValue === option.value && styles.selectedOption,
                    ]}
                    onPress={() => onSelect(option.value)}
                >
                    {option.icon && (
                        <View style={styles.optionIcon}>{option.icon}</View>
                    )}
                    <Text
                        style={[
                            styles.optionText,
                            currentValue === option.value && styles.selectedOptionText,
                        ]}
                    >
                        {option.label}
                    </Text>
                    {currentValue === option.value && (
                        <Check size={16} color="#FF5A5F" style={styles.checkIcon} />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    // Render categories
    const renderCategories = () => (
        <View style={styles.categoryGrid}>
            <TouchableOpacity
                style={[
                    styles.categoryChip,
                    tempFilters.category === null && styles.selectedCategoryChip,
                ]}
                onPress={() => updateFilter('category', null)}
            >
                <Text
                    style={[
                        styles.categoryChipText,
                        tempFilters.category === null && styles.selectedCategoryChipText,
                    ]}
                >
                    All Categories
                </Text>
            </TouchableOpacity>
            {categories.map((category) => (
                <TouchableOpacity
                    key={category}
                    style={[
                        styles.categoryChip,
                        tempFilters.category === category && styles.selectedCategoryChip,
                    ]}
                    onPress={() => updateFilter('category', category)}
                >
                    <Text
                        style={[
                            styles.categoryChipText,
                            tempFilters.category === category && styles.selectedCategoryChipText,
                        ]}
                    >
                        {category}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Advanced Filters</Text>
                    <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                        <RotateCcw size={20} color="#FF5A5F" />
                        <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Content Type */}
                    {renderSection(
                        'Content Type',
                        renderOptionGroup(
                            contentTypes,
                            tempFilters.contentType,
                            (value) => updateFilter('contentType', value)
                        )
                    )}

                    {/* Sort By */}
                    {renderSection(
                        'Sort By',
                        renderOptionGroup(
                            sortOptions,
                            tempFilters.sortBy,
                            (value) => updateFilter('sortBy', value)
                        )
                    )}

                    {/* Time Range */}
                    {renderSection(
                        'Time Range',
                        renderOptionGroup(
                            timeRanges,
                            tempFilters.timeRange,
                            (value) => updateFilter('timeRange', value)
                        )
                    )}

                    {/* Categories */}
                    {categories.length > 0 && renderSection(
                        'Categories',
                        renderCategories()
                    )}

                    {/* Video-specific filters */}
                    {(tempFilters.contentType === 'all' || tempFilters.contentType === 'videos') && (
                        <>
                            {renderSection(
                                'Video Duration',
                                renderOptionGroup(
                                    durations,
                                    tempFilters.duration,
                                    (value) => updateFilter('duration', value)
                                )
                            )}

                            {renderSection(
                                'Minimum Views',
                                renderOptionGroup(
                                    viewsThresholds,
                                    tempFilters.minViews,
                                    (value) => updateFilter('minViews', value)
                                )
                            )}

                            {renderSection(
                                'Minimum Likes',
                                renderOptionGroup(
                                    likesThresholds,
                                    tempFilters.minLikes,
                                    (value) => updateFilter('minLikes', value)
                                )
                            )}
                        </>
                    )}

                    {/* User-specific filters */}
                    {(tempFilters.contentType === 'all' || tempFilters.contentType === 'users') && (
                        <>
                            {renderSection(
                                'Verification Status',
                                renderOptionGroup(
                                    verificationOptions,
                                    tempFilters.verified,
                                    (value) => updateFilter('verified', value)
                                )
                            )}

                            {renderSection(
                                'Minimum Followers',
                                renderOptionGroup(
                                    followersThresholds,
                                    tempFilters.minFollowers,
                                    (value) => updateFilter('minFollowers', value)
                                )
                            )}
                        </>
                    )}

                    {/* Sound-specific filters */}
                    {(tempFilters.contentType === 'all' || tempFilters.contentType === 'sounds') && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Sound Options</Text>
                            <View style={styles.switchOption}>
                                <View style={styles.switchOptionLeft}>
                                    <Music size={16} color="#1DB954" />
                                    <Text style={styles.switchOptionText}>Original Sounds Only</Text>
                                </View>
                                <Switch
                                    value={tempFilters.originalSounds}
                                    onValueChange={(value) => updateFilter('originalSounds', value)}
                                    trackColor={{ false: '#767577', true: '#FF5A5F' }}
                                    thumbColor={tempFilters.originalSounds ? '#fff' : '#f4f3f4'}
                                />
                            </View>
                        </View>
                    )}

                    {/* Privacy options for authenticated users */}
                    {isAuthenticated && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Privacy</Text>
                            <View style={styles.switchOption}>
                                <View style={styles.switchOptionLeft}>
                                    <Eye size={16} color="#666" />
                                    <Text style={styles.switchOptionText}>Include Private Content</Text>
                                    <Text style={styles.switchOptionSubtext}>
                                        From creators you follow
                                    </Text>
                                </View>
                                <Switch
                                    value={tempFilters.includePrivate}
                                    onValueChange={(value) => updateFilter('includePrivate', value)}
                                    trackColor={{ false: '#767577', true: '#FF5A5F' }}
                                    thumbColor={tempFilters.includePrivate ? '#fff' : '#f4f3f4'}
                                />
                            </View>
                        </View>
                    )}

                    {/* Bottom spacing */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={handleApply}
                    >
                        <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    resetButtonText: {
        color: '#FF5A5F',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginVertical: 20,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Figtree',
        marginBottom: 12,
    },
    optionGroup: {
        gap: 8,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedOption: {
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    optionIcon: {
        marginRight: 12,
    },
    optionText: {
        flex: 1,
        color: '#999',
        fontSize: 14,
        fontFamily: 'Figtree',
    },
    selectedOptionText: {
        color: 'white',
        fontWeight: '500',
    },
    checkIcon: {
        marginLeft: 8,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedCategoryChip: {
        backgroundColor: 'rgba(255, 90, 95, 0.1)',
        borderColor: 'rgba(255, 90, 95, 0.3)',
    },
    categoryChipText: {
        color: '#999',
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    selectedCategoryChipText: {
        color: '#FF5A5F',
    },
    switchOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    switchOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    switchOptionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    switchOptionSubtext: {
        color: '#999',
        fontSize: 12,
        fontFamily: 'Figtree',
        marginLeft: 4,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    applyButton: {
        backgroundColor: '#FF5A5F',
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#FF5A5F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    applyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
});

export default AdvancedFilters;