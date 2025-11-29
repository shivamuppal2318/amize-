import React, { useState, useRef, useEffect, useCallback } from "react";
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
  BackHandler,
  ScrollView,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Music,
  Camera as CameraIcon,
  Filter,
  Sparkles,
  MessageCircle,
  Zap,
  AlignJustify,
  Image as ImageIcon,
  ZapOff,
  Play,
  Pause,
} from "lucide-react-native";
import { Audio } from "expo-av";
import { useCameraPermissions } from "@/hooks/useCameraPermissions";
import { usePostingStore } from "@/stores/postingStore";
import { useToast } from "@/hooks/useToast";
import { SafeAreaView } from "react-native-safe-area-context";
import SoundModal from "./soundModal";
import { Sound } from "@/types/addSound";
// import ARCameraView from './ARCameraView';

const { width, height } = Dimensions.get("window");

export default function CameraScreen() {
  const router = useRouter();
  const toast = useToast();

  const {
    hasPermissions,
    isLoading: permissionsLoading,
    requestPermissions,
  } = useCameraPermissions();
  const { addMedia, resetMedia } = usePostingStore();

  const [cameraType, setCameraType] = useState<"front" | "back">("back");
  const [flashMode, setFlashMode] = useState<"off" | "on">("off");
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [processingCapture, setProcessingCapture] = useState(false);

  const [soundVisibleModel, setSoundVisibleModel] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<any>();
  const [postSong, setPostSong] = useState<String>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  console.log("Selected Song Id Parnent: ", postSong);

  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<
    | "none"
    | "sepia"
    | "grayscale"
    | "cool"
    | "warm"
    | "vintage"
    | "teal"
    | "pink"
    | "purple"
    | "orange"
  >("none");

  const filters: { name: string; color: string }[] = [
    { name: "none", color: "transparent" },
    { name: "sepia", color: "rgba(112, 66, 20, 0.3)" },
    { name: "grayscale", color: "rgba(255, 255, 255, 0.5)" },
    { name: "cool", color: "rgba(0, 128, 255, 0.2)" },
    { name: "warm", color: "rgba(255, 100, 0, 0.2)" },
    { name: "vintage", color: "rgba(120, 50, 100, 0.2)" },
    { name: "teal", color: "rgba(0, 128, 128, 0.3)" },
    { name: "pink", color: "rgba(255, 0, 128, 0.2)" },
    { name: "purple", color: "rgba(128, 0, 255, 0.2)" },
    { name: "orange", color: "rgba(255, 128, 0, 0.2)" },
  ];

  const toggleFilterMenu = () => setShowFilters((prev) => !prev);

  const cameraRef = useRef<Camera | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    resetMedia();
    setupAudio();
    return () => {
      cleanupAudio();
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error("Error setting up audio:", error);
    }
  };

  const cleanupAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error("Error cleaning up audio:", error);
    }
  };

  useEffect(() => {
    if (postSong) {
      loadAndPlaySound(postSong as string);
    }
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
      }
    };
  }, [postSong]);

  const loadAndPlaySound = async (uri: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      console.error("Error loading sound:", error);
      toast.show("Error", "Failed to load sound");
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  const pauseMusic = async () => {
    if (soundRef.current && isPlaying) {
      try {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error("Error pausing music:", error);
      }
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isRecording) {
          stopRecording();
          return true;
        }
        return false;
      }
    );
    return () => backHandler.remove();
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
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
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const getFileSize = async (fileUri: string) => {
    const info = await FileSystem.getInfoAsync(fileUri);
    return info.size;
  };

  const getFilterColor = (filterName: string) => {
    switch (filterName) {
      case "sepia":
        return "rgba(112, 66, 20, 0.3)";
      case "grayscale":
        return "rgba(255, 255, 255, 0.5)";
      case "cool":
        return "rgba(0, 128, 255, 0.2)";
      default:
        return "transparent";
    }
  };

  const applyFilterToPhoto = async (uri: string, filter: string) => {
    switch (filter) {
      case "sepia":
        return await ImageManipulator.manipulateAsync(uri, [], {
          format: ImageManipulator.SaveFormat.JPEG,
        });
      case "grayscale":
        return await ImageManipulator.manipulateAsync(uri, [], {
          format: ImageManipulator.SaveFormat.JPEG,
        });
      case "cool":
        return await ImageManipulator.manipulateAsync(uri, [], {
          format: ImageManipulator.SaveFormat.JPEG,
        });
      default:
        return { uri };
    }
  };

  const takePicture = async () => {
    if (!cameraReady || !cameraRef.current) {
      toast.show(
        "Camera not ready",
        "Please wait for the camera to initialize"
      );
      return;
    }
    try {
      await pauseMusic();
      setProcessingCapture(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
        exif: true,
      });

      const filteredPhoto =
        filter !== "none" ? await applyFilterToPhoto(photo.uri, filter) : photo;

      const timestamp = new Date().getTime();
      const fileName = `photo_${timestamp}.jpg`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: filteredPhoto.uri, to: fileUri });

      addMedia({
        uri: fileUri,
        type: "photo",
        width: photo.width,
        height: photo.height,
        size: await getFileSize(fileUri),
        timestamp,
      });

      router.push("/post/edit");
    } catch (error: any) {
      console.error("Error taking picture:", error);
      toast.show("Error", "Failed to take picture: " + error.message);
    } finally {
      setProcessingCapture(false);
    }
  };

  const startRecording = async () => {
    if (!cameraReady || !cameraRef.current) {
      toast.show(
        "Camera not ready",
        "Please wait for the camera to initialize"
      );
      return;
    }
    try {
      await pauseMusic();
      setIsRecording(true);
      cameraRef.current
        .recordAsync({
          maxDuration: 60,
          quality: "720p",
          mute: false,
          videoBitrate: 5000000,
        })
        .then(async (video) => {
          const timestamp = new Date().getTime();
          const fileName = `video_${timestamp}.mp4`;
          const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
          await FileSystem.copyAsync({ from: video.uri, to: fileUri });
          addMedia({
            uri: fileUri,
            type: "video",
            width: video.width,
            height: video.height,
            size: await getFileSize(fileUri),
            duration: video.duration,
            timestamp,
          });
          router.push("/post/edit");
        })
        .catch((error) => {
          console.error("Error processing recording:", error);
          toast.show("Error", "Failed to process video: " + error.message);
        });
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Error stopping recording:", error);
      toast.show("Error", "Failed to stop recording: " + error.message);
    }
  }, [isRecording]);

  const handleCapture = () => {
    if (processingCapture) return;
    if (mode === "photo") takePicture();
    else if (isRecording) stopRecording();
    else startRecording();
  };

  const handleGalleryPress = () => router.push("/post/media-select");
  const toggleCameraType = () =>
    setCameraType((prev) => (prev === "back" ? "front" : "back"));
  const toggleFlashMode = () =>
    setFlashMode((prev) => (prev === "off" ? "on" : "off"));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSoundSelect = (sound: Sound) => {
    console.log("🎵 Sound selected in camera:", sound);
    toast.show(
      "Sound Added",
      `${sound.title} by ${sound.artistName || "Unknown Artist"}`
    );
    setSoundVisibleModel(false);
  };

  if (permissionsLoading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF4A76" />
        <Text style={styles.text}>Checking permissions...</Text>
      </View>
    );

  if (!hasPermissions)
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
          style={[styles.permissionButton, { backgroundColor: "#333" }]}
          onPress={() => router.back()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />

        {/* <ARCameraView/> */}

        <CameraView
          style={styles.camera}
          facing={cameraType}
          flash={flashMode}
          onCameraReady={() => setCameraReady(true)}
          mode={mode}
          mirror={false}
          ref={cameraRef}
        />

        {filter !== "none" && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: getFilterColor(filter), opacity: 0.3 },
            ]}
          />
        )}

        <View style={StyleSheet.absoluteFill}>
          <View style={styles.cameraControlsContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.soundButton}
              onPress={() => {
                pauseMusic();
                setSoundVisibleModel(true);
              }}
            >
              <Music size={16} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.soundButtonText}>Add Sound</Text>
            </TouchableOpacity>

            <View style={styles.rightControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleCameraType}
              >
                <CameraIcon size={24} color="white" />
                <Text style={styles.controlText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowFilters((prev) => !prev)}
              >
                <Filter size={24} color={showFilters ? "yellow" : "white"} />
                <Text style={styles.controlText}>Filter</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton}>
                <Sparkles size={24} color="white" />
                <Text style={styles.controlText}>Beauty</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton}>
                <MessageCircle size={24} color="white" />
                <Text style={styles.controlText}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleFlashMode}
              >
                {flashMode === "off" ? (
                  <ZapOff size={24} color="yellow" />
                ) : (
                  <Zap size={24} color="white" />
                )}
                <Text style={styles.controlText}>Flash</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>
                {formatTime(recordingTime)}
              </Text>
            </View>
          )}

          {postSong && (
            <TouchableOpacity
              style={styles.musicPlayerButton}
              onPress={togglePlayPause}
            >
              {isPlaying ? (
                <Pause size={20} color="white" fill="white" />
              ) : (
                <Play size={20} color="white" fill="white" />
              )}
            </TouchableOpacity>
          )}

          <View style={styles.bottomMiddleControls}>
            {showFilters ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                {filters.map((f) => (
                  <TouchableOpacity
                    key={f.name}
                    style={[
                      styles.filterCircle,
                      {
                        backgroundColor: f.color,
                        borderWidth: filter === f.name ? 3 : 0,
                        borderColor: "white",
                      },
                    ]}
                    onPress={() => setFilter(f.name as any)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.modeSelectionContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    mode === "photo" && styles.activeMode,
                  ]}
                  onPress={() => setMode("photo")}
                >
                  <Text
                    style={[
                      styles.modeText,
                      mode === "photo" && styles.activeModeText,
                    ]}
                  >
                    Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    mode === "video" && styles.activeMode,
                  ]}
                  onPress={() => setMode("video")}
                >
                  <Text
                    style={[
                      styles.modeText,
                      mode === "video" && styles.activeModeText,
                    ]}
                  >
                    Video
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={handleGalleryPress}
            >
              <ImageIcon size={26} color="white" />
              <Text style={styles.bottomButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.captureButton,
                isRecording && styles.recordingButton,
                processingCapture && styles.disabledButton,
              ]}
              onPress={handleCapture}
              disabled={processingCapture}
            >
              {isRecording ? (
                <View style={styles.stopRecordingButton} />
              ) : (
                <LinearGradient
                  colors={["#666666", "#1E4A72"]}
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

          {processingCapture && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#FF4A76" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>
      </View>

      <SoundModal
        visible={soundVisibleModel}
        onClose={() => setSoundVisibleModel(false)}
        onSoundSelect={handleSoundSelect}
        setSelectedSongId={setSelectedSongId}
        setPostSong={setPostSong}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraControlsContainer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 0,
  },
  text: {
    color: "white",
    textAlign: "center",
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
  subtext: {
    color: "#999",
    textAlign: "center",
    marginTop: 10,
    marginHorizontal: 30,
  },
  permissionButton: {
    backgroundColor: "#FF4A76",
    padding: 16,
    borderRadius: 12,
    margin: 20,
    alignItems: "center",
    width: 250,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Close button
  closeButton: {
    position: "absolute",
    left: 20,
    top: 50,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // Sound button
  soundButton: {
    position: "absolute",
    right: 20,
    top: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  soundButtonText: {
    color: "white",
    fontSize: 14,
  },

  // Right side camera controls
  rightControls: {
    position: "absolute",
    right: 20,
    top: 100,
    alignItems: "center",
  },
  controlButton: {
    alignItems: "center",
    marginBottom: 26,
  },
  controlText: {
    color: "white",
    fontSize: 12,
    marginTop: 5,
  },

  // Recording indicator
  recordingIndicator: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF4A76",
    marginRight: 8,
  },
  recordingTime: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Bottom action buttons
  bottomControls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  bottomButton: {
    alignItems: "center",
  },
  bottomButtonText: {
    color: "white",
    fontSize: 13,
    marginTop: 8,
  },
  captureButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: "#1E4A72",
  },
  recordingButton: {
    backgroundColor: "#FF4A76",
  },
  stopRecordingButton: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: "white",
  },
  disabledButton: {
    opacity: 0.5,
  },

  // Photo/Video mode selection
  modeSelectionContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  modeButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  activeMode: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modeText: {
    color: "#AAAAAA",
    fontSize: 16,
  },
  activeModeText: {
    color: "white",
    fontWeight: "bold",
  },

  // Bottom tab bar
  bottomTabArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    height: 50,
    alignItems: "center",
    paddingBottom: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    color: "#666666",
    fontSize: 15,
  },
  tabTextActive: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },

  // Processing overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    color: "white",
    fontSize: 16,
    marginTop: 16,
  },
  bottomMiddleControls: {
    position: "absolute",
    bottom: 130,
    width: width,
    alignItems: "center",
  },
  filterScroll: {
    paddingHorizontal: 15,
    bottom: 30,
  },
  filterCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 8,
  },
  musicPlayerButton: {
    position: "absolute",
    left: 20,
    top: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});