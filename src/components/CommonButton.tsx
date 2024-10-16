import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../Utils/Colors';

interface CommonButtonProps {
  label: string | null;
  style?: any;
  BgColor?: string;
  disabled?: boolean;
  onPress: () => void;
}

const CommonButton = ({ label, style, BgColor, onPress, disabled }: CommonButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[style, BgColor && { backgroundColor: BgColor }]}
      disabled={disabled}>
      <Text style={styles.ctaButtonText}>{label ?? '-'}</Text>
    </TouchableOpacity>
  );
};

export default CommonButton;

const styles = StyleSheet.create({
  ctaButton: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: 'white',
  },
});
