import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, SectionList, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../utils/theme';
import { LancamentoItem } from '../components/LancamentoItem';
import { MonthSelector } from '../components/MonthSelector';
import { getLancamentos, searchLancamentos, deleteLancamento, getResumoMes } from '../database/database';
import { Lancamento } from '../types';
import { getCurrentMes, getCurrentAno, formatCurrency, formatDate } from '../utils/helpers';

type Filtro = 'todos' | 'despesa' | 'receita';

export default function ExtratoScreen({ navigation }: { navigation: any }) {
  const [mes, setMes] = useState(getCurrentMes());
  const [ano, setAno] = useState(getCurrentAno());
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [query, setQuery] = useState('');
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [resumo, setResumo] = useState({totalReceitas:0,totalDespesas:0,saldo:0,percentualGasto:0});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const tipo = filtro === 'todos' ? undefined : filtro;
    const [lancs, res] = await Promise.all([
      query.length >= 2 ? searchLancamentos(query) : getLancamentos(mes, ano, tipo),
      getResumoMes(mes, ano),
    ]);
    setLancamentos(lancs);
    setResumo(res);
  }, [mes, ano, filtro, query]);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(l: Lancamento) {
    const { Alert } = require('react-native');
    if (l.grupo_id && (l.recorrencia === 'fixo' || l.recorrencia === 'parcelado')) {
      Alert.alert('Excluir', 'Deseja excluir apenas este ou todos?', [
        { text: 'Só este', onPress: async () => { await deleteLancamento(l.id); await load(); } },
        { text: 'Todos', style: 'destructive', onPress: async () => { await deleteLancamento(l.id, true, l.grupo_id); await load(); } },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Excluir?', l.descricao, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteLancamento(l.id); await load(); } },
      ]);
    }
  }

  // Agrupar por data
  const grouped: {[key:string]: Lancamento[]} = {};
  lancamentos.forEach(l => {
    if (!grouped[l.data]) grouped[l.data] = [];
    grouped[l.data].push(l);
  });
  const sections = Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).map(data=>({
    title: formatDate(data),
    data: grouped[data],
  }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Extrato</Text>
        <MonthSelector mes={mes} ano={ano} onChange={(m,a)=>{setMes(m);setAno(a);}} light/>
        {/* Resumo rápido */}
        <View style={s.resumoRow}>
          <View style={s.resumoItem}>
            <Ionicons name="arrow-up-circle" size={16} color="#90EE90"/>
            <Text style={s.resumoLabel}>Receitas</Text>
            <Text style={s.resumoValue}>{formatCurrency(resumo.totalReceitas)}</Text>
          </View>
          <View style={s.resumoItem}>
            <Ionicons name="arrow-down-circle" size={16} color="#FFB3B3"/>
            <Text style={s.resumoLabel}>Despesas</Text>
            <Text style={s.resumoValue}>{formatCurrency(resumo.totalDespesas)}</Text>
          </View>
          <View style={s.resumoItem}>
            <Ionicons name="wallet-outline" size={16} color={Colors.white}/>
            <Text style={s.resumoLabel}>Saldo</Text>
            <Text style={[s.resumoValue,{color:resumo.saldo>=0?'#90EE90':'#FFB3B3'}]}>{formatCurrency(resumo.saldo)}</Text>
          </View>
        </View>
      </View>

      <View style={s.body}>
        {/* Busca */}
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted}/>
          <TextInput style={s.searchInput} placeholder="Buscar..." placeholderTextColor={Colors.textLight} value={query} onChangeText={setQuery}/>
          {query.length>0 && <TouchableOpacity onPress={()=>setQuery('')}><Ionicons name="close-circle" size={18} color={Colors.textMuted}/></TouchableOpacity>}
        </View>

        {/* Filtros */}
        <View style={s.filtros}>
          {(['todos','receita','despesa'] as Filtro[]).map(f=>(
            <TouchableOpacity key={f} style={[s.filtroBtn, filtro===f && s.filtroBtnA, f==='receita'&&filtro===f&&{backgroundColor:Colors.receita}, f==='despesa'&&filtro===f&&{backgroundColor:Colors.despesa}]} onPress={()=>setFiltro(f)}>
              <Text style={[s.filtroText, filtro===f&&{color:Colors.white,fontWeight:'700'}]}>
                {f==='todos'?'Todos':f==='receita'?'Receitas':'Despesas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionList
          sections={sections}
          keyExtractor={item=>String(item.id)}
          contentContainerStyle={{paddingHorizontal:Spacing.md,paddingBottom:100}}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await load();setRefreshing(false);}} tintColor={Colors.primary}/>}
          renderSectionHeader={({section})=>(
            <View style={s.dateHeader}>
              <Text style={s.dateText}>{section.title}</Text>
            </View>
          )}
          renderItem={({item})=>(
            <LancamentoItem lancamento={item}
              onEdit={l=>navigation.navigate('NovoLancamento',{lancamento:l})}
              onDelete={handleDelete} onRefresh={load}/>
          )}
          ListEmptyComponent={<View style={s.empty}><Text style={{fontSize:40}}>🔍</Text><Text style={s.emptyText}>Nenhum lançamento encontrado</Text></View>}
        />
      </View>

      <View style={s.fabs}>
        <TouchableOpacity style={[s.fab,{backgroundColor:Colors.despesa}]} onPress={()=>navigation.navigate('NovoLancamento',{tipo:'despesa'})}>
          <Ionicons name="remove" size={20} color={Colors.white}/>
        </TouchableOpacity>
        <TouchableOpacity style={[s.fab,{backgroundColor:Colors.receita}]} onPress={()=>navigation.navigate('NovoLancamento',{tipo:'receita'})}>
          <Ionicons name="add" size={20} color={Colors.white}/>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {flex:1,backgroundColor:Colors.primaryDark},
  header: {backgroundColor:Colors.primaryDark,paddingBottom:Spacing.md,paddingHorizontal:Spacing.md},
  title: {color:Colors.white,fontSize:FontSize.xl,fontWeight:'700',paddingTop:Spacing.sm,marginBottom:Spacing.sm},
  resumoRow: {flexDirection:'row',justifyContent:'space-between',marginTop:Spacing.sm},
  resumoItem: {alignItems:'center',gap:4},
  resumoLabel: {color:'rgba(255,255,255,0.6)',fontSize:FontSize.xs},
  resumoValue: {color:Colors.white,fontSize:FontSize.sm,fontWeight:'700'},
  body: {flex:1,backgroundColor:Colors.background},
  searchWrap: {flexDirection:'row',alignItems:'center',gap:Spacing.sm,backgroundColor:Colors.white,borderRadius:Radius.md,margin:Spacing.md,paddingHorizontal:Spacing.md,height:44,elevation:2},
  searchInput: {flex:1,fontSize:FontSize.md,color:Colors.text},
  filtros: {flexDirection:'row',gap:Spacing.sm,paddingHorizontal:Spacing.md,marginBottom:Spacing.sm},
  filtroBtn: {flex:1,paddingVertical:8,borderRadius:Radius.full,backgroundColor:Colors.white,alignItems:'center',borderWidth:1,borderColor:Colors.border},
  filtroBtnA: {backgroundColor:Colors.primary,borderColor:Colors.primary},
  filtroText: {fontSize:FontSize.sm,color:Colors.textMuted},
  dateHeader: {backgroundColor:Colors.background,paddingVertical:6,marginTop:Spacing.sm},
  dateText: {fontSize:FontSize.xs,fontWeight:'700',color:Colors.textMuted,textTransform:'uppercase',letterSpacing:0.5},
  empty: {alignItems:'center',paddingVertical:Spacing.xl,gap:Spacing.sm},
  emptyText: {fontSize:FontSize.md,color:Colors.textMuted},
  fabs: {position:'absolute',bottom:24,right:Spacing.md,gap:Spacing.sm},
  fab: {width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',elevation:6},
});
