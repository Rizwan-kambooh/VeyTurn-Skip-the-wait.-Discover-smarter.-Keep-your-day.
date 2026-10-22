import React, {createContext, ReactNode, useContext, useMemo, useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Bookmark, BriefcaseBusiness, ChevronRight, History, LogOut, SlidersHorizontal, X} from '../assets/icons/icons';
import {useAuth} from '../auth/AuthContext';
import {COLORS, RADIUS, SPACING} from '../theme/theme';
import {useBusiness} from '../business/BusinessContext';

type DrawerContextValue = {openDrawer: () => void};
const DrawerContext = createContext<DrawerContextValue | null>(null);

const items = [
  {label: 'Visit history', route: 'History', Icon: History},
  {label: 'Saved businesses', route: 'SavedBusinesses', Icon: Bookmark},
  {label: 'Preferences', route: 'Preferences', Icon: SlidersHorizontal},
];

export function AppDrawerProvider({children, onNavigate}: {children: ReactNode; onNavigate: (route: string) => void}) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const {user, logout} = useAuth();
  const {business} = useBusiness();
  const drawerStyle = useMemo(() => [
    styles.drawer,
    {paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 8)},
  ], [insets.bottom, insets.top]);
  const go = (route: string) => {setVisible(false); onNavigate(route);};
  return <DrawerContext.Provider value={{openDrawer: () => setVisible(true)}}>
    {children}
    <Modal animationType="fade" onRequestClose={() => setVisible(false)} transparent visible={visible}>
      <View style={styles.modal}>
        <Pressable onPress={() => setVisible(false)} style={styles.scrim} />
        <View style={drawerStyle}>
          <View style={styles.top}><Text style={styles.brand}>VEYTURN</Text><Pressable onPress={() => setVisible(false)} style={styles.close}><X color={COLORS.navy} size={20} /></Pressable></View>
          <Pressable onPress={() => go('EditProfile')} style={styles.profile}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{user?.full_name?.split(' ').map(word => word[0]).slice(0, 2).join('') || 'VT'}</Text></View>
            <View style={styles.profileCopy}><Text style={styles.name}>{user?.full_name || 'Veyturn User'}</Text><Text numberOfLines={1} style={styles.email}>{user?.email || 'Complete your profile'}</Text><Text style={styles.edit}>View & edit profile</Text></View>
            <ChevronRight color={COLORS.muted} size={19} />
          </Pressable>
          <ScrollView contentContainerStyle={styles.menu}>
            {items.map(({label, route, Icon}) => <Pressable key={label} onPress={() => go(route)} style={styles.menuItem}><View style={styles.menuIcon}><Icon color={COLORS.navy} size={20} /></View><Text style={styles.menuLabel}>{label}</Text><ChevronRight color="#AAB6C5" size={18} /></Pressable>)}
            <Pressable onPress={() => go(business ? 'BusinessApp' : 'RegisterBusiness')} style={styles.business}>
              <View style={styles.businessIcon}><BriefcaseBusiness color={COLORS.white} size={23} /></View>
              <View style={{flex: 1}}><Text style={styles.businessTitle}>{business ? business.name : 'Register your business'}</Text><Text style={styles.businessText}>{business ? 'Open your business dashboard' : 'Create and manage digital queues'}</Text></View><ChevronRight color={COLORS.white} size={19} />
            </Pressable>
          </ScrollView>
          <Pressable onPress={async () => {setVisible(false); await logout(); onNavigate('Login');}} style={styles.logout}><LogOut color={COLORS.danger} size={19} /><Text style={styles.logoutText}>Sign out</Text></Pressable>
        </View>
      </View>
    </Modal>
  </DrawerContext.Provider>;
}

export function useAppDrawer() {
  const context = useContext(DrawerContext);
  if (!context) throw new Error('useAppDrawer must be used inside AppDrawerProvider.');
  return context;
}

const styles = StyleSheet.create({
  modal: {flex: 1, flexDirection: 'row'}, scrim: {backgroundColor: 'rgba(7,27,61,0.45)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0},
  drawer: {backgroundColor: COLORS.white, flex: 1, maxWidth: 340}, top: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 8},
  brand: {color: COLORS.primary, fontSize: 14, fontWeight: '900', letterSpacing: 2}, close: {alignItems: 'center', backgroundColor: COLORS.input, borderRadius: 12, height: 38, justifyContent: 'center', width: 38},
  profile: {alignItems: 'center', backgroundColor: COLORS.soft, borderRadius: RADIUS.lg, flexDirection: 'row', gap: 12, margin: SPACING.lg, padding: 16},
  avatar: {alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 28, height: 56, justifyContent: 'center', width: 56}, avatarText: {color: COLORS.white, fontSize: 18, fontWeight: '800'},
  profileCopy: {flex: 1}, name: {color: COLORS.navy, fontSize: 16, fontWeight: '800'}, email: {color: COLORS.muted, fontSize: 11, marginTop: 3}, edit: {color: COLORS.primary, fontSize: 11, fontWeight: '700', marginTop: 5},
  menu: {paddingHorizontal: SPACING.md}, menuItem: {alignItems: 'center', borderBottomColor: '#EDF1F5', borderBottomWidth: 1, flexDirection: 'row', gap: 12, minHeight: 55, paddingHorizontal: 6}, menuIcon: {alignItems: 'center', backgroundColor: COLORS.input, borderRadius: 11, height: 38, justifyContent: 'center', width: 38}, menuLabel: {color: COLORS.text, flex: 1, fontSize: 14, fontWeight: '600'},
  business: {alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, flexDirection: 'row', gap: 12, marginTop: 20, padding: 16}, businessIcon: {alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, height: 46, justifyContent: 'center', width: 46}, businessTitle: {color: COLORS.white, fontSize: 14, fontWeight: '800'}, businessText: {color: '#D9FFFA', fontSize: 11, marginTop: 3},
  logout: {alignItems: 'center', borderTopColor: '#EDF1F5', borderTopWidth: 1, flexDirection: 'row', gap: 10, marginTop: 'auto', padding: SPACING.lg}, logoutText: {color: COLORS.danger, fontSize: 14, fontWeight: '700'},
});
