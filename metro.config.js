// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bump this string whenever Metro gets a "duplicate package" error to force
// a full resolver cache flush without touching package.json.
config.cacheVersion = '1';

module.exports = config;
