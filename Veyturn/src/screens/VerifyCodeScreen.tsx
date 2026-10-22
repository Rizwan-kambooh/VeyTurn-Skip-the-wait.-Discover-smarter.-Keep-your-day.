import React, {useCallback, useEffect, useState} from 'react';
import {AppState, Pressable, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppButton} from '../components/AppButton';
import {AuthLayout} from '../components/AuthLayout';
import {VerificationCodeInput} from '../components/VerificationCodeInput';
import {RootStackParamList} from '../navigation/types';
import {COLORS, SPACING} from '../theme/theme';
import {apiRequest, ApiError} from '../services/api';
import {FormError} from '../components/FormError';
import {useToast} from '../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyCode'>;
const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyCodeScreen({navigation, route}: Props) {
  const {showToast} = useToast();
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(
    () => Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
  );
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const refreshCooldown = useCallback(() => {
    setCooldown(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)));
  }, [resendAvailableAt]);

  const startCooldown = (seconds = RESEND_COOLDOWN_SECONDS) => {
    setResendAvailableAt(Date.now() + seconds * 1000);
    setCooldown(seconds);
  };

  useEffect(() => {
    refreshCooldown();
    const timer = setInterval(refreshCooldown, 1000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refreshCooldown();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [refreshCooldown]);

  const verify = async () => {
    setSubmitted(true);
    setServerError('');
    if (code.length !== 6) {
      showToast('Please enter the complete six-digit code.', 'error');
      return;
    }
    try {
      setLoading(true);
      const data = await apiRequest<{reset_token: string}>('/auth/password-reset/verify/', {method: 'POST', body: {email: route.params.email, code}});
      showToast('Code verified successfully.', 'success');
      navigation.navigate('ResetPassword', {resetToken: data.reset_token});
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to verify the code.';
      setServerError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  const resend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setServerError('');
    try {
      setResendLoading(true);
      await apiRequest('/auth/password-reset/request/', {method: 'POST', body: {email: route.params.email}});
      setCode('');
      startCooldown();
      showToast('A new verification code has been sent.', 'success');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to resend the code.';
      setServerError(message);
      if (error instanceof ApiError && error.status === 429) {
        const details = error.details as {retry_after?: unknown} | null;
        const retryAfter = Number(details?.retry_after);
        startCooldown(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RESEND_COOLDOWN_SECONDS);
      }
      showToast(message, 'error');
    } finally {
      setResendLoading(false);
    }
  };
  return <AuthLayout title="Check your email" subtitle={`We sent a six-digit code to ${route.params.email}. Enter it below to continue.`} onBack={navigation.goBack}>
    <View style={styles.form}>
      <View style={styles.codeGroup}>
        <Text style={styles.label}>Verification code</Text>
        <VerificationCodeInput error={submitted && code.length !== 6} onChangeText={value => {setSubmitted(false); setCode(value);}} value={code} />
        {submitted && code.length !== 6 ? <Text style={styles.error}>Enter the complete six-digit code.</Text> : null}
      </View>
      <FormError message={serverError} />
      <AppButton icon loading={loading} title="Verify code" onPress={verify} />
      <View style={styles.resend}>
        <Text style={styles.helper}>Didn’t receive it? </Text>
        <Pressable accessibilityRole="button" disabled={cooldown > 0 || resendLoading} hitSlop={10} onPress={resend}>
          <Text style={[styles.link, (cooldown > 0 || resendLoading) && styles.linkDisabled]}>
            {resendLoading ? 'Sending…' : cooldown > 0 ? `Send again in ${cooldown}s` : 'Send again'}
          </Text>
        </Pressable>
      </View>
    </View>
  </AuthLayout>;
}

const styles = StyleSheet.create({
  form: {gap: SPACING.lg}, codeGroup: {gap: 10}, label: {color: COLORS.text, fontSize: 14, fontWeight: '600'},
  error: {color: COLORS.danger, fontSize: 12}, resend: {alignItems: 'center', flexDirection: 'row', justifyContent: 'center'},
  helper: {color: COLORS.muted, fontSize: 14}, link: {color: COLORS.primary, fontSize: 14, fontWeight: '700'},
  linkDisabled: {color: '#94A3B8'},
});
