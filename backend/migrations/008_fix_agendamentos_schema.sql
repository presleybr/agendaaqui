-- Migration 008: Corrige schema da tabela agendamentos
-- Altera colunas para compatibilidade com o modelo

-- Adiciona coluna data_hora se não existir (combinando data e horario)
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS data_hora TIMESTAMP;

-- Preenche data_hora com dados existentes de data + horario
UPDATE agendamentos
SET data_hora = (data::text || ' ' || horario::text)::timestamp
WHERE data_hora IS NULL AND data IS NOT NULL AND horario IS NOT NULL;

-- Renomeia preco para valor se preco existir e valor não existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'preco')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'valor')
  THEN
    ALTER TABLE agendamentos RENAME COLUMN preco TO valor;
  END IF;
END $$;

-- Adiciona coluna valor se não existir
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS valor INTEGER;

-- Cria índice para data_hora
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos(data_hora);

-- Comentários
COMMENT ON COLUMN agendamentos.data_hora IS 'Data e hora do agendamento (timestamp)';
COMMENT ON COLUMN agendamentos.valor IS 'Valor do serviço em centavos';
