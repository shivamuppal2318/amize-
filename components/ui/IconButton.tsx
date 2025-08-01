import React from 'react';
    import { TouchableOpacity, View, Text } from 'react-native';
    import { tv } from 'tailwind-variants';

    type IconButtonProps = {
        icon: React.ReactNode;
        onPress: () => void;
        label?: string;
        variant?: 'filled' | 'outline';
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
        className?: string;
    };

    const iconButtonVariants = tv({
        base: 'rounded-lg flex-row items-center justify-center',
        variants: {
            variant: {
                filled: 'bg-transparent',
                outline: 'bg-transparent border border-gray-600',
            },
            size: {
                sm: 'p-2',
                md: 'p-3',
                lg: 'p-4',
            },
            disabled: {
                true: 'opacity-50',
            },
        },
        defaultVariants: {
            variant: 'filled',
            size: 'md',
            disabled: false,
        },
    });

    export const IconButton = ({
        icon,
        onPress,
        label,
        variant = 'filled',
        size = 'md',
        disabled = false,
        className = '',
    }: IconButtonProps) => {
        const buttonClass = iconButtonVariants({
            variant,
            size,
            disabled,
            className,
        });

        return (
            <TouchableOpacity onPress={onPress} disabled={disabled} className={buttonClass}>
                <View className="flex-row items-center justify-center">
                    {icon}
                    {label && <Text className="text-white ml-2">{label}</Text>}
                </View>
            </TouchableOpacity>
        );
    };