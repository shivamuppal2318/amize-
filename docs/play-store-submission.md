# Play Store Submission Checklist

Use this after Android preflight passes and the backend is deployed.

Recommended flow:

1. Run `npm run release:android:preflight`
2. Build the Android store bundle with `npx eas build --platform android --profile production`
3. Run the manual checklist in [`docs/release-qa-checklist.md`](./release-qa-checklist.md) against the real release build
4. Submit first to the Play Console `internal` track
5. Promote only after release-build QA passes

## Mobile Config

- Fill the values in `.env.release.example`
- confirm `EXPO_FACEBOOK_APP_ID` is real
- confirm `EXPO_GOOGLE_ANDROID_CLIENT_ID` is real
- confirm `EXPO_GOOGLE_IOS_CLIENT_ID` is real if iOS release is planned
- confirm `EXPO_ADMOB_ANDROID_APP_ID` and `EXPO_ADMOB_IOS_APP_ID` are real
- confirm `EXPO_PUBLIC_ADMOB_EXPLORE_BANNER_ID` and `EXPO_PUBLIC_ADMOB_NEARBY_BANNER_ID` are real
- keep `EXPO_ENABLE_LIVE_STREAMING=false` unless live transport is truly production-ready

## Backend

- deploy `amize-next-master` with `.env.production`
- run database migrations
- run `npm run health:check` inside `amize-next-master`
- verify `/health` and `/ready` return `200`

## Release Build

- run `npm run release:android:preflight`
- optional strict full-audit pass: `npm run release:check`
- run `eas build --platform android --profile production`
- verify the generated build is an `.aab`
- install and test a release build on a physical device before submission
- keep the first submission on `internal` track and `draft` release status

## QA Pass

- complete every item in `docs/release-qa-checklist.md`
- sign in with email/password
- test Google and Facebook login
- verify `For You` and `Following`
- create a post
- create a story
- open wallet and premium
- verify notifications registration
- verify nearby screen
- verify messaging and profile flows

## Play Console

- confirm upload key / signing config
- upload the production `.aab`
- submit first to `internal` testing
- complete store listing text
- upload screenshots and feature graphic
- complete Data safety
- complete app content questionnaires
- verify privacy policy URL
- verify support email
- add tester notes if any feature is intentionally disabled

## Do Not Submit Until

- release audit passes with no placeholder values
- backend health check passes
- live is either fully production-ready or kept disabled
- ads are using real production IDs
- social login works on the release build
