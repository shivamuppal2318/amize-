import React from 'react';
import { Platform, View } from 'react-native';
import { AD_CONFIG, getBannerAdUnitId } from '@/lib/ads/config';
import { AdBannerPlaceholder } from '@/components/ads/AdBannerPlaceholder';

const requireNativeModule = (moduleName: string) => {
  const dynamicRequire = eval('require') as NodeRequire;
  return dynamicRequire(moduleName);
};

let NativeBannerAd: any = null;
let NativeBannerAdSize: any = null;

if (Platform.OS !== 'web') {
  const adsModule = requireNativeModule('react-native-google-mobile-ads');
  NativeBannerAd = adsModule.BannerAd;
  NativeBannerAdSize = adsModule.BannerAdSize;
}

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
