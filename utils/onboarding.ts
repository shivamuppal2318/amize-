import * as SecureStore from 'expo-secure-store';

export async function markOnboardingComplete() {
    try {
        await SecureStore.setItemAsync('onboardingCompleted', 'true');
        return true;
    } catch (error) {
        console.error('Error marking onboarding as complete:', error);
        return false;
    }
}

export async function hasCompletedOnboarding() {
    try {
        const value = await SecureStore.getItemAsync('onboardingCompleted');
        return !!value;
    } catch (error) {
        console.error('Error checking onboarding status:', error);
        return false;
    }
}