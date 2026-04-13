const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

// Prefer React Native export conditions on web to avoid ESM packages that rely on import.meta.
config.resolver.unstable_conditionsByPlatform = {
    ...(config.resolver.unstable_conditionsByPlatform || {}),
    web: ['react-native', 'browser'],
};

module.exports = withNativeWind(config, { input: './global.css' })
