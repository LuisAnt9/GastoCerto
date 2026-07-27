import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors, Radius } from '../utils/theme';
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: Radius.md, shadowColor: Colors.shadow, shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3 },
});
