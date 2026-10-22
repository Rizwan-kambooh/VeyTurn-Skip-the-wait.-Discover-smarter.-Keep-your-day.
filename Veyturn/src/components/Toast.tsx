import React, {createContext, ReactNode, useContext, useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {Check, X} from '../assets/icons/icons';
import {COLORS, RADIUS} from '../theme/theme';

type ToastType = 'success' | 'error' | 'info';
type ToastValue = {message: string; type: ToastType};
type ToastContextValue = {showToast: (message: string, type?: ToastType) => void};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({children}: {children: ReactNode}) {
  const [toast, setToast] = useState<ToastValue | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    Animated.parallel([
      Animated.timing(opacity, {toValue: 0, duration: 180, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: -16, duration: 180, useNativeDriver: true}),
    ]).start(() => setToast(null));
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({message, type});
    opacity.setValue(0);
    translateY.setValue(-16);
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 220, useNativeDriver: true}),
      Animated.spring(translateY, {toValue: 0, friction: 8, useNativeDriver: true}),
    ]).start();
    timer.current = setTimeout(hide, 3500);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const backgroundColor = toast?.type === 'error' ? '#991B1B' : toast?.type === 'success' ? '#087F5B' : COLORS.navy;
  return <ToastContext.Provider value={{showToast}}>
    {children}
    {toast ? <Animated.View accessibilityLiveRegion="polite" style={[styles.toast, {backgroundColor, opacity, transform: [{translateY}]}]}>
      <View style={styles.icon}>{toast.type === 'error' ? <X color={COLORS.white} size={16} strokeWidth={3} /> : <Check color={COLORS.white} size={16} strokeWidth={3} />}</View>
      <Text style={styles.message}>{toast.message}</Text>
      <Pressable accessibilityLabel="Dismiss message" hitSlop={10} onPress={hide}><X color={COLORS.white} size={18} /></Pressable>
    </Animated.View> : null}
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider.');
  return context;
}

const styles = StyleSheet.create({
  toast: {alignItems: 'center', borderRadius: RADIUS.md, elevation: 12, flexDirection: 'row', gap: 10, left: 18, paddingHorizontal: 14, paddingVertical: 13, position: 'absolute', right: 18, shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.18, shadowRadius: 12, top: 58, zIndex: 9999},
  icon: {alignItems: 'center', borderColor: 'rgba(255,255,255,0.45)', borderRadius: 12, borderWidth: 1, height: 24, justifyContent: 'center', width: 24},
  message: {color: COLORS.white, flex: 1, fontSize: 13.5, fontWeight: '600', lineHeight: 19},
});
