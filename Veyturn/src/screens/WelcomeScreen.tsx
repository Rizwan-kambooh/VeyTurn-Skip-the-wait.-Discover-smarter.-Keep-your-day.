import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BellRing, Clock3, MapPin} from '../assets/icons/icons';
import {AppButton} from '../components/AppButton';
import {BrandLogo} from '../components/BrandLogo';
import {RootStackParamList} from '../navigation/types';
import {COLORS, RADIUS, SPACING} from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;
const features = [
  {Icon: MapPin, title: 'Join remotely', text: 'Find nearby businesses and take your place from anywhere.'},
  {Icon: Clock3, title: 'Know your wait', text: 'See live queue progress and an accurate estimated time.'},
  {Icon: BellRing, title: 'Arrive on time', text: 'Get notified when your turn is getting close.'},
];

export function WelcomeScreen({navigation}: Props) {
  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.content}>
      <View style={styles.topRow}><BrandLogo size={105} /><View style={styles.badge}><Text style={styles.badgeText}>NO MORE LINES</Text></View></View>
      <View style={styles.hero}>
        <Text style={styles.title}>Your turn,{`\n`}without the wait.</Text>
        <Text style={styles.subtitle}>Join queues at clinics, banks, salons and more—right from your phone.</Text>
      </View>
      <View style={styles.featureList}>{features.map(({Icon, title, text}) => <View key={title} style={styles.feature}>
        <View style={styles.iconWrap}><Icon color={COLORS.primary} size={22} /></View>
        <View style={styles.featureCopy}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureText}>{text}</Text></View>
      </View>)}</View>
      <View style={styles.actions}>
        <AppButton icon title="Create an account" onPress={() => navigation.navigate('Signup')} />
        <AppButton title="I already have an account" variant="secondary" onPress={() => navigation.navigate('Login')} />
      </View>
      <Text style={styles.businessHint}>Want to manage a queue? Create your account first, then switch on Business mode.</Text>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: {backgroundColor: COLORS.background, flex: 1}, content: {flex: 1, paddingBottom: SPACING.md, paddingHorizontal: SPACING.lg},
  topRow: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'}, badge: {backgroundColor: COLORS.soft, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 7},
  badgeText: {color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1}, hero: {marginTop: SPACING.md},
  title: {color: COLORS.navy, fontSize: 39, fontWeight: '800', letterSpacing: -1.3, lineHeight: 45}, subtitle: {color: COLORS.muted, fontSize: 16, lineHeight: 24, marginTop: 12},
  featureList: {gap: 12, marginTop: SPACING.lg}, feature: {alignItems: 'center', flexDirection: 'row', gap: 14},
  iconWrap: {alignItems: 'center', backgroundColor: COLORS.soft, borderRadius: 15, height: 48, justifyContent: 'center', width: 48}, featureCopy: {flex: 1},
  featureTitle: {color: COLORS.text, fontSize: 15, fontWeight: '700'}, featureText: {color: COLORS.muted, fontSize: 13, lineHeight: 18, marginTop: 2},
  actions: {gap: 12, marginTop: 'auto'}, businessHint: {color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 12, textAlign: 'center'},
});
