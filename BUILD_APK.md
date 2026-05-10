# Build an Android APK (Expo / EAS)

This repo already contains `eas.json` with `android.buildType: "apk"` for `preview` / `development` profiles.

## 1) Never put Expo tokens in app code

Expo account auth uses an **Expo access token** (usually provided via the `EXPO_TOKEN` environment variable for CI). It should **not** be checked into git or referenced in the React Native app at runtime.

If you accidentally committed a token, rotate/revoke it in your Expo account and remove it from git history.

## 2) Local build (interactive)

From `Amize/Amize`:

```bash
npm ci
npx eas-cli login
npm run eas:apk:preview
```

## 3) CI build (non-interactive)

Set `EXPO_TOKEN` in your CI secrets, then run:

```bash
npm ci
npm run eas:apk:preview:ci
```

## 4) Convenience PowerShell script

From `Amize/Amize`:

```powershell
.\scripts\build-apk.ps1
```

