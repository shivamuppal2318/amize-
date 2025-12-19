import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { X, Smartphone, Trash2, Clock } from 'lucide-react-native';
import { useSecurityDevices } from '@/hooks/useSecurityHooks';
import { format } from 'date-fns';

interface ManageDevicesModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ManageDevicesModal = ({ visible, onClose }: ManageDevicesModalProps) => {
    const { devices, loading, removeDevice, refreshDevices } = useSecurityDevices();

    // Track if we should refresh devices
    const hasRefreshed = useRef(false);

    // Refresh devices only when modal first becomes visible
    // and we haven't already refreshed in this session
    useEffect(() => {
        if (visible && !hasRefreshed.current) {
            refreshDevices();
            hasRefreshed.current = true;
        }

        // Reset refreshed flag when modal is closed
        if (!visible) {
            hasRefreshed.current = false;
        }
    }, [visible, refreshDevices]);

    // Format date for display
    const formatDate = useCallback((dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM d, yyyy h:mm a');
        } catch (error) {
            return 'Invalid date';
        }
    }, []);

    // Handle device removal
    const handleRemoveDevice = useCallback((deviceId: string) => {
        Alert.alert(
            'Remove Device',
            'Are you sure you want to remove this device? This will log out the device from your account.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeDevice(deviceId);
                    }
                }
            ]
        );
    }, [removeDevice]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerText}>Manage Devices</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FF4D67" />
                            <Text style={styles.loadingText}>Loading devices...</Text>
                        </View>
                    ) : devices.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No devices found</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={devices}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.deviceItem}>
                                    <View style={styles.deviceHeader}>
                                        <View style={styles.deviceTitleContainer}>
                                            <Smartphone size={20} color="#9CA3AF" />
                                            <View style={styles.deviceInfo}>
                                                <Text style={styles.deviceName}>
                                                    {item.deviceName || 'Unknown Device'}
                                                    {item.isCurrentDevice && (
                                                        <Text style={styles.currentDevice}> (Current)</Text>
                                                    )}
                                                </Text>
                                                <Text style={styles.deviceModel}>
                                                    {item.deviceModel || 'Unknown Model'}
                                                </Text>
                                            </View>
                                        </View>

                                        {!item.isCurrentDevice && (
                                            <TouchableOpacity
                                                onPress={() => handleRemoveDevice(item.id)}
                                                style={styles.removeButton}
                                            >
                                                <Trash2 size={16} color="#FF4D67" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={styles.deviceDetails}>
                                        <View style={styles.statusContainer}>
                                            <View style={[
                                                styles.statusDot,
                                                item.isActive ? styles.activeStatus : styles.inactiveStatus
                                            ]} />
                                            <Text style={styles.statusText}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Clock size={12} color="#9CA3AF" />
                                            <Text style={styles.infoText}>
                                                Last Login: {formatDate(item.loginTimestamp)}
                                            </Text>
                                        </View>

                                        {item.ipAddress && (
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoText}>
                                                    IP: {item.ipAddress}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                            showsVerticalScrollIndicator={false}
                            style={styles.deviceList}
                        />
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Removing a device will log it out of your account. The current device cannot be removed.
                        </Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        backgroundColor: '#262626',
        width: '90%',
        height: '80%',
        borderRadius: 12,
        padding: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        color: '#9CA3AF',
        marginTop: 16
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 18
    },
    deviceList: {
        flex: 1
    },
    deviceItem: {
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    deviceTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    deviceInfo: {
        marginLeft: 12
    },
    deviceName: {
        color: '#FFFFFF',
        fontWeight: '600'
    },
    currentDevice: {
        color: '#FF4D67'
    },
    deviceModel: {
        color: '#9CA3AF',
        fontSize: 14
    },
    removeButton: {
        backgroundColor: '#333333',
        padding: 8,
        borderRadius: 20
    },
    deviceDetails: {
        marginTop: 12
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8
    },
    activeStatus: {
        backgroundColor: '#10B981'
    },
    inactiveStatus: {
        backgroundColor: '#9CA3AF'
    },
    statusText: {
        color: '#9CA3AF',
        fontSize: 12
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
    infoText: {
        color: '#9CA3AF',
        fontSize: 12,
        marginLeft: 8
    },
    footer: {
        marginTop: 16
    },
    footerText: {
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 8
    },
    closeButton: {
        backgroundColor: '#1E4A72',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontWeight: '500' 
    }
});