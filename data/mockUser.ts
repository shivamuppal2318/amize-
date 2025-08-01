import { createContext } from 'react';

export type Gender = 'male' | 'female' | 'other' | null;

export type UserContextType = {
    isAuthenticated: boolean;
    user: UserData | null;
    interests: string[];
    updateUser: (data: Partial<UserData>) => void;
    addInterest: (interest: string) => void;
    removeInterest: (interest: string) => void;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (userData: SignupData) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    setOnboardingComplete: () => Promise<void>;
    hasCompletedOnboarding: boolean;
    isInSignupFlow: boolean;
    completeSignupFlow: () => void;
};

export type UserData = {
    id: string;
    email: string;
    fullName: string;
    nickname: string;
    birthday: Date | null;
    gender: Gender;
    phoneNumber: string;
    interests: string[];
    hasSetPin: boolean;
    hasSetFingerprint: boolean;
};

export type SignupData = {
    email: string;
    password: string;
    fullName?: string;
    nickname?: string;
};

export const defaultUserContext: UserContextType = {
    isAuthenticated: false,
    user: null,
    interests: [],
    updateUser: () => {},
    addInterest: () => {},
    removeInterest: () => {},
    login: async () => false,
    signup: async () => false,
    logout: () => {},
    loading: false,
    setOnboardingComplete: async () => {},
    hasCompletedOnboarding: false,
    isInSignupFlow: false,
    completeSignupFlow: () => {},
};

export const mockUserData: UserData = {
    id: '1',
    email: 'user@videos.com',
    fullName: 'Steve Tom',
    nickname: 'ST',
    birthday: new Date(1995, 11, 17),
    gender: 'male',
    phoneNumber: '+254 758 481 320',
    interests: ['Gaming', 'Technology', 'Music'],
    hasSetPin: false,
    hasSetFingerprint: false,
};