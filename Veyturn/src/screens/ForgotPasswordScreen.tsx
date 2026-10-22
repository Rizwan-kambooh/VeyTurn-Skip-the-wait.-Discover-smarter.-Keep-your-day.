import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Mail} from '../assets/icons/icons';
import {AppButton} from '../components/AppButton';
import {AuthLayout} from '../components/AuthLayout';
import {InputField} from '../components/InputField';
import {RootStackParamList} from '../navigation/types';
import {COLORS, RADIUS, SPACING} from '../theme/theme';
import {isValidEmail} from '../utils/validation';
import {apiRequest, ApiError} from '../services/api';
import {FormError} from '../components/FormError';
import {useToast} from '../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({navigation}: Props) {
  const {showToast} = useToast();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const valid = isValidEmail(email);
  const continueToCode = async () => {
    setTouched(true);
    setServerError('');
    if (!valid) return;
    try {
      setLoading(true);
      await apiRequest('/auth/password-reset/request/', {method: 'POST', body: {email: email.trim()}});
      showToast('Verification code sent. Please check your email.', 'success');
      navigation.navigate('VerifyCode', {email: email.trim()});
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to send the code.';
      setServerError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  return <AuthLayout title="Forgot password?" subtitle="Enter your account email and we’ll send you a six-digit verification code." onBack={navigation.goBack}>
    <View style={styles.note}><Text style={styles.noteText}>For your security, the verification code will expire after a short time.</Text></View>
    <View style={styles.form}>
      <InputField autoCapitalize="none" autoComplete="email" icon={Mail} keyboardType="email-address" label="Email address" onChangeText={value => {setTouched(true); setEmail(value);}} placeholder="you@example.com" value={email} error={touched && !valid ? 'Enter a valid email address.' : undefined} />
      <FormError message={serverError} />
      <AppButton icon loading={loading} title="Send verification code" onPress={continueToCode} />
    </View>
  </AuthLayout>;
}

const styles = StyleSheet.create({
  note: {backgroundColor: COLORS.soft, borderRadius: RADIUS.md, marginBottom: SPACING.lg, padding: 14},
  noteText: {color: COLORS.primaryDark, fontSize: 13, lineHeight: 19},
  form: {gap: SPACING.lg},
});
