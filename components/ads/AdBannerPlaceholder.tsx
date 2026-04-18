import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { AD_CONFIG, getBannerAdUnitId } from '@/lib/ads/config';
import { BannerAd as NativeBannerAd, BannerAdSize as NativeBannerAdSize } from '@/lib/ads/bannerNative';

type AdBannerPlaceholderProps = {
    label?: string;
    placement?: 'exploreBanner' | 'nearbyBanner';
};

export function AdBannerPlaceholder({
    label = 'Banner Ad',
    placement = 'exploreBanner',
}: AdBannerPlaceholderProps) {
    const unitId = getBannerAdUnitId(placement);

    if (Platform.OS !== 'web' && AD_CONFIG.enabled && unitId && NativeBannerAd && NativeBannerAdSize) {
        return (
            <View style={styles.liveContainer}>
                <Text style={styles.liveBadge}>
                    {__DEV__ ? `${label} Test Ad` : `${label} Ad`}
                </Text>
                <NativeBannerAd
                    unitId={unitId}
                    size={NativeBannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: true,
                    }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.badge}>
                {AD_CONFIG.enabled ? `${label} Pending` : `${label} Reserved`}
            </Text>
            <Text style={styles.text}>
                {AD_CONFIG.enabled
                    ? Platform.OS === 'web'
                        ? 'Ad placements are disabled on web preview. They render on native builds.'
                        : 'Ad SDK is wired, but this placement does not have a production unit ID yet.'
                    : 'Ad slot scaffolded. Add live AdMob IDs and SDK wiring to serve ads here.'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginBottom: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 184, 0, 0.25)',
        backgroundColor: 'rgba(255, 184, 0, 0.08)',
    },
    liveContainer: {
        marginHorizontal: 20,
        marginBottom: 12,
        paddingTop: 10,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 184, 0, 0.25)',
        backgroundColor: 'rgba(255, 184, 0, 0.04)',
        alignItems: 'center',
    },
    badge: {
        color: '#FFB700',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'Figtree',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    liveBadge: {
        color: '#FFB700',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'Figtree',
        textTransform: 'uppercase',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    text: {
        color: '#F3F4F6',
        fontSize: 13,
        lineHeight: 18,
        fontFamily: 'Figtree',
    },
});
