/* =========================================
   FUT DO IF — script.js (Tela 1)
   ========================================= */

window.addEventListener('DOMContentLoaded', () => {

  // ---- Elementos ----
  const txtNomes       = document.getElementById('nomes');
  const inputPor       = document.getElementById('porTime');
  const inputVitorias  = document.getElementById('vitoriasSaida');
  const inputTempo     = document.getElementById('tempoJogo');
  const btnEmb         = document.getElementById('btnEmbaralhar');
  const btnLimpar      = document.getElementById('btnLimpar');
  const msgErro        = document.getElementById('msgErro');
  const contador       = document.getElementById('contador');

  // ---- Helpers de num-control ----
  function criarControle(inputEl, btnMenos, btnMais) {
    document.getElementById(btnMenos).addEventListener('click', () => {
      const v = parseInt(inputEl.value) || 1;
      const min = parseInt(inputEl.min) || 1;
      if (v > min) inputEl.value = v - 1;
    });
    document.getElementById(btnMais).addEventListener('click', () => {
      const v = parseInt(inputEl.value) || 1;
      const max = parseInt(inputEl.max) || 99;
      if (v < max) inputEl.value = v + 1;
    });
  }

  criarControle(inputPor,      'numMenos',   'numMais');
  criarControle(inputVitorias, 'vitMenos',   'vitMais');
  criarControle(inputTempo,    'tempoMenos', 'tempoMais');

  // ---- Contador de jogadores em tempo real ----
  function lerNomes() {
    return txtNomes.value.split('\n').map(n => n.trim()).filter(n => n.length > 0);
  }

  function atualizarContador() {
    const n = lerNomes().length;
    contador.textContent = n === 0 ? 'nenhum jogador' : n === 1 ? '1 jogador' : `${n} jogadores`;
    contador.classList.toggle('contador-ok', n >= 2);
  }

  txtNomes.addEventListener('input', atualizarContador);

  // ---- Embaralha (Fisher-Yates) ----
  function embaralhar(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- Erro ----
  function mostrarErro(msg) {
    msgErro.textContent = msg;
    msgErro.classList.remove('hidden');
    setTimeout(() => msgErro.classList.add('hidden'), 3000);
  }

  // ---- Inicia o jogo ----
  function iniciarJogo(nomes) {
    if (nomes.length < 2) {
      mostrarErro('⚠️ Adicione pelo menos 2 jogadores!');
      return;
    }
    localStorage.removeItem('pelada_estado');
    localStorage.setItem('pelada_jogadores',    JSON.stringify(nomes));
    localStorage.setItem('pelada_porTime',       parseInt(inputPor.value)      || 4);
    localStorage.setItem('pelada_vitoriasSaida', parseInt(inputVitorias.value) || 3);
    localStorage.setItem('pelada_tempoJogo',     parseInt(inputTempo.value)    || 7);
    window.location.href = 'jogo.html';
  }

  // ---- Botões ----
  btnEmb.addEventListener('click', () => iniciarJogo(embaralhar(lerNomes())));

  btnLimpar.addEventListener('click', () => {
    txtNomes.value = '';
    atualizarContador();
    txtNomes.focus();
  });

  // ---- Restaura configurações salvas ----
  const porSalvo  = localStorage.getItem('pelada_porTime');
  const vitSalvo  = localStorage.getItem('pelada_vitoriasSaida');
  const tmpSalvo  = localStorage.getItem('pelada_tempoJogo');
  if (porSalvo) inputPor.value      = porSalvo;
  if (vitSalvo) inputVitorias.value = vitSalvo;
  if (tmpSalvo) inputTempo.value    = tmpSalvo;

  atualizarContador();
});