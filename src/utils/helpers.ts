export const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDate = (s: string) => {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const getCurrentMes = () => new Date().getMonth() + 1;
export const getCurrentAno = () => new Date().getFullYear();

export const getMesLabel = (m: number) =>
  ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m-1] ?? '';

export const getMesAbrev = (m: number) =>
  ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m-1] ?? '';

export const getPreviousMes = (m: number, a: number) =>
  m === 1 ? { mes: 12, ano: a-1 } : { mes: m-1, ano: a };

export const getNextMes = (m: number, a: number) =>
  m === 12 ? { mes: 1, ano: a+1 } : { mes: m+1, ano: a };

export const parseValor = (t: string): number => {
  const n = parseFloat(t.replace(/[^\d,\.]/g,'').replace(',','.'));
  return isNaN(n) ? 0 : n;
};

export const addMeses = (dataISO: string, meses: number): string => {
  const [y, m, d] = dataISO.split('-').map(Number);
  const date = new Date(y, m - 1 + meses, d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

export const gerarGrupoId = () => Math.random().toString(36).substring(2, 10);

export const ICONS_DESPESA = ['🍔','🍕','☕','🛒','🏪','🚌','🚗','⛽','✈️','🚕','🎮','🎬','🎵','⚽','🎭','💊','🏥','💇','🏋️','🏠','💡','💧','📱','📚','🎓','👗','👟','💄','📦','💼','🔧','🎁'];
export const ICONS_RECEITA = ['💰','💵','💳','🏦','📈','🎯','🏆','💻','📊','🤝','🎪','🏗️','📬','💎','🌟'];
