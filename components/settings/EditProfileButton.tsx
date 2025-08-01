import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Edit2 } from 'lucide-react-native';

interface EditProfileButtonProps {
    onPress: () => void;
}

export const EditProfileButton = ({ onPress }: EditProfileButtonProps) => {
    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Edit2 size={20} color="#FF4D67" />
            <Text style={styles.buttonText}>
                Edit Profile
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 24,
        width: '100%',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 77, 103, 0.3)',
        borderRadius: 9999,
    },
    buttonText: {
        color: '#FF4D67',
        fontSize: 18,
        fontWeight: '500',
        marginLeft: 8,
    }
});
