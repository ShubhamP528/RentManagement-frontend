const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {withNativeWind} = require('nativewind/metro');

const defaultConfig = getDefaultConfig(__dirname);
const customConfig = {
  // Add any custom configurations here
};

const config = mergeConfig(defaultConfig, customConfig);

module.exports = withNativeWind(config, {input: './global.css'});
