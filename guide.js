document.addEventListener('DOMContentLoaded', () => {
  const roleButtons = [...document.querySelectorAll('[data-role-filter]')];
  const roleSections = [...document.querySelectorAll('[data-role-section]')];
  const roleNavButtons = [...document.querySelectorAll('[data-role-nav]')];
  const tocButtons = [...document.querySelectorAll('.toc [data-target]')];
  const searchableSections = [...document.querySelectorAll('[data-search-section]')];
  const searchInput = document.querySelector('#guide-search');
  const searchStatus = document.querySelector('#search-status');
  const clearSearch = document.querySelector('[data-clear-search]');
  const emptyState = document.querySelector('#empty-state');
  const progress = document.querySelector('#reading-progress');
  const dialog = document.querySelector('#image-dialog');
  const dialogImage = document.querySelector('#dialog-image');
  const dialogStage = document.querySelector('#dialog-stage');
  const closeDialog = document.querySelector('[data-close-dialog]');

  let activeRole = 'all';

  const normalize = (value) =>
    (value || '')
      .toLocaleLowerCase('id-ID')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const updateUrlRole = (role) => {
    if (location.protocol === 'file:') return;
    const url = new URL(location.href);
    if (role === 'all') url.searchParams.delete('role');
    else url.searchParams.set('role', role);
    history.replaceState({}, '', url.pathname + url.search + url.hash);
  };

  const matchesRole = (section) =>
    activeRole === 'all' || section.dataset.roleSection === activeRole;

  const applySearch = () => {
    const query = normalize(searchInput.value);
    let visibleItems = 0;
    let visibleSections = 0;

    clearSearch.classList.toggle('visible', Boolean(query));

    searchableSections.forEach((section) => {
      const isRoleChapter = section.hasAttribute('data-role-section');
      const roleVisible = !isRoleChapter || matchesRole(section);
      const items = [...section.querySelectorAll('[data-search-item]')];
      const heading = section.querySelector('.chapter-head, :scope > h2, :scope > .section-kicker');
      const headingMatches = query && normalize(heading?.textContent).includes(query);
      let sectionMatches = !query;

      if (items.length) {
        items.forEach((item) => {
          const itemMatches = !query || headingMatches || normalize(item.textContent).includes(query);
          item.classList.toggle('is-search-hidden', !itemMatches);
          if (itemMatches && roleVisible) {
            visibleItems += 1;
            sectionMatches = true;
          }
        });
      } else {
        sectionMatches = !query || normalize(section.textContent).includes(query);
      }

      const shouldShow = roleVisible && sectionMatches;
      if (isRoleChapter) section.hidden = !shouldShow;
      else section.classList.toggle('is-search-hidden', !shouldShow);
      if (shouldShow) visibleSections += 1;
    });

    roleNavButtons.forEach((button) => {
      const roleAllowed = activeRole === 'all' || button.dataset.roleNav === activeRole;
      const target = document.getElementById(button.dataset.target);
      button.hidden = !roleAllowed || Boolean(target?.hidden);
    });

    if (!query) {
      searchStatus.textContent =
        activeRole === 'all' ? 'Menampilkan seluruh alur.' : 'Panduan difilter sesuai peran.';
    } else if (visibleItems) {
      searchStatus.textContent = visibleItems + ' langkah ditemukan.';
    } else {
      searchStatus.textContent = 'Tidak ada hasil.';
    }

    emptyState.classList.toggle('visible', visibleSections === 0);
  };

  const setRole = (role, options = {}) => {
    const known = roleButtons.some((button) => button.dataset.roleFilter === role);
    activeRole = known ? role : 'all';

    roleButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.roleFilter === activeRole));
    });

    updateUrlRole(activeRole);
    applySearch();

    if (options.scroll) {
      const target = activeRole === 'all'
        ? document.querySelector('#ringkasan')
        : document.querySelector('[data-role-section="' + activeRole + '"]');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  roleButtons.forEach((button) => {
    button.addEventListener('click', () => setRole(button.dataset.roleFilter, { scroll: true }));
  });

  tocButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target);
      const targetRole = button.dataset.roleNav;
      if (targetRole && target?.hidden) setRole(targetRole);
      document.getElementById(button.dataset.target)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });

  searchInput.addEventListener('input', applySearch);
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    applySearch();
    searchInput.focus();
  });

  document.querySelectorAll('[data-zoom]').forEach((button) => {
    button.addEventListener('click', () => {
      const sourceImage = button.querySelector('img');
      dialogImage.src = sourceImage.src;
      dialogImage.alt = sourceImage?.alt || 'Pratinjau tampilan aplikasi';
      dialogStage.querySelectorAll('.annotation-marker').forEach((marker) => marker.remove());
      button.querySelectorAll('.annotation-marker').forEach((marker) => {
        dialogStage.append(marker.cloneNode(true));
      });
      document.body.classList.add('modal-open');
      dialog.showModal();
      closeDialog.focus();
    });
  });

  const dismissDialog = () => {
    if (dialog.open) dialog.close();
    document.body.classList.remove('modal-open');
    dialogImage.removeAttribute('src');
    dialogStage.querySelectorAll('.annotation-marker').forEach((marker) => marker.remove());
  };

  closeDialog.addEventListener('click', dismissDialog);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    dismissDialog();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dismissDialog();
  });

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progress.style.width = Math.min(100, Math.max(0, percentage)) + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  if ('IntersectionObserver' in window) {
    const observed = [
      document.querySelector('#ringkasan'),
      ...roleSections,
      document.querySelector('#hak-akses'),
      document.querySelector('#email'),
      document.querySelector('#faq'),
    ].filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting && !entry.target.hidden)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        tocButtons.forEach((button) => {
          button.classList.toggle('active', button.dataset.target === visible.target.id);
        });
      },
      { rootMargin: '-20% 0px -68% 0px', threshold: [0, 0.05, 0.2] },
    );
    observed.forEach((section) => observer.observe(section));
  }

  const requestedRole = new URLSearchParams(location.search).get('role') || 'all';
  setRole(requestedRole);
});
