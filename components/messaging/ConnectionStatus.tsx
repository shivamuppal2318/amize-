import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WifiOff, RotateCcw } from 'lucide-react-native';
import { MotiView } from 'moti';
import { COLORS, UI } from './constants';

interface ConnectionStatusProps {
    isConnected: boolean;
    onRetry: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, onRetry }) => {
    if (isConnected) return null;

    return (
        <MotiView
            from={{ translateY: -50, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            style={styles.connectionStatus}
        >
            <WifiOff size={16} color={COLORS.white} />
            <Text style={styles.connectionStatusText}>No connection</Text>
            <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                <RotateCcw size={16} color={COLORS.white} />
            </TouchableOpacity>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.error,
        paddingVertical: UI.SPACING.SM,
        paddingHorizontal: UI.SPACING.LG,
        gap: UI.SPACING.SM,
    },
    connectionStatusText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
    },
    retryButton: {
        padding: UI.SPACING.XS,
    },
});

export default ConnectionStatus;