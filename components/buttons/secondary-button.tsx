import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';

interface SecondaryButtonProps {
  onPress: () => void;
  label: string;
  isDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function SecondaryButton({
  onPress,
  label,
  isDisabled = false,
  style,
  textStyle
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff',
    borderRadius: 100, // Rounded corners as shown in the image
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    width: '100%',
    borderWidth: 1,
    borderColor: '#007BFF',
  },
  buttonDisabled: {
    borderColor: '#E0E0E0',
  },
  buttonText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
