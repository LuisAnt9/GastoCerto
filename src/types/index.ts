export type TipoLancamento = 'despesa' | 'receita';
export type TipoRecorrencia = 'normal' | 'fixo' | 'parcelado';

export interface Categoria {
  id: number;
  nome: string;
  icone: string;
  cor: string;
  tipo: TipoLancamento;
}

export interface Lancamento {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: TipoLancamento;
  categoria_id: number;
  categoria_nome?: string;
  categoria_icone?: string;
  categoria_cor?: string;
  recorrencia: TipoRecorrencia;
  parcela_atual?: number;
  total_parcelas?: number;
  grupo_id?: string;
  pago: number; // 0 ou 1
}

export interface Orcamento {
  id: number;
  valor_mensal: number;
  mes: number;
  ano: number;
}

export interface ResumoMes {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  percentualGasto: number;
}

export interface GastoPorCategoria {
  categoria_id: number;
  categoria_nome: string;
  categoria_icone: string;
  categoria_cor: string;
  total: number;
  percentual: number;
}
