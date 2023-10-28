// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true
});

// const defaultAssetExts =
//   require("metro-config/src/defaults/defaults").assetExts;

// Expo 49 issue: default metro config needs to include "mjs"
// https://github.com/expo/expo/issues/23180
config.resolver.sourceExts.push("mjs");

// config.resolver.assetExts.push(...defaultAssetExts);
// config.resolver.assetExts.push("bin"); // whisper.rn: ggml model binary
// config.resolver.assetExts.push("mil"); // whisper.rn: CoreML model asset
// config.resolver.assetExts.push("gguf"); // llama.rn: ggml model

module.exports = config;
