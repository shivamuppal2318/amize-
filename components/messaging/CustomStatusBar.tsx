import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { COLORS } from './constants';

const CustomStatusBar: React.FC = () => (
    <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
        translucent={Platform.OS === 'android'}
    />
);

export default CustomStatusBar;