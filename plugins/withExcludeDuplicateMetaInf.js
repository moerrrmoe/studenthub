const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Config plugin that excludes duplicate META-INF files from Android packaging.
 * Fixes: "2 files found with path 'META-INF/versions/9/OSGI-INF/MANIFEST.MF'"
 * caused by jspecify and okhttp3 logging-interceptor both including the same file.
 */
const withExcludeDuplicateMetaInf = (config) => {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Check if packaging block already exists
    if (buildGradle.includes("META-INF/versions/9/OSGI-INF/MANIFEST.MF")) {
      return config;
    }

    // Add packaging exclusion inside the android block
    const androidBlockRegex = /android\s*\{/;
    if (androidBlockRegex.test(buildGradle)) {
      config.modResults.contents = buildGradle.replace(
        androidBlockRegex,
        `android {
    packaging {
        resources {
            excludes += "META-INF/versions/9/OSGI-INF/MANIFEST.MF"
        }
    }`
      );
    }

    return config;
  });
};

module.exports = withExcludeDuplicateMetaInf;
