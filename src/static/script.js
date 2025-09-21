const v = id => document.getElementById(id);

// --- Application State ---
let orcamentosData = [];
let selectedOrcamento = null;
let currentConfig = {
  theme: 'light',
  colorPalette: 'default',
  fontSize: '14',
  preforms: { servicos: [], observacoes: [] },
  userInfo: { nome: '', telefone: '', email: '', pix: '' },
  language: 'ptbr'
};

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
    } else if (tab.dataset.tab === 'config') {
      loadConfig();
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
    
    showMessage(msgDiv, `✅ ${t('quoteSavedSuccess')}<br><strong>${t('client')}:</strong> ${data.cliente}<br><strong>PDF:</strong> ${data.pdf_path}`, 'success');
    orcForm.reset();
    updateSaldo();
    updateOrcamentoPreview();

  } catch (err) {
    showMessage(msgDiv, `❌ Erro: ${err.message}`, 'error');
  }
}

// Listeners for quotes section
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

// Listeners to update preview in real time
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
        showMessage(v('reciboMsg'), `❌ ${t('selectQuoteFirst')}`, 'error');
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
        
        showMessage(v('reciboMsg'), `✅ ${t('receiptGeneratedSuccess')}<br><strong>${t('client')}:</strong> ${data.cliente}<br><strong>PDF:</strong> ${data.pdf_path}`, 'success');
        
    } catch (err) {
        showMessage(v('reciboMsg'), `❌ Erro: ${err.message}`, 'error');
    }
}

v('gerarReciboBtn').addEventListener('click', saveRecibo);

// Listener for Enter key in pre-form field
v('preformText').addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addPreform();
  }
});

// ==========================================================
// SETTINGS SECTION
// ==========================================================

async function loadConfig() {
  try {
    console.log('Carregando configurações...');
    const res = await fetch('/api/config');
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao carregar configurações');
    }
    
    currentConfig = data;
    console.log('Configurações carregadas:', currentConfig);
    
    populateConfigForm();
    updateConfigPreview();
    updatePreformSelectors();
    applyConfig(currentConfig);
    
  } catch (e) {
    console.error('Erro ao carregar configurações:', e);
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
  
  console.log('Salvando configurações:', currentConfig);
  
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentConfig)
    });
    
    const result = await res.json();
    console.log('Resposta do servidor:', result);
    
    if (!res.ok) {
      throw new Error(result.error || 'Falha ao salvar configurações');
    }
    
    applyConfig(currentConfig);
    setLanguage(currentConfig.language);
    updateConfigPreview();
    updateUserFormFields();
    showMessage(v('configMsg'), `✅ ${t('configSavedSuccess')}`, 'success');
    
  } catch (e) {
    console.error('Erro ao salvar config:', e);
    showMessage(v('configMsg'), `❌ Erro: ${e.message}`, 'error');
  }
}

function applyConfig(config) {
  document.documentElement.setAttribute('data-theme', config.theme || 'light');
  document.documentElement.setAttribute('data-palette', config.colorPalette || 'default');
  document.body.style.fontSize = (config.fontSize || 14) + 'px';
  setLanguage(config.language || 'ptbr');
}

// Listeners for settings
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

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    v('emissao').valueAsDate = new Date();
    updateSaldo();
    updateOrcamentoPreview();
    
    // Load saved settings
    try {
      console.log('Carregando configurações iniciais...');
      const res = await fetch('/api/config');
      const data = await res.json();
      
      if (res.ok) {
        currentConfig = data;
        console.log('Configurações iniciais carregadas:', currentConfig);
        applyConfig(currentConfig);
        updatePreformSelectors();
        updateUserFormFields();
        updateAllTexts();
      } else {
        console.log('Usando configurações padrão');
      }
    } catch (e) {
      console.error('Erro ao carregar configurações iniciais:', e);
      console.log('Usando configurações padrão');
    }
});

// Global functions
window.insertPreform = insertPreform;
window.removePreform = removePreform;

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

window.toggleConfigGroup = toggleConfigGroup;