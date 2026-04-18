// Enhanced SearchBar.tsx - Updated with improved styling and animations
import React, { useState, useRef, useEffect } from 'react';
import { Platform, View, TextInput, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, UI } from './constants';

interface SearchBarProps {
    searchText: string;
    setSearchText: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchText, setSearchText }) => {
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;
    const clearButtonScale = useRef(new Animated.Value(0)).current;

    // Focus animation
    useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    // Clear button animation
    useEffect(() => {
        Animated.spring(clearButtonScale, {
            toValue: searchText ? 1 : 0,
            tension: 200,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, [searchText]);

    const handleClear = () => {
        setSearchText('');
    };

    return (
        <View style={styles.searchContainer}>
            <LinearGradient
                colors={[
                    'rgba(26, 26, 46, 0.8)',
                    'rgba(26, 26, 46, 0.6)'
                ]}
                style={styles.searchGradient}
            >
                <Animated.View style={[
                    styles.searchContent,
                    {
                        borderColor: focusAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [COLORS.border, COLORS.accentBorder],
                        }),
                        backgroundColor: focusAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [COLORS.surface, 'rgba(26, 26, 46, 0.9)'],
                        }),
                    }
                ]}>
                    {/* Search Icon */}
                    <Animated.View style={[
                        styles.searchIconContainer,
                        {
                            transform: [{
                                scale: focusAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.1],
                                })
                            }]
                        }
                    ]}>
                        <Search
                            size={UI.ICON_SIZE.MEDIUM}
                            color={isFocused ? COLORS.primary : COLORS.textGray}
                        />
                    </Animated.View>

                    {/* Text Input */}
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search messages..."
                        placeholderTextColor={COLORS.textGray}
                        value={searchText}
                        onChangeText={setSearchText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        selectionColor={COLORS.primary}
                    />

                    {/* Clear Button */}
                    <Animated.View style={[
                        styles.clearButtonContainer,
                        {
                            transform: [{ scale: clearButtonScale }]
                        }
                    ]}>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={handleClear}
                            activeOpacity={0.7}
                        >
                            <View style={styles.clearButtonIcon}>
                                <X size={UI.ICON_SIZE.SMALL} color={COLORS.textGray} />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        paddingHorizontal: Platform.OS === 'web' ? UI.SPACING.LG : UI.SPACING.MD,
        paddingVertical: UI.SPACING.MD,
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 760 : undefined,
        alignSelf: 'center',
    },
    searchGradient: {
        borderRadius: UI.BORDER_RADIUS.SEARCH,
        overflow: 'hidden',
        ...UI.SHADOW.SMALL,
    },
    searchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: UI.SPACING.MD,
        paddingVertical: Platform.OS === 'web' ? UI.SPACING.SM : UI.SPACING.XS + 2,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        borderRadius: UI.BORDER_RADIUS.SEARCH,
    },
    searchIconContainer: {
        marginRight: UI.SPACING.SM,
        padding: UI.SPACING.XS,
    },
    searchInput: {
        flex: 1,
        color: COLORS.white,
        fontSize: Platform.OS === 'web' ? 16 : 15,
        fontFamily: UI.FONT_FAMILY,
        fontWeight: '500',
        paddingVertical: UI.SPACING.XS,
    },
    clearButtonContainer: {
        marginLeft: UI.SPACING.SM,
    },
    clearButton: {
        padding: UI.SPACING.XS,
    },
    clearButtonIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(75, 85, 99, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SearchBar;
