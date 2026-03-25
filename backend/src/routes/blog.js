const express = require('express');
const router = express.Router();

/**
 * Artigos do blog - armazenados no backend para SEO (pre-rendering)
 * Em produção, isso poderia vir de um banco de dados
 */
const artigos = [
  {
    id: 1,
    slug: 'o-que-e-vistoria-cautelar-veicular',
    titulo: 'O que é Vistoria Cautelar Veicular? Guia Completo 2025',
    resumo: 'Entenda o que é a vistoria cautelar, quando ela é obrigatória, quanto custa e por que é essencial antes de comprar um veículo usado.',
    conteudo: `
<p>A <strong>vistoria cautelar veicular</strong> é uma inspeção técnica realizada por empresas credenciadas pelo DETRAN que verifica a procedência, autenticidade e condições gerais de um veículo. É o exame mais completo que você pode fazer antes de comprar um carro usado.</p>

<h2>Para que serve a vistoria cautelar?</h2>
<p>A vistoria cautelar serve para identificar possíveis problemas ocultos em um veículo, como:</p>
<ul>
  <li><strong>Chassi adulterado ou remarcado</strong> - indica que o veículo pode ser roubado ou clonado</li>
  <li><strong>Sinistro não declarado</strong> - batidas graves que foram reparadas sem registro</li>
  <li><strong>Pendências judiciais</strong> - veículos com restrições, multas ou bloqueios</li>
  <li><strong>Motor trocado</strong> - numeração do motor diferente do documento</li>
  <li><strong>Adulterações na estrutura</strong> - modificações ilegais no veículo</li>
</ul>

<h2>Quando a vistoria cautelar é obrigatória?</h2>
<p>A vistoria cautelar <strong>não é obrigatória por lei</strong>, mas é altamente recomendada em diversas situações:</p>
<ul>
  <li>Antes de comprar um veículo usado</li>
  <li>Quando o preço está muito abaixo do mercado</li>
  <li>Compra de veículo de desconhecidos ou pela internet</li>
  <li>Veículos com muitos donos anteriores</li>
  <li>Carros importados ou de outros estados</li>
</ul>

<h2>Quanto custa uma vistoria cautelar?</h2>
<p>O preço da vistoria cautelar varia por região e empresa, mas em média custa entre <strong>R$ 100,00 e R$ 250,00</strong>. Considerando que um veículo usado custa milhares de reais, é um investimento muito pequeno para evitar um grande prejuízo.</p>
<p>No <a href="https://agendaaquivistorias.com.br">AgendaAqui</a>, você pode comparar preços entre empresas da sua cidade e agendar online.</p>

<h2>O que é analisado na vistoria cautelar?</h2>
<p>Durante a vistoria, o perito analisa:</p>
<ol>
  <li><strong>Identificação do veículo:</strong> chassi, motor, câmbio, vidros, placas</li>
  <li><strong>Estrutura:</strong> colunas, longarinas, assoalho, painel corta-fogo</li>
  <li><strong>Pintura:</strong> medição com equipamento especial para detectar repinturas</li>
  <li><strong>Parte elétrica:</strong> vidros elétricos, ar-condicionado, luzes, painel</li>
  <li><strong>Documentação:</strong> consulta de restrições, multas, sinistros, leilão</li>
</ol>

<h2>Quanto tempo demora a vistoria cautelar?</h2>
<p>A vistoria cautelar leva em média <strong>30 a 60 minutos</strong>. O laudo é entregue no mesmo dia, geralmente em formato digital com fotos detalhadas de todas as verificações realizadas.</p>

<h2>Dica: sempre faça a vistoria ANTES de fechar o negócio</h2>
<p>Nunca compre um veículo usado sem antes fazer a vistoria cautelar. O custo é mínimo comparado ao risco de comprar um carro com problemas ocultos. <a href="https://agendaaquivistorias.com.br">Agende sua vistoria agora</a> e compre com segurança.</p>`,
    categoria: 'guia',
    tags: ['vistoria cautelar', 'comprar carro usado', 'detran', 'laudo veicular'],
    imagem: '/bgnew.png',
    autor: 'AgendaAqui Vistorias',
    data_publicacao: '2025-01-15',
    tempo_leitura: 6
  },
  {
    id: 2,
    slug: 'documentos-necessarios-transferencia-veicular',
    titulo: 'Documentos Necessários para Transferência Veicular: Lista Completa',
    resumo: 'Saiba quais documentos são necessários para transferir um veículo, prazos, custos e como a vistoria é parte essencial do processo.',
    conteudo: `
<p>A <strong>transferência veicular</strong> é o processo de mudança de propriedade de um veículo junto ao DETRAN. É obrigatória sempre que um veículo é vendido, e deve ser feita em até <strong>30 dias</strong> após a compra, sob pena de multa.</p>

<h2>Documentos necessários para transferência</h2>

<h3>Documentos do comprador:</h3>
<ul>
  <li>RG e CPF (ou CNH)</li>
  <li>Comprovante de residência atualizado (últimos 3 meses)</li>
  <li>Comprovante de pagamento do IPVA do exercício atual</li>
</ul>

<h3>Documentos do veículo:</h3>
<ul>
  <li>CRV (Certificado de Registro do Veículo) com reconhecimento de firma do vendedor</li>
  <li>CRLV (Certificado de Registro e Licenciamento do Veículo)</li>
  <li>Comprovante de quitação de débitos (multas, IPVA, licenciamento)</li>
  <li><strong>Laudo de vistoria veicular</strong> (realizado por ECV credenciada)</li>
</ul>

<h3>Em caso de pessoa jurídica:</h3>
<ul>
  <li>Contrato social ou estatuto</li>
  <li>CNPJ</li>
  <li>Procuração (se representante)</li>
</ul>

<h2>A vistoria na transferência veicular</h2>
<p>A vistoria para transferência é <strong>obrigatória</strong>. Ela verifica se o veículo está em conformidade com as informações do documento e se não possui adulterações. Sem o laudo de vistoria, o DETRAN não aceita o pedido de transferência.</p>

<h2>Passo a passo da transferência</h2>
<ol>
  <li><strong>Reconheça firma</strong> da assinatura do vendedor no CRV</li>
  <li><strong>Faça a vistoria veicular</strong> em uma ECV credenciada pelo DETRAN</li>
  <li><strong>Pague as taxas</strong> de transferência no banco</li>
  <li><strong>Protocole</strong> todos os documentos no DETRAN ou despachante</li>
  <li><strong>Aguarde</strong> a emissão do novo CRV em seu nome</li>
</ol>

<h2>Quanto custa a transferência?</h2>
<p>Os custos variam por estado, mas em média incluem:</p>
<ul>
  <li>Taxa DETRAN de transferência: R$ 150 a R$ 300</li>
  <li>Vistoria veicular: R$ 80 a R$ 200</li>
  <li>Reconhecimento de firma: R$ 10 a R$ 30</li>
  <li>Despachante (opcional): R$ 100 a R$ 300</li>
</ul>

<h2>Prazo para transferência</h2>
<p>O prazo legal para realizar a transferência é de <strong>30 dias</strong> após a data de venda (assinatura do CRV). O não cumprimento acarreta multa de trânsito ao antigo proprietário, que pode solicitar bloqueio do veículo.</p>

<p><strong>Agende sua vistoria para transferência agora mesmo no <a href="https://agendaaquivistorias.com.br">AgendaAqui</a></strong> e resolva tudo com praticidade.</p>`,
    categoria: 'guia',
    tags: ['transferência veicular', 'documentos', 'detran', 'CRV'],
    imagem: '/bgnew.png',
    autor: 'AgendaAqui Vistorias',
    data_publicacao: '2025-02-10',
    tempo_leitura: 5
  },
  {
    id: 3,
    slug: 'tipos-de-vistoria-veicular',
    titulo: 'Tipos de Vistoria Veicular: Qual Você Precisa?',
    resumo: 'Conheça todos os tipos de vistoria veicular disponíveis: cautelar, transferência, licenciamento, GNV, alienação e mais. Descubra qual é a ideal para sua necessidade.',
    conteudo: `
<p>Existem diversos tipos de <strong>vistoria veicular</strong>, cada uma com uma finalidade específica. Saber qual você precisa evita perda de tempo e dinheiro. Confira todos os tipos:</p>

<h2>1. Vistoria Cautelar (Pré-compra)</h2>
<p><strong>Para que serve:</strong> verificar a procedência e condições de um veículo antes da compra.</p>
<p><strong>Quando fazer:</strong> sempre antes de comprar um veículo usado.</p>
<p><strong>O que analisa:</strong> chassi, motor, estrutura, pintura, sinistros, pendências judiciais.</p>
<p><strong>Obrigatória?</strong> Não, mas altamente recomendada.</p>

<h2>2. Vistoria para Transferência</h2>
<p><strong>Para que serve:</strong> confirmar que o veículo está em conformidade para mudança de proprietário.</p>
<p><strong>Quando fazer:</strong> ao comprar ou vender um veículo.</p>
<p><strong>O que analisa:</strong> identificação do veículo, numerações, condições gerais.</p>
<p><strong>Obrigatória?</strong> Sim, exigida pelo DETRAN.</p>

<h2>3. Vistoria para Licenciamento</h2>
<p><strong>Para que serve:</strong> atestar que o veículo está apto a circular.</p>
<p><strong>Quando fazer:</strong> anualmente, junto com o pagamento do licenciamento.</p>
<p><strong>O que analisa:</strong> itens de segurança, emissão de poluentes, condições gerais.</p>
<p><strong>Obrigatória?</strong> Sim, em alguns estados.</p>

<h2>4. Vistoria para 2ª Via do CRV</h2>
<p><strong>Para que serve:</strong> emitir novo documento do veículo em caso de perda, roubo ou dano.</p>
<p><strong>Quando fazer:</strong> quando o CRV original foi perdido ou danificado.</p>
<p><strong>Obrigatória?</strong> Sim, para emissão da 2ª via.</p>

<h2>5. Vistoria para Alienação/Desalienação</h2>
<p><strong>Para que serve:</strong> registrar ou remover restrição financeira (financiamento) do veículo.</p>
<p><strong>Quando fazer:</strong> ao financiar ou quitar financiamento de um veículo.</p>
<p><strong>Obrigatória?</strong> Sim, para alteração no registro.</p>

<h2>6. Vistoria para GNV (Gás Natural Veicular)</h2>
<p><strong>Para que serve:</strong> certificar a instalação ou remoção de kit GNV.</p>
<p><strong>Quando fazer:</strong> ao instalar, renovar ou remover sistema de GNV.</p>
<p><strong>O que analisa:</strong> cilindro, válvulas, tubulação, componentes de segurança.</p>
<p><strong>Obrigatória?</strong> Sim, para veículos com GNV.</p>

<h2>7. Vistoria para Seguro</h2>
<p><strong>Para que serve:</strong> documentar as condições do veículo para contratação de seguro.</p>
<p><strong>Quando fazer:</strong> ao contratar ou renovar seguro auto.</p>
<p><strong>Obrigatória?</strong> Depende da seguradora.</p>

<h2>Como escolher a vistoria certa?</h2>
<table>
  <tr><th>Situação</th><th>Tipo de Vistoria</th></tr>
  <tr><td>Vou comprar um carro usado</td><td>Cautelar</td></tr>
  <tr><td>Vou vender meu carro</td><td>Transferência</td></tr>
  <tr><td>Perdi o documento</td><td>2ª Via CRV</td></tr>
  <tr><td>Quitei o financiamento</td><td>Desalienação</td></tr>
  <tr><td>Instalei GNV</td><td>GNV</td></tr>
  <tr><td>Vou renovar o seguro</td><td>Seguro</td></tr>
</table>

<p>Qualquer que seja sua necessidade, no <a href="https://agendaaquivistorias.com.br">AgendaAqui</a> você encontra empresas credenciadas para todos os tipos de vistoria. <strong>Compare preços e agende online!</strong></p>`,
    categoria: 'guia',
    tags: ['tipos de vistoria', 'vistoria veicular', 'cautelar', 'transferência', 'GNV', 'licenciamento'],
    imagem: '/bgnew.png',
    autor: 'AgendaAqui Vistorias',
    data_publicacao: '2025-03-01',
    tempo_leitura: 7
  },
  {
    id: 4,
    slug: 'como-identificar-carro-batido',
    titulo: 'Como Identificar um Carro Batido: 10 Sinais que Todo Comprador Deve Conhecer',
    resumo: 'Aprenda a identificar sinais de que um veículo já sofreu colisão antes de comprar. Dicas práticas de especialistas em vistoria veicular.',
    conteudo: `
<p>Comprar um carro usado pode ser um ótimo negócio, mas também pode virar um pesadelo se o veículo tiver sido batido e mal reparado. Aqui estão <strong>10 sinais</strong> que podem indicar que um carro já sofreu colisão:</p>

<h2>1. Diferença de tonalidade na pintura</h2>
<p>Compare a cor das portas, capô e para-lamas. Se houver diferença de tom, mesmo que sutil, pode indicar repintura após batida. Observe sob luz natural.</p>

<h2>2. Textura irregular da pintura</h2>
<p>Passe a mão pela lataria. Pintura original é lisa e uniforme. Repintura pode deixar textura "casca de laranja" ou rugosidade.</p>

<h2>3. Parafusos com marcas de ferramenta</h2>
<p>Abra o capô e verifique os parafusos das dobradiças, portas e para-lamas. Se tiverem marcas de chave, foram removidos — sinal de troca de peça.</p>

<h2>4. Gaps e folgas irregulares</h2>
<p>Observe o espaçamento entre portas, capô e para-lamas. Se um lado estiver diferente do outro, pode indicar que uma peça foi trocada ou a estrutura entortou.</p>

<h2>5. Borrachas de vedação novas em um carro velho</h2>
<p>Se o carro tem anos de uso mas as borrachas das portas ou para-brisa parecem novas, pode ser que foram trocadas após uma reparação.</p>

<h2>6. Soldas visíveis no assoalho</h2>
<p>Levante os tapetes e observe o assoalho. Soldas irregulares ou excesso de massa plástica indicam reparo estrutural.</p>

<h2>7. Porta-malas com sinais de reparo</h2>
<p>O porta-malas é frequentemente atingido em colisões traseiras. Verifique se há ondulações, soldas ou pintura diferente na área interna.</p>

<h2>8. Faróis ou lanternas de marcas diferentes</h2>
<p>Se um farol é original e o outro é genérico (ou de ano diferente), pode indicar substituição após batida.</p>

<h2>9. Volante desalinhado</h2>
<p>Com o carro em linha reta, o volante deve estar centralizado. Desalinhamento pode indicar problema na estrutura ou suspensão por colisão.</p>

<h2>10. Quilometragem incompatível com o estado</h2>
<p>Carro com baixa quilometragem mas muito desgaste interno (volante, pedais, bancos) pode ter quilometragem adulterada — comum em veículos sinistrados.</p>

<h2>A solução definitiva: vistoria cautelar</h2>
<p>Mesmo com todas essas dicas, muitos reparos são praticamente invisíveis a olho nu. A única forma de ter certeza é fazer uma <strong>vistoria cautelar</strong> com profissionais que usam equipamentos especializados (medidores de espessura de pintura, scanners de chassi, etc.).</p>

<p><strong><a href="https://agendaaquivistorias.com.br">Agende uma vistoria cautelar no AgendaAqui</a></strong> antes de fechar negócio. É o investimento mais inteligente que você pode fazer ao comprar um carro usado.</p>`,
    categoria: 'dicas',
    tags: ['carro batido', 'comprar carro usado', 'vistoria cautelar', 'dicas'],
    imagem: '/bgnew.png',
    autor: 'AgendaAqui Vistorias',
    data_publicacao: '2025-03-15',
    tempo_leitura: 6
  },
  {
    id: 5,
    slug: 'vistoria-veicular-mato-grosso-do-sul',
    titulo: 'Vistoria Veicular em Mato Grosso do Sul: Tudo que Você Precisa Saber',
    resumo: 'Guia completo sobre vistoria veicular em MS: onde fazer, quanto custa, documentos necessários e cidades atendidas.',
    conteudo: `
<p>Se você precisa fazer uma <strong>vistoria veicular em Mato Grosso do Sul</strong>, este guia reúne todas as informações que você precisa saber sobre o processo no estado.</p>

<h2>Como funciona a vistoria veicular em MS?</h2>
<p>Em Mato Grosso do Sul, as vistorias veiculares são realizadas por <strong>Empresas de Vistoria Credenciadas (ECVs)</strong> pelo DETRAN-MS. Essas empresas passam por rigoroso processo de credenciamento e são autorizadas a emitir laudos oficiais.</p>

<h2>Onde fazer vistoria veicular em MS?</h2>
<p>Existem ECVs credenciadas em diversas cidades do estado, incluindo:</p>
<ul>
  <li><strong>Campo Grande</strong> - capital, com maior número de opções</li>
  <li><strong>Dourados</strong> - segunda maior cidade do estado</li>
  <li><strong>Três Lagoas</strong> - leste do estado</li>
  <li><strong>Corumbá</strong> - fronteira com a Bolívia</li>
  <li><strong>Ponta Porã</strong> - fronteira com o Paraguai</li>
  <li><strong>Rio Brilhante</strong> - região sul do estado</li>
  <li><strong>Maracaju, Naviraí, Nova Andradina</strong> e outras cidades</li>
</ul>
<p>No <a href="https://agendaaquivistorias.com.br">AgendaAqui</a>, você pode buscar por cidade e encontrar ECVs próximas a você.</p>

<h2>Quanto custa a vistoria em MS?</h2>
<p>Os preços variam conforme o tipo de vistoria e a empresa:</p>
<ul>
  <li><strong>Vistoria cautelar:</strong> R$ 100 a R$ 200</li>
  <li><strong>Vistoria para transferência:</strong> R$ 80 a R$ 180</li>
  <li><strong>Vistoria para licenciamento:</strong> R$ 70 a R$ 150</li>
  <li><strong>Outros serviços:</strong> R$ 60 a R$ 150</li>
</ul>

<h2>Documentos necessários</h2>
<ul>
  <li>Documento do veículo (CRV/CRLV)</li>
  <li>Documento de identidade do proprietário (RG/CPF ou CNH)</li>
  <li>Para transferência: CRV com firma reconhecida do vendedor</li>
</ul>

<h2>Portaria de Credenciamento DETRAN-MS</h2>
<p>Todas as ECVs em MS devem possuir portaria de credenciamento emitida pelo DETRAN-MS. Ao agendar sua vistoria, verifique se a empresa possui o credenciamento ativo. No AgendaAqui, todas as empresas cadastradas são verificadas.</p>

<h2>Agende sua vistoria em MS</h2>
<p>Com o <a href="https://agendaaquivistorias.com.br">AgendaAqui</a>, você pode:</p>
<ul>
  <li>Buscar ECVs na sua cidade</li>
  <li>Comparar preços entre empresas</li>
  <li>Agendar online com data e horário</li>
  <li>Pagar com segurança via PIX ou cartão</li>
  <li>Receber confirmação instantânea</li>
</ul>
<p><strong><a href="https://agendaaquivistorias.com.br">Clique aqui para buscar vistorias em Mato Grosso do Sul</a></strong></p>`,
    categoria: 'regional',
    tags: ['vistoria MS', 'Mato Grosso do Sul', 'DETRAN-MS', 'ECV', 'Rio Brilhante'],
    imagem: '/bgnew.png',
    autor: 'AgendaAqui Vistorias',
    data_publicacao: '2025-03-20',
    tempo_leitura: 5
  }
];

/**
 * GET /api/blog
 * Lista todos os artigos (sem conteúdo completo)
 */
router.get('/', (req, res) => {
  const { categoria, tag, limite = 10, pagina = 1 } = req.query;
  let filtered = [...artigos];

  if (categoria) {
    filtered = filtered.filter(a => a.categoria === categoria);
  }
  if (tag) {
    filtered = filtered.filter(a => a.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
  }

  // Sort by date desc
  filtered.sort((a, b) => new Date(b.data_publicacao) - new Date(a.data_publicacao));

  const total = filtered.length;
  const offset = (parseInt(pagina) - 1) * parseInt(limite);
  const paginados = filtered.slice(offset, offset + parseInt(limite));

  res.json({
    total,
    pagina: parseInt(pagina),
    artigos: paginados.map(({ conteudo, ...rest }) => rest)
  });
});

/**
 * GET /api/blog/:slug
 * Retorna artigo completo com dados SEO
 */
router.get('/:slug', (req, res) => {
  const artigo = artigos.find(a => a.slug === req.params.slug);

  if (!artigo) {
    return res.status(404).json({ error: 'Artigo não encontrado' });
  }

  const baseUrl = 'https://agendaaquivistorias.com.br';
  const pageUrl = `${baseUrl}/blog/${artigo.slug}`;

  // Schema Article
  const schemaArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: artigo.titulo,
    description: artigo.resumo,
    url: pageUrl,
    datePublished: artigo.data_publicacao,
    author: { '@type': 'Organization', name: artigo.autor, url: baseUrl },
    publisher: { '@type': 'Organization', name: 'AgendaAqui Vistorias', url: baseUrl, logo: { '@type': 'ImageObject', url: `${baseUrl}/logo-dark.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    image: artigo.imagem ? `${baseUrl}${artigo.imagem}` : `${baseUrl}/logo-dark.png`
  };

  // Schema Breadcrumb
  const schemaBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: artigo.titulo, item: pageUrl }
    ]
  };

  res.json({
    ...artigo,
    seo: {
      titulo: `${artigo.titulo} | AgendaAqui Vistorias`,
      descricao: artigo.resumo,
      keywords: artigo.tags.join(', '),
      url: pageUrl,
      image: artigo.imagem ? `${baseUrl}${artigo.imagem}` : `${baseUrl}/logo-dark.png`,
      schemas: [schemaArticle, schemaBreadcrumb]
    }
  });
});

/**
 * GET /api/blog/prerender/:slug
 * HTML pré-renderizado para crawlers
 */
router.get('/prerender/:slug', (req, res) => {
  const artigo = artigos.find(a => a.slug === req.params.slug);

  if (!artigo) {
    return res.status(404).send('Artigo não encontrado');
  }

  const baseUrl = 'https://agendaaquivistorias.com.br';
  const pageUrl = `${baseUrl}/blog/${artigo.slug}`;

  const schemaArticle = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: artigo.titulo, description: artigo.resumo, url: pageUrl,
    datePublished: artigo.data_publicacao,
    author: { '@type': 'Organization', name: artigo.autor, url: baseUrl },
    publisher: { '@type': 'Organization', name: 'AgendaAqui Vistorias', url: baseUrl, logo: { '@type': 'ImageObject', url: `${baseUrl}/logo-dark.png` } },
    image: artigo.imagem ? `${baseUrl}${artigo.imagem}` : `${baseUrl}/logo-dark.png`
  };

  const schemaBreadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: artigo.titulo, item: pageUrl }
    ]
  };

  // Artigos relacionados (mesma categoria, excluindo o atual)
  const relacionados = artigos
    .filter(a => a.id !== artigo.id)
    .slice(0, 3)
    .map(a => `<li><a href="${baseUrl}/blog/${a.slug}">${a.titulo}</a></li>`)
    .join('\n          ');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artigo.titulo} | AgendaAqui Vistorias</title>
  <meta name="description" content="${artigo.resumo}">
  <meta name="keywords" content="${artigo.tags.join(', ')}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${pageUrl}">

  <meta property="og:type" content="article">
  <meta property="og:title" content="${artigo.titulo}">
  <meta property="og:description" content="${artigo.resumo}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${baseUrl}${artigo.imagem || '/logo-dark.png'}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="AgendaAqui Vistorias">
  <meta property="article:published_time" content="${artigo.data_publicacao}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${artigo.titulo}">
  <meta name="twitter:description" content="${artigo.resumo}">

  <script type="application/ld+json">${JSON.stringify(schemaArticle)}</script>
  <script type="application/ld+json">${JSON.stringify(schemaBreadcrumb)}</script>
</head>
<body>
  <header>
    <nav>
      <a href="${baseUrl}">AgendaAqui Vistorias</a> |
      <a href="${baseUrl}/blog">Blog</a>
    </nav>
  </header>
  <main>
    <nav aria-label="Breadcrumb">
      <a href="${baseUrl}">Home</a> &gt;
      <a href="${baseUrl}/blog">Blog</a> &gt;
      <span>${artigo.titulo}</span>
    </nav>

    <article>
      <h1>${artigo.titulo}</h1>
      <p><time datetime="${artigo.data_publicacao}">${new Date(artigo.data_publicacao).toLocaleDateString('pt-BR')}</time> | ${artigo.tempo_leitura} min de leitura | Por ${artigo.autor}</p>
      <p><strong>${artigo.resumo}</strong></p>

      ${artigo.conteudo}
    </article>

    <aside>
      <h2>Artigos Relacionados</h2>
      <ul>
        ${relacionados}
      </ul>
    </aside>

    <section>
      <h2>Precisa de uma vistoria veicular?</h2>
      <p><a href="${baseUrl}">Busque empresas de vistoria na sua cidade</a> e agende online com pagamento seguro.</p>
    </section>
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} <a href="${baseUrl}">AgendaAqui Vistorias</a>. Todos os direitos reservados.</p>
  </footer>
</body>
</html>`;

  res.set('Content-Type', 'text/html');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(html);
});

module.exports = router;
module.exports.artigos = artigos;
