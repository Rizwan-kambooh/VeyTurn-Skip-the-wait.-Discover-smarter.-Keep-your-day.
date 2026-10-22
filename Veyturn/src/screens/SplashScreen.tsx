import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BrandLogo} from '../components/BrandLogo';
import {RootStackParamList} from '../navigation/types';
import {COLORS} from '../theme/theme';
import {useAuth} from '../auth/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({navigation}: Props) {
  const {restoring, user} = useAuth();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 650, useNativeDriver: true}),
      Animated.spring(scale, {toValue: 1, friction: 7, useNativeDriver: true}),
    ]).start();
    if (restoring) return;
    const timer = setTimeout(() => navigation.replace(user ? 'Home' : 'Welcome'), 1800);
    return () => clearTimeout(timer);
  }, [navigation, opacity, restoring, scale, user]);

  return <SafeAreaView style={styles.screen}>
    <View style={styles.glowTop} />
    <Animated.View style={[styles.center, {opacity, transform: [{scale}]}]}>
      <View style={styles.logoCard}><BrandLogo full size={214} /></View>
      <Text style={styles.message}>Skip the wait. Keep your day.</Text>
    </Animated.View>
    <View style={styles.loaderTrack}><Animated.View style={[styles.loader, {opacity}]} /></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {alignItems: 'center', backgroundColor: '#F6FFFD', flex: 1, justifyContent: 'center', overflow: 'hidden'},
  glowTop: {backgroundColor: '#D8FAF3', borderRadius: 220, height: 380, position: 'absolute', right: -150, top: -160, width: 380},
  center: {alignItems: 'center'}, logoCard: {alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 38, elevation: 5, height: 250, justifyContent: 'center', shadowColor: COLORS.primaryDark, shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.12, shadowRadius: 25, width: 250},
  message: {color: COLORS.muted, fontSize: 15, fontWeight: '500', marginTop: 30},
  loaderTrack: {backgroundColor: '#D7EDE9', borderRadius: 4, bottom: 56, height: 4, overflow: 'hidden', position: 'absolute', width: 88},
  loader: {backgroundColor: COLORS.accent, borderRadius: 4, height: 4, width: 58},
});
