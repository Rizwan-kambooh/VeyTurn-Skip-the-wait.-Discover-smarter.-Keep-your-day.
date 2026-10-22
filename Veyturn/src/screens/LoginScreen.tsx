import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Check, LockKeyhole, Mail} from '../assets/icons/icons';
import {AppButton} from '../components/AppButton';
import {AuthLayout} from '../components/AuthLayout';
import {InputField} from '../components/InputField';
import {RootStackParamList} from '../navigation/types';
import {COLORS, SPACING} from '../theme/theme';
import {isValidLoginIdentifier} from '../utils/validation';
import {useAuth} from '../auth/AuthContext';
import {FormError} from '../components/FormError';
import {ApiError} from '../services/api';
import {useToast} from '../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
export function LoginScreen({navigation}: Props) {
  const {login, rememberedIdentifier} = useAuth();
  const {showToast} = useToast();
  const [identifier, setIdentifier] = useState(''); const [password, setPassword] = useState(''); const [submitted, setSubmitted] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedIdentifier));
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const identifierError = submitted && !isValidLoginIdentifier(identifier) ? 'Enter a valid email address or phone number.' : undefined;
  const passwordError = submitted && password.length < 6 ? 'Password must be at least 6 characters.' : undefined;
  useEffect(() => {
    if (rememberedIdentifier) {
      setIdentifier(rememberedIdentifier);
      setRememberMe(true);
    }
  }, [rememberedIdentifier]);
  const submit = async () => {
    setSubmitted(true);
    setServerError('');
    if (!isValidLoginIdentifier(identifier) || password.length < 6) return;
    try {
      setLoading(true);
      await login(identifier.trim(), password, rememberMe);
      showToast('Welcome back! You’re signed in.', 'success');
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to sign in.';
      setServerError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  return <AuthLayout title="Welcome back" subtitle="Sign in to check your queues and upcoming turns." onBack={navigation.goBack}>
    <View style={styles.form}>
      <InputField autoCapitalize="none" icon={Mail} label="Email or phone number" onChangeText={setIdentifier} placeholder="Email address or phone number" value={identifier} error={identifierError} />
      <InputField autoComplete="password" icon={LockKeyhole} isPassword label="Password" onChangeText={setPassword} placeholder="Enter your password" value={password} error={passwordError} />
      <FormError message={serverError} />
      <View style={styles.options}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{checked: rememberMe}} onPress={() => setRememberMe(value => !value)} style={styles.remember}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>{rememberMe ? <Check color={COLORS.white} size={13} strokeWidth={3} /> : null}</View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('ForgotPassword')}><Text style={styles.link}>Forgot password?</Text></Pressable>
      </View>
      <AppButton icon loading={loading} title="Sign in" onPress={submit} />
    </View>
    <View style={styles.footer}><Text style={styles.footerText}>New to Veyturn? </Text><Pressable onPress={() => navigation.replace('Signup')}><Text style={styles.link}>Create account</Text></Pressable></View>
  </AuthLayout>;
}
const styles = StyleSheet.create({
  form: {gap: SPACING.md},
  options: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: -4},
  remember: {alignItems: 'center', flexDirection: 'row', gap: 8},
  checkbox: {alignItems: 'center', borderColor: COLORS.border, borderRadius: 5, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20},
  checkboxChecked: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  rememberText: {color: COLORS.muted, fontSize: 14, fontWeight: '500'},
  link: {color: COLORS.primary, fontSize: 14, fontWeight: '700'},
  footer: {alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl},
  footerText: {color: COLORS.muted, fontSize: 14},
});
