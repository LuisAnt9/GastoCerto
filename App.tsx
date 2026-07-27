import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from './src/database/database';
import { Colors, FontSize, Spacing } from './src/utils/theme';

import DashboardScreen from './src/screens/DashboardScreen';
import ExtratoScreen from './src/screens/ExtratoScreen';
import GraficosScreen from './src/screens/GraficosScreen';
import ConfiguracoesScreen from './src/screens/ConfiguracoesScreen';
import NovoLancamentoScreen from './src/screens/NovoLancamentoScreen';
import GerenciarCategoriasScreen from './src/screens/GerenciarCategoriasScreen';

type Tab = 'home' | 'extrato' | 'graficos' | 'config';
type Modal = 'novoLancamento' | 'gerenciarCategorias' | null;

const navigate = (setModal: any, setModalParams: any, setTab: any) => (screen: string, params?: any) => {
  if (screen === 'NovoLancamento') { setModalParams(params); setModal('novoLancamento'); }
  else if (screen === 'GerenciarCategorias') { setModalParams(params); setModal('gerenciarCategorias'); }
  else if (screen === 'Extrato') setTab('extrato');
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [modal, setModal] = useState<Modal>(null);
  const [modalParams, setModalParams] = useState<any>(null);

  useEffect(() => {
    initDatabase().then(() => setReady(true)).catch(e => setError(String(e)));
  }, []);

  if (error) return <View style={s.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  if (!ready) return (
    <View style={[s.center, { backgroundColor: Colors.primaryDark }]}>
      <Text style={{ fontSize: 36, marginBottom: 16 }}>💰</Text>
      <Text style={{ color: Colors.white, fontSize: 26, fontWeight: '700' }}>GastoCerto</Text>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>Finanças sob controle</Text>
      <ActivityIndicator color={Colors.white} style={{ marginTop: 32 }} size="large" />
    </View>
  );

  const nav = {
    navigate: navigate(setModal, setModalParams, setTab),
    goBack: () => setModal(null),
    params: modalParams,
  };

  const tabs: { key: Tab; label: string; icon: string; activeIcon: string }[] = [
    { key:'home',    label:'Início',   icon:'home-outline',       activeIcon:'home' },
    { key:'extrato', label:'Extrato',  icon:'list-outline',       activeIcon:'list' },
    { key:'graficos',label:'Gráficos', icon:'pie-chart-outline',  activeIcon:'pie-chart' },
    { key:'config',  label:'Ajustes',  icon:'settings-outline',   activeIcon:'settings' },
  ];

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {tab === 'home'     && <DashboardScreen     navigation={nav} />}
          {tab === 'extrato'  && <ExtratoScreen       navigation={nav} />}
          {tab === 'graficos' && <GraficosScreen      navigation={nav} />}
          {tab === 'config'   && <ConfiguracoesScreen navigation={nav} />}
        </View>

        <SafeAreaView edges={['bottom']} style={s.tabBar}>
          {tabs.map(t => {
            const active = tab === t.key;
            return (
              <TouchableOpacity key={t.key} style={s.tabItem} onPress={() => setTab(t.key)}>
                {active && <View style={s.tabIndicator} />}
                <Ionicons name={(active ? t.activeIcon : t.icon) as any} size={23} color={active ? Colors.primary : Colors.textLight} />
                <Text style={[s.tabLabel, active && { color: Colors.primary, fontWeight: '700' }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </SafeAreaView>
      </View>

      {modal === 'novoLancamento' && (
        <View style={StyleSheet.absoluteFill}>
          <NovoLancamentoScreen navigation={nav} />
        </View>
      )}
      {modal === 'gerenciarCategorias' && (
        <View style={StyleSheet.absoluteFill}>
          <GerenciarCategoriasScreen navigation={nav} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { backgroundColor: Colors.white, borderTopWidth: 0.5, borderTopColor: Colors.border, flexDirection: 'row' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, position: 'relative' },
  tabIndicator: { position:'absolute', top:0, width:24, height:3, backgroundColor:Colors.primary, borderRadius:2 },
  tabLabel: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 3 },
});
