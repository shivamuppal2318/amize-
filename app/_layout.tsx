import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Slot, useRouter, useSegments} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import {useEffect} from 'react';
import {ActivityIndicator, View, Platform} from 'react-native';
import 'react-native-reanimated';
import {RegistrationProvider} from '@/context/RegistrationContext';
import {ErrorProvider} from '@/context/ErrorContext';
import {AuthModalProvider} from '@/context/AuthModalContext';
import {useApiErrorHandler} from "@/hooks/useApiErrorHandler";

import {useColorScheme} from '@/hooks/useColorScheme';
import {AuthProvider} from '@/context/AuthContext';
import {SocketProvider} from '@/context/SocketContext';
import {MessageProvider} from '@/context/MessageContext';
import {NotificationProvider} from '@/context/NotificationContext';
import {useAuth} from '@/hooks/useAuth';
import {useFonts} from '@expo-google-fonts/figtree/useFonts';
import {Figtree_300Light} from '@expo-google-fonts/figtree/300Light';
import {Figtree_400Regular} from '@expo-google-fonts/figtree/400Regular';
import {Figtree_500Medium} from '@expo-google-fonts/figtree/500Medium';
import {Figtree_600SemiBold} from '@expo-google-fonts/figtree/600SemiBold';
import {Figtree_700Bold} from '@expo-google-fonts/figtree/700Bold';
import {Figtree_800ExtraBold} from '@expo-google-fonts/figtree/800ExtraBold';
import {Figtree_900Black} from '@expo-google-fonts/figtree/900Black';
import {Figtree_300Light_Italic} from '@expo-google-fonts/figtree/300Light_Italic';
import {Figtree_400Regular_Italic} from '@expo-google-fonts/figtree/400Regular_Italic';
import {Figtree_500Medium_Italic} from '@expo-google-fonts/figtree/500Medium_Italic';
import {Figtree_600SemiBold_Italic} from '@expo-google-fonts/figtree/600SemiBold_Italic';
import {Figtree_700Bold_Italic} from '@expo-google-fonts/figtree/700Bold_Italic';
import {Figtree_800ExtraBold_Italic} from '@expo-google-fonts/figtree/800ExtraBold_Italic';
import {Figtree_900Black_Italic} from '@expo-google-fonts/figtree/900Black_Italic';

import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useSocketInitialization} from '@/hooks/useSocketInitialization';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

// Import css for global styles
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().then(() => {
    //Ignore
});

// Authentication state provider component
function RootLayoutNavigation() {
    const router = useRouter();
    const segments = useSegments(); // This gives us the current route segments
    const {isAuthenticated, hasCompletedOnboarding, loading, isInSignupFlow, user} = useAuth();

    useApiErrorHandler();
    // Initialize socket connection
    useSocketInitialization();

    useEffect(() => {
        // Only proceed if not in loading state
        if (loading) {
            return;
        }

        // Check what section we're currently in
        const inAuthFlow = segments[0] === '(auth)';
        const inOnboardingFlow = segments[0] === 'onboarding';
        const inAccountSetupFlow = segments[0] === 'account-setup';
        const inTabsFlow = segments[0] === '(tabs)';
        const inPostFlow = segments[0] === 'post';
        const inLiveFlow = segments[0] === 'live';

        // Don't redirect if in post or live flows - allow these screens to display
        const inSupportedFlows = inTabsFlow || inPostFlow || inLiveFlow;

        console.log('[Layout] Navigation check:', {
            isAuthenticated,
            hasCompletedOnboarding,
            isInSignupFlow,
            currentSegment: segments[0],
            inAuthFlow,
            inOnboardingFlow,
            inAccountSetupFlow,
            inSupportedFlows
        });

        // RULE 0: If in signup flow and not in account setup, go there immediately
        if (isInSignupFlow && !inAccountSetupFlow) {
            // FIXED: Add a short delay to ensure all state changes are propagated
            setTimeout(() => {
                router.replace('/account-setup/interests');
            }, 300);
            return;
        }

        // RULE 1: Account setup has highest priority for normal flow - never interrupt it
        if (inAccountSetupFlow) {
            return;
        }

        // RULE 2: Handle onboarding flow - show onboarding for first-time users
        if (!hasCompletedOnboarding) {
            if (!inOnboardingFlow) {
                router.replace('/onboarding');
            }
            return;
        }

        // RULE 3: UPDATED - Allow public access to main app
        // Users can browse videos without authentication
        if (!isAuthenticated) {
            // Only redirect to auth if they're trying to access restricted areas
            if (inAuthFlow) {
                // They're already in auth flow, let them stay
                return;
            }

            // If they're in a supported flow (tabs, post, live), let them browse publicly
            if (inSupportedFlows) {
                return;
            }

            // If they're not in any specific flow, redirect to main tabs (public browsing)
            if (!inOnboardingFlow && !inAccountSetupFlow) {
                router.replace('/(tabs)');
                return;
            }
        }

        // RULE 4: Authenticated users should not be in auth flow unless in signup
        if (isAuthenticated && inAuthFlow && !isInSignupFlow) {
            router.replace('/(tabs)');
            return;
        }

        // RULE 5: Authenticated users with completed onboarding should be in tabs (if not in post/live flows)
        if (isAuthenticated && hasCompletedOnboarding && !inSupportedFlows && !isInSignupFlow) {
            router.replace('/(tabs)');
            return;
        }

        // RULE 6: Redirect unverified users to verification page
        if (isAuthenticated && hasCompletedOnboarding && !isInSignupFlow && user && !user.verified &&
            !segments.join('/').includes('account-setup/verify')) {
            router.replace('/account-setup/verify');
            return;
        }

    }, [loading, isAuthenticated, hasCompletedOnboarding, isInSignupFlow, router, segments, user]);

    // Show loading indicator while checking auth state
    if (loading) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e'}}>
                <ActivityIndicator size="large" color="#FF5A5F"/>
            </View>
        );
    }

    // Important: Always render a Slot first before any navigation happens
    return <Slot/>;
}

// Root layout wrapper
export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded, error] = useFonts({
        Figtree_300Light,
        Figtree_400Regular,
        Figtree_500Medium,
        Figtree_600SemiBold,
        Figtree_700Bold,
        Figtree_800ExtraBold,
        Figtree_900Black,
        Figtree_300Light_Italic,
        Figtree_400Regular_Italic,
        Figtree_500Medium_Italic,
        Figtree_600SemiBold_Italic,
        Figtree_700Bold_Italic,
        Figtree_800ExtraBold_Italic,
        Figtree_900Black_Italic
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync().then(() => {
                // Ignore any errors here, just ensure splash screen is hidden
            });
        }
    }, [loaded, error]);

    if (!loaded) {
        return null;
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <SafeAreaProvider>
                <ErrorProvider>
                    <RegistrationProvider>
                        <AuthProvider>
                            <AuthModalProvider>
                                <SocketProvider>
                                    <MessageProvider>
                                        <NotificationProvider>
                                            <GestureHandlerRootView style={{ flex: 1 }}>
                                                {/* Configure StatusBar properly for both platforms */}
                                                <StatusBar
                                                    style="light"
                                                    backgroundColor="#1a1a2e"
                                                    translucent={Platform.OS === 'android'}
                                                />
                                                {/* Remove nested SafeAreaView - let individual screens handle it */}
                                                <RootLayoutNavigation/>
                                            </GestureHandlerRootView>
                                        </NotificationProvider>
                                    </MessageProvider>
                                </SocketProvider>
                            </AuthModalProvider>
                        </AuthProvider>
                    </RegistrationProvider>
                </ErrorProvider>
            </SafeAreaProvider>
        </ThemeProvider>
    );
}