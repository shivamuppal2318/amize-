import React from 'react';
import { Platform, View } from 'react-native';
import { AD_CONFIG, getBannerAdUnitId } from '@/lib/ads/config';
import { AdBannerPlaceholder } from '@/components/ads/AdBannerPlaceholder';
import { BannerAd as NativeBannerAd, BannerAdSize as NativeBannerAdSize } from '@/lib/ads/bannerNative';

type AdBannerProps = {
  label?: string;
  placement?: 'exploreBanner' | 'nearbyBanner';
};

export function AdBanner({ label = 'Banner Ad', placement = 'exploreBanner' }: AdBannerProps) {
  const unitId = getBannerAdUnitId(placement);

  if (Platform.OS !== 'web' && AD_CONFIG.enabled && unitId && NativeBannerAd && NativeBannerAdSize) {
    return (
      <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
        <NativeBannerAd
          unitId={unitId}
          size={NativeBannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
    );
  }

  return <AdBannerPlaceholder label={label} placement={placement} />;
}
