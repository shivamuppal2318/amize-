import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  ChevronLeft,
  DatabaseZap,
  HardDrive,
  SearchX,
  Share2,
  Trash2,
} from "lucide-react-native";

import {
  AccountExportAPI,
  AccountExportPayload,
} from "@/lib/api/accountExportService";
import { buildLocalAccountExport } from "@/lib/admin/localPreview";
import { Button } from "@/components/ui/Button";
import { useVideoContext } from "@/context/VideoContext";
import { secureStorage, STORAGE_KEYS } from "@/lib/auth/storage";
import {
  clearAuxiliaryLocalData,
  getLocalDataSummary,
  LocalDataSummary,
} from "@/lib/storage/localData";
import { captureException } from "@/utils/errorReporting";

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function DataStorageScreen() {
  const { clearCache, clearRecentlyViewed, getCacheInfo, recentlyViewed } =
    useVideoContext();
  const [exportData, setExportData] = useState<AccountExportPayload | null>(null);
  const [storageSummary, setStorageSummary] = useState<LocalDataSummary | null>(null);
  const [cacheStats, setCacheStats] = useState<{
    totalSize: number;
    videoCount: number;
    lastCleanup: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    "cache" | "recent" | "local" | null
  >(null);
  const [exportMode, setExportMode] = useState<"backend" | "local-preview">(
    "backend"
  );

  const exportPreview = useMemo(() => {
    if (!exportData) {
      return "";
    }

    return JSON.stringify(exportData, null, 2).slice(0, 4000);
  }, [exportData]);

  const formatBytes = useCallback((value: number) => {
    if (value <= 0) {
      return "0 MB";
    }

    const megabytes = value / (1024 * 1024);

    if (megabytes < 1) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`;
  }, []);

  const refreshStorageState = useCallback(async () => {
    const [cacheInfo, localData] = await Promise.all([
      getCacheInfo(),
      getLocalDataSummary(),
    ]);

    setCacheStats(cacheInfo);
    setStorageSummary(localData);
  }, [getCacheInfo]);

  const buildLocalExportPreview = useCallback(async () => {
    const userJson = await secureStorage.get(STORAGE_KEYS.USER_DATA);
    const parsedUser = userJson ? (JSON.parse(userJson) as Record<string, unknown>) : null;
    const [cacheInfo, localData] = await Promise.all([
      getCacheInfo(),
      getLocalDataSummary(),
    ]);

    return buildLocalAccountExport({
      user: parsedUser,
      localSummary: localData,
      cacheStats: cacheInfo,
      recentlyViewedCount: recentlyViewed.length,
    });
  }, [getCacheInfo, recentlyViewed.length]);

  const loadExport = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await AccountExportAPI.getExport();
      setExportData(data);
      setExportMode("backend");
    } catch (error) {
      captureException(error, {
        tags: { screen: "data-storage", stage: "export" },
      });
      const localExport = await buildLocalExportPreview();
      setExportData(localExport);
      setExportMode("local-preview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildLocalExportPreview]);

  useFocusEffect(
    useCallback(() => {
      refreshStorageState().catch((error) => {
        captureException(error, {
          tags: { screen: "data-storage", stage: "summary" },
        });
      });
    }, [refreshStorageState])
  );

  const runStorageAction = useCallback(
    async (
      key: "cache" | "recent" | "local",
      action: () => Promise<void>,
      successMessage: string
    ) => {
      setActionLoading(key);

      try {
        await action();
        await refreshStorageState();
        Alert.alert("Data & Storage", successMessage);
      } catch (error) {
        captureException(error, {
          tags: { screen: "data-storage", stage: key },
        });
        Alert.alert("Data & Storage", "The cleanup action could not be completed.");
      } finally {
        setActionLoading(null);
      }
    },
    [refreshStorageState]
  );

  const handleClearVideoCache = useCallback(() => {
    Alert.alert(
      "Clear Video Cache",
      "This removes downloaded and preloaded videos stored on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () =>
            runStorageAction(
              "cache",
              clearCache,
              "Downloaded video cache has been cleared."
            ),
        },
      ]
    );
  }, [clearCache, runStorageAction]);

  const handleClearRecentlyViewed = useCallback(() => {
    Alert.alert(
      "Clear Recently Viewed",
      "This resets the local recently viewed history on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () =>
            runStorageAction(
              "recent",
              async () => {
                await clearRecentlyViewed();
              },
              "Recently viewed history has been cleared."
            ),
        },
      ]
    );
  }, [clearRecentlyViewed, runStorageAction]);

  const handleClearLocalData = useCallback(() => {
    Alert.alert(
      "Clear Local Search & Queue Data",
      "This clears local search history, queued messages, and discovery-topic overrides stored on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () =>
            runStorageAction(
              "local",
              clearAuxiliaryLocalData,
              "Local search, queued message, and discovery-topic data has been cleared."
            ),
        },
      ]
    );
  }, [runStorageAction]);

  const handleShareExport = async () => {
    if (!exportData) {
      Alert.alert("Data Export", "Generate your export before sharing it.");
      return;
    }

    try {
      await Share.share({
        title: "Amize Account Export",
        message: JSON.stringify(exportData, null, 2),
      });
    } catch (error) {
      captureException(error, {
        tags: { screen: "data-storage", stage: "share" },
      });
      Alert.alert("Data Export", "Unable to share the export right now.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              Promise.all([loadExport("refresh"), refreshStorageState()]).then(() => {
                // Ignore
              })
            }
            tintColor="#FF5A5F"
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Data & Storage</Text>
            <Text style={styles.headerSubtitle}>
              Generate a copy of your account data from the backend.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <HardDrive size={20} color="#FFFFFF" />
          <Text style={styles.heroTitle}>Account Export</Text>
          <Text style={styles.heroBody}>
            This export includes account details, settings, uploads, videos,
            wallet history, withdrawals, subscriptions, devices, and reports.
          </Text>
          {exportData ? (
            <Text style={styles.exportModeText}>
              Source: {exportMode === "backend" ? "backend export" : "local preview export"}
            </Text>
          ) : null}
          <View style={styles.buttonRow}>
            <Button
              label={loading ? "Generating..." : "Generate Export"}
              onPress={() => loadExport("initial")}
              variant="primary"
              fullWidth
              loading={loading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>On-Device Storage</Text>
          <View style={styles.grid}>
            <SummaryCard
              label="Cached Videos"
              value={cacheStats?.videoCount ?? 0}
            />
            <SummaryCard
              label="Recent Views"
              value={recentlyViewed.length}
            />
            <SummaryCard
              label="Search History"
              value={storageSummary?.searchHistoryCount ?? 0}
            />
            <SummaryCard
              label="Queued Msgs"
              value={storageSummary?.queuedMessagesCount ?? 0}
            />
            <SummaryCard
              label="Topic Overrides"
              value={storageSummary?.discoveryTopicOverrideCount ?? 0}
            />
            <SummaryCard
              label="Trending Seeds"
              value={storageSummary?.trendingSearchesCount ?? 0}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cleanup Actions</Text>
          <View style={styles.actionCard}>
            <View style={styles.actionCopy}>
              <DatabaseZap size={18} color="#FFFFFF" />
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Clear Video Cache</Text>
                <Text style={styles.actionBody}>
                  Remove downloaded video files from this device. Current usage:{" "}
                  {formatBytes(cacheStats?.totalSize ?? 0)}.
                </Text>
              </View>
            </View>
            <Button
              label={actionLoading === "cache" ? "Clearing..." : "Clear Cache"}
              onPress={handleClearVideoCache}
              variant="outline"
              fullWidth
              loading={actionLoading === "cache"}
            />
          </View>

          <View style={styles.actionCard}>
            <View style={styles.actionCopy}>
              <Trash2 size={18} color="#FFFFFF" />
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Clear Recently Viewed</Text>
                <Text style={styles.actionBody}>
                  Reset the local recently viewed list without touching account data.
                </Text>
              </View>
            </View>
            <Button
              label={actionLoading === "recent" ? "Clearing..." : "Clear History"}
              onPress={handleClearRecentlyViewed}
              variant="outline"
              fullWidth
              loading={actionLoading === "recent"}
            />
          </View>

          <View style={styles.actionCard}>
            <View style={styles.actionCopy}>
              <SearchX size={18} color="#FFFFFF" />
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Clear Local Search & Queue Data</Text>
                <Text style={styles.actionBody}>
                  Remove local search history, queued messages, trending seeds, and
                  discovery-topic overrides from this device.
                </Text>
              </View>
            </View>
            <Button
              label={actionLoading === "local" ? "Clearing..." : "Clear Local Data"}
              onPress={handleClearLocalData}
              variant="outline"
              fullWidth
              loading={actionLoading === "local"}
            />
          </View>
        </View>

        {loading && !exportData ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#FF5A5F" />
            <Text style={styles.loadingText}>Preparing your data export...</Text>
          </View>
        ) : null}

        {exportData ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Export Summary</Text>
              <View style={styles.grid}>
                <SummaryCard label="Interests" value={exportData.summary.interests} />
                <SummaryCard label="Devices" value={exportData.summary.devices} />
                <SummaryCard label="Uploads" value={exportData.summary.uploads} />
                <SummaryCard label="Videos" value={exportData.summary.videos} />
                <SummaryCard
                  label="Wallet Txns"
                  value={exportData.summary.walletTransactions}
                />
                <SummaryCard
                  label="Withdrawals"
                  value={exportData.summary.withdrawalRequests}
                />
                <SummaryCard
                  label="Subscriptions"
                  value={exportData.summary.subscriptions}
                />
                <SummaryCard label="Subscribers" value={exportData.summary.subscribers} />
                <SummaryCard label="Reports" value={exportData.summary.reports} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Generated</Text>
              <Text style={styles.generatedAt}>{exportData.generatedAt}</Text>
            </View>

            <View style={styles.section}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShareExport}>
                <Share2 size={18} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share Export JSON</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewText}>{exportPreview}</Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 8,
    paddingTop: 2,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  headerSubtitle: {
    color: "#94A3B8",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Figtree",
  },
  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 20,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    fontFamily: "Figtree",
  },
  heroBody: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: "Figtree",
  },
  exportModeText: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 8,
    fontFamily: "Figtree",
  },
  buttonRow: {
    marginTop: 18,
  },
  actionCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 14,
  },
  actionCopy: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  actionBody: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    fontFamily: "Figtree",
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 15,
    fontFamily: "Figtree",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    fontFamily: "Figtree",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    width: "30%",
    minWidth: 96,
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  summaryLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Figtree",
  },
  generatedAt: {
    color: "#CBD5E1",
    fontSize: 14,
    fontFamily: "Figtree",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#1D4ED8",
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Figtree",
  },
  previewCard: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  previewText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace",
  },
});
