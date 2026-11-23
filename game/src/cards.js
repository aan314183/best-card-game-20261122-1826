// cards.js — the Ember Duel card catalogue, elements and deck building.
// Four original elements, each with a colour AND a shape/icon, never text alone.
const ELEMENTS = {
  api:   { name: 'Api',   icon: '🔥', color: '#dc2626' },
  es:    { name: 'Es',    icon: '❄️', color: '#0284c7' },
  batu:  { name: 'Batu',  icon: '🪨', color: '#a16207' },
  angin: { name: 'Angin', icon: '🍃', color: '#059669' },
};

// id, name, element, mana cost, power (damage), and one extra effect.
// freeze: foe loses 1 mana next turn. armor: shield that absorbs damage.
// heal: restore own life. draw: draw extra cards.
const CARD_DEFS = [
  { id: 'percik',  name: 'Percik Bara',   el: 'api',   cost: 1, power: 2, text: 'Serang 2.' },
  { id: 'lidah',   name: 'Lidah Api',     el: 'api',   cost: 2, power: 4, text: 'Serang 4.' },
  { id: 'magma',   name: 'Ledakan Magma', el: 'api',   cost: 4, power: 8, text: 'Serang 8.' },
  { id: 'meteor',  name: 'Hujan Meteor',  el: 'api',   cost: 5, power: 9, text: 'Serang 9.' },
  { id: 'jarum',   name: 'Jarum Es',      el: 'es',    cost: 1, power: 2, freeze: 1, text: 'Serang 2. Beku: mana lawan −1.' },
  { id: 'tombak',  name: 'Tombak Glasial',el: 'es',    cost: 2, power: 4, freeze: 1, text: 'Serang 4. Beku.' },
  { id: 'badai',   name: 'Badai Salju',   el: 'es',    cost: 3, power: 5, freeze: 1, text: 'Serang 5. Beku.' },
  { id: 'pukul',   name: 'Pukul Batu',    el: 'batu',  cost: 1, power: 2, armor: 2, text: 'Serang 2. +2 Perisai.' },
  { id: 'golem',   name: 'Golem Penjaga', el: 'batu',  cost: 3, power: 5, armor: 4, text: 'Serang 5. +4 Perisai.' },
  { id: 'tebing',  name: 'Runtuh Tebing', el: 'batu',  cost: 4, power: 7, armor: 2, text: 'Serang 7. +2 Perisai.' },
  { id: 'tebas',   name: 'Tebasan Angin', el: 'angin', cost: 1, power: 2, draw: 1, text: 'Serang 2. Tarik 1 kartu.' },
  { id: 'elang',   name: 'Sayap Elang',   el: 'angin', cost: 2, power: 3, draw: 1, heal: 2, text: 'Serang 3. Tarik 1. Pulih 2.' },
  { id: 'pusaran', name: 'Pusaran Badai', el: 'angin', cost: 3, power: 5, draw: 1, text: 'Serang 5. Tarik 1 kartu.' },
  { id: 'embun',   name: 'Embun Pagi',    el: 'angin', cost: 2, power: 0, draw: 1, heal: 6, text: 'Pulih 6. Tarik 1 kartu.' },
];

const DECK_COUNTS = {
  percik: 3, lidah: 3, magma: 2, meteor: 1,
  jarum: 3, tombak: 2, badai: 2,
  pukul: 3, golem: 2, tebing: 1,
  tebas: 3, elang: 2, pusaran: 2, embun: 1,
};

function cardDefById(id) {
  return CARD_DEFS.find((d) => d.id === id);
}

// A tiny seeded RNG so screenshot presets are stable; Math.random otherwise.
function makeRng(seed) {
  if (seed === undefined || seed === null) return Math.random;
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDeck(rng) {
  const deck = [];
  for (const def of CARD_DEFS) {
    const n = DECK_COUNTS[def.id] || 0;
    for (let i = 0; i < n; i++) deck.push({ ...def, uid: def.id + '-' + i + '-' + Math.floor(rng() * 1e9) });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
  }
  return deck;
}

function drawCards(who, n) {
  for (let i = 0; i < n; i++) {
    if (who.hand.length >= 7) return;
    if (who.deck.length === 0) {
      who.deck = who.discard.splice(0).reverse();
      if (who.deck.length === 0) return;
    }
    who.hand.push(who.deck.pop());
  }
}
