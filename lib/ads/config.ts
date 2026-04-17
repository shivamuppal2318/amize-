import Constants from "expo-constants";
import { Platform } from 'react-native';
import { releaseConfig } from '@/lib/release/releaseConfig';

const requireNativeModule = (moduleName: string) => {
    const dynamicRequire = eval('require') as NodeRequire;
    return dynamicRequire(moduleName);
};

const TEST_ADMOB_APP_IDS = new Set([
    'ca-app-pub-3940256099942544~3347511713',
    'ca-app-pub-3940256099942544~1458002511',
]);

const extraConfig = (Constants.expoConfig?.extra || {}) as {
    admobExploreBannerId?: string;
    admobNearbyBannerId?: string;
};

export const AD_CONFIG = {
    provider: 'admob',
    enabled: !releaseConfig.demoMode,
    useTestAdsInDev: true,
    appIds: {
        android: releaseConfig.admobAndroidAppId || 'ca-app-pub-3940256099942544~3347511713',
        ios: releaseConfig.admobIosAppId || 'ca-app-pub-3940256099942544~1458002511',
    },
    placements: {
        exploreBanner: extraConfig.admobExploreBannerId || '',
        nearbyBanner: extraConfig.admobNearbyBannerId || '',
    },
};

type BannerPlacement = keyof typeof AD_CONFIG.placements;

export function isAdMobProductionReady(): boolean {
    const placementsReady = Object.values(AD_CONFIG.placements).every(
        (value) => value.trim().length > 0
    );
    if (!placementsReady) {
        return false;
    }

    if (Platform.OS === 'android') {
        return (
            AD_CONFIG.appIds.android.trim().length > 0 &&
            !TEST_ADMOB_APP_IDS.has(AD_CONFIG.appIds.android)
        );
    }

    if (Platform.OS === 'ios') {
        return (
            AD_CONFIG.appIds.ios.trim().length > 0 &&
            !TEST_ADMOB_APP_IDS.has(AD_CONFIG.appIds.ios)
        );
    }

    return false;
}

export function shouldInitializeMobileAds(): boolean {
    if (Platform.OS === 'web' || !AD_CONFIG.enabled) {
        return false;
    }

    if (__DEV__) {
        return true;
    }

    return isAdMobProductionReady();
}

export function getBannerAdUnitId(placement: BannerPlacement): string | null {
    if (Platform.OS === 'web') {
        return null;
    }

    if (__DEV__ && AD_CONFIG.useTestAdsInDev) {
        const { TestIds } = requireNativeModule('react-native-google-mobile-ads');
        return TestIds.ADAPTIVE_BANNER;
    }

    if (!isAdMobProductionReady()) {
        return null;
    }

    const configuredPlacement = AD_CONFIG.placements[placement];
    return configuredPlacement.trim().length > 0 ? configuredPlacement : null;
}
