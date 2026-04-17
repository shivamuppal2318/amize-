import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
    ArrowLeft,
    ShieldAlert,
    ChevronUp,
    ChevronDown,
    RotateCcw,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useDiscoveryTopics } from '@/hooks/useDiscoveryTopics';
import { isDemoMode } from '@/lib/release/releaseConfig';

export default function AdminTopicsScreen() {
    const { user } = useAuth();
    const {
        topics,
        loading,
        updateTopic,
        reorderTopic,
        resetTopics,
    } = useDiscoveryTopics();

    const isAdmin = user?.role === 'ADMIN';
    const demoMode = isDemoMode();
    const showDemoBlocked = () => {
        Alert.alert(
            'Demo build',
            'Topic management is disabled in the demo build.'
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#1E4A72', '#000000']} style={styles.gradient}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
<TouchableOpacity 
                        onPress={() => router.back()}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Discovery Topics</Text>
                        <TouchableOpacity
                            onPress={() => (demoMode ? showDemoBlocked() : resetTopics())}
                            disabled={demoMode}
                        >
                            <RotateCcw size={20} color="#FF5A5F" />
                        </TouchableOpacity>
                    </View>

                    {!isAdmin ? (
                        <View style={styles.deniedCard}>
                            <ShieldAlert size={36} color="#FF5A5F" />
                            <Text style={styles.deniedTitle}>Admin access required</Text>
                            <Text style={styles.deniedText}>
                                Topic controls are visible only for admin accounts. The explore feed still uses the locally stored topic set.
                            </Text>
                        </View>
                    ) : loading ? (
                        <View style={styles.deniedCard}>
                            <Text style={styles.deniedTitle}>Loading topics...</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.helperText}>
                                These toggles control which discovery topics are active in the app and which ones are featured first in filters.
                            </Text>
                            {demoMode ? (
                                <View style={styles.noticeCard}>
                                    <Text style={styles.noticeTitle}>Demo build</Text>
                                    <Text style={styles.noticeText}>
                                        Topic updates are disabled in demo mode.
                                    </Text>
                                </View>
                            ) : null}

                            {topics.map((topic, index) => (
                                <View key={topic.id} style={styles.topicCard}>
                                    <View style={styles.topicInfo}>
                                        <Text style={styles.topicName}>{topic.name}</Text>
                                        <Text style={styles.topicMeta}>
                                            {topic.enabled ? 'Enabled' : 'Hidden'} · {topic.featured ? 'Featured' : 'Standard'}
                                        </Text>
                                    </View>
                                    <View style={styles.actionColumn}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() =>
                                                demoMode
                                                    ? showDemoBlocked()
                                                    : updateTopic(topic.id, { enabled: !topic.enabled })
                                            }
                                            disabled={demoMode}
                                        >
                                            <Text style={styles.actionText}>
                                                {topic.enabled ? 'Hide' : 'Show'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() =>
                                                demoMode
                                                    ? showDemoBlocked()
                                                    : updateTopic(topic.id, {
                                                        featured: !topic.featured,
                                                    })
                                            }
                                            disabled={demoMode}
                                        >
                                            <Text style={styles.actionText}>
                                                {topic.featured ? 'Unfeature' : 'Feature'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.orderColumn}>
                                        <TouchableOpacity
                                            disabled={index === 0 || demoMode}
                                            onPress={() =>
                                                demoMode
                                                    ? showDemoBlocked()
                                                    : reorderTopic(topic.id, 'up')
                                            }
                                            style={[
                                                styles.orderButton,
                                                (index === 0 || demoMode) && styles.disabledButton,
                                            ]}
                                        >
                                            <ChevronUp size={16} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            disabled={index === topics.length - 1 || demoMode}
                                            onPress={() =>
                                                demoMode
                                                    ? showDemoBlocked()
                                                    : reorderTopic(topic.id, 'down')
                                            }
                                            style={[
                                                styles.orderButton,
                                                (index === topics.length - 1 || demoMode) &&
                                                    styles.disabledButton,
                                            ]}
                                        >
                                            <ChevronDown size={16} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    gradient: {
        flex: 1,
    },
    content: {
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    helperText: {
        color: '#9CA3AF',
        lineHeight: 20,
        marginBottom: 16,
        fontFamily: 'Figtree',
    },
    deniedCard: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        borderRadius: 20,
        backgroundColor: 'rgba(17,24,39,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    deniedTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 14,
        fontFamily: 'Figtree',
    },
    deniedText: {
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 10,
        fontFamily: 'Figtree',
    },
    noticeCard: {
        borderRadius: 18,
        padding: 16,
        backgroundColor: 'rgba(249, 115, 22, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(249, 115, 22, 0.32)',
        marginBottom: 16,
    },
    noticeTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    noticeText: {
        color: '#FDE68A',
        marginTop: 6,
        fontSize: 13,
        fontFamily: 'Figtree',
    },
    topicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        backgroundColor: 'rgba(17,24,39,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 12,
    },
    topicInfo: {
        flex: 1,
    },
    topicName: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    topicMeta: {
        color: '#9CA3AF',
        marginTop: 4,
        fontSize: 13,
        fontFamily: 'Figtree',
    },
    actionColumn: {
        gap: 8,
        marginHorizontal: 12,
    },
    actionButton: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 90, 95, 0.12)',
    },
    actionText: {
        color: '#FF5A5F',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    orderColumn: {
        gap: 8,
    },
    orderButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E4A72',
    },
    disabledButton: {
        opacity: 0.35,
    },
});
