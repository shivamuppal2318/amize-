import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BackButton from '../Navigation/BackButton';

interface HeaderBarProps {
    title: string;
    rightElement?: ReactNode;
    onBackPress?: () => void;
    showBackButton?: boolean;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
                                                 title,
                                                 rightElement,
                                                 onBackPress,
                                                 showBackButton = true,
                                             }) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {showBackButton && <BackButton onPress={onBackPress} />}
            </View>

            <Text style={styles.title}>{title}</Text>

            <View style={styles.rightContainer}>
                {rightElement ? rightElement : <View style={styles.placeholder} />}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        backgroundColor: '#1a1a2e',
    },
    leftContainer: {
        width: 40,
        alignItems: 'flex-start',
    },
    rightContainer: {
        width: 40,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    placeholder: {
        width: 24,
    },
});

export default HeaderBar;