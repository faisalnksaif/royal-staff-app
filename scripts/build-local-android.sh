#!/usr/bin/env bash
# Build a release APK locally, without EAS.
#
# Usage:
#   ./scripts/build-local-android.sh                # prebuild + assembleRelease (APK, all ABIs)
#   ./scripts/build-local-android.sh --bundle        # prebuild + bundleRelease (AAB, for Play Store)
#   ./scripts/build-local-android.sh --no-prebuild   # skip `expo prebuild`, build android/ as-is
#   ./scripts/build-local-android.sh --arm64-only    # build only for arm64-v8a — faster build,
#                                                     # much smaller APK, fine for most real devices
#   ./scripts/build-local-android.sh --shrink        # enable R8 minify + resource shrinking —
#                                                     # smaller output, but a slower build
#   ./scripts/build-local-android.sh --production    # real production build: all ABIs + --shrink,
#                                                     # signed with keystores/release.keystore
#
# Requires: Android SDK installed and ANDROID_HOME set, JDK. Release builds
# are signed with keystores/release.keystore via signing.properties (repo
# root, gitignored) — see plugins/withReleaseSigning.js. If that file is
# missing, release falls back to the debug keystore (not suitable for
# distribution).

set -euo pipefail
cd "$(dirname "$0")/.."

TASK="assembleRelease"
SKIP_PREBUILD=false
ARM64_ONLY=false
SHRINK=false

for arg in "$@"; do
  case "$arg" in
    --bundle) TASK="bundleRelease" ;;
    --no-prebuild) SKIP_PREBUILD=true ;;
    --arm64-only) ARM64_ONLY=true ;;
    --shrink) SHRINK=true ;;
    --production) SHRINK=true ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

if [ -z "${ANDROID_HOME:-}" ]; then
  echo "ANDROID_HOME is not set. Install the Android SDK and set ANDROID_HOME first." >&2
  exit 1
fi

if [ "$SHRINK" = true ] && [ ! -f "signing.properties" ]; then
  echo "WARNING: signing.properties not found — this build will be signed with the debug keystore, not suitable for distribution." >&2
fi

if [ "$SKIP_PREBUILD" = false ]; then
  echo "==> Regenerating android/ from current config and dependencies (expo prebuild --clean)"
  npx expo prebuild --platform android --clean
else
  echo "==> Skipping prebuild, using existing android/ as-is"
fi

GRADLE_ARGS=()

if [ "$ARM64_ONLY" = true ]; then
  echo "==> Restricting build to arm64-v8a only"
  GRADLE_ARGS+=("-PreactNativeArchitectures=arm64-v8a")
fi

if [ "$SHRINK" = true ]; then
  echo "==> Enabling R8 minify + resource shrinking (slower build, smaller output)"
  GRADLE_ARGS+=("-Pandroid.enableMinifyInReleaseBuilds=true" "-Pandroid.enableShrinkResourcesInReleaseBuilds=true")
fi

echo "==> Running Gradle: $TASK ${GRADLE_ARGS[*]}"
cd android
./gradlew "$TASK" "${GRADLE_ARGS[@]}"
cd ..

if [ "$TASK" = "assembleRelease" ]; then
  OUT=$(find android/app/build/outputs/apk/release -name "*.apk" 2>/dev/null | head -1)
else
  OUT=$(find android/app/build/outputs/bundle/release -name "*.aab" 2>/dev/null | head -1)
fi

echo "==> Build complete"
if [ -n "$OUT" ]; then
  echo "Output: $OUT"
  du -h "$OUT" 2>/dev/null | awk '{print "Size: " $1}'
else
  echo "Build finished but output file wasn't found at the expected path — check android/app/build/outputs/ manually."
fi
