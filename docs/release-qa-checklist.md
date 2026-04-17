# Release QA Checklist

Run this on a physical Android release build after:

```bash
npm run release:android:preflight
npx eas build --platform android --profile production
```

Use this as a pass/fail sheet for the exact build you plan to upload.

## Build Details

- Build date:
- Build profile: `production`
- Version name:
- Version code:
- Backend base URL:
- Payment provider:
- AdMob enabled:
- Live streaming enabled:
- Device model:
- Android version:

## Blocking Checks

- [ ] App installs successfully from the generated release artifact
- [ ] App launches without crash on cold start
- [ ] Splash screen clears and first route loads correctly
- [ ] No development menu, debug banner, or preview-only surfaces appear
- [ ] Live entry is hidden unless intentionally enabled for this release
- [ ] No test AdMob ids, fake social login buttons, or mock payment labels are visible

## Auth

- [ ] Email sign up works
- [ ] Email sign in works
- [ ] Sign out works
- [ ] Password reset flow works
- [ ] Session survives app restart
- [ ] Following tab does not bounce into broken retry state after login
- [ ] Google login works on release build if enabled
- [ ] Facebook login works on release build if enabled

## Feed And Discovery

- [ ] For You feed loads
- [ ] Following feed loads or shows a clean empty state
- [ ] Search works
- [ ] Nearby screen loads without crash
- [ ] Nearby screen handles permission denial cleanly

## Creation

- [ ] Create modal opens correctly for authenticated users
- [ ] Post flow works
- [ ] Story flow works
- [ ] Upload completes and created content appears in the app

## Messaging And Notifications

- [ ] Inbox loads
- [ ] One-to-one chat works
- [ ] Notification settings screen saves values
- [ ] Push token registration works on release build if backend credentials are configured

## Wallet / Premium

- [ ] Wallet screen loads
- [ ] Coin top-up flow behaves correctly for the configured provider
- [ ] Gift settlement works
- [ ] Withdrawal request validates amount and payout details correctly
- [ ] Premium screen loads

## Profile And Settings

- [ ] Profile screen loads
- [ ] Follow and unfollow work
- [ ] Edit profile saves
- [ ] Privacy, Terms, and Support links open real URLs
- [ ] Data export flow does not crash

## Admin

- [ ] Admin overview loads for admin account
- [ ] Admin withdrawals screen loads
- [ ] Admin reports screen loads

## Release Decision

- [ ] Passed for Play Console internal track
- [ ] Blocked from submission

## Notes

- Blocking issue 1:
- Blocking issue 2:
- Non-blocking issue:

