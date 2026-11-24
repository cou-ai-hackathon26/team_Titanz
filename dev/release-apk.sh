#!/usr/bin/env bash
# Waits for an EAS (Expo) Android build to finish, downloads the APK and publishes it as a GitHub Release.
# Usage:  bash dev/release-apk.sh <eas-build-id> <tag>        e.g.  bash dev/release-apk.sh 7b1cfc1d-... v1.1
# Needs: logged in to EAS (npx eas-cli whoami) and GitHub CLI (gh auth status). Run from the repo root.
set -euo pipefail

BUILD_ID="${1:?give the EAS build id}"
TAG="${2:?give a release tag, e.g. v1.1}"
APK="$(mktemp -d)/roza-safe-${TAG}.apk"

echo "Waiting for EAS build ${BUILD_ID} ..."
while true; do
  STATUS=$(npx --yes eas-cli build:view "$BUILD_ID" --json 2>/dev/null | python3 -c "import json,sys;print(json.load(sys.stdin)['status'])")
  case "$STATUS" in
    FINISHED) break ;;
    ERRORED|CANCELED) echo "Build ${STATUS}, nothing to release." >&2; exit 1 ;;
    *) sleep 40 ;;
  esac
done

URL=$(npx --yes eas-cli build:view "$BUILD_ID" --json 2>/dev/null | python3 -c "import json,sys;print(json.load(sys.stdin)['artifacts']['buildUrl'])")
COMMIT=$(npx --yes eas-cli build:view "$BUILD_ID" --json 2>/dev/null | python3 -c "import json,sys;print((json.load(sys.stdin).get('gitCommitHash') or '')[:7])")
echo "Downloading ${URL}"
curl -sL -o "$APK" "$URL"
file "$APK" | grep -q "Zip archive" || { echo "Download is not an APK" >&2; exit 1; }

NOTES="Roza-Safe ${TAG} — Android APK built on Expo (build ${BUILD_ID}${COMMIT:+, commit ${COMMIT}}).

Install: download roza-safe-${TAG}.apk on an Android phone and open it. Allow \"install unknown apps\"; if Play Protect warns, tap More details → Install anyway.

Screening support only — not a doctor, no dose advice."

gh release create "$TAG" "$APK" --title "Roza-Safe ${TAG}" --notes "$NOTES" --target main
echo "Released: $(gh release view "$TAG" --json url -q .url)"
