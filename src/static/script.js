const v = id => document.getElementById(id);

// --- Application State ---
let orcamentosData = [];
let recibosData = [];
let cobrancasData = [];
let selectedOrcamento = null;
let currentConfig = {
  theme: 'light',
  colorPalette: 'default',
  fontSize: '14',
  preforms: { servicos: [], observacoes: [] },
  userInfo: { nome: '', telefone: '', email: '', pix: '' },
  language: 'ptbr',
  savePaths: { orcamentos: '', recibos: '', cobrancas: '' }
};

// Edit state
let orcEditingId = null;
let reciboEditingId = null;
let cobrancaEditingId = null;

// --- Utility Functions ---
const parseLines = txt => txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const toBRDate = iso => iso ? new Date(iso + 'T03:00:00').toLocaleDateString('pt-BR') : '';
const formatCurrency = num => `R$ ${Number(num || 0).toFixed(2).replace('.', ',')}`;

function showMessage(element, message, type) {
    element.innerHTML = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => element.style.display = 'none', 8000);
}

// --- Tab Logic ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab.active').classList.remove('active');
    document.querySelector('.tab-content.active').classList.remove('active');
    tab.classList.add('active');
    v(tab.dataset.tab).classList.add('active');

    if (tab.dataset.tab === 'recibos') {
      loadOrcamentos();
      loadRecibosSaved();
    } else if (tab.dataset.tab === 'config') {
      loadConfig();
    } else if (tab.dataset.tab === 'cobrancas') {
      loadCobrancasSaved();
      updateCobrancaContactFields();
    } else if (tab.dataset.tab === 'orcamentos') {
      loadOrcamentosSaved();
    }
  });
});

// ==========================================================
// QUOTES SECTION
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
    cliente: v('cliente').value.trim() || "[Cliente não informado]",
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

  const isEditing = !!orcEditingId;
  const url = isEditing ? `/api/orcamentos/${orcEditingId}` : '/api/orcamentos';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao salvar o orçamento.');

    const action = isEditing ? t('quoteUpdatedSuccess') : t('quoteSavedSuccess');
    showMessage(msgDiv, `✅ ${action}<br><strong>${t('client')}:</strong> ${data.cliente}<br><strong>PDF:</strong> ${data.pdf_path}`, 'success');

    cancelOrcEdit();
    loadOrcamentosSaved();

  } catch (err) {
    showMessage(msgDiv, `❌ Erro: ${err.message}`, 'error');
  }
}

function resetOrcForm() {
  const contactInfo = {
    nome: v('contato_nome').value,
    tel: v('contato_tel').value,
    email: v('contato_email').value,
    pix: v('contato_pix').value
  };
  orcForm.reset();
  v('contato_nome').value = contactInfo.nome;
  v('contato_tel').value = contactInfo.tel;
  v('contato_email').value = contactInfo.email;
  v('contato_pix').value = contactInfo.pix;
  updateSaldo();
  updateOrcamentoPreview();
  v('orcMsg').style.display = 'none';
}

function startOrcEdit(orc) {
  orcEditingId = orc._id;
  v('titulo').value = orc.titulo || 'ORÇAMENTO';
  v('cliente').value = orc.cliente || '';
  v('endereco').value = orc.endereco || '';
  v('servico').value = (orc.servico || []).join('\n');
  v('valor_total').value = orc.valor_total || '';
  v('sinal').value = orc.sinal || '';
  v('emissao').value = orc.emissao || '';
  v('validade').value = orc.validade || '';
  v('observacoes').value = (orc.observacoes || []).join('\n');
  if (orc.contato) {
    v('contato_nome').value = orc.contato.nome || '';
    v('contato_tel').value = orc.contato.tel || '';
    v('contato_email').value = orc.contato.email || '';
    v('contato_pix').value = orc.contato.pix || '';
  }
  updateSaldo();
  updateOrcamentoPreview();
  v('orcEditBanner').classList.add('active');
  v('orcSubmitBtn').setAttribute('data-i18n', 'saveEdit');
  v('orcSubmitBtn').textContent = t('saveEdit');
  v('orcCancelEditBtn').style.display = 'inline-block';
  v('orcForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelOrcEdit() {
  orcEditingId = null;
  v('orcEditBanner').classList.remove('active');
  v('orcSubmitBtn').setAttribute('data-i18n', 'saveAndGenerate');
  v('orcSubmitBtn').textContent = t('saveAndGenerate');
  v('orcCancelEditBtn').style.display = 'none';
}

async function loadOrcamentosSaved() {
  const listDiv = v('orcSavedList');
  try {
    const res = await fetch('/api/orcamentos');
    orcamentosData = await res.json();
    renderOrcamentosSaved(orcamentosData, listDiv);
    v('searchOrcForm').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtered = orcamentosData.filter(o =>
        (o.cliente || '').toLowerCase().includes(q) ||
        (o.endereco || '').toLowerCase().includes(q)
      );
      renderOrcamentosSaved(filtered, listDiv);
    });
  } catch (err) {
    listDiv.innerHTML = `<p style="padding:12px;color:var(--error-text)">${err.message}</p>`;
  }
}

function renderOrcamentosSaved(data, container) {
  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = `<p style="padding:12px;color:var(--muted);text-align:center">${t('noQuotesFound')}</p>`;
    return;
  }
  data.forEach(orc => {
    const item = document.createElement('div');
    item.className = 'doc-item';
    item.innerHTML = `
      <div class="doc-item-info">
        <strong>${orc.cliente || 'Sem cliente'}</strong><br>
        <small>${orc.endereco || ''} — ${toBRDate(orc.emissao)} — ${formatCurrency(orc.valor_total)}</small>
      </div>
      <div class="doc-item-actions">
        <button class="btn-edit" onclick="startOrcEdit(${JSON.stringify(orc).replace(/"/g, '&quot;')})">✏️ Editar</button>
      </div>
    `;
    container.appendChild(item);
  });
}

// Listeners for quotes section
orcForm.addEventListener('input', () => {
  updateSaldo();
  updateOrcamentoPreview();
});
orcForm.addEventListener('submit', saveOrcamento);
v('resetBtn').addEventListener('click', () => {
  cancelOrcEdit();
  resetOrcForm();
});
v('orcCancelEditBtn').addEventListener('click', () => {
  cancelOrcEdit();
  resetOrcForm();
});

// ==========================================================
// RECEIPTS SECTION
// ==========================================================

async function loadOrcamentos() {
  const listDiv = v('orcList');
  listDiv.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--muted);">${t('loadingQuotes')}</p>`;
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
    listDiv.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--muted);">${t('noQuotesFound')}</p>`;
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

    reciboEditingId = null;
    v('reciboEditBanner').classList.remove('active');
    v('gerarReciboSaveBtn').setAttribute('data-i18n', 'saveAndGenerateReceipt');
    v('gerarReciboSaveBtn').textContent = t('saveAndGenerateReceipt');
    v('reciboCancelEditBtn').style.display = 'none';

    populateReciboEditor(selectedOrcamento);
    v('reciboEditor').style.display = 'block';
    v('gerarReciboBtn').disabled = false;
    v('reciboMsg').style.display = 'none';
}

function populateReciboEditor(orc) {
    const today = new Date().toISOString().split('T')[0];
    v('recibo_cliente').value = orc.cliente || '';
    v('recibo_endereco').value = orc.endereco || '';
    v('recibo_data').value = orc.data_recibo || today;
    v('recibo_servicos').value = (orc.servicos || orc.servico || []).join('\n');
    v('recibo_sinal').value = orc.sinal || '';
    v('recibo_restante').value = orc.valor_restante !== undefined ? orc.valor_restante : (orc.valor_total - orc.sinal);
    v('recibo_total').value = orc.valor_total || '';
    v('recibo_contato_nome').value = (orc.contato && orc.contato.nome) || '';
    v('recibo_contato_pix').value = (orc.contato && orc.contato.pix) || '';
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

function startReciboEdit(recibo) {
  reciboEditingId = recibo._id;
  selectedOrcamento = null;
  document.querySelectorAll('.orc-item.selected').forEach(el => el.classList.remove('selected'));
  populateReciboEditor(recibo);
  v('reciboEditor').style.display = 'block';
  v('gerarReciboBtn').disabled = true;
  v('reciboEditBanner').classList.add('active');
  v('gerarReciboSaveBtn').setAttribute('data-i18n', 'saveEdit');
  v('gerarReciboSaveBtn').textContent = t('saveEdit');
  v('reciboCancelEditBtn').style.display = 'inline-block';
  v('reciboPreviewContent').scrollIntoView({ behavior: 'smooth' });
}

function cancelReciboEdit() {
  reciboEditingId = null;
  v('reciboEditBanner').classList.remove('active');
  v('gerarReciboSaveBtn').setAttribute('data-i18n', 'saveAndGenerateReceipt');
  v('gerarReciboSaveBtn').textContent = t('saveAndGenerateReceipt');
  v('reciboCancelEditBtn').style.display = 'none';
  v('reciboEditor').style.display = 'none';
  v('reciboPreviewContent').textContent = t('receiptPreviewPlaceholder');
  v('gerarReciboBtn').disabled = true;
}

async function loadRecibosSaved() {
  const listDiv = v('reciboSavedList');
  try {
    const res = await fetch('/api/recibos');
    recibosData = await res.json();
    renderRecibosSaved(recibosData, listDiv);
  } catch (err) {
    listDiv.innerHTML = `<p style="padding:12px;color:var(--error-text)">${err.message}</p>`;
  }
}

function renderRecibosSaved(data, container) {
  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = `<p style="padding:12px;color:var(--muted);text-align:center">Nenhum recibo encontrado.</p>`;
    return;
  }
  data.forEach(rec => {
    const item = document.createElement('div');
    item.className = 'doc-item';
    item.innerHTML = `
      <div class="doc-item-info">
        <strong>${rec.cliente || 'Sem cliente'}</strong><br>
        <small>${rec.endereco || ''} — ${toBRDate(rec.data_recibo)} — ${formatCurrency(rec.valor_total)}</small>
      </div>
      <div class="doc-item-actions">
        <button class="btn-edit" onclick="startReciboEdit(${JSON.stringify(rec).replace(/"/g, '&quot;')})">✏️ Editar</button>
      </div>
    `;
    container.appendChild(item);
  });
}

['recibo_cliente', 'recibo_endereco', 'recibo_data', 'recibo_servicos',
 'recibo_sinal', 'recibo_restante', 'recibo_contato_nome', 'recibo_contato_pix'].forEach(id => {
    v(id).addEventListener('input', updateReciboPreview);
});

v('searchOrc').addEventListener('input', e => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = orcamentosData.filter(orc =>
        (orc.cliente || '').toLowerCase().includes(searchTerm) ||
        (orc.endereco || '').toLowerCase().includes(searchTerm) ||
        orc._id.toLowerCase().includes(searchTerm)
    );
    renderOrcamentoList(filtered);
});

async function saveRecibo() {
    const isEditing = !!reciboEditingId;

    if (!isEditing && !selectedOrcamento) {
        showMessage(v('reciboMsg'), `❌ ${t('selectQuoteFirst')}`, 'error');
        return;
    }

    const payload = {
        orcamento_id: isEditing ? (recibosData.find(r => r._id === reciboEditingId)?.orcamento_id) : selectedOrcamento._id,
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

    const url = isEditing ? `/api/recibos/${reciboEditingId}` : '/api/recibos';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao salvar o recibo.');

        const action = isEditing ? t('receiptUpdatedSuccess') : t('receiptGeneratedSuccess');
        showMessage(v('reciboMsg'), `✅ ${action}<br><strong>${t('client')}:</strong> ${data.cliente}<br><strong>PDF:</strong> ${data.pdf_path}`, 'success');

        if (isEditing) cancelReciboEdit();
        loadRecibosSaved();

    } catch (err) {
        showMessage(v('reciboMsg'), `❌ Erro: ${err.message}`, 'error');
    }
}

v('gerarReciboBtn').addEventListener('click', saveRecibo);
v('gerarReciboSaveBtn').addEventListener('click', saveRecibo);
v('reciboCancelEditBtn').addEventListener('click', cancelReciboEdit);

// ==========================================================
// COBRANÇAS DE VISITA SECTION
// ==========================================================

function updateCobrancaPreview() {
  const cliente = v('cob_cliente').value.trim() || '[Cliente não informado]';
  const endereco = v('cob_endereco').value || '[Endereço]';
  const descricao = parseLines(v('cob_descricao').value);
  const obs = parseLines(v('cob_obs').value);
  const valor = parseFloat(v('cob_valor').value || 0);
  const data = toBRDate(v('cob_data').value) || '[Data]';
  const nome = v('cob_contato_nome').value || '[Nome]';
  const pix = v('cob_contato_pix').value || '[PIX]';

  const descList = descricao.length > 0
    ? descricao.map(i => `- ${i}`).join('\n')
    : '- [Descrição do serviço realizado]';

  const obsList = obs.length > 0
    ? '\n----------------------------------------\nOBSERVAÇÕES\n----------------------------------------\n' + obs.map(i => `- ${i}`).join('\n')
    : '';

  const previewText = `
COBRANÇA DE VISITA
========================================

Cliente: ${cliente}
Local: ${endereco}
Data de Emissão: ${data}

----------------------------------------
SERVIÇO REALIZADO
----------------------------------------
${descList}
${obsList}

----------------------------------------
VALOR
----------------------------------------
VALOR TOTAL DO SERVIÇO: ${formatCurrency(valor)}

----------------------------------------
DADOS BANCÁRIOS PARA PAGAMENTO
----------------------------------------
${nome}
Chave PIX: ${pix}
`;
  v('cobrancaPreviewContent').textContent = previewText.trim();
}

function updateCobrancaContactFields() {
  const userInfo = currentConfig.userInfo || {};
  v('cob_contato_nome').value = userInfo.nome || '';
  v('cob_contato_tel').value = userInfo.telefone || '';
  v('cob_contato_pix').value = userInfo.pix || '';
}

async function saveCobranca(e) {
  e.preventDefault();
  const msgDiv = v('cobrancaMsg');
  const payload = {
    cliente: v('cob_cliente').value,
    endereco: v('cob_endereco').value,
    descricao: parseLines(v('cob_descricao').value),
    valor_total: parseFloat(v('cob_valor').value),
    data_cobranca: v('cob_data').value,
    obs: parseLines(v('cob_obs').value),
    contato: {
      nome: v('cob_contato_nome').value,
      tel: v('cob_contato_tel').value,
      pix: v('cob_contato_pix').value
    }
  };

  const isEditing = !!cobrancaEditingId;
  const url = isEditing ? `/api/cobrancas/${cobrancaEditingId}` : '/api/cobrancas';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao salvar a cobrança.');

    const action = isEditing ? t('chargeUpdatedSuccess') : t('chargeSavedSuccess');
    showMessage(msgDiv, `✅ ${action}<br><strong>${t('client')}:</strong> ${data.cliente}<br><strong>PDF:</strong> ${data.pdf_path}`, 'success');

    cancelCobrancaEdit();
    loadCobrancasSaved();

  } catch (err) {
    showMessage(msgDiv, `❌ Erro: ${err.message}`, 'error');
  }
}

function resetCobrancaForm() {
  const contactInfo = {
    nome: v('cob_contato_nome').value,
    tel: v('cob_contato_tel').value,
    pix: v('cob_contato_pix').value
  };
  v('cobrancaForm').reset();
  v('cob_contato_nome').value = contactInfo.nome;
  v('cob_contato_tel').value = contactInfo.tel;
  v('cob_contato_pix').value = contactInfo.pix;
  updateCobrancaPreview();
  v('cobrancaMsg').style.display = 'none';
}

function startCobrancaEdit(cobranca) {
  cobrancaEditingId = cobranca._id;
  v('cob_cliente').value = cobranca.cliente || '';
  v('cob_endereco').value = cobranca.endereco || '';
  v('cob_descricao').value = (cobranca.descricao || []).join('\n');
  v('cob_valor').value = cobranca.valor_total || '';
  v('cob_data').value = cobranca.data_cobranca || '';
  v('cob_obs').value = (cobranca.obs || []).join('\n');
  if (cobranca.contato) {
    v('cob_contato_nome').value = cobranca.contato.nome || '';
    v('cob_contato_tel').value = cobranca.contato.tel || '';
    v('cob_contato_pix').value = cobranca.contato.pix || '';
  }
  updateCobrancaPreview();
  v('cobrancaEditBanner').classList.add('active');
  v('cobrancaSubmitBtn').setAttribute('data-i18n', 'saveEdit');
  v('cobrancaSubmitBtn').textContent = t('saveEdit');
  v('cobrancaCancelEditBtn').style.display = 'inline-block';
  v('cobrancaForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelCobrancaEdit() {
  cobrancaEditingId = null;
  v('cobrancaEditBanner').classList.remove('active');
  v('cobrancaSubmitBtn').setAttribute('data-i18n', 'saveAndGenerateCharge');
  v('cobrancaSubmitBtn').textContent = t('saveAndGenerateCharge');
  v('cobrancaCancelEditBtn').style.display = 'none';
}

async function loadCobrancasSaved() {
  const listDiv = v('cobrancaSavedList');
  try {
    const res = await fetch('/api/cobrancas');
    cobrancasData = await res.json();
    renderCobrancasSaved(cobrancasData, listDiv);
    v('searchCobranca').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtered = cobrancasData.filter(c =>
        (c.cliente || '').toLowerCase().includes(q) ||
        (c.endereco || '').toLowerCase().includes(q)
      );
      renderCobrancasSaved(filtered, listDiv);
    });
  } catch (err) {
    listDiv.innerHTML = `<p style="padding:12px;color:var(--error-text)">${err.message}</p>`;
  }
}

function renderCobrancasSaved(data, container) {
  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = `<p style="padding:12px;color:var(--muted);text-align:center">${t('noChargesFound')}</p>`;
    return;
  }
  data.forEach(c => {
    const item = document.createElement('div');
    item.className = 'doc-item';
    item.innerHTML = `
      <div class="doc-item-info">
        <strong>${c.cliente || 'Sem cliente'}</strong><br>
        <small>${c.endereco || ''} — ${toBRDate(c.data_cobranca)} — ${formatCurrency(c.valor_total)}</small>
      </div>
      <div class="doc-item-actions">
        <button class="btn-edit" onclick="startCobrancaEdit(${JSON.stringify(c).replace(/"/g, '&quot;')})">✏️ Editar</button>
      </div>
    `;
    container.appendChild(item);
  });
}

v('cobrancaForm').addEventListener('input', updateCobrancaPreview);
v('cobrancaForm').addEventListener('submit', saveCobranca);
v('resetCobrancaBtn').addEventListener('click', () => {
  cancelCobrancaEdit();
  resetCobrancaForm();
});
v('cobrancaCancelEditBtn').addEventListener('click', () => {
  cancelCobrancaEdit();
  resetCobrancaForm();
});

// ==========================================================
// SETTINGS SECTION
// ==========================================================

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao carregar configurações');
    currentConfig = data;
    populateConfigForm();
    updateConfigPreview();
    updatePreformSelectors();
    applyConfig(currentConfig);
  } catch (e) {
    showMessage(v('configMsg'), `❌ Erro ao carregar: ${e.message}`, 'error');
  }
}

function populateConfigForm() {
  v('themeSelect').value = currentConfig.theme || 'light';
  v('colorPalette').value = currentConfig.colorPalette || 'default';
  v('fontSize').value = currentConfig.fontSize || '14';
  v('languageSelect').value = currentConfig.language || 'ptbr';

  const userInfo = currentConfig.userInfo || {};
  v('userNome').value = userInfo.nome || '';
  v('userTelefone').value = userInfo.telefone || '';
  v('userEmail').value = userInfo.email || '';
  v('userPix').value = userInfo.pix || '';

  const savePaths = currentConfig.savePaths || {};
  v('pathOrcamentos').value = savePaths.orcamentos || '';
  v('pathRecibos').value = savePaths.recibos || '';
  v('pathCobrancas').value = savePaths.cobrancas || '';

  renderPreformsList();
  updateUserFormFields();
}

function renderPreformsList() {
  const container = v('preformsList');
  container.innerHTML = '';

  ['servicos', 'observacoes'].forEach(type => {
    const items = currentConfig.preforms[type] || [];
    if (items.length > 0) {
      const section = document.createElement('div');
      section.innerHTML = `<h4>${type === 'servicos' ? t('services') : t('observations')}</h4>`;

      items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'preform-item';
        div.innerHTML = `
          <span>${item}</span>
          <button class="btn secondary" onclick="removePreform('${type}', ${index})">${t('remove')}</button>
        `;
        section.appendChild(div);
      });
      container.appendChild(section);
    }
  });
}

function addPreform() {
  const type = v('preformType').value;
  const text = v('preformText').value.trim();

  if (!text) {
    showMessage(v('configMsg'), `❌ ${t('enterPreformText')}`, 'error');
    return;
  }

  if (!currentConfig.preforms[type]) currentConfig.preforms[type] = [];
  currentConfig.preforms[type].push(text);

  v('preformText').value = '';
  renderPreformsList();
  updateConfigPreview();
  updatePreformSelectors();
}

function removePreform(type, index) {
  currentConfig.preforms[type].splice(index, 1);
  renderPreformsList();
  updateConfigPreview();
  updatePreformSelectors();
}

function updatePreformSelectors() {
  const servicoSelect = v('servicoPreform');
  const obsSelect = v('observacoesPreform');

  servicoSelect.innerHTML = `<option value="">${t('selectPreform')}</option>`;
  obsSelect.innerHTML = `<option value="">${t('selectPreform')}</option>`;

  (currentConfig.preforms.servicos || []).forEach(item => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    servicoSelect.appendChild(option);
  });

  (currentConfig.preforms.observacoes || []).forEach(item => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    obsSelect.appendChild(option);
  });
}

function insertPreform(fieldId, text) {
  if (!text) return;
  const field = v(fieldId);
  const currentText = field.value;
  field.value = currentText ? currentText + '\n' + text : text;
  updateOrcamentoPreview();
}

function updateConfigPreview() {
  const preformsDiv = v('preformsPreview');
  const appearanceDiv = v('appearancePreview');
  const userInfoDiv = v('userInfoPreview');

  let preformsHtml = '';
  ['servicos', 'observacoes'].forEach(type => {
    const items = currentConfig.preforms[type] || [];
    if (items.length > 0) {
      preformsHtml += `<strong>${type === 'servicos' ? 'Serviços' : 'Observações'}:</strong><br>`;
      items.forEach(item => preformsHtml += `• ${item}<br>`);
      preformsHtml += '<br>';
    }
  });

  preformsDiv.innerHTML = preformsHtml || t('noPreforms');

  appearanceDiv.innerHTML = `
    <strong>${t('theme')}:</strong> ${currentConfig.theme}<br>
    <strong>${t('colorPalette')}:</strong> ${currentConfig.colorPalette}<br>
    <strong>${t('font')}:</strong> ${currentConfig.fontSize}px
  `;

  const userInfo = currentConfig.userInfo || {};
  userInfoDiv.innerHTML = `
    <strong>${t('name')}:</strong> ${userInfo.nome || t('notDefined')}<br>
    <strong>${t('phone')}:</strong> ${userInfo.telefone || t('notDefined')}<br>
    <strong>${t('email')}:</strong> ${userInfo.email || t('notDefined')}<br>
    <strong>${t('pix')}:</strong> ${userInfo.pix || t('notDefined')}
  `;
}

function updateUserFormFields() {
  const userInfo = currentConfig.userInfo || {};
  v('contato_nome').value = userInfo.nome || '';
  v('contato_tel').value = userInfo.telefone || '';
  v('contato_email').value = userInfo.email || '';
  v('contato_pix').value = userInfo.pix || '';
  updateCobrancaContactFields();
}

async function saveConfig() {
  currentConfig.theme = v('themeSelect').value;
  currentConfig.colorPalette = v('colorPalette').value;
  currentConfig.fontSize = v('fontSize').value;
  currentConfig.language = v('languageSelect').value;
  currentConfig.userInfo = {
    nome: v('userNome').value,
    telefone: v('userTelefone').value,
    email: v('userEmail').value,
    pix: v('userPix').value
  };
  currentConfig.savePaths = {
    orcamentos: v('pathOrcamentos').value,
    recibos: v('pathRecibos').value,
    cobrancas: v('pathCobrancas').value
  };

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentConfig)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Falha ao salvar configurações');

    applyConfig(currentConfig);
    setLanguage(currentConfig.language);
    updateConfigPreview();
    updateUserFormFields();
    showMessage(v('configMsg'), `✅ ${t('configSavedSuccess')}`, 'success');
  } catch (e) {
    showMessage(v('configMsg'), `❌ Erro: ${e.message}`, 'error');
  }
}

function applyConfig(config) {
  document.documentElement.setAttribute('data-theme', config.theme || 'light');
  document.documentElement.setAttribute('data-palette', config.colorPalette || 'default');
  document.body.style.fontSize = (config.fontSize || 14) + 'px';
  setLanguage(config.language || 'ptbr');
}

v('addPreformBtn').addEventListener('click', addPreform);
v('saveConfigBtn').addEventListener('click', saveConfig);
['themeSelect', 'colorPalette', 'fontSize', 'languageSelect'].forEach(id => {
  v(id).addEventListener('change', updateConfigPreview);
});

v('languageSelect').addEventListener('change', () => {
  setLanguage(v('languageSelect').value);
});
['userNome', 'userTelefone', 'userEmail', 'userPix'].forEach(id => {
  v(id).addEventListener('input', () => {
    currentConfig.userInfo = {
      nome: v('userNome').value,
      telefone: v('userTelefone').value,
      email: v('userEmail').value,
      pix: v('userPix').value
    };
    updateConfigPreview();
  });
});

v('preformText').addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addPreform();
  }
});

// --- Shared helpers ---
function toggleSavedDocs(id) {
  const content = v(id + '-content');
  const icon = content.previousElementSibling.querySelector('.toggle-icon');
  if (content.classList.contains('open')) {
    content.classList.remove('open');
    icon.classList.remove('open');
  } else {
    content.classList.add('open');
    icon.classList.add('open');
  }
}

function toggleConfigGroup(groupId) {
  const content = v(groupId + '-content');
  const icon = content.previousElementSibling.querySelector('.toggle-icon');
  if (content.classList.contains('open')) {
    content.classList.remove('open');
    icon.classList.remove('open');
  } else {
    content.classList.add('open');
    icon.classList.add('open');
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    v('emissao').valueAsDate = new Date();
    v('cob_data').valueAsDate = new Date();
    updateSaldo();
    updateOrcamentoPreview();
    updateCobrancaPreview();

    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (res.ok) {
        currentConfig = data;
        applyConfig(currentConfig);
        updatePreformSelectors();
        updateUserFormFields();
        updateAllTexts();
      }
    } catch (e) {
      console.error('Erro ao carregar configurações iniciais:', e);
    }

    loadOrcamentosSaved();
});

// Global functions
window.insertPreform = insertPreform;
window.removePreform = removePreform;
window.toggleConfigGroup = toggleConfigGroup;
window.toggleSavedDocs = toggleSavedDocs;
window.startOrcEdit = startOrcEdit;
window.startReciboEdit = startReciboEdit;
window.startCobrancaEdit = startCobrancaEdit;
