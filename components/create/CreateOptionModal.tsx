import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MonitorUp, TvMinimalPlay } from "lucide-react-native";
import { isLiveStreamingEnabled } from '@/lib/release/releaseConfig';

interface CreateOptionModalProps {
    visible: boolean;
    onClose: () => void;
}

const CreateOptionModal: React.FC<CreateOptionModalProps> = ({ visible, onClose }) => {
    const router = useRouter();
    const liveEnabled = isLiveStreamingEnabled();

    const handlePostPress = () => {
        onClose();
        router.push("/post");
    };

    const handleLivePress = () => {
        onClose();
        router.push("/live");
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.overlay}
                onPress={onClose}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={handlePostPress}
                    >
                        <Text style={styles.optionText}>Post</Text>
                        <View>
                            <MonitorUp size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {liveEnabled && (
                        <>
                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.option}
                                onPress={handleLivePress}
                            >
                                <Text style={styles.optionText}>Live</Text>
                                <View>
                                    <TvMinimalPlay size={20} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                <View style={styles.triangle}></View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(26,26,46,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        position: 'absolute',
        bottom: 100, // Position above the tab bar
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        width: 120,
        overflow: 'hidden',
    },
    option: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    divider: {
        height: 1,
        backgroundColor: '#5e5e77',
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#1a1a2e',
        position: 'absolute',
        bottom: 90,
        alignSelf: 'center',
    },
});

export default CreateOptionModal;
