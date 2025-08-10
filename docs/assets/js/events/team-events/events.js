document.addEventListener("DOMContentLoaded", () => {
  let scrollTimeout;
  let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const elements = document.querySelectorAll('.scroll-border');

  if (elements.length === 0) return; // Nothing to animate

  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollingDown = scrollTop > lastScrollTop;

    elements.forEach(el => {
      el.classList.remove('fade-out', 'scroll-up', 'scroll-down');
      el.classList.add(scrollingDown ? 'scroll-down' : 'scroll-up');
    });

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      elements.forEach(el => {
        el.classList.remove('scroll-up', 'scroll-down');
        el.classList.add('fade-out');

        setTimeout(() => {
          el.classList.remove('fade-out');
        }, 400); // match fade duration
      });
    }, 150);

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });
});
