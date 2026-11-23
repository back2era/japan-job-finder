(() => {
  'use strict';

  const { SOURCES, LOCATIONS, CATEGORIES, CAREERS, MODES, normalize, search } = JobsCore;
  const $ = (id) => document.getElementById(id);
  const initial = JSON.parse($('initial-data').textContent);
  const storageKey = 'japan-jobs-bookmarks-v1';
  const icons = {
    search: '<circle cx="10.7" cy="10.7" r="6.2"/><path d="m16 16 4.4 4.4"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11s-8-6-8-11a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    bookmark: '<path class="bookmark-shape" d="M6 4h12v16l-6-4-6 4z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    sliders: '<path d="M4 7h5m4 0h7M4 17h9m4 0h3"/><circle cx="11" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2 6m2-11v5h-5"/>',
    link: '<path d="M14 5h5v5m0-5-8 8m7 1v5H5V6h5"/>',
  };
  const feeds = new Map(SOURCES.map((source) => [source.key, { status: 'snapshot', entries: initial.jobs.filter((job) => job.source === source.key) }]));
  const bySource = new Map(SOURCES.map((source) => [source.key, source]));
  const originalDate = formatDate(initial.captured);
  const pageSize = 12;
  let bookmarks = loadBookmarks();
  let query = '';
  let visible = pageSize;
  let savedView = false;
  let refreshing = false;
  let resetFocusTo;

  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const icon = (name) => `<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg></span>`;
  const allJobs = () => [...feeds.values()].flatMap((feed) => feed.entries);

  function formatDate(value) {
    const date = typeof value === 'string' && value ? new Date(value) : new Date(NaN);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Tokyo', dateStyle: 'medium' }).format(date);
  }

  function loadBookmarks() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      return new Map(stored.filter((item) => item?.id && /^https:\/\//i.test(item.url)).map((item) => [item.id, item]));
    } catch {
      return new Map();
    }
  }

  function updateBookmark(job) {
    if (bookmarks.has(job.id)) bookmarks.delete(job.id);
    else bookmarks.set(job.id, { ...job, description: '' });
    try {
      localStorage.setItem(storageKey, JSON.stringify([...bookmarks.values()]));
    } catch {
      // The session can still hold bookmarks when browser storage is disabled.
    }
  }

  function companyMark(job) {
    const source = bySource.get(job.source);
    return `<span class="company-mark ${source?.tone ?? 'green'}" aria-hidden="true">${source?.mark ?? '?'}</span>`;
  }

  function localPlace(job) {
    if (/nagoya|名古屋/i.test(job.location) && job.cities.includes('爱知县')) {
      return job.cities.map((city) => city === '爱知县' ? '名古屋' : city).join(' · ');
    }
    return job.cities.join(' · ') || '日本';
  }

  function filters() {
    return { query, city: $('city').value, category: document.querySelector('[name="category"]:checked').value,
      career: document.querySelector('[name="career"]:checked').value, flexible: $('flexible').checked,
      salary: $('salary-only').checked, sort: $('sort').value };
  }

  function radioOptions(name, options) {
    return [['', '全部'], ...Object.entries(options)].map(([value, label]) => `<label class="filter-option"><input type="radio" name="${name}" value="${value}" ${value ? '' : 'checked'}><span>${label}</span></label>`).join('');
  }

  function clearFilters() {
    query = '';
    $('query').value = '';
    $('city').value = '';
    $('flexible').checked = false;
    $('salary-only').checked = false;
    document.querySelector('[name="category"][value=""]').checked = true;
    document.querySelector('[name="career"][value=""]').checked = true;
  }

  function setView(saved) {
    savedView = saved;
    resetList();
  }

  function resetList() {
    visible = pageSize;
    render();
  }

  function getJob(id) {
    return allJobs().find((job) => job.id === id) ?? bookmarks.get(id);
  }

  function renderStatus() {
    const live = [...feeds.values()].filter((feed) => feed.status === 'live').length;
    $('feed-status').textContent = refreshing ? '正在同步招聘来源' : live === feeds.size ? `${live} 个来源已同步` : live ? `${live} 个来源已同步 · 其余为快照` : `职位快照 ${originalDate}`;
    $('refresh').disabled = refreshing;
    $('source-list').innerHTML = SOURCES.map((source) => {
      const feed = feeds.get(source.key);
      return `<div class="source-row">${companyMark({ source: source.key })}<a href="${source.site}" target="_blank" rel="noopener noreferrer">${escape(source.name)}</a><span>${feed.status === 'live' ? '已同步' : '职位快照'} · ${feed.entries.length} 个</span></div>`;
    }).join('');
  }

  function renderChips(active) {
    const pairs = [['query', active.query], ['city', active.city], ['career', CAREERS[active.career]], ['category', CATEGORIES[active.category]],
      ['flexible', active.flexible ? '远程或混合' : ''], ['salary-only', active.salary ? '公开薪资' : '']];
    const markup = pairs.filter(([, label]) => label).map(([key, label]) => `<button type="button" data-remove="${key}" aria-label="移除 ${escape(label)}">${escape(label)} ${icon('close')}</button>`).join('');
    $('active-filters').innerHTML = markup;
    $('active-filters').hidden = !markup;
  }

  function renderCard(job) {
    const starred = bookmarks.has(job.id);
    const name = escape(job.titleZh);
    return `<article class="job-card">
      <div class="company-row">${companyMark(job)}<span>${escape(job.company)}</span></div>
      <button type="button" class="card-bookmark" data-bookmark="${escape(job.id)}" aria-pressed="${starred}" aria-label="${starred ? '取消收藏' : '收藏'} ${name}">${icon('bookmark')}</button>
      <h3><button type="button" class="job-title" data-detail="${escape(job.id)}">${name}</button></h3>
      <p class="job-original" title="${escape(job.title)}">${job.titleZh === job.title ? escape(CATEGORIES[job.category]) : escape(job.title)}</p>
      <div class="tags"><span class="tag">${icon('pin')}${escape(localPlace(job))}</span>${job.career ? `<span class="tag${['intern', 'graduate', 'early'].includes(job.career) ? ' rose' : ''}">${CAREERS[job.career]}</span>` : ''}${job.mode ? `<span class="tag">${MODES[job.mode]}</span>` : ''}</div>
      <div class="card-footer"><span class="salary${job.salary ? '' : ' unknown'}">${escape(job.salary || '薪资未公开')}</span><button type="button" class="card-details" data-detail="${escape(job.id)}">查看详情</button></div>
    </article>`;
  }

  function render() {
    const active = filters();
    const available = savedView ? [...bookmarks.keys()].map(getJob) : allJobs();
    const jobs = search(available, active);
    $('results-title').textContent = savedView ? '我的收藏' : '探索职位';
    $('result-count').textContent = `${jobs.length} 个职位`;
    for (const [key, selected] of [['browse', !savedView], ['saved', savedView]]) {
      $(key).classList.toggle('current', selected);
      $(key).setAttribute('aria-pressed', selected);
    }
    $('saved-count').hidden = bookmarks.size === 0;
    $('saved-count').textContent = bookmarks.size;
    renderStatus();
    renderChips(active);
    $('job-list').innerHTML = jobs.slice(0, visible).map(renderCard).join('');
    $('more').hidden = jobs.length <= visible;
    $('empty').hidden = jobs.length > 0;
    const noBookmarks = savedView && !bookmarks.size;
    $('empty-title').textContent = noBookmarks ? '还没有收藏' : '没有符合条件的职位';
    $('empty-copy').textContent = noBookmarks ? '点击职位卡片上的书签，稍后可以在这里查看。' : '可以减少筛选条件，或试试其他城市和关键词。';
    $('empty-action').textContent = noBookmarks ? '浏览职位' : '清除筛选';
  }

  function renderDetail(job) {
    const value = (text) => escape(text || '未注明');
    const fields = [['工作地', `${localPlace(job)}${job.location ? `（${job.location}）` : ''}`], ['招聘类型', CAREERS[job.career]],
      ['办公方式', MODES[job.mode]], ['公开薪资', job.salary], ['日语要求', job.language], ['签证支持', job.visa],
      ['固定加班', job.overtime], ['申请截止', formatDate(job.deadline)]];
    if (job.resident) fields.push(['居住要求', '原文写明仅限居住在日本的申请者']);
    const archived = !allJobs().some((current) => current.id === job.id);
    const description = job.description || '';
    const starred = bookmarks.has(job.id);
    $('job-detail').innerHTML = `<div class="company-row">${companyMark(job)}<span>${escape(job.company)}</span></div>
      <h2 id="detail-title">${escape(job.titleZh)}</h2><p class="detail-original">${escape(job.title)}</p>
      ${archived ? '<p class="translation-status">这是收藏时保存的记录，当前来源已未返回该职位。</p>' : ''}
      ${job.translation === 'glossary' ? '<p class="translation-status">中文标题为职种简译，完整职称见原文。</p>' : ''}
      ${job.summary ? `<h3>岗位要点</h3><p class="detail-summary">${escape(job.summary)}</p>` : ''}
      <dl class="fact-grid">${fields.map(([key, text]) => `<div><dt>${key}</dt><dd>${value(text)}</dd></div>`).join('')}</dl>
      <div class="detail-actions"><a class="primary" href="${escape(job.url)}" target="_blank" rel="noopener noreferrer">查看原文与申请</a>
      <button type="button" class="secondary" id="detail-bookmark" aria-pressed="${starred}">${icon('bookmark')} ${starred ? '已收藏' : '收藏'}</button></div>
      ${description ? `<h3>招聘详情</h3><div class="detail-actions"><button type="button" class="secondary" id="translate" aria-pressed="false">翻译当前正文</button></div><p class="translation-status" id="translation-status" role="status"></p><div id="job-description" class="description"></div>` : ''}`;
    $('detail-bookmark').onclick = () => {
      updateBookmark(job);
      const button = $('detail-bookmark');
      const selected = bookmarks.has(job.id);
      button.setAttribute('aria-pressed', selected);
      button.innerHTML = `${icon('bookmark')} ${selected ? '已收藏' : '收藏'}`;
      render();
    };
    if (description) wireTranslation(description, job.primaryLanguage);
  }

  function wireTranslation(description, primaryLanguage) {
    const text = description.slice(0, 5500);
    const clipped = description.length > text.length;
    const button = $('translate');
    const output = $('job-description');
    const status = $('translation-status');
    const defaultStatus = clipped ? '这里显示正文前段，完整内容见原文。' : '';
    output.textContent = text;
    status.textContent = defaultStatus;
    let chinese = '';
    button.onclick = async () => {
      if (button.getAttribute('aria-pressed') === 'true') {
        button.setAttribute('aria-pressed', 'false');
        button.textContent = '翻译当前正文';
        output.textContent = text;
        status.textContent = defaultStatus;
        return;
      }
      if (!('Translator' in globalThis)) {
        status.textContent = '此浏览器没有内置翻译功能。可以打开招聘原文，使用浏览器的网页翻译。';
        return;
      }
      button.disabled = true;
      status.textContent = '正在准备浏览器翻译，首次使用可能需要下载语言包。';
      try {
        const sourceLanguage = primaryLanguage || (/[\u3040-\u30ff]/.test(text.slice(0, 300)) ? 'ja' : 'en');
        if (!chinese) {
          const translator = await Translator.create({ sourceLanguage, targetLanguage: 'zh' });
          try {
            chinese = await translator.translate(text);
          } finally {
            translator.destroy();
          }
        }
        output.textContent = chinese;
        status.textContent = clipped ? '浏览器机器翻译 · 正文前段' : '浏览器机器翻译';
        button.setAttribute('aria-pressed', 'true');
        button.textContent = '查看原文';
      } catch {
        status.textContent = '浏览器翻译暂不可用。可在招聘原文页面使用网页翻译。';
      } finally {
        button.disabled = false;
      }
    };
  }

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    renderStatus();
    const results = await Promise.allSettled(SOURCES.map(async (source) => {
      if (source.mynavi) {
        return initial.jobs.filter((job) => job.source === source.key);
      }
      const response = await fetch(source.url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Feed HTTP ${response.status}`);
      const payload = await response.json();
      const jobs = source.lever ? payload : payload.jobs;
      if (!Array.isArray(jobs)) throw new Error('Unexpected feed response');
      return jobs.map((job) => normalize(job, source, initial.highlights)).filter(Boolean);
    }));
    for (const [index, result] of results.entries()) {
      const source = SOURCES[index];
      if (source.mynavi) {
        feeds.set(source.key, { status: 'snapshot', entries: initial.jobs.filter((job) => job.source === source.key) });
      } else if (result.status === 'fulfilled') {
        feeds.set(source.key, { status: 'live', entries: result.value });
      } else {
        feeds.get(source.key).status = 'snapshot';
      }
    }
    refreshing = false;
    render();
  }

  for (const element of document.querySelectorAll('[data-icon]')) {
    element.outerHTML = icon(element.dataset.icon).replace('class="icon"', `class="${element.className}"`);
  }
  for (const [city] of LOCATIONS) $('city').add(new Option(city, city));
  $('career-filters').innerHTML = radioOptions('career', CAREERS);
  $('category-filters').innerHTML = radioOptions('category', CATEGORIES);

  $('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    query = $('query').value.trim();
    setView(false);
    $('workspace').scrollIntoView({ behavior: 'instant' });
  });
  document.querySelector('.quick').addEventListener('click', (event) => {
    const button = event.target.closest('[data-quick]');
    if (!button) return;
    clearFilters();
    $('query').value = button.dataset.quick;
    $('city').value = button.dataset.city;
    $('search-form').requestSubmit();
  });
  document.querySelector('.filters').addEventListener('change', resetList);
  $('filter-toggle').onclick = () => {
    const button = $('filter-toggle');
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !expanded);
    button.textContent = expanded ? '展开筛选' : '收起筛选';
  };
  $('city').addEventListener('change', resetList);
  $('sort').addEventListener('change', resetList);
  $('reset').onclick = () => { clearFilters(); resetList(); };
  $('brand-home').addEventListener('click', (event) => {
    event.preventDefault();
    clearFilters();
    setView(false);
    window.scrollTo(0, 0);
  });
  $('browse').onclick = () => setView(false);
  $('saved').onclick = () => { clearFilters(); setView(true); $('workspace').scrollIntoView({ behavior: 'instant' }); };
  $('refresh').onclick = refresh;
  $('more').onclick = () => { visible += pageSize; render(); };
  $('empty-action').onclick = () => { clearFilters(); if (savedView && !bookmarks.size) setView(false); else resetList(); };

  $('active-filters').addEventListener('click', (event) => {
    const key = event.target.closest('[data-remove]')?.dataset.remove;
    if (!key) return;
    if (key === 'query') { query = ''; $('query').value = ''; }
    else if (key === 'city') $('city').value = '';
    else if (key === 'career' || key === 'category') document.querySelector(`[name="${key}"][value=""]`).checked = true;
    else $(key).checked = false;
    resetList();
  });

  $('job-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-detail], [data-bookmark]');
    if (!button) return;
    const job = getJob(button.dataset.detail ?? button.dataset.bookmark);
    if (!job) return;
    if (button.dataset.detail) {
      resetFocusTo = job.id;
      renderDetail(job);
      $('job-dialog').showModal();
      $('close-job').focus();
    } else {
      updateBookmark(job);
      const starred = bookmarks.has(job.id);
      if (savedView && !starred) render();
      else {
        button.setAttribute('aria-pressed', starred);
        button.setAttribute('aria-label', `${starred ? '取消收藏' : '收藏'} ${job.titleZh}`);
        $('saved-count').textContent = bookmarks.size;
        $('saved-count').hidden = !bookmarks.size;
      }
    }
  });

  $('job-dialog').addEventListener('close', () => {
    [...document.querySelectorAll('[data-detail]')].find((button) => button.dataset.detail === resetFocusTo)?.focus({ preventScroll: true });
  });
  $('close-job').onclick = () => $('job-dialog').close();
  $('show-sources').onclick = () => { renderStatus(); $('source-dialog').showModal(); };
  $('close-sources').onclick = () => $('source-dialog').close();

  render();
  refresh();
})();
