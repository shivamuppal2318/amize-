export type TranslationKey =
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
  | "settings.language.title"
  | "settings.language.suggested"
  | "settings.language.other";

type TranslationTable = Record<TranslationKey, string>;

export const translations: Record<string, TranslationTable> = {
  en: {
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
    "settings.language.title": "Language",
    "settings.language.suggested": "Suggested",
    "settings.language.other": "Language",
  },
  hi: {
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
    "settings.language.title": "भाषा",
    "settings.language.suggested": "सुझावित",
    "settings.language.other": "भाषाएँ",
  },
  es: {
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
    "settings.language.title": "Idioma",
    "settings.language.suggested": "Sugeridos",
    "settings.language.other": "Idiomas",
  },
};
