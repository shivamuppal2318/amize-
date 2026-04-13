import React, { RefObject } from 'react';
import {
    StyleSheet,
    TextInput,
    NativeSyntheticEvent,
    TextInputSelectionChangeEventData,
    View
} from 'react-native';

interface CaptionInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    selection?: { start: number; end: number };
    onSelectionChange?: (
        event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
    ) => void;
    inputRef?: RefObject<TextInput | null>;
}

export default function CaptionInput({
                                         value,
                                         onChangeText,
                                         placeholder = "Write a caption...",
                                         selection,
                                         onSelectionChange,
                                         inputRef,
                                     }: CaptionInputProps) {
    return (
        <View style={styles.inputContainer}>
            <TextInput
                ref={inputRef}
                style={styles.captionInput}
                placeholder={placeholder}
                placeholderTextColor="#777"
                multiline
                value={value}
                onChangeText={onChangeText}
                selection={selection}
                onSelectionChange={onSelectionChange}
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
