const appJson = require('./app.json');

const facebookAppId =
  process.env.FACEBOOK_APP_ID ||
  process.env.EXPO_FACEBOOK_APP_ID ||
  appJson.expo.extra?.facebookAppId ||
  "";

const googleWebClientId =
  process.env.GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_GOOGLE_WEB_CLIENT_ID ||
  appJson.expo.extra?.googleWebClientId ||
  "";

const googleAndroidClientId =
  process.env.GOOGLE_ANDROID_CLIENT_ID ||
  process.env.EXPO_GOOGLE_ANDROID_CLIENT_ID ||
  appJson.expo.extra?.googleAndroidClientId ||
  "";

const googleIosClientId =
  process.env.GOOGLE_IOS_CLIENT_ID ||
  process.env.EXPO_GOOGLE_IOS_CLIENT_ID ||
  appJson.expo.extra?.googleIosClientId ||
  "";

const admobAndroidAppId =
  process.env.ADMOB_ANDROID_APP_ID ||
  process.env.EXPO_ADMOB_ANDROID_APP_ID ||
  appJson.expo.extra?.admobAndroidAppId ||
  "";

const admobIosAppId =
  process.env.ADMOB_IOS_APP_ID ||
  process.env.EXPO_ADMOB_IOS_APP_ID ||
  appJson.expo.extra?.admobIosAppId ||
  "";

const admobExploreBannerId =
  process.env.ADMOB_EXPLORE_BANNER_ID ||
  process.env.EXPO_ADMOB_EXPLORE_BANNER_ID ||
  process.env.EXPO_PUBLIC_ADMOB_EXPLORE_BANNER_ID ||
  appJson.expo.extra?.admobExploreBannerId ||
  "";

const admobNearbyBannerId =
  process.env.ADMOB_NEARBY_BANNER_ID ||
  process.env.EXPO_ADMOB_NEARBY_BANNER_ID ||
  process.env.EXPO_PUBLIC_ADMOB_NEARBY_BANNER_ID ||
  appJson.expo.extra?.admobNearbyBannerId ||
  "";

const supportEmail =
  process.env.SUPPORT_EMAIL ||
  process.env.EXPO_SUPPORT_EMAIL ||
  appJson.expo.extra?.supportEmail ||
  "";

const privacyPolicyUrl =
  process.env.PRIVACY_POLICY_URL ||
  process.env.EXPO_PRIVACY_POLICY_URL ||
  appJson.expo.extra?.privacyPolicyUrl ||
  "";

const termsOfServiceUrl =
  process.env.TERMS_OF_SERVICE_URL ||
  process.env.EXPO_TERMS_OF_SERVICE_URL ||
  appJson.expo.extra?.termsOfServiceUrl ||
  "";

const siteUrl =
  process.env.SITE_URL ||
  process.env.EXPO_PUBLIC_SITE_URL ||
  process.env.APP_BASE_URL ||
  appJson.expo.extra?.siteUrl ||
  "https://amize-next.onrender.com";

const apiUrl =
  process.env.API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  appJson.expo.extra?.apiUrl ||
  `${siteUrl.replace(/\/+$/, "")}/api`;

const socketUrl =
  process.env.SOCKET_URL ||
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  appJson.expo.extra?.socketUrl ||
  siteUrl.replace(/^http/i, "ws");

const enableLiveStreaming =
  process.env.ENABLE_LIVE_STREAMING ||
  process.env.EXPO_ENABLE_LIVE_STREAMING ||
  appJson.expo.extra?.enableLiveStreaming ||
  false;

const demoMode =
  process.env.EXPO_PUBLIC_DEMO_MODE ||
  appJson.expo.extra?.demoMode ||
  false;

const plugins = (appJson.expo.plugins || []).map((plugin) => {
  if (
    Array.isArray(plugin) &&
    plugin[0] === "react-native-google-mobile-ads"
  ) {
    return [
      plugin[0],
      {
        ...plugin[1],
        androidAppId: admobAndroidAppId || plugin[1]?.androidAppId || "",
        iosAppId: admobIosAppId || plugin[1]?.iosAppId || "",
      },
    ];
  }

  return plugin;
});

module.exports = ({ config }) => {
  return {
    ...config,
    ...appJson.expo,
    plugins,
    extra: {
      ...appJson.expo.extra,
      facebookAppId,
      googleWebClientId,
      googleAndroidClientId,
      googleIosClientId,
      admobAndroidAppId,
      admobIosAppId,
      admobExploreBannerId,
      admobNearbyBannerId,
      supportEmail,
      privacyPolicyUrl,
      termsOfServiceUrl,
      siteUrl,
      apiUrl,
      socketUrl,
      enableLiveStreaming,
      demoMode,
    },
  };
};
