#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <preview|production> [all|android|ios] [--submit]"
  exit 1
fi

PROFILE="$1"
PLATFORM="${2:-all}"
SUBMIT_FLAG="${3:-}"

if [[ "$PROFILE" != "preview" && "$PROFILE" != "production" ]]; then
  echo "Invalid profile: $PROFILE"
  echo "Allowed values: preview | production"
  exit 1
fi

if [[ "$PLATFORM" != "all" && "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
  echo "Invalid platform: $PLATFORM"
  echo "Allowed values: all | android | ios"
  exit 1
fi

if [[ "$PROFILE" == "preview" && "$SUBMIT_FLAG" == "--submit" ]]; then
  echo "Preview profile does not support store submission. Use production with --submit."
  exit 1
fi

if [[ "$PLATFORM" == "all" ]]; then
  echo "Running EAS build for profile=$PROFILE platform=android"
  pnpm dlx eas-cli@latest build --profile "$PROFILE" --platform android

  echo "Running EAS build for profile=$PROFILE platform=ios"
  pnpm dlx eas-cli@latest build --profile "$PROFILE" --platform ios

  if [[ "$PROFILE" == "production" && "$SUBMIT_FLAG" == "--submit" ]]; then
    echo "Submitting latest Android production build"
    pnpm dlx eas-cli@latest submit --platform android --latest --profile production

    echo "Submitting latest iOS production build"
    pnpm dlx eas-cli@latest submit --platform ios --latest --profile production
  fi

  exit 0
fi

echo "Running EAS build for profile=$PROFILE platform=$PLATFORM"
pnpm dlx eas-cli@latest build --profile "$PROFILE" --platform "$PLATFORM"

if [[ "$PROFILE" == "production" && "$SUBMIT_FLAG" == "--submit" ]]; then
  echo "Submitting latest $PLATFORM production build"
  pnpm dlx eas-cli@latest submit --platform "$PLATFORM" --latest --profile production
fi
