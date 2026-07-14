# EAS Native Release Checklist (iOS + Android)

This checklist covers credentials, build, and submission for the mobile app in `apps/mobile`.

## 1. Preflight

1. Confirm EAS auth and project binding:
   - `cd /workspaces/ThePlayroom/apps/mobile`
   - `pnpm dlx eas-cli@latest whoami`
   - `pnpm dlx eas-cli@latest project:info`
2. Confirm app identifiers in app config:
   - iOS bundle id: `pt.theplayroom.app`
   - Android package: `pt.theplayroom.app`
3. Confirm EAS profiles:
   - `development`, `preview`, `production` in `apps/mobile/eas.json`.

## 2. Environment Variables (EAS)

Use EAS environments and avoid runtime secrets in the client app.

1. Required runtime public vars (embedded in app):
   - `EXPO_PUBLIC_API_URL`
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. Create variables per environment:
   - `pnpm dlx eas-cli@latest env:create --environment development --name EXPO_PUBLIC_API_URL --value https://www.theplayroom.pt --visibility public`
   - `pnpm dlx eas-cli@latest env:create --environment development --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value <pk_test_or_live> --visibility public`
   - `pnpm dlx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://www.theplayroom.pt --visibility public`
   - `pnpm dlx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value <pk_test_or_live> --visibility public`
   - `pnpm dlx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_API_URL --value https://www.theplayroom.pt --visibility public`
   - `pnpm dlx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value <pk_live> --visibility public`
3. Inspect envs:
   - `pnpm dlx eas-cli@latest env:list --environment development`
   - `pnpm dlx eas-cli@latest env:list --environment preview`
   - `pnpm dlx eas-cli@latest env:list --environment production`

## 3. Android Signing Credentials

1. Open credentials manager:
   - `pnpm dlx eas-cli@latest credentials --platform android`
2. Recommended for first setup:
   - Let EAS generate and manage Android keystore.
3. If you already have a keystore:
   - Upload existing keystore in the credentials flow.
4. Backup policy:
   - Export/download keystore metadata and store in secure vault.

## 4. iOS Signing Credentials

1. Prerequisites:
   - Apple Developer account with access to App Store Connect.
   - App identifier `pt.theplayroom.app` available.
2. Open iOS credentials manager:
   - `pnpm dlx eas-cli@latest credentials --platform ios`
3. Recommended for first setup:
   - Let EAS manage Distribution Certificate and Provisioning Profile.
4. If reusing existing credentials:
   - Upload/import certificate and provisioning profile in flow.

## 5. Build Commands

Run from `apps/mobile`.

1. Preview (internal QA):
   - Android APK: `pnpm dlx eas-cli@latest build --profile preview --platform android`
   - iOS simulator build: `pnpm dlx eas-cli@latest build --profile preview --platform ios`
2. Production artifacts:
   - Android AAB: `pnpm dlx eas-cli@latest build --profile production --platform android`
   - iOS IPA: `pnpm dlx eas-cli@latest build --profile production --platform ios`

Optional CI mode:
- Add `--non-interactive` to each build command.

## 5.1 One-Command Release Script

From `apps/mobile`, you can use the helper script:

1. Preview builds (Android + iOS):
   - `pnpm run eas:preview`
2. Preview Android only:
   - `pnpm run eas:preview:android`
3. Preview iOS only:
   - `pnpm run eas:preview:ios`
4. Production builds (Android + iOS):
   - `pnpm run eas:production`
5. Production with submit (Android + iOS):
   - `pnpm run eas:production:submit`

Underlying script path:
- `apps/mobile/scripts/eas-release.sh`

## 6. Store Submission

1. Configure submit credentials first:
   - `pnpm dlx eas-cli@latest submit --platform android --latest --profile production`
   - `pnpm dlx eas-cli@latest submit --platform ios --latest --profile production`
2. For later submissions:
   - Android: `pnpm dlx eas-cli@latest submit --platform android --latest --profile production --non-interactive`
   - iOS: `pnpm dlx eas-cli@latest submit --platform ios --latest --profile production --non-interactive`

## 7. Release Verification

1. Confirm build details:
   - `pnpm dlx eas-cli@latest build:list --limit 10`
2. Confirm submission details:
   - `pnpm dlx eas-cli@latest submission:list --limit 10`
3. Runtime smoke tests on binaries:
   - Auth with Clerk.
   - API reachability (`EXPO_PUBLIC_API_URL`).
   - Push token registration flow.
   - Deep links and critical routes.

## 8. Common Failure Recovery

1. iOS provisioning/certificate drift:
   - Re-run `eas credentials --platform ios` and regenerate managed credentials.
2. Android signing mismatch:
   - Ensure the same keystore is retained for existing Play listing.
3. Missing env at runtime:
   - Validate EAS environment mapping and rebuild.
4. App Store Connect access errors:
   - Verify Apple role permissions and app-level access.

## 9. Security Rules

1. Never put server secrets in `EXPO_PUBLIC_*`.
2. Keep signing assets in managed EAS credentials or secure vault backups.
3. Limit App Store Connect and Play Console admin access by least privilege.
