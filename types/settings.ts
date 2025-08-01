import { ReactNode } from 'react';

// Common interface for icons
export interface SettingsIconProps {
    size?: number;
    color?: string;
}

// Settings item type for navigation items
export interface SettingsItemProps {
    icon: ReactNode;
    label: string;
    value?: string | ReactNode;
    onPress?: () => void;
    showChevron?: boolean;
    destructive?: boolean;
    disabled?: boolean;
}

// Toggle item props
export interface SettingsToggleProps {
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    icon?: ReactNode;
    disabled?: boolean;
}

// Settings section props
export interface SettingsSectionProps {
    title?: string;
    children: ReactNode;
    className?: string;
}

// Profile header props
export interface ProfileHeaderProps {
    username: string;
    description?: string;
    avatarUrl?: string;
    onEditPress?: () => void;
    showEditButton?: boolean;
}

// Settings header props
export interface SettingsHeaderProps {
    title: string;
    onBackPress?: () => void;
    rightElement?: ReactNode;
}

// Field edit item props
export interface FieldEditItemProps {
    label: string;
    value: string;
    icon?: ReactNode;
    onPress: () => void;
}

// Tab navigation props
export interface TabNavigationProps {
    tabs: {
        key: string;
        label: string;
    }[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

// Category button props
export interface CategoryButtonProps {
    icon?: ReactNode;
    label: string;
    onPress: () => void;
    selected?: boolean;
}

// User settings type
export interface UserSettings {
    language: string;
    darkMode: boolean;
    notifications: {
        push: boolean;
        email: boolean;
        marketing: boolean;
    };
    security: {
        biometric: boolean;
        faceId: boolean;
        rememberMe: boolean;
    };
    accessibility: {
        reduceMotion: boolean;
        largeText: boolean;
    };
}