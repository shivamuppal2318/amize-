# Release Readiness

This repo is closer to store submission than it was, but it is not release-ready by default.

## Showing An APK Today

Yes, a demo APK path exists now.

Use the internal Android APK profile, not the store profile:

```bash
npm run typecheck
npm run release:check
npm run android:export-check
eas build --platform android --profile showcase
```

Why `showcase`:

- it produces an `apk`, not an `aab`
- it uses internal distribution
- it avoids mixing today's demo build with the real store release profile

What this does not mean:

- it is not the Play Store submission build
- it still depends on valid EAS login, credentials, and remote build access
- backend production env must still be pointed at a working API if this APK is meant to demo real backend features

## Config Completed

- `app.json` app version aligned to `1.0.1`
- `app.json` runtime version policy added
- `app.json` OTA updates behavior defined
- `app.json` iOS `buildNumber` added
- `app.json` Android `versionCode` added
- `eas.json` preview channel added
- `eas.json` production channel added
- `eas.json` production distribution set to `store`
- `eas.json` production Android build set to `app-bundle`
- `npm run release:audit` now fails on placeholder social IDs and test AdMob IDs
- `npm run release:audit` also fails when site/api/socket release URLs are missing
- `npm run release:check` now runs typecheck plus the release audit
- live create entry is now hidden by default until `EXPO_ENABLE_LIVE_STREAMING=true`
- AdMob app IDs can now be injected through `EXPO_ADMOB_ANDROID_APP_ID` and `EXPO_ADMOB_IOS_APP_ID`
- root `.env.release.example` now lists the mobile release env values that still need to be filled
- `docs/play-store-submission.md` now lists the final Play Store submission steps

## Demo Coverage Implemented

These features are now implemented for local demo and preview mode. They are still
not full production implementations, but you can show working flows:

- Live streaming backend stub + live session preview/controls
  - Backend: `amize-next-master/app/api/live/**`, `amize-next-master/lib/live/**`
  - App: `app/live/index.tsx`, `app/live/streaming.tsx`, `hooks/useLiveSession.ts`
- Nearby/location backend + UI
  - Backend: `amize-next-master/app/api/explore/nearby/route.ts`
  - App: `app/(tabs)/nearby.tsx`, `lib/api/nearbyService.ts`
- Subscription flows (plans, subscribe, billing view, cancel)
  - Backend: `amize-next-master/app/api/subscriptions/**`, `amize-next-master/app/api/subscription-plans/**`
  - App: `app/(tabs)/settings/premium.tsx`, `components/VideoFeed/partial/UserProfileModal.tsx`
- Admin analytics/reports UI
  - Backend: `amize-next-master/app/api/admin/overview`, `amize-next-master/app/api/admin/reports`
  - App: `app/(tabs)/settings/admin-overview.tsx`, `app/(tabs)/settings/admin-reports.tsx`

## Current Production Readiness

### Partially Done

- Social login: Google/Facebook/Apple exist in UI and partial flows, but production configuration and device validation still need finalization.
- Video creation tools: upload flow exists, but full production-grade camera/editing stack is not complete.
- Subscription payments: flows and APIs exist, but full real payment lifecycle across all platforms is not fully hardened.
- Live feature: frontend/live socket groundwork exists, but not a full production live streaming stack.
- Wallet/earnings: core routes and UI exist, but real payment settlement, ledger hardening, and finance ops are still incomplete.
- Notifications: infrastructure exists, but web/device parity and full production delivery are not fully complete.
- Admin features: admin overview and report moderation UI exist, but full operational tooling and production data coverage still need completion.
- Web demo compatibility: much better now, but this app is still primarily a mobile app, so some native features only degrade gracefully rather than fully working on web.

### Still Missing Or Not Actually Production-Ready

- Real live streaming backend and media transport.
- Real AdMob production integration with live ad unit rollout.
- Full store deployment readiness for Play Store/App Store submission.

## Manual Release Blockers

- Verify Android release signing and upload key usage
- Add final iOS production credentials and App Store Connect submission settings
- Run `expo doctor` and a full production build successfully
- Validate notification credentials for production, not only development
- Review all permission prompts against the final product behavior
- Replace any placeholder social login flows before submission
- Remove or complete preview-only live features before store review
- Replace placeholder ad slots with a real ad SDK or remove them
- Run QA on Android and iOS release builds
- Prepare store metadata, screenshots, privacy labels, and support URLs

## Backend Deploy Readiness

Backend VPS deploy artifacts now exist:

- `amize-next-master/ecosystem.config.cjs`
- `amize-next-master/.env.production.example`
- `amize-next-master/scripts/check-health.mjs`
- `docs/vps-deploy.md`

Backend health endpoints now exist on the custom server:

- `GET /health`
- `GET /healthz`
- `GET /ready`

## Suggested Commands

```bash
npm run release:check
npm run release:android:preflight
npm run release:audit:android-core
eas build --platform android --profile showcase
eas build --platform android --profile preview
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

Notes:

- `release:check` remains strict and expects all release providers (including iOS/social/ad IDs) to be configured.
- `release:android:preflight` now uses Android core gating so Android export/build checks can proceed while optional iOS-only integrations are still pending.

## Real Build QA

Use `docs/release-qa-checklist.md` for the physical-device pass.

The intended Android release path is now:

1. `npm run release:android:preflight`
2. `npx eas build --platform android --profile production`
3. test the generated release build on a real Android device
4. complete `docs/release-qa-checklist.md`
5. `npx eas submit --platform android --profile production`

The `submit.production` profile is configured to target the Play Console `internal` track first with `draft` release status. That is deliberate: the first upload should be review-safe and reversible.
