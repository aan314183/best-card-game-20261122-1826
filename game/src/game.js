// game.js — Ember Duel rules and state.
// A duel: both sides have 30 life. Mana starts at 1 and grows by 1 each turn
// (max 10), refilling every turn. Playing a card spends its cost and applies
// its damage/effects at once; the card stays on the table until the turn ends.
// Resonance: the 2nd and later cards of the same element in one turn get +2.
// Win by reducing the foe to 0 life; lose the same way.
const START_HP = 30;
const MAX_MANA = 10;
const MAX_HAND = 7;

let gameState = null;

function makeSide(rng) {
  return {
    hp: START_HP, maxHp: START_HP, mana: 0, maxMana: 0,
    hand: [], deck: buildDeck(rng), discard: [], armor: 0, freezeNext: 0,
  };
}

function newGame(seed) {
  const rng = makeRng(seed);
  gameState = {
    screen: 'title', turn: 1, phase: 'player', selected: -1,
    player: makeSide(rng), ai: makeSide(rng),
    playedPlayer: [], playedAi: [],
    log: [], score: { damageDealt: 0, cardsPlayed: 0, turns: 0 },
    resonanceNote: '',
  };
  drawCards(gameState.player, 5);
  drawCards(gameState.ai, 5);
  gameState.player.maxMana = 1; gameState.player.mana = 1;
  gameState.ai.maxMana = 1; gameState.ai.mana = 1;
  addLog('🔥 Duel dimulai! Kamu melawan <b>Ratu Abu</b>. Giliranmu — mainkan kartu!');
  return gameState;
}

function startGame() {
  if (!gameState) newGame();
  gameState.screen = 'game';
  if (typeof renderAll === 'function') renderAll();
}

function addLog(html) {
  if (!gameState) return;
  gameState.log.unshift(html);
  if (gameState.log.length > 40) gameState.log.length = 40;
}

function otherSide(side) { return side === 'player' ? 'ai' : 'player'; }
function sideName(side) { return side === 'player' ? 'Kamu' : 'Ratu Abu'; }

// How much extra power a card gets from resonance this turn.
function resonanceBonus(side, el) {
  const played = side === 'player' ? gameState.playedPlayer : gameState.playedAi;
  return played.some((p) => p.el === el) ? 2 : 0;
}

function dealDamage(target, amount, sourceName) {
  const who = gameState[target];
  let left = amount;
  if (who.armor > 0) {
    const absorbed = Math.min(who.armor, left);
    who.armor -= absorbed; left -= absorbed;
    if (absorbed > 0) addLog(`🛡️ Perisai ${sideName(target)} menyerap ${absorbed} kerusakan.`);
  }
  if (left > 0) {
    who.hp = Math.max(0, who.hp - left);
    addLog(`💥 <b>${sourceName}</b> melukai ${sideName(target)} sebesar ${left}!`);
  }
  return left;
}

// Play one card from a hand. Returns true when the card was played.
function playCard(side, handIndex) {
  const st = gameState;
  if (!st || st.screen !== 'game') return false;
  if (side === 'player' && st.phase !== 'player') return false;
  const who = st[side];
  const foe = st[otherSide(side)];
  const card = who.hand[handIndex];
  if (!card || card.cost > who.mana) return false;
  who.mana -= card.cost;
  who.hand.splice(handIndex, 1);
  const bonus = resonanceBonus(side, card.el);
  const power = card.power + bonus;
  const played = { ...card, shownPower: power, bonus };
  if (side === 'player') st.playedPlayer.push(played); else st.playedAi.push(played);
  st.score.cardsPlayed += side === 'player' ? 1 : 0;
  if (side === 'player') st.resonanceNote = bonus > 0 ? `✨ Resonansi ${ELEMENTS[card.el].name}! +2 kekuatan.` : '';
  if (power > 0) {
    const dealt = dealDamage(otherSide(side), power, card.name);
    if (side === 'player') st.score.damageDealt += dealt;
  }
  if (card.heal) {
    who.hp = Math.min(who.maxHp, who.hp + card.heal);
    addLog(`💚 ${sideName(side)} memulihkan ${card.heal} nyawa (${card.name}).`);
  }
  if (card.armor) {
    who.armor += card.armor;
    addLog(`🛡️ ${sideName(side)} mendapat +${card.armor} Perisai (${card.name}).`);
  }
  if (card.freeze) {
    foe.freezeNext = 1;
    addLog(`❄️ ${sideName(side)} membekukan ${sideName(otherSide(side))} — mana lawan −1 giliran depan!`);
  }
  if (card.draw) drawCards(who, card.draw);
  who.discard.push(card);
  if (checkEnd()) { if (typeof renderAll === 'function') renderAll(); return true; }
  if (typeof renderAll === 'function') renderAll();
  return true;
}

function endPlayerTurn() {
  const st = gameState;
  if (!st || st.screen !== 'game' || st.phase !== 'player') return;
  st.phase = 'ai';
  st.playedPlayer = [];
  st.playedAi = [];
  st.resonanceNote = '';
  // The turn number advances first, so the AI plays on the same turn — with
  // the same mana the player just had — instead of lagging one turn behind.
  st.turn += 1;
  st.score.turns = st.turn;
  const frozen = st.player.freezeNext > 0;
  if (frozen) { st.player.freezeNext = 0; addLog('❄️ Kamu masih beku — manamu berkurang 1 giliran ini.'); }
  st.player.maxMana = Math.max(1, Math.min(MAX_MANA, st.turn) - (frozen ? 1 : 0));
  st.player.mana = st.player.maxMana;
  drawCards(st.player, 2);
  addLog(`— Giliran Ratu Abu (giliran ${st.turn}) —`);
  runAiTurn();
  if (st.screen !== 'game') { if (typeof renderAll === 'function') renderAll(); return; }
  // The Queen is powerful but slow: she draws only 1 card a turn, you draw 2.
  drawCards(st.ai, 1);
  st.phase = 'player';
  addLog(`— Giliran ${st.turn}: manamu ${st.player.mana} 💧 —`);
  if (typeof renderAll === 'function') renderAll();
}

function runAiTurn() {
  const st = gameState;
  const frozen = st.ai.freezeNext > 0;
  if (frozen) { st.ai.freezeNext = 0; addLog('❄️ Ratu Abu masih beku — mananya berkurang 1 giliran ini.'); }
  st.ai.maxMana = Math.max(1, Math.min(MAX_MANA, st.turn) - (frozen ? 1 : 0));
  st.ai.mana = st.ai.maxMana;
  const plays = chooseAiPlays(st);
  // Remove by descending index so earlier indices stay valid.
  const desc = plays.slice().sort((a, b) => b - a);
  for (const idx of desc) playCard('ai', idx);
  if (st.screen === 'game') addLog(`Ratu Abu memainkan ${plays.length} kartu.`);
}

function checkEnd() {
  const st = gameState;
  if (st.ai.hp <= 0) { endDuel(true); return true; }
  if (st.player.hp <= 0) { endDuel(false); return true; }
  return false;
}

function endDuel(won) {
  const st = gameState;
  st.screen = won ? 'win' : 'loss';
  st.phase = 'over';
  if (won) addLog('🏆 <b>KAMU MENANG!</b> Ratu Abu tumbang — apinya padam.');
  else addLog('💀 <b>KAMU KALAH.</b> Ratu Abu masih berdiri di atas bara.');
  if (typeof showEndOverlay === 'function') showEndOverlay(won);
}
