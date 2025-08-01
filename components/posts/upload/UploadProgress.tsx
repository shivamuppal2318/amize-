import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';

interface UploadProgressProps {
    visible: boolean;
    progress: number;
    status?: 'uploading' | 'processing' | 'complete';
}

export default function UploadProgress({
                                           visible,
                                           progress,
                                           status = 'uploading'
                                       }: UploadProgressProps) {
    if (!visible) return null;

    const getTitle = () => {
        switch (status) {
            case 'processing':
                return 'Processing Media';
            case 'complete':
                return 'Upload Complete';
            default:
                return 'Uploading Media';
        }
    };

    const getMessage = () => {
        if (progress < 100) {
            return "Please don't close the app while uploading";
        }
        return "Creating your post...";
    };

    return (
        <View style={styles.uploadOverlay}>
            <View style={styles.uploadContainer}>
                <Text style={styles.uploadTitle}>{getTitle()}</Text>
                <View style={styles.uploadProgressBar}>
                    <View
                        style={[
                            styles.uploadProgressFill,
                            { width: `${progress}%` }
                        ]}
                    />
                </View>
                <Text style={styles.uploadPercentage}>{progress}%</Text>
                <Text style={styles.uploadMessage}>
                    {getMessage()}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    uploadContainer: {
        width: '80%',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    uploadTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    uploadProgressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    uploadProgressFill: {
        height: '100%',
        backgroundColor: '#FF4D67',
    },
    uploadPercentage: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    uploadMessage: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
    },
});