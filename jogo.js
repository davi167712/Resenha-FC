/* =========================================
   FUT DO IF — jogo.js
   ========================================= */

// ----- Estado global -----
let timeA   = [];
let timeB   = [];
let fila    = [];
let golsA   = 0;
let golsB   = 0;
let porTime = 5;
let vitoriasSaida = 3;
let tempoJogo = 7;
let historico = {};

// =============================================
// PERSISTÊNCIA
// =============================================

function salvarEstado() {
  localStorage.setItem('pelada_estado',    JSON.stringify({ timeA, timeB, fila, golsA, golsB }));
  localStorage.setItem('pelada_historico', JSON.stringify(historico));
}

function carregarHistorico() {
  const h = localStorage.getItem('pelada_historico');
  historico = h ? JSON.parse(h) : {};
}

function registrarGolNoHistorico(nome) {
  historico[nome] = (historico[nome] || 0) + 1;
}

function desfazerGolNoHistorico(nome) {
  if (historico[nome] > 0) historico[nome]--;
}

// =============================================
// INICIALIZAÇÃO
// =============================================

function criarJogador(nome) {
  return { nome, gols: 0, jogos: 0, vitorias: 0 };
}

function migrarJogador(j) {
  return {
    nome:     j.nome     || '',
    gols:     j.gols     || 0,
    jogos:    j.jogos    || 0,
    vitorias: j.vitorias || 0,
  };
}

function carregarDados() {
  carregarHistorico();
  porTime       = parseInt(localStorage.getItem('pelada_porTime')       || '5');
  vitoriasSaida = parseInt(localStorage.getItem('pelada_vitoriasSaida') || '3');
  tempoJogo     = parseInt(localStorage.getItem('pelada_tempoJogo')     || '7');

  const estadoSalvo = localStorage.getItem('pelada_estado');
  if (estadoSalvo) {
    const e = JSON.parse(estadoSalvo);
    timeA = (e.timeA || []).map(migrarJogador);
    timeB = (e.timeB || []).map(migrarJogador);
    fila  = (e.fila  || []).map(migrarJogador);
    golsA = e.golsA || 0;
    golsB = e.golsB || 0;
    return;
  }

  const jogadores = JSON.parse(localStorage.getItem('pelada_jogadores') || '[]');
  if (jogadores.length === 0) {
    window.location.href = 'index.html';
    return;
  }

  timeA = [];
  timeB = [];
  fila  = [];

  for (let i = 0; i < jogadores.length; i++) {
    const j = criarJogador(jogadores[i]);
    if      (i < porTime)     timeA.push(j);
    else if (i < porTime * 2) timeB.push(j);
    else                      fila.push(j);
  }

  salvarEstado();
}

// =============================================
// CONTADORES DE PARTIDA
// =============================================

function contarJogos(time)    { time.forEach(j => j.jogos++); }
function contarVitorias(time) { time.forEach(j => j.vitorias++); }

// =============================================
// RENDERIZAÇÃO
// =============================================

function renderTudo() {
  renderTime('listaA', timeA, 'A');
  renderTime('listaB', timeB, 'B');
  renderFila();
  renderPlacar();
  renderArtilharia();
}

function renderTime(idLista, time, qual) {
  const lista = document.getElementById(idLista);
  lista.innerHTML = '';

  if (time.length === 0) {
    lista.innerHTML = '<li style="color:var(--txt-3);font-style:italic;font-size:.9rem;">Sem jogadores</li>';
    return;
  }

  time.forEach((jogador, idx) => {
    const li = document.createElement('li');
    li.className = 'jogador-item';
    li.innerHTML = `
      <span class="jogador-nome">${jogador.nome}</span>
      <span class="gols-badge">⚽ ${jogador.gols}</span>
      <span class="stat-badge">🎮 ${jogador.jogos}j</span>
      <span class="stat-badge stat-vit">🏆 ${jogador.vitorias}v</span>
      <button class="btn-gol"   data-time="${qual}" data-idx="${idx}">+ GOL</button>
      <button class="btn-rmgol" data-time="${qual}" data-idx="${idx}" ${jogador.gols === 0 ? 'disabled' : ''}>− GOL</button>
      <button class="btn-sair"  data-time="${qual}" data-idx="${idx}">SAIR</button>
    `;
    lista.appendChild(li);
  });
}

function renderFila() {
  const lista = document.getElementById('filaLista');
  const vazia = document.getElementById('filaVazia');
  lista.innerHTML = '';

  if (fila.length === 0) {
    vazia.classList.remove('hidden');
    return;
  }

  vazia.classList.add('hidden');
  fila.forEach((j, idx) => {
    const li = document.createElement('li');
    li.className = 'fila-jogador';
    li.innerHTML = `
      <span class="fila-pos">${idx + 1}º</span>
      <span class="fila-nome">${j.nome}</span>
      <span class="stat-badge">🎮 ${j.jogos}j</span>
      <span class="stat-badge stat-vit">🏆 ${j.vitorias}v</span>
    `;
    lista.appendChild(li);
  });
}

function renderPlacar() {
  const elA = document.getElementById('golsA');
  const elB = document.getElementById('golsB');
  const antA = elA.textContent;
  const antB = elB.textContent;
  elA.textContent = golsA;
  elB.textContent = golsB;
  if (antA !== String(golsA)) animarPlacar(elA);
  if (antB !== String(golsB)) animarPlacar(elB);
}

function animarPlacar(el) {
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = 'pulse-num .35s ease'; });
}

function renderArtilharia() {
  const lista = document.getElementById('artilhariaLista');
  if (!lista) return;
  lista.innerHTML = '';

  [...timeA, ...timeB, ...fila].forEach(j => {
    if (!(j.nome in historico)) historico[j.nome] = 0;
  });

  const ranking = Object.entries(historico)
    .sort((a, b) => b[1] - a[1])
    .filter(([, gols]) => gols > 0);

  if (ranking.length === 0) {
    lista.innerHTML = '<li class="artilharia-vazia">Nenhum gol registrado ainda</li>';
    return;
  }

  ranking.forEach(([nome, gols], idx) => {
    const li = document.createElement('li');
    li.className = 'artilharia-item';
    const medalha = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`;
    li.innerHTML = `
      <span class="art-pos">${medalha}</span>
      <span class="art-nome">${nome}</span>
      <span class="art-gols">⚽ ${gols} gol${gols !== 1 ? 's' : ''}</span>
    `;
    lista.appendChild(li);
  });
}

// =============================================
// AÇÕES DE JOGADORES
// =============================================

function adicionarGol(qual, idx) {
  const time = qual === 'A' ? timeA : timeB;
  time[idx].gols++;
  if (qual === 'A') golsA++; else golsB++;
  registrarGolNoHistorico(time[idx].nome);
  salvarEstado();
  renderTudo();
}

function removerGol(qual, idx) {
  const time = qual === 'A' ? timeA : timeB;
  if (time[idx].gols <= 0) return;
  time[idx].gols--;
  if (qual === 'A') golsA = Math.max(0, golsA - 1);
  else              golsB = Math.max(0, golsB - 1);
  desfazerGolNoHistorico(time[idx].nome);
  salvarEstado();
  renderTudo();
}

function sairTime(qual, idx) {
  const time = qual === 'A' ? timeA : timeB;
  const removido = time.splice(idx, 1)[0];
  removido.gols = 0;
  fila.push(removido);
  if (fila.length > 0) {
    time.push(fila.shift());
  }
  salvarEstado();
  renderTudo();
}

function resetarPlacar() {
  golsA = 0;
  golsB = 0;
}

// =============================================
// BOTÕES DE RESULTADO
// =============================================

document.getElementById('venceuA').addEventListener('click', () => {
  contarJogos(timeA);
  contarJogos(timeB);
  contarVitorias(timeA);
  timeB.forEach(j => { j.gols = 0; fila.push(j); });
  timeB = [];
  while (timeB.length < porTime && fila.length > 0) timeB.push(fila.shift());
  timeA.forEach(j => j.gols = 0);
  resetarPlacar();
  if (window.reiniciarCrono) window.reiniciarCrono();
  salvarEstado();
  renderTudo();
});

document.getElementById('venceuB').addEventListener('click', () => {
  contarJogos(timeA);
  contarJogos(timeB);
  contarVitorias(timeB);
  timeA.forEach(j => { j.gols = 0; fila.push(j); });
  timeA = [];
  while (timeA.length < porTime && fila.length > 0) timeA.push(fila.shift());
  timeB.forEach(j => j.gols = 0);
  resetarPlacar();
  if (window.reiniciarCrono) window.reiniciarCrono();
  salvarEstado();
  renderTudo();
});

document.getElementById('empate').addEventListener('click', () => {
  contarJogos(timeA);
  contarJogos(timeB);
  const pool = [...timeA, ...timeB].map(j => ({ ...j, gols: 0 }));
  timeA = [];
  timeB = [];
  while (timeA.length < porTime && fila.length > 0) timeA.push(fila.shift());
  while (timeB.length < porTime && fila.length > 0) timeB.push(fila.shift());
  pool.sort((a, b) => a.jogos - b.jogos);
  let pi = 0;
  while (timeA.length < porTime && pi < pool.length) timeA.push(pool[pi++]);
  while (timeB.length < porTime && pi < pool.length) timeB.push(pool[pi++]);
  while (pi < pool.length) fila.push(pool[pi++]);
  resetarPlacar();
  if (window.reiniciarCrono) window.reiniciarCrono();
  salvarEstado();
  renderTudo();
});

document.getElementById('btnReset').addEventListener('click', () => {
  timeA.forEach(j => j.gols = 0);
  timeB.forEach(j => j.gols = 0);
  resetarPlacar();
  salvarEstado();
  renderTudo();
});

document.getElementById('btnLimparHistorico').addEventListener('click', () => {
  if (confirm('Apagar todo o histórico de gols? Isso não pode ser desfeito.')) {
    historico = {};
    localStorage.removeItem('pelada_historico');
    renderArtilharia();
  }
});

document.getElementById('btnZerarStats').addEventListener('click', () => {
  if (confirm('Zerar jogos e vitórias de todos? Os gols da artilharia serão mantidos.')) {
    const zerar = j => { j.jogos = 0; j.vitorias = 0; return j; };
    timeA = timeA.map(zerar);
    timeB = timeB.map(zerar);
    fila  = fila.map(zerar);
    salvarEstado();
    renderTudo();
  }
});

// =============================================
// DELEGAÇÃO DE EVENTOS
// =============================================

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-gol'))
    adicionarGol(e.target.dataset.time, parseInt(e.target.dataset.idx));
  if (e.target.classList.contains('btn-rmgol'))
    removerGol(e.target.dataset.time, parseInt(e.target.dataset.idx));
  if (e.target.classList.contains('btn-sair'))
    sairTime(e.target.dataset.time, parseInt(e.target.dataset.idx));
});

// =============================================
// INICIALIZAÇÃO
// =============================================

window.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  renderTudo();
});

// =============================================
// CRONÔMETRO
// =============================================

(function () {
  const TEMPO_TOTAL = (parseInt(localStorage.getItem('pelada_tempoJogo')) || 7) * 60;
  let segundos = TEMPO_TOTAL;
  let intervalo = null;
  let rodando = false;

  const display = document.getElementById('cronoDisplay');
  const btnIni  = document.getElementById('cronoBtnIniciar');
  const btnPau  = document.getElementById('cronoBtnPausar');
  const btnRes  = document.getElementById('cronoBtnReset');

  function formatar(s) {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${String(ss).padStart(2, '0')}`;
  }

  function atualizar() {
    display.textContent = formatar(segundos);
    display.classList.toggle('urgente', segundos <= 60 && segundos > 0);
  }

  function iniciar() {
    if (rodando || segundos <= 0) return;
    rodando = true;
    btnIni.disabled = true;
    btnPau.disabled = false;
    intervalo = setInterval(() => {
      segundos--;
      atualizar();
      if (segundos <= 0) {
        clearInterval(intervalo);
        rodando = false;
        btnIni.disabled = true;
        btnPau.disabled = true;
        display.classList.add('urgente');
        // Beep
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          [0, 0.3, 0.6].forEach(t => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
            osc.start(ctx.currentTime + t);
            osc.stop(ctx.currentTime + t + 0.25);
          });
        } catch (e) {}
      }
    }, 1000);
  }

  function pausar() {
    if (!rodando) return;
    clearInterval(intervalo);
    rodando = false;
    btnIni.disabled = false;
    btnPau.disabled = true;
  }

  function reiniciar() {
    clearInterval(intervalo);
    rodando = false;
    segundos = TEMPO_TOTAL;
    btnIni.disabled = false;
    btnPau.disabled = true;
    display.classList.remove('urgente');
    atualizar();
  }

  btnIni.addEventListener('click', iniciar);
  btnPau.addEventListener('click', pausar);
  btnRes.addEventListener('click', reiniciar);
  window.reiniciarCrono = reiniciar;

  atualizar();
})();
// =============================================
// RELATÓRIO PDF
// =============================================

document.getElementById('btnRelatorio').addEventListener('click', gerarRelatorio);

function gerarRelatorio() {
  // Carrega jsPDF dinamicamente
  if (window.jspdf) {
    _gerarPDF();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = _gerarPDF;
  script.onerror = () => alert('Erro ao carregar biblioteca PDF. Verifique sua conexão.');
  document.head.appendChild(script);
}

function _gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const W = 210;
  const margem = 14;
  const larguraUtil = W - margem * 2;

  // ------ Coleta todos os jogadores ------
  const todos = [...timeA, ...timeB, ...fila];

  // Monta mapa de gols do histórico (acumulado)
  const golsHist = historico || {};

  // Une stats: jogos/vitorias da sessão + gols do histórico
  const jogadoresMap = {};
  todos.forEach(j => {
    jogadoresMap[j.nome] = {
      nome:     j.nome,
      jogos:    j.jogos    || 0,
      vitorias: j.vitorias || 0,
      gols:     golsHist[j.nome] || 0,
    };
  });

  // Também inclui quem está no histórico mas não está nos times ativos
  Object.keys(golsHist).forEach(nome => {
    if (!jogadoresMap[nome]) {
      jogadoresMap[nome] = { nome, jogos: 0, vitorias: 0, gols: golsHist[nome] || 0 };
    }
  });

  // Regra de pontos: GOL = 1pt, VITÓRIA = 2pt
  const lista = Object.values(jogadoresMap).map(j => ({
    ...j,
    pts:       j.gols * 1 + j.vitorias * 2,
    mediagj:   j.jogos > 0 ? (j.gols / j.jogos) : 0,
    aproveit:  j.jogos > 0 ? ((j.vitorias / j.jogos) * 100) : 0,
  }));

  // Ordena por pontos desc, depois gols desc
  lista.sort((a, b) => b.pts - a.pts || b.gols - a.gols);

  // ------ Cabeçalho ------
  // Fundo verde escuro
  doc.setFillColor(27, 94, 32);
  doc.rect(0, 0, W, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Relatório - Bora Pro Jogo', margem, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR');
  doc.text(`Gerado em: ${data}, ${hora}`, margem, 22);

  // ------ Legenda de pontos ------
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Pontuação: Gol = 1 pt  |  Vitória = 2 pts', margem, 34);

  // ------ Tabela ------
  const colunas = [
    { label: 'Jogador',     key: 'nome',     w: 38, align: 'left'  },
    { label: 'Pts',         key: 'pts',      w: 14, align: 'center'},
    { label: 'Gols',        key: 'gols',     w: 16, align: 'center'},
    { label: 'Vitórias',    key: 'vitorias', w: 20, align: 'center'},
    { label: 'Jogos',       key: 'jogos',    w: 16, align: 'center'},
    { label: 'Média G/J',   key: 'mediagj',  w: 22, align: 'center'},
    { label: 'Aproveit.',   key: 'aproveit', w: 22, align: 'center'},
  ];

  const tabelaX    = margem;
  const headerY    = 38;
  const rowH       = 8;
  const headerH    = 9;
  const fontSize   = 8.5;

  // Cabeçalho da tabela
  doc.setFillColor(46, 125, 50);
  doc.rect(tabelaX, headerY, larguraUtil, headerH, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);

  let cx = tabelaX;
  colunas.forEach(col => {
    const tx = col.align === 'center' ? cx + col.w / 2 : cx + 2;
    doc.text(col.label, tx, headerY + 6, { align: col.align === 'center' ? 'center' : 'left' });
    cx += col.w;
  });

  // Linhas dos jogadores
  doc.setFont('helvetica', 'normal');
  let y = headerY + headerH;

  lista.forEach((j, i) => {
    // Zebra
    if (i % 2 === 0) {
      doc.setFillColor(240, 248, 240);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(tabelaX, y, larguraUtil, rowH, 'F');

    // Destaque ouro para 1º lugar
    doc.setTextColor(i === 0 ? 180 : 40, i === 0 ? 120 : 40, i === 0 ? 0 : 40);

    doc.setFontSize(fontSize);
    let rx = tabelaX;
    colunas.forEach(col => {
      let val = j[col.key];
      if (col.key === 'mediagj')  val = val.toFixed(2);
      if (col.key === 'aproveit') val = val.toFixed(1) + '%';
      const tx = col.align === 'center' ? rx + col.w / 2 : rx + 2;
      doc.text(String(val), tx, y + 5.5, { align: col.align === 'center' ? 'center' : 'left' });
      rx += col.w;
    });

    // Linha divisória leve
    doc.setDrawColor(200, 230, 200);
    doc.line(tabelaX, y + rowH, tabelaX + larguraUtil, y + rowH);

    y += rowH;
  });

  // Borda da tabela
  doc.setDrawColor(46, 125, 50);
  doc.setLineWidth(0.4);
  doc.rect(tabelaX, headerY, larguraUtil, headerH + rowH * lista.length);

  // ------ Rodapé ------
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Fut do IF — gerado automaticamente', W / 2, 290, { align: 'center' });

  doc.save('relatorio_bora_pro_jogo.pdf');
}