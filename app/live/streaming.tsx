import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    TextInput,
    Dimensions
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
    X,
    Users,
    Heart,
    MessageCircle,
    Gift,
    Share2,
    Camera,
    Sparkles,
    MoreVertical
} from 'lucide-react-native';

interface Comment {
    id: string;
    username: string;
    text: string;
    timestamp: string;
}

const { width, height } = Dimensions.get('window');

// Mock comments
const MOCK_COMMENTS: Comment[] = [
    { id: '1', username: 'user123', text: 'Hello! Looking great! 👋', timestamp: '1m' },
    { id: '2', username: 'fan_account', text: 'I love your content! 💖', timestamp: '30s' },
    { id: '3', username: 'new_viewer', text: 'First time here, this is awesome', timestamp: '10s' },
    { id: '4', username: 'regular_fan', text: 'What inspired you today?', timestamp: '5s' },
];

export default function LiveStreamingScreen() {
    const router = useRouter();
    const [viewerCount, setViewerCount] = useState(324);
    const [streamDuration, setStreamDuration] = useState(0);
    const [likeCount, setLikeCount] = useState(1250);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);

    // Simulate increasing viewer count
    useEffect(() => {
        const interval = setInterval(() => {
            setViewerCount(prev => prev + Math.floor(Math.random() * 3));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Simulate stream timer
    useEffect(() => {
        const interval = setInterval(() => {
            setStreamDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleEndStream = () => {
        router.replace('/(tabs)');
    };

    const handleSendComment = () => {
        if (comment.trim() === '') return;

        const newComment: Comment = {
            id: Date.now().toString(),
            username: 'me',
            text: comment,
            timestamp: 'now'
        };

        setComments([...comments, newComment]);
        setComment('');
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={styles.commentItem}>
            <Text style={styles.commentUsername}>{item.username}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* Live Stream Preview (placeholder) */}
            <View style={styles.livePreview}>
                <Text style={styles.liveText}>LIVE</Text>
            </View>

            {/* Top controls */}
            <View style={styles.topControls}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleEndStream}
                >
                    <X size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.streamInfo}>
                    <View style={styles.timeViewerCount}>
                        <Text style={styles.liveIndicator}>● LIVE</Text>
                        <Text style={styles.duration}>{formatDuration(streamDuration)}</Text>
                        <View style={styles.viewerCountContainer}>
                            <Users size={12} color="#fff" />
                            <Text style={styles.viewerCount}>{viewerCount}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.topRightControls}>
                    <TouchableOpacity style={styles.controlButton}>
                        <Camera size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlButton}>
                        <Sparkles size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stream actions */}
            <View style={styles.streamActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setLikeCount(prev => prev + 1)}
                >
                    <Heart size={24} color="#FF4D67" />
                    <Text style={styles.actionText}>{likeCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={24} color="#5A8CFF" />
                    <Text style={styles.actionText}>{comments.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <Gift size={24} color="#FFB800" />
                    <Text style={styles.actionText}>Gift</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <Share2 size={24} color="#FF4D67" />
                    <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <MoreVertical size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Comments section */}
            <View style={styles.commentsContainer}>
                <FlatList
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={item => item.id}
                    style={styles.commentsList}
                />
            </View>

            {/* Comment input */}
            <View style={styles.commentInputContainer}>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="#777"
                    value={comment}
                    onChangeText={setComment}
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendComment}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>

            {/* End stream button */}
            <TouchableOpacity
                style={styles.endStreamButton}
                onPress={handleEndStream}
            >
                <Text style={styles.endStreamText}>End Stream</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    livePreview: {
        position: 'absolute',
        width: width,
        height: height,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    liveText: {
        color: '#777',
        fontSize: 24,
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    streamInfo: {
        flex: 1,
        alignItems: 'center',
    },
    timeViewerCount: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    liveIndicator: {
        color: '#FF4D67',
        marginRight: 8,
        fontSize: 12,
        fontWeight: 'bold',
    },
    duration: {
        color: '#fff',
        marginRight: 8,
        fontSize: 12,
    },
    viewerCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewerCount: {
        color: '#fff',
        marginLeft: 4,
        fontSize: 12,
    },
    topRightControls: {
        flexDirection: 'row',
    },
    controlButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    streamActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        position: 'absolute',
        bottom: 180,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        marginTop: 4,
        fontSize: 12,
    },
    commentsContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        height: 120,
        paddingHorizontal: 16,
    },
    commentsList: {
        flex: 1,
    },
    commentItem: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
    },
    commentUsername: {
        color: '#5A8CFF',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    commentText: {
        color: '#fff',
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    commentInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#222',
        borderRadius: 20,
        paddingHorizontal: 16,
        color: '#fff',
    },
    sendButton: {
        marginLeft: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FF4D67',
        borderRadius: 20,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    endStreamButton: {
        position: 'absolute',
        bottom: 80,
        right: 16,
        backgroundColor: '#FF4D67',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        zIndex: 10,
    },
    endStreamText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
