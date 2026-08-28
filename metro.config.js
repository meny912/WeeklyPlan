// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bump this string whenever Metro gets a "duplicate package" or "missing module"
// error to force a full resolver cache flush without touching package.json.
// Bumped to pick up the new constants/learning/* offline-text modules.
config.cacheVersion = '3';

module.exports = config;
