// DADOS DA FESTA — substitua os textos entre colchetes e mantenha as aspas.
const festa = {
  nome: 'Heitor',
  idade: '4',
  data: '12/12/2026', // Preencha como DD/MM/AAAA.
  horario: '13:00', // Preencha como HH:MM (24 horas).
  fuso: '-03:00', // Horário de Brasília. Ajuste se a festa ocorrer em outro fuso.
  local: 'Mix Kids Rua Pascoal Grieco N• 199/205 - Cidade Julia SP',
  mapa: 'https://maps.app.goo.gl/ad1RVbFmgoE8YghL9', // Link HTTPS do Google Maps, ou deixe vazio.
  pais: 'Tiphany e Rodrigo',
  whatsapp: '5511993751504',
  observacoes: '[EX: traje, o que levar, restrições]' // Deixe vazio se não houver.
};

// Edite aqui a mensagem. Os trechos opcionais já incluem a pontuação.
const mensagemWhatsApp = (nome, pessoas) =>
  `Oi! ${nome ? `Aqui é ${nome}. ` : ''}Confirmo minha presença no aniversário de dinossauro${preenchido(festa.nome) ? ` de ${festa.nome}` : ''} no dia ${festa.data}! ${pessoas ? `Seremos ${pessoas} pessoa(s). ` : ''}Mal podemos esperar!`;

const porId = id => document.getElementById(id);
const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)');
const preenchido = valor => valor.trim() !== '' && !valor.trim().startsWith('[');

// Preenche o convite e exibe os itens opcionais quando configurados.
document.querySelectorAll('[data-festa]').forEach(elemento => {
  elemento.textContent = festa[elemento.dataset.festa];
});
if (preenchido(festa.nome)) document.title = `Expedição Jurássica • ${festa.nome}`;
if (/^https:\/\/[^\s]+$/i.test(festa.mapa.trim())) {
  porId('mapa').href = festa.mapa.trim();
  porId('mapa').hidden = false;
}
porId('nota').hidden = !preenchido(festa.observacoes);

// Lê a hora no fuso da festa, inclusive para quem abrir o convite de outro país.
function instanteDaFesta() {
  const data = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(festa.data.trim());
  const hora = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(festa.horario.trim());
  if (!data || !hora) return NaN;
  const [, dia, mes, ano] = data;
  const calendario = `${ano}-${mes}-${dia}`;
  const utc = new Date(`${calendario}T00:00:00Z`);
  if (!Number.isFinite(+utc) || !utc.toISOString().startsWith(calendario)) return NaN;
  return Date.parse(`${calendario}T${hora[0]}:00${festa.fuso}`);
}

const inicioFesta = instanteDaFesta();
const numeros = ['dias', 'horas', 'minutos', 'segundos'].map(porId);
const estadoRelogio = porId('estado-relogio');

// Troca os números como um odômetro, só enquanto o contador está na tela.
function mostrarNumero(elemento, valor) {
  const anterior = elemento.firstChild?.textContent || elemento.textContent;
  if (anterior === valor) return;
  if (movimentoReduzido.matches || document.hidden || !elemento.animate || !/^\d+$/.test(anterior)) {
    elemento.textContent = valor;
    return;
  }
  const { top, bottom } = elemento.getBoundingClientRect();
  if (top >= innerHeight || bottom <= 0) {
    elemento.textContent = valor;
    return;
  }
  const atual = document.createElement('span');
  atual.textContent = valor;
  const saindo = document.createElement('span');
  saindo.className = 'numero-anterior';
  saindo.setAttribute('aria-hidden', 'true');
  saindo.textContent = anterior;
  elemento.replaceChildren(atual, saindo);
  const opcoes = { duration: 260, easing: 'ease-out' };
  atual.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], opcoes);
  saindo.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], opcoes)
    .onfinish = () => saindo.remove();
}

function atualizarContagem() {
  const total = Math.max(0, Math.ceil((inicioFesta - Date.now()) / 1000));
  const valores = [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
  numeros.forEach((elemento, indice) => {
    mostrarNumero(elemento, String(valores[indice]).padStart(2, '0'));
  });
  estadoRelogio.textContent = total ? '' : 'Chegou a hora da expedição!';
  estadoRelogio.hidden = total > 0;
  if (total > 0) setTimeout(atualizarContagem, Math.max(20, (inicioFesta - Date.now()) % 1000 + 15));
}
if (Number.isFinite(inicioFesta)) atualizarContagem();

// Revela uma vez ao entrar na tela. O parallax usa um quadro por rolagem.
if ('IntersectionObserver' in window && !movimentoReduzido.matches) {
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.remove('vai-entrar');
      observador.unobserve(entrada.target);
    });
  });
  document.querySelectorAll('.revelar, .fosseis, .trilha').forEach(elemento => {
    elemento.classList.add('vai-entrar');
    observador.observe(elemento);
  });
  const capa = porId('inicio');
  let quadro;
  addEventListener('scroll', () => {
    if (quadro || movimentoReduzido.matches) return;
    quadro = requestAnimationFrame(() => {
      quadro = null;
      const y = Math.min(scrollY, capa.offsetHeight);
      capa.style.setProperty('--fundo-y', `${y * .24}px`);
      capa.style.setProperty('--cena-y', `${y * .11}px`);
    });
  }, { passive: true });
}

// Uma luz acompanha o mouse nos cartões, sem interferir no toque.
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.cartao').forEach(cartao => {
    cartao.addEventListener('pointermove', evento => {
      if (movimentoReduzido.matches || evento.pointerType === 'touch') return;
      const { left, top } = cartao.getBoundingClientRect();
      cartao.style.setProperty('--luz-x', `${evento.clientX - left}px`);
      cartao.style.setProperty('--luz-y', `${evento.clientY - top}px`);
    }, { passive: true });
  });
}

// Confetes curtos, sem laço permanente de animação.
function comemorar(x, y, quantidade) {
  if (movimentoReduzido.matches || !Element.prototype.animate) return;
  const caixa = document.querySelector('.festa-confete');
  const cores = ['#ffcd67', '#e97845', '#b7c46b', '#f6e9cc', '#517e56'];
  for (let indice = 0; indice < quantidade; indice++) {
    const papel = document.createElement('i');
    const lado = (Math.random() - .5) * Math.min(430, innerWidth);
    const altura = 40 + Math.random() * 130;
    papel.className = 'papel';
    papel.style.setProperty('--x', `${x}px`);
    papel.style.setProperty('--y', `${y}px`);
    papel.style.setProperty('--cor', cores[indice % cores.length]);
    caixa.append(papel);
    const voo = papel.animate([
      { transform: 'translate(0,0)', opacity: 0 },
      { transform: `translate(${lado * .55}px,${-altura}px) rotate(145deg)`, opacity: 1, offset: .36 },
      { transform: `translate(${lado}px,${altura}px) rotate(430deg)`, opacity: 0 }
    ], { duration: 560 + Math.random() * 490, easing: 'ease-out' });
    voo.onfinish = () => papel.remove();
  }
}
if (scrollY < 40) {
  setTimeout(() => {
    if (scrollY < 40 && !document.hidden) comemorar(innerWidth * .71, Math.min(innerHeight * .44, 320), 24);
  }, 540);
}

document.querySelector('.ovo').addEventListener('click', evento => {
  const botao = evento.currentTarget;
  const abriu = botao.getAttribute('aria-expanded') === 'false';
  botao.setAttribute('aria-expanded', String(abriu));
  porId('ovo-texto').textContent = abriu ? 'Surpresa! Um filhote!' : 'Toque no ovo';
  if (abriu) {
    const caixa = botao.getBoundingClientRect();
    comemorar(caixa.left + caixa.width / 2, caixa.top + caixa.height / 2, 19);
  }
});

// Usa a própria aba para abrir o WhatsApp depois da comemoração.
const retorno = porId('retorno');
const confirmar = document.querySelector('.confirmar');
porId('rsvp').addEventListener('submit', evento => {
  evento.preventDefault();
  const numero = festa.whatsapp.trim();
  if (!/^55\d{10,11}$/.test(numero)) {
    retorno.textContent = 'O WhatsApp da festa ainda precisa ser configurado.';
    return;
  }
  if (!preenchido(festa.data)) {
    retorno.textContent = 'A data da festa ainda precisa ser configurada.';
    return;
  }
  const texto = mensagemWhatsApp(porId('convidado').value.trim(), porId('pessoas').valueAsNumber || '');
  const destino = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  confirmar.disabled = true;
  retorno.textContent = 'Preparando sua mensagem no WhatsApp…';
  const caixa = confirmar.getBoundingClientRect();
  comemorar(caixa.left + caixa.width / 2, caixa.top + caixa.height / 2, 48);
  setTimeout(() => {
    location.assign(destino);
  }, movimentoReduzido.matches ? 0 : 560);
});
addEventListener('pageshow', () => {
  confirmar.disabled = false;
  retorno.textContent = '';
});

// A pegada usa o mesmo desenho SVG do convite como molde para a poeira.
function iniciarEscavacao() {
  const tela = porId('poeira-fossil');
  if (!tela || typeof Path2D !== 'function') return;
  const contexto = tela.getContext('2d');
  if (!contexto) return;

  const molde = new Path2D(document.querySelector('#pata path').getAttribute('d'));
  const cores = ['#fff0b0', '#ffcf71', '#eb9a51', '#b6c66d'];
  const grupos = cores.map(() => []);
  const poeira = [];
  const fragmentos = [];
  const conexoes = [];
  const raio = 64;
  let cursor = null;
  let quadro = 0;
  let largura = 0;
  let altura = 0;
  let escala = 1;

  function adicionar(x, y, tamanho, cor) {
    const ponto = { baseX: x, baseY: y, tamanho, x: 0, y: 0, vx: 0, vy: 0 };
    poeira.push(ponto);
    grupos[cor].push(ponto);
    return ponto;
  }
  for (let y = 1; y < 24; y += .79) {
    for (let x = 1; x < 24; x += .79) {
      const px = x + (Math.random() - .5) * .45;
      const py = y + (Math.random() - .5) * .45;
      if (!contexto.isPointInPath(molde, px, py)) continue;
      adicionar(px, py, .85 + Math.random() * 1.25, Math.floor(Math.random() * 3));
    }
  }
  // Fragmentos ao redor da pegada formam pequenas constelações de âmbar.
  for (let i = 0; i < 24; i++) {
    const angulo = i * Math.PI / 12;
    const distancia = 15 + Math.random() * 6;
    fragmentos.push(adicionar(12 + Math.cos(angulo) * distancia, 12 + Math.sin(angulo) * distancia, 1.2, 3));
  }
  fragmentos.forEach((ponto, i) => {
    conexoes.push([ponto, fragmentos[(i + 1) % fragmentos.length]]);
    conexoes.push([ponto, fragmentos[(i + 2) % fragmentos.length]]);
  });

  function desenhar() {
    contexto.clearRect(0, 0, largura, altura);
    contexto.strokeStyle = '#b6c66d45';
    contexto.lineWidth = 1;
    contexto.beginPath();
    conexoes.forEach(([a, b]) => {
      if (Math.hypot(a.x - b.x, a.y - b.y) > 41) return;
      contexto.moveTo(a.x, a.y);
      contexto.lineTo(b.x, b.y);
    });
    contexto.stroke();
    grupos.forEach((grupo, indice) => {
      contexto.fillStyle = cores[indice];
      contexto.beginPath();
      grupo.forEach(ponto => {
        contexto.moveTo(ponto.x + ponto.tamanho, ponto.y);
        contexto.arc(ponto.x, ponto.y, ponto.tamanho, 0, Math.PI * 2);
      });
      contexto.fill();
    });
  }

  function reenquadrar() {
    cursor = null;
    largura = tela.clientWidth;
    altura = tela.clientHeight;
    escala = Math.min(7, largura / 47, altura / 45);
    const densidade = Math.min(devicePixelRatio || 1, 1.75);
    tela.width = Math.round(largura * densidade);
    tela.height = Math.round(altura * densidade);
    contexto.setTransform(densidade, 0, 0, densidade, 0, 0);
    poeira.forEach(ponto => {
      ponto.origemX = largura / 2 + (ponto.baseX - 12) * escala;
      ponto.origemY = altura * .48 + (ponto.baseY - 12) * escala;
      ponto.x = ponto.origemX;
      ponto.y = ponto.origemY;
      ponto.vx = ponto.vy = 0;
    });
    desenhar();
  }

  function animar() {
    quadro = 0;
    if (movimentoReduzido.matches) return;
    let emMovimento = false;
    poeira.forEach(ponto => {
      let fx = (ponto.origemX - ponto.x) * .032;
      let fy = (ponto.origemY - ponto.y) * .032;
      if (cursor) {
        const dx = ponto.x - cursor.x;
        const dy = ponto.y - cursor.y;
        const distancia = Math.hypot(dx, dy);
        if (distancia > .01 && distancia < raio) {
          const impulso = (1 - distancia / raio) * 4.8 / distancia;
          fx += dx * impulso;
          fy += dy * impulso;
        }
      }
      ponto.vx = (ponto.vx + fx) * .83;
      ponto.vy = (ponto.vy + fy) * .83;
      ponto.x += ponto.vx;
      ponto.y += ponto.vy;
      const velocidade = Math.abs(ponto.vx) + Math.abs(ponto.vy);
      const distanciaDaOrigem = Math.abs(ponto.origemX - ponto.x) + Math.abs(ponto.origemY - ponto.y);
      if (!cursor && velocidade < .04 && distanciaDaOrigem < .2) {
        ponto.x = ponto.origemX;
        ponto.y = ponto.origemY;
        ponto.vx = ponto.vy = 0;
      } else if (!cursor || velocidade > .04) {
        emMovimento = true;
      }
    });
    desenhar();
    if (emMovimento) acordar();
  }
  function acordar() {
    if (!quadro && !movimentoReduzido.matches) quadro = requestAnimationFrame(animar);
  }
  function espalhar(x, y, alcance) {
    if (movimentoReduzido.matches) return;
    poeira.forEach(ponto => {
      const dx = ponto.x - x;
      const dy = ponto.y - y;
      const distancia = Math.hypot(dx, dy);
      if (distancia < .01 || distancia >= alcance) return;
      const impulso = (1 - distancia / alcance) * 15 / distancia;
      ponto.vx += dx * impulso;
      ponto.vy += dy * impulso;
    });
    acordar();
  }
  function posicao(evento) {
    const { left, top } = tela.getBoundingClientRect();
    return { x: evento.clientX - left, y: evento.clientY - top };
  }
  tela.addEventListener('pointermove', evento => {
    if (evento.pointerType === 'touch' || movimentoReduzido.matches) return;
    cursor = posicao(evento);
    acordar();
  }, { passive: true });
  tela.addEventListener('pointerleave', () => {
    cursor = null;
    acordar();
  });
  tela.addEventListener('pointerdown', evento => {
    if (!evento.isPrimary || evento.button !== 0) return;
    const { x, y } = posicao(evento);
    espalhar(x, y, 104);
  }, { passive: true });
  const botao = porId('espalhar-poeira');
  botao.addEventListener('click', () => espalhar(largura / 2, altura * .48, 134));
  function atualizarPreferencia() {
    botao.hidden = movimentoReduzido.matches;
    porId('dica-escavacao').textContent = movimentoReduzido.matches
      ? 'Uma pegada de dinossauro ficou marcada na rocha.'
      : 'Passe o mouse sobre a pegada ou toque nela para espalhar a poeira dourada.';
    reenquadrar();
  }
  tela.hidden = false;
  porId('pegada-estatica').hidden = true;
  atualizarPreferencia();
  movimentoReduzido.addEventListener?.('change', atualizarPreferencia);
  if ('ResizeObserver' in window) new ResizeObserver(reenquadrar).observe(tela.parentElement);
  else addEventListener('resize', reenquadrar);
}
iniciarEscavacao();
