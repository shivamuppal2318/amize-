import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Calendar, ChevronUp, ChevronDown } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
// @ts-ignore
import DefaultImage from '@/assets/images/figma/cake.png';
import { useRegistration } from '@/context/RegistrationContext';

const DEFAULT_IMAGE = Image.resolveAssetSource(DefaultImage).uri;
// @ts-ignore
import AmizeLogo from '@/assets/images/amize.png';
const AMIZE_LOGO = Image.resolveAssetSource(AmizeLogo).uri;

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function BirthdayScreen() {
    const { updateUser, user } = useAuth();
    const { updateRegistrationData } = useRegistration();

    // Create a proper Date object from user.birthday if it exists
    const userBirthday = user?.dateOfBirth ?
        (user.dateOfBirth) :
        null;

    const [selectedMonth, setSelectedMonth] = useState<number>(userBirthday?.getMonth() ?? 0);
    const [selectedDay, setSelectedDay] = useState<number>(userBirthday?.getDate() ?? 1);
    const [selectedYear, setSelectedYear] = useState<number>(userBirthday?.getFullYear() ?? 2000);

    const handleContinue = () => {
        const birthday = new Date(selectedYear, selectedMonth, selectedDay);
        const formattedDate = birthday.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        updateRegistrationData({ dateOfBirth: formattedDate });

        router.push('/account-setup/profile');
    };

    const handleSkip = () => {
        router.push('/account-setup/profile');
    };

    // Get days in the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const validDay = Math.min(selectedDay, daysInMonth);

    // Format the date for display
    const formattedDate = `${monthsShort[selectedMonth]} ${validDay}, ${selectedYear}`;

    const updateMonth = (direction: 'up' | 'down') => {
        if (direction === 'up') {
            setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
        } else {
            setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
        }
    };

    const updateDay = (direction: 'up' | 'down') => {
        const maxDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        if (direction === 'up') {
            setSelectedDay((prev) => (prev === maxDays ? 1 : prev + 1));
        } else {
            setSelectedDay((prev) => (prev === 1 ? maxDays : prev - 1));
        }
    };

    const updateYear = (direction: 'up' | 'down') => {
        if (direction === 'up') {
            setSelectedYear((prev) => Math.min(prev + 1, 2025));
        } else {
            setSelectedYear((prev) => Math.max(prev - 1, 1920));
        }
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
                edges={['top']}
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
                                onPress={() => router.back()}
                            >
                                <ChevronLeft size={24} color="white" />
                            </TouchableOpacity>

                            <Text style={{
                                color: 'white',
                                fontSize: 18,
                                fontWeight: '600',
                                fontFamily: 'Figtree'
                            }}>
                                When is Your Birthday?
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
                            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                                {/* Logo */}
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

                                {/* Subtitle */}
                                <Text style={{
                                    color: '#9CA3AF',
                                    fontSize: 16,
                                    fontFamily: 'Figtree',
                                    textAlign: 'center',
                                    paddingHorizontal: 20,
                                    lineHeight: 24
                                }}>
                                    Your birthday will not be shown to the public
                                </Text>
                            </View>

                            {/* Cake Illustration */}
                            <View style={{ marginBottom: 32 }}>
                                <Image
                                    source={{ uri: DEFAULT_IMAGE }}
                                    style={{ width: 150, height: 150 }}
                                    resizeMode="contain"
                                />
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
                                        backgroundColor: '#1a1a2e',
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
                                    Step 3 of 4
                                </Text>
                            </View>

                            {/* Selected Date Display */}
                            <View style={{
                                width: '100%',
                                maxWidth: 350,
                                backgroundColor: '#1a1a2e',
                                borderRadius: 16,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: '#374151',
                                marginBottom: 32,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Calendar size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                                <Text style={{
                                    color: 'white',
                                    fontSize: 18,
                                    fontWeight: '600',
                                    fontFamily: 'Figtree'
                                }}>
                                    {formattedDate}
                                </Text>
                            </View>

                            {/* Date Picker */}
                            <View style={{ width: '100%', maxWidth: 350 }}>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    gap: 12
                                }}>
                                    {/* Month Picker */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            color: '#9CA3AF',
                                            fontSize: 14,
                                            fontFamily: 'Figtree',
                                            textAlign: 'center',
                                            marginBottom: 8
                                        }}>
                                            Month
                                        </Text>
                                        <View style={{
                                            backgroundColor: '#1a1a2e',
                                            borderWidth: 1,
                                            borderColor: '#374151',
                                            borderRadius: 12,
                                            padding: 8
                                        }}>
                                            <TouchableOpacity
                                                onPress={() => updateMonth('up')}
                                                style={{
                                                    padding: 8,
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <ChevronUp size={20} color="#9CA3AF" />
                                            </TouchableOpacity>

                                            <View style={{
                                                paddingVertical: 12,
                                                alignItems: 'center',
                                                minHeight: 48
                                            }}>
                                                <Text style={{
                                                    color: 'white',
                                                    fontSize: 16,
                                                    fontWeight: '600',
                                                    fontFamily: 'Figtree'
                                                }}>
                                                    {monthsShort[selectedMonth]}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => updateMonth('down')}
                                                style={{
                                                    padding: 8,
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <ChevronDown size={20} color="#9CA3AF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Day Picker */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            color: '#9CA3AF',
                                            fontSize: 14,
                                            fontFamily: 'Figtree',
                                            textAlign: 'center',
                                            marginBottom: 8
                                        }}>
                                            Day
                                        </Text>
                                        <View style={{
                                            backgroundColor: '#1a1a2e',
                                            borderWidth: 1,
                                            borderColor: '#374151',
                                            borderRadius: 12,
                                            padding: 8
                                        }}>
                                            <TouchableOpacity
                                                onPress={() => updateDay('up')}
                                                style={{
                                                    padding: 8,
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <ChevronUp size={20} color="#9CA3AF" />
                                            </TouchableOpacity>

                                            <View style={{
                                                paddingVertical: 12,
                                                alignItems: 'center',
                                                minHeight: 48
                                            }}>
                                                <Text style={{
                                                    color: 'white',
                                                    fontSize: 16,
                                                    fontWeight: '600',
                                                    fontFamily: 'Figtree'
                                                }}>
                                                    {validDay}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => updateDay('down')}
                                                style={{
                                                    padding: 8,
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <ChevronDown size={20} color="#9CA3AF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Year Picker */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            color: '#9CA3AF',
                                            fontSize: 14,
                                            fontFamily: 'Figtree',
                                            textAlign: 'center',
                                            marginBottom: 8
                                        }}>
                                            Year
                                        </Text>
                                        <View style={{
                                            backgroundColor: '#1a1a2e',
                                            borderWidth: 1,
                                            borderColor: '#374151',
                                            borderRadius: 12,
                                            padding: 8
                                        }}>
                                            <TouchableOpacity
                                                onPress={() => updateYear('up')}
                                                style={{
                                                    padding: 8,
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <ChevronUp size={20} color="#9CA3AF" />
                                            </TouchableOpacity>

                                            <View style={{
                                                paddingVertical: 12,
                                                alignItems: 'center',
                                                minHeight: 48
                                            }}>
                                                <Text style={{
                                                    color: 'white',
                                                    fontSize: 16,
                                                    fontWeight: '600',
                                                    fontFamily: 'Figtree'
                                                }}>
                                                    {selectedYear}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => updateYear('down')}
                                                style={{
                                                    padding: 8,
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <ChevronDown size={20} color="#9CA3AF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Continue Button */}
                        <View style={{ paddingBottom: 32, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                            <Button
                                label="Continue"
                                onPress={handleContinue}
                                variant="primary"
                                fullWidth
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}