import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ScrollView,
} from 'react-native';
import { StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useRegistration } from '@/context/RegistrationContext';

// @ts-ignore
import AmizeLogo from '@/assets/images/amize.png';

const AMIZE_LOGO = AmizeLogo;

export default function PinScreen() {
    const {
        registrationData,
        updateRegistrationData,
        validateField,
        registrationErrors,
        setCurrentStep,
    } = useRegistration();

    const [pin, setPin] = useState<string>(registrationData.pin || '');
    const [usePin, setUsePin] = useState<boolean>(registrationData.usePin || false);
    const [inputValues, setInputValues] = useState<string[]>(['', '', '', '']);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        setCurrentStep(5);
    }, [setCurrentStep]);

    useEffect(() => {
        updateRegistrationData({ usePin });

        if (!usePin) {
            setPin('');
            setInputValues(['', '', '', '']);
            updateRegistrationData({ pin: '' });
        }
    }, [usePin, updateRegistrationData]);

    const handleInputChange = (text: string, index: number) => {
        if (!/^\d*$/.test(text)) {
            return;
        }

        const newInputValues = [...inputValues];
        newInputValues[index] = text;
        setInputValues(newInputValues);

        const fullPin = newInputValues.join('');
        setPin(fullPin);
        updateRegistrationData({ pin: fullPin });

        if (text.length === 1 && index < 3) {
            inputRefs.current[index + 1]?.focus();
        } else if (text.length === 0 && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleContinue = () => {
        if (usePin) {
            if (pin.length !== 4) {
                Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN.');
                return;
            }

            if (!validateField('pin')) {
                return;
            }
        }

        router.push('/account-setup/fingerprint');
    };

    const handleSkip = () => {
        updateRegistrationData({ usePin: false, pin: '' });
        router.push('/account-setup/fingerprint');
    };

    return (
        <>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
            />
            <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ flex: 1, paddingHorizontal: 24 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 16,
                            }}
                        >
                            <TouchableOpacity
                                style={{ padding: 8, marginLeft: -8 }}
                                onPress={() => router.back()}
                            >
                                <ChevronLeft size={24} color="white" />
                            </TouchableOpacity>

                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 18,
                                    fontWeight: '600',
                                    fontFamily: 'Figtree',
                                }}
                            >
                                Security Setup
                            </Text>

                            <TouchableOpacity onPress={handleSkip}>
                                <Text
                                    style={{
                                        color: '#FF5A5F',
                                        fontSize: 16,
                                        fontWeight: '500',
                                        fontFamily: 'Figtree',
                                    }}
                                >
                                    Skip
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View
                            style={{ flex: 1, alignItems: 'center', paddingVertical: 20 }}
                        >
                            <View style={{ alignItems: 'center', marginBottom: 48 }}>
                                <View
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        backgroundColor: '#FF5A5F',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 24,
                                    }}
                                >
                                    <Image
                                        source={AMIZE_LOGO}
                                        style={{ width: 80, height: 80, borderRadius: 40 }}
                                        resizeMode="contain"
                                    />
                                </View>

                                <Text
                                    style={{
                                        fontFamily: 'Figtree',
                                        color: 'white',
                                        fontSize: 24,
                                        fontWeight: 'bold',
                                        marginBottom: 8,
                                        textAlign: 'center',
                                    }}
                                >
                                    Amize Security
                                </Text>

                                <Text
                                    style={{
                                        color: '#9CA3AF',
                                        fontSize: 16,
                                        fontFamily: 'Figtree',
                                        textAlign: 'center',
                                        paddingHorizontal: 20,
                                        lineHeight: 24,
                                    }}
                                >
                                    Create a 4-digit PIN for an extra layer of security
                                </Text>
                            </View>

                            <View style={{ paddingHorizontal: 32, marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {[0, 1, 2, 3, 4].map((index) => (
                                        <View
                                            key={index}
                                            style={{
                                                flex: 1,
                                                height: 8,
                                                backgroundColor: '#FF5A5F',
                                                borderRadius: 4,
                                            }}
                                        />
                                    ))}
                                </View>
                                <Text
                                    style={{
                                        color: '#9CA3AF',
                                        fontSize: 14,
                                        textAlign: 'center',
                                        marginTop: 8,
                                        fontFamily: 'Figtree',
                                    }}
                                >
                                    Step 5 of 5
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    maxWidth: 400,
                                    marginBottom: 32,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => setUsePin(!usePin)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 20,
                                        borderRadius: 16,
                                        borderWidth: 2,
                                        borderColor: usePin ? '#FF5A5F' : '#374151',
                                        backgroundColor: usePin
                                            ? 'rgba(255, 90, 95, 0.1)'
                                            : '#1a1a2e',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 24,
                                            backgroundColor: usePin ? '#FF5A5F' : '#6B7280',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 16,
                                        }}
                                    >
                                        <Lock size={24} color="white" />
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                color: 'white',
                                                fontSize: 16,
                                                fontWeight: '600',
                                                fontFamily: 'Figtree',
                                                marginBottom: 2,
                                            }}
                                        >
                                            Enable PIN Security
                                        </Text>
                                        <Text
                                            style={{
                                                color: '#9CA3AF',
                                                fontSize: 14,
                                                fontFamily: 'Figtree',
                                            }}
                                        >
                                            Protect your account with a PIN
                                        </Text>
                                    </View>

                                    <View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            borderWidth: 2,
                                            borderColor: usePin ? '#FF5A5F' : '#6B7280',
                                            backgroundColor: usePin ? '#FF5A5F' : 'transparent',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {usePin && (
                                            <View
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 4,
                                                    backgroundColor: 'white',
                                                }}
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {usePin && (
                                <View
                                    style={{
                                        width: '100%',
                                        maxWidth: 300,
                                        marginBottom: 32,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#9CA3AF',
                                            fontSize: 16,
                                            fontFamily: 'Figtree',
                                            textAlign: 'center',
                                            marginBottom: 24,
                                        }}
                                    >
                                        Enter your 4-digit PIN
                                    </Text>

                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                        }}
                                    >
                                        {[0, 1, 2, 3].map((index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref) => {
                                                    inputRefs.current[index] = ref;
                                                }}
                                                style={{
                                                    width: 64,
                                                    height: 64,
                                                    backgroundColor: '#1a1a2e',
                                                    borderRadius: 16,
                                                    color: 'white',
                                                    textAlign: 'center',
                                                    fontSize: 24,
                                                    fontWeight: 'bold',
                                                    fontFamily: 'Figtree',
                                                    borderWidth: 2,
                                                    borderColor: inputValues[index]
                                                        ? '#FF5A5F'
                                                        : '#4B5563',
                                                }}
                                                keyboardType="number-pad"
                                                maxLength={1}
                                                secureTextEntry
                                                value={inputValues[index]}
                                                onChangeText={(text) => handleInputChange(text, index)}
                                                onKeyPress={({ nativeEvent }) => {
                                                    if (
                                                        nativeEvent.key === 'Backspace' &&
                                                        !inputValues[index] &&
                                                        index > 0
                                                    ) {
                                                        inputRefs.current[index - 1]?.focus();
                                                    }
                                                }}
                                            />
                                        ))}
                                    </View>

                                    {registrationErrors.pin && (
                                        <Text
                                            style={{
                                                color: '#EF4444',
                                                marginTop: 12,
                                                textAlign: 'center',
                                                fontFamily: 'Figtree',
                                            }}
                                        >
                                            {registrationErrors.pin}
                                        </Text>
                                    )}

                                    {pin.length === 4 && (
                                        <Text
                                            style={{
                                                color: '#10B981',
                                                marginTop: 12,
                                                textAlign: 'center',
                                                fontFamily: 'Figtree',
                                                fontSize: 14,
                                            }}
                                        >
                                            PIN set successfully
                                        </Text>
                                    )}
                                </View>
                            )}

                            <View
                                style={{
                                    backgroundColor: '#1a1a2e',
                                    borderWidth: 1,
                                    borderColor: '#374151',
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 24,
                                    width: '100%',
                                    maxWidth: 400,
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#9CA3AF',
                                        fontSize: 14,
                                        fontFamily: 'Figtree',
                                        textAlign: 'center',
                                        lineHeight: 20,
                                    }}
                                >
                                    Your PIN will be required each time you open the app for enhanced security.
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                paddingBottom: 32,
                                width: '100%',
                                maxWidth: 400,
                                alignSelf: 'center',
                            }}
                        >
                            <Button
                                label={usePin ? 'Set PIN' : 'Continue without PIN'}
                                onPress={handleContinue}
                                variant="primary"
                                fullWidth
                                disabled={usePin && pin.length !== 4}
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}
