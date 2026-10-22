import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS, RADIUS} from '../theme/theme';

export function FormError({message}: {message?: string}) {
  if (!message) return null;
  return <View accessibilityRole="alert" style={styles.box}><Text style={styles.text}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  box: {backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderRadius: RADIUS.sm, borderWidth: 1, padding: 12},
  text: {color: COLORS.danger, fontSize: 13, lineHeight: 18},
});

