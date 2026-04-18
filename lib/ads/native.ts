import mobileAds, {
  MaxAdContentRating,
  TestIds,
} from "react-native-google-mobile-ads";

export async function initializeMobileAds() {
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.T,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
    testDeviceIdentifiers: ["EMULATOR"],
  });

  await mobileAds().initialize();
}

export function getAdaptiveBannerTestId() {
  return TestIds.ADAPTIVE_BANNER;
}
