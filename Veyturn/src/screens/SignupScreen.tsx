import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {LockKeyhole, Mail, Phone, UserRound} from '../assets/icons/icons';
import {AppButton} from '../components/AppButton';
import {AuthLayout} from '../components/AuthLayout';
import {InputField} from '../components/InputField';
import {PasswordRequirements} from '../components/PasswordRequirements';
import {RootStackParamList} from '../navigation/types';
import {COLORS, SPACING} from '../theme/theme';
import {isStrongPassword, isValidEmail, isValidPhone} from '../utils/validation';
import {useAuth} from '../auth/AuthContext';
import {FormError} from '../components/FormError';
import {ApiError} from '../services/api';
import {useToast} from '../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;
export function SignupScreen({navigation}: Props) {
  const {signup} = useAuth();
  const {showToast} = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({name: false, email: false, phone: false, password: false});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const touch = (field: keyof typeof touched) => setTouched(current => ({...current, [field]: true}));
  const submit = async () => {
    setTouched({name: true, email: true, phone: true, password: true});
    setServerError('');
    if (name.trim().length < 2 || !isValidEmail(email) || !isValidPhone(phone) || !isStrongPassword(password)) return;
    try {
      setLoading(true);
      await signup({full_name: name.trim(), email: email.trim(), phone_number: phone, password});
      showToast('Account created successfully. Welcome to Veyturn!', 'success');
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to create your account.';
      setServerError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout title="Create your account" subtitle="One account for joining queues now—and managing a business later." onBack={navigation.goBack}>
    <View style={styles.form}>
      <InputField autoComplete="name" icon={UserRound} label="Full name" onChangeText={value => {touch('name'); setName(value);}} placeholder="Your full name" value={name} error={touched.name && name.trim().length < 2 ? 'Enter at least 2 characters.' : undefined} />
      <InputField autoCapitalize="none" autoComplete="email" icon={Mail} keyboardType="email-address" label="Email address" onChangeText={value => {touch('email'); setEmail(value);}} placeholder="you@example.com" value={email} error={touched.email && !isValidEmail(email) ? 'Enter a valid email address.' : undefined} />
      <InputField autoComplete="tel" icon={Phone} keyboardType="phone-pad" label="Phone number" maxLength={18} onChangeText={value => {touch('phone'); setPhone(value);}} placeholder="+92 300 1234567" value={phone} error={touched.phone && !isValidPhone(phone) ? 'Enter a valid phone number (10–15 digits).' : undefined} />
      <InputField autoComplete="new-password" icon={LockKeyhole} isPassword label="Password" onChangeText={value => {touch('password'); setPassword(value);}} placeholder="Create a strong password" value={password} error={touched.password && !isStrongPassword(password) ? 'Complete all password requirements.' : undefined} />
      <PasswordRequirements active={touched.password} password={password} />
      <FormError message={serverError} />
      <Text style={styles.terms}>By continuing, you agree to Veyturn’s <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>.</Text>
      <AppButton icon loading={loading} title="Create account" onPress={submit} />
    </View>
    <View style={styles.footer}><Text style={styles.footerText}>Already have an account? </Text><Pressable onPress={() => navigation.replace('Login')}><Text style={styles.link}>Sign in</Text></Pressable></View>
  </AuthLayout>;
}
const styles = StyleSheet.create({form: {gap: SPACING.md}, terms: {color: COLORS.muted, fontSize: 12, lineHeight: 18}, link: {color: COLORS.primary, fontSize: 14, fontWeight: '700'}, footer: {alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg}, footerText: {color: COLORS.muted, fontSize: 14}});
