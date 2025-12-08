-- =============================================
-- MIGRATION 012: Preços de Vistoria por Tipo de Veículo
-- =============================================

-- Tabela de categorias de veículos com preços
CREATE TABLE IF NOT EXISTS precos_vistoria (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  -- Identificação da categoria
  categoria VARCHAR(50) NOT NULL,  -- moto_pequena, moto_grande_automovel, camionete, van_microonibus, caminhao_onibus
  nome_exibicao VARCHAR(100) NOT NULL, -- Nome amigável para exibir
  descricao TEXT, -- Descrição detalhada (ex: "Motos até 200cc")

  -- Preço em centavos
  preco INTEGER NOT NULL, -- valor em centavos

  -- Ordem de exibição
  ordem INTEGER DEFAULT 0,

  -- Status
  ativo BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Cada empresa pode ter apenas uma categoria com o mesmo identificador
  UNIQUE(empresa_id, categoria)
);

CREATE INDEX IF NOT EXISTS idx_precos_vistoria_empresa ON precos_vistoria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_precos_vistoria_categoria ON precos_vistoria(categoria);

-- Trigger para atualizar updated_at (ignora se já existir)
DO $$
BEGIN
  CREATE TRIGGER update_precos_vistoria_updated_at
  BEFORE UPDATE ON precos_vistoria
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Adicionar coluna categoria_veiculo na tabela agendamentos para armazenar a categoria selecionada
ALTER TABLE agendamentos
ADD COLUMN IF NOT EXISTS categoria_veiculo VARCHAR(50);

-- Inserir preços padrão para empresa demo (id=1)
INSERT INTO precos_vistoria (empresa_id, categoria, nome_exibicao, descricao, preco, ordem, ativo) VALUES
(1, 'moto_pequena', 'Motos até 200cc', 'Motocicletas com cilindrada até 200cc', 19000, 1, true),
(1, 'moto_grande_automovel', 'Motos +200cc / Automóveis', 'Motocicletas acima de 200cc e automóveis de passeio', 22000, 2, true),
(1, 'camionete', 'Camionetes / Camionetas', 'Veículos utilitários como picapes e SUVs', 23000, 3, true),
(1, 'van_microonibus', 'Vans / Micro-ônibus', 'Vans, motorhomes e micro-ônibus', 25000, 4, true),
(1, 'caminhao_onibus', 'Caminhões / Ônibus', 'Caminhões, carretas e ônibus de grande porte', 28000, 5, true)
ON CONFLICT (empresa_id, categoria) DO UPDATE SET
  nome_exibicao = EXCLUDED.nome_exibicao,
  descricao = EXCLUDED.descricao,
  preco = EXCLUDED.preco,
  ordem = EXCLUDED.ordem;

COMMIT;
