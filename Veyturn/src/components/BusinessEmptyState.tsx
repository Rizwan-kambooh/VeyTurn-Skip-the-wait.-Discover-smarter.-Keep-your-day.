import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Building, MapPin} from '../assets/icons/icons';
import {COLORS, RADIUS} from '../theme/theme';

export function BusinessEmptyState({category, message, onRetry}: {category?: string; message?: string; onRetry?: () => void}) {
  return <View style={styles.card}><View style={styles.icon}>{category ? <Building color={COLORS.primary} size={28} /> : <MapPin color={COLORS.primary} size={28} />}</View><Text style={styles.title}>{category && category !== 'All' ? `${category} businesses coming soon` : 'No businesses found nearby'}</Text><Text style={styles.copy}>{message || (category && category !== 'All' ? `We’re onboarding trusted ${category.toLowerCase()} businesses in your area. Please check again soon.` : 'Try another name, location, category, or filter.')}</Text>{onRetry ? <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable> : null}</View>;
}
const styles = StyleSheet.create({card: {alignItems: 'center', backgroundColor: COLORS.input, borderColor: COLORS.border, borderRadius: RADIUS.lg, borderWidth: 1, padding: 28}, icon: {alignItems: 'center', backgroundColor: COLORS.soft, borderRadius: 28, height: 56, justifyContent: 'center', width: 56}, title: {color: COLORS.navy, fontSize: 17, fontWeight: '800', marginTop: 14, textAlign: 'center'}, copy: {color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 7, textAlign: 'center'}, retry: {marginTop: 15, padding: 8}, retryText: {color: COLORS.primary, fontSize: 13, fontWeight: '800'}});
