import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {categories} from '../data/mockData';
import {COLORS, RADIUS} from '../theme/theme';

export function CategoryGrid({selected, onSelect, compact = false}: {selected?: string; onSelect?: (value: string) => void; compact?: boolean}) {
  return <View style={styles.grid}>{categories.map(({name, Icon}) => {
    const active = name === selected;
    return <Pressable key={name} onPress={() => onSelect?.(name)} style={[styles.item, compact && styles.compact]}>
      <View style={[styles.iconBox, active && styles.active]}><Icon color={active ? COLORS.white : COLORS.navy} size={compact ? 22 : 25} /></View>
      <Text style={[styles.label, active && styles.activeLabel]}>{name}</Text>
    </Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({
  grid: {flexDirection: 'row', flexWrap: 'wrap', rowGap: 16}, item: {alignItems: 'center', width: '25%'}, compact: {width: 70},
  iconBox: {alignItems: 'center', backgroundColor: COLORS.input, borderRadius: RADIUS.md, height: 54, justifyContent: 'center', width: 54}, active: {backgroundColor: COLORS.primary},
  label: {color: COLORS.text, fontSize: 11.5, fontWeight: '600', marginTop: 7}, activeLabel: {color: COLORS.primary, fontWeight: '800'},
});
