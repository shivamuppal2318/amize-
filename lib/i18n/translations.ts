export type TranslationKey =
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
  | "auth.signIn.title"
  | "auth.signIn.subtitle"
  | "auth.signIn.emailLabel"
  | "auth.signIn.emailPlaceholder"
  | "auth.signIn.passwordLabel"
  | "auth.signIn.passwordPlaceholder"
  | "auth.signIn.forgotPassword"
  | "auth.signIn.signIn"
  | "auth.signIn.noAccount"
  | "auth.signIn.signUp"
  | "auth.signIn.localDemoTitle"
  | "auth.signIn.localDemoText"
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
    "auth.signIn.title": "Amize Login",
    "auth.signIn.subtitle": "Sign in to continue to your account",
    "auth.signIn.emailLabel": "Email or Phone",
    "auth.signIn.emailPlaceholder": "Enter your email or phone number",
    "auth.signIn.passwordLabel": "Password",
    "auth.signIn.passwordPlaceholder": "Enter your password",
    "auth.signIn.forgotPassword": "Forgot password?",
    "auth.signIn.signIn": "Sign In",
    "auth.signIn.noAccount": "Don't have an account?",
    "auth.signIn.signUp": "Sign up",
    "auth.signIn.localDemoTitle": "Local Demo Login",
    "auth.signIn.localDemoText":
      "Use these demo accounts without backend access.",
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
    "auth.signIn.title": "Amize लॉगिन",
    "auth.signIn.subtitle": "अपने खाते में जारी रखने के लिए साइन इन करें",
    "auth.signIn.emailLabel": "ईमेल या फ़ोन",
    "auth.signIn.emailPlaceholder": "अपना ईमेल या फ़ोन नंबर दर्ज करें",
    "auth.signIn.passwordLabel": "पासवर्ड",
    "auth.signIn.passwordPlaceholder": "अपना पासवर्ड दर्ज करें",
    "auth.signIn.forgotPassword": "पासवर्ड भूल गए?",
    "auth.signIn.signIn": "साइन इन",
    "auth.signIn.noAccount": "अकाउंट नहीं है?",
    "auth.signIn.signUp": "साइन अप",
    "auth.signIn.localDemoTitle": "लोकल डेमो लॉगिन",
    "auth.signIn.localDemoText":
      "इन डेमो अकाउंट से बिना बैकएंड के लॉगिन करें।",
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
    "auth.signIn.title": "Inicio de sesión",
    "auth.signIn.subtitle": "Inicia sesión para continuar",
    "auth.signIn.emailLabel": "Correo o teléfono",
    "auth.signIn.emailPlaceholder": "Ingresa tu correo o teléfono",
    "auth.signIn.passwordLabel": "Contraseña",
    "auth.signIn.passwordPlaceholder": "Ingresa tu contraseña",
    "auth.signIn.forgotPassword": "¿Olvidaste tu contraseña?",
    "auth.signIn.signIn": "Iniciar sesión",
    "auth.signIn.noAccount": "¿No tienes cuenta?",
    "auth.signIn.signUp": "Registrarse",
    "auth.signIn.localDemoTitle": "Inicio demo local",
    "auth.signIn.localDemoText":
      "Usa estas cuentas demo sin backend.",
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
