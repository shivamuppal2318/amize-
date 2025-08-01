import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, Image, Alert, ScrollView } from 'react-native';
import { StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Shield, Lock } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useRegistration } from '@/context/RegistrationContext';

// @ts-ignore
import AmizeLogo from '@/assets/images/amize.png';
const AMIZE_LOGO = Image.resolveAssetSource(AmizeLogo).uri;

export default function PinScreen() {
    const { registrationData, updateRegistrationData, validateField, registrationErrors, setCurrentStep } = useRegistration();

    const [pin, setPin] = useState<string>(registrationData.pin || '');
    const [usePin, setUsePin] = useState<boolean>(registrationData.usePin || false);
    const [inputValues, setInputValues] = useState<string[]>(['', '', '', '']);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Set the current step
    useEffect(() => {
        setCurrentStep(5);
    }, []);

    // Update PIN when toggle changes
    useEffect(() => {
        updateRegistrationData({ usePin });
        if (!usePin) {
            setPin('');
            setInputValues(['', '', '', '']);
            updateRegistrationData({ pin: '' });
        }
    }, [usePin]);

    // Handle PIN input
    const handleInputChange = (text: string, index: number) => {
        // Allow only digits
        if (!/^\d*$/.test(text)) return;

        // Update input values
        const newInputValues = [...inputValues];
        newInputValues[index] = text;
        setInputValues(newInputValues);

        // Combine all inputs to form the complete PIN
        const fullPin = newInputValues.join('');
        setPin(fullPin);
        updateRegistrationData({ pin: fullPin });

        // Move focus to next input or previous input based on whether text was entered or deleted
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

            // Validate PIN format
            if (!validateField('pin')) {
                return;
            }
        }

        // Navigate to fingerprint screen
        router.push('/account-setup/fingerprint');
    };

    const handleSkip = () => {
        // Set PIN disabled
        updateRegistrationData({ usePin: false, pin: '' });

        // Navigate to fingerprint screen
        router.push('/account-setup/fingerprint');
    };

    const handlePrevious = () => {
        router.back();
    };

    return (
        <>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
            />
            <SafeAreaView
                style={{ flex: 1, backgroundColor: '#1a1a2e' }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ flex: 1, paddingHorizontal: 24 }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 16
                        }}>
                            <TouchableOpacity
                                style={{ padding: 8, marginLeft: -8 }}
                                onPress={handlePrevious}
                            >
                                <ChevronLeft size={24} color="white" />
                            </TouchableOpacity>

                            <Text style={{
                                color: 'white',
                                fontSize: 18,
                                fontWeight: '600',
                                fontFamily: 'Figtree'
                            }}>
                                Security Setup
                            </Text>

                            <TouchableOpacity onPress={handleSkip}>
                                <Text style={{
                                    color: '#FF5A5F',
                                    fontSize: 16,
                                    fontWeight: '500',
                                    fontFamily: 'Figtree'
                                }}>
                                    Skip
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Content Container */}
                        <View style={{ flex: 1, alignItems: 'center', paddingVertical: 20 }}>

                            {/* Logo and Header Section */}
                            <View style={{ alignItems: 'center', marginBottom: 48 }}>
                                {/* Security Icon */}
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    backgroundColor: '#FF5A5F',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 24
                                }}>
                                    <Image
                                        source={{ uri: AMIZE_LOGO }}
                                        style={{ width: 80, height: 80, borderRadius: 40 }}
                                        resizeMode="contain"
                                    />
                                </View>

                                {/* Title */}
                                <Text style={{
                                    fontFamily: 'Figtree',
                                    color: 'white',
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    marginBottom: 8,
                                    textAlign: 'center'
                                }}>
                                    Amize Security
                                </Text>

                                {/* Subtitle */}
                                <Text style={{
                                    color: '#9CA3AF',
                                    fontSize: 16,
                                    fontFamily: 'Figtree',
                                    textAlign: 'center',
                                    paddingHorizontal: 20,
                                    lineHeight: 24
                                }}>
                                    Create a 4-digit PIN for an extra layer of security
                                </Text>
                            </View>

                            {/* Progress Indicator */}
                            <View style={{ paddingHorizontal: 32, marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={{
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: '#FF5A5F',
                                        borderRadius: 4
                                    }} />
                                    <View style={{
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: '#FF5A5F',
                                        borderRadius: 4
                                    }} />
                                    <View style={{
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: '#FF5A5F',
                                        borderRadius: 4
                                    }} />
                                    <View style={{
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: '#FF5A5F',
                                        borderRadius: 4
                                    }} />
                                    <View style={{
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: '#FF5A5F',
                                        borderRadius: 4
                                    }} />
                                </View>
                                <Text style={{
                                    color: '#9CA3AF',
                                    fontSize: 14,
                                    textAlign: 'center',
                                    marginTop: 8,
                                    fontFamily: 'Figtree'
                                }}>
                                    Step 5 of 5
                                </Text>
                            </View>

                            {/* PIN Toggle */}
                            <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
                                <TouchableOpacity
                                    onPress={() => setUsePin(!usePin)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 20,
                                        borderRadius: 16,
                                        borderWidth: 2,
                                        borderColor: usePin ? '#FF5A5F' : '#374151',
                                        backgroundColor: usePin ? 'rgba(255, 90, 95, 0.1)' : '#1a1a2e'
                                    }}
                                >
                                    {/* Lock Icon */}
                                    <View style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 24,
                                        backgroundColor: usePin ? '#FF5A5F' : '#6B7280',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 16
                                    }}>
                                        <Lock size={24} color="white" />
                                    </View>

                                    {/* Text */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            color: 'white',
                                            fontSize: 16,
                                            fontWeight: '600',
                                            fontFamily: 'Figtree',
                                            marginBottom: 2
                                        }}>
                                            Enable PIN Security
                                        </Text>
                                        <Text style={{
                                            color: '#9CA3AF',
                                            fontSize: 14,
                                            fontFamily: 'Figtree'
                                        }}>
                                            Protect your account with a PIN
                                        </Text>
                                    </View>

                                    {/* Toggle Indicator */}
                                    <View style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 10,
                                        borderWidth: 2,
                                        borderColor: usePin ? '#FF5A5F' : '#6B7280',
                                        backgroundColor: usePin ? '#FF5A5F' : 'transparent',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {usePin && (
                                            <View style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: 'white'
                                            }} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* PIN Input */}
                            {usePin && (
                                <View style={{ width: '100%', maxWidth: 300, marginBottom: 32 }}>
                                    <Text style={{
                                        color: '#9CA3AF',
                                        fontSize: 16,
                                        fontFamily: 'Figtree',
                                        textAlign: 'center',
                                        marginBottom: 24
                                    }}>
                                        Enter your 4-digit PIN
                                    </Text>

                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        gap: 12
                                    }}>
                                        {[0, 1, 2, 3].map((index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref) => (inputRefs.current[index] = ref)}
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
                                                    borderColor: inputValues[index] ? '#FF5A5F' : '#4B5563'
                                                }}
                                                keyboardType="number-pad"
                                                maxLength={1}
                                                secureTextEntry
                                                value={inputValues[index]}
                                                onChangeText={(text) => handleInputChange(text, index)}
                                                onKeyPress={({ nativeEvent }) => {
                                                    if (nativeEvent.key === 'Backspace' && !inputValues[index] && index > 0) {
                                                        inputRefs.current[index - 1]?.focus();
                                                    }
                                                }}
                                            />
                                        ))}
                                    </View>

                                    {registrationErrors.pin && (
                                        <Text style={{
                                            color: '#EF4444',
                                            marginTop: 12,
                                            textAlign: 'center',
                                            fontFamily: 'Figtree'
                                        }}>
                                            {registrationErrors.pin}
                                        </Text>
                                    )}

                                    {pin.length === 4 && (
                                        <Text style={{
                                            color: '#10B981',
                                            marginTop: 12,
                                            textAlign: 'center',
                                            fontFamily: 'Figtree',
                                            fontSize: 14
                                        }}>
                                            PIN set successfully
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Security Notice */}
                            <View style={{
                                backgroundColor: '#1a1a2e',
                                borderWidth: 1,
                                borderColor: '#374151',
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 24,
                                width: '100%',
                                maxWidth: 400
                            }}>
                                <Text style={{
                                    color: '#9CA3AF',
                                    fontSize: 14,
                                    fontFamily: 'Figtree',
                                    textAlign: 'center',
                                    lineHeight: 20
                                }}>
                                    💡 Your PIN will be required each time you open the app for enhanced security
                                </Text>
                            </View>
                        </View>

                        {/* Continue Button */}
                        <View style={{ paddingBottom: 32, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                            <Button
                                label={usePin ? "Set PIN" : "Continue without PIN"}
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