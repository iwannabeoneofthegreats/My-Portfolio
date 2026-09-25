const burger = document.getElementById('burger');
const navPanel = document.getElementById('navPanel');
const overlay = document.getElementById('overlay');

function openMenu() {
  burger.classList.add('open');
  navPanel.classList.add('open');
  overlay.classList.add('open');
}

function closeMenu() {
  burger.classList.remove('open');
  navPanel.classList.remove('open');
  overlay.classList.remove('open');
}

burger.addEventListener('click', () => {
  burger.classList.contains('open') ? closeMenu() : openMenu();
});

overlay.addEventListener('click', closeMenu); // click outside to close