import type { ReactNode } from 'react';

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

export interface SettingsHeaderProps {
    title: string;
    onBackPress?: () => void;
    rightElement?: ReactNode;
}

export interface SettingsSectionProps {
    title?: string;
    children: ReactNode;
    className?: string;
}

export interface SettingsItemProps {
    icon?: ReactNode;
    label: string;
    value?: ReactNode;
    onPress?: () => void;
    showChevron?: boolean;
    destructive?: boolean;
    disabled?: boolean;
}

export interface SettingsToggleProps {
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    icon?: ReactNode;
    disabled?: boolean;
}

export interface FieldEditItemProps {
    label: string;
    value: string;
    icon?: ReactNode;
    onPress: () => void;
}

export interface CategoryButtonProps {
    icon?: ReactNode;
    label: string;
    onPress: () => void;
    selected?: boolean;
}

export interface TabItem {
    key: string;
    label: string;
}

export interface TabNavigationProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (key: string) => void;
}
