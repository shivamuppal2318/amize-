import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    Switch,
    TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Radio, Users, Sparkles, Globe, Lock } from 'lucide-react-native';
import ActionButton from '@/components/shared/UI/ActionButton';
import HeaderBar from '@/components/shared/UI/HeaderBar';
import { ConfigAPI, LiveTransportConfig } from '@/lib/api/configService';
import { isLiveStreamingEnabled } from '@/lib/release/releaseConfig';
import { captureException } from '@/utils/errorReporting';

export default function LiveSetupScreen() {
    const router = useRouter();
    const liveEnabled = isLiveStreamingEnabled();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [enableComments, setEnableComments] = useState(true);
    const [beautyFilterEnabled, setBeautyFilterEnabled] = useState(false);
    const [restrictComments, setRestrictComments] = useState(false);
    const [transportConfig, setTransportConfig] = useState<LiveTransportConfig | null>(null);
    const [loadingTransport, setLoadingTransport] = useState(true);

    const loadTransportConfig = useCallback(async () => {
        setLoadingTransport(true);

        try {
            const config = await ConfigAPI.getLiveTransportConfig();
            setTransportConfig(config);
        } catch (error) {
            captureException(error, {
                tags: { screen: 'live-setup', stage: 'load-transport-config' },
            });
            setTransportConfig(null);
        } finally {
            setLoadingTransport(false);
        }
    }, []);

    useEffect(() => {
        loadTransportConfig();
    }, [loadTransportConfig]);

    const handleBack = () => {
        router.back();
    };

    const handleStartLive = () => {
        if (loadingTransport) {
            return;
        }

        router.push({
            pathname: '/live/streaming',
            params: {
                title: title.trim() || 'Live Session',
                description: description.trim() || 'No description added',
                visibility: isPublic ? 'public' : 'private',
                comments: enableComments ? 'enabled' : 'disabled',
                beauty: beautyFilterEnabled ? 'on' : 'off',
                moderation: restrictComments ? 'restricted' : 'open',
            },
        });
    };

    const liveTransportReady = transportConfig?.configured ?? false;
    const startLabel = liveTransportReady ? 'Start Live Session' : 'Start Live Preview';

    if (!liveEnabled) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />

                <HeaderBar title="Go Live" onBackPress={handleBack} />

                <View style={styles.disabledContainer}>
                    <Radio size={48} color="#555" />
                    <Text style={styles.disabledTitle}>Live is disabled for this build</Text>
                    <Text style={styles.disabledText}>
                        This build keeps live streaming hidden until production transport and review settings are ready.
                    </Text>
                    <ActionButton
                        label="Back to Create"
                        onPress={handleBack}
                        fullWidth
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <HeaderBar title="Go Live" onBackPress={handleBack} />

            <View style={styles.content}>
                <View style={styles.noticeCard}>
                    <Text style={styles.noticeTitle}>Backend-Aware Start</Text>
                    <Text style={styles.noticeText}>
                        {loadingTransport
                            ? 'Checking live transport readiness...'
                            : liveTransportReady
                            ? 'Live transport is configured. This screen will create a backend live session and expose host transport credentials.'
                            : 'Live transport is not configured for production. Starting now will still open the live screen, but it should be treated as preview/fallback mode.'}
                    </Text>
                    {loadingTransport ? (
                        <View style={styles.transportStatusRow}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.transportStatusText}>Loading transport config</Text>
                        </View>
                    ) : transportConfig ? (
                        <View style={styles.transportDetails}>
                            <Text style={styles.transportStatusText}>
                                Provider: {transportConfig.provider}
                            </Text>
                            <Text style={styles.transportStatusText}>
                                Ingest: {transportConfig.ingestProtocol.toUpperCase()} via {transportConfig.ingestUrl}
                            </Text>
                            <Text style={styles.transportStatusText}>
                                Playback: {transportConfig.playbackProtocol.toUpperCase()} via {transportConfig.playbackBaseUrl}
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={loadTransportConfig} disabled={loadingTransport}>
                            <Text style={styles.transportStatusText}>
                                Transport config unavailable. Tap to retry.
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.previewContainer}>
                    <Radio size={48} color="#555" />
                    <Text style={styles.previewText}>Live room preview</Text>
                    <Text style={styles.previewSubtext}>
                        Your stream title and settings will carry into the preview screen.
                    </Text>
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a title to your live stream..."
                            placeholderTextColor="#777"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={80}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="What are you going to talk about?"
                            placeholderTextColor="#777"
                            multiline
                            numberOfLines={4}
                            value={description}
                            onChangeText={setDescription}
                            maxLength={180}
                        />
                    </View>
                </View>

                <View style={styles.settingsContainer}>
                    <Text style={styles.sectionTitle}>Stream Settings</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Globe size={20} color="#FF4D67" />
                            <Text style={styles.settingText}>Public Stream</Text>
                        </View>
                        <Switch
                            value={isPublic}
                            onValueChange={setIsPublic}
                            trackColor={{ false: '#444', true: '#FF4D67' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Users size={20} color="#5A8CFF" />
                            <Text style={styles.settingText}>Allow Comments</Text>
                        </View>
                        <Switch
                            value={enableComments}
                            onValueChange={setEnableComments}
                            trackColor={{ false: '#444', true: '#5A8CFF' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Sparkles size={20} color="#FFB800" />
                            <Text style={styles.settingText}>Beauty Filter</Text>
                        </View>
                        <Switch
                            value={beautyFilterEnabled}
                            onValueChange={setBeautyFilterEnabled}
                            trackColor={{ false: '#444', true: '#FFB800' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Lock size={20} color="#FF4D67" />
                            <Text style={styles.settingText}>Restrict Comments</Text>
                        </View>
                        <Switch
                            value={restrictComments}
                            onValueChange={setRestrictComments}
                            trackColor={{ false: '#444', true: '#FF4D67' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>
            </View>

            <View style={styles.bottomBar}>
                <ActionButton
                    label={startLabel}
                    onPress={handleStartLive}
                    fullWidth
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    noticeCard: {
        backgroundColor: 'rgba(255, 77, 103, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 77, 103, 0.35)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    noticeTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
    },
    noticeText: {
        color: '#D1D5DB',
        fontSize: 13,
        lineHeight: 18,
    },
    transportStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    transportDetails: {
        marginTop: 12,
    },
    transportStatusText: {
        color: '#E5E7EB',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
    },
    previewContainer: {
        height: 200,
        backgroundColor: '#222',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    previewText: {
        color: '#fff',
        marginTop: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    previewSubtext: {
        color: '#9CA3AF',
        marginTop: 6,
        textAlign: 'center',
        fontSize: 13,
    },
    disabledContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 16,
    },
    disabledTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    disabledText: {
        color: '#9CA3AF',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 8,
    },
    detailsContainer: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#222',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    settingsContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        color: '#fff',
        marginLeft: 12,
        fontSize: 16,
    },
    bottomBar: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
});
