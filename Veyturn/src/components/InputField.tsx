import React, {ComponentType, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, TextInputProps, View} from 'react-native';
import {Eye, EyeOff} from '../assets/icons/icons';
import {COLORS, RADIUS} from '../theme/theme';

type IconProps = {color?: string; size?: number};
type Props = TextInputProps & {label: string; icon: ComponentType<IconProps>; error?: string | false; isPassword?: boolean};

export function InputField({label, icon: Icon, error, isPassword, ...props}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(isPassword));
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, focused && styles.focused, error ? styles.invalid : null]}>
        <Icon color={focused ? COLORS.primary : COLORS.muted} size={20} />
        <TextInput {...props} onBlur={event => {setFocused(false); props.onBlur?.(event);}}
          onFocus={event => {setFocused(true); props.onFocus?.(event);}} placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && hidden} style={styles.input} />
        {isPassword && <Pressable accessibilityLabel={hidden ? 'Show password' : 'Hide password'} hitSlop={10} onPress={() => setHidden(value => !value)}>
          {hidden ? <Eye size={20} color={COLORS.muted} /> : <EyeOff size={20} color={COLORS.muted} />}
        </Pressable>}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {gap: 8}, label: {color: COLORS.text, fontSize: 14, fontWeight: '600'},
  inputBox: {alignItems: 'center', backgroundColor: COLORS.input, borderColor: COLORS.border, borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row', gap: 12, height: 56, paddingHorizontal: 16},
  focused: {backgroundColor: COLORS.white, borderColor: COLORS.primary, borderWidth: 1.5}, invalid: {borderColor: COLORS.danger},
  input: {color: COLORS.text, flex: 1, fontSize: 15, paddingVertical: 0}, error: {color: COLORS.danger, fontSize: 12},
});
