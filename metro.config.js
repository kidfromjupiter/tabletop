// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getDefaultConfig(__dirname);

// Tell Metro that `.lottie` files are valid assets so we can do require("./foo.lottie")
config.resolver.assetExts = [...config.resolver.assetExts, "lottie"];

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});
