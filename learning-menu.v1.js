(() => {
  const trigger = document.querySelector('[data-learn-open-adventures]');
  const panel = document.getElementById('learning-adventure-content');
  if (trigger && panel) {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      panel.open = true;
      trigger.setAttribute('aria-expanded', 'true');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      panel.querySelector('summary').focus({ preventScroll: true });
    });
    panel.addEventListener('toggle', () => trigger.setAttribute('aria-expanded', String(panel.open)));
  }

  // 🌟 [원장님 지침] 카드 클릭 시 선택 상태(밝고 굵은 녹색 라인) 적용 🌟
  const cards = document.querySelectorAll('#learn-screen .learning-menu-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
})();