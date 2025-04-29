import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';

interface PrimaryButtonProps {
  onPress: () => void;
  label: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function PrimaryButton({
  onPress,
  label,
  isDisabled = false,
  isLoading = false,
  style,
  textStyle
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={isDisabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 100, // Rounded corners as shown in the image
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0', // Light gray when disabled
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
