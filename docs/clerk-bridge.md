# Clerk Auth Bridge (App Uses Clerk, Backend Still Issues JWT)

Goal:
- Use Clerk for the user-facing sign-in flow (Google via Clerk on Android).
- Keep the rest of the app unchanged by exchanging the Clerk session token for your backend JWT.

This repo change only adds the **app-side** bridge call to `POST /api/auth/clerk`.
You must add the backend route on the VPS for it to work.

## App Side (Already Implemented Here)

1. Configure Clerk publishable key for the app:
   - Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `eas.json` (all profiles) or in your CI env.
   - Or set `expo.extra.clerkPublishableKey` in `app.json` (not recommended for production workflows).

2. Build:
   - `npm install --legacy-peer-deps`
   - `npm run typecheck`
   - `eas build --platform android --profile preview`

The app will:
- open `/(auth)/clerk`
- complete Google SSO via Clerk
- call `POST /api/auth/clerk` with `{ token }`
- store backend `token` + `refreshToken` and continue as normal

## Backend Side (VPS)

### 1) Add env var(s)
On the VPS (where `/var/www/amize-backend` runs), set:

```bash
CLERK_SECRET_KEY=sk_live_...
```

Optional but recommended:
- Keep `GOOGLE_CLIENT_IDS` as well if you still want native Google sign-in to work.

### 2) Install backend dependency
Your backend uses `npm` and has peer conflicts, so use legacy peer deps:

```bash
cd /var/www/amize-backend
npm install --legacy-peer-deps @clerk/backend
```

### 3) Create the route: `app/api/auth/clerk/route.ts`

Fastest/lowest-risk way:
1. Copy your existing file:
   `app/api/auth/google/route.ts`
2. Save as:
   `app/api/auth/clerk/route.ts`
3. Change ONLY the token verification block to use Clerk.

Minimal code you should add/replace inside the copied file:

```ts
import { createClerkClient, verifyToken } from "@clerk/backend";

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

async function getClerkEmailFromToken(token: string) {
  if (!clerkSecretKey || !clerkClient) {
    throw new Error("CLERK_SECRET_KEY is not set on the server");
  }

  const { sub } = await verifyToken(token, { secretKey: clerkSecretKey });
  if (!sub) {
    throw new Error("Invalid Clerk token (missing sub)");
  }

  const user = await clerkClient.users.getUser(sub);
  const primary =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ||
    user.emailAddresses[0];

  if (!primary?.emailAddress) {
    throw new Error("Clerk user has no email address");
  }

  return {
    clerkUserId: sub,
    email: primary.emailAddress,
    fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Clerk User",
    profilePhotoUrl: user.imageUrl || undefined,
  };
}
```

Then, in the handler:
- Instead of verifying Google `idToken`, call `getClerkEmailFromToken(token)` and continue using the SAME user create + JWT issuing logic already present in your Google route.

Important:
- Do not invent new JWT signing code. Reuse whatever your `/api/auth/google` route already does to issue `token` + `refreshToken`, otherwise the app won’t be able to refresh tokens.

### 4) Rebuild + restart service

```bash
cd /var/www/amize-backend
npm run build
sudo systemctl restart amize-backend
sudo systemctl status amize-backend --no-pager
sudo journalctl -u amize-backend --no-pager -n 120
```

### 5) Test from your phone
Once backend route is live:
- Install the APK
- Open app
- Tap `Continue with Clerk` on Get Started / Sign In
- Complete Google sign-in

If it fails:
- Check VPS logs for `/api/auth/clerk` errors.
- Ensure `CLERK_SECRET_KEY` is present in the service environment.

