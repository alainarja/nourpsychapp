import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// Placeholder artwork cropped from the client's mockup (archway over the sea, with the logo)
// until they send the original high-resolution images.
const HERO = require('../../assets/images/hero.png');

// Fills the space it's given, so welcome screens fit short phones without scrolling.
export function Hero({ style }) {
  return (
    <View style={[s.wrap, style]}>
      <Image source={HERO} style={s.image} resizeMode="cover" accessibilityLabel="Shift & Thrive — Shift your path, thrive in life" />
      <LinearGradient colors={['rgba(250,241,228,0)', colors.bg]} style={s.fade} pointerEvents="none" />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, minHeight: 280, overflow: 'hidden', backgroundColor: colors.sand },
  // Explicit size: on web an absolutely-filled Image otherwise renders at its natural pixel size.
  image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 56 },
});
