document.querySelectorAll('.dropdown').forEach(details => {
  const summary = details.querySelector('summary');
  const body = details.querySelector('.body');

  summary.addEventListener('click', e => {
    e.preventDefault();

    if (details.open) {
      body.style.gridTemplateRows = '0fr';
      setTimeout(() => details.removeAttribute('open'), 600);
    } else {
      details.setAttribute('open', '');
      body.style.gridTemplateRows = '';
    }
  });
});