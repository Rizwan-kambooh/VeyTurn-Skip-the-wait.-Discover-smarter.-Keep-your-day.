import React, {useRef} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {COLORS, RADIUS} from '../theme/theme';

type Props = {value: string; onChangeText: (value: string) => void; error?: boolean};

export function VerificationCodeInput({value, onChangeText, error}: Props) {
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  return (
    <View>
      <Pressable accessibilityLabel="Six-digit verification code" onPress={() => inputRef.current?.focus()} style={styles.row}>
        {Array.from({length: 6}, (_, index) => (
          <View key={index} style={[styles.cell, value.length === index && styles.active, error && styles.error]}>
            <Text style={styles.digit}>{value[index] ?? ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={inputRef}
        autoFocus
        caretHidden
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={text => onChangeText(text.replace(/\D/g, ''))}
        style={styles.hiddenInput}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8, justifyContent: 'space-between'},
  cell: {alignItems: 'center', backgroundColor: COLORS.input, borderColor: COLORS.border, borderRadius: RADIUS.sm, borderWidth: 1.5, flex: 1, height: 58, justifyContent: 'center'},
  active: {backgroundColor: COLORS.white, borderColor: COLORS.primary},
  error: {borderColor: COLORS.danger},
  digit: {color: COLORS.navy, fontSize: 23, fontWeight: '700'},
  hiddenInput: {height: 1, opacity: 0, position: 'absolute', width: 1},
});
