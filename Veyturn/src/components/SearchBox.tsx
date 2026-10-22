import React from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';
import {Search, SlidersHorizontal} from '../assets/icons/icons';
import {COLORS, RADIUS} from '../theme/theme';

export function SearchBox({value, onChangeText, placeholder = 'Search businesses or services...'}: {value: string; onChangeText: (value: string) => void; placeholder?: string}) {
  return <View style={styles.row}><View style={styles.box}><Search color={COLORS.muted} size={20} /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94A3B8" style={styles.input} /></View><Pressable style={styles.filter}><SlidersHorizontal color={COLORS.primary} size={20} /></Pressable></View>;
}
const styles = StyleSheet.create({row: {flexDirection: 'row', gap: 10}, box: {alignItems: 'center', backgroundColor: COLORS.input, borderColor: COLORS.border, borderRadius: RADIUS.md, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 10, height: 50, paddingHorizontal: 14}, input: {color: COLORS.text, flex: 1, fontSize: 14, paddingVertical: 0}, filter: {alignItems: 'center', backgroundColor: COLORS.soft, borderRadius: RADIUS.md, height: 50, justifyContent: 'center', width: 50}});
