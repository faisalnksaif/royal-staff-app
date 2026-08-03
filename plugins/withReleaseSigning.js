const { withAppBuildGradle } = require("@expo/config-plugins")

// expo prebuild regenerates android/app/build.gradle from scratch every
// time, wiping any hand edits — so the release signing config (pointing at
// keystores/release.keystore, kept outside android/ so it survives
// prebuild) is injected here instead. Credentials live in
// signing.properties at the repo root (gitignored), read via Properties so
// the password never ends up committed in build.gradle.
//
// If signing.properties is missing, release falls back to the debug
// keystore (Expo's default template behavior) so prebuild still works
// without it — it just won't be a properly signed production build.

const DEBUG_SIGNING_CONFIG = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`

const SIGNING_CONFIGS_WITH_RELEASE = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (signingProps != null) {
                storeFile file(signingProps["RELEASE_STORE_FILE"])
                storePassword signingProps["RELEASE_STORE_PASSWORD"]
                keyAlias signingProps["RELEASE_KEY_ALIAS"]
                keyPassword signingProps["RELEASE_KEY_PASSWORD"]
            }
        }
    }`

const RELEASE_DEBUG_SIGNING_LINE = `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`

const RELEASE_SIGNING_LINE = `        release {
            signingConfig signingProps != null ? signingConfigs.release : signingConfigs.debug`

const PROPS_LOADER = `def signingPropsFile = rootProject.file("../signing.properties")
def signingProps = null
if (signingPropsFile.exists()) {
    signingProps = new Properties()
    signingProps.load(new FileInputStream(signingPropsFile))
}

`

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents

    if (!contents.includes("signingPropsFile")) {
      contents = PROPS_LOADER + contents
    }

    if (contents.includes(DEBUG_SIGNING_CONFIG)) {
      contents = contents.replace(DEBUG_SIGNING_CONFIG, SIGNING_CONFIGS_WITH_RELEASE)
    }

    if (contents.includes(RELEASE_DEBUG_SIGNING_LINE)) {
      contents = contents.replace(RELEASE_DEBUG_SIGNING_LINE, RELEASE_SIGNING_LINE)
    }

    config.modResults.contents = contents
    return config
  })
}

module.exports = withReleaseSigning
