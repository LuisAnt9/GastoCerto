import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../utils/theme';
import { getCategorias, createLancamento, updateLancamento } from '../database/database';
import { Categoria, Lancamento, TipoLancamento } from '../types';
import { todayISO, parseValor } from '../utils/helpers';

type Recorrencia = 'normal' | 'fixo' | 'parcelado';

export default function NovoLancamentoScreen({ navigation }: { navigation: any }) {
  const params = navigation?.params ?? {};
  const lancamentoEdit: Lancamento | undefined = params.lancamento;
  const tipoInicial: TipoLancamento = params.tipo ?? lancamentoEdit?.tipo ?? 'despesa';
  const isEdit = !!lancamentoEdit;

  const [tipo, setTipo] = useState<TipoLancamento>(tipoInicial);
  const [descricao, setDescricao] = useState(lancamentoEdit?.descricao ?? '');
  const [valor, setValor] = useState(lancamentoEdit?.valor?.toFixed(2).replace('.', ',') ?? '');
  const [data, setData] = useState(lancamentoEdit?.data ?? todayISO());
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catSel, setCatSel] = useState<number | null>(lancamentoEdit?.categoria_id ?? null);
  const [recorrencia, setRecorrencia] = useState<Recorrencia>(lancamentoEdit?.recorrencia as Recorrencia ?? 'normal');
  const [parcelas, setParcelas] = useState(String(lancamentoEdit?.total_parcelas ?? '2'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategorias(tipo).then(cats => {
      setCategorias(cats);
      if (!isEdit && cats.length > 0) setCatSel(cats[0].id);
    });
  }, [tipo]);

  async function handleSalvar() {
    if (!descricao.trim()) { Alert.alert('Campo obrigatório', 'Informe uma descrição.'); return; }
    const v = parseValor(valor);
    if (v <= 0) { Alert.alert('Valor inválido', 'Informe um valor maior que zero.'); return; }
    if (!catSel) { Alert.alert('Categoria obrigatória', 'Selecione uma categoria.'); return; }
    if (recorrencia === 'parcelado' && parseInt(parcelas) < 2) { Alert.alert('Parcelas inválidas', 'Informe pelo menos 2 parcelas.'); return; }

    setLoading(true);
    try {
      if (isEdit) {
        await updateLancamento(lancamentoEdit!.id, descricao.trim(), v, data, catSel);
      } else {
        const totalParcelas = recorrencia === 'parcelado' ? parseInt(parcelas) : undefined;
        await createLancamento(descricao.trim(), v, data, tipo, catSel, recorrencia, totalParcelas);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  }

  const isDespesa = tipo === 'despesa';
  const headerColor = isDespesa ? Colors.despesa : Colors.receita;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: headerColor }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{isEdit ? 'Editar' : 'Novo lançamento'}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* TIPO SELECTOR — só para novo */}
        {!isEdit && (
          <View style={s.tipoRow}>
            <TouchableOpacity style={[s.tipoBtn, isDespesa && s.tipoBtnA]} onPress={() => setTipo('despesa')}>
              <Ionicons name="arrow-down-circle" size={16} color={isDespesa ? Colors.white : 'rgba(255,255,255,0.6)'} />
              <Text style={[s.tipoText, isDespesa && { color: Colors.white }]}>Despesa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tipoBtn, !isDespesa && s.tipoBtnA]} onPress={() => setTipo('receita')}>
              <Ionicons name="arrow-up-circle" size={16} color={!isDespesa ? Colors.white : 'rgba(255,255,255,0.6)'} />
              <Text style={[s.tipoText, !isDespesa && { color: Colors.white }]}>Receita</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* VALOR */}
        <View style={s.valorWrap}>
          <Text style={s.rs}>R$</Text>
          <TextInput style={s.valorInput} placeholder="0,00" placeholderTextColor="rgba(255,255,255,0.5)"
            value={valor} onChangeText={setValor} keyboardType="decimal-pad" autoFocus={!isEdit} />
        </View>

        <ScrollView style={s.form} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Descrição */}
          <View style={s.field}>
            <Text style={s.label}>Descrição</Text>
            <TextInput style={s.input} placeholder="Ex: Supermercado, Salário..." placeholderTextColor={Colors.textLight}
              value={descricao} onChangeText={setDescricao} maxLength={60} />
          </View>

          {/* Data */}
          <View style={s.field}>
            <Text style={s.label}>Data</Text>
            <TextInput style={s.input} value={data} onChangeText={setData} placeholder="AAAA-MM-DD"
              placeholderTextColor={Colors.textLight} keyboardType="numbers-and-punctuation" maxLength={10} />
          </View>

          {/* Recorrência — só para novo */}
          {!isEdit && (
            <View style={s.field}>
              <Text style={s.label}>Recorrência</Text>
              <View style={s.recRow}>
                {(['normal','fixo','parcelado'] as Recorrencia[]).map(r => (
                  <TouchableOpacity key={r} style={[s.recBtn, recorrencia===r && { backgroundColor: headerColor, borderColor: headerColor }]} onPress={() => setRecorrencia(r)}>
                    <Text style={[s.recText, recorrencia===r && { color: Colors.white, fontWeight: '700' }]}>
                      {r==='normal'?'Normal':r==='fixo'?'🔄 Fixo':'📋 Parcelado'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {recorrencia === 'parcelado' && (
                <View style={s.parcelaRow}>
                  <Text style={s.parcelaLabel}>Número de parcelas:</Text>
                  <TextInput style={s.parcelaInput} value={parcelas} onChangeText={setParcelas}
                    keyboardType="number-pad" maxLength={2} />
                </View>
              )}
              {recorrencia === 'fixo' && (
                <Text style={s.recInfo}>💡 Será lançada automaticamente nos próximos 24 meses</Text>
              )}
            </View>
          )}

          {/* Categoria */}
          <View style={s.field}>
            <Text style={s.label}>Categoria</Text>
            <View style={s.catGrid}>
              {categorias.map(cat => (
                <TouchableOpacity key={cat.id} style={[s.catPill, catSel===cat.id && { borderColor: cat.cor, backgroundColor: cat.cor + '15' }]} onPress={() => setCatSel(cat.id)}>
                  <Text style={{ fontSize: 24 }}>{cat.icone}</Text>
                  <Text style={[s.catNome, catSel===cat.id && { color: cat.cor, fontWeight: '700' }]} numberOfLines={1}>{cat.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[s.btnSalvar, { backgroundColor: headerColor }, loading && { opacity: 0.7 }]} onPress={handleSalvar} disabled={loading}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={s.btnSalvarText}>{loading ? 'Salvando...' : (isEdit ? 'Salvar alterações' : 'Salvar')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnCancelar} onPress={() => navigation.goBack()}>
            <Text style={[s.btnCancelarText, { color: headerColor }]}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.md, paddingVertical:Spacing.sm },
  closeBtn: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' },
  headerTitle: { color:Colors.white, fontSize:FontSize.lg, fontWeight:'700' },
  tipoRow: { flexDirection:'row', marginHorizontal:Spacing.md, gap:Spacing.sm, marginBottom:Spacing.sm },
  tipoBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10, borderRadius:Radius.full, backgroundColor:'rgba(255,255,255,0.15)' },
  tipoBtnA: { backgroundColor:'rgba(255,255,255,0.3)' },
  tipoText: { fontSize:FontSize.sm, fontWeight:'600', color:'rgba(255,255,255,0.7)' },
  valorWrap: { flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:Spacing.lg, gap:Spacing.sm },
  rs: { color:'rgba(255,255,255,0.7)', fontSize:FontSize.xl, fontWeight:'600' },
  valorInput: { fontSize:48, fontWeight:'700', color:Colors.white, borderBottomWidth:2, borderBottomColor:'rgba(255,255,255,0.4)', minWidth:130, textAlign:'center', paddingBottom:4 },
  form: { flex:1, backgroundColor:Colors.background, borderTopLeftRadius:Radius.xl, borderTopRightRadius:Radius.xl },
  field: { gap:8 },
  label: { fontSize:FontSize.sm, fontWeight:'700', color:Colors.textMuted, textTransform:'uppercase', letterSpacing:0.6 },
  input: { backgroundColor:Colors.white, borderRadius:Radius.md, padding:Spacing.md, fontSize:FontSize.md, color:Colors.text, borderWidth:1, borderColor:Colors.border },
  recRow: { flexDirection:'row', gap:Spacing.sm },
  recBtn: { flex:1, paddingVertical:10, borderRadius:Radius.md, borderWidth:1.5, borderColor:Colors.border, alignItems:'center' },
  recText: { fontSize:FontSize.xs, color:Colors.textMuted, textAlign:'center' },
  parcelaRow: { flexDirection:'row', alignItems:'center', gap:Spacing.md, backgroundColor:Colors.white, borderRadius:Radius.md, padding:Spacing.md, borderWidth:1, borderColor:Colors.border },
  parcelaLabel: { flex:1, fontSize:FontSize.md, color:Colors.text },
  parcelaInput: { width:60, textAlign:'center', fontSize:FontSize.xl, fontWeight:'700', color:Colors.primary, borderBottomWidth:2, borderBottomColor:Colors.primary },
  recInfo: { fontSize:FontSize.sm, color:Colors.amber, backgroundColor:Colors.amberLight, borderRadius:Radius.sm, padding:Spacing.sm },
  catGrid: { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm },
  catPill: { alignItems:'center', width:'22%', paddingVertical:Spacing.sm, borderRadius:Radius.md, borderWidth:1.5, borderColor:Colors.border, backgroundColor:Colors.white, gap:4 },
  catNome: { fontSize:9, color:Colors.textMuted, textAlign:'center' },
  btnSalvar: { borderRadius:Radius.md, padding:Spacing.md, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:Spacing.sm },
  btnSalvarText: { color:Colors.white, fontWeight:'700', fontSize:FontSize.md },
  btnCancelar: { borderRadius:Radius.md, padding:Spacing.md, alignItems:'center', borderWidth:1.5, borderColor:Colors.border },
  btnCancelarText: { fontWeight:'600', fontSize:FontSize.md },
});
