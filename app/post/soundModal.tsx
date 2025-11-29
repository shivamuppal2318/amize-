import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import axios, { AxiosError } from 'axios';
import { Search, Play, Pause } from 'lucide-react-native';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

// ==================== TYPE DEFINITIONS ====================
interface Sound {
  id: string;
  title: string;
  artistName: string | null;
  soundUrl: string;
  duration: number;
  isOriginal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface SoundsApiResponse {
  success: boolean;
  sounds: Sound[];
  pagination: Pagination;
}

interface SoundModalProps {
  visible?: boolean;
  onClose?: () => void;
  onSelectSound?: (sound: Sound) => void;
  setSelectedSongId?: (id: string) => void;
  setPostSong?: (audio: string) => void;
}

export default function SoundModal({
  visible: externalVisible,
  onClose,
  onSelectSound,
  setSelectedSongId,
  setPostSong
}: SoundModalProps = {}) {
  const [internalVisible, setInternalVisible] = useState<boolean>(false);
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // ==================== AUDIO PLAYBACK STATE ====================
  const [playingSound, setPlayingSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null); // Track which sound is loading
  const soundObject = useRef<Audio.Sound | null>(null);
  const isLoadingAudio = useRef<boolean>(false); // Prevent double loading

  const visible = externalVisible !== undefined ? externalVisible : internalVisible;
  const handleClose = onClose || (() => setInternalVisible(false));

  // ==================== AUDIO SETUP ====================
  /**
   * Set audio mode when component mounts
   * @testing - Testing audio configuration
   */
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        console.log('🔊 Audio mode configured successfully');
      } catch (error) {
        console.error('❌ Error setting audio mode:', error);
      }
    };
    
    setupAudio();

    // Cleanup on unmount
    return () => {
      stopAndUnloadSound();
    };
  }, []);

  // ==================== CLEANUP AUDIO ON MODAL CLOSE ====================
  /**
   * Stop and unload audio when modal closes
   * @testing - Testing cleanup on modal close
   */
  useEffect(() => {
    if (!visible) {
      console.log('🔄 Modal closing, cleaning up audio...');
      stopAndUnloadSound();
      setPlayingSound(null);
      setIsPlaying(false);
      setLoadingAudio(null);
    }
  }, [visible]);

  // ==================== AUDIO PLAYBACK FUNCTIONS ====================
  /**
   * Stops current audio and unloads it from memory
   * Prevents memory leaks and ensures clean state
   * @testing - Testing audio cleanup
   */
  const stopAndUnloadSound = async () => {
    try {
      if (soundObject.current) {
        console.log('⏹️ Stopping and unloading current sound');
        const status = await soundObject.current.getStatusAsync();
        
        if (status.isLoaded) {
          await soundObject.current.stopAsync();
          await soundObject.current.unloadAsync();
        }
        
        soundObject.current = null;
        isLoadingAudio.current = false;
      }
    } catch (error) {
      console.error('❌ Error stopping sound:', error);
      soundObject.current = null;
      isLoadingAudio.current = false;
    }
  };

  /**
   * Plays a sound from URL with loading state
   * Prevents multiple simultaneous loads
   * @testing - Testing sound playback with loading state
   */
  const playSound = async (sound: Sound) => {
    // Prevent multiple simultaneous audio loads
    if (isLoadingAudio.current) {
      console.log('⚠️ Audio already loading, ignoring request');
      return;
    }

    try {
      console.log('🎵 Attempting to play sound:', sound.title, '| ID:', sound.id);
      
      // Set loading state
      isLoadingAudio.current = true;
      setLoadingAudio(sound.id);
      setIsPlaying(false);

      // Stop current sound if playing
      await stopAndUnloadSound();

      console.log('📥 Loading audio from URL:', sound.soundUrl);

      // Create and load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: sound.soundUrl },
        { 
          shouldPlay: true, 
          isLooping: true,
          volume: 1.0,
        },
        onPlaybackStatusUpdate
      );

      soundObject.current = newSound;
      setPlayingSound(sound);
      setIsPlaying(true);
      setLoadingAudio(null);
      isLoadingAudio.current = false;

      console.log('✅ Sound loaded and playing successfully | ID:', sound.id);
    } catch (error) {
      console.error('❌ Error playing sound:', error);
      console.error('Failed sound URL:', sound.soundUrl);
      
      setLoadingAudio(null);
      isLoadingAudio.current = false;
      setPlayingSound(null);
      setIsPlaying(false);
      
      Alert.alert(
        'Playback Error',
        `Unable to play "${sound.title}". The audio file may be unavailable.`,
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Pauses currently playing sound
   * @testing - Testing pause functionality
   */
  const pauseSound = async () => {
    try {
      if (soundObject.current) {
        console.log('⏸️ Pausing sound');
        await soundObject.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('❌ Error pausing sound:', error);
    }
  };

  /**
   * Resumes paused sound
   * @testing - Testing resume functionality
   */
  const resumeSound = async () => {
    try {
      if (soundObject.current) {
        console.log('▶️ Resuming sound');
        await soundObject.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('❌ Error resuming sound:', error);
    }
  };

  /**
   * Handles playback status updates
   * @testing - Testing playback monitoring
   */
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      
      // If sound finished playing (not looping)
      if (status.didJustFinish && !status.isLooping) {
        console.log('🔚 Sound finished playing');
        setIsPlaying(false);
      }

      // Log buffering status
      if (status.isBuffering) {
        console.log('⏳ Audio buffering...');
      }
    } else if (status.error) {
      console.error('❌ Playback error:', status.error);
      setLoadingAudio(null);
      isLoadingAudio.current = false;
    }
  };

  // ==================== API CALL ====================
  const fetchSounds = async (): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      const response = await axios.get<SoundsApiResponse>(
        'https://amize-next.onrender.com/api/sound',
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.success) {
        if (Array.isArray(response.data.sounds)) {
          setSounds(response.data.sounds);
          console.log('✅ Sounds fetched successfully:', response.data.sounds.length);
        } else {
          throw new Error('Invalid response format: sounds is not an array');
        }
      } else {
        throw new Error('API returned success: false');
      }
    } catch (err) {
      console.error('❌ Error fetching sounds:', err);
      
      let errorMessage = 'Failed to load sounds. Please try again.';

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        
        if (axiosError.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Please check your connection.';
        } else if (axiosError.response) {
          errorMessage = `Server error: ${axiosError.response.status}`;
        } else if (axiosError.request) {
          errorMessage = 'No response from server. Please check your internet.';
        }
      }

      setError(errorMessage);
      
      Alert.alert(
        'Error Loading Sounds',
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: fetchSounds },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      console.log('🔄 Modal opened, fetching sounds...');
      fetchSounds();
    } else {
      setSearchQuery('');
      setError(null);
    }
  }, [visible]);

  const formatDuration = (seconds: number | undefined | null): string => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSounds: Sound[] = sounds.filter((sound) => {
    if (!sound || !sound.title) return false;

    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;

    const titleMatch = sound.title.toLowerCase().includes(searchLower);
    const artistMatch = sound.artistName?.toLowerCase().includes(searchLower) ?? false;

    return titleMatch || artistMatch;
  });

  //  Handles sound selection - Selects sound WITHOUT playing
  const handleSoundSelect = (sound: Sound): void => {
    console.log('✅ Sound selected | Title:', sound.title, '| ID:', sound.id);
    setSelectedSound(sound);
  };

    // Toggles play/pause for a sound
  const handlePlayPauseToggle = async (sound: Sound): Promise<void> => {
    // Don't allow interaction while loading
    if (loadingAudio) {
      console.log('⚠️ Audio is loading, please wait');
      return;
    }

    console.log('🎛️ Play/Pause toggled for:', sound.title, '| ID:', sound.id);

    // If same sound is playing, pause it
    if (playingSound?.id === sound.id && isPlaying) {
      console.log('⏸️ Pausing current sound');
      await pauseSound();
    } 
    // If same sound is paused, resume it
    else if (playingSound?.id === sound.id && !isPlaying) {
      console.log('▶️ Resuming current sound');
      await resumeSound();
    } 
    // If different sound, play new one
    else {
      console.log('🔄 Switching to new sound');
      await playSound(sound);
    }
  };

  /**
   * Handles done button press
   * @testing - Testing selection confirmation
   */
  const handleDone = async (): Promise<void> => {
    if (selectedSound) {
      // console.log('✅ Confirming selection | Title:', selectedSound.title, '| ID:', selectedSound.id);
      // @ts-ignore
      setSelectedSongId(selectedSound?.id);
      // @ts-ignore
      setPostSong(selectedSound?.soundUrl);


      if (onSelectSound) {
        onSelectSound(selectedSound);
      }
      
      // Stop sound before closing
      await stopAndUnloadSound();
      handleClose();
      
      setTimeout(() => {
        setSelectedSound(null);
        setPlayingSound(null);
        setIsPlaying(false);
      }, 300);
    }
  };

  /**
   * Renders individual sound item
   * @testing - Testing list rendering with loading states
   */
  const renderSoundItem = ({ item }: { item: Sound }) => {
    if (!item || !item.id) {
      console.warn('⚠️ Invalid sound item:', item);
      return null;
    }

    const isSelected = selectedSound?.id === item.id;
    const isCurrentlyPlaying = playingSound?.id === item.id && isPlaying;
    const isLoadingThisSound = loadingAudio === item.id;
    const isAnyAudioLoading = loadingAudio !== null;

    return (
      <TouchableOpacity
        style={[
          styles.soundItem,
          isSelected && styles.selectedItem
        ]}
        onPress={() => handleSoundSelect(item)}
        activeOpacity={0.7}
        disabled={isAnyAudioLoading} // Disable selection while audio is loading
      >
        {/* Play/Pause Button */}
        <TouchableOpacity
          onPress={() => handlePlayPauseToggle(item)}
          style={[
            styles.playPauseButton,
            (isAnyAudioLoading && !isLoadingThisSound) && styles.disabledPlayButton
          ]}
          disabled={isAnyAudioLoading && !isLoadingThisSound} // Disable other buttons while loading
        >
          {isLoadingThisSound ? (
            // Show loading spinner while audio is loading
            <ActivityIndicator size="small" color="#0095f6" />
          ) : isCurrentlyPlaying ? (
            <Pause size={20} color="#0095f6" fill="#0095f6" />
          ) : (
            <Play size={20} color="#0095f6" fill="#0095f6" />
          )}
        </TouchableOpacity>
        
        {/* Sound Wave Icon */}
        <View style={[
          styles.soundWaveIcon,
          isCurrentlyPlaying && styles.playingWaveIcon
        ]}>
          <View style={[
            styles.waveBar,
            isCurrentlyPlaying && styles.animatedWaveBar
          ]} />
          <View style={[
            styles.waveBar,
            styles.waveBar2,
            isCurrentlyPlaying && styles.animatedWaveBar
          ]} />
          <View style={[
            styles.waveBar,
            styles.waveBar3,
            isCurrentlyPlaying && styles.animatedWaveBar
          ]} />
          <View style={[
            styles.waveBar,
            styles.waveBar2,
            isCurrentlyPlaying && styles.animatedWaveBar
          ]} />
        </View>
        
        <View style={styles.soundInfo}>
          <Text style={[
            styles.soundTitle,
            (isAnyAudioLoading && !isLoadingThisSound) && styles.disabledText
          ]} numberOfLines={1}>
            {item.title || 'Untitled'}
          </Text>
          <Text style={[
            styles.artistName,
            (isAnyAudioLoading && !isLoadingThisSound) && styles.disabledText
          ]} numberOfLines={1}>
            {item.artistName || 'Unknown Artist'}
          </Text>
        </View>
        
        <View style={styles.soundMeta}>
          <Text style={[
            styles.duration,
            (isAnyAudioLoading && !isLoadingThisSound) && styles.disabledText
          ]}>
            {formatDuration(item.duration)}
          </Text>
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const keyExtractor = (item: Sound, index: number): string => {
    return item?.id || `sound-${index}`;
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={async () => {
          await stopAndUnloadSound();
          handleClose();
        }}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={async () => {
                  await stopAndUnloadSound();
                  handleClose();
                }}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Sound</Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleDone}
                disabled={!selectedSound}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[
                  styles.doneButtonText,
                  !selectedSound && styles.doneButtonDisabled
                ]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={18} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search sounds..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Content Area */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0095f6" />
                <Text style={styles.loadingText}>Loading sounds...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchSounds}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filteredSounds}
                renderItem={renderSoundItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyText}>
                      {searchQuery ? 'No sounds found' : 'No sounds available'}
                    </Text>
                    {searchQuery && (
                      <Text style={styles.emptySubtext}>
                        Try adjusting your search
                      </Text>
                    )}
                  </View>
                }
              />
            )}

            {/* Selected Sound Preview with Playback Info */}
            {selectedSound && !loading && (
              <View style={styles.selectedPreview}>
                <View style={styles.previewContent}>
                  {playingSound?.id === selectedSound.id && isPlaying && (
                    <View style={styles.nowPlayingIndicator}>
                      <Text style={styles.nowPlayingDot}>●</Text>
                    </View>
                  )}
                  <Text style={styles.previewLabel}>
                    {isPlaying && playingSound?.id === selectedSound.id ? 'Now Playing:' : 'Selected:'}
                  </Text>
                  <Text style={styles.previewTitle} numberOfLines={1}>
                    {selectedSound.title}
                  </Text>
                  <Text style={styles.previewDuration}>
                    {formatDuration(selectedSound.duration)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.85,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  doneButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  doneButtonText: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButtonDisabled: {
    opacity: 0.4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "center",
    backgroundColor: '#2a2a2a',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 10,
  },
  clearIcon: {
    color: '#888',
    fontSize: 18,
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  selectedItem: {
    backgroundColor: 'rgba(0, 149, 246, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  playPauseButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(0, 149, 246, 0.15)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  disabledPlayButton: {
    opacity: 0.3,
  },
  soundWaveIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 36,
    height: 36,
    backgroundColor: '#333',
    borderRadius: 18,
    justifyContent: 'center',
    gap: 2,
    marginRight: 12,
  },
  playingWaveIcon: {
    backgroundColor: 'rgba(0, 149, 246, 0.2)',
  },
  waveBar: {
    width: 2,
    height: 12,
    backgroundColor: '#0095f6',
    borderRadius: 1,
  },
  waveBar2: {
    height: 16,
  },
  waveBar3: {
    height: 8,
  },
  animatedWaveBar: {
    backgroundColor: '#00d4ff',
  },
  soundInfo: {
    flex: 1,
    marginRight: 12,
  },
  soundTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  artistName: {
    color: '#888',
    fontSize: 13,
  },
  disabledText: {
    opacity: 0.4,
  },
  soundMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  duration: {
    color: '#888',
    fontSize: 13,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  selectedPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPlayingIndicator: {
    marginRight: 8,
  },
  nowPlayingDot: {
    color: '#0095f6',
    fontSize: 20,
  },
  previewLabel: {
    color: '#888',
    fontSize: 13,
    marginRight: 8,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  previewDuration: {
    color: '#0095f6',
    fontSize: 13,
    fontWeight: '600',
  },
});