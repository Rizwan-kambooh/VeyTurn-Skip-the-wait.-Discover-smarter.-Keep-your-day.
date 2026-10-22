import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {ChevronRight, Clock3, MapPin, Star} from '../assets/icons/icons';
import {Business} from '../services/businesses';
import {COLORS, RADIUS} from '../theme/theme';

export function BusinessCard({business, onPress}: {business: Business; onPress: () => void}) {
  return <Pressable onPress={onPress} style={({pressed}) => [styles.card, pressed && {opacity: 0.8}]}>
    {business.image_url ? <Image source={{uri: business.image_url}} style={styles.image} /> : <View style={[styles.image, styles.imageFallback]}><Text style={styles.fallbackText}>{business.name.slice(0, 1)}</Text></View>}
    <View style={styles.copy}>
      <Text numberOfLines={1} style={styles.name}>{business.name}</Text><Text style={styles.type}>{business.category}</Text>
      <View style={styles.meta}><Star color="#F59E0B" fill="#F59E0B" size={14} /><Text style={styles.metaText}>{business.rating_average} ({business.rating_count})</Text><MapPin color={COLORS.muted} size={13} /><Text style={styles.metaText}>{business.distance_km === null ? '—' : `${business.distance_km} km`}</Text></View>
    </View>
    <View style={styles.right}><View style={styles.wait}><Clock3 color={COLORS.success} size={13} /><Text style={styles.waitText}>~ {business.estimated_wait_minutes} min</Text></View><ChevronRight color="#94A3B8" size={19} /></View>
  </Pressable>;
}
const styles = StyleSheet.create({
  card: {alignItems: 'center', backgroundColor: COLORS.white, borderColor: '#E4EBF2', borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 9},
  image: {backgroundColor: COLORS.input, borderRadius: 11, height: 68, width: 76}, imageFallback: {alignItems: 'center', justifyContent: 'center'}, fallbackText: {color: COLORS.primary, fontSize: 24, fontWeight: '900'}, copy: {flex: 1}, name: {color: COLORS.navy, fontSize: 15, fontWeight: '800'},
  type: {color: COLORS.muted, fontSize: 12, marginTop: 3}, meta: {alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 8}, metaText: {color: COLORS.muted, fontSize: 10.5, marginRight: 5},
  right: {alignItems: 'flex-end', gap: 12}, wait: {alignItems: 'center', backgroundColor: COLORS.soft, borderRadius: 20, flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 6}, waitText: {color: COLORS.success, fontSize: 11, fontWeight: '700'},
});
