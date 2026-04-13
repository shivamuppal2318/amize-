import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Animated,
} from 'react-native';
import { StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Fingerprint, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useRegistration } from '@/context/RegistrationContext';

export default function FingerprintScreen() {
    const [scanning, setScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const { updateRegistrationData } = useRegistration();

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (scanning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0.3,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
            fadeAnim.setValue(0.3);
        }
    }, [fadeAnim, pulseAnim, scanning]);

    const handleScanFingerprint = () => {
        setScanning(true);

        setTimeout(() => {
            setScanning(false);
            setScanComplete(true);
            updateRegistrationData({ useFingerprint: true });

            setTimeout(() => {
                router.push('/account-setup/success');
            }, 1500);
        }, 3000);
    };

    const handleSkip = () => {
        updateRegistrationData({ useFingerprint: false });
        router.push('/account-setup/success');
    };

    const handleContinue = () => {
        router.push('/account-setup/success');
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
                                Biometric Security
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
                            <View style={{ alignItems: 'center', marginBottom: 32 }}>
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
                                    <Fingerprint size={40} color="white" />
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
                                    Set Your Fingerprint
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
                                    Add a fingerprint to make your account more secure.
                                </Text>
                            </View>

                            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                                <TouchableOpacity
                                    onPress={
                                        !scanning && !scanComplete
                                            ? handleScanFingerprint
                                            : undefined
                                    }
                                    disabled={scanning || scanComplete}
                                    style={{ alignItems: 'center' }}
                                >
                                    <Animated.View
                                        style={{
                                            width: 200,
                                            height: 200,
                                            borderRadius: 100,
                                            borderWidth: 2,
                                            borderColor: '#FF5A5F',
                                            opacity: fadeAnim,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 24,
                                        }}
                                    >
                                        <Animated.View
                                            style={{
                                                width: 160,
                                                height: 160,
                                                borderRadius: 80,
                                                backgroundColor: scanComplete
                                                    ? '#10B981'
                                                    : scanning
                                                      ? '#FF5A5F'
                                                      : 'rgba(255, 90, 95, 0.1)',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transform: [{ scale: pulseAnim }],
                                                borderWidth: scanning ? 0 : 2,
                                                borderColor: '#FF5A5F',
                                            }}
                                        >
                                            {scanComplete ? (
                                                <Check size={64} color="white" />
                                            ) : (
                                                <Fingerprint
                                                    size={64}
                                                    color={scanning ? 'white' : '#FF5A5F'}
                                                    strokeWidth={1.5}
                                                />
                                            )}
                                        </Animated.View>
                                    </Animated.View>
                                </TouchableOpacity>

                                <Text
                                    style={{
                                        color: scanComplete
                                            ? '#10B981'
                                            : scanning
                                              ? '#FF5A5F'
                                              : '#9CA3AF',
                                        fontSize: 16,
                                        fontFamily: 'Figtree',
                                        textAlign: 'center',
                                        paddingHorizontal: 32,
                                        lineHeight: 24,
                                    }}
                                >
                                    {scanComplete
                                        ? 'Fingerprint added successfully.'
                                        : scanning
                                          ? 'Scanning fingerprint...'
                                          : 'Tap to scan your fingerprint'}
                                </Text>
                            </View>

                            <View
                                style={{
                                    backgroundColor: '#1a1a2e',
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
                                    Your fingerprint data is stored securely on your device and never shared.
                                </Text>
                            </View>

                            {scanning && (
                                <View
                                    style={{
                                        backgroundColor: 'rgba(255, 90, 95, 0.1)',
                                        borderRadius: 12,
                                        padding: 16,
                                        width: '100%',
                                        maxWidth: 400,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#FF5A5F',
                                            fontSize: 14,
                                            fontFamily: 'Figtree',
                                            textAlign: 'center',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Keep your finger on the sensor...
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View
                            style={{
                                paddingBottom: 32,
                                width: '100%',
                                maxWidth: 400,
                                alignSelf: 'center',
                            }}
                        >
                            {scanComplete ? (
                                <Button
                                    label="Complete Setup"
                                    onPress={handleContinue}
                                    variant="primary"
                                    fullWidth
                                />
                            ) : (
                                <Button
                                    label={scanning ? 'Scanning...' : 'Scan Fingerprint'}
                                    onPress={handleScanFingerprint}
                                    variant="primary"
                                    fullWidth
                                    loading={scanning}
                                    disabled={scanning}
                                />
                            )}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}
