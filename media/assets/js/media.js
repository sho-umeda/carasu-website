(() => {
  const menuButton = document.querySelector('.menu-button');
  const navigation = document.querySelector('.global-nav');
  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      navigation.classList.toggle('is-open', !isOpen);
    });
    navigation.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
    });
  }
  const carousel = document.querySelector('[data-carousel]');
  const carouselStatus = document.querySelector('[data-carousel-status]');
  const previousButton = document.querySelector('[data-carousel-prev]');
  const nextButton = document.querySelector('[data-carousel-next]');
  const carouselItems = carousel ? [...carousel.querySelectorAll('[data-carousel-slide]')] : [];
  let activeSlide = 0;
  const setActiveSlide = (index) => {
    if (!carouselItems.length) return;
    activeSlide = (index + carouselItems.length) % carouselItems.length;
    carouselItems.forEach((item, itemIndex) => {
      const isActive = itemIndex === activeSlide;
      item.classList.toggle('is-active', isActive);
      item.toggleAttribute('aria-current', isActive);
      item.style.order = String((itemIndex - activeSlide + carouselItems.length) % carouselItems.length);
    });
    carousel.scrollTo({ left: 0, behavior: 'smooth' });
    if (carouselStatus) carouselStatus.textContent = `${String(activeSlide + 1).padStart(2, '0')} / ${String(carouselItems.length).padStart(2, '0')}`;
  };
  previousButton?.addEventListener('click', () => setActiveSlide(activeSlide - 1));
  nextButton?.addEventListener('click', () => setActiveSlide(activeSlide + 1));
  carouselItems.forEach((item, index) => {
    item.addEventListener('click', (event) => {
      if (index === activeSlide) return;
      event.preventDefault();
      setActiveSlide(index);
    });
    item.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      setActiveSlide(activeSlide + (event.key === 'ArrowRight' ? 1 : -1));
      carouselItems[activeSlide].focus();
    });
  });
  let pointerStart = null;
  carousel?.addEventListener('pointerdown', (event) => { pointerStart = event.clientX; });
  carousel?.addEventListener('pointerup', (event) => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(distance) > 48) setActiveSlide(activeSlide + (distance < 0 ? 1 : -1));
  });
  setActiveSlide(0);
  const tabs = [...document.querySelectorAll('[data-topic]')];
  const cards = [...document.querySelectorAll('[data-categories]')];
  const empty = document.querySelector('[data-filter-empty]');
  const topicGrid = document.querySelector('[data-topic-grid]');
  let ranking = [];
  const localViews = () => {
    try { return JSON.parse(localStorage.getItem('carasuArticleViews') || '{}'); }
    catch { return {}; }
  };
  const rankCards = () => {
    const bySlug = new Map(cards.map((card) => [card.dataset.slug, card]));
    const ordered = ranking.map((item) => bySlug.get(item.slug)).filter(Boolean);
    cards.forEach((card) => { if (!ordered.includes(card)) ordered.push(card); });
    ordered.forEach((card) => topicGrid?.append(card));
  };
  const loadRanking = async () => {
    if (ranking.length) return;
    const endpoint = topicGrid?.dataset.rankingEndpoint;
    if (endpoint) {
      try {
        const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
        if (response.ok) ranking = (await response.json()).items || [];
      } catch { /* local preview and static fallback use browser counts */ }
    }
    if (!ranking.length) {
      ranking = Object.entries(localViews())
        .map(([slug, views]) => ({ slug, views }))
        .sort((a, b) => b.views - a.views);
    }
    const rankedSlugs = new Set(ranking.map((item) => item.slug));
    cards.forEach((card) => {
      if (!rankedSlugs.has(card.dataset.slug)) ranking.push({ slug: card.dataset.slug, views: 0 });
    });
    rankCards();
  };
  const selectTab = async (tab) => {
    const topic = tab.dataset.topic;
    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    topicGrid?.setAttribute('aria-labelledby', tab.id);
    if (topic === 'ranking') await loadRanking();
    let visible = 0;
    cards.forEach((card) => {
      const categoryMatch = topic === 'all' || topic === 'ranking' || (card.dataset.categories || '').split(' ').includes(topic);
      const rankingMatch = topic !== 'ranking' || ranking.slice(0, 3).some((item) => item.slug === card.dataset.slug) || (!ranking.length && visible < 3);
      const withinLimit = topic === 'all' || visible < (topic === 'featured' ? 4 : 3);
      const show = categoryMatch && rankingMatch && withinLimit;
      card.hidden = !show;
      if (show) {
        visible += 1;
        const rank = topic === 'ranking' ? ranking.findIndex((item) => item.slug === card.dataset.slug) + 1 : 0;
        card.dataset.rank = rank > 0 ? String(rank) : '';
      }
    });
    if (empty) empty.hidden = visible !== 0;
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].focus();
      selectTab(tabs[next]);
    });
  });
  if (tabs.length) selectTab(tabs.find((tab) => tab.dataset.topic === 'featured') || tabs[0]);

  const article = document.querySelector('[data-article-slug]');
  if (article) {
    const slug = article.dataset.articleSlug;
    const views = localViews();
    views[slug] = (Number(views[slug]) || 0) + 1;
    try { localStorage.setItem('carasuArticleViews', JSON.stringify(views)); } catch { /* ignore private-mode storage errors */ }
    fetch('/media/api/article-views', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true
    }).catch(() => {});
  }

  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    const status = form.querySelector('[data-contact-status]');
    form.addEventListener('submit', (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        if (status) status.textContent = '必須項目をご確認ください。';
        return;
      }
      event.preventDefault();
      const data = new FormData(form);
      const subject = `オウンドメディアからのお問い合わせ（${data.get('category')}）`;
      const body = [
        `会社名：${data.get('company')}`,
        `お名前：${data.get('name')}`,
        `メールアドレス：${data.get('email')}`,
        `お問い合わせ種別：${data.get('category')}`,
        '',
        'お問い合わせ内容：',
        data.get('message')
      ].join('\n');
      if (status) status.textContent = 'メールアプリを開いています。内容をご確認のうえ送信してください。';
      window.location.href = `mailto:info@carasu.jp?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });
})();
