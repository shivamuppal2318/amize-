import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface BackButtonProps {
    onPress?: () => void;
    color?: string;
    size?: number;
}

const BackButton: React.FC<BackButtonProps> = ({
                                                   onPress,
                                                   color = '#FFFFFF',
                                                   size = 24
                                               }) => {
    const router = useRouter();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.back();
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <ArrowLeft size={size} color={color} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
    },
});

export default BackButton;