import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Check, X} from '../assets/icons/icons';
import {COLORS} from '../theme/theme';
import {passwordRules} from '../utils/validation';

type Props = {password: string; active: boolean};

export function PasswordRequirements({password, active}: Props) {
  return (
    <View accessibilityLabel="Password requirements" style={styles.container}>
      <Text style={styles.heading}>Your password must include:</Text>
      {passwordRules.map(rule => {
        const passed = rule.test(password);
        const color = !active ? COLORS.muted : passed ? COLORS.success : COLORS.danger;
        return (
          <View key={rule.id} style={styles.rule}>
            <View style={[styles.icon, {borderColor: color}]}>
              {active && (passed ? <Check color={color} size={11} strokeWidth={3} /> : <X color={color} size={11} strokeWidth={3} />)}
            </View>
            <Text style={[styles.ruleText, {color}]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {gap: 7, marginTop: -5},
  heading: {color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 1},
  rule: {alignItems: 'center', flexDirection: 'row', gap: 8},
  icon: {alignItems: 'center', borderRadius: 8, borderWidth: 1.5, height: 16, justifyContent: 'center', width: 16},
  ruleText: {fontSize: 12.5, lineHeight: 17},
});
