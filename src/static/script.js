const v = id => document.getElementById(id);

// --- Estado da Aplicação ---
let orcamentosData = [];
let selectedOrcamento = null;

// --- Funções Utilitárias ---
const parseLines = txt => txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const toBRDate = iso => iso ? new Date(iso + 'T03:00:00').toLocaleDateString('pt-BR') : '';
const formatCurrency = num => `R$ ${Number(num || 0).toFixed(2).replace('.', ',')}`;

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => element.style.display = 'none', 5000);
}

// --- Lógica das ABAS ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab.active').classList.remove('active');
    document.querySelector('.tab-content.active').classList.remove('active');
    tab.classList.add('active');
    v(tab.dataset.tab).classList.add('active');
    
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
    emissao: v('emissao').value,
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
  listDiv.innerHTML = '';
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

    document.querySelectorAll('.orc-item.selected').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.orc-item[data-id="${id}"]`).classList.add('selected');
    
    populateReciboEditor(selectedOrcamento);
    v('reciboEditor').style.display = 'block';
    v('gerarReciboBtn').disabled = false;
    v('reciboMsg').style.display = 'none';
}

function populateReciboEditor(orc) {
    const today = new Date().toISOString().split('T')[0];
    
    v('recibo_cliente').value = orc.cliente;
    v('recibo_endereco').value = orc.endereco;
    v('recibo_data').value = today;
    v('recibo_servicos').value = orc.servico.join('\n');
    v('recibo_sinal').value = orc.sinal;
    v('recibo_restante').value = orc.valor_total - orc.sinal;
    v('recibo_total').value = orc.valor_total;
    v('recibo_contato_nome').value = orc.contato.nome;
    v('recibo_contato_pix').value = orc.contato.pix;
    
    updateReciboPreview();
}

function updateReciboPreview() {
    const cliente = v('recibo_cliente').value || '[Cliente]';
    const endereco = v('recibo_endereco').value || '[Endereço]';
    const data = toBRDate(v('recibo_data').value) || '[Data]';
    const servicos = v('recibo_servicos').value.split('\n').filter(s => s.trim()).map((s, i) => `${i + 1}. ${s}`).join('\n') || '[Serviços]';
    const sinal = parseFloat(v('recibo_sinal').value || 0);
    const restante = parseFloat(v('recibo_restante').value || 0);
    const total = sinal + restante;
    const nome = v('recibo_contato_nome').value || '[Nome]';
    const pix = v('recibo_contato_pix').value || '[PIX]';
    
    v('recibo_total').value = total.toFixed(2);

    const previewText = `
RECIBO DE PRESTAÇÃO DE SERVIÇO
========================================

Aos cuidados do(a) Sr(a).: ${cliente}
Local realizado o serviço: ${endereco}
Data de Emissão do Recibo: ${data}

----------------------------------------
SERVIÇO QUE FOI REALIZADO
----------------------------------------
${servicos}

----------------------------------------
VALORES E PAGAMENTO
----------------------------------------
Sinal Recebido: ........ ${formatCurrency(sinal)}
Valor Restante Pago: ... ${formatCurrency(restante)}
VALOR TOTAL DO SERVIÇO:  ${formatCurrency(total)}

----------------------------------------
DADOS BANCÁRIOS PARA PAGAMENTO
----------------------------------------
${nome}
Chave PIX: ${pix}
`;
    v('reciboPreviewContent').textContent = previewText.trim();
}

// Listeners para atualizar preview em tempo real
['recibo_cliente', 'recibo_endereco', 'recibo_data', 'recibo_servicos', 
 'recibo_sinal', 'recibo_restante', 'recibo_contato_nome', 'recibo_contato_pix'].forEach(id => {
    v(id).addEventListener('input', updateReciboPreview);
});

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
        cliente: v('recibo_cliente').value,
        endereco: v('recibo_endereco').value,
        data_recibo: v('recibo_data').value,
        servicos: v('recibo_servicos').value.split('\n').filter(s => s.trim()),
        sinal: parseFloat(v('recibo_sinal').value),
        valor_restante: parseFloat(v('recibo_restante').value),
        valor_total: parseFloat(v('recibo_total').value),
        contato: {
            nome: v('recibo_contato_nome').value,
            pix: v('recibo_contato_pix').value
        }
    };

    try {
        const res = await fetch('/api/recibos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao salvar o recibo.');
        
        showMessage(v('reciboMsg'), `✅ Recibo gerado com sucesso! ID: ${data.id}`, 'success');
        
    } catch (err) {
        showMessage(v('reciboMsg'), `❌ Erro: ${err.message}`, 'error');
    }
}

v('gerarReciboBtn').addEventListener('click', saveRecibo);

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    v('emissao').valueAsDate = new Date();
    updateSaldo();
    updateOrcamentoPreview();
});