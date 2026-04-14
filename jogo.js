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

// =============================================
// ENGINE DE SONS
// =============================================
const Sons = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function beep({ freq = 440, dur = 0.2, vol = 0.4, type = 'sine', delay = 0 } = {}) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + dur);
    } catch(e) {}
  }

  return {
    // Apito longo ao acabar o tempo
    apito() {
      beep({ freq: 900, dur: 0.6, vol: 0.5, type: 'square' });
      beep({ freq: 900, dur: 0.6, vol: 0.5, type: 'square', delay: 0.7 });
      beep({ freq: 900, dur: 1.0, vol: 0.5, type: 'square', delay: 1.4 });
    },
    // Bip curto nos últimos 5 segundos
    bipContagem() {
      beep({ freq: 660, dur: 0.08, vol: 0.3, type: 'square' });
    },
    // Som urgente nos últimos 30s (bip suave)
    bipUrgente() {
      beep({ freq: 520, dur: 0.06, vol: 0.15, type: 'sine' });
    },
    // Gol — torcida simulada com ruído crescente
    gol() {
      try {
        const c = getCtx();
        // Acorde de vitória
        [523, 659, 784, 1047].forEach((f, i) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.connect(gain); gain.connect(c.destination);
          osc.frequency.value = f;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0, c.currentTime + i * 0.05);
          gain.gain.linearRampToValueAtTime(0.3, c.currentTime + i * 0.05 + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.05 + 0.6);
          osc.start(c.currentTime + i * 0.05);
          osc.stop(c.currentTime + i * 0.05 + 0.7);
        });
      } catch(e) {}
    },
    // Vitória
    vitoria() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => {
        beep({ freq: f, dur: 0.18, vol: 0.35, type: 'sine', delay: i * 0.12 });
      });
    },
    // Empate — som neutro descendente
    empate() {
      beep({ freq: 600, dur: 0.2, vol: 0.3, type: 'sine' });
      beep({ freq: 450, dur: 0.2, vol: 0.3, type: 'sine', delay: 0.22 });
    },
    // Troca de jogador
    troca() {
      beep({ freq: 400, dur: 0.08, vol: 0.2, type: 'sine' });
      beep({ freq: 500, dur: 0.08, vol: 0.2, type: 'sine', delay: 0.1 });
    }
  };
})();


let tempoJogo = 7;
let historico = {};

// Contadores de vitórias CONSECUTIVAS do time atual
let vitTimeA = 0;
let vitTimeB = 0;

// =============================================
// PERSISTÊNCIA
// =============================================

function salvarEstado() {
  localStorage.setItem('pelada_estado',    JSON.stringify({ timeA, timeB, fila, golsA, golsB, vitTimeA, vitTimeB }));
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
    timeA    = (e.timeA || []).map(migrarJogador);
    timeB    = (e.timeB || []).map(migrarJogador);
    fila     = (e.fila  || []).map(migrarJogador);
    golsA    = e.golsA    || 0;
    golsB    = e.golsB    || 0;
    vitTimeA = e.vitTimeA || 0;
    vitTimeB = e.vitTimeB || 0;
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
  renderVitoriasTimes();
}

function renderVitoriasTimes() {
  const elA = document.getElementById('vitTimesA');
  const elB = document.getElementById('vitTimesB');
  if (elA) elA.textContent = `${vitTimeA}/${vitoriasSaida}`;
  if (elB) elB.textContent = `${vitTimeB}/${vitoriasSaida}`;
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
      <span class="gols-badge">⚽ ${j.gols || 0}</span>
      <button class="btn-gol-fila" data-idx="${idx}">+ GOL</button>
      <button class="btn-rmgol-fila" data-idx="${idx}" ${(j.gols||0)===0?"disabled":""}>− GOL</button>
      <button class="btn-sair-fila" data-idx="${idx}">SAIR</button>
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
  Sons.gol();
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
  Sons.troca();
  const time = qual === 'A' ? timeA : timeB;
  const removido = time.splice(idx, 1)[0];
  removido.gols = 0;
  // Jogador sai da pelada completamente (não vai para a fila)
  if (fila.length > 0) {
    time.push(fila.shift());
  }
  salvarEstado();
  renderTudo();
}

function sairFila(idx) {
  Sons.troca();
  fila.splice(idx, 1);
  salvarEstado();
  renderTudo();
}

function adicionarGolFila(idx) {
  Sons.gol();
  fila[idx].gols = (fila[idx].gols || 0) + 1;
  historico[fila[idx].nome] = (historico[fila[idx].nome] || 0) + 1;
  salvarEstado();
  renderTudo();
}

function removerGolFila(idx) {
  if (fila[idx].gols > 0) {
    fila[idx].gols--;
    if (historico[fila[idx].nome] > 0) historico[fila[idx].nome]--;
    salvarEstado();
    renderTudo();
  }
}

function resetarPlacar() {
  golsA = 0;
  golsB = 0;
}

// Botões + e - do placar direto
document.getElementById('maisA').addEventListener('click', () => {
  golsA++;
  renderPlacar();
  atualizarBotoesPlacar();
});
document.getElementById('menosA').addEventListener('click', () => {
  if (golsA > 0) { golsA--; renderPlacar(); atualizarBotoesPlacar(); }
});
document.getElementById('maisB').addEventListener('click', () => {
  golsB++;
  renderPlacar();
  atualizarBotoesPlacar();
});
document.getElementById('menosB').addEventListener('click', () => {
  if (golsB > 0) { golsB--; renderPlacar(); atualizarBotoesPlacar(); }
});

function atualizarBotoesPlacar() {
  document.getElementById('menosA').disabled = golsA === 0;
  document.getElementById('menosB').disabled = golsB === 0;
}

// =============================================
// BOTÕES DE RESULTADO
// =============================================

document.getElementById('venceuA').addEventListener('click', () => {
  Sons.vitoria();
  contarJogos(timeA);
  contarJogos(timeB);
  contarVitorias(timeA);

  vitTimeA++;
  vitTimeB = 0;

  // Time B perde e vai pra fila
  timeB.forEach(j => { j.gols = 0; fila.push(j); });
  timeB = [];
  timeA.forEach(j => j.gols = 0);

  // Se time A atingiu o limite de vitórias, ele também sai
  if (vitTimeA >= vitoriasSaida) {
    vitTimeA = 0;
    timeA.forEach(j => { j.gols = 0; fila.push(j); });
    timeA = [];
  }

  // Agora repõe os times com quem está na fila
  while (timeA.length < porTime && fila.length > 0) timeA.push(fila.shift());
  while (timeB.length < porTime && fila.length > 0) timeB.push(fila.shift());

  salvarHistoricoPelada('Com Camisa', golsA, golsB, timeA, timeB);
  resetarPlacar();
  if (window.reiniciarCrono) window.reiniciarCrono();
  salvarEstado();
  renderTudo();
});

document.getElementById('venceuB').addEventListener('click', () => {
  Sons.vitoria();
  contarJogos(timeA);
  contarJogos(timeB);
  contarVitorias(timeB);

  vitTimeB++;
  vitTimeA = 0;

  // Time A perde e vai pra fila
  timeA.forEach(j => { j.gols = 0; fila.push(j); });
  timeA = [];
  timeB.forEach(j => j.gols = 0);

  // Se time B atingiu o limite de vitórias, ele também sai
  if (vitTimeB >= vitoriasSaida) {
    vitTimeB = 0;
    timeB.forEach(j => { j.gols = 0; fila.push(j); });
    timeB = [];
  }

  // Agora repõe os times com quem está na fila
  while (timeA.length < porTime && fila.length > 0) timeA.push(fila.shift());
  while (timeB.length < porTime && fila.length > 0) timeB.push(fila.shift());

  salvarHistoricoPelada('Sem Camisa', golsA, golsB, timeA, timeB);
  resetarPlacar();
  if (window.reiniciarCrono) window.reiniciarCrono();
  salvarEstado();
  renderTudo();
});

document.getElementById('empate').addEventListener('click', () => {
  Sons.empate();
  contarJogos(timeA);
  contarJogos(timeB);
  // Empate zera contadores de vitórias dos 2 times
  vitTimeA = 0;
  vitTimeB = 0;
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
    vitTimeA = 0; vitTimeB = 0;
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
  if (e.target.classList.contains('btn-sair-fila'))
    sairFila(parseInt(e.target.dataset.idx));
  if (e.target.classList.contains('btn-gol-fila'))
    adicionarGolFila(parseInt(e.target.dataset.idx));
  if (e.target.classList.contains('btn-rmgol-fila'))
    removerGolFila(parseInt(e.target.dataset.idx));
});

// =============================================
// INICIALIZAÇÃO
// =============================================

window.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  renderTudo();
  // Pedir permissão de notificação logo ao abrir
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
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
    display.classList.toggle('urgente', segundos <= 30 && segundos > 0);
    if (rodando && segundos <= 5 && segundos > 0) Sons.bipContagem();
    else if (rodando && segundos <= 30 && segundos > 0 && segundos % 10 === 0) Sons.bipUrgente();
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
        Sons.apito();
        if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600]);
        // Notificação do navegador
        if (Notification.permission === 'granted') {
          new Notification('⚽ FUT DO IF', { body: 'O tempo acabou! Hora de definir o resultado.' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(p => {
            if (p === 'granted') new Notification('⚽ FUT DO IF', { body: 'O tempo acabou! Hora de definir o resultado.' });
          });
        }
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
  if (window.jspdf) { _gerarPDF(); return; }
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = _gerarPDF;
  script.onerror = () => alert('Erro ao carregar biblioteca PDF.');
  document.head.appendChild(script);
}

function _gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, margem = 14, util = W - margem * 2;

  // ── Coleta dados ──
  const todos = [...timeA, ...timeB, ...fila];
  const mapa = {};
  todos.forEach(j => {
    mapa[j.nome] = { nome: j.nome, jogos: j.jogos||0, vitorias: j.vitorias||0, gols: historico[j.nome]||0 };
  });
  Object.keys(historico).forEach(nome => {
    if (!mapa[nome]) mapa[nome] = { nome, jogos:0, vitorias:0, gols: historico[nome]||0 };
  });

  const lista = Object.values(mapa).map(j => ({
    ...j,
    pts:      j.gols + j.vitorias * 2,
    mediagj:  j.jogos > 0 ? j.gols / j.jogos : 0,
    aproveit: j.jogos > 0 ? (j.vitorias / j.jogos) * 100 : 0,
  })).sort((a,b) => b.pts - a.pts || b.gols - a.gols);

  // ══════════════════════════════════════
  // CABEÇALHO — faixa escura com logo texto
  // ══════════════════════════════════════
  // Fundo preto profundo
  doc.setFillColor(10, 10, 20);
  doc.rect(0, 0, W, 35, 'F');

  // Listra verde lateral esquerda
  doc.setFillColor(46, 160, 67);
  doc.rect(0, 0, 5, 35, 'F');

  // Título
  doc.setTextColor(46, 160, 67);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FUT DO IF', 12, 16);

  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Relatório de Desempenho', 12, 24);

  // Data alinhada à direita
  const agora = new Date();
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(`${agora.toLocaleDateString('pt-BR')} — ${agora.toLocaleTimeString('pt-BR')}`, W - margem, 24, { align: 'right' });

  // Linha separadora verde
  doc.setDrawColor(46, 160, 67);
  doc.setLineWidth(0.6);
  doc.line(0, 35, W, 35);

  // ══════════════════════════════════════
  // CARDS DE RESUMO  (3 blocos rápidos)
  // ══════════════════════════════════════
  const cardY = 39;
  const cardH = 16;
  const cardW = (util - 8) / 3;

  const totalGols     = lista.reduce((s, j) => s + j.gols, 0);
  const totalJogos    = lista.reduce((s, j) => s + j.jogos, 0);
  const totalVitorias = lista.reduce((s, j) => s + j.vitorias, 0);

  const cards = [
    { label: 'Total de Gols',    valor: totalGols,     cor: [46, 160, 67]  },
    { label: 'Partidas jogadas', valor: Math.round(totalJogos / (lista.length || 1)), cor: [41, 121, 255] },
  ];

  cards.forEach((c, i) => {
    const cx = margem + i * (cardW + 4);
    doc.setFillColor(...c.cor.map(v => Math.round(v * 0.15 + 10)));
    doc.roundedRect(cx, cardY, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(...c.cor);
    doc.setLineWidth(0.5);
    doc.roundedRect(cx, cardY, cardW, cardH, 2, 2, 'S');
    doc.setTextColor(...c.cor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(String(c.valor), cx + cardW / 2, cardY + 9, { align: 'center' });
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(c.label, cx + cardW / 2, cardY + 13.5, { align: 'center' });
  });

  // ══════════════════════════════════════
  // LEGENDA
  // ══════════════════════════════════════
  doc.setTextColor(130, 130, 130);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Pts = Gol (1pt) + Vitória (2pts)', margem, cardY + cardH + 6);

  // ══════════════════════════════════════
  // TABELA
  // ══════════════════════════════════════
  const tY   = cardY + cardH + 10;
  const rowH = 7.5;
  const hH   = 8.5;

  const cols = [
    { label: '#',          key: 'rank',     w: 8,  align: 'center' },
    { label: 'Jogador',    key: 'nome',     w: 42, align: 'left'   },
    { label: 'Pts',        key: 'pts',      w: 14, align: 'center' },
    { label: 'Gols',       key: 'gols',     w: 14, align: 'center' },
    { label: 'Vitórias',   key: 'vitorias', w: 18, align: 'center' },
    { label: 'Jogos',      key: 'jogos',    w: 14, align: 'center' },
    { label: 'Méd. G/J',   key: 'mediagj',  w: 20, align: 'center' },
    { label: 'Aproveit.',  key: 'aproveit', w: 22, align: 'center' },
  ];

  // Cabeçalho tabela
  doc.setFillColor(10, 10, 20);
  doc.rect(margem, tY, util, hH, 'F');

  // Linha verde embaixo do header
  doc.setFillColor(46, 160, 67);
  doc.rect(margem, tY + hH - 1, util, 1, 'F');

  doc.setTextColor(46, 160, 67);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  let cx = margem;
  cols.forEach(col => {
    const tx = col.align === 'center' ? cx + col.w / 2 : cx + 2;
    doc.text(col.label, tx, tY + 5.5, { align: col.align === 'center' ? 'center' : 'left' });
    cx += col.w;
  });

  // Linhas
  let y = tY + hH;
  lista.forEach((j, i) => {
    const par = i % 2 === 0;
    doc.setFillColor(par ? 18 : 24, par ? 18 : 24, par ? 30 : 36);
    doc.rect(margem, y, util, rowH, 'F');

    // Medalha 1º lugar — barra lateral dourada
    if (i === 0) {
      doc.setFillColor(255, 180, 0);
      doc.rect(margem, y, 1.5, rowH, 'F');
    }

    // Cor do texto por posição
    if (i === 0)       doc.setTextColor(255, 200, 0);
    else if (i === 1)  doc.setTextColor(190, 190, 190);
    else if (i === 2)  doc.setTextColor(180, 110, 60);
    else               doc.setTextColor(200, 200, 200);

    doc.setFont('helvetica', i < 3 ? 'bold' : 'normal');
    doc.setFontSize(8);

    let rx = margem;
    cols.forEach(col => {
      let val;
      if      (col.key === 'rank')     val = `${i + 1}º`;
      else if (col.key === 'mediagj')  val = j.mediagj.toFixed(2);
      else if (col.key === 'aproveit') val = j.aproveit.toFixed(1) + '%';
      else                             val = String(j[col.key]);
      const tx = col.align === 'center' ? rx + col.w / 2 : rx + 3;
      doc.text(val, tx, y + 5, { align: col.align === 'center' ? 'center' : 'left' });
      rx += col.w;
    });

    // Linha divisória sutil
    doc.setDrawColor(40, 40, 55);
    doc.setLineWidth(0.2);
    doc.line(margem, y + rowH, margem + util, y + rowH);

    y += rowH;
  });

  // Borda da tabela
  doc.setDrawColor(46, 160, 67);
  doc.setLineWidth(0.4);
  doc.rect(margem, tY, util, hH + rowH * lista.length);

  // ══════════════════════════════════════
  // GRÁFICO DE BARRAS — Gols por jogador
  // ══════════════════════════════════════
  const artTop = lista.filter(j => j.gols > 0).slice(0, 8);
  if (artTop.length > 0) {
    doc.addPage();

    // Cabeçalho da nova página
    doc.setFillColor(10, 10, 20);
    doc.rect(0, 0, W, 25, 'F');
    doc.setFillColor(46, 160, 67);
    doc.rect(0, 0, 5, 25, 'F');
    doc.setTextColor(46, 160, 67);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FUT DO IF', 12, 11);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Gráfico de Artilharia', 12, 19);

    const gY = 35;
    const gH = 100;
    const gW = util;
    const maxGols = Math.max(...artTop.map(j => j.gols));
    const barW = (gW - (artTop.length - 1) * 4) / artTop.length;

    // Título
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('⚽ Artilharia — Gols por jogador', margem, gY - 4);

    // Linhas guia horizontais
    doc.setDrawColor(35, 35, 50);
    doc.setLineWidth(0.2);
    for (let g = 1; g <= maxGols; g++) {
      const lineY = gY + gH - (g / maxGols) * gH;
      doc.line(margem, lineY, margem + gW, lineY);
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(6);
      doc.text(String(g), margem - 4, lineY + 1, { align: 'right' });
    }

    artTop.forEach((j, i) => {
      const bX = margem + i * (barW + 4);
      const bH = (j.gols / maxGols) * gH;
      const bY = gY + gH - bH;

      // Cor: ouro pro 1º, prata pro 2º, bronze pro 3º, verde pros demais
      const cor = i === 0 ? [255, 200, 0] : i === 1 ? [190, 190, 190] : i === 2 ? [180, 110, 60] : [46, 160, 67];

      // Fundo escuro da barra
      doc.setFillColor(20, 20, 35);
      doc.roundedRect(bX, gY, barW, gH, 1, 1, 'F');

      // Barra colorida
      doc.setFillColor(...cor);
      doc.roundedRect(bX, bY, barW, bH, 1, 1, 'F');

      // Valor em cima da barra
      doc.setTextColor(...cor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(String(j.gols), bX + barW / 2, bY - 2, { align: 'center' });

      // Nome embaixo
      doc.setTextColor(160, 160, 160);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      const nomeCorto = j.nome.length > 8 ? j.nome.slice(0, 7) + '.' : j.nome;
      doc.text(nomeCorto, bX + barW / 2, gY + gH + 5, { align: 'center' });
    });

    // Rodapé página 2
    doc.setFillColor(10, 10, 20);
    doc.rect(0, 283, W, 14, 'F');
    doc.setFillColor(46, 160, 67);
    doc.rect(0, 283, 5, 14, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Fut do IF © Relatório', W / 2, 291, { align: 'center' });
  }

  // ══════════════════════════════════════
  // RODAPÉ
  // ══════════════════════════════════════
  doc.setPage(1);
  doc.setFillColor(10, 10, 20);
  doc.rect(0, 283, W, 14, 'F');
  doc.setFillColor(46, 160, 67);
  doc.rect(0, 283, 5, 14, 'F');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Fut do IF © Relatório', W / 2, 291, { align: 'center' });

  doc.save('relatorio.pdf');
}
// =============================================
// HISTÓRICO DE PELADAS
// =============================================

function salvarHistoricoPelada(vencedor, placarA, placarB, jogadoresA, jogadoresB) {
  const historicoPeladas = JSON.parse(localStorage.getItem('pelada_historico_partidas') || '[]');
  historicoPeladas.push({
    data: new Date().toLocaleString('pt-BR'),
    vencedor,
    placarA,
    placarB,
    timeA: jogadoresA.map(j => j.nome),
    timeB: jogadoresB.map(j => j.nome),
  });
  localStorage.setItem('pelada_historico_partidas', JSON.stringify(historicoPeladas));
}

// =============================================
// COMPARTILHAR NO WHATSAPP
// =============================================

function compartilharWhatsApp() {
  const todos = [...timeA, ...timeB, ...fila];
  const artilheiros = Object.entries(historico)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maisVitorias = [...todos]
    .sort((a, b) => (b.vitorias || 0) - (a.vitorias || 0))
    .slice(0, 3);

  const data = new Date().toLocaleDateString('pt-BR');

  let texto = `⚽ *FUT DO IF — Relatório*\n📅 ${data}\n\n`;

  if (artilheiros.length > 0) {
    texto += `🏅 *Artilharia:*\n`;
    artilheiros.forEach(([nome, gols], i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
      texto += `${medal} ${nome} — ${gols} gol${gols !== 1 ? 's' : ''}\n`;
    });
    texto += '\n';
  }

  if (maisVitorias.length > 0 && maisVitorias[0].vitorias > 0) {
    texto += `🏆 *Mais vitórias:*\n`;
    maisVitorias.forEach((j, i) => {
      if (j.vitorias > 0) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
        texto += `${medal} ${j.nome} — ${j.vitorias} vitória${j.vitorias !== 1 ? 's' : ''}\n`;
      }
    });
    texto += '\n';
  }

  texto += `_Gerado pelo Fut do IF_ ⚽ ass: davi.dev`;

  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}

document.getElementById('btnRelatorio').insertAdjacentHTML('afterend',
  `<button class="btn btn-whatsapp" id="btnWhatsApp" onclick="compartilharWhatsApp()" style="background:#25D366;color:#fff;font-weight:bold;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;">📲 WhatsApp</button>`
);