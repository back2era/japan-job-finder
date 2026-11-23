'use strict';

const JobsCore = (() => {
  const greenhouse = (key, name, mark, tone, board = key) => ({ key, name, mark, tone,
    url: `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`,
    site: `https://job-boards.greenhouse.io/${board}` });
  const SOURCES = [
    greenhouse('paypaysec', 'PayPay 证券', 'P', 'peach'),
    greenhouse('siei', 'Sony Interactive Entertainment', 'S', 'lavender'),
    { key: 'woven', name: 'Woven by Toyota', mark: 'W', tone: 'ice', lever: true,
      url: 'https://api.lever.co/v0/postings/woven-by-toyota?mode=json', site: 'https://jobs.lever.co/woven-by-toyota/' },
    greenhouse('skydrive', 'SkyDrive', 'S', 'ice', 'joblist'),
    greenhouse('guidepoint', 'Guidepoint', 'G', 'sand'),
    greenhouse('tanium', 'Tanium', 'T', 'green'),
    { key: 'mujin', name: 'Mujin', mark: 'M', tone: 'peach', lever: true,
      url: 'https://api.lever.co/v0/postings/mujininc?mode=json', site: 'https://jobs.lever.co/mujininc' },
  ];
  const LOCATIONS = [
    ['东京', /東京|东京|\btokyo\b/i], ['大阪', /大阪|\bosaka\b/i],
    ['爱知县', /名古屋|爱知|愛知|豊山|岡崎|冈崎|\b(?:nagoya|aichi|toyoyama|okazaki)\b/i],
    ['静冈', /静岡|静冈|裾野|磐田|\b(?:shizuoka|susono|iwata)\b/i],
    ['神奈川', /神奈川|横浜|横滨|\b(?:kanagawa|yokohama|kawasaki)\b/i],
    ['京都', /\bkyoto\b|(?<!東)京都/i], ['福冈', /福岡|福冈|\bfukuoka\b/i],
    ['北海道', /北海道|札幌|\b(?:hokkaido|sapporo)\b/i],
  ];
  const CATEGORIES = {
    tech: '软件与 IT', engineering: '硬件与工程', design: '设计与游戏', product: '产品与项目',
    business: '商务与运营', finance: '金融与财务', corporate: '职能与支持', other: '其他职种',
  };
  const CAREERS = { graduate: '应届／新卒', early: '毕业不久／第二新卒', intern: '实习', experienced: '有经验' };
  const MODES = { flexible: '远程／混合', hybrid: '混合办公', remote: '远程办公', onsite: '现场办公' };
  const TERM_GROUPS = [
    ['软件开发', '软件工程', '程序员', 'it', 'エンジニア', 'software', 'developer'],
    ['后端', '后台', 'backend', 'バックエンド', 'server-side', 'サーバーサイド'],
    ['前端', 'frontend', 'front-end', 'フロントエンド'],
    ['人工智能', '机器学习', 'ai', 'ml', 'machine learning', '機械学習'],
    ['技术支持', 'technical support', 'テクニカルサポート', 'it support'],
    ['设计', 'designer', 'design', 'デザイナー', 'デザイン'],
    ['会计', '财务', 'accounting', 'finance', '経理', '財務'],
    ['销售', '营业', 'sales', '営業'], ['市场', '营销', 'marketing', 'マーケティング'],
    ['客服', '客户服务', 'client service', 'customer support', 'カスタマーサポート'],
    ['数据', 'data', 'データ'], ['项目管理', '项目经理', 'project manager', 'プロジェクトマネージャー'],
    ['游戏', 'game', 'ゲーム'],
  ];
  const ROLE_NAMES = [
    [/backend|back-end|バックエンド|サーバーサイド/i, '后端工程师'],
    [/front.?end|フロントエンド/i, '前端工程师'], [/full.?stack|フルスタック/i, '全栈工程师'],
    [/data engineer|データエンジニア/i, '数据工程师'], [/data scien|データサイエン/i, '数据科学'],
    [/machine learning|機械学習/i, '机器学习工程师'], [/\bai\b.*(?:engineer|エンジニア)/i, 'AI 工程师'],
    [/\bsre\b|reliability engineer/i, '站点可靠性工程师'],
    [/qa engineer|品質保証|test engineer|テストエンジニア/i, '测试／质量工程师'],
    [/security.*engineer|セキュリティ.*エンジニア/i, '安全工程师'],
    [/technical support|it support|itサポート/i, '技术支持工程师'],
    [/cloud infrastructure|クラウドインフラ/i, '云基础设施工程师'],
    [/software|ソフトウェア|programmer|プログラマー/i, '软件工程师'],
    [/product manager|プロダクトマネージャー/i, '产品经理'],
    [/project manager|プロジェクトマネージャー/i, '项目经理'],
    [/product designer|プロダクトデザイナー/i, '产品设计师'],
    [/game designer|ゲームデザイナー/i, '游戏设计师'], [/3d artist|3dアーティスト/i, '3D 美术师'],
    [/business develop|事業開発/i, '业务拓展'], [/client service|customer support|カスタマーサポート/i, '客户服务'],
    [/marketing|マーケティング/i, '市场营销'], [/sales|営業/i, '销售'],
    [/accounting|経理/i, '会计'], [/recruit|採用(?!.*エンジニア)/i, '招聘'],
  ];

  const clean = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const lower = (value) => clean(value).toLowerCase();
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—' };

  function decode(text) {
    return String(text ?? '').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, token) => {
      if (!token.startsWith('#')) return entities[token.toLowerCase()] ?? match;
      const number = /^#x/i.test(token) ? parseInt(token.slice(2), 16) : Number(token.slice(1));
      return number <= 0x10ffff ? String.fromCodePoint(number) : match;
    });
  }

  function plainText(html) {
    return decode(decode(html)).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<\/?(?:br|p|li|div|ul|ol|h[1-6]|section|tr)\b[^>]*>/gi, '\n')
      .replace(/<[^<>]*>/g, '').split('\n').map(clean).filter(Boolean).join('\n');
  }

  function categorize(title, description = '', commitment = '') {
    let career = '';
    if (/\bintern(?:ship)?\b|インターン/.test(lower(`${title} ${commitment}`))) career = 'intern';
    else if (/new grad(?:uate)?|graduate program|(?<!第二)(?<!第2)新卒/i.test(title)) career = 'graduate';
    else if (/第(?:二|2)新卒/.test(title)) career = 'early';
    else if (/mid.?career|ミッドキャリア|中途|\bsenior\b|\bstaff engineer\b|\bprincipal\b|\bdirector\b|シニア/i.test(title)
      || /(?:^|\n)[^\n]{0,40}\b(?:[3-9]|1\d)\+\s+years?\s+(?:of\s+)?(?:\S+\s+){0,4}experience\b/im.test(description)
      || /[3-9](?:年|年以上)の.{0,18}(?:実務|開発|業務)経験/.test(description)) career = 'experienced';

    const category = [
      ['design', /design(?:er)?\b|デザイン|デザイナー|artist|アーティスト|animat|アニメーター/],
      ['finance', /accounting|accounts payable|treasur|compliance|financial|finance|経理|財務|金融商品|証券トレーダー/],
      ['product', /project manager|product manager|program manager|スクラムマスター|プロダクトマネージャ|プロジェクトマネージャ|\bpmo\b/],
      ['engineering', /aerodynam|e?vtol|mechanical|hardware|avionics|rotor|flight|chip|半導体|ハードウェア|機体|飛行|サプライチェーン品質|電気設計|組立/],
      ['tech', /engineer|developer|software|programmer|devops|セキュリティ|エンジニア|ソフトウェア|プログラマー|データ基盤|基幹システム|\bit\b/],
      ['business', /sales|marketing|customer|client|business|operations|事業|営業|企画|マーケティング|運航|物流/],
      ['corporate', /talent|recruit|translator|hr\b|legal|administrat|法務|人事|採用|通訳|総務/],
    ].find(([, pattern]) => pattern.test(lower(title)))?.[0] ?? 'other';
    return { category, career };
  }

  function facts(description, rawDeadline) {
    const lines = description.split('\n').map(clean);
    const annual = /(?:estimated\s+)?annual (?:base )?salary\s*:?\s*/i;
    const monthly = /monthly (?:base )?salary\s*:?\s*/i;
    const englishSalary = new RegExp(`^(${annual.source}|${monthly.source})(?:JPY|¥)\\s*([\\d,]{4,})(?:\\s*[-–—~〜]\\s*(?:JPY|¥)?\\s*([\\d,]{4,}))?`, 'i');
    const japaneseSalary = /^(?:想定)?(年収|月給|月額給与|基本給)\s*[:：]?\s*([\d,.]+)\s*(万?円)?(?:\s*[-〜～~–]\s*([\d,.]+)\s*(万?円))?/;
    let salary = '';
    for (const line of lines) {
      const en = line.match(englishSalary);
      const ja = line.match(japaneseSalary);
      if (en) {
        const yen = (value) => Number(value.replaceAll(',', '')) / 10000;
        salary = `${yen(en[2])}${en[3] ? `万–${yen(en[3])}` : ''}万日元 / ${annual.test(en[1]) ? '年' : '月'}`;
      } else if (ja && (ja[3] || ja[5])) {
        const format = (amount, unit) => `${amount}${unit?.includes('万') ? '万' : ''}`;
        salary = `${format(ja[2], ja[3] || ja[5])}${ja[4] ? `–${format(ja[4], ja[5])}` : ''}日元 / ${ja[1] === '年収' ? '年' : '月'}`;
      }
      if (salary) break;
    }

    const visaLine = lines.find(line => /visa sponsorship|visa support|ビザ(?:取得|申請)?(?:サポート|支援)|就労ビザ/i.test(line)) || '';
    let visa = '';
    if (/not (?:provide|offer|available|eligible)|\bno\b|cannot|unable|なし|不可|対象外/i.test(visaLine)) visa = '不提供签证支持';
    else if (/visa (?:sponsorship|support)\s*(?:is|:)?\s*(?:available|provided|yes)|(?:we (?:offer|provide)|includes)\s+visa|ビザ.{0,12}(?:支援|サポート).{0,4}(?:あり|有り)/i.test(visaLine)) visa = '提供签证支持';

    let language = '';
    const requirement = lines.find(line => /business level in either English or Japanese/i.test(line));
    const level = lines.find(line => /(?:required|must|requirement|必須|以上|相当|equivalent)/i.test(line) && /\bN[1-5]\b/i.test(line))?.match(/\bN[1-5]\b/i)?.[0];
    if (requirement) language = `商务英语或商务日语${/\bN1\b/.test(requirement) ? '（N1）' : ''}`;
    else if (lines.some(line => /Japanese.{0,24}not required|日本語(?:力|能力)?(?:は|が)?不要/i.test(line))) language = '原文写明无需日语';
    else if (level) language = `原文提及日语 ${level.toUpperCase()}，请核对要求`;
    else if (lines.some(line => /conversational or higher proficiency in Japanese|日常会話レベル.{0,8}日本語|日本語.{0,12}日常会話レベル/i.test(line))) language = '日常会话水平或以上';
    else if (lines.some(line => /business.level japanese|business-level proficiency in Japanese|日本語.{0,12}ビジネスレベル|ビジネスレベル.{0,8}日本語/i.test(line))) language = '原文提及商务日语';

    const resident = lines.some(line => /Japan residents only|must (?:currently )?(?:reside|be based) in Japan|日本在住(?:の方)?(?:のみ|限定)|国内在住(?:の方)?(?:のみ|限定)/i.test(line));
    const overtimeLine = lines.find(line => /fixed overtime|固定残業/i.test(line)) || '';
    const hours = overtimeLine.match(/(\d+(?:\.\d+)?)\s*(?:hours?|時間)/i)?.[1];
    let overtime = overtimeLine ? '原文载有固定加班条款' : '';
    if (/no fixed overtime|固定残業(?:代|制度)?[：:\s]*(?:なし|無し)/i.test(overtimeLine)) overtime = '无固定加班费';
    else if (hours) overtime = `含 ${hours} 小时固定加班`;
    const deadline = String(rawDeadline ?? '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
    return { salary, visa, language, resident, overtime, deadline };
  }

  function normalize(raw, source, highlights = {}) {
    const title = clean(raw.title ?? raw.text);
    if (!title || /employee referral|リファラル|キャリア登録|career mixer|talent community|internship program registration|register for future/i.test(title)) return null;
    const location = clean(raw.location?.name ?? raw.categories?.location);
    const cities = LOCATIONS.filter(([, pattern]) => pattern.test(location)).map(([name]) => name);
    if (!cities.length && !/\bjapan\b|日本|全国/i.test(location) && raw.country !== 'JP') return null;
    const url = String(raw.absolute_url ?? raw.hostedUrl ?? '');
    if (!/^https:\/\//i.test(url) || !raw.id) return null;
    const id = `${source.key}:${raw.id}`;
    const translated = highlights[id];
    const description = source.lever ? [raw.descriptionBodyPlain ?? raw.descriptionPlain,
      ...((raw.lists ?? []).map((list) => `${list.text}\n${plainText(list.content)}`)), raw.additionalPlain].filter(Boolean).join('\n') : plainText(raw.content);
    const { category, career } = categorize(title, description, raw.categories?.commitment);
    const workplace = `${location} ${raw.workplaceType ?? ''}`;
    let mode = '';
    if (/remote\s*[/／]\s*hybrid|hybrid\s*[/／]\s*remote/i.test(workplace)) mode = 'flexible';
    else if (/hybrid|ハイブリッド/i.test(workplace)) mode = 'hybrid';
    else if (/remote|リモート/i.test(workplace)) mode = 'remote';
    else if (/on.?site|出社/i.test(workplace)) mode = 'onsite';
    const role = ROLE_NAMES.find(([pattern]) => pattern.test(title))?.[1] ?? '';
    const titleZh = translated?.[0] || (role ? `${role}${career === 'intern' ? '实习' : ''}` : title);
    const published = raw.first_published ?? (Number.isFinite(raw.createdAt) ? new Date(raw.createdAt).toISOString() : '');
    const primaryLanguage = /^(?:en|ja)$/.test(raw.language) ? raw.language : '';
    return { id, source: source.key, company: source.name, title, titleZh,
      translation: translated ? 'curated' : role ? 'glossary' : '', summary: translated?.[1] ?? '',
      location, cities, category, career, mode, url, published, description, primaryLanguage,
      ...facts(description, raw.application_deadline) };
  }

  function search(jobs, { query = '', city = '', category = '', career = '', flexible = false, salary = false, sort = 'recommended' } = {}) {
    const requested = lower(query).split(/[\s,，、/／]+/).filter(Boolean);
    const matches = jobs.filter((job) => {
      if ((city && !job.cities.includes(city)) || (category && job.category !== category) || (career && job.career !== career)) return false;
      if ((flexible && !['hybrid', 'remote', 'flexible'].includes(job.mode)) || (salary && !job.salary)) return false;
      const haystack = lower([job.title, job.titleZh, job.company, job.location, ...job.cities, CATEGORIES[job.category], CAREERS[job.career], job.summary].join(' '));
      return requested.every((word) => {
        if (/^(?:名古屋|nagoya)$/.test(word)) return /nagoya|名古屋/i.test(job.location);
        const place = LOCATIONS.find(([name, pattern]) => name === word || pattern.test(word));
        if (place) return job.cities.includes(place[0]);
        if (/^(?:应届|新卒|校招|graduate)$/.test(word)) return job.career === 'graduate';
        if (/^(?:第二新卒|毕业不久)$/.test(word)) return job.career === 'early';
        if (/^(?:实习|intern|インターン)$/.test(word)) return job.career === 'intern';
        if (/^(?:软件开发|软件工程|it|开发)$/.test(word) && job.category === 'tech') return true;
        if (/^(?:远程|remote)$/.test(word)) return job.mode === 'remote' || job.mode === 'flexible';
        const synonyms = TERM_GROUPS.find((group) => group.includes(word)) ?? [word];
        return synonyms.some((term) => /^[a-z]{1,3}$/.test(term)
          ? haystack.split(/[^a-z0-9]+/).includes(term)
          : haystack.includes(term));
      });
    });
    return matches.sort((a, b) => {
      const date = String(b.published || '').localeCompare(String(a.published || ''));
      if (sort === 'latest') return date;
      if (sort === 'salary') return Number(Boolean(b.salary)) - Number(Boolean(a.salary)) || date;
      return Number(Boolean(b.summary)) - Number(Boolean(a.summary)) ||
        Number(Boolean(b.translation)) - Number(Boolean(a.translation)) || date;
    });
  }

  return { SOURCES, LOCATIONS, CATEGORIES, CAREERS, MODES, categorize, facts, normalize, search };
})();

if (typeof module === 'object' && module.exports) module.exports = JobsCore;
