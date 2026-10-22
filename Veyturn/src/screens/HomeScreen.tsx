import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {AppHeader} from '../components/AppHeader';
import {BusinessCard} from '../components/BusinessCard';
import {CategoryGrid} from '../components/CategoryGrid';
import {SearchBox} from '../components/SearchBox';
import {useAppDrawer} from '../components/AppDrawer';
import {CustomerTabParamList} from '../navigation/types';
import {COLORS, SPACING} from '../theme/theme';
import {useAuth} from '../auth/AuthContext';
import {Business, getBusinesses} from '../services/businesses';
import {useCurrentLocation} from '../hooks/useCurrentLocation';
import {BusinessEmptyState} from '../components/BusinessEmptyState';

type Props = BottomTabScreenProps<CustomerTabParamList, 'HomeTab'>;
export function HomeScreen({navigation}: Props) {
  const {openDrawer} = useAppDrawer(); const {user, accessToken} = useAuth(); const [search, setSearch] = useState(''); const [businesses, setBusinesses] = useState<Business[]>([]); const [loading, setLoading] = useState(true); const [apiError, setApiError] = useState<string | null>(null); const location = useCurrentLocation();
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const load = () => {
    if (!accessToken || !location.coordinates) {setLoading(false); return;}
    setLoading(true); setApiError(null);
    getBusinesses(accessToken, location.coordinates, {search}).then(data => setBusinesses(data.results)).catch(error => setApiError(error instanceof Error ? error.message : 'Could not load nearby businesses.')).finally(() => setLoading(false));
  };
  useEffect(() => {const timer = setTimeout(load, 300); return () => clearTimeout(timer);}, [accessToken, location.coordinates?.latitude, location.coordinates?.longitude, search]); // eslint-disable-line react-hooks/exhaustive-deps
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader title={location.coordinates ? 'Near you' : 'Location needed'} onMenu={openDrawer} onNotifications={() => navigation.navigate('Notifications')} />
    <Text style={styles.greeting}>Good morning, {firstName}!</Text><Text style={styles.subtitle}>What would you like to do today?</Text>
    <View style={styles.search}><SearchBox value={search} onChangeText={setSearch} placeholder="Search clinics, banks, salons..." /></View>
    <CategoryGrid onSelect={value => navigation.navigate('Explore', {category: value})} />
    <View style={styles.sectionTitle}><Text style={styles.heading}>Nearby businesses</Text><Pressable onPress={() => navigation.navigate('Explore', {})}><Text style={styles.seeAll}>See all</Text></Pressable></View>
    {location.error ? <BusinessEmptyState message={location.error} onRetry={() => {location.refresh().catch(() => {});}} /> : location.loading || loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : apiError ? <BusinessEmptyState message={apiError} onRetry={load} /> : businesses.length ? <View style={styles.list}>{businesses.slice(0, 4).map(item => <BusinessCard business={item} key={item.id} onPress={() => navigation.getParent()?.navigate('BusinessDetails', {businessId: item.id})} />)}</View> : <BusinessEmptyState />}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: {backgroundColor: COLORS.background, flexGrow: 1, paddingBottom: 28, paddingHorizontal: SPACING.md}, greeting: {color: COLORS.navy, fontSize: 28, fontWeight: '800', letterSpacing: -0.7, marginTop: 12}, subtitle: {color: COLORS.muted, fontSize: 15, marginTop: 5}, search: {marginVertical: 20}, sectionTitle: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 26}, heading: {color: COLORS.navy, fontSize: 18, fontWeight: '800'}, seeAll: {color: COLORS.primary, fontSize: 13, fontWeight: '700'}, list: {gap: 10}, loader: {marginVertical: 35},
});
