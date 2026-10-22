import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {LockKeyhole} from '../assets/icons/icons';
import {AppButton} from '../components/AppButton';
import {AuthLayout} from '../components/AuthLayout';
import {InputField} from '../components/InputField';
import {PasswordRequirements} from '../components/PasswordRequirements';
import {RootStackParamList} from '../navigation/types';
import {SPACING} from '../theme/theme';
import {isStrongPassword} from '../utils/validation';
import {apiRequest, ApiError} from '../services/api';
import {FormError} from '../components/FormError';
import {useToast} from '../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({navigation, route}: Props) {
  const {showToast} = useToast();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [touched, setTouched] = useState({password: false, confirmation: false});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const save = async () => {
    setTouched({password: true, confirmation: true});
    setServerError('');
    if (!isStrongPassword(password) || confirmation !== password) return;
    try {
      setLoading(true);
      await apiRequest('/auth/password-reset/confirm/', {method: 'POST', body: {reset_token: route.params.resetToken, password, password_confirmation: confirmation}});
      showToast('Password updated. You can now sign in.', 'success');
      navigation.reset({index: 0, routes: [{name: 'Login'}]});
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to update your password.';
      setServerError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  return <AuthLayout title="Create new password" subtitle="Choose a strong password you haven’t used before." onBack={navigation.goBack}>
    <View style={styles.form}>
      <InputField autoComplete="new-password" icon={LockKeyhole} isPassword label="New password" onChangeText={value => {setTouched(current => ({...current, password: true})); setPassword(value);}} placeholder="Create a strong password" value={password} error={touched.password && !isStrongPassword(password) ? 'Complete all password requirements.' : undefined} />
      <PasswordRequirements active={touched.password} password={password} />
      <InputField autoComplete="new-password" icon={LockKeyhole} isPassword label="Confirm new password" onChangeText={value => {setTouched(current => ({...current, confirmation: true})); setConfirmation(value);}} placeholder="Re-enter your new password" value={confirmation} error={touched.confirmation && confirmation !== password ? 'Passwords do not match.' : undefined} />
      <FormError message={serverError} />
      <AppButton icon loading={loading} title="Save new password" onPress={save} />
    </View>
  </AuthLayout>;
}

const styles = StyleSheet.create({form: {gap: SPACING.md}});
