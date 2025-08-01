import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Headphones,
    MessageCircle,
    Globe,
    Facebook,
    Twitter,
    Instagram
} from 'lucide-react-native';
import { CustomTabNavigation } from '@/components/settings/CustomTabNavigation';
import { CONTACT_METHODS } from '@/lib/settings/constants';

export default function ContactUsScreen() {
    const [activeTab, setActiveTab] = useState('contact');

    const handleBack = () => {
        router.back();
    };

    const handleTabChange = (tab: string) => {
        if (tab === 'faq') {
            router.push('/settings/help-center');
        }
        setActiveTab(tab);
    };

    const handleContactMethod = (methodId: string) => {
        // TODO !!-- LINKS
        Alert.alert(
            'Contact Support',
            `You would be redirected to ${methodId}`,
            [{ text: 'OK' }]
        );
    };

    // Map contact method IDs to their respective icons
    const getContactIcon = (methodId: string) => {
        switch (methodId) {
            case 'customer-service':
                return <Headphones size={22} color="white" />;
            case 'whatsapp':
                return <MessageCircle size={22} color="white" />;
            case 'website':
                return <Globe size={22} color="white" />;
            case 'facebook':
                return <Facebook size={22} color="white" />;
            case 'twitter':
                return <Twitter size={22} color="white" />;
            case 'instagram':
                return <Instagram size={22} color="white" />;
            default:
                return <Globe size={22} color="white" />;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={styles.rightPlaceholder} />
            </View>

            <CustomTabNavigation
                tabs={[
                    { key: 'faq', label: 'FAQ' },
                    { key: 'contact', label: 'Contact Us' }
                ]}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.contentContainer}>
                    {CONTACT_METHODS.map(method => (
                        <TouchableOpacity
                            key={method.id}
                            style={styles.contactMethodCard}
                            onPress={() => handleContactMethod(method.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                {getContactIcon(method.id)}
                            </View>
                            <Text style={styles.contactMethodText}>
                                {method.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
    },
    rightPlaceholder: {
        width: 24,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 16,
        gap: 12,
    },
    contactMethodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(26,26,46,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    contactMethodText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});