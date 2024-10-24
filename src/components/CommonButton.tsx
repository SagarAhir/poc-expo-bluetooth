import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors } from '../Utils/Colors';

interface CommonButtonProps {
  label: string | null;
  style?: any;
  bgColor?: string;
  loading?: boolean;
  iconComponent?: React.ReactNode;
  onPress: () => void;
}

const CommonButton = ({
  label,
  style,
  bgColor,
  iconComponent,
  loading,
  onPress,
}: CommonButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.ctaButton, style, bgColor && { backgroundColor: bgColor }]}>
      {loading ? <ActivityIndicator color={Colors.white} /> : iconComponent ? iconComponent : null}
      <Text style={styles.ctaButtonText}>{label ?? '-'}</Text>
    </TouchableOpacity>
  );
};

export default CommonButton;

const styles = StyleSheet.create({
  ctaButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  ctaButtonText: {
    color: 'white',
  },
});
