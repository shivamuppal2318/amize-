import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import ActionButton from '@/components/shared/UI/ActionButton';
import HeaderBar from '@/components/shared/UI/HeaderBar';
import { usePostingStore } from '@/stores/postingStore';
import { useToast } from '@/hooks/useToast';
import { usePostUpload } from '@/hooks/usePostUpload';

// Import all components from the index file
import {
    MediaPreview,
    SlideshowOptions,
    CaptionInput,
    PostSettings,
    SocialSharing,
    VisibilityPicker,
    SlideshowTransitionPicker,
    UploadProgress
} from '@/components/posts/upload';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';

export default function EditPostScreen() {
    const router = useRouter();
    const toast = useToast();

    // Get state from store
    const {
        mediaItems,
        draftPost,
        updateCaption,
        updateLocation,
        updateVisibility,
        toggleComments,
        toggleDuets,
        toggleStitch,
        toggleCrossPost,
        setUploading,
        isUploading,
        uploadProgress
    } = usePostingStore();

    // Local state for UI
    const [showVisibilityOptions, setShowVisibilityOptions] = useState(false);
    const [showSlideshowOptions, setShowSlideshowOptions] = useState(false);
    const [locationText, setLocationText] = useState(draftPost.location || '');

    // Slideshow options
    const [createAsSlideshow, setCreateAsSlideshow] = useState(false);
    const [slideDuration, setSlideDuration] = useState(3);
    const [transition, setTransition] = useState('fade');

    // Use the custom upload hook
    const { submitPost, isSubmitting } = usePostUpload({
        createAsSlideshow,
        slideDuration,
        transition
    });

    // Check if we have media to edit
    useEffect(() => {
        if (mediaItems.length === 0) {
            toast.show('Error', 'No media selected for editing');
        }
    }, [mediaItems]);

    // Handle back button press
    const handleBack = () => {
        if (isUploading) {
            Alert.alert(
                'Upload in Progress',
                'Do you want to cancel the upload?',
                [
                    { text: 'Keep Uploading', style: 'cancel' },
                    {
                        text: 'Cancel Upload',
                        style: 'destructive',
                        onPress: () => {
                            setUploading(false);
                            router.back();
                        }
                    }
                ]
            );
            return;
        }

        if (draftPost.caption || draftPost.location) {
            Alert.alert(
                'Discard Post?',
                'If you go back now, your draft will be discarded.',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => router.back()
                    }
                ]
            );
        } else {
            router.back();
        }
    };

    // Handle location update
    const handleLocationUpdate = (location: string) => {
        updateLocation(location);
        setLocationText(location);
    };

    // Handle hashtag press (placeholder)
    const handleHashtagPress = () => {
        toast.show('Coming Soon', 'Hashtag selection will be available soon');
    };

    // Handle mention press (placeholder)
    const handleMentionPress = () => {
        toast.show('Coming Soon', 'Mention selection will be available soon');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar  
                backgroundColor="transparent" 
                barStyle="light-content" 
                translucent={true} 
            />
            <LinearGradient
                colors={['#1E4A72', '#000000']}  
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1 }}
            >
                <Stack.Screen options={{ headerShown: false }} />

                {/* Header */}
                <HeaderBar
                    title="New Post"
                    onBackPress={handleBack}
                    rightElement={
                        <TouchableOpacity onPress={submitPost} disabled={isUploading || isSubmitting}>
                            <Text style={[
                                styles.postButton,
                                (isUploading || isSubmitting) && styles.disabledText
                            ]}>
                                Post
                            </Text>
                        </TouchableOpacity>
                    }
                />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                >
                    <ScrollView style={styles.scrollView}>
                        {/* Media Preview */}
                        <MediaPreview mediaItems={mediaItems} />

                        {/* Slideshow Options (for multiple photos) */}
                        <SlideshowOptions
                            mediaItems={mediaItems}
                            createAsSlideshow={createAsSlideshow}
                            slideDuration={slideDuration}
                            transition={transition}
                            onToggleSlideshow={setCreateAsSlideshow}
                            onDurationChange={setSlideDuration}
                            onTransitionPress={() => setShowSlideshowOptions(true)}
                        />

                        {/* Caption Input */}
                        <CaptionInput
                            value={draftPost.caption}
                            onChangeText={updateCaption}
                        />

                        {/* Post Settings */}
                        <PostSettings
                            draftPost={draftPost}
                            locationText={locationText}
                            onLocationUpdate={handleLocationUpdate}
                            onVisibilityPress={() => setShowVisibilityOptions(true)}
                            onToggleComments={toggleComments}
                            onToggleDuets={toggleDuets}
                            onToggleStitch={toggleStitch}
                            onHashtagPress={handleHashtagPress}
                            onMentionPress={handleMentionPress}
                        />

                        {/* Share to social platforms */}
                        <SocialSharing
                            crossPostSettings={draftPost.crossPost}
                            onTogglePlatform={toggleCrossPost}
                        />
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom action button */}
                <View style={styles.bottomBar}>
                    <ActionButton
                        label={isSubmitting ? "Uploading..." : createAsSlideshow ? "Create Slideshow" : "Post Now"}
                        onPress={submitPost}
                        disabled={isUploading || isSubmitting || mediaItems.length === 0}
                        loading={isSubmitting}
                        fullWidth
                    />
                </View>

                {/* Modals */}
                <VisibilityPicker
                    visible={showVisibilityOptions}
                    currentVisibility={draftPost.visibility}
                    onClose={() => setShowVisibilityOptions(false)}
                    onSelect={(visibility: string) => updateVisibility(visibility as "public" | "followers" | "private")}
                />

                <SlideshowTransitionPicker
                    visible={showSlideshowOptions}
                    currentTransition={transition}
                    onClose={() => setShowSlideshowOptions(false)}
                    onSelect={setTransition}
                />

                <UploadProgress
                    visible={isUploading}
                    progress={uploadProgress}
                    status={uploadProgress < 100 ? 'uploading' : 'processing'}
                />
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#1a1a2e',
    },
    scrollView: {
        flex: 1,
    },
    postButton: {
        color: '#FF4D67',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledText: {
        opacity: 0.5,
    },
    bottomBar: {
        marginBottom:24,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
});