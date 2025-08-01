//context/RegistrationContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { RegisterRequest } from '@/lib/api/types';

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
    verificationCode?: string;
}

export interface RegistrationErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    pin?: string;
    verificationCode?: string;
}

interface RegistrationContextType {
    registrationData: RegistrationData;
    registrationErrors: RegistrationErrors;
    updateRegistrationData: (data: Partial<RegistrationData>) => void;
    clearRegistrationData: () => void;
    validateField: (field: keyof RegistrationData) => boolean;
    validateRegistrationData: () => boolean;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    getRegistrationRequest: () => RegisterRequest; // New function to get API request data
}

const RegistrationContext = createContext<RegistrationContextType>({
    registrationData: {},
    registrationErrors: {},
    updateRegistrationData: () => {},
    clearRegistrationData: () => {},
    validateField: () => false,
    validateRegistrationData: () => false,
    currentStep: 1,
    setCurrentStep: () => {},
    getRegistrationRequest: () => ({} as RegisterRequest),
});

export const RegistrationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [registrationData, setRegistrationData] = useState<RegistrationData>({});
    const [registrationErrors, setRegistrationErrors] = useState<RegistrationErrors>({});
    const [currentStep, setCurrentStep] = useState<number>(1);

    const updateRegistrationData = (data: Partial<RegistrationData>) => {
        setRegistrationData(prev => ({ ...prev, ...data }));

        // Clear errors for updated fields
        const updatedFields = Object.keys(data) as Array<keyof RegistrationData>;
        const errorUpdates: Partial<RegistrationErrors> = {};

        updatedFields.forEach(field => {
            if (field in registrationErrors) {
                errorUpdates[field as keyof RegistrationErrors] = undefined;
            }
        });

        if (Object.keys(errorUpdates).length > 0) {
            setRegistrationErrors(prev => ({ ...prev, ...errorUpdates }));
        }
    };

    const clearRegistrationData = () => {
        setRegistrationData({});
        setRegistrationErrors({});
        setCurrentStep(1);
    };

    // New function to prepare registration request data
    const getRegistrationRequest = (): RegisterRequest => {
        // Format the registration data into a proper API request
        return {
            username: registrationData.username || '',
            email: registrationData.email || '',
            password: registrationData.password || '',
            confirmPassword: registrationData.confirmPassword || '',
            firstName: registrationData.firstName || '',
            lastName: registrationData.lastName || '',
            bio: registrationData.bio || '',
            gender: registrationData.gender || '',
            dateOfBirth: registrationData.dateOfBirth || '',
            interests: registrationData.interests || [],
            profilePhotoUrl: registrationData.profilePhotoUrl || '',
            deviceId: '', // This will be added later by the auth service
            deviceInfo: undefined, // This will be added later by the auth service
        };
    };

    // Validation functions
    const isValidUsername = (username: string): boolean => {
        // Only allow alphanumeric characters, underscores, and periods
        // Must be 3-30 characters long
        const usernameRegex = /^[a-zA-Z0-9_.]{3,30}$/;
        return usernameRegex.test(username);
    };

    const isStrongPassword = (password: string): { isValid: boolean; message: string } => {
        if (password.length < 8) {
            return { isValid: false, message: "Password must be at least 8 characters long" };
        }

        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            return { isValid: false, message: "Password must contain at least one uppercase letter" };
        }

        // Check for at least one lowercase letter
        if (!/[a-z]/.test(password)) {
            return { isValid: false, message: "Password must contain at least one lowercase letter" };
        }

        // Check for at least one number
        if (!/[0-9]/.test(password)) {
            return { isValid: false, message: "Password must contain at least one number" };
        }

        // Check for at least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return { isValid: false, message: "Password must contain at least one special character" };
        }

        return { isValid: true, message: "" };
    };

    const calculateAge = (dateOfBirth: Date): number => {
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDifference = today.getMonth() - dateOfBirth.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }

        return age;
    };

    const validateField = (field: keyof RegistrationData): boolean => {
        let isValid = true;
        const errors: Partial<RegistrationErrors> = {};

        switch (field) {
            case 'username':
                if (!registrationData.username) {
                    errors.username = 'Username is required';
                    isValid = false;
                } else if (!isValidUsername(registrationData.username)) {
                    errors.username = 'Username can only contain letters, numbers, underscores, and periods';
                    isValid = false;
                }
                break;

            case 'email':
                if (!registrationData.email) {
                    errors.email = 'Email is required';
                    isValid = false;
                } else if (!/\S+@\S+\.\S+/.test(registrationData.email)) {
                    errors.email = 'Email is invalid';
                    isValid = false;
                }
                break;

            case 'password':
                if (!registrationData.password) {
                    errors.password = 'Password is required';
                    isValid = false;
                } else {
                    const passwordCheck = isStrongPassword(registrationData.password);
                    if (!passwordCheck.isValid) {
                        errors.password = passwordCheck.message;
                        isValid = false;
                    }
                }
                break;

            case 'confirmPassword':
                if (registrationData.password !== registrationData.confirmPassword) {
                    errors.confirmPassword = 'Passwords do not match';
                    isValid = false;
                }
                break;

            case 'firstName':
                if (!registrationData.firstName) {
                    errors.firstName = 'First name is required';
                    isValid = false;
                } else if (registrationData.firstName.length < 2) {
                    errors.firstName = 'First name must be at least 2 characters';
                    isValid = false;
                }
                break;

            case 'lastName':
                if (!registrationData.lastName) {
                    errors.lastName = 'Last name is required';
                    isValid = false;
                } else if (registrationData.lastName.length < 2) {
                    errors.lastName = 'Last name must be at least 2 characters';
                    isValid = false;
                }
                break;

            case 'dateOfBirth':
                if (registrationData.dateOfBirth) {
                    const dateOfBirth = new Date(registrationData.dateOfBirth);
                    if (isNaN(dateOfBirth.getTime())) {
                        errors.dateOfBirth = 'Invalid date format';
                        isValid = false;
                    } else if (calculateAge(dateOfBirth) < 13) {
                        errors.dateOfBirth = 'You must be at least 13 years old to register';
                        isValid = false;
                    }
                }
                break;

            case 'pin':
                if (registrationData.usePin && (!registrationData.pin || !/^\d{4}$/.test(registrationData.pin))) {
                    errors.pin = 'PIN must be 4 digits';
                    isValid = false;
                }
                break;

            case 'verificationCode':
                if (!registrationData.verificationCode) {
                    errors.verificationCode = 'Verification code is required';
                    isValid = false;
                } else if (!/^\d{6}$/.test(registrationData.verificationCode)) {
                    errors.verificationCode = 'Verification code must be 6 digits';
                    isValid = false;
                }
                break;
        }

        setRegistrationErrors(prev => ({ ...prev, ...errors }));
        return isValid;
    };

    const validateRegistrationData = (): boolean => {
        // Validate all required fields based on current step
        const errors: RegistrationErrors = {};
        let isValid = true;

        // Basic registration fields (step 1)
        if (!registrationData.username) {
            errors.username = 'Username is required';
            isValid = false;
        } else if (!isValidUsername(registrationData.username)) {
            errors.username = 'Username can only contain letters, numbers, underscores, and periods';
            isValid = false;
        }

        if (!registrationData.email) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(registrationData.email)) {
            errors.email = 'Email is invalid';
            isValid = false;
        }

        if (!registrationData.password) {
            errors.password = 'Password is required';
            isValid = false;
        } else {
            const passwordCheck = isStrongPassword(registrationData.password);
            if (!passwordCheck.isValid) {
                errors.password = passwordCheck.message;
                isValid = false;
            }
        }

        if (registrationData.password !== registrationData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        // Complete profile fields (needed before final API call)
        if (currentStep >= 3) {
            if (!registrationData.firstName) {
                errors.firstName = 'First name is required';
                isValid = false;
            } else if (registrationData.firstName.length < 2) {
                errors.firstName = 'First name must be at least 2 characters';
                isValid = false;
            }

            if (!registrationData.lastName) {
                errors.lastName = 'Last name is required';
                isValid = false;
            } else if (registrationData.lastName.length < 2) {
                errors.lastName = 'Last name must be at least 2 characters';
                isValid = false;
            }

            if (registrationData.dateOfBirth) {
                const dateOfBirth = new Date(registrationData.dateOfBirth);
                if (isNaN(dateOfBirth.getTime())) {
                    errors.dateOfBirth = 'Invalid date format';
                    isValid = false;
                } else if (calculateAge(dateOfBirth) < 13) {
                    errors.dateOfBirth = 'You must be at least 13 years old to register';
                    isValid = false;
                }
            }
        }

        setRegistrationErrors(errors);
        return isValid;
    };

    return (
        <RegistrationContext.Provider
            value={{
                registrationData,
                registrationErrors,
                updateRegistrationData,
                clearRegistrationData,
                validateField,
                validateRegistrationData,
                currentStep,
                setCurrentStep,
                getRegistrationRequest,
            }}
        >
            {children}
        </RegistrationContext.Provider>
    );
};

export const useRegistration = () => useContext(RegistrationContext);