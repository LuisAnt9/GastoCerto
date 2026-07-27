import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, Radius } from '../utils/theme';
import { Card } from '../components/Card';
import { MonthSelector } from '../components/MonthSelector';
import { getGastosPorCategoria, getResumoMes, getLancamentos } from '../database/database';
import { GastoPorCategoria, Lancamento } from '../types';
import { getCurrentMes, getCurrentAno, formatCurrency, getMesAbrev } from '../utils/helpers';

export default function GraficosScreen({ navigation }: { navigation: any }) {
  const [mes, setMes] = useState(getCurrentMes());
  const [ano, setAno] = useState(getCurrentAno());
  const [pcat, setPcat] = useState<GastoPorCategoria[]>([]);
  const [resumo, setResumo] = useState({totalReceitas:0,totalDespesas:0,saldo:0,percentualGasto:0});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async()=>{
    const [p,r] = await Promise.all([getGastosPorCategoria(mes,ano),getResumoMes(mes,ano)]);
    setPcat(p); setResumo(r);
  },[mes,ano]);

  React.useEffect(()=>{ load(); },[load]);

  const pct = Math.min(resumo.percentualGasto,100);
  const alertColor = resumo.percentualGasto>=100?Colors.despesa:resumo.percentualGasto>=80?Colors.amber:Colors.receita;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Gráficos</Text>
        <MonthSelector mes={mes} ano={ano} onChange={(m,a)=>{setMes(m);setAno(a);}} light/>
      </View>
      <ScrollView style={{flex:1,backgroundColor:Colors.background}} contentContainerStyle={{padding:Spacing.md,gap:Spacing.md,paddingBottom:32}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await load();setRefreshing(false);}} tintColor={Colors.primary}/>}>

        {/* Cards de receita / despesa / saldo */}
        <View style={s.row3}>
          <View style={[s.miniCard,{backgroundColor:Colors.receitaLight}]}>
            <Text style={s.miniIcon}>↑</Text>
            <Text style={s.miniLabel}>Receitas</Text>
            <Text style={[s.miniValue,{color:Colors.receita}]}>{formatCurrency(resumo.totalReceitas)}</Text>
          </View>
          <View style={[s.miniCard,{backgroundColor:Colors.despesaLight}]}>
            <Text style={s.miniIcon}>↓</Text>
            <Text style={s.miniLabel}>Despesas</Text>
            <Text style={[s.miniValue,{color:Colors.despesa}]}>{formatCurrency(resumo.totalDespesas)}</Text>
          </View>
          <View style={[s.miniCard,{backgroundColor:resumo.saldo>=0?Colors.receitaLight:Colors.despesaLight}]}>
            <Text style={s.miniIcon}>＝</Text>
            <Text style={s.miniLabel}>Saldo</Text>
            <Text style={[s.miniValue,{color:resumo.saldo>=0?Colors.receita:Colors.despesa}]}>{formatCurrency(resumo.saldo)}</Text>
          </View>
        </View>

        {/* Barra de orçamento */}
        {resumo.totalReceitas>0 && (
          <Card style={s.card}>
            <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:Spacing.sm}}>
              <Text style={s.cardTitle}>Comprometimento</Text>
              <Text style={[s.cardTitle,{color:alertColor}]}>{Math.round(pct)}%</Text>
            </View>
            <View style={s.bigTrack}>
              <View style={[s.bigFill,{width:`${pct}%` as any,backgroundColor:alertColor}]}/>
            </View>
            <Text style={[s.alertText,{color:alertColor,marginTop:Spacing.sm}]}>
              {resumo.percentualGasto>=100?`🚨 Gastou ${formatCurrency(Math.abs(resumo.saldo))} a mais que recebeu`:resumo.percentualGasto>=80?`⚠️ Atenção — quase no limite`:`✅ ${formatCurrency(resumo.saldo)} ainda disponível`}
            </Text>
          </Card>
        )}

        {/* Gastos por categoria */}
        <Card style={s.card}>
          <Text style={s.cardTitle}>Despesas por categoria</Text>
          {pcat.length===0 ? (
            <View style={s.empty}><Text style={{fontSize:32}}>📊</Text><Text style={s.emptyText}>Sem despesas neste mês</Text></View>
          ) : pcat.map((item,i)=>(
            <View key={i} style={s.catRow}>
              <View style={[s.catIconBg,{backgroundColor:item.categoria_cor+'20'}]}>
                <Text style={{fontSize:16}}>{item.categoria_icone}</Text>
              </View>
              <View style={{flex:1,gap:3}}>
                <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                  <Text style={s.catNome}>{item.categoria_nome}</Text>
                  <Text style={s.catValor}>{formatCurrency(item.total)}</Text>
                </View>
                <View style={s.catTrack}>
                  <View style={[s.catFill,{width:`${Math.max(item.percentual,2)}%` as any,backgroundColor:item.categoria_cor}]}/>
                </View>
                <Text style={s.catPct}>{Math.round(item.percentual)}% das despesas</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {flex:1,backgroundColor:Colors.primaryDark},
  header: {backgroundColor:Colors.primaryDark,paddingHorizontal:Spacing.md,paddingBottom:Spacing.md},
  title: {color:Colors.white,fontSize:FontSize.xl,fontWeight:'700',paddingTop:Spacing.sm,marginBottom:Spacing.sm},
  row3: {flexDirection:'row',gap:Spacing.sm},
  miniCard: {flex:1,borderRadius:Radius.md,padding:Spacing.sm,alignItems:'center',gap:3},
  miniIcon: {fontSize:18},
  miniLabel: {fontSize:FontSize.xs,color:Colors.textMuted},
  miniValue: {fontSize:FontSize.sm,fontWeight:'700'},
  card: {padding:Spacing.md,gap:Spacing.sm},
  cardTitle: {fontSize:FontSize.md,fontWeight:'700',color:Colors.text},
  bigTrack: {height:12,backgroundColor:Colors.border,borderRadius:Radius.full,overflow:'hidden'},
  bigFill: {height:12,borderRadius:Radius.full},
  alertText: {fontSize:FontSize.sm,fontWeight:'600'},
  catRow: {flexDirection:'row',alignItems:'center',gap:Spacing.sm,paddingVertical:Spacing.xs},
  catIconBg: {width:36,height:36,borderRadius:Radius.sm,alignItems:'center',justifyContent:'center'},
  catNome: {fontSize:FontSize.sm,fontWeight:'600',color:Colors.text},
  catValor: {fontSize:FontSize.sm,fontWeight:'700',color:Colors.text},
  catTrack: {height:6,backgroundColor:Colors.border,borderRadius:Radius.full,overflow:'hidden'},
  catFill: {height:6,borderRadius:Radius.full},
  catPct: {fontSize:FontSize.xs,color:Colors.textMuted},
  empty: {alignItems:'center',paddingVertical:Spacing.lg,gap:Spacing.sm},
  emptyText: {fontSize:FontSize.md,color:Colors.textMuted},
});
