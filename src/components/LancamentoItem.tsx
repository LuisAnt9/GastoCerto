import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../utils/theme';
import { Lancamento } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { togglePago } from '../database/database';

export function LancamentoItem({
  lancamento, onEdit, onDelete, onRefresh
}: {
  lancamento: Lancamento;
  onEdit: (l: Lancamento) => void;
  onDelete: (l: Lancamento) => void;
  onRefresh: () => void;
}) {
  const isReceita = lancamento.tipo === 'receita';
  const isPago = lancamento.pago === 1;

  async function handleTogglePago() {
    await togglePago(lancamento.id, !isPago);
    onRefresh();
  }

  function handleLongPress() {
    Alert.alert(lancamento.descricao, formatCurrency(lancamento.valor), [
      { text: '✏️ Editar', onPress: () => onEdit(lancamento) },
      { text: '🗑️ Excluir', style: 'destructive', onPress: () => onDelete(lancamento) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  const badge = lancamento.recorrencia === 'fixo' ? '🔄' :
    lancamento.recorrencia === 'parcelado' ? `${lancamento.parcela_atual}/${lancamento.total_parcelas}` : null;

  return (
    <TouchableOpacity style={[s.item, isPago && s.itemPago]} onPress={() => onEdit(lancamento)} onLongPress={handleLongPress} activeOpacity={0.7}>
      <TouchableOpacity onPress={handleTogglePago} style={[s.check, isPago && { backgroundColor: isReceita ? Colors.receita : Colors.despesa }]}>
        {isPago && <Ionicons name="checkmark" size={14} color={Colors.white}/>}
      </TouchableOpacity>
      <View style={[s.iconBg, { backgroundColor: (lancamento.categoria_cor ?? '#888') + '20' }]}>
        <Text style={{ fontSize: 20 }}>{lancamento.categoria_icone ?? '📦'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[s.desc, isPago && s.descPago]} numberOfLines={1}>{lancamento.descricao}</Text>
          {badge && <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View>}
        </View>
        <Text style={s.meta}>{lancamento.categoria_nome} · {formatDate(lancamento.data)}</Text>
      </View>
      <Text style={[s.valor, { color: isReceita ? Colors.receita : Colors.despesa }, isPago && s.descPago]}>
        {isReceita ? '+' : '-'}{formatCurrency(lancamento.valor)}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  item: { flexDirection:'row', alignItems:'center', gap:Spacing.sm, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:Colors.border },
  itemPago: { opacity: 0.6 },
  check: { width:22, height:22, borderRadius:11, borderWidth:1.5, borderColor:Colors.border, alignItems:'center', justifyContent:'center' },
  iconBg: { width:42, height:42, borderRadius:Radius.sm, alignItems:'center', justifyContent:'center' },
  desc: { fontSize:FontSize.md, fontWeight:'600', color:Colors.text, flex:1 },
  descPago: { textDecorationLine:'line-through', color:Colors.textMuted },
  meta: { fontSize:FontSize.xs, color:Colors.textMuted, marginTop:2 },
  valor: { fontSize:FontSize.md, fontWeight:'700' },
  badge: { backgroundColor:Colors.amberLight, borderRadius:Radius.xs, paddingHorizontal:5, paddingVertical:1 },
  badgeText: { fontSize:9, color:Colors.amber, fontWeight:'700' },
});
