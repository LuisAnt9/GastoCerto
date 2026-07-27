import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../utils/theme';
import { Card } from '../components/Card';
import { MonthSelector } from '../components/MonthSelector';
import { LancamentoItem } from '../components/LancamentoItem';
import { getLancamentos, getResumoMes, getGastosPorCategoria, deleteLancamento } from '../database/database';
import { Lancamento, GastoPorCategoria } from '../types';
import { getCurrentMes, getCurrentAno, formatCurrency } from '../utils/helpers';

export default function DashboardScreen({ navigation }: { navigation: any }) {
  const [mes, setMes] = useState(getCurrentMes());
  const [ano, setAno] = useState(getCurrentAno());
  const [resumo, setResumo] = useState({ totalReceitas:0, totalDespesas:0, saldo:0, percentualGasto:0 });
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [porCategoria, setPorCategoria] = useState<GastoPorCategoria[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [res, lancs, pcat] = await Promise.all([
      getResumoMes(mes, ano),
      getLancamentos(mes, ano),
      getGastosPorCategoria(mes, ano),
    ]);
    setResumo(res); setLancamentos(lancs.slice(0, 6)); setPorCategoria(pcat);
  }, [mes, ano]);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(l: Lancamento) {
    if (l.grupo_id && (l.recorrencia === 'fixo' || l.recorrencia === 'parcelado')) {
      const { Alert } = require('react-native');
      Alert.alert('Excluir', 'Deseja excluir apenas este ou todos?', [
        { text: 'Só este', onPress: async () => { await deleteLancamento(l.id); await load(); } },
        { text: 'Todos', style: 'destructive', onPress: async () => { await deleteLancamento(l.id, true, l.grupo_id); await load(); } },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } else {
      await deleteLancamento(l.id);
      await load();
    }
  }

  const pct = Math.min(resumo.percentualGasto, 100);
  const barColor = resumo.percentualGasto >= 100 ? Colors.despesa : resumo.percentualGasto >= 80 ? Colors.amber : Colors.receita;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* HEADER */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.hello}>Olá, Luis 👋</Text>
            <Text style={s.subtitle}>Resumo financeiro</Text>
          </View>
          <View style={s.logoBox}>
            <Text style={{ fontSize: 22 }}>💰</Text>
          </View>
        </View>
        <MonthSelector mes={mes} ano={ano} onChange={(m,a)=>{setMes(m);setAno(a);}} light />

        {/* SALDO CARD */}
        <View style={s.saldoCard}>
          <Text style={s.saldoLabel}>Saldo do mês</Text>
          <Text style={[s.saldoValue, resumo.saldo < 0 && {color:'#FFCDD2'}]}>{formatCurrency(resumo.saldo)}</Text>
          <View style={s.saldoRow}>
            <View style={s.saldoItem}>
              <View style={s.saldoDot}><Ionicons name="arrow-up" size={12} color={Colors.white}/></View>
              <View>
                <Text style={s.saldoItemLabel}>Receitas</Text>
                <Text style={s.saldoItemValue}>{formatCurrency(resumo.totalReceitas)}</Text>
              </View>
            </View>
            <View style={s.divider}/>
            <View style={s.saldoItem}>
              <View style={[s.saldoDot,{backgroundColor:'rgba(255,100,100,0.4)'}]}><Ionicons name="arrow-down" size={12} color={Colors.white}/></View>
              <View>
                <Text style={s.saldoItemLabel}>Despesas</Text>
                <Text style={s.saldoItemValue}>{formatCurrency(resumo.totalDespesas)}</Text>
              </View>
            </View>
          </View>
          {resumo.totalReceitas > 0 && (
            <View style={s.progressWrap}>
              <View style={s.progressRow}>
                <Text style={s.progressLabel}>{Math.round(pct)}% gasto</Text>
                <Text style={s.progressLabel}>{formatCurrency(Math.max(resumo.saldo,0))} livre</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill,{width:`${pct}%` as any,backgroundColor:barColor}]}/>
              </View>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await load();setRefreshing(false);}} tintColor={Colors.primary}/>}>

        {/* GASTOS POR CATEGORIA */}
        {porCategoria.length > 0 && (
          <Card style={s.card}>
            <Text style={s.secTitle}>Gastos por categoria</Text>
            {porCategoria.slice(0,4).map((item,i)=>(
              <View key={i} style={s.catRow}>
                <View style={[s.catDot,{backgroundColor:item.categoria_cor}]}/>
                <Text style={s.catIcon}>{item.categoria_icone}</Text>
                <Text style={s.catNome} numberOfLines={1}>{item.categoria_nome}</Text>
                <View style={s.catBarWrap}>
                  <View style={[s.catBar,{width:`${Math.max(item.percentual,2)}%` as any,backgroundColor:item.categoria_cor}]}/>
                </View>
                <Text style={s.catValor}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* ÚLTIMOS LANÇAMENTOS */}
        <Card style={s.card}>
          <View style={s.secHeader}>
            <Text style={s.secTitle}>Últimos lançamentos</Text>
            <TouchableOpacity onPress={()=>navigation.navigate('Extrato')}>
              <Text style={s.verTodos}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {lancamentos.length === 0 ? (
            <View style={s.empty}>
              <Text style={{fontSize:40}}>📊</Text>
              <Text style={s.emptyText}>Nenhum lançamento neste mês</Text>
              <Text style={s.emptyHint}>Toque no + para adicionar</Text>
            </View>
          ) : lancamentos.map(l => (
            <LancamentoItem key={l.id} lancamento={l}
              onEdit={lc=>navigation.navigate('NovoLancamento',{lancamento:lc})}
              onDelete={handleDelete} onRefresh={load}/>
          ))}
        </Card>
      </ScrollView>

      {/* FABs */}
      <View style={s.fabs}>
        <TouchableOpacity style={[s.fab,{backgroundColor:Colors.despesa}]} onPress={()=>navigation.navigate('NovoLancamento',{tipo:'despesa'})}>
          <Ionicons name="remove" size={22} color={Colors.white}/>
          <Text style={s.fabText}>Despesa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.fab,{backgroundColor:Colors.receita}]} onPress={()=>navigation.navigate('NovoLancamento',{tipo:'receita'})}>
          <Ionicons name="add" size={22} color={Colors.white}/>
          <Text style={s.fabText}>Receita</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {flex:1,backgroundColor:Colors.primaryDark},
  header: {backgroundColor:Colors.primaryDark,paddingBottom:Spacing.md},
  headerTop: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:Spacing.md,paddingTop:Spacing.sm,marginBottom:Spacing.sm},
  hello: {color:Colors.white,fontSize:FontSize.xl,fontWeight:'700'},
  subtitle: {color:'rgba(255,255,255,0.6)',fontSize:FontSize.sm,marginTop:2},
  logoBox: {width:44,height:44,borderRadius:22,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center'},
  saldoCard: {marginHorizontal:Spacing.md,marginTop:Spacing.md,backgroundColor:'rgba(255,255,255,0.1)',borderRadius:Radius.lg,padding:Spacing.md,borderWidth:1,borderColor:'rgba(255,255,255,0.15)'},
  saldoLabel: {color:'rgba(255,255,255,0.7)',fontSize:FontSize.sm,textAlign:'center'},
  saldoValue: {color:Colors.white,fontSize:FontSize.huge,fontWeight:'700',textAlign:'center',marginVertical:Spacing.xs},
  saldoRow: {flexDirection:'row',alignItems:'center',marginTop:Spacing.sm},
  saldoItem: {flex:1,flexDirection:'row',alignItems:'center',gap:Spacing.sm,justifyContent:'center'},
  saldoDot: {width:28,height:28,borderRadius:14,backgroundColor:'rgba(100,255,150,0.3)',alignItems:'center',justifyContent:'center'},
  saldoItemLabel: {color:'rgba(255,255,255,0.6)',fontSize:FontSize.xs},
  saldoItemValue: {color:Colors.white,fontSize:FontSize.md,fontWeight:'600'},
  divider: {width:1,height:40,backgroundColor:'rgba(255,255,255,0.2)'},
  progressWrap: {marginTop:Spacing.md},
  progressRow: {flexDirection:'row',justifyContent:'space-between',marginBottom:4},
  progressLabel: {color:'rgba(255,255,255,0.6)',fontSize:FontSize.xs},
  progressTrack: {height:6,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:Radius.full},
  progressFill: {height:6,borderRadius:Radius.full,minWidth:4},
  scroll: {flex:1,backgroundColor:Colors.background},
  content: {padding:Spacing.md,paddingBottom:100,gap:Spacing.md},
  card: {padding:Spacing.md},
  secTitle: {fontSize:FontSize.md,fontWeight:'700',color:Colors.text,marginBottom:Spacing.sm},
  secHeader: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:Spacing.sm},
  verTodos: {fontSize:FontSize.sm,color:Colors.primary,fontWeight:'600'},
  catRow: {flexDirection:'row',alignItems:'center',gap:Spacing.sm,paddingVertical:6},
  catDot: {width:8,height:8,borderRadius:4},
  catIcon: {fontSize:16},
  catNome: {flex:0,width:80,fontSize:FontSize.xs,color:Colors.text},
  catBarWrap: {flex:1,height:6,backgroundColor:Colors.border,borderRadius:Radius.full,overflow:'hidden'},
  catBar: {height:6,borderRadius:Radius.full},
  catValor: {fontSize:FontSize.xs,fontWeight:'600',color:Colors.text,width:72,textAlign:'right'},
  empty: {alignItems:'center',paddingVertical:Spacing.xl,gap:Spacing.sm},
  emptyText: {fontSize:FontSize.md,color:Colors.textMuted,fontWeight:'500'},
  emptyHint: {fontSize:FontSize.sm,color:Colors.textLight},
  fabs: {position:'absolute',bottom:24,right:Spacing.md,gap:Spacing.sm},
  fab: {flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:Spacing.md,paddingVertical:12,borderRadius:Radius.full,elevation:6,shadowColor:Colors.shadow,shadowOffset:{width:0,height:3},shadowOpacity:0.25,shadowRadius:6},
  fabText: {color:Colors.white,fontWeight:'700',fontSize:FontSize.sm},
});
