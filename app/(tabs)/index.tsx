// app/(tabs)/index.tsx
import React from 'react';
import { View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import FeedScreen from '@/components/VideoFeed/FeedScreen';
import { VideoProvider } from '@/context/VideoContext';

const HomeScreen: React.FC = () => {
    return (
        <VideoProvider>
            <FeedScreen />
        </VideoProvider>
    );
};

export default HomeScreen;