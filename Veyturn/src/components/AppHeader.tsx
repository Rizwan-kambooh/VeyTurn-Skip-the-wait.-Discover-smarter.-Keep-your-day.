import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {BellRing, Menu, MapPin} from '../assets/icons/icons';
import {COLORS} from '../theme/theme';

type Props = {title?: string; subtitle?: string; onMenu: () => void; onNotifications?: () => void};
export function AppHeader({title = 'Islamabad', subtitle, onMenu, onNotifications}: Props) {
  return <View style={styles.header}>
    <Pressable accessibilityLabel="Open menu" onPress={onMenu} style={styles.button}><Menu color={COLORS.navy} size={23} /></Pressable>
    <View style={styles.location}>
      <MapPin color={COLORS.primary} size={17} />
      <View><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>
    </View>
    <Pressable accessibilityLabel="Notifications" onPress={onNotifications} style={styles.button}>
      <BellRing color={COLORS.navy} size={21} /><View style={styles.dot} />
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  header: {alignItems: 'center', flexDirection: 'row', height: 58, justifyContent: 'space-between'},
  button: {alignItems: 'center', backgroundColor: COLORS.input, borderRadius: 13, height: 42, justifyContent: 'center', width: 42},
  location: {alignItems: 'center', flexDirection: 'row', gap: 7}, title: {color: COLORS.navy, fontSize: 15, fontWeight: '800'},
  subtitle: {color: COLORS.muted, fontSize: 10, marginTop: 1}, dot: {backgroundColor: '#EF4444', borderColor: COLORS.white, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 8, top: 7, width: 9},
});
