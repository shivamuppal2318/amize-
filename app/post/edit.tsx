import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import ActionButton from "@/components/shared/UI/ActionButton";
import HeaderBar from "@/components/shared/UI/HeaderBar";
import { usePostingStore } from "@/stores/postingStore";
import { useToast } from "@/hooks/useToast";
import { usePostUpload } from "@/hooks/usePostUpload";

// Import all components from the index file
import {
  MediaPreview,
  SlideshowOptions,
  CaptionInput,
  PostSettings,
  SocialSharing,
  VisibilityPicker,
  SlideshowTransitionPicker,
  UploadProgress,
} from "@/components/posts/upload";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "react-native";

export default function EditPostScreen() {
  const router = useRouter();
  const toast = useToast();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isStoryMode = mode === "story";

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
    uploadProgress,
  } = usePostingStore();

  // Local state for UI
  const [showVisibilityOptions, setShowVisibilityOptions] = useState(false);
  const [showSlideshowOptions, setShowSlideshowOptions] = useState(false);
  const [locationText, setLocationText] = useState(draftPost.location || "");
  const [captionSelection, setCaptionSelection] = useState({
    start: draftPost.caption.length,
    end: draftPost.caption.length,
  });
  const captionInputRef = useRef<TextInput>(null);

  // Slideshow options
  const [createAsSlideshow, setCreateAsSlideshow] = useState(false);
  const [slideDuration, setSlideDuration] = useState(3);
  const [transition, setTransition] = useState("fade");
  const storyDefaultsAppliedRef = useRef(false);

  // Use the custom upload hook
  const { submitPost, isSubmitting } = usePostUpload({
    createAsSlideshow,
    slideDuration,
    transition,
    postMode: isStoryMode ? "story" : "post",
  });

  // Check if we have media to edit
  useEffect(() => {
    if (mediaItems.length === 0) {
      toast.show("Error", "No media selected for editing");
    }
  }, [mediaItems]);

  useEffect(() => {
    if (!isStoryMode || storyDefaultsAppliedRef.current) {
      return;
    }

    storyDefaultsAppliedRef.current = true;
    updateVisibility("followers");

    if (draftPost.allowComments) {
      toggleComments();
    }

    if (draftPost.allowDuets) {
      toggleDuets();
    }

    if (draftPost.allowStitch) {
      toggleStitch();
    }
  }, [
    draftPost.allowComments,
    draftPost.allowDuets,
    draftPost.allowStitch,
    isStoryMode,
    toggleComments,
    toggleDuets,
    toggleStitch,
    updateVisibility,
  ]);

  // Handle back button press
  const handleBack = () => {
    if (isUploading) {
      Alert.alert("Upload in Progress", "Do you want to cancel the upload?", [
        { text: "Keep Uploading", style: "cancel" },
        {
          text: "Cancel Upload",
          style: "destructive",
          onPress: () => {
            setUploading(false);
            router.back();
          },
        },
      ]);
      return;
    }

    if (draftPost.caption || draftPost.location) {
      Alert.alert(
        "Discard Post?",
        "If you go back now, your draft will be discarded.",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
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

  const handleCaptionSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    setCaptionSelection(event.nativeEvent.selection);
  };

  const insertCaptionToken = (token: "#" | "@") => {
    const caption = draftPost.caption || "";
    const start = captionSelection.start ?? caption.length;
    const end = captionSelection.end ?? caption.length;
    const prefix = caption.slice(0, start);
    const suffix = caption.slice(end);
    const needsLeadingSpace =
      prefix.length > 0 && !/\s$/.test(prefix) ? " " : "";
    const nextCaption = `${prefix}${needsLeadingSpace}${token}${suffix}`;
    const nextCursorPosition = (prefix + needsLeadingSpace + token).length;

    updateCaption(nextCaption);
    setCaptionSelection({
      start: nextCursorPosition,
      end: nextCursorPosition,
    });

    requestAnimationFrame(() => {
      captionInputRef.current?.focus();
    });
  };

  const handleHashtagPress = () => {
    insertCaptionToken("#");
    toast.show("Hashtag Added", "Continue typing your hashtag");
  };

  const handleMentionPress = () => {
    insertCaptionToken("@");
    toast.show("Mention Added", "Continue typing the username");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent={true}
      />
      <LinearGradient
        colors={["#1E4A72", "#000000"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <HeaderBar
          title={isStoryMode ? "New Story" : "New Post"}
          onBackPress={handleBack}
          rightElement={
            <TouchableOpacity
              onPress={submitPost}
              disabled={isUploading || isSubmitting}
            >
              <Text
                style={[
                  styles.postButton,
                  (isUploading || isSubmitting) && styles.disabledText,
                ]}
              >
                {isStoryMode ? "Share" : "Post"}
              </Text>
            </TouchableOpacity>
          }
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView style={styles.scrollView}>
            {/* Media Preview */}
            <MediaPreview mediaItems={mediaItems} />

            {/* Slideshow Options (for multiple photos) */}
            {!isStoryMode ? (
              <SlideshowOptions
                mediaItems={mediaItems}
                createAsSlideshow={createAsSlideshow}
                slideDuration={slideDuration}
                transition={transition}
                onToggleSlideshow={setCreateAsSlideshow}
                onDurationChange={setSlideDuration}
                onTransitionPress={() => setShowSlideshowOptions(true)}
              />
            ) : null}

            {/* Caption Input */}
            <CaptionInput
              value={draftPost.caption}
              onChangeText={updateCaption}
              selection={captionSelection}
              onSelectionChange={handleCaptionSelectionChange}
              inputRef={captionInputRef}
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
            {!isStoryMode ? (
              <SocialSharing
                crossPostSettings={draftPost.crossPost}
                onTogglePlatform={toggleCrossPost}
              />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom action button */}
        <View style={styles.bottomBar}>
          <ActionButton
            label={
              isSubmitting
                ? "Uploading..."
                : isStoryMode
                ? "Share Story"
                : createAsSlideshow
                ? "Create Slideshow"
                : "Post Now"
            }
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
          onSelect={(visibility: string) =>
            updateVisibility(visibility as "public" | "followers" | "private")
          }
        />

        {!isStoryMode ? (
          <SlideshowTransitionPicker
            visible={showSlideshowOptions}
            currentTransition={transition}
            onClose={() => setShowSlideshowOptions(false)}
            onSelect={setTransition}
          />
        ) : null}

        <UploadProgress
          visible={isUploading}
          progress={uploadProgress}
          status={uploadProgress < 100 ? "uploading" : "processing"}
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
    color: "#FF4D67",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledText: {
    opacity: 0.5,
  },
  bottomBar: {
    marginBottom: 24,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
});
