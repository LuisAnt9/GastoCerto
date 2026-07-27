import * as SQLite from 'expo-sqlite';
import { Categoria, Lancamento, Orcamento, GastoPorCategoria, TipoLancamento } from '../types';
import { addMeses, gerarGrupoId } from '../utils/helpers';

let db: SQLite.SQLiteDatabase | null = null;

const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) db = await SQLite.openDatabaseAsync('gastocerto.db');
  return db;
};

export async function initDatabase(): Promise<void> {
  const d = await getDB();

  await d.execAsync(`PRAGMA journal_mode=WAL;`);

  // Cria tabelas se não existirem
  await d.execAsync(`
    CREATE TABLE IF NOT EXISTS categorias(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      icone TEXT NOT NULL DEFAULT '📦',
      cor TEXT NOT NULL DEFAULT '#607D8B'
    );
    CREATE TABLE IF NOT EXISTS lancamentos(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      data TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'despesa',
      categoria_id INTEGER NOT NULL,
      recorrencia TEXT NOT NULL DEFAULT 'normal',
      parcela_atual INTEGER,
      total_parcelas INTEGER,
      grupo_id TEXT,
      pago INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS orcamentos(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      valor_mensal REAL NOT NULL DEFAULT 0,
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      UNIQUE(mes, ano)
    );
  `);

  // Migração: adiciona coluna tipo em categorias se não existir
  try {
    await d.execAsync(`ALTER TABLE categorias ADD COLUMN tipo TEXT NOT NULL DEFAULT 'despesa';`);
  } catch (_) {
    // Coluna já existe, ignora o erro
  }

  // Migração: adiciona coluna tipo em lancamentos se não existir
  try {
    await d.execAsync(`ALTER TABLE lancamentos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'despesa';`);
  } catch (_) {}

  // Migração: adiciona coluna recorrencia em lancamentos se não existir
  try {
    await d.execAsync(`ALTER TABLE lancamentos ADD COLUMN recorrencia TEXT NOT NULL DEFAULT 'normal';`);
  } catch (_) {}

  // Migração: adiciona coluna pago em lancamentos se não existir
  try {
    await d.execAsync(`ALTER TABLE lancamentos ADD COLUMN pago INTEGER NOT NULL DEFAULT 0;`);
  } catch (_) {}

  // Migração: adiciona coluna grupo_id em lancamentos se não existir
  try {
    await d.execAsync(`ALTER TABLE lancamentos ADD COLUMN grupo_id TEXT;`);
  } catch (_) {}

  // Migração: adiciona coluna parcela_atual em lancamentos se não existir
  try {
    await d.execAsync(`ALTER TABLE lancamentos ADD COLUMN parcela_atual INTEGER;`);
  } catch (_) {}

  // Migração: adiciona coluna total_parcelas em lancamentos se não existir
  try {
    await d.execAsync(`ALTER TABLE lancamentos ADD COLUMN total_parcelas INTEGER;`);
  } catch (_) {}

  // Categorias padrão — inseridas com ID fixo, ignoradas se já existirem
  const catsDespesa = [
    { id:1,  nome:'Alimentação', icone:'🍔', cor:'#FF6B35' },
    { id:2,  nome:'Transporte',  icone:'🚌', cor:'#2196F3' },
    { id:3,  nome:'Lazer',       icone:'🎮', cor:'#9C27B0' },
    { id:4,  nome:'Saúde',       icone:'💊', cor:'#4CAF50' },
    { id:5,  nome:'Moradia',     icone:'🏠', cor:'#00BCD4' },
    { id:6,  nome:'Educação',    icone:'📚', cor:'#FF9800' },
    { id:7,  nome:'Roupas',      icone:'👗', cor:'#E91E63' },
    { id:8,  nome:'Outros',      icone:'📦', cor:'#607D8B' },
  ];
  const catsReceita = [
    { id:9,  nome:'Salário',       icone:'💰', cor:'#1A7A3C' },
    { id:10, nome:'Freelance',     icone:'💻', cor:'#00897B' },
    { id:11, nome:'Investimentos', icone:'📈', cor:'#1565C0' },
    { id:12, nome:'Outros',        icone:'💵', cor:'#558B2F' },
  ];

  for (const c of catsDespesa) {
    await d.runAsync(
      'INSERT OR IGNORE INTO categorias(id,nome,icone,cor,tipo) VALUES(?,?,?,?,?)',
      [c.id, c.nome, c.icone, c.cor, 'despesa']
    );
    // Garante que o tipo está correto em registros antigos
    await d.runAsync(
      `UPDATE categorias SET tipo='despesa', icone=?, cor=? WHERE id=? AND (tipo IS NULL OR tipo='')`,
      [c.icone, c.cor, c.id]
    );
  }
  for (const c of catsReceita) {
    await d.runAsync(
      'INSERT OR IGNORE INTO categorias(id,nome,icone,cor,tipo) VALUES(?,?,?,?,?)',
      [c.id, c.nome, c.icone, c.cor, 'receita']
    );
    await d.runAsync(
      `UPDATE categorias SET tipo='receita', icone=?, cor=? WHERE id=? AND (tipo IS NULL OR tipo='')`,
      [c.icone, c.cor, c.id]
    );
  }
}

// ─── CATEGORIAS ───────────────────────────────────────────────────────────────

export const getCategorias = async (tipo?: TipoLancamento): Promise<Categoria[]> => {
  const d = await getDB();
  if (tipo) return d.getAllAsync<Categoria>('SELECT * FROM categorias WHERE tipo=? ORDER BY nome', [tipo]);
  return d.getAllAsync<Categoria>('SELECT * FROM categorias ORDER BY tipo, nome');
};

export const createCategoria = async (nome:string, icone:string, cor:string, tipo:TipoLancamento): Promise<number> => {
  const r = await (await getDB()).runAsync(
    'INSERT INTO categorias(nome,icone,cor,tipo) VALUES(?,?,?,?)', [nome, icone, cor, tipo]
  );
  return r.lastInsertRowId;
};

export const updateCategoria = async (id:number, nome:string, icone:string, cor:string): Promise<void> => {
  await (await getDB()).runAsync('UPDATE categorias SET nome=?,icone=?,cor=? WHERE id=?', [nome, icone, cor, id]);
};

export const deleteCategoria = async (id:number): Promise<void> => {
  await (await getDB()).runAsync('DELETE FROM categorias WHERE id=?', [id]);
};

// ─── LANÇAMENTOS ──────────────────────────────────────────────────────────────

export async function getLancamentos(mes?:number, ano?:number, tipo?: TipoLancamento): Promise<Lancamento[]> {
  const d = await getDB();
  let q = `SELECT l.*,c.nome as categoria_nome,c.icone as categoria_icone,c.cor as categoria_cor
    FROM lancamentos l JOIN categorias c ON l.categoria_id=c.id WHERE 1=1`;
  const p: (string|number)[] = [];
  if (mes!==undefined && ano!==undefined) {
    q += ` AND strftime('%m',l.data)=? AND strftime('%Y',l.data)=?`;
    p.push(String(mes).padStart(2,'0'), String(ano));
  }
  if (tipo) { q += ' AND l.tipo=?'; p.push(tipo); }
  return d.getAllAsync<Lancamento>(q + ' ORDER BY l.data DESC,l.id DESC', p);
}

export async function createLancamento(
  descricao: string, valor: number, data: string,
  tipo: TipoLancamento, categoriaId: number,
  recorrencia: 'normal'|'fixo'|'parcelado',
  totalParcelas?: number
): Promise<void> {
  const d = await getDB();
  if (recorrencia === 'normal') {
    await d.runAsync(
      'INSERT INTO lancamentos(descricao,valor,data,tipo,categoria_id,recorrencia,pago) VALUES(?,?,?,?,?,?,0)',
      [descricao, valor, data, tipo, categoriaId, 'normal']
    );
  } else if (recorrencia === 'fixo') {
    const grupoId = gerarGrupoId();
    for (let i = 0; i < 24; i++) {
      await d.runAsync(
        'INSERT INTO lancamentos(descricao,valor,data,tipo,categoria_id,recorrencia,grupo_id,pago) VALUES(?,?,?,?,?,?,?,0)',
        [descricao, valor, addMeses(data, i), tipo, categoriaId, 'fixo', grupoId]
      );
    }
  } else if (recorrencia === 'parcelado' && totalParcelas) {
    const grupoId = gerarGrupoId();
    for (let i = 0; i < totalParcelas; i++) {
      await d.runAsync(
        'INSERT INTO lancamentos(descricao,valor,data,tipo,categoria_id,recorrencia,parcela_atual,total_parcelas,grupo_id,pago) VALUES(?,?,?,?,?,?,?,?,?,0)',
        [descricao, valor, addMeses(data, i), tipo, categoriaId, 'parcelado', i+1, totalParcelas, grupoId]
      );
    }
  }
}

export const updateLancamento = async (id:number, desc:string, val:number, data:string, catId:number): Promise<void> => {
  await (await getDB()).runAsync(
    'UPDATE lancamentos SET descricao=?,valor=?,data=?,categoria_id=? WHERE id=?', [desc, val, data, catId, id]
  );
};

export const deleteLancamento = async (id: number, deletarGrupo: boolean = false, grupoId?: string): Promise<void> => {
  const d = await getDB();
  if (deletarGrupo && grupoId) await d.runAsync('DELETE FROM lancamentos WHERE grupo_id=?', [grupoId]);
  else await d.runAsync('DELETE FROM lancamentos WHERE id=?', [id]);
};

export const togglePago = async (id: number, pago: boolean): Promise<void> => {
  await (await getDB()).runAsync('UPDATE lancamentos SET pago=? WHERE id=?', [pago ? 1 : 0, id]);
};

export const searchLancamentos = async (query: string): Promise<Lancamento[]> =>
  (await getDB()).getAllAsync<Lancamento>(
    `SELECT l.*,c.nome as categoria_nome,c.icone as categoria_icone,c.cor as categoria_cor
     FROM lancamentos l JOIN categorias c ON l.categoria_id=c.id
     WHERE l.descricao LIKE ? ORDER BY l.data DESC`, [`%${query}%`]
  );

// ─── RESUMO ───────────────────────────────────────────────────────────────────

export async function getResumoMes(mes: number, ano: number) {
  const d = await getDB();
  const m = String(mes).padStart(2,'0'), a = String(ano);
  const rec = await d.getFirstAsync<{total:number}>(
    `SELECT COALESCE(SUM(valor),0) as total FROM lancamentos WHERE tipo='receita' AND strftime('%m',data)=? AND strftime('%Y',data)=?`, [m,a]
  );
  const des = await d.getFirstAsync<{total:number}>(
    `SELECT COALESCE(SUM(valor),0) as total FROM lancamentos WHERE tipo='despesa' AND strftime('%m',data)=? AND strftime('%Y',data)=?`, [m,a]
  );
  const totalReceitas = rec?.total ?? 0;
  const totalDespesas = des?.total ?? 0;
  return {
    totalReceitas, totalDespesas,
    saldo: totalReceitas - totalDespesas,
    percentualGasto: totalReceitas > 0 ? (totalDespesas/totalReceitas)*100 : 0,
  };
}

export async function getGastosPorCategoria(mes:number, ano:number): Promise<GastoPorCategoria[]> {
  const rows = await (await getDB()).getAllAsync<any>(
    `SELECT l.categoria_id,c.nome as categoria_nome,c.icone as categoria_icone,c.cor as categoria_cor,SUM(l.valor) as total
     FROM lancamentos l JOIN categorias c ON l.categoria_id=c.id
     WHERE l.tipo='despesa' AND strftime('%m',l.data)=? AND strftime('%Y',l.data)=?
     GROUP BY l.categoria_id ORDER BY total DESC`, [String(mes).padStart(2,'0'), String(ano)]
  );
  const tot = rows.reduce((a:number,r:any) => a+r.total, 0);
  return rows.map((r:any) => ({...r, percentual: tot>0?(r.total/tot)*100:0}));
}

export const getOrcamento = async (mes:number, ano:number): Promise<Orcamento|null> =>
  (await getDB()).getFirstAsync<Orcamento>('SELECT * FROM orcamentos WHERE mes=? AND ano=?', [mes, ano]);

export const upsertOrcamento = async (val:number, mes:number, ano:number): Promise<void> => {
  await (await getDB()).runAsync(
    'INSERT INTO orcamentos(valor_mensal,mes,ano) VALUES(?,?,?) ON CONFLICT(mes,ano) DO UPDATE SET valor_mensal=excluded.valor_mensal',
    [val, mes, ano]
  );
};
