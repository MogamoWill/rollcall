const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix import.meta.env usage by Zustand on web
// Metro doesn't support import.meta natively, causing "Cannot use import.meta outside a module"
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer?.minifierConfig,
  },
};

// Replace import.meta.env references in the bundle
config.serializer = {
  ...config.serializer,
  getPolyfills: () => {
    const polyfills = config.serializer?.getPolyfills?.() ?? [];
    return polyfills;
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
