import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Keyboard } from "react-native";
import { CustomModal } from "@/components/ui/CustomModal";

interface EditField {
  key: string;
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  maxLength?: number;
}

interface EditFieldModalProps {
  visible: boolean;
  field: EditField;
  onSave: (value: string) => void;
  onClose: () => void;
}

export const EditFieldModal: React.FC<EditFieldModalProps> = ({
  visible,
  field,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState(field.value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(field.value);
    setError(null);
  }, [field.value, visible]);

  const validateField = (text: string): string | null => {
    switch (field.key) {
      case "username":
        if (text.length < 3) {
          return "Username must be at least 3 characters";
        }
        if (!/^[a-zA-Z0-9_.]{3,30}$/.test(text)) {
          return "Username can only contain letters, numbers, underscores, and periods";
        }
        break;
      case "firstName":
      case "lastName":
        if (text.length < 2) {
          return `${field.label} must be at least 2 characters`;
        }
        break;
      case "dateOfBirth":
        if (text && !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
          return "Please enter date in YYYY-MM-DD format";
        }
        if (text) {
          const date = new Date(text);
          const now = new Date();
          if (date > now) {
            return "Date of birth cannot be in the future";
          }
          if (now.getFullYear() - date.getFullYear() > 120) {
            return "Please enter a valid date of birth";
          }
        }
        break;
      case "bio":
        if (text.length > 160) {
          return "Bio cannot exceed 160 characters";
        }
        break;
    }
    return null;
  };

  const handleSave = () => {
    const validationError = validateField(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(value.trim());
    Keyboard.dismiss();
  };

  const handleTextChange = (text: string) => {
    setValue(text);
    if (error) {
      setError(null);
    }
  };

  const getKeyboardType = () => {
    if (field.keyboardType) return field.keyboardType;
    if (field.key === "dateOfBirth") return "numeric";
    return "default";
  };

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      title={`Edit ${field.label}`}
      primaryAction={{
        label: "Save",
        onPress: handleSave,
      }}
      secondaryAction={{
        label: "Cancel",
        onPress: onClose,
      }}
      panGestureEnabled={false}
    >
      <View style={{ paddingVertical: 20 }}>
        <Text
          style={{
            color: "#9CA3AF",
            fontSize: 16,
            marginBottom: 12,
            fontFamily: "Figtree",
          }}
        >
          {field.placeholder || `Enter your ${field.label.toLowerCase()}`}
        </Text>

        <View
          style={{
            // backgroundColor: "rgba(26, 26, 46, 0.8)",
            backgroundColor: "rgba(255, 255, 455, 0.2)",
            borderWidth: 1,
            borderColor: error ? "#EF4444" : "#777",
            borderRadius: 16,
            padding: 16,
            minHeight: field.multiline ? 120 : 56,
          }}
        >
          <TextInput
            value={value}
            onChangeText={handleTextChange}
            placeholder={field.placeholder}
            placeholderTextColor="#6B7280"
            style={{
              color: "#F3F4F6",
              fontSize: 16,
              fontFamily: "Figtree",
              textAlignVertical: field.multiline ? "top" : "center",
              flex: 1,
              padding: 0,
            }}
            multiline={field.multiline}
            maxLength={field.maxLength}
            keyboardType={getKeyboardType()}
            autoFocus
            autoCorrect={field.key !== "username"}
            autoCapitalize={
              field.key === "username"
                ? "none"
                : field.key === "email"
                ? "none"
                : "words"
            }
          />
        </View>

        {field.maxLength && (
          <Text
            style={{
              color: "#6B7280",
              fontSize: 14,
              textAlign: "right",
              marginTop: 8,
              fontFamily: "Figtree",
            }}
          >
            {value.length}/{field.maxLength}
          </Text>
        )}

        {error && (
          <Text
            style={{
              color: "#EF4444",
              fontSize: 14,
              marginTop: 8,
              fontFamily: "Figtree",
            }}
          >
            {error}
          </Text>
        )}

        {field.key === "username" && (
          <Text
            style={{
              color: "#6B7280",
              fontSize: 13,
              marginTop: 8,
              lineHeight: 18,
              fontFamily: "Figtree",
            }}
          >
            Username can only contain letters, numbers, underscores, and periods
          </Text>
        )}

        {field.key === "dateOfBirth" && (
          <Text
            style={{
              color: "#6B7280",
              fontSize: 13,
              marginTop: 8,
              lineHeight: 18,
              fontFamily: "Figtree",
            }}
          >
            Format: YYYY-MM-DD (e.g., 1990-01-15)
          </Text>
        )}
      </View>
    </CustomModal>
  );
};
