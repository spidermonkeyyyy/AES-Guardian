const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const androidPathPattern = /[\\/]android[\\/].*/;

const config = {
  resolver: {
    blockList: new RegExp(
      `${defaultConfig.resolver.blockList.source}|${androidPathPattern.source}`,
      defaultConfig.resolver.blockList.flags,
    ),
    unstable_enablePackageExports: true,
  },
};

module.exports = mergeConfig(defaultConfig, config);
