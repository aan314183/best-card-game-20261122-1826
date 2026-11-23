// shots.js — screenshot presets for the maker only (?shot=title|game|win|loss).
// Builds a fixed, seeded state so each screenshot is stable and readable.
// Not used by normal play: without ?shot the game starts on the title screen.
function applyShotPreset() {
  if (typeof window === 'undefined' || typeof location === 'undefined') return;
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return;
  const ember = window.__ember;
  if (!ember) return;

  if (shot === 'title') {
    ember.newGame(7);
    renderAll();
    showTitle();
    return;
  }

  // Mid-game table for game / win / loss shots.
  ember.newGame(11);
  const st = ember.state;
  st.screen = 'game';
  st.turn = 4;
  st.player.maxMana = 5; st.player.mana = 3;
  st.ai.maxMana = 4; st.ai.mana = 1;
  st.player.hp = 24; st.ai.hp = 18;
  st.player.armor = 2;
  st.score.damageDealt = 12; st.score.cardsPlayed = 4;
  const p = st.player.hand;
  const find = (id) => p.findIndex((c) => c.id === id);
  const lidah = find('lidah'); if (lidah >= 0) { st.playedPlayer.push({ ...p[lidah], shownPower: 4 }); p.splice(lidah, 1); }
  const golem = find('golem'); if (golem >= 0) { st.playedPlayer.push({ ...p[golem], shownPower: 5, bonus: 0 }); p.splice(golem, 1); }
  const a = st.ai.hand;
  const badai = a.findIndex((c) => c.id === 'badai'); if (badai >= 0) { st.playedAi.push({ ...a[badai], shownPower: 5 }); a.splice(badai, 1); }
  addLog('🔥 <b>Lidah Api</b> melukai Ratu Abu sebesar 4!');
  addLog('🛡️ <b>Golem Penjaga</b> memberi +4 Perisai.');
  addLog('❄️ <b>Badai Salju</b> melukai Kamu sebesar 5!');

  if (shot === 'win') {
    st.ai.hp = 0;
    st.screen = 'win';
    hideTitle();
    renderAll();
    showEndOverlay(true);
    return;
  }
  if (shot === 'loss') {
    st.player.hp = 0;
    st.screen = 'loss';
    hideTitle();
    renderAll();
    showEndOverlay(false);
    return;
  }
  hideTitle();
  renderAll();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(applyShotPreset, 30));
}
