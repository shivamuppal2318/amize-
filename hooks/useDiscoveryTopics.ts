import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_DISCOVERY_TOPICS, DiscoveryTopic } from '@/data/discoveryTopics';
import { DiscoveryTopicsService } from '@/lib/api/discoveryTopicsService';

const DISCOVERY_TOPICS_STORAGE_KEY = 'discovery_topics_v1';

const normalizeTopics = (topics: DiscoveryTopic[]) =>
    [...topics].sort((a, b) => a.order - b.order);

export function useDiscoveryTopics() {
    const [topics, setTopics] = useState<DiscoveryTopic[]>(DEFAULT_DISCOVERY_TOPICS);
    const [loading, setLoading] = useState(true);

    const persistTopics = useCallback(async (nextTopics: DiscoveryTopic[]) => {
        const normalizedTopics = normalizeTopics(nextTopics);
        await AsyncStorage.setItem(
            DISCOVERY_TOPICS_STORAGE_KEY,
            JSON.stringify(normalizedTopics)
        );
        setTopics(normalizedTopics);
        return normalizedTopics;
    }, []);

    const fetchRemoteTopics = useCallback(async () => {
        try {
            const remoteTopics = await DiscoveryTopicsService.getTopics();
            if (remoteTopics.length > 0) {
                await persistTopics(remoteTopics);
                return remoteTopics;
            }
        } catch (error) {
            console.warn('Discovery topics API unavailable, using local cache.', error);
        }
        return null;
    }, [persistTopics]);

    useEffect(() => {
        const loadTopics = async () => {
            try {
                const remote = await fetchRemoteTopics();
                if (remote) {
                    return;
                }

                const storedTopics = await AsyncStorage.getItem(
                    DISCOVERY_TOPICS_STORAGE_KEY
                );

                if (storedTopics) {
                    setTopics(normalizeTopics(JSON.parse(storedTopics)));
                }
            } catch (error) {
                console.error('Failed to load discovery topics:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTopics();
    }, []);

    const updateTopic = useCallback(
        async (topicId: string, updates: Partial<DiscoveryTopic>) => {
            const nextTopics = topics.map((topic) =>
                topic.id === topicId ? { ...topic, ...updates } : topic
            );
            try {
                const saved = await DiscoveryTopicsService.saveTopics(nextTopics);
                await persistTopics(saved);
            } catch (error) {
                console.warn('Failed to save topics to API, using local storage.', error);
                await persistTopics(nextTopics);
            }
        },
        [persistTopics, topics]
    );

    const reorderTopic = useCallback(
        async (topicId: string, direction: 'up' | 'down') => {
            const currentIndex = topics.findIndex((topic) => topic.id === topicId);
            if (currentIndex === -1) {
                return;
            }

            const targetIndex =
                direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            if (targetIndex < 0 || targetIndex >= topics.length) {
                return;
            }

            const nextTopics = [...topics];
            const currentTopic = nextTopics[currentIndex];
            const targetTopic = nextTopics[targetIndex];

            nextTopics[currentIndex] = { ...targetTopic, order: currentTopic.order };
            nextTopics[targetIndex] = { ...currentTopic, order: targetTopic.order };

            try {
                const saved = await DiscoveryTopicsService.saveTopics(nextTopics);
                await persistTopics(saved);
            } catch (error) {
                console.warn('Failed to reorder topics on API, using local storage.', error);
                await persistTopics(nextTopics);
            }
        },
        [persistTopics, topics]
    );

    const resetTopics = useCallback(async () => {
        try {
            const saved = await DiscoveryTopicsService.resetTopics();
            await persistTopics(saved);
        } catch (error) {
            console.warn('Failed to reset topics on API, using local storage.', error);
            await AsyncStorage.removeItem(DISCOVERY_TOPICS_STORAGE_KEY);
            setTopics(DEFAULT_DISCOVERY_TOPICS);
        }
    }, [persistTopics]);

    const activeTopics = useMemo(
        () => normalizeTopics(topics.filter((topic) => topic.enabled)),
        [topics]
    );

    const featuredTopics = useMemo(
        () => activeTopics.filter((topic) => topic.featured),
        [activeTopics]
    );

    return {
        topics,
        loading,
        activeTopics,
        featuredTopics,
        updateTopic,
        reorderTopic,
        resetTopics,
    };
}
