// src/screens/post/CameraScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Platform,
    Alert,
    Dimensions,
    ActivityIndicator,
    BackHandler
} from 'react-native';
import { CameraView, Camera, FlashMode  } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    X,
    Music,
    Camera as CameraIcon,
    Filter,
    Sparkles,
    MessageCircle,
    Zap,
    Upload,
    AlignJustify,
    Image as ImageIcon
} from 'lucide-react-native';
import { useCameraPermissions } from '@/hooks/useCameraPermissions';
import { usePostingStore } from '@/stores/postingStore';
import { useToast } from '@/hooks/useToast';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
    const router = useRouter();
    const toast = useToast();

    // Get permissions using custom hook
    const {
        hasPermissions,
        isLoading: permissionsLoading,
        requestPermissions
    } = useCameraPermissions();

    // Get state from posting store
    const { addMedia, resetMedia } = usePostingStore();

    // Camera states
    const [cameraType, setCameraType] = useState('back');
    // const [flashMode, setFlashMode] = useState('off');
    const [flashMode, setFlashMode] = useState('off');
    const [mode, setMode] = useState('photo'); 
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [cameraReady, setCameraReady] = useState(false);
    const [processingCapture, setProcessingCapture] = useState(false);

    // Refs
    const cameraRef = useRef(null);
    const recordingTimerRef = useRef(null);

    // Reset the post creation flow when component mounts
    useEffect(() => {
        resetMedia();
    }, []);

    // Handle Android back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (isRecording) {
                stopRecording();
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [isRecording]);

    // Handle recording timer
    useEffect(() => {
        if (isRecording) {
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    // Auto-stop recording at 60 seconds
                    if (prev >= 60) {
                        stopRecording();
                        return 0;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            setRecordingTime(0);
        }

        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, [isRecording]);

    // Camera functions
    const takePicture = async () => {
        if (!cameraReady || !cameraRef.current) {
            toast.show("Camera not ready", "Please wait for the camera to initialize");
            return;
        }

        try {
            setProcessingCapture(true);

            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
                skipProcessing: false,
                exif: true,
            });

            // Save to temporary directory instead of media library
            const timestamp = new Date().getTime();
            const fileName = `photo_${timestamp}.jpg`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

            await FileSystem.copyAsync({
                from: photo.uri,
                to: fileUri
            });

            // Add to posting store
            addMedia({
                uri: fileUri,
                type: 'photo',
                width: photo.width,
                height: photo.height,
                size: await getFileSize(fileUri),
                timestamp: timestamp
            });

            // Navigate to edit screen
            router.push('/post/edit');
        } catch (error) {
            console.error("Error taking picture:", error);
            toast.show("Error", "Failed to take picture: " + error.message);
        } finally {
            setProcessingCapture(false);
        }
    };

    const startRecording = async () => {
        if (!cameraReady || !cameraRef.current) {
            toast.show("Camera not ready", "Please wait for the camera to initialize");
            return;
        }

        try {
            setIsRecording(true);

            const videoOptions = {
                maxDuration: 60,
                quality: '720p',
                mute: false,
                videoBitrate: 5000000,
            };

            cameraRef.current.recordAsync(videoOptions)
                .then(async (video) => {
                    // Only runs after stopRecording is called
                    const timestamp = new Date().getTime();
                    const fileName = `video_${timestamp}.mp4`;
                    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

                    await FileSystem.copyAsync({
                        from: video.uri,
                        to: fileUri
                    });

                    // Add to posting store
                    addMedia({
                        uri: fileUri,
                        type: 'video',
                        width: video.width,
                        height: video.height,
                        size: await getFileSize(fileUri),
                        duration: video.duration,
                        timestamp: timestamp
                    });

                    // Navigate to edit screen
                    router.push('/post/edit');
                })
                .catch(error => {
                    console.error("Error processing recording:", error);
                    toast.show("Error", "Failed to process video: " + error.message);
                });
        } catch (error) {
            console.error("Error starting recording:", error);
            toast.show("Error", "Failed to record video: " + error.message);
            setIsRecording(false);
        }
    };

    const stopRecording = useCallback(() => {
        if (!cameraRef.current || !isRecording) return;

        try {
            setProcessingCapture(true);
            cameraRef.current.stopRecording();
            setIsRecording(false);
        } catch (error) {
            console.error("Error stopping recording:", error);
            toast.show("Error", "Failed to stop recording: " + error.message);
        }
    }, [isRecording, cameraRef.current]);

    // Helper function to get file size
    const getFileSize = async (fileUri) => {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        return fileInfo.size;
    };

    // Handle capture button press
    const handleCapture = () => {
        if (processingCapture) return;

        if (mode === 'photo') {
            takePicture();
        } else {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        }
    };

    // Go to gallery screen
    const handleGalleryPress = () => {
        router.push('/post/media-select');
    };

    // Toggle functions
    const toggleCameraType = () => {
        setCameraType(cameraType === 'back' ? 'front' : 'back');
    };

    const toggleFlashMode = () => {
        setFlashMode(flashMode === 'off' ? 'on' : 'off');
    };

    // Format recording time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Loading screen
    if (permissionsLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#FF4A76" />
                <Text style={styles.text}>Checking permissions...</Text>
            </View>
        );
    }

    // Permission check screens
    if (!hasPermissions) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Camera permissions required</Text>
                <Text style={styles.subtext}>
                    This app needs access to your camera to take photos and videos.
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestPermissions}
                >
                    <Text style={styles.permissionButtonText}>Grant Permissions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.permissionButton, { backgroundColor: '#333' }]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.permissionButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Main camera screen
    return (
        <SafeAreaView style={{flex : 1}}>
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Camera View */}
            <CameraView
                style={styles.camera}
                facing={cameraType}
                flash={flashMode}
                onCameraReady={() => setCameraReady(true)}
                mode={mode}
                mirror={false}
                ref={cameraRef}
            />

            {/* UI Layer (all positioned absolutely over the camera) */}
            <View style={StyleSheet.absoluteFill}>
                <View style={styles.cameraControlsContainer}>
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => router.back()}
                    >
                        <X size={20} color="white" />
                    </TouchableOpacity>

                    {/* Sound Button */}
                    <TouchableOpacity style={styles.soundButton}>
                        <Music size={16} color="white" style={{ marginRight: 6 }} />
                        <Text style={styles.soundButtonText}>Add Sound</Text>
                    </TouchableOpacity>

                    {/* Right Side Camera Controls */}
                    <View style={styles.rightControls}>
                        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
                            <CameraIcon size={24} color="white" />
                            <Text style={styles.controlText}>Camera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.controlButton}>
                            <Filter size={24} color="white" />
                            <Text style={styles.controlText}>Filters</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.controlButton}>
                            <Sparkles size={24} color="white" />
                            <Text style={styles.controlText}>Beauty</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.controlButton}>
                            <MessageCircle size={24} color="white" />
                            <Text style={styles.controlText}>Reply</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.controlButton} onPress={toggleFlashMode}>
                            <Zap size={24} color="white" />
                            <Text style={styles.controlText}>Flash</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recording Timer */}
                {isRecording && (
                    <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                    </View>
                )}

                {/* Photo/Video Mode Selection */}
                <View style={styles.modeSelectionContainer}>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'photo' && styles.activeMode]}
                        onPress={() => {
                            if (!isRecording) {
                                setMode('photo');
                            }
                        }}
                    >
                        <Text style={[styles.modeText, mode === 'photo' && styles.activeModeText]}>Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'video' && styles.activeMode]}
                        onPress={() => {
                            if (!isRecording) {
                                setMode('video');
                            }
                        }}
                    >
                        <Text style={[styles.modeText, mode === 'video' && styles.activeModeText]}>Video</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    <TouchableOpacity style={styles.bottomButton} onPress={handleGalleryPress}>
                        <ImageIcon size={26} color="white" />
                        <Text style={styles.bottomButtonText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            isRecording && styles.recordingButton,
                            processingCapture && styles.disabledButton
                        ]}
                        onPress={handleCapture}
                        disabled={processingCapture}
                    >
                        {isRecording ? (
                            <View style={styles.stopRecordingButton} />
                        ) : (
                            <LinearGradient
                                // colors={['#FF8395', '#FF4D67']}
                                colors={['#666666', '#1E4A72']}
                                locations={[0, 1]}
                                start={{ x: 0, y: 0.8 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.captureButtonInner}
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.bottomButton}>
                        <AlignJustify size={26} color="white" />
                        <Text style={styles.bottomButtonText}>Effects</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Tab Bar */}
                <View style={styles.bottomTabArea}>
                    <View style={styles.tabBar}>
                        <TouchableOpacity style={styles.tabButton}>
                            <Text style={styles.tabText}>Camera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.tabButton}>
                            <Text style={styles.tabTextActive}>Quick</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.tabButton}>
                            <Text style={styles.tabText}>Template</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Processing Overlay */}
                {processingCapture && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#FF4A76" />
                        <Text style={styles.processingText}>Processing...</Text>
                    </View>
                )}
            </View>
        </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    cameraControlsContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 50 : 0,
    },
    text: {
        color: 'white',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtext: {
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
        marginHorizontal: 30,
    },
    permissionButton: {
        backgroundColor: '#FF4A76',
        padding: 16,
        borderRadius: 12,
        margin: 20,
        alignItems: 'center',
        width: 250,
    },
    permissionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // Close button
    closeButton: {
        position: 'absolute',
        left: 20,
        top: 50,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },

    // Sound button
    soundButton: {
        position: 'absolute',
        right: 20,
        top: 50,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    soundButtonText: {
        color: 'white',
        fontSize: 14,
    },

    // Right side camera controls
    rightControls: {
        position: 'absolute',
        right: 20,
        top: 100,
        alignItems: 'center',
    },
    controlButton: {
        alignItems: 'center',
        marginBottom: 26,
    },
    controlText: {
        color: 'white',
        fontSize: 12,
        marginTop: 5,
    },

    // Recording indicator
    recordingIndicator: {
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    recordingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF4A76',
        marginRight: 8,
    },
    recordingTime: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Bottom action buttons
    bottomControls: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    bottomButton: {
        alignItems: 'center',
    },
    bottomButtonText: {
        color: 'white',
        fontSize: 13,
        marginTop: 8,
    },
    captureButton: {
        width: 75,
        height: 75,
        borderRadius: 37.5,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: 'white',
    },
    captureButtonInner: {
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: '#1E4A72',
    },
    recordingButton: {
        backgroundColor: '#FF4A76',
    },
    stopRecordingButton: {
        width: 30,
        height: 30,
        borderRadius: 5,
        backgroundColor: 'white',
    },
    disabledButton: {
        opacity: 0.5,
    },

    // Photo/Video mode selection
    modeSelectionContainer: {
        position: 'absolute',
        bottom: 160,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    modeButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
        marginHorizontal: 5,
    },
    activeMode: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modeText: {
        color: '#AAAAAA',
        fontSize: 16,
    },
    activeModeText: {
        color: 'white',
        fontWeight: 'bold',
    },

    // Bottom tab bar
    bottomTabArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        height: 50,
        alignItems: 'center',
        paddingBottom: 20,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        color: '#666666',
        fontSize: 15,
    },
    tabTextActive: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },

    // Processing overlay
    processingOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 16,
    },
});