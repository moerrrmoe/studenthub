// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('html');
config.resolver.assetExts.push('ttf');

module.exports = withUniwindConfig(config, {
    cssEntryFile: './global.css',
});

