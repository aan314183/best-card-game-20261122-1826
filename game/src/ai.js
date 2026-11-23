// ai.js — Ratu Abu, the AI opponent.
// v2: plays to win, not just to spend mana.
//  - Lethal first: if the damage it can play this turn kills the player, it
//    plays exactly that sequence and stops thinking.
//  - Resonance pairs: two cards of the same element played together get +2 on
//    the second, so the AI groups its hand by element before spending.
//  - Freeze is worth more when the player holds many cards (a big next turn),
//    armor is worth more while the AI is hurt, and the big heal is held while
//    healthy instead of being wasted at full life.
function cardValueForAi(card, state) {
  const ai = state.ai;
  const player = state.player;
  let v = card.power;
  if (card.heal) v += card.heal * 0.9;
  if (card.draw) v += 1.6;
  if (card.armor) v += card.armor * (ai.hp <= 12 ? 1.1 : 0.6);
  if (card.freeze) v += player.hand.length >= 5 ? 2.4 : 1.2;
  if (card.id === 'embun' && ai.hp > 20) v -= 6; // hold the heal while healthy
  return v / Math.max(1, card.cost);
}

// Damage the AI can deal with this hand and mana, ignoring resonance.
function aiLethalPlan(state) {
  const ai = state.ai;
  const afford = ai.hand
    .map((c, i) => ({ card: c, index: i }))
    .filter((x) => x.card.cost <= ai.mana)
    .sort((a, b) => b.card.power - a.card.power);
  let mana = ai.mana;
  let damage = 0;
  const plan = [];
  for (const entry of afford) {
    if (entry.card.cost > mana) continue;
    // Armor on the player side eats the first damage; account for it once.
    mana -= entry.card.cost;
    damage += entry.card.power;
    plan.push(entry.index);
    const net = Math.max(0, damage - state.player.armor);
    if (net >= state.player.hp) return plan;
  }
  return null;
}

function chooseAiPlays(state) {
  const lethal = aiLethalPlan(state);
  if (lethal) return lethal.slice().sort((a, b) => a - b);

  const ai = state.ai;
  const hand = ai.hand.map((c, i) => ({ card: c, index: i }));
  // Group by element so resonance pairs are played together: score a card
  // higher when another affordable card shares its element.
  const byEl = {};
  for (const e of hand) byEl[e.card.el] = (byEl[e.card.el] || 0) + 1;
  hand.sort((a, b) => {
    const sa = cardValueForAi(a.card, state) + (byEl[a.card.el] > 1 ? 0.8 : 0);
    const sb = cardValueForAi(b.card, state) + (byEl[b.card.el] > 1 ? 0.8 : 0);
    return sb - sa;
  });
  const plays = [];
  let mana = ai.mana;
  for (const entry of hand) {
    if (entry.card.cost <= mana) {
      plays.push(entry.index);
      mana -= entry.card.cost;
    }
  }
  // Play in hand order so the table reads left to right by play order.
  plays.sort((a, b) => a - b);
  return plays;
}
