// render.js — draws the Ember Duel state into the DOM: both hands, the table,
// life/mana totals, the log and the overlays. Cards are colour + icon coded.
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

function cardElement(card, opts) {
  opts = opts || {};
  const defEl = ELEMENTS[card.el];
  const c = el('div', 'card ' + card.el + (opts.disabled ? ' disabled' : '') + (opts.selected ? ' selected' : ''));
  const shownPower = card.shownPower !== undefined ? card.shownPower : card.power;
  c.appendChild(el('div', 'cost', String(card.cost)));
  c.appendChild(el('div', 'el', defEl.icon));
  c.appendChild(el('div', 'power', String(shownPower)));
  c.appendChild(el('div', 'power-label', 'KEKUATAN'));
  c.appendChild(el('div', 'cname', card.name));
  c.appendChild(el('div', 'ctext', card.text + (card.bonus ? ' ✨+2 resonansi' : '')));
  if (opts.onClick) c.addEventListener('click', opts.onClick);
  return c;
}

function manaPips(mana, maxMana) {
  let s = '';
  for (let i = 0; i < maxMana; i++) s += i < mana ? '💧' : '<span class="spent">💧</span>';
  return s + ' <b>' + mana + '/' + maxMana + '</b>';
}

function renderAll() {
  const st = gameState;
  if (!st || typeof document === 'undefined') return;
  document.getElementById('turnLabel').textContent = 'Giliran ' + st.turn;
  document.getElementById('scoreLabel').textContent =
    'Skor ' + (st.score.damageDealt + st.score.cardsPlayed * 2) + ' · Rusak ' + st.score.damageDealt;
  document.getElementById('deckLabel').textContent = 'Dek ' + st.player.deck.length + ' kartu';

  renderSide('player', st.player, st);
  renderSide('ai', st.ai, st);

  const pp = document.getElementById('playedPlayer');
  pp.innerHTML = '';
  if (st.playedPlayer.length === 0) pp.appendChild(el('div', 'empty', 'Belum ada kartu dimainkan giliran ini.'));
  for (const c of st.playedPlayer) pp.appendChild(cardElement(c));

  const pa = document.getElementById('playedAi');
  pa.innerHTML = '';
  if (st.playedAi.length === 0) pa.appendChild(el('div', 'empty', 'Ratu Abu belum memainkan kartu.'));
  for (const c of st.playedAi) pa.appendChild(cardElement(c));

  document.getElementById('phaseLabel').textContent =
    st.screen === 'game'
      ? (st.phase === 'player' ? 'Giliranmu — mainkan kartu!' : 'Giliran Ratu Abu…')
      : st.screen === 'win' ? '🏆 Kamu menang!' : st.screen === 'loss' ? '💀 Kamu kalah.' : 'EMBER DUEL';
  document.getElementById('resonanceNote').textContent = st.resonanceNote || '';
  document.getElementById('endTurnBtn').disabled = st.screen !== 'game' || st.phase !== 'player';

  const log = document.getElementById('logList');
  log.innerHTML = '';
  for (const line of st.log) log.appendChild(el('li', '', line));
}

function renderSide(side, who, st) {
  const pfx = side === 'player' ? 'player' : 'ai';
  const fill = document.getElementById(pfx + 'HpFill');
  fill.style.width = Math.max(0, (who.hp / who.maxHp) * 100) + '%';
  document.getElementById(pfx + 'HpText').textContent = '❤️ ' + who.hp + ' / ' + who.maxHp;
  document.getElementById(pfx + 'Mana').innerHTML = 'Mana ' + manaPips(who.mana, Math.max(1, who.maxMana));
  document.getElementById(pfx + 'Armor').textContent = who.armor > 0 ? '🛡️ Perisai ' + who.armor : '';

  const handEl = document.getElementById(pfx + 'Hand');
  handEl.innerHTML = '';
  if (side === 'ai') {
    for (let i = 0; i < who.hand.length; i++) {
      const back = el('div', 'card back');
      back.appendChild(el('div', 'q', '🔥'));
      handEl.appendChild(back);
    }
    const count = el('div', 'hand-count', '');
    count.style.cssText = 'color:#e9d5ff;font-weight:800;align-self:center;';
    count.textContent = who.hand.length + ' kartu';
    handEl.appendChild(count);
    return;
  }
  who.hand.forEach((card, i) => {
    const disabled = card.cost > who.mana || st.screen !== 'game' || st.phase !== 'player';
    handEl.appendChild(cardElement(card, {
      disabled,
      selected: st.selected === i,
      onClick: () => { playCard('player', i); },
    }));
  });
}

function showEndOverlay(won) {
  const ov = document.getElementById('endOverlay');
  ov.classList.remove('hidden', 'win', 'loss');
  ov.classList.add(won ? 'win' : 'loss');
  document.getElementById('endEmoji').textContent = won ? '🏆' : '💀';
  document.getElementById('endTitle').textContent = won ? 'MENANG!' : 'KALAH!';
  document.getElementById('endText').textContent = won
    ? 'Ratu Abu tumbang! Apinya padam, mahkotanya milikmu.'
    : 'Ratu Abu masih berdiri di atas bara. Coba lagi — atur manamu lebih baik!';
  const st = gameState;
  document.getElementById('endStats').textContent =
    'Skor ' + (st.score.damageDealt + st.score.cardsPlayed * 2) +
    ' · Kerusakan ' + st.score.damageDealt + ' · Kartu dimainkan ' + st.score.cardsPlayed +
    ' · ' + st.turn + ' giliran.';
}
