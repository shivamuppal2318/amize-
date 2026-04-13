// Request Types
export interface DeviceInfo {
    deviceName?: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
}

export interface LoginRequest {
    identifier: string;
    password: string;
    deviceId?: string;
    deviceInfo?: DeviceInfo;
}

export interface RegisterRequest {
    username: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    gender?: string;
    dateOfBirth?: string;
    interests?: string[];
    profilePhotoUrl?: string;
    deviceId?: string;
    deviceInfo?: DeviceInfo;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface GoogleLoginRequest {
    idToken: string;
}

export interface FacebookLoginRequest {
    accessToken: string;
}

export interface AppleLoginRequest {
    identityToken: string;
    userIdentifier?: string;
    email?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
}

// Response Types
export interface Interest {
    id: string;
    name: string;
}

interface BioObject {
    name: string;
    category: string;
    email: string;
  }

export interface User {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    bio?: string | BioObject | null;
    profilePhotoUrl?: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    gender?: string;
    verified: boolean;
    role: 'USER' | 'CREATOR' | 'ADMIN';
    creatorVerified: boolean;
    creatorCategory?: string;
    monetizationEnabled: boolean;
    adminPermissions?: string;
    useFingerprint: boolean;
    useFaceId: boolean;
    instagramHandle?: string;
    facebookHandle?: string;
    twitterHandle?: string;
    isPrivate: boolean;
    isBusinessAccount: boolean;
    language: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    deactivatedAt?: string;
    interests: Interest[];
}

export interface AuthResponse {
    verificationCode: string;
    success: boolean;
    message: string;
    user: User;
    token: string;
    refreshToken: string;
}

export interface VerifyCodeResponse {
    success: boolean;
    message?: string;
    user?: User;
    token?: string;
    refreshToken?: string;
}

export interface VerifyCodeRequest {
    identifier: string;
    code: string;
}

export interface RefreshTokenResponse {
    success: boolean;
    message?: string;
    token?: string;
    refreshToken?: string;
}

export interface ResendCodeResponse {
    success: boolean;
    message?: string;
    verificationCode?: string; // For development only
}

// Auth Context Types
export interface LoginResult {
    success: boolean;
    message?: string;
}

export interface RegisterResult {
    success: boolean;
    message?: string;
    verificationCode?: string;
}

export interface AuthContextValue {
    isAuthenticated: boolean;
    user: User | null;
    interests: string[];
    loading: boolean;
    hasCompletedOnboarding: boolean;
    isInSignupFlow: boolean;
    login: (identifier: string, password: string) => Promise<LoginResult>;
    loginWithGoogle: (idToken: string) => Promise<LoginResult>;
    loginWithFacebook: (accessToken: string) => Promise<LoginResult>;
    loginWithApple: (data: AppleLoginRequest) => Promise<LoginResult>;
    register: (userData: RegisterRequest) => Promise<RegisterResult>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
    addInterest: (interest: string) => void;
    removeInterest: (interest: string) => void;
    setOnboardingComplete: () => Promise<void>;
    completeSignupFlow: () => Promise<void>;
    verifyCode: (identifier: string, code: string) => Promise<VerifyCodeResponse>;
    resendVerificationCode: (identifier: string) => Promise<ResendCodeResponse>;
    startSignupFlow: () => Promise<void>;
}
