import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../utils/theme';
import { Card } from '../components/Card';
import { getOrcamento, upsertOrcamento } from '../database/database';
import { getCurrentMes, getCurrentAno, formatCurrency, parseValor } from '../utils/helpers';

export default function ConfiguracoesScreen({ navigation }: { navigation: any }) {
  const [valorInput, setValorInput] = useState('');
  const [orcamentoAtual, setOrcamentoAtual] = useState(0);
  const mes = getCurrentMes(), ano = getCurrentAno();

  React.useEffect(() => {
    getOrcamento(mes, ano).then(orc => {
      if (orc) { setOrcamentoAtual(orc.valor_mensal); setValorInput(orc.valor_mensal.toFixed(2).replace('.', ',')); }
    });
  }, []);

  async function handleSalvar() {
    const valor = parseValor(valorInput);
    if (valor <= 0) { Alert.alert('Valor inválido', 'Informe um valor maior que zero.'); return; }
    await upsertOrcamento(valor, mes, ano);
    setOrcamentoAtual(valor);
    Alert.alert('✅ Salvo!', `Orçamento de ${formatCurrency(valor)} definido.`);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}><Text style={s.title}>Configurações</Text></View>
      <ScrollView style={{ flex:1, backgroundColor:Colors.background }} contentContainerStyle={{ padding:Spacing.md, gap:Spacing.md, paddingBottom:40 }}>

        <View style={s.profileCard}>
          <View style={s.avatar}><Text style={{fontSize:28}}>💰</Text></View>
          <View>
            <Text style={s.profileName}>Luis Antonio Santos Moura</Text>
            <Text style={s.profileSub}>GastoCerto · Finanças Pessoais</Text>
          </View>
        </View>

        <Card style={s.card}>
          <Text style={s.cardTitle}>Orçamento mensal de gastos</Text>
          <Text style={s.cardSub}>Defina quanto planeja gastar este mês</Text>
          {orcamentoAtual > 0 && (
            <View style={s.orcAtual}>
              <Text style={{fontSize:FontSize.sm,color:Colors.primary}}>Atual: {formatCurrency(orcamentoAtual)}</Text>
            </View>
          )}
          <View style={s.inputRow}>
            <Text style={s.rs}>R$</Text>
            <TextInput style={s.input} placeholder="0,00" placeholderTextColor={Colors.textLight} value={valorInput} onChangeText={setValorInput} keyboardType="decimal-pad"/>
          </View>
          <TouchableOpacity style={s.btn} onPress={handleSalvar}>
            <Text style={s.btnText}>Salvar orçamento</Text>
          </TouchableOpacity>
        </Card>

        <Card style={s.card}>
          <Text style={s.cardTitle}>Dados</Text>
          <TouchableOpacity style={s.menuItem} onPress={()=>navigation.navigate('GerenciarCategorias')}>
            <View style={[s.menuIcon,{backgroundColor:Colors.primaryLight}]}><Text style={{fontSize:18}}>🏷️</Text></View>
            <View style={{flex:1}}>
              <Text style={s.menuLabel}>Categorias</Text>
              <Text style={s.menuSub}>Gerenciar categorias de despesas e receitas</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted}/>
          </TouchableOpacity>
        </Card>

        <Card style={s.card}>
          <Text style={s.cardTitle}>Sobre</Text>
          <Text style={s.sobreText}>GastoCerto v2.0{'\n'}Controle financeiro pessoal{'\n'}Desenvolvido por Luis Antonio Santos Moura</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {flex:1,backgroundColor:Colors.primaryDark},
  header: {backgroundColor:Colors.primaryDark,paddingHorizontal:Spacing.md,paddingBottom:Spacing.md},
  title: {color:Colors.white,fontSize:FontSize.xl,fontWeight:'700',paddingTop:Spacing.sm},
  profileCard: {flexDirection:'row',alignItems:'center',gap:Spacing.md,backgroundColor:Colors.white,borderRadius:Radius.md,padding:Spacing.md,elevation:3},
  avatar: {width:56,height:56,borderRadius:28,backgroundColor:Colors.primaryLight,alignItems:'center',justifyContent:'center'},
  profileName: {fontSize:FontSize.md,fontWeight:'700',color:Colors.text},
  profileSub: {fontSize:FontSize.sm,color:Colors.textMuted,marginTop:2},
  card: {padding:Spacing.md,gap:Spacing.sm},
  cardTitle: {fontSize:FontSize.md,fontWeight:'700',color:Colors.text},
  cardSub: {fontSize:FontSize.sm,color:Colors.textMuted},
  orcAtual: {backgroundColor:Colors.primaryLight,borderRadius:Radius.sm,padding:Spacing.sm},
  inputRow: {flexDirection:'row',alignItems:'center',gap:Spacing.sm},
  rs: {fontSize:FontSize.xl,fontWeight:'700',color:Colors.text},
  input: {flex:1,fontSize:FontSize.xxl,fontWeight:'700',color:Colors.primary,borderBottomWidth:2,borderBottomColor:Colors.primary,paddingVertical:Spacing.xs},
  btn: {backgroundColor:Colors.primary,borderRadius:Radius.md,padding:Spacing.md,alignItems:'center'},
  btnText: {color:Colors.white,fontWeight:'700',fontSize:FontSize.md},
  menuItem: {flexDirection:'row',alignItems:'center',gap:Spacing.md,paddingVertical:Spacing.sm},
  menuIcon: {width:42,height:42,borderRadius:Radius.sm,alignItems:'center',justifyContent:'center'},
  menuLabel: {fontSize:FontSize.md,fontWeight:'600',color:Colors.text},
  menuSub: {fontSize:FontSize.sm,color:Colors.textMuted,marginTop:2},
  sobreText: {fontSize:FontSize.sm,color:Colors.textMuted,lineHeight:22},
});
