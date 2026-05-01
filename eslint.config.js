// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // React Native <Text> content doesn't need HTML entity escaping; this rule is noisy and was failing `expo lint`.
      "react/no-unescaped-entities": "off",
    },
  }
]);
