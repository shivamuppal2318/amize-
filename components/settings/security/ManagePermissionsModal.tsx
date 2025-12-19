import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Switch, StyleSheet } from 'react-native';
import { X, AlertCircle } from 'lucide-react-native';
import { useSecurityPermissions } from '@/hooks/useSecurityHooks';

interface ManagePermissionsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ManagePermissionsModal = ({ visible, onClose }: ManagePermissionsModalProps) => {
    const { permissions, loading, updatePermission, refreshPermissions } = useSecurityPermissions();

    // Track if we should refresh permissions
    const hasRefreshed = useRef(false);

    // Refresh permissions only when modal first becomes visible
    // and we haven't already refreshed in this session
    useEffect(() => {
        if (visible && !hasRefreshed.current) {
            refreshPermissions();
            hasRefreshed.current = true;
        }

        // Reset refreshed flag when modal is closed
        if (!visible) {
            hasRefreshed.current = false;
        }
    }, [visible, refreshPermissions]);

    // Handle permission toggle
    const handleTogglePermission = useCallback(async (permissionId: string, granted: boolean, required: boolean) => {
        // If trying to disable a required permission, don't allow it
        if (required && !granted) {
            return;
        }

        await updatePermission(permissionId, granted);
    }, [updatePermission]);

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
                        <Text style={styles.headerText}>Manage Permissions</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FF4D67" />
                            <Text style={styles.loadingText}>Loading permissions...</Text>
                        </View>
                    ) : permissions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No permissions found</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={permissions}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.permissionItem}>
                                    <View style={styles.permissionHeader}>
                                        <View style={styles.permissionInfo}>
                                            <Text style={styles.permissionName}>
                                                {item.name}
                                                {item.required && (
                                                    <Text style={styles.requiredBadge}> (Required)</Text>
                                                )}
                                            </Text>
                                            <Text style={styles.permissionDescription}>
                                                {item.description}
                                            </Text>
                                        </View>

                                        <Switch
                                            value={item.granted}
                                            onValueChange={(value) => handleTogglePermission(item.id, value, item.required)}
                                            trackColor={{ false: '#4B5563', true: '#1E4A72' }}
                                            thumbColor="#FFFFFF"
                                            disabled={item.required && item.granted}
                                        />
                                    </View>
                                </View>
                            )}
                            showsVerticalScrollIndicator={false}
                            style={styles.permissionList}
                        />
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerNote}>
                            <AlertCircle size={16} color="#FF4D67" />
                            <Text style={styles.footerText}>
                                Required permissions cannot be disabled as they are essential for the app to function.
                            </Text>
                        </View>
                        <View style={styles.footerNote}>
                            <AlertCircle size={16} color="#9CA3AF" />
                            <Text style={styles.footerText}>
                                Changes to permissions may require restarting the app to take effect.
                            </Text>
                        </View>
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
    permissionList: {
        flex: 1
    },
    permissionItem: {
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12
    },
    permissionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    permissionInfo: {
        flex: 1,
        marginRight: 16
    },
    permissionName: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16
    },
    requiredBadge: {
        color: '#1E4A72'
    },
    permissionDescription: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 4
    },
    footer: {
        marginTop: 16
    },
    footerNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    footerText: {
        color: '#9CA3AF',
        fontSize: 12,
        marginLeft: 8,
        flex: 1
    },
    closeButton: {
        backgroundColor: '#1E4A72',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontWeight: '500'
    }
});