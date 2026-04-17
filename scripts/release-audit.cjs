const appJson = require("../app.json");
const appConfigFactory = require("../app.config.js");

const TEST_ADMOB_APP_IDS = new Set([
  "ca-app-pub-3940256099942544~3347511713",
  "ca-app-pub-3940256099942544~1458002511",
]);

const resolvedConfig = appConfigFactory({ config: appJson.expo });
const extra = resolvedConfig.extra || {};
const plugins = resolvedConfig.plugins || [];
const cliArgs = process.argv.slice(2);

const getArgValue = (name, fallback = "") => {
  const prefixed = `--${name}=`;
  const direct = cliArgs.find((arg) => arg.startsWith(prefixed));
  if (direct) {
    return direct.slice(prefixed.length).trim();
  }

  const flagIndex = cliArgs.findIndex((arg) => arg === `--${name}`);
  if (flagIndex >= 0 && cliArgs[flagIndex + 1]) {
    return String(cliArgs[flagIndex + 1]).trim();
  }

  return fallback;
};

const releasePlatform = (getArgValue("platform", "all") || "all").toLowerCase();
const strictMode = !cliArgs.includes("--core");

const isNonPlaceholderValue = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const upper = trimmed.toUpperCase();
  return !(
    upper.includes("YOUR_") ||
    upper.includes("REPLACE_") ||
    upper.includes("EXAMPLE")
  );
};

const getAdMobPluginConfig = () => {
  const plugin = plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === "react-native-google-mobile-ads"
  );

  return Array.isArray(plugin) ? plugin[1] || {} : {};
};

const isHttpsUrl = (value) =>
  typeof value === "string" && /^https:\/\/.+/i.test(value.trim());

const failures = [];
const warnings = [];

const admobPluginConfig = getAdMobPluginConfig();

if (!isNonPlaceholderValue(extra.facebookAppId)) {
  if (strictMode) {
    failures.push("Facebook App ID is missing or still a placeholder.");
  } else {
    warnings.push("Facebook App ID is missing. Facebook login will stay disabled.");
  }
}

if (!isNonPlaceholderValue(extra.googleAndroidClientId)) {
  if (releasePlatform === "android" || strictMode) {
    failures.push("Google Android client ID is missing or still a placeholder.");
  } else {
    warnings.push("Google Android client ID is missing.");
  }
}

if (!isNonPlaceholderValue(extra.googleIosClientId)) {
  if (releasePlatform === "ios" || strictMode) {
    failures.push("Google iOS client ID is missing or still a placeholder.");
  } else {
    warnings.push("Google iOS client ID is missing.");
  }
}

if (
  !isNonPlaceholderValue(admobPluginConfig.androidAppId) ||
  TEST_ADMOB_APP_IDS.has(admobPluginConfig.androidAppId)
) {
  if (strictMode) {
    failures.push("AdMob Android app ID is missing or still using the Google test app ID.");
  } else {
    warnings.push("AdMob Android app ID is missing/test. Ads should remain disabled.");
  }
}

if (
  !isNonPlaceholderValue(admobPluginConfig.iosAppId) ||
  TEST_ADMOB_APP_IDS.has(admobPluginConfig.iosAppId)
) {
  if (strictMode && releasePlatform !== "android") {
    failures.push("AdMob iOS app ID is missing or still using the Google test app ID.");
  } else {
    warnings.push("AdMob iOS app ID is missing/test. iOS ads should remain disabled.");
  }
}

if (!isNonPlaceholderValue(extra.admobExploreBannerId)) {
  if (strictMode) {
    failures.push("Explore banner AdMob unit ID is missing.");
  } else {
    warnings.push("Explore banner AdMob unit ID is missing.");
  }
}

if (!isNonPlaceholderValue(extra.admobNearbyBannerId)) {
  if (strictMode) {
    failures.push("Nearby banner AdMob unit ID is missing.");
  } else {
    warnings.push("Nearby banner AdMob unit ID is missing.");
  }
}

if (!isNonPlaceholderValue(extra.supportEmail) || !String(extra.supportEmail).includes("@")) {
  failures.push("Support email is missing or invalid.");
}

if (!isHttpsUrl(extra.privacyPolicyUrl)) {
  failures.push("Privacy policy URL is missing or not HTTPS.");
}

if (!isHttpsUrl(extra.termsOfServiceUrl)) {
  failures.push("Terms of service URL is missing or not HTTPS.");
}

if (!isHttpsUrl(extra.siteUrl)) {
  failures.push("Site URL is missing or not HTTPS.");
}

if (!isHttpsUrl(extra.apiUrl)) {
  failures.push("API URL is missing or not HTTPS.");
}

if (
  typeof extra.socketUrl !== "string" ||
  !/^wss:\/\/.+/i.test(extra.socketUrl.trim())
) {
  failures.push("Socket URL is missing or not WSS.");
}

if (!extra.eas || !isNonPlaceholderValue(extra.eas.projectId)) {
  failures.push("EAS projectId is missing.");
}

if (String(extra.enableLiveStreaming).toLowerCase() === "true") {
  warnings.push(
    "Live streaming is enabled for this build. Only do this when production transport and moderation are ready."
  );
}

if (failures.length > 0) {
  console.error("Release audit failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  if (warnings.length > 0) {
    warnings.forEach((warning) => console.warn(`! ${warning}`));
  }
  process.exit(1);
}

console.log("Release audit passed.");
if (warnings.length > 0) {
  warnings.forEach((warning) => console.warn(`! ${warning}`));
}
