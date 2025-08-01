import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
    Camera,
    X,
    Music,
    Filter,
    Sparkles,
    MessageSquare,
    Zap,
    Video as VideoIcon
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function CaptureScreen() {
    const router = useRouter();
    const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');

    const handleClose = () => {
        router.back();
    };

    const handleCapture = () => {
        router.push('/post/edit');
    };

    // Side action buttons
    const sideActions = [
        { icon: <Music size={24} color="#fff" />, label: 'Sound' },
        { icon: <Filter size={24} color="#fff" />, label: 'Filters' },
        { icon: <Sparkles size={24} color="#fff" />, label: 'Beauty' },
        { icon: <MessageSquare size={24} color="#fff" />, label: 'Reply' },
        { icon: <Zap size={24} color="#fff" />, label: 'Flash' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* Header with close button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose}>
                    <X size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.addSoundButton}>
                    <Text style={styles.addSoundText}>Add Sound</Text>
                    <Music size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Camera Preview Area */}
            <View style={styles.cameraPreview}>
                <Text style={styles.placeholderText}>Camera Preview</Text>
            </View>

            {/* Side Action Buttons */}
            <View style={styles.sideActionsContainer}>
                {sideActions.map((action, index) => (
                    <TouchableOpacity key={index} style={styles.sideActionButton}>
                        {action.icon}
                        <Text style={styles.sideActionLabel}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
                <View style={styles.tabBar}>
                    <TouchableOpacity style={styles.tabButton}>
                        <Text style={[styles.tabText, { color: '#fff' }]}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tabButton}>
                        <Text style={[styles.tabText, { color: '#999' }]}>Quick</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tabButton}>
                        <Text style={[styles.tabText, { color: '#999' }]}>Template</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.captureBar}>
                    <TouchableOpacity style={styles.modeButton}>
                        <Text style={styles.modeText}>Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={handleCapture}
                    >
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modeButton}>
                        <VideoIcon size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    addSoundButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addSoundText: {
        color: '#fff',
        marginRight: 6,
        fontSize: 14,
        fontFamily: 'Figtree',
    },
    cameraPreview: {
        width: width,
        height: height - 200, // Approximate space for controls
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#555',
        fontSize: 16,
    },
    sideActionsContainer: {
        position: 'absolute',
        right: 16,
        top: 100,
        alignItems: 'center',
    },
    sideActionButton: {
        alignItems: 'center',
        marginBottom: 24,
    },
    sideActionLabel: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Figtree',
        marginTop: 4,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    tabButton: {
        paddingVertical: 12,
        flex: 1,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Figtree',
    },
    captureBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 20,
    },
    modeButton: {
        padding: 8,
    },
    modeText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Figtree',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#ff4d67',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#fff',
    },
});