import { User } from '../api/types';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface AuthContextState {
    isAuthenticated: boolean;
    user: User | null;
    interests: string[];
    loading: boolean;
    hasCompletedOnboarding: boolean;
    isInSignupFlow: boolean;
}

export interface LoginResult {
    success: boolean;
    message?: string;
}

export interface RegisterResult {
    success: boolean;
    message?: string;
    verificationCode?: string;
}

// Update this interface to match the actual parameters we're using
export interface AuthContextValue extends AuthContextState {
    login: (email: string, password: string, deviceInfo?: any) => Promise<LoginResult>;
    register: (userData: any) => Promise<RegisterResult>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
    addInterest: (interest: string) => void;
    removeInterest: (interest: string) => void;
    setOnboardingComplete: () => Promise<void>;
    completeSignupFlow: () => Promise<void>;
    startSignupFlow: () => Promise<void>;
}

// Registration-specific types
export interface RegistrationData {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    gender?: string;
    dateOfBirth?: string;
    interests?: string[];
    profilePhotoUrl?: string;
    usePin?: boolean;
    pin?: string;
    useFingerprint?: boolean;
    useFaceId?: boolean;
}
