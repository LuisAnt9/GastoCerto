import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../utils/theme';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../database/database';
import { Categoria, TipoLancamento } from '../types';
import { ICONS_DESPESA, ICONS_RECEITA } from '../utils/helpers';

const CORES = ['#FF6B35','#2196F3','#9C27B0','#4CAF50','#00BCD4','#FF9800','#E91E63','#607D8B','#F44336','#3F51B5','#009688','#795548','#1A7A3C','#FF8F00'];

type View = 'lista' | 'form';

export default function GerenciarCategoriasScreen({ navigation }: { navigation: any }) {
  const [view, setView] = useState<View>('lista');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<TipoLancamento>('despesa');
  const [editando, setEditando] = useState<Categoria|null>(null);
  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState('📦');
  const [cor, setCor] = useState('#FF6B35');
  const [tipo, setTipo] = useState<TipoLancamento>('despesa');

  const load = async () => setCategorias(await getCategorias());
  useEffect(() => { load(); }, []);

  const cats = categorias.filter(c => c.tipo === abaAtiva);
  const icons = abaAtiva === 'despesa' ? ICONS_DESPESA : ICONS_RECEITA;

  function abrirNova() {
    setEditando(null);
    setNome('');
    setIcone(abaAtiva === 'despesa' ? '📦' : '💰');
    setCor(abaAtiva === 'despesa' ? '#FF6B35' : '#1A7A3C');
    setTipo(abaAtiva);
    setView('form');
  }

  function abrirEditar(cat: Categoria) {
    setEditando(cat);
    setNome(cat.nome);
    setIcone(cat.icone);
    setCor(cat.cor);
    setTipo(cat.tipo as TipoLancamento);
    setView('form');
  }

  async function handleSalvar() {
    if (!nome.trim()) { Alert.alert('Nome obrigatório'); return; }
    try {
      if (editando) {
        await updateCategoria(editando.id, nome.trim(), icone, cor);
      } else {
        await createCategoria(nome.trim(), icone, cor, tipo);
      }
      await load();
      setView('lista');
    } catch (e) {
      Alert.alert('Erro ao salvar', String(e));
    }
  }

  async function handleExcluir(cat: Categoria) {
    Alert.alert('Excluir', `Excluir "${cat.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteCategoria(cat.id); await load(); } },
    ]);
  }

  // ── FORMULÁRIO ────────────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <SafeAreaView style={s.safe} edges={['top','bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('lista')} style={s.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{editando ? 'Editar categoria' : 'Nova categoria'}</Text>
          <View style={{ width: 36 }}/>
        </View>

        <ScrollView style={{ flex:1, backgroundColor: Colors.background }}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">

          {/* Preview */}
          <View style={{ alignItems:'center', paddingVertical: Spacing.md, gap: Spacing.sm }}>
            <View style={[s.preview, { backgroundColor: cor+'20' }]}>
              <Text style={{ fontSize: 36 }}>{icone}</Text>
            </View>
            <Text style={{ fontSize: FontSize.xl, fontWeight:'700', color: cor }}>
              {nome || 'Nova categoria'}
            </Text>
          </View>

          {/* Nome */}
          <View style={{ gap: 6 }}>
            <Text style={s.label}>Nome</Text>
            <TextInput
              style={s.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome da categoria"
              placeholderTextColor={Colors.textLight}
              maxLength={30}
              autoFocus
            />
          </View>

          {/* Ícone */}
          <View style={{ gap: 8 }}>
            <Text style={s.label}>Ícone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection:'row', gap: 8 }}>
                {icons.map((ic, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.iconePill, icone===ic && { borderColor: cor, backgroundColor: cor+'15' }]}
                    onPress={() => setIcone(ic)}>
                    <Text style={{ fontSize: 24 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Cor */}
          <View style={{ gap: 8 }}>
            <Text style={s.label}>Cor</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap: 10 }}>
              {CORES.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[{ width:38, height:38, borderRadius:19, backgroundColor:c },
                    cor===c && { borderWidth:3, borderColor: Colors.text }]}
                  onPress={() => setCor(c)}/>
              ))}
            </View>
          </View>

          {/* Botão salvar */}
          <TouchableOpacity style={[s.btnSalvar, { backgroundColor: cor }]} onPress={handleSalvar}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.white}/>
            <Text style={{ color: Colors.white, fontWeight:'700', fontSize: FontSize.md }}>
              {editando ? 'Salvar alterações' : 'Criar categoria'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnCancelar} onPress={() => setView('lista')}>
            <Text style={{ color: Colors.textMuted, fontWeight:'600', fontSize: FontSize.md }}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LISTA ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top','bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Categorias</Text>
        <TouchableOpacity onPress={abrirNova} style={s.iconBtn}>
          <Ionicons name="add" size={24} color={Colors.white}/>
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, abaAtiva==='despesa' && s.tabA]} onPress={() => setAbaAtiva('despesa')}>
          <Text style={[s.tabText, abaAtiva==='despesa' && { color: Colors.despesa, fontWeight:'700' }]}>Despesas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, abaAtiva==='receita' && s.tabAR]} onPress={() => setAbaAtiva('receita')}>
          <Text style={[s.tabText, abaAtiva==='receita' && { color: Colors.receita, fontWeight:'700' }]}>Receitas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cats}
        keyExtractor={c => String(c.id)}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={[s.catIcon, { backgroundColor: item.cor+'20' }]}>
              <Text style={{ fontSize: 22 }}>{item.icone}</Text>
            </View>
            <Text style={s.catNome}>{item.nome}</Text>
            <TouchableOpacity onPress={() => abrirEditar(item)} style={{ padding: Spacing.xs }}>
              <Ionicons name="pencil-outline" size={18} color={Colors.textMuted}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleExcluir(item)} style={{ padding: Spacing.xs }}>
              <Ionicons name="trash-outline" size={18} color={Colors.despesa}/>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 36 }}>🏷️</Text>
            <Text style={s.emptyText}>Nenhuma categoria.</Text>
            <Text style={s.emptyText}>Toque em + para criar.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor: Colors.primaryDark },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  iconBtn: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  headerTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight:'700' },
  tabs: { flexDirection:'row', backgroundColor: Colors.white, borderBottomWidth:1, borderBottomColor: Colors.border },
  tab: { flex:1, paddingVertical:14, alignItems:'center', borderBottomWidth:2, borderBottomColor:'transparent' },
  tabA: { borderBottomColor: Colors.despesa },
  tabAR: { borderBottomColor: Colors.receita },
  tabText: { fontSize: FontSize.md, color: Colors.textMuted },
  list: { backgroundColor: Colors.background, flexGrow:1, padding: Spacing.md, gap: Spacing.sm },
  row: { flexDirection:'row', alignItems:'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.sm, paddingHorizontal: Spacing.md, elevation:1 },
  catIcon: { width:44, height:44, borderRadius: Radius.sm, alignItems:'center', justifyContent:'center' },
  catNome: { flex:1, fontSize: FontSize.md, fontWeight:'600', color: Colors.text },
  empty: { alignItems:'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign:'center' },
  preview: { width:76, height:76, borderRadius:22, alignItems:'center', justifyContent:'center' },
  label: { fontSize: FontSize.xs, fontWeight:'700', color: Colors.textMuted, textTransform:'uppercase', letterSpacing:0.6 },
  input: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.text, borderWidth:1, borderColor: Colors.border },
  iconePill: { width:50, height:50, borderRadius: Radius.sm, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  btnSalvar: { borderRadius: Radius.md, padding: Spacing.md, flexDirection:'row', alignItems:'center', justifyContent:'center', gap: Spacing.sm },
  btnCancelar: { borderRadius: Radius.md, padding: Spacing.md, alignItems:'center', borderWidth:1, borderColor: Colors.border },
});
