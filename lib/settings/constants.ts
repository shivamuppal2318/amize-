export const SERVER_URL = "https://amizew.com";
//TODO export const SERVER_URL = "http://192.168.0.103:3000";
export const API_URL = `${SERVER_URL}/api`;
export const SOCKET_URL = `${SERVER_URL}`;
export const SITE_URL = `${SERVER_URL}`;

// Help center categories
export const HELP_CATEGORIES = [
    { id: 'general', label: 'General' },
    { id: 'account', label: 'Account' },
    { id: 'service', label: 'Service' },
    { id: 'video', label: 'Video' },
];

// FAQ questions
export const FAQ_QUESTIONS = [
    {
        id: 'create-account',
        question: 'How do I create an account?',
        answer: 'You can sign up using your email, phone number, or a third-party account like Google or Facebook. Follow the on-screen instructions to complete the setup.',
        category: 'account'
    },
    {
        id: 'app-free',
        question: 'Is Amize free to use?',
        answer: 'Yes, the basic version of our app is free to use. We offer premium features through subscription plans.',
        category: 'general'
    },
    {
        id: 'reset-password',
        question: 'How do I reset my password?',
        answer: 'Go to the login screen and tap "Forgot password". Follow the instructions sent to your email to reset your password.',
        category: 'account'
    },
    {
        id: 'private-account',
        question: 'How do I make my account private?',
        answer: 'Go to Settings > Privacy, then toggle "Private Account" to on. This will make your content visible only to approved followers.',
        category: 'account'
    },
    {
        id: 'change-username',
        question: 'Can I change my username?',
        answer: 'Yes, go to Settings > Edit Profile > Username to change your username. Note that username availability is subject to availability.',
        category: 'account'
    },
];

// Contact methods
export const CONTACT_METHODS = [
    { id: 'customer-service', label: 'Customer Service', icon: 'Headset' },
    { id: 'whatsapp', label: 'Whatsapp', icon: 'MessageCircle' },
    { id: 'website', label: 'Website', icon: 'Globe' },
    { id: 'facebook', label: 'Facebook', icon: 'Facebook' },
    { id: 'twitter', label: 'Twitter', icon: 'Twitter' },
    { id: 'instagram', label: 'Instagram', icon: 'Instagram' },
];

// Default user settings
export const DEFAULT_USER_SETTINGS = {
    language: 'en-US',
    darkMode: true,
    notifications: {
        push: true,
        email: true,
        marketing: false,
    },
    security: {
        biometric: false,
        faceId: false,
        rememberMe: true,
    },
    accessibility: {
        reduceMotion: false,
        largeText: false,
    },
};