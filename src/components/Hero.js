import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { Logo } from './ui';

// Soft "archway over the sea" illustration built from gradients, used on welcome screens.
export function Hero({ height = 380 }) {
  return (
    <View style={[s.wrap, { height }]}>
      <LinearGradient colors={['#FBF6EE', '#EFE3D0']} style={StyleSheet.absoluteFill} />
      <View style={s.arch}>
        <LinearGradient colors={['#F8EBD7', '#CFE0EC', '#8FB3CF']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
        <View style={s.sun} />
        <View style={s.sea} />
      </View>
      <Ionicons name="leaf" size={70} color="#A3B18A" style={[s.plant, { left: -10, transform: [{ rotate: '-30deg' }] }]} />
      <Ionicons name="leaf" size={56} color="#8C9C72" style={[s.plant, { right: -6, transform: [{ rotate: '35deg' }] }]} />
      <View style={s.logo}><Logo size={34} /></View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { overflow: 'hidden', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, alignItems: 'center', justifyContent: 'flex-end' },
  arch: { position: 'absolute', top: 40, width: '78%', height: '88%', borderTopLeftRadius: 400, borderTopRightRadius: 400, overflow: 'hidden', borderWidth: 6, borderColor: '#F3E7D4' },
  sun: { position: 'absolute', top: '40%', alignSelf: 'center', width: 70, height: 70, borderRadius: 35, backgroundColor: '#FBE7C6' },
  sea: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%', backgroundColor: colors.primary, opacity: 0.35 },
  plant: { position: 'absolute', bottom: 30 },
  logo: { position: 'absolute', top: '22%', backgroundColor: 'rgba(255,251,245,0.85)', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20 },
});
