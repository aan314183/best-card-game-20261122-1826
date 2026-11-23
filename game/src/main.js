// main.js — boot and input for Ember Duel: buttons, mouse clicks and keyboard.
function hideTitle() {
  document.getElementById('titleOverlay').classList.add('hidden');
}

function showTitle() {
  document.getElementById('titleOverlay').classList.remove('hidden');
  document.getElementById('endOverlay').classList.add('hidden');
}

function bootEmberDuel() {
  newGame();
  renderAll();
  showTitle();

  document.getElementById('startBtn').addEventListener('click', () => {
    hideTitle();
    startGame();
  });
  document.getElementById('againBtn').addEventListener('click', () => {
    document.getElementById('endOverlay').classList.add('hidden');
    newGame();
    renderAll();
    startGame();
  });
  document.getElementById('newGameBtn').addEventListener('click', () => {
    newGame();
    renderAll();
    showTitle();
  });
  document.getElementById('endTurnBtn').addEventListener('click', () => endPlayerTurn());

  document.addEventListener('keydown', (e) => {
    const st = gameState;
    if (!st) return;
    if (e.key >= '1' && e.key <= '5') {
      const i = Number(e.key) - 1;
      if (st.screen === 'game' && st.phase === 'player' && st.player.hand[i]) {
        st.selected = i;
        playCard('player', i);
      }
    } else if (e.key === 'Enter') {
      if (st.selected >= 0 && st.player.hand[st.selected]) playCard('player', st.selected);
    } else if (e.key === 'e' || e.key === 'E') {
      endPlayerTurn();
    } else if (e.key === 'r' || e.key === 'R') {
      newGame();
      renderAll();
      showTitle();
    }
  });
}

if (typeof window !== 'undefined') {
  window.__ember = {
    get state() { return gameState; },
    newGame, startGame, playCard, endPlayerTurn,
  };
  document.addEventListener('DOMContentLoaded', bootEmberDuel);
}
