import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_DATA_KEYS = {
  searchHistory: "@search_history",
  trendingSearches: "@trending_searches",
  discoveryTopics: "discovery_topics_v1",
  queuedMessages: "@queued_messages",
} as const;

export interface LocalDataSummary {
  searchHistoryCount: number;
  trendingSearchesCount: number;
  discoveryTopicOverrideCount: number;
  queuedMessagesCount: number;
}

const getArrayCount = (value: string | null) => {
  if (!value) {
    return 0;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

export async function getLocalDataSummary(): Promise<LocalDataSummary> {
  const entries = await AsyncStorage.multiGet(Object.values(LOCAL_DATA_KEYS));
  const values = Object.fromEntries(entries);

  return {
    searchHistoryCount: getArrayCount(values[LOCAL_DATA_KEYS.searchHistory] ?? null),
    trendingSearchesCount: getArrayCount(
      values[LOCAL_DATA_KEYS.trendingSearches] ?? null
    ),
    discoveryTopicOverrideCount: getArrayCount(
      values[LOCAL_DATA_KEYS.discoveryTopics] ?? null
    ),
    queuedMessagesCount: getArrayCount(values[LOCAL_DATA_KEYS.queuedMessages] ?? null),
  };
}

export async function clearAuxiliaryLocalData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(LOCAL_DATA_KEYS));
}

