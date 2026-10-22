import React from 'react';
import {ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {ArrowRight} from '../assets/icons/icons';
import {COLORS, RADIUS} from '../theme/theme';

type Props = {title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'text'; icon?: boolean; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>};

export function AppButton({title, onPress, variant = 'primary', icon = false, loading = false, disabled = false, style}: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress}
      style={({pressed}) => [styles.base, styles[variant], pressed && styles.pressed, (disabled || loading) && styles.disabled, style]}>
      {loading ? <ActivityIndicator color={primary ? COLORS.white : COLORS.primary} /> : (
        <View style={styles.content}>
          <Text style={[styles.label, primary ? styles.lightLabel : styles.darkLabel]}>{title}</Text>
          {icon && <ArrowRight color={primary ? COLORS.white : COLORS.primary} size={19} />}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {alignItems: 'center', borderRadius: RADIUS.md, height: 56, justifyContent: 'center', paddingHorizontal: 22},
  primary: {backgroundColor: COLORS.primary},
  secondary: {backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1.5},
  text: {backgroundColor: 'transparent', height: 46},
  pressed: {opacity: 0.82, transform: [{scale: 0.99}]}, disabled: {opacity: 0.55},
  content: {alignItems: 'center', flexDirection: 'row', gap: 10}, label: {fontSize: 16, fontWeight: '700'},
  lightLabel: {color: COLORS.white}, darkLabel: {color: COLORS.primary},
});
