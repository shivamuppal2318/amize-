// components/profile/PhotoOptionsModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CustomModal } from '@/components/ui/CustomModal';
import { Camera, Image, Trash2 } from 'lucide-react-native';

interface PhotoOptionsModalProps {
    visible: boolean;
    onCamera: () => void;
    onLibrary: () => void;
    onRemove?: () => void;
    onClose: () => void;
    hasPhoto?: boolean;
}

export const PhotoOptionsModal: React.FC<PhotoOptionsModalProps> = ({
                                                                        visible,
                                                                        onCamera,
                                                                        onLibrary,
                                                                        onRemove,
                                                                        onClose,
                                                                        hasPhoto = false,
                                                                    }) => {
    const handleCamera = () => {
        onCamera();
        onClose();
    };

    const handleLibrary = () => {
        onLibrary();
        onClose();
    };

    const handleRemove = () => {
        if (onRemove) {
            onRemove();
        }
        onClose();
    };

    return (
        <CustomModal
            visible={visible}
            onClose={onClose}
            title="Profile Photo"
            panGestureEnabled={true}
        >
            <View style={{ paddingVertical: 20, gap: 16 }}>
                <Text style={{
                    color: '#9CA3AF',
                    fontSize: 16,
                    textAlign: 'center',
                    marginBottom: 8,
                    fontFamily: 'Figtree',
                }}>
                    Choose how you'd like to update your profile photo
                </Text>

                {/* Camera Option */}
                <TouchableOpacity
                    onPress={handleCamera}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        // backgroundColor: 'rgba(26, 26, 46, 0.8)',
                        backgroundColor: '#1A4063',                      
                        borderWidth: 1,
                        // borderColor: 'rgba(75,85,99,0.2)',
                        borderColor: '#16344F',
                        borderRadius: 16,
                        padding: 20,
                    }}
                    activeOpacity={0.8}
                >
                    <View style={{
                        backgroundColor: 'rgba(255, 90, 95, 0.2)',
                        borderRadius: 12,
                        padding: 12,
                        marginRight: 16,
                    }}>
                        <Camera size={24} color="#eee" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            color: '#F3F4F6',
                            fontSize: 18,
                            fontWeight: '600',
                            marginBottom: 4,
                            fontFamily: 'Figtree',
                        }}>
                            Take Photo
                        </Text>
                        <Text style={{
                            color: '#9CA3AF',
                            fontSize: 14,
                            fontFamily: 'Figtree',
                        }}>
                            Use your camera to take a new photo
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Photo Library Option */}
                <TouchableOpacity
                    onPress={handleLibrary}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        // backgroundColor: 'rgba(26, 26, 46, 0.8)',
                        backgroundColor: '#1A4063',
                        borderWidth: 1,
                        // borderColor: 'rgba(75,85,99,0.2)',
                        borderColor: '#16344F',
                        borderRadius: 16,
                        padding: 20,
                    }}
                    activeOpacity={0.8}
                >
                    <View style={{
                        backgroundColor: 'rgba(255, 90, 95, 0.2)',
                        borderRadius: 12,
                        padding: 12,
                        marginRight: 16,
                    }}>
                        <Image size={24} color="#eee" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            color: '#F3F4F6',
                            fontSize: 18,
                            fontWeight: '600',
                            marginBottom: 4,
                            fontFamily: 'Figtree',
                        }}>
                            Choose from Library
                        </Text>
                        <Text style={{
                            color: '#9CA3AF',
                            fontSize: 14,
                            fontFamily: 'Figtree',
                        }}>
                            Select an existing photo from your gallery
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Remove Photo Option (only show if user has a photo) */}
                {hasPhoto && onRemove && (
                    <TouchableOpacity
                        onPress={handleRemove}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 1,
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            borderRadius: 16,
                            padding: 20,
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            borderRadius: 12,
                            padding: 12,
                            marginRight: 16,
                        }}>
                            <Trash2 size={24} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                color: '#EF4444',
                                fontSize: 18,
                                fontWeight: '600',
                                marginBottom: 4,
                                fontFamily: 'Figtree',
                            }}>
                                Remove Photo
                            </Text>
                            <Text style={{
                                color: '#F87171',
                                fontSize: 14,
                                fontFamily: 'Figtree',
                            }}>
                                Delete your current profile photo
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Info Text */}
                <View style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 8,
                }}>
                    <Text style={{
                        color: '#93C5FD',
                        fontSize: 14,
                        textAlign: 'center',
                        lineHeight: 20,
                        fontFamily: 'Figtree',
                    }}>
                        For best results, use a square image that's at least 400x400 pixels.
                        Supported formats: JPEG, PNG, GIF, WEBP (max 5MB)
                    </Text>
                </View>
            </View>
        </CustomModal>
    );
};