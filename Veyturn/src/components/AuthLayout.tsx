import React, {ReactNode} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft} from '../assets/icons/icons';
import {COLORS, SPACING} from '../theme/theme';

type Props = {title: string; subtitle: string; children: ReactNode; onBack: () => void};

export function AuthLayout({title, subtitle, children, onBack}: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={onBack} style={styles.back}><ArrowLeft color={COLORS.text} size={22} /></Pressable>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>VEYTURN</Text><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {backgroundColor: COLORS.background, flex: 1}, flex: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl},
  back: {alignItems: 'center', alignSelf: 'flex-start', backgroundColor: COLORS.input, borderRadius: 14, height: 44, justifyContent: 'center', marginTop: SPACING.sm, width: 44},
  heading: {marginBottom: SPACING.xl, marginTop: SPACING.xl}, eyebrow: {color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2},
  title: {color: COLORS.navy, fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginTop: 8},
  subtitle: {color: COLORS.muted, fontSize: 15, lineHeight: 23, marginTop: 10},
});
