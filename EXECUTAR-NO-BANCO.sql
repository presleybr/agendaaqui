-- =============================================
-- MIGRATION: Precos de Vistoria por Tipo de Veiculo
-- Execute este SQL diretamente no banco de dados PostgreSQL
-- =============================================

-- 1. Criar tabela precos_vistoria
CREATE TABLE IF NOT EXISTS precos_vistoria (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria VARCHAR(50) NOT NULL,
  nome_exibicao VARCHAR(100) NOT NULL,
  descricao TEXT,
  preco INTEGER NOT NULL,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empresa_id, categoria)
);

-- 2. Criar indices
CREATE INDEX IF NOT EXISTS idx_precos_vistoria_empresa ON precos_vistoria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_precos_vistoria_categoria ON precos_vistoria(categoria);

-- 3. Criar trigger para updated_at (se a funcao ja existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE TRIGGER update_precos_vistoria_updated_at
    BEFORE UPDATE ON precos_vistoria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Adicionar coluna categoria_veiculo na tabela agendamentos
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS categoria_veiculo VARCHAR(50);

-- 5. Inserir precos padrao para todas as empresas ativas
INSERT INTO precos_vistoria (empresa_id, categoria, nome_exibicao, descricao, preco, ordem, ativo)
SELECT
  e.id,
  cat.categoria,
  cat.nome_exibicao,
  cat.descricao,
  cat.preco,
  cat.ordem,
  true
FROM empresas e
CROSS JOIN (VALUES
  ('moto_pequena', 'Motos até 200cc', 'Motocicletas com cilindrada até 200cc', 19000, 1),
  ('moto_grande_automovel', 'Motos +200cc / Automóveis', 'Motocicletas acima de 200cc e automóveis de passeio', 22000, 2),
  ('camionete', 'Camionetes / Camionetas', 'Veículos utilitários como picapes e SUVs', 23000, 3),
  ('van_microonibus', 'Vans / Micro-ônibus', 'Vans, motorhomes e micro-ônibus', 25000, 4),
  ('caminhao_onibus', 'Caminhões / Ônibus', 'Caminhões, carretas e ônibus de grande porte', 28000, 5)
) AS cat(categoria, nome_exibicao, descricao, preco, ordem)
WHERE e.status = 'ativo'
ON CONFLICT (empresa_id, categoria) DO NOTHING;

-- Verificar resultado
SELECT 'Precos inseridos:' as info, COUNT(*) as total FROM precos_vistoria;
SELECT empresa_id, categoria, nome_exibicao, preco/100.0 as valor_reais FROM precos_vistoria ORDER BY empresa_id, ordem;
