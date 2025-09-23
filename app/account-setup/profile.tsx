import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { ChevronLeft, User, Mail, Phone, MapPin, Camera, Plus } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useRegistration } from '@/context/RegistrationContext';

export default function ProfileScreen() {
    const { register,updateUser, user } = useAuth();

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const { updateRegistrationData,getRegistrationRequest } = useRegistration();
 


    const handleContinue = async () => {
        const updatedData = {
          ...getRegistrationRequest(),
          firstName: fullName.split(" ")[0] || "",
          lastName: fullName.split(" ")[1] || "",
        };
      
        console.log("Updated registration data with full name:", fullName);
        console.log("Data:-----------", updatedData);
      
        const result = await register(updatedData);
        console.log("SuccessScreen: Registration API response:", result);
      
        router.replace({
            pathname: "/account-setup/verify",
            params: { updatedData: JSON.stringify(updatedData) },
          });
      };

    const handleSkip = () => {
        router.push('/account-setup/pin');
    };

    const handleImagePicker = () => {
        // TODO: Implement image picker functionality
        console.log('Open image picker');
    };

    const isFormValid = fullName.trim() !== '' && email.trim() !== '';

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
                                Fill Your Profile
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
                            {/* Profile Picture Section */}
                            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                                <TouchableOpacity
                                    onPress={handleImagePicker}
                                    style={{
                                        width: 120,
                                        height: 120,
                                        borderRadius: 60,
                                        backgroundColor: '#1a1a2e',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        borderWidth: 3,
                                        borderColor: '#4B5563'
                                    }}
                                >
                                    {profileImage ? (
                                        <Image
                                            source={{ uri: profileImage }}
                                            style={{
                                                width: 114,
                                                height: 114,
                                                borderRadius: 57
                                            }}
                                        />
                                    ) : (
                                        <User size={48} color="#9CA3AF" />
                                    )}

                                    {/* Camera Button */}
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 8,
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: '#FF5A5F',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 3,
                                        borderColor: '#1a1a2e'
                                    }}>
                                        <Plus size={16} color="white" />
                                    </View>
                                </TouchableOpacity>

                                <Text style={{
                                    color: '#9CA3AF',
                                    fontSize: 14,
                                    marginTop: 8,
                                    fontFamily: 'Figtree'
                                }}>
                                    Tap to add photo
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
                                </View>
                                <Text style={{
                                    color: '#9CA3AF',
                                    fontSize: 14,
                                    textAlign: 'center',
                                    marginTop: 8,
                                    fontFamily: 'Figtree'
                                }}>
                                    Step 4 of 4
                                </Text>
                            </View>

                            {/* Form Section */}
                            <View style={{ width: '100%', maxWidth: 400 }}>
                                <Input
                                    label="Full Name"
                                    placeholder="Enter your full name"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    icon={<User size={20} color="#9CA3AF" />}
                                />

                                <Input
                                    label="Email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    icon={<Mail size={20} color="#9CA3AF" />}
                                />

                                <Input
                                    label="Phone Number"
                                    placeholder="Enter your phone number"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    icon={<Phone size={20} color="#9CA3AF" />}
                                />

                                <Input
                                    label="Address"
                                    placeholder="Enter your address (optional)"
                                    value={address}
                                    onChangeText={setAddress}
                                    icon={<MapPin size={20} color="#9CA3AF" />}
                                />
                            </View>

                            {/* Form Status */}
                            {isFormValid && (
                                <View style={{ marginTop: 16, marginBottom: 8 }}>
                                    <Text style={{
                                        color: '#10B981',
                                        fontSize: 14,
                                        textAlign: 'center',
                                        fontFamily: 'Figtree'
                                    }}>
                                        Profile ready to complete
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Continue Button */}
                        <View style={{ paddingBottom: 32, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                            <Button
                                label="Complete Profile"
                                onPress={handleContinue}
                                variant="primary"
                                fullWidth
                                disabled={!isFormValid}
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}