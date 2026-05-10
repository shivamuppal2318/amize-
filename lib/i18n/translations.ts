export type TranslationKey =
  | "auth.common.providerGoogle"
  | "auth.common.providerFacebook"
  | "auth.signUp.providerTitle"
  | "auth.signUp.providerNotConfigured"
  | "auth.signUp.preparingTitle"
  | "auth.signUp.preparingText"
  | "auth.signUp.errorTitle"
  | "auth.signUp.genericError"
  | "auth.signUp.title"
  | "auth.signUp.subtitle"
  | "auth.signUp.usernameLabel"
  | "auth.signUp.usernamePlaceholder"
  | "auth.signUp.emailLabel"
  | "auth.signUp.emailPlaceholder"
  | "auth.signUp.passwordLabel"
  | "auth.signUp.passwordPlaceholder"
  | "auth.signUp.confirmPasswordLabel"
  | "auth.signUp.confirmPasswordPlaceholder"
  | "auth.signUp.passwordRequirements"
  | "auth.signUp.requirement.length"
  | "auth.signUp.requirement.uppercase"
  | "auth.signUp.requirement.lowercase"
  | "auth.signUp.requirement.number"
  | "auth.signUp.requirement.special"
  | "auth.signUp.termsAgreementPrefix"
  | "auth.signUp.termsLink"
  | "auth.signUp.termsAgreementMiddle"
  | "auth.signUp.privacyLink"
  | "auth.signUp.termsError"
  | "auth.signUp.continue"
  | "auth.signUp.orContinueWith"
  | "auth.signUp.continueGoogle"
  | "auth.signUp.clerkProviders"
  | "auth.signUp.haveAccount"
  | "auth.signUp.signIn"
  | "auth.signUp.documentOpenUnavailable"
  | "auth.signUp.documentOpenFailed"
  | "auth.getStarted.title"
  | "auth.getStarted.continueFacebook"
  | "auth.getStarted.continueGoogle"
  | "auth.getStarted.continueApple"
  | "auth.getStarted.signInPassword"
  | "auth.getStarted.signUp"
  | "auth.getStarted.or"
  | "auth.getStarted.googleSubtitle"
  | "auth.getStarted.clerkSubtitle"
  | "auth.getStarted.googleWebStatusTitle"
  | "auth.getStarted.googleWebStatusReady"
  | "auth.getStarted.googleWebStatusUnsupported"
  | "auth.getStarted.googleWebStatusMissing"
  | "auth.signIn.title"
  | "auth.signIn.subtitle"
  | "auth.signIn.emailLabel"
  | "auth.signIn.emailPlaceholder"
  | "auth.signIn.passwordLabel"
  | "auth.signIn.passwordPlaceholder"
  | "auth.signIn.identifierRequired"
  | "auth.signIn.identifierInvalid"
  | "auth.signIn.googleTitle"
  | "auth.signIn.googleNotConfigured"
  | "auth.signIn.googleWebUnsupported"
  | "auth.signIn.googleInitializing"
  | "auth.signIn.facebookTitle"
  | "auth.signIn.facebookNotConfigured"
  | "auth.signIn.appleTitle"
  | "auth.signIn.appleUnavailable"
  | "auth.signIn.appleMissingToken"
  | "auth.signIn.loginFailedTitle"
  | "auth.signIn.googleFailed"
  | "auth.signIn.facebookFailed"
  | "auth.signIn.appleFailed"
  | "auth.signIn.verificationRequired"
  | "auth.signIn.genericFailure"
  | "auth.signIn.clerkSubtitle"
  | "auth.signIn.googleSubtitle"
  | "auth.signIn.googleWebStatusTitle"
  | "auth.signIn.forgotPassword"
  | "auth.signIn.signIn"
  | "auth.signIn.noAccount"
  | "auth.signIn.signUp"
  | "auth.signIn.localDemoTitle"
  | "auth.signIn.localDemoText"
  | "onboarding.birthday.title"
  | "onboarding.birthday.info"
  | "onboarding.birthday.publicNote"
  | "onboarding.birthday.step"
  | "onboarding.birthday.month"
  | "onboarding.birthday.day"
  | "onboarding.birthday.year"
  | "onboarding.birthday.continue"
  | "onboarding.birthday.invalidTitle"
  | "onboarding.birthday.invalidDate"
  | "onboarding.birthday.invalidAge"
  | "onboarding.birthday.requiredTitle"
  | "onboarding.birthday.requiredMessage"
  | "onboarding.profile.title"
  | "onboarding.profile.info"
  | "onboarding.profile.addPhoto"
  | "onboarding.profile.step"
  | "onboarding.profile.firstName"
  | "onboarding.profile.firstNamePlaceholder"
  | "onboarding.profile.firstNameError"
  | "onboarding.profile.lastName"
  | "onboarding.profile.lastNamePlaceholder"
  | "onboarding.profile.lastNameError"
  | "onboarding.profile.email"
  | "onboarding.profile.emailPlaceholder"
  | "onboarding.profile.emailError"
  | "onboarding.profile.phone"
  | "onboarding.profile.phonePlaceholder"
  | "onboarding.profile.address"
  | "onboarding.profile.addressPlaceholder"
  | "onboarding.profile.ready"
  | "onboarding.profile.continue"
  | "onboarding.profile.incompleteTitle"
  | "onboarding.profile.incompleteMessage"
  | "onboarding.profile.registrationFailedTitle"
  | "onboarding.profile.registrationFailedDefault"
  | "onboarding.profile.errorTitle"
  | "onboarding.profile.errorMessage"
  | "onboarding.profile.requiredTitle"
  | "onboarding.profile.requiredMessage"
  | "onboarding.profile.permissionTitle"
  | "onboarding.profile.permissionMessage"
  | "onboarding.profile.photoErrorTitle"
  | "onboarding.profile.photoErrorMessage"
  | "common.use"
  | "common.success"
  | "common.cancel"
  | "settings.language.title"
  | "settings.language.suggested"
  | "settings.language.other"
  | "settings.language.updated"
  | "settings.title"
  | "settings.loading"
  | "settings.authRequired"
  | "settings.authRequiredSubtitle"
  | "settings.signIn"
  | "settings.editProfile"
  | "settings.account.section"
  | "settings.account.manage"
  | "settings.account.manageSubtitle"
  | "settings.account.security"
  | "settings.account.securitySubtitle"
  | "settings.account.gifts"
  | "settings.account.giftsSubtitle"
  | "settings.account.giftsDemoSubtitle"
  | "settings.account.wallet"
  | "settings.account.walletSubtitle"
  | "settings.account.walletDemoSubtitle"
  | "settings.account.premium"
  | "settings.account.premiumSubtitle"
  | "settings.account.premiumDemoSubtitle"
  | "settings.account.earnings"
  | "settings.account.earningsSubtitle"
  | "settings.account.earningsDemoSubtitle"
  | "settings.preferences.section"
  | "settings.preferences.notifications"
  | "settings.preferences.notificationsSubtitle"
  | "settings.preferences.language"
  | "settings.preferences.nearby"
  | "settings.preferences.nearbySubtitle"
  | "settings.preferences.nearbyDemoSubtitle"
  | "settings.preferences.data"
  | "settings.preferences.dataSubtitle"
  | "settings.support.section"
  | "settings.support.helpCenter"
  | "settings.support.helpCenterSubtitle"
  | "settings.support.privacy"
  | "settings.support.privacySubtitle"
  | "settings.support.terms"
  | "settings.support.termsSubtitle"
  | "settings.actions.section"
  | "settings.actions.signOut"
  | "settings.actions.signOutSubtitle"
  | "settings.actions.deleteAccount"
  | "settings.actions.deleteAccountSubtitle"
  | "settings.logout.title"
  | "settings.logout.message"
  | "settings.logout.confirm"
  | "settings.logout.loading"
  | "settings.version";

type TranslationTable = Record<TranslationKey, string>;

export const translations: Record<string, TranslationTable> = {
  en: {
    "auth.common.providerGoogle": "Google",
    "auth.common.providerFacebook": "Facebook",
    "auth.signUp.providerTitle": "Signup",
    "auth.signUp.providerNotConfigured":
      "{{provider}} signup is not configured for this build yet.",
    "auth.signUp.preparingTitle": "Preparing your profile setup...",
    "auth.signUp.preparingText":
      "Please wait while we prepare your account setup process.",
    "auth.signUp.errorTitle": "Error",
    "auth.signUp.genericError":
      "An unexpected error occurred. Please try again.",
    "auth.signUp.title": "Create your Account",
    "auth.signUp.subtitle":
      "Create your account with email and password. Extra profile details can be completed later.",
    "auth.signUp.usernameLabel": "Username",
    "auth.signUp.usernamePlaceholder": "Enter your username",
    "auth.signUp.emailLabel": "Email",
    "auth.signUp.emailPlaceholder": "Enter your email",
    "auth.signUp.passwordLabel": "Password",
    "auth.signUp.passwordPlaceholder": "Enter your password",
    "auth.signUp.confirmPasswordLabel": "Confirm Password",
    "auth.signUp.confirmPasswordPlaceholder": "Confirm your password",
    "auth.signUp.passwordRequirements": "Password requirements:",
    "auth.signUp.requirement.length": "At least 8 characters",
    "auth.signUp.requirement.uppercase": "At least one uppercase letter",
    "auth.signUp.requirement.lowercase": "At least one lowercase letter",
    "auth.signUp.requirement.number": "At least one number",
    "auth.signUp.requirement.special": "At least one special character",
    "auth.signUp.termsAgreementPrefix": "I agree to the ",
    "auth.signUp.termsLink": "Terms of Service",
    "auth.signUp.termsAgreementMiddle": " and ",
    "auth.signUp.privacyLink": "Privacy Policy",
    "auth.signUp.termsError":
      "Agree to the Terms of Service and Privacy Policy to continue.",
    "auth.signUp.continue": "Continue",
    "auth.signUp.orContinueWith": "or continue with",
    "auth.signUp.continueGoogle": "Continue with Google",
    "auth.signUp.clerkProviders":
      "Google, Facebook, X, and Apple through Clerk",
    "auth.signUp.haveAccount": "Already have an account?",
    "auth.signUp.signIn": "Sign in",
    "auth.signUp.documentOpenUnavailable":
      "Unable to open {{document}} on this device right now.",
    "auth.signUp.documentOpenFailed":
      "Unable to open {{document}} right now.",
    "auth.getStarted.title": "Let's get you in",
    "auth.getStarted.continueFacebook": "Continue with Facebook",
    "auth.getStarted.continueGoogle": "Continue with Google",
    "auth.getStarted.continueApple": "Continue with Apple",
    "auth.getStarted.signInPassword": "Sign in with password",
    "auth.getStarted.signUp": "Sign up",
    "auth.getStarted.or": "or",
    "auth.getStarted.googleSubtitle":
      "One tap sign-in with your Google account",
    "auth.getStarted.clerkSubtitle":
      "Google, Facebook, X, and Apple through Clerk",
    "auth.getStarted.googleWebStatusTitle": "Google web status",
    "auth.getStarted.googleWebStatusReady":
      "Google sign-in is ready on this platform.",
    "auth.getStarted.googleWebStatusUnsupported":
      "Google sign-in on phone browser preview requires https or localhost. Use the Android app build for device testing.",
    "auth.getStarted.googleWebStatusMissing":
      "Google sign-in is not configured for this platform in this build.",
    "auth.signIn.title": "Amize Login",
    "auth.signIn.subtitle": "Sign in to continue to your account",
    "auth.signIn.emailLabel": "Email or Phone",
    "auth.signIn.emailPlaceholder": "Enter your email or phone number",
    "auth.signIn.passwordLabel": "Password",
    "auth.signIn.passwordPlaceholder": "Enter your password",
    "auth.signIn.identifierRequired":
      "Email, phone number, or username is required",
    "auth.signIn.identifierInvalid":
      "Enter a valid email address, phone number, or username",
    "auth.signIn.googleTitle": "Google Login",
    "auth.signIn.googleNotConfigured":
      "Google login is not configured for this platform in this build yet.",
    "auth.signIn.googleWebUnsupported":
      "Google sign-in on phone browser preview requires localhost or https. Use the Android build for device testing.",
    "auth.signIn.googleInitializing":
      "Google sign-in is still initializing. Wait a moment and try again.",
    "auth.signIn.facebookTitle": "Facebook Login",
    "auth.signIn.facebookNotConfigured":
      "Facebook login is not configured for this build yet.",
    "auth.signIn.appleTitle": "Apple Login",
    "auth.signIn.appleUnavailable":
      "Apple login is only available on supported Apple devices for this build.",
    "auth.signIn.appleMissingToken":
      "Apple did not return an identity token.",
    "auth.signIn.loginFailedTitle": "Login Failed",
    "auth.signIn.googleFailed": "Google authentication failed",
    "auth.signIn.facebookFailed": "Facebook authentication failed",
    "auth.signIn.appleFailed": "Apple authentication failed",
    "auth.signIn.verificationRequired":
      "This account still needs verification. Complete verification to continue.",
    "auth.signIn.genericFailure": "Something went wrong while signing in.",
    "auth.signIn.clerkSubtitle":
      "Google, Facebook, X, and Apple through Clerk",
    "auth.signIn.googleSubtitle":
      "Fast sign-in with your Google account",
    "auth.signIn.googleWebStatusTitle": "Google web status",
    "auth.signIn.forgotPassword": "Forgot password?",
    "auth.signIn.signIn": "Sign In",
    "auth.signIn.noAccount": "Don't have an account?",
    "auth.signIn.signUp": "Sign up",
    "auth.signIn.localDemoTitle": "Local Demo Login",
    "auth.signIn.localDemoText":
      "Use these demo accounts without backend access.",
    "onboarding.birthday.title": "When is Your Birthday?",
    "onboarding.birthday.info": "Info",
    "onboarding.birthday.publicNote":
      "Your birthday will not be shown to the public",
    "onboarding.birthday.step": "Step 3 of 4",
    "onboarding.birthday.month": "Month",
    "onboarding.birthday.day": "Day",
    "onboarding.birthday.year": "Year",
    "onboarding.birthday.continue": "Continue",
    "onboarding.birthday.invalidTitle": "Invalid Birthday",
    "onboarding.birthday.invalidDate": "Please select a valid date.",
    "onboarding.birthday.invalidAge":
      "You must be at least 13 years old to continue.",
    "onboarding.birthday.requiredTitle": "Birthday Required",
    "onboarding.birthday.requiredMessage":
      "Enter your birthday before continuing. The app creates your account on the next step and needs this value.",
    "onboarding.profile.title": "Fill Your Profile",
    "onboarding.profile.info": "Info",
    "onboarding.profile.addPhoto": "Tap to add photo",
    "onboarding.profile.step": "Step 4 of 4",
    "onboarding.profile.firstName": "First Name",
    "onboarding.profile.firstNamePlaceholder": "Enter your first name",
    "onboarding.profile.firstNameError": "Enter a valid first name",
    "onboarding.profile.lastName": "Last Name",
    "onboarding.profile.lastNamePlaceholder": "Enter your last name",
    "onboarding.profile.lastNameError": "Enter a valid last name",
    "onboarding.profile.email": "Email",
    "onboarding.profile.emailPlaceholder": "Enter your email address",
    "onboarding.profile.emailError": "Enter a valid email address",
    "onboarding.profile.phone": "Phone Number",
    "onboarding.profile.phonePlaceholder": "Enter your phone number",
    "onboarding.profile.address": "Address",
    "onboarding.profile.addressPlaceholder":
      "Enter your address (optional)",
    "onboarding.profile.ready": "Profile ready to continue",
    "onboarding.profile.continue": "Continue",
    "onboarding.profile.incompleteTitle": "Incomplete Profile",
    "onboarding.profile.incompleteMessage":
      "Enter your first name, last name, a valid email address, and a valid phone number to continue.",
    "onboarding.profile.registrationFailedTitle": "Registration Failed",
    "onboarding.profile.registrationFailedDefault":
      "Unable to finish registration right now.",
    "onboarding.profile.errorTitle": "Error",
    "onboarding.profile.errorMessage":
      "An unexpected error occurred. Please try again.",
    "onboarding.profile.requiredTitle": "Profile Required",
    "onboarding.profile.requiredMessage":
      "Complete your profile and finish registration before continuing.",
    "onboarding.profile.permissionTitle": "Permission Required",
    "onboarding.profile.permissionMessage":
      "Allow photo library access to add a profile picture.",
    "onboarding.profile.photoErrorTitle": "Photo Error",
    "onboarding.profile.photoErrorMessage":
      "Unable to open the image picker right now. Please try again.",
    "common.use": "Use",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "settings.language.title": "Language",
    "settings.language.suggested": "Suggested",
    "settings.language.other": "Languages",
    "settings.language.updated": "Language updated successfully",
    "settings.title": "Settings",
    "settings.loading": "Loading settings...",
    "settings.authRequired": "Authentication Required",
    "settings.authRequiredSubtitle":
      "You need to sign in to access your settings and profile information.",
    "settings.signIn": "Sign In",
    "settings.editProfile": "Edit Profile",
    "settings.account.section": "Account",
    "settings.account.manage": "Manage Account",
    "settings.account.manageSubtitle": "Personal information, email, phone",
    "settings.account.security": "Security",
    "settings.account.securitySubtitle":
      "Password, two-factor authentication",
    "settings.account.gifts": "Gifts & Coins",
    "settings.account.giftsSubtitle": "Send and receive gifts",
    "settings.account.giftsDemoSubtitle": "Demo: 18 Roses, 6 Stars, 1 Crown",
    "settings.account.wallet": "Wallet & Payouts",
    "settings.account.walletSubtitle": "Coins, gifts, withdrawal requests",
    "settings.account.walletDemoSubtitle": "Demo preview (no real payouts)",
    "settings.account.premium": "Premium",
    "settings.account.premiumSubtitle": "Upgrade to unlock more features",
    "settings.account.premiumDemoSubtitle":
      "Demo preview (subscriptions mocked)",
    "settings.account.earnings": "Creator Earnings",
    "settings.account.earningsSubtitle":
      "Subscribers, revenue, creator monetization",
    "settings.account.earningsDemoSubtitle":
      "Demo preview (analytics mocked)",
    "settings.preferences.section": "Preferences",
    "settings.preferences.notifications": "Notifications",
    "settings.preferences.notificationsSubtitle":
      "Push notifications, email alerts",
    "settings.preferences.language": "Language",
    "settings.preferences.nearby": "Nearby Discovery",
    "settings.preferences.nearbySubtitle":
      "Discover local creators and posts",
    "settings.preferences.nearbyDemoSubtitle":
      "Demo preview (local fallback data)",
    "settings.preferences.data": "Data & Storage",
    "settings.preferences.dataSubtitle": "Download data, clear cache",
    "settings.support.section": "Support",
    "settings.support.helpCenter": "Help Center",
    "settings.support.helpCenterSubtitle": "FAQs, contact support",
    "settings.support.privacy": "Privacy Policy",
    "settings.support.privacySubtitle":
      "Privacy policy and data handling",
    "settings.support.terms": "Terms of Service",
    "settings.support.termsSubtitle": "Usage terms and platform rules",
    "settings.actions.section": "Account Actions",
    "settings.actions.signOut": "Sign Out",
    "settings.actions.signOutSubtitle": "Sign out of your account",
    "settings.actions.deleteAccount": "Delete Account",
    "settings.actions.deleteAccountSubtitle":
      "Permanently delete your account",
    "settings.logout.title": "Sign Out",
    "settings.logout.message":
      "Are you sure you want to sign out of your account?",
    "settings.logout.confirm": "Yes, Sign Out",
    "settings.logout.loading": "Signing out...",
    "settings.version": "App Version 1.0.0",
  },
  hi: {
    "auth.common.providerGoogle": "Google",
    "auth.common.providerFacebook": "Facebook",
    "auth.signUp.providerTitle": "साइनअप",
    "auth.signUp.providerNotConfigured":
      "{{provider}} साइनअप अभी इस बिल्ड के लिए कॉन्फ़िगर नहीं है।",
    "auth.signUp.preparingTitle": "आपकी प्रोफ़ाइल सेटअप तैयार की जा रही है...",
    "auth.signUp.preparingText":
      "कृपया प्रतीक्षा करें, हम आपकी अकाउंट सेटअप प्रक्रिया तैयार कर रहे हैं।",
    "auth.signUp.errorTitle": "त्रुटि",
    "auth.signUp.genericError":
      "एक अनपेक्षित त्रुटि हुई। कृपया फिर से प्रयास करें।",
    "auth.signUp.title": "अपना अकाउंट बनाएं",
    "auth.signUp.subtitle":
      "ईमेल और पासवर्ड से अपना अकाउंट बनाएं। अतिरिक्त प्रोफ़ाइल विवरण बाद में पूरे किए जा सकते हैं।",
    "auth.signUp.usernameLabel": "यूज़रनेम",
    "auth.signUp.usernamePlaceholder": "अपना यूज़रनेम दर्ज करें",
    "auth.signUp.emailLabel": "ईमेल",
    "auth.signUp.emailPlaceholder": "अपना ईमेल दर्ज करें",
    "auth.signUp.passwordLabel": "पासवर्ड",
    "auth.signUp.passwordPlaceholder": "अपना पासवर्ड दर्ज करें",
    "auth.signUp.confirmPasswordLabel": "पासवर्ड की पुष्टि करें",
    "auth.signUp.confirmPasswordPlaceholder": "अपने पासवर्ड की पुष्टि करें",
    "auth.signUp.passwordRequirements": "पासवर्ड आवश्यकताएँ:",
    "auth.signUp.requirement.length": "कम से कम 8 अक्षर",
    "auth.signUp.requirement.uppercase": "कम से कम एक बड़ा अक्षर",
    "auth.signUp.requirement.lowercase": "कम से कम एक छोटा अक्षर",
    "auth.signUp.requirement.number": "कम से कम एक संख्या",
    "auth.signUp.requirement.special": "कम से कम एक विशेष चिन्ह",
    "auth.signUp.termsAgreementPrefix": "मैं ",
    "auth.signUp.termsLink": "सेवा की शर्तों",
    "auth.signUp.termsAgreementMiddle": " और ",
    "auth.signUp.privacyLink": "गोपनीयता नीति",
    "auth.signUp.termsError":
      "जारी रखने के लिए सेवा की शर्तों और गोपनीयता नीति से सहमत हों।",
    "auth.signUp.continue": "जारी रखें",
    "auth.signUp.orContinueWith": "या इसके साथ जारी रखें",
    "auth.signUp.continueGoogle": "Google के साथ जारी रखें",
    "auth.signUp.clerkProviders":
      "Clerk के माध्यम से Google, Facebook, X और Apple",
    "auth.signUp.haveAccount": "क्या आपके पास पहले से अकाउंट है?",
    "auth.signUp.signIn": "साइन इन करें",
    "auth.signUp.documentOpenUnavailable":
      "अभी इस डिवाइस पर {{document}} नहीं खोला जा सकता।",
    "auth.signUp.documentOpenFailed":
      "अभी {{document}} नहीं खोला जा सकता।",
    "auth.getStarted.title": "चलो शुरुआत करें",
    "auth.getStarted.continueFacebook": "फ़ेसबुक से जारी रखें",
    "auth.getStarted.continueGoogle": "Google से जारी रखें",
    "auth.getStarted.continueApple": "Apple से जारी रखें",
    "auth.getStarted.signInPassword": "पासवर्ड से साइन इन करें",
    "auth.getStarted.signUp": "साइन अप",
    "auth.getStarted.or": "या",
    "auth.getStarted.googleSubtitle":
      "अपने Google खाते से एक टैप में साइन इन करें",
    "auth.getStarted.clerkSubtitle":
      "Clerk के माध्यम से Google, Facebook, X और Apple",
    "auth.getStarted.googleWebStatusTitle": "Google वेब स्थिति",
    "auth.getStarted.googleWebStatusReady":
      "इस प्लेटफ़ॉर्म पर Google साइन-इन तैयार है।",
    "auth.getStarted.googleWebStatusUnsupported":
      "फ़ोन ब्राउज़र प्रीव्यू पर Google साइन-इन के लिए https या localhost चाहिए। डिवाइस टेस्टिंग के लिए Android बिल्ड उपयोग करें।",
    "auth.getStarted.googleWebStatusMissing":
      "इस प्लेटफ़ॉर्म के लिए इस बिल्ड में Google साइन-इन कॉन्फ़िगर नहीं है।",
    "auth.signIn.title": "Amize लॉगिन",
    "auth.signIn.subtitle": "अपने खाते में जारी रखने के लिए साइन इन करें",
    "auth.signIn.emailLabel": "ईमेल या फ़ोन",
    "auth.signIn.emailPlaceholder": "अपना ईमेल या फ़ोन नंबर दर्ज करें",
    "auth.signIn.passwordLabel": "पासवर्ड",
    "auth.signIn.passwordPlaceholder": "अपना पासवर्ड दर्ज करें",
    "auth.signIn.identifierRequired":
      "ईमेल, फ़ोन नंबर, या यूज़रनेम आवश्यक है",
    "auth.signIn.identifierInvalid":
      "मान्य ईमेल, फ़ोन नंबर, या यूज़रनेम दर्ज करें",
    "auth.signIn.googleTitle": "Google लॉगिन",
    "auth.signIn.googleNotConfigured":
      "इस प्लेटफ़ॉर्म के लिए इस बिल्ड में Google लॉगिन कॉन्फ़िगर नहीं है।",
    "auth.signIn.googleWebUnsupported":
      "फ़ोन ब्राउज़र प्रीव्यू पर Google साइन-इन के लिए localhost या https चाहिए। डिवाइस टेस्टिंग के लिए Android बिल्ड उपयोग करें।",
    "auth.signIn.googleInitializing":
      "Google साइन-इन अभी प्रारंभ हो रहा है। थोड़ी देर बाद फिर प्रयास करें।",
    "auth.signIn.facebookTitle": "Facebook लॉगिन",
    "auth.signIn.facebookNotConfigured":
      "इस बिल्ड के लिए Facebook लॉगिन अभी कॉन्फ़िगर नहीं है।",
    "auth.signIn.appleTitle": "Apple लॉगिन",
    "auth.signIn.appleUnavailable":
      "इस बिल्ड के लिए Apple लॉगिन केवल समर्थित Apple डिवाइस पर उपलब्ध है।",
    "auth.signIn.appleMissingToken":
      "Apple ने पहचान टोकन वापस नहीं किया।",
    "auth.signIn.loginFailedTitle": "लॉगिन विफल",
    "auth.signIn.googleFailed": "Google प्रमाणीकरण विफल हुआ",
    "auth.signIn.facebookFailed": "Facebook प्रमाणीकरण विफल हुआ",
    "auth.signIn.appleFailed": "Apple प्रमाणीकरण विफल हुआ",
    "auth.signIn.verificationRequired":
      "इस खाते को अभी भी सत्यापन की आवश्यकता है। आगे बढ़ने के लिए सत्यापन पूरा करें।",
    "auth.signIn.genericFailure":
      "साइन इन करते समय कुछ गलत हो गया।",
    "auth.signIn.clerkSubtitle":
      "Clerk के माध्यम से Google, Facebook, X और Apple",
    "auth.signIn.googleSubtitle":
      "अपने Google खाते से तेज़ साइन-इन",
    "auth.signIn.googleWebStatusTitle": "Google वेब स्थिति",
    "auth.signIn.forgotPassword": "पासवर्ड भूल गए?",
    "auth.signIn.signIn": "साइन इन",
    "auth.signIn.noAccount": "अकाउंट नहीं है?",
    "auth.signIn.signUp": "साइन अप",
    "auth.signIn.localDemoTitle": "लोकल डेमो लॉगिन",
    "auth.signIn.localDemoText":
      "इन डेमो अकाउंट से बिना बैकएंड के लॉगिन करें।",
    "onboarding.birthday.title": "आपका जन्मदिन कब है?",
    "onboarding.birthday.info": "जानकारी",
    "onboarding.birthday.publicNote":
      "आपका जन्मदिन सार्वजनिक रूप से नहीं दिखाया जाएगा",
    "onboarding.birthday.step": "चरण 3 / 4",
    "onboarding.birthday.month": "महीना",
    "onboarding.birthday.day": "दिन",
    "onboarding.birthday.year": "वर्ष",
    "onboarding.birthday.continue": "जारी रखें",
    "onboarding.birthday.invalidTitle": "अमान्य जन्मदिन",
    "onboarding.birthday.invalidDate": "कृपया मान्य तिथि चुनें।",
    "onboarding.birthday.invalidAge":
      "जारी रखने के लिए आपकी आयु कम से कम 13 वर्ष होनी चाहिए।",
    "onboarding.birthday.requiredTitle": "जन्मदिन आवश्यक है",
    "onboarding.birthday.requiredMessage":
      "जारी रखने से पहले अपना जन्मदिन दर्ज करें। अगले चरण में खाता बनाने के लिए यह आवश्यक है।",
    "onboarding.profile.title": "अपनी प्रोफ़ाइल भरें",
    "onboarding.profile.info": "जानकारी",
    "onboarding.profile.addPhoto": "फ़ोटो जोड़ने के लिए टैप करें",
    "onboarding.profile.step": "चरण 4 / 4",
    "onboarding.profile.firstName": "पहला नाम",
    "onboarding.profile.firstNamePlaceholder": "अपना पहला नाम दर्ज करें",
    "onboarding.profile.firstNameError": "मान्य पहला नाम दर्ज करें",
    "onboarding.profile.lastName": "अंतिम नाम",
    "onboarding.profile.lastNamePlaceholder": "अपना अंतिम नाम दर्ज करें",
    "onboarding.profile.lastNameError": "मान्य अंतिम नाम दर्ज करें",
    "onboarding.profile.email": "ईमेल",
    "onboarding.profile.emailPlaceholder": "अपना ईमेल पता दर्ज करें",
    "onboarding.profile.emailError": "मान्य ईमेल पता दर्ज करें",
    "onboarding.profile.phone": "फ़ोन नंबर",
    "onboarding.profile.phonePlaceholder": "अपना फ़ोन नंबर दर्ज करें",
    "onboarding.profile.address": "पता",
    "onboarding.profile.addressPlaceholder": "अपना पता दर्ज करें (वैकल्पिक)",
    "onboarding.profile.ready": "प्रोफ़ाइल आगे बढ़ने के लिए तैयार है",
    "onboarding.profile.continue": "जारी रखें",
    "onboarding.profile.incompleteTitle": "अधूरी प्रोफ़ाइल",
    "onboarding.profile.incompleteMessage":
      "जारी रखने के लिए अपना पहला नाम, अंतिम नाम, मान्य ईमेल पता और मान्य फ़ोन नंबर दर्ज करें।",
    "onboarding.profile.registrationFailedTitle": "पंजीकरण विफल",
    "onboarding.profile.registrationFailedDefault":
      "अभी पंजीकरण पूरा नहीं हो सका।",
    "onboarding.profile.errorTitle": "त्रुटि",
    "onboarding.profile.errorMessage":
      "एक अनपेक्षित त्रुटि हुई। कृपया फिर से प्रयास करें।",
    "onboarding.profile.requiredTitle": "प्रोफ़ाइल आवश्यक है",
    "onboarding.profile.requiredMessage":
      "जारी रखने से पहले अपनी प्रोफ़ाइल पूरी करें और पंजीकरण समाप्त करें।",
    "onboarding.profile.permissionTitle": "अनुमति आवश्यक है",
    "onboarding.profile.permissionMessage":
      "प्रोफ़ाइल फ़ोटो जोड़ने के लिए फ़ोटो लाइब्रेरी की अनुमति दें।",
    "onboarding.profile.photoErrorTitle": "फ़ोटो त्रुटि",
    "onboarding.profile.photoErrorMessage":
      "अभी इमेज पिकर नहीं खुल सका। कृपया फिर से प्रयास करें।",
    "common.use": "उपयोग करें",
    "common.success": "सफलता",
    "common.cancel": "रद्द करें",
    "settings.language.title": "भाषा",
    "settings.language.suggested": "सुझावित",
    "settings.language.other": "भाषाएँ",
    "settings.language.updated": "भाषा सफलतापूर्वक अपडेट हो गई",
    "settings.title": "सेटिंग्स",
    "settings.loading": "सेटिंग्स लोड हो रही हैं...",
    "settings.authRequired": "प्रमाणीकरण आवश्यक है",
    "settings.authRequiredSubtitle":
      "अपनी सेटिंग्स और प्रोफ़ाइल जानकारी देखने के लिए आपको साइन इन करना होगा।",
    "settings.signIn": "साइन इन",
    "settings.editProfile": "प्रोफ़ाइल संपादित करें",
    "settings.account.section": "अकाउंट",
    "settings.account.manage": "अकाउंट प्रबंधित करें",
    "settings.account.manageSubtitle": "व्यक्तिगत जानकारी, ईमेल, फ़ोन",
    "settings.account.security": "सुरक्षा",
    "settings.account.securitySubtitle":
      "पासवर्ड, टू-फैक्टर प्रमाणीकरण",
    "settings.account.gifts": "गिफ्ट्स और कॉइन्स",
    "settings.account.giftsSubtitle": "गिफ्ट भेजें और प्राप्त करें",
    "settings.account.giftsDemoSubtitle": "डेमो: 18 रोज़, 6 स्टार, 1 क्राउन",
    "settings.account.wallet": "वॉलेट और पेआउट्स",
    "settings.account.walletSubtitle": "कॉइन्स, गिफ्ट्स, निकासी अनुरोध",
    "settings.account.walletDemoSubtitle":
      "डेमो प्रीव्यू (कोई वास्तविक पेआउट नहीं)",
    "settings.account.premium": "प्रीमियम",
    "settings.account.premiumSubtitle":
      "और सुविधाएँ अनलॉक करने के लिए अपग्रेड करें",
    "settings.account.premiumDemoSubtitle":
      "डेमो प्रीव्यू (सब्सक्रिप्शन मॉक्ड)",
    "settings.account.earnings": "क्रिएटर कमाई",
    "settings.account.earningsSubtitle":
      "सब्सक्राइबर्स, राजस्व, क्रिएटर मोनेटाइजेशन",
    "settings.account.earningsDemoSubtitle":
      "डेमो प्रीव्यू (एनालिटिक्स मॉक्ड)",
    "settings.preferences.section": "प्राथमिकताएँ",
    "settings.preferences.notifications": "सूचनाएँ",
    "settings.preferences.notificationsSubtitle":
      "पुश नोटिफिकेशन, ईमेल अलर्ट",
    "settings.preferences.language": "भाषा",
    "settings.preferences.nearby": "नजदीकी खोज",
    "settings.preferences.nearbySubtitle":
      "स्थानीय क्रिएटर्स और पोस्ट खोजें",
    "settings.preferences.nearbyDemoSubtitle":
      "डेमो प्रीव्यू (लोकल फॉलबैक डेटा)",
    "settings.preferences.data": "डेटा और स्टोरेज",
    "settings.preferences.dataSubtitle": "डेटा डाउनलोड करें, कैश साफ़ करें",
    "settings.support.section": "सहायता",
    "settings.support.helpCenter": "हेल्प सेंटर",
    "settings.support.helpCenterSubtitle": "FAQ, सहायता से संपर्क",
    "settings.support.privacy": "गोपनीयता नीति",
    "settings.support.privacySubtitle":
      "गोपनीयता नीति और डेटा प्रबंधन",
    "settings.support.terms": "सेवा की शर्तें",
    "settings.support.termsSubtitle":
      "उपयोग की शर्तें और प्लेटफ़ॉर्म नियम",
    "settings.actions.section": "अकाउंट एक्शन",
    "settings.actions.signOut": "साइन आउट",
    "settings.actions.signOutSubtitle": "अपने अकाउंट से साइन आउट करें",
    "settings.actions.deleteAccount": "अकाउंट हटाएँ",
    "settings.actions.deleteAccountSubtitle":
      "अपने अकाउंट को स्थायी रूप से हटाएँ",
    "settings.logout.title": "साइन आउट",
    "settings.logout.message":
      "क्या आप वाकई अपने अकाउंट से साइन आउट करना चाहते हैं?",
    "settings.logout.confirm": "हाँ, साइन आउट करें",
    "settings.logout.loading": "साइन आउट हो रहा है...",
    "settings.version": "ऐप संस्करण 1.0.0",
  },
  es: {
    "auth.common.providerGoogle": "Google",
    "auth.common.providerFacebook": "Facebook",
    "auth.signUp.providerTitle": "Registro",
    "auth.signUp.providerNotConfigured":
      "El registro con {{provider}} aún no está configurado para esta compilación.",
    "auth.signUp.preparingTitle": "Preparando la configuración de tu perfil...",
    "auth.signUp.preparingText":
      "Espera mientras preparamos el proceso de configuración de tu cuenta.",
    "auth.signUp.errorTitle": "Error",
    "auth.signUp.genericError":
      "Ocurrió un error inesperado. Inténtalo de nuevo.",
    "auth.signUp.title": "Crea tu cuenta",
    "auth.signUp.subtitle":
      "Crea tu cuenta con correo y contraseña. Los detalles adicionales del perfil pueden completarse después.",
    "auth.signUp.usernameLabel": "Nombre de usuario",
    "auth.signUp.usernamePlaceholder": "Ingresa tu nombre de usuario",
    "auth.signUp.emailLabel": "Correo",
    "auth.signUp.emailPlaceholder": "Ingresa tu correo",
    "auth.signUp.passwordLabel": "Contraseña",
    "auth.signUp.passwordPlaceholder": "Ingresa tu contraseña",
    "auth.signUp.confirmPasswordLabel": "Confirmar contraseña",
    "auth.signUp.confirmPasswordPlaceholder": "Confirma tu contraseña",
    "auth.signUp.passwordRequirements": "Requisitos de contraseña:",
    "auth.signUp.requirement.length": "Al menos 8 caracteres",
    "auth.signUp.requirement.uppercase": "Al menos una letra mayúscula",
    "auth.signUp.requirement.lowercase": "Al menos una letra minúscula",
    "auth.signUp.requirement.number": "Al menos un número",
    "auth.signUp.requirement.special": "Al menos un carácter especial",
    "auth.signUp.termsAgreementPrefix": "Acepto los ",
    "auth.signUp.termsLink": "Términos del servicio",
    "auth.signUp.termsAgreementMiddle": " y la ",
    "auth.signUp.privacyLink": "Política de privacidad",
    "auth.signUp.termsError":
      "Acepta los Términos del servicio y la Política de privacidad para continuar.",
    "auth.signUp.continue": "Continuar",
    "auth.signUp.orContinueWith": "o continúa con",
    "auth.signUp.continueGoogle": "Continuar con Google",
    "auth.signUp.clerkProviders":
      "Google, Facebook, X y Apple a través de Clerk",
    "auth.signUp.haveAccount": "¿Ya tienes una cuenta?",
    "auth.signUp.signIn": "Iniciar sesión",
    "auth.signUp.documentOpenUnavailable":
      "No se puede abrir {{document}} en este dispositivo ahora mismo.",
    "auth.signUp.documentOpenFailed":
      "No se puede abrir {{document}} ahora mismo.",
    "auth.getStarted.title": "Vamos a empezar",
    "auth.getStarted.continueFacebook": "Continuar con Facebook",
    "auth.getStarted.continueGoogle": "Continuar con Google",
    "auth.getStarted.continueApple": "Continuar con Apple",
    "auth.getStarted.signInPassword": "Iniciar sesión con contraseña",
    "auth.getStarted.signUp": "Registrarse",
    "auth.getStarted.or": "o",
    "auth.getStarted.googleSubtitle":
      "Inicia sesión con un toque usando tu cuenta de Google",
    "auth.getStarted.clerkSubtitle":
      "Google, Facebook, X y Apple a través de Clerk",
    "auth.getStarted.googleWebStatusTitle": "Estado web de Google",
    "auth.getStarted.googleWebStatusReady":
      "Google sign-in is ready on this platform.",
    "auth.getStarted.googleWebStatusUnsupported":
      "La vista previa del navegador del teléfono requiere https o localhost para Google. Usa la compilación Android para probar en el dispositivo.",
    "auth.getStarted.googleWebStatusMissing":
      "Google no está configurado para esta plataforma en esta compilación.",
    "auth.signIn.title": "Inicio de sesión",
    "auth.signIn.subtitle": "Inicia sesión para continuar",
    "auth.signIn.emailLabel": "Correo o teléfono",
    "auth.signIn.emailPlaceholder": "Ingresa tu correo o teléfono",
    "auth.signIn.passwordLabel": "Contraseña",
    "auth.signIn.passwordPlaceholder": "Ingresa tu contraseña",
    "auth.signIn.identifierRequired":
      "Se requiere correo, número de teléfono o nombre de usuario",
    "auth.signIn.identifierInvalid":
      "Ingresa un correo, teléfono o nombre de usuario válido",
    "auth.signIn.googleTitle": "Inicio con Google",
    "auth.signIn.googleNotConfigured":
      "Google no está configurado para esta plataforma en esta compilación.",
    "auth.signIn.googleWebUnsupported":
      "La vista previa del navegador del teléfono requiere localhost o https para Google. Usa la compilación Android para probar en el dispositivo.",
    "auth.signIn.googleInitializing":
      "Google todavía se está inicializando. Espera un momento y vuelve a intentarlo.",
    "auth.signIn.facebookTitle": "Inicio con Facebook",
    "auth.signIn.facebookNotConfigured":
      "Facebook aún no está configurado para esta compilación.",
    "auth.signIn.appleTitle": "Inicio con Apple",
    "auth.signIn.appleUnavailable":
      "Apple solo está disponible en dispositivos Apple compatibles para esta compilación.",
    "auth.signIn.appleMissingToken":
      "Apple no devolvió un token de identidad.",
    "auth.signIn.loginFailedTitle": "Inicio de sesión fallido",
    "auth.signIn.googleFailed": "La autenticación con Google falló",
    "auth.signIn.facebookFailed": "La autenticación con Facebook falló",
    "auth.signIn.appleFailed": "La autenticación con Apple falló",
    "auth.signIn.verificationRequired":
      "Esta cuenta todavía necesita verificación. Complétala para continuar.",
    "auth.signIn.genericFailure":
      "Ocurrió un problema al iniciar sesión.",
    "auth.signIn.clerkSubtitle":
      "Google, Facebook, X y Apple a través de Clerk",
    "auth.signIn.googleSubtitle":
      "Inicio rápido con tu cuenta de Google",
    "auth.signIn.googleWebStatusTitle": "Estado web de Google",
    "auth.signIn.forgotPassword": "¿Olvidaste tu contraseña?",
    "auth.signIn.signIn": "Iniciar sesión",
    "auth.signIn.noAccount": "¿No tienes cuenta?",
    "auth.signIn.signUp": "Registrarse",
    "auth.signIn.localDemoTitle": "Inicio demo local",
    "auth.signIn.localDemoText":
      "Usa estas cuentas demo sin backend.",
    "onboarding.birthday.title": "¿Cuándo es tu cumpleaños?",
    "onboarding.birthday.info": "Info",
    "onboarding.birthday.publicNote":
      "Tu cumpleaños no se mostrará públicamente",
    "onboarding.birthday.step": "Paso 3 de 4",
    "onboarding.birthday.month": "Mes",
    "onboarding.birthday.day": "Día",
    "onboarding.birthday.year": "Año",
    "onboarding.birthday.continue": "Continuar",
    "onboarding.birthday.invalidTitle": "Cumpleaños inválido",
    "onboarding.birthday.invalidDate": "Selecciona una fecha válida.",
    "onboarding.birthday.invalidAge":
      "Debes tener al menos 13 años para continuar.",
    "onboarding.birthday.requiredTitle": "Se requiere cumpleaños",
    "onboarding.birthday.requiredMessage":
      "Ingresa tu cumpleaños antes de continuar. El siguiente paso necesita este valor para crear tu cuenta.",
    "onboarding.profile.title": "Completa tu perfil",
    "onboarding.profile.info": "Info",
    "onboarding.profile.addPhoto": "Toca para agregar una foto",
    "onboarding.profile.step": "Paso 4 de 4",
    "onboarding.profile.firstName": "Nombre",
    "onboarding.profile.firstNamePlaceholder": "Ingresa tu nombre",
    "onboarding.profile.firstNameError": "Ingresa un nombre válido",
    "onboarding.profile.lastName": "Apellido",
    "onboarding.profile.lastNamePlaceholder": "Ingresa tu apellido",
    "onboarding.profile.lastNameError": "Ingresa un apellido válido",
    "onboarding.profile.email": "Correo",
    "onboarding.profile.emailPlaceholder": "Ingresa tu correo electrónico",
    "onboarding.profile.emailError": "Ingresa un correo electrónico válido",
    "onboarding.profile.phone": "Número de teléfono",
    "onboarding.profile.phonePlaceholder": "Ingresa tu número de teléfono",
    "onboarding.profile.address": "Dirección",
    "onboarding.profile.addressPlaceholder":
      "Ingresa tu dirección (opcional)",
    "onboarding.profile.ready": "Perfil listo para continuar",
    "onboarding.profile.continue": "Continuar",
    "onboarding.profile.incompleteTitle": "Perfil incompleto",
    "onboarding.profile.incompleteMessage":
      "Ingresa tu nombre, apellido, un correo válido y un número de teléfono válido para continuar.",
    "onboarding.profile.registrationFailedTitle": "Registro fallido",
    "onboarding.profile.registrationFailedDefault":
      "No se pudo completar el registro en este momento.",
    "onboarding.profile.errorTitle": "Error",
    "onboarding.profile.errorMessage":
      "Ocurrió un error inesperado. Inténtalo de nuevo.",
    "onboarding.profile.requiredTitle": "Perfil requerido",
    "onboarding.profile.requiredMessage":
      "Completa tu perfil y termina el registro antes de continuar.",
    "onboarding.profile.permissionTitle": "Permiso requerido",
    "onboarding.profile.permissionMessage":
      "Permite el acceso a la biblioteca para agregar una foto de perfil.",
    "onboarding.profile.photoErrorTitle": "Error de foto",
    "onboarding.profile.photoErrorMessage":
      "No se pudo abrir el selector de imágenes en este momento. Inténtalo de nuevo.",
    "common.use": "Usar",
    "common.success": "Éxito",
    "common.cancel": "Cancelar",
    "settings.language.title": "Idioma",
    "settings.language.suggested": "Sugeridos",
    "settings.language.other": "Idiomas",
    "settings.language.updated": "Idioma actualizado correctamente",
    "settings.title": "Configuración",
    "settings.loading": "Cargando configuración...",
    "settings.authRequired": "Se requiere autenticación",
    "settings.authRequiredSubtitle":
      "Debes iniciar sesión para acceder a tu configuración e información de perfil.",
    "settings.signIn": "Iniciar sesión",
    "settings.editProfile": "Editar perfil",
    "settings.account.section": "Cuenta",
    "settings.account.manage": "Administrar cuenta",
    "settings.account.manageSubtitle": "Información personal, correo, teléfono",
    "settings.account.security": "Seguridad",
    "settings.account.securitySubtitle":
      "Contraseña, autenticación de dos factores",
    "settings.account.gifts": "Regalos y monedas",
    "settings.account.giftsSubtitle": "Enviar y recibir regalos",
    "settings.account.giftsDemoSubtitle":
      "Demo: 18 rosas, 6 estrellas, 1 corona",
    "settings.account.wallet": "Billetera y pagos",
    "settings.account.walletSubtitle":
      "Monedas, regalos, solicitudes de retiro",
    "settings.account.walletDemoSubtitle":
      "Vista previa demo (sin pagos reales)",
    "settings.account.premium": "Premium",
    "settings.account.premiumSubtitle":
      "Actualiza para desbloquear más funciones",
    "settings.account.premiumDemoSubtitle":
      "Vista previa demo (suscripciones simuladas)",
    "settings.account.earnings": "Ganancias del creador",
    "settings.account.earningsSubtitle":
      "Suscriptores, ingresos, monetización del creador",
    "settings.account.earningsDemoSubtitle":
      "Vista previa demo (analíticas simuladas)",
    "settings.preferences.section": "Preferencias",
    "settings.preferences.notifications": "Notificaciones",
    "settings.preferences.notificationsSubtitle":
      "Notificaciones push, alertas por correo",
    "settings.preferences.language": "Idioma",
    "settings.preferences.nearby": "Descubrimiento cercano",
    "settings.preferences.nearbySubtitle":
      "Descubre creadores y publicaciones locales",
    "settings.preferences.nearbyDemoSubtitle":
      "Vista previa demo (datos locales de respaldo)",
    "settings.preferences.data": "Datos y almacenamiento",
    "settings.preferences.dataSubtitle":
      "Descargar datos, borrar caché",
    "settings.support.section": "Soporte",
    "settings.support.helpCenter": "Centro de ayuda",
    "settings.support.helpCenterSubtitle":
      "Preguntas frecuentes, contactar soporte",
    "settings.support.privacy": "Política de privacidad",
    "settings.support.privacySubtitle":
      "Política de privacidad y gestión de datos",
    "settings.support.terms": "Términos del servicio",
    "settings.support.termsSubtitle":
      "Términos de uso y reglas de la plataforma",
    "settings.actions.section": "Acciones de la cuenta",
    "settings.actions.signOut": "Cerrar sesión",
    "settings.actions.signOutSubtitle": "Cerrar sesión de tu cuenta",
    "settings.actions.deleteAccount": "Eliminar cuenta",
    "settings.actions.deleteAccountSubtitle":
      "Eliminar permanentemente tu cuenta",
    "settings.logout.title": "Cerrar sesión",
    "settings.logout.message":
      "¿Seguro que quieres cerrar sesión de tu cuenta?",
    "settings.logout.confirm": "Sí, cerrar sesión",
    "settings.logout.loading": "Cerrando sesión...",
    "settings.version": "Versión de la app 1.0.0",
  },
};
