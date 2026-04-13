/* =========================================
   FUT DO IF — script.js (Tela 1)
   ========================================= */

window.addEventListener('DOMContentLoaded', () => {

  // Elementos
  const txtNomes  = document.getElementById('nomes');
  const inputPor  = document.getElementById('porTime');
  const btnEmb    = document.getElementById('btnEmbaralhar');
  const btnLimpar = document.getElementById('btnLimpar');
  const msgErro   = document.getElementById('msgErro');
  const contador  = document.getElementById('contador');
  const numHint   = document.getElementById('numHint');
  const numMenos  = document.getElementById('numMenos');
  const numMais   = document.getElementById('numMais');

  // ---- Contador de jogadores em tempo real ----
  function atualizarContador() {
    const nomes = lerNomes();
    const n = nomes.length;
    contador.textContent = n === 0 ? 'nenhum jogador' : n === 1 ? '1 jogador' : `${n} jogadores`;
    contador.classList.toggle('contador-ok', n >= 2);
  }

  function atualizarHint() {
    const v = parseInt(inputPor.value) || 4;
    numHint.textContent = `Times de ${v} jogador${v !== 1 ? 'es' : ''}`;
  }

  // ---- Botões + e - ----
  numMenos.addEventListener('click', () => {
    const v = parseInt(inputPor.value) || 4;
    if (v > 1) { inputPor.value = v - 1; atualizarHint(); }
  });

  numMais.addEventListener('click', () => {
    const v = parseInt(inputPor.value) || 4;
    if (v < 20) { inputPor.value = v + 1; atualizarHint(); }
  });

  txtNomes.addEventListener('input', atualizarContador);
  inputPor.addEventListener('input', atualizarHint);

  // ---- Embaralhar (Fisher-Yates) ----
  function embaralhar(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- Lê nomes da textarea ----
  function lerNomes() {
    return txtNomes.value
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
  }

  // ---- Erro ----
  function mostrarErro(msg) {
    msgErro.textContent = msg;
    msgErro.classList.remove('hidden');
    setTimeout(() => msgErro.classList.add('hidden'), 3000);
  }

  // ---- Inicia o jogo ----
  function iniciarJogo(nomes) {
    const porTime = parseInt(inputPor.value) || 4;
    if (nomes.length < 2) {
      mostrarErro('⚠️ Adicione pelo menos 2 jogadores!');
      return;
    }
    localStorage.removeItem('pelada_estado');
    localStorage.setItem('pelada_jogadores', JSON.stringify(nomes));
    localStorage.setItem('pelada_porTime', porTime);
    window.location.href = 'jogo.html';
  }

  // ---- Eventos dos botões ----
  btnEmb.addEventListener('click', () => iniciarJogo(embaralhar(lerNomes())));

  btnLimpar.addEventListener('click', () => {
    txtNomes.value = '';
    msgErro.classList.add('hidden');
    atualizarContador();
    txtNomes.focus();
  });

  // ---- Restaura porTime salvo ----
  const por = localStorage.getItem('pelada_porTime');
  if (por) { inputPor.value = por; }
  atualizarHint();
  atualizarContador();

});