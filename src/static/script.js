const v = id => document.getElementById(id);

// --- Estado da Aplicação ---
let orcamentosData = []; // Armazena todos os orçamentos buscados
let selectedOrcamento = null; // Armazena o orçamento selecionado para o recibo

// --- Funções Utilitárias ---
const parseLines = txt => txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const toBRDate = iso => iso ? new Date(iso + 'T03:00:00').toLocaleDateString('pt-BR') : '';
const formatCurrency = num => `R$ ${Number(num || 0).toFixed(2).replace('.', ',')}`;

// --- Lógica das ABAS ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Esconde/mostra conteúdo e ativa/desativa abas
    document.querySelector('.tab.active').classList.remove('active');
    document.querySelector('.tab-content.active').classList.remove('active');
    tab.classList.add('active');
    v(tab.dataset.tab).classList.add('active');
    
    // Se a aba de recibos for aberta, carrega os orçamentos
    if (tab.dataset.tab === 'recibos') {
      loadOrcamentos();
    }
  });
});

// ==========================================================
// SEÇÃO DE ORÇAMENTOS
// ==========================================================

const orcForm = v('orcForm');

function updateSaldo() {
  const total = parseFloat(v('valor_total').value || "0");
  const sinal = parseFloat(v('sinal').value || "0");
  const saldo = Math.max(0, total - sinal);
  v('saldo_restante').textContent = formatCurrency(saldo);
}

function updateOrcamentoPreview() {
  const data = {
    titulo: v('titulo').value || "ORÇAMENTO",
    cliente: v('cliente').value || "[Nome do Cliente]",
    endereco: v('endereco').value || "[Endereço da Obra]",
    servicos: parseLines(v('servico').value),
    observacoes: parseLines(v('observacoes').value),
    valor_total: parseFloat(v('valor_total').value || 0),
    sinal: parseFloat(v('sinal').value || 0),
    emissao: toBRDate(v('emissao').value) || "[Data]",
    validade: toBRDate(v('validade').value) || "[Data]",
    contato: {
        nome: v('contato_nome').value,
        tel: v('contato_tel').value,
        email: v('contato_email').value,
        pix: v('contato_pix').value,
    }
  };

  const servicosList = data.servicos.length > 0
    ? data.servicos.map(item => `- ${item}`).join('\n')
    : "- [Lista de serviços a serem executados]";
  
  const obsList = data.observacoes.length > 0
    ? data.observacoes.map(item => `- ${item}`).join('\n')
    : "- [Nenhuma observação]";

  const previewText = `
${data.titulo.toUpperCase()}
========================================

Cliente: ${data.cliente}
Local: ${data.endereco}
Data de Emissão: ${data.emissao}
Validade: ${data.validade}

----------------------------------------
SERVIÇOS A SEREM EXECUTADOS
----------------------------------------
${servicosList}

----------------------------------------
VALORES
----------------------------------------
Valor Total do Serviço: ${formatCurrency(data.valor_total)}
Sinal para Início: ..... ${formatCurrency(data.sinal)}
Saldo Restante: ........ ${formatCurrency(data.valor_total - data.sinal)}

----------------------------------------
CONDIÇÕES E OBSERVAÇÕES
----------------------------------------
${obsList}

----------------------------------------
CONTATO E PAGAMENTO
----------------------------------------
${data.contato.nome}
Tel: ${data.contato.tel}
E-mail: ${data.contato.email}
Chave PIX: ${data.contato.pix || "[Não informada]"}
`;
  v('orcPreviewContent').textContent = previewText.trim();
}

async function saveOrcamento(e) {
  e.preventDefault();
  const msgDiv = v('orcMsg');
  const payload = {
    titulo: v('titulo').value,
    cliente: v('cliente').value,
    endereco: v('endereco').value,
    servico: parseLines(v('servico').value),
    valor_total: parseFloat(v('valor_total').value),
    sinal: parseFloat(v('sinal').value),
    emissao: v('emissao').value, // Envia no formato YYYY-MM-DD
    validade: v('validade').value,
    observacoes: parseLines(v('observacoes').value),
    contato: {
        nome: v('contato_nome').value,
        tel: v('contato_tel').value,
        email: v('contato_email').value,
        pix: v('contato_pix').value
    }
  };

  try {
    const res = await fetch('/api/orcamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao salvar o orçamento.');
    
    showMessage(msgDiv, `✅ Orçamento salvo com sucesso! ID: ${data.id}`, 'success');
    orcForm.reset();
    updateSaldo();
    updateOrcamentoPreview();

  } catch (err) {
    showMessage(msgDiv, `❌ Erro: ${err.message}`, 'error');
  }
}

// Listeners para a seção de orçamentos
orcForm.addEventListener('input', () => {
  updateSaldo();
  updateOrcamentoPreview();
});
orcForm.addEventListener('submit', saveOrcamento);
v('resetBtn').addEventListener('click', () => {
    orcForm.reset();
    updateSaldo();
    updateOrcamentoPreview();
    v('orcMsg').style.display = 'none';
});

// ==========================================================
// SEÇÃO DE RECIBOS
// ==========================================================

async function loadOrcamentos() {
  const listDiv = v('orcList');
  listDiv.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--muted);">Carregando orçamentos...</p>';
  try {
    const res = await fetch('/api/orcamentos');
    if (!res.ok) throw new Error('Falha ao buscar dados.');
    orcamentosData = await res.json();
    renderOrcamentoList(orcamentosData);
  } catch (err) {
    listDiv.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--error-text);">${err.message}</p>`;
  }
}

function renderOrcamentoList(data) {
  const listDiv = v('orcList');
  listDiv.innerHTML = ''; // Limpa a lista
  if (data.length === 0) {
    listDiv.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--muted);">Nenhum orçamento encontrado.</p>';
    return;
  }
  data.forEach(orc => {
    const item = document.createElement('div');
    item.className = 'orc-item';
    item.dataset.id = orc._id;
    item.innerHTML = `
      <strong>Cliente:</strong> ${orc.cliente}<br>
      <small>Data: ${toBRDate(orc.emissao)} | Total: ${formatCurrency(orc.valor_total)}</small>
    `;
    item.addEventListener('click', () => selectOrcamento(orc._id));
    listDiv.appendChild(item);
  });
}

function selectOrcamento(id) {
    selectedOrcamento = orcamentosData.find(o => o._id === id);
    if (!selectedOrcamento) return;

    // Remove a seleção de outros itens
    document.querySelectorAll('.orc-item.selected').forEach(el => el.classList.remove('selected'));
    // Adiciona a seleção ao item clicado
    document.querySelector(`.orc-item[data-id="${id}"]`).classList.add('selected');
    
    updateReciboPreview(selectedOrcamento);
    v('reciboMsg').style.display = 'none';
}

function updateReciboPreview(orc) {
    if (!orc) {
        v('reciboPreviewContent').textContent = 'Selecione um orçamento da lista para gerar o recibo.';
        return;
    }

    const servicosList = orc.servico.map((item, i) => `${i + 1}. ${item}`).join('\n');
    const saldo = orc.valor_total - orc.sinal;

    const previewText = `
RECIBO DE PRESTAÇÃO DE SERVIÇO
========================================

Aos cuidados do(a) Sr(a).: ${orc.cliente}
Local realizado o serviço: ${orc.endereco}
Data de Emissão do Recibo: ${new Date().toLocaleDateString('pt-BR')}

----------------------------------------
SERVIÇO QUE FOI REALIZADO
----------------------------------------
${servicosList}

----------------------------------------
VALORES E PAGAMENTO
----------------------------------------
Sinal Recebido: ........ ${formatCurrency(orc.sinal)}
Valor Restante Pago: ... ${formatCurrency(saldo)}
VALOR TOTAL DO SERVIÇO:  ${formatCurrency(orc.valor_total)}

----------------------------------------
DADOS BANCÁRIOS PARA PAGAMENTO
----------------------------------------
${orc.contato.nome}
Chave PIX: ${orc.contato.pix}
`;
    v('reciboPreviewContent').textContent = previewText.trim();
}

v('searchOrc').addEventListener('input', e => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = orcamentosData.filter(orc => 
        orc.cliente.toLowerCase().includes(searchTerm) ||
        orc.endereco.toLowerCase().includes(searchTerm) ||
        orc._id.toLowerCase().includes(searchTerm)
    );
    renderOrcamentoList(filtered);
});

async function saveRecibo() {
    if (!selectedOrcamento) {
        showMessage(v('reciboMsg'), '❌ Por favor, selecione um orçamento primeiro.', 'error');
        return;
    }
    
    const payload = {
        orcamento_id: selectedOrcamento._id,
        cliente: selectedOrcamento.cliente,
        endereco: selectedOrcamento.endereco,
        servico: selectedOrcamento.servico,
        valor_total: selectedOrcamento.valor_total,
        sinal: selectedOrcamento.sinal,
        contato: selectedOrcamento.contato,
        data_recibo: new Date().toISOString().split('T')[0]
    };

    try {
        const res = await fetch('/api/recibos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao salvar o recibo.');

        showMessage(v('reciboMsg'), `✅ Recibo salvo com sucesso!`, 'success');

    } catch (err) {
        showMessage(v('reciboMsg'), `❌ Erro: ${err.message}`, 'error');
    }
}

v('gerarReciboBtn').addEventListener('click', saveRecibo);

// --- Função genérica para exibir mensagens ---
function showMessage(element, message, type) {
    element.className = `message ${type}`;
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}


// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    v('emissao').valueAsDate = new Date(); // Preenche a data de emissão com hoje
    updateSaldo();
    updateOrcamentoPreview();
});
