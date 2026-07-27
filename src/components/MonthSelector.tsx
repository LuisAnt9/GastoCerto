import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../utils/theme';
import { getMesLabel, getPreviousMes, getNextMes } from '../utils/helpers';

export function MonthSelector({ mes, ano, onChange, light }: { mes:number; ano:number; onChange:(m:number,a:number)=>void; light?:boolean }) {
  const color = light ? Colors.white : Colors.text;
  return (
    <View style={s.row}>
      <TouchableOpacity onPress={()=>{ const p=getPreviousMes(mes,ano); onChange(p.mes,p.ano); }} style={s.btn}>
        <Ionicons name="chevron-back" size={20} color={color}/>
      </TouchableOpacity>
      <Text style={[s.label,{color}]}>{getMesLabel(mes)} {ano}</Text>
      <TouchableOpacity onPress={()=>{ const n=getNextMes(mes,ano); onChange(n.mes,n.ano); }} style={s.btn}>
        <Ionicons name="chevron-forward" size={20} color={color}/>
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap: Spacing.md },
  btn: { width:32, height:32, borderRadius:16, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  label: { fontSize: FontSize.lg, fontWeight:'700', minWidth:160, textAlign:'center' },
});
