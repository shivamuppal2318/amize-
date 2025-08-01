import React from 'react';
import {
    StyleSheet,
    TextInput,
    View
} from 'react-native';

interface CaptionInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export default function CaptionInput({
                                         value,
                                         onChangeText,
                                         placeholder = "Write a caption..."
                                     }: CaptionInputProps) {
    return (
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.captionInput}
                placeholder={placeholder}
                placeholderTextColor="#777"
                multiline
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    captionInput: {
        color: '#fff',
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
});