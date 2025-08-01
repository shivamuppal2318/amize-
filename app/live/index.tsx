import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Switch
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Radio, Users, Sparkles, Globe, Lock } from 'lucide-react-native';
import ActionButton from '@/components/shared/UI/ActionButton';
import HeaderBar from '@/components/shared/UI/HeaderBar';

export default function LiveSetupScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [enableComments, setEnableComments] = useState(true);

    const handleBack = () => {
        router.back();
    };

    const handleStartLive = () => {
        // In a real app, this would start the live stream
        router.push('/live/streaming');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <HeaderBar
                title="Go Live"
                onBackPress={handleBack}
            />

            <View style={styles.content}>
                {/* Live Preview */}
                <View style={styles.previewContainer}>
                    <Radio size={48} color="#555" />
                    <Text style={styles.previewText}>Live Preview</Text>
                </View>

                {/* Live Stream Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a title to your live stream..."
                            placeholderTextColor="#777"
                            value={title}
                            onChangeText={setTitle}
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
                        />
                    </View>
                </View>

                {/* Stream Settings */}
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
                            trackColor={{ false: '#444', true: '#FF4D67' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>
            </View>

            {/* Start Live Button */}
            <View style={styles.bottomBar}>
                <ActionButton
                    label="Go Live Now"
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
    previewContainer: {
        height: 200,
        backgroundColor: '#222',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    previewText: {
        color: '#777',
        marginTop: 8,
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
        fontWeight: 'bold',
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