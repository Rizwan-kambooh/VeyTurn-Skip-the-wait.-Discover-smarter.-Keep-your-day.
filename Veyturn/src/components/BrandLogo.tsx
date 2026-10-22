import React from 'react';
import {Image, ImageStyle, StyleProp, StyleSheet, View} from 'react-native';
import {Images} from '../assets/images/images';

type Props = {size?: number; style?: StyleProp<ImageStyle>; full?: boolean};

export function BrandLogo({size = 150, style, full = false}: Props) {
  return (
    <View style={[styles.crop, {width: size, height: full ? size : size * 0.82}]}>
      <Image accessibilityLabel="Veyturn logo" resizeMode="contain" source={Images.logo}
        style={[styles.image, !full && styles.compactImage, {width: size, height: size}, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  crop: {alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  image: {},
  compactImage: {transform: [{scale: 1.22}]},
});
