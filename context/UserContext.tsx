import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { mockUserData, UserContextType, UserData, SignupData, Gender } from '@/data/mockUser';

export const UserContext = createContext<UserContextType>({
    isAuthenticated: false,
    user: null,
    interests: [],
    updateUser: () => {},
    addInterest: () => {},
    removeInterest: () => {},
    login: async () => false,
    signup: async () => false,
    logout: () => {},
    loading: true,
    setOnboardingComplete: async () => {},
    hasCompletedOnboarding: false,
    isInSignupFlow: false,
    completeSignupFlow: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [interests, setInterests] = useState<string[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
    const [isInSignupFlow, setIsInSignupFlow] = useState<boolean>(false);

    // Check app state on mount
    useEffect(() => {
        const checkAppState = async () => {
            try {
                // FIXED: For demo purposes, always force onboarding to show
                // by not reading the stored value and keeping hasCompletedOnboarding as false
                setHasCompletedOnboarding(false);

                // Check if user is logged in
                const userJSON = await SecureStore.getItemAsync('user');

                // Check if user is in signup flow
                const signupFlow = await SecureStore.getItemAsync('signupFlow');
                setIsInSignupFlow(!!signupFlow);

                if (userJSON) {
                    try {
                        const userData = JSON.parse(userJSON);
                        setUser(userData);
                        setInterests(userData.interests || []);
                        setIsAuthenticated(true);
                    } catch (parseError) {
                        console.error('Error parsing user data:', parseError);
                        // Clear invalid data
                        await SecureStore.deleteItemAsync('user');
                    }
                }
            } catch (error) {
                console.error('Error retrieving app state:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAppState().then(r => {
            //Ignore
        });
    }, []);

    const updateUser = (data: Partial<UserData>) => {
        console.log(`UserContext: Updating user with:`, data);
        if (user) {
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);

            // Save to secure storage
            SecureStore.setItemAsync('user', JSON.stringify(updatedUser))
                .then(() => console.log("UserContext: User data saved"))
                .catch(error => console.error('Error saving user data:', error));
        }
    };

    const addInterest = (interest: string) => {
        if (!interests.includes(interest)) {
            const newInterests = [...interests, interest];
            setInterests(newInterests);
            if (user) {
                updateUser({ interests: newInterests });
            }
        }
    };

    const removeInterest = (interest: string) => {
        const newInterests = interests.filter(i => i !== interest);
        setInterests(newInterests);
        if (user) {
            updateUser({ interests: newInterests });
        }
    };

    const setOnboardingComplete = async (): Promise<void> => {
        console.log("UserContext: Setting onboarding as complete");
        try {
            await SecureStore.setItemAsync('onboardingCompleted', 'true');
            setHasCompletedOnboarding(true);
            console.log("UserContext: Onboarding marked as complete");
        } catch (error) {
            console.error('Error saving onboarding state:', error);
        }
    };

    // New function to mark the signup flow as complete
    const completeSignupFlow = async () => {
        console.log("UserContext: Completing signup flow");
        try {
            await SecureStore.deleteItemAsync('signupFlow');
            setIsInSignupFlow(false);
            console.log("UserContext: Signup flow marked as complete");
        } catch (error) {
            console.error('Error updating signup flow state:', error);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        console.log(`UserContext: Attempting login for ${email}`);
        setLoading(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For demo purposes, any email/password combination works
            // and returns the mock user data
            const userData = {
                ...mockUserData,
                email: email,
                id: Math.random().toString(36).substr(2, 9), // Generate random ID
            };

            setUser(userData);
            setInterests(userData.interests || []);
            setIsAuthenticated(true);

            // Save to secure storage
            await SecureStore.setItemAsync('user', JSON.stringify(userData));
            console.log(`UserContext: Login successful for ${email}`);

            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData: SignupData): Promise<boolean> => {
        console.log(`UserContext: Creating account for ${userData.email}`);
        setLoading(true);
        try {
            // Mark that we're entering signup flow BEFORE authentication
            await SecureStore.setItemAsync('signupFlow', 'true');
            setIsInSignupFlow(true);
            console.log("UserContext: Marked as in signup flow");

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create a new user with the provided data and some default values
            const newUser = {
                ...mockUserData,
                id: Math.random().toString(36).substr(2, 9),
                email: userData.email,
                fullName: userData.fullName || '',
                nickname: userData.nickname || '',
                interests: [],
                gender: null as Gender,
                birthday: null,
                hasSetPin: false,
                hasSetFingerprint: false,
            };

            setUser(newUser);
            setInterests([]);
            setIsAuthenticated(true);

            // Save to secure storage
            await SecureStore.setItemAsync('user', JSON.stringify(newUser));
            console.log(`UserContext: Account created for ${userData.email}`);

            // FIXED: Make sure storage is updated first
            await new Promise(resolve => setTimeout(resolve, 200));

            return true;
        } catch (error) {
            // Clear signup flow flag on error
            await SecureStore.deleteItemAsync('signupFlow');
            setIsInSignupFlow(false);
            console.error('Signup error:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        console.log("UserContext: Logging out");
        try {
            await SecureStore.deleteItemAsync('user');
            await SecureStore.deleteItemAsync('signupFlow'); // Clear signup flow on logout
            await SecureStore.deleteItemAsync('onboardingCompleted'); // FIXED: Clear onboarding status on logout for demo
            setUser(null);
            setInterests([]);
            setIsAuthenticated(false);
            setIsInSignupFlow(false);
            setHasCompletedOnboarding(false); // FIXED: Reset onboarding status for demo
            console.log("UserContext: Logout complete");
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // For debugging
    useEffect(() => {
        console.log("UserContext state updated:");
        console.log(`- isAuthenticated: ${isAuthenticated}`);
        console.log(`- hasCompletedOnboarding: ${hasCompletedOnboarding}`);
        console.log(`- isInSignupFlow: ${isInSignupFlow}`);
        console.log(`- loading: ${loading}`);
    }, [isAuthenticated, hasCompletedOnboarding, isInSignupFlow, loading]);

    return (
        <UserContext.Provider
            value={{
                isAuthenticated,
                user,
                interests,
                updateUser,
                addInterest,
                removeInterest,
                login,
                signup,
                logout,
                loading,
                setOnboardingComplete,
                hasCompletedOnboarding,
                isInSignupFlow,
                completeSignupFlow,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};