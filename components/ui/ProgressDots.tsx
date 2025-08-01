import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

type ProgressDotsProps = {
    total: number;
    current: number;
    style?: StyleProp<ViewStyle>; // Changed className to style for RN
};

export const ProgressDots = ({ total, current, style }: ProgressDotsProps) => {
    return (
        <View style={[styles.container, style]}>
            {Array.from({ length: total }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        index === current ? styles.activeDot : styles.inactiveDot
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 16, // my-4
    },
    dot: {
        height: 8, // h-2
        borderRadius: 9999, // rounded-full
        marginHorizontal: 4, // mx-1
    },
    activeDot: {
        backgroundColor: '#FF5A5F',
        width: 16, // w-4
    },
    inactiveDot: {
        backgroundColor: '#6B7280', // bg-gray-500
        width: 8, // w-2
    },
});