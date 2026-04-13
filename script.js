/* =========================================
   PELADA MANAGER — script.js (Tela 1)
   ========================================= */
 
// Elementos
const txtNomes    = document.getElementById('nomes');
const inputPor    = document.getElementById('porTime');
const btnEmb      = document.getElementById('btnEmbaralhar');
const btnLimpar   = document.getElementById('btnLimpar');
const msgErro     = document.getElementById('msgErro');
 
// ----- Funções auxiliares -----
 
// Pega a lista de nomes da textarea (remove linhas vazias e espaços)
function lerNomes() {
  return txtNomes.value
    .split('\n')
    .map(n => n.trim())
    .filter(n => n.length > 0);
}
 
// Mostra mensagem de erro
function mostrarErro(msg) {
  msgErro.textContent = msg;
  msgErro.classList.remove('hidden');
  setTimeout(() => msgErro.classList.add('hidden'), 3000);
}
 
// Embaralha um array (Fisher-Yates)
function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
 
// Salva dados no localStorage e redireciona para jogo.html
function iniciarJogo(nomes) {
  const porTime = parseInt(inputPor.value) || 5;
 
  if (nomes.length < 2) {
    mostrarErro('⚠️ Adicione pelo menos 2 jogadores!');
    return;
  }
 
  // LIMPA o estado do jogo anterior para forçar redistribuição dos novos jogadores
  localStorage.removeItem('pelada_estado');
 
  localStorage.setItem('pelada_jogadores', JSON.stringify(nomes));
  localStorage.setItem('pelada_porTime',   porTime);
 
  window.location.href = 'jogo.html';
}
 
// ----- Eventos -----
 
// Embaralha e começa
btnEmb.addEventListener('click', () => {
  const nomes = embaralhar(lerNomes());
  iniciarJogo(nomes);
});
 
// Limpar textarea
btnLimpar.addEventListener('click', () => {
  txtNomes.value = '';
  msgErro.classList.add('hidden');
  txtNomes.focus();
});
 
// Restaura dados salvos ao carregar (caso o usuário volte)
window.addEventListener('DOMContentLoaded', () => {
  const salvos = localStorage.getItem('pelada_jogadores');
  const por    = localStorage.getItem('pelada_porTime');
 
  if (por)  inputPor.value = por;
  // Não restaura os nomes automaticamente — começa limpo
});