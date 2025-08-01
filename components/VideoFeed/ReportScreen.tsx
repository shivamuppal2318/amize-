import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

interface ReportScreenProps {
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ onClose, onSubmit }) => {
    const [selectedReason, setSelectedReason] = useState<string>('Illegal activities or regulated goods');

    const reasons = [
        'Dangerous organizations/individuals',
        'Frauds & Scams',
        'Misleading Information',
        'Illegal activities or regulated goods',
        'Violent & graphics contents',
        'Animal Cruelty',
        'Pornography & Nudity',
        'Hate Speech',
        'Harassment or bullying',
        'Intellectual property infringement',
        'Spam',
        'Minor Safety',
        'Other'
    ];

    const handleSubmit = () => {
        onSubmit(selectedReason);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <ArrowLeft color="#FFF" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report</Text>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>Select a reason</Text>

                {/* Report Reasons */}
                <View style={styles.reasonsContainer}>
                    {reasons.map((reason, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.reasonItem}
                            onPress={() => setSelectedReason(reason)}
                        >
                            <View style={styles.radioContainer}>
                                <View
                                    style={[
                                        styles.radioOuter,
                                        selectedReason === reason && styles.radioOuterSelected
                                    ]}
                                >
                                    {selectedReason === reason && <View style={styles.radioInner} />}
                                </View>
                                <Text style={styles.reasonText}>{reason}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        marginRight: 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    reasonsContainer: {
        marginBottom: 20,
    },
    reasonItem: {
        marginBottom: 16,
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FF4F5B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    radioOuterSelected: {
        borderColor: '#FF4F5B',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF4F5B',
    },
    reasonText: {
        color: 'white',
        fontSize: 16,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    cancelButton: {
        backgroundColor: '#2A2A2A',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 30,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#FF4F5B',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 30,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ReportScreen;