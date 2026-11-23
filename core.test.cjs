const test = require('node:test');
const assert = require('node:assert/strict');
const { categorize, facts, normalize, search, SOURCES } = require('./core.js');

test('Chinese, Japanese and English terms can match the same real role type', () => {
  const job = normalize({ id: 3, title: 'Backend Engineer', location: { name: 'Tokyo, Japan' },
    absolute_url: 'https://job-boards.greenhouse.io/paypaysec/jobs/3' }, SOURCES[0]);
  for (const query of ['东京 软件开发', '東京 バックエンド', 'Tokyo backend', '后端 东京']) {
    assert.deepEqual(search([job], { query }), [job], query);
  }
  assert.deepEqual(search([job], { query: '大阪 软件开发' }), []);
  assert.deepEqual(search([job], { query: '量子', category: 'tech' }), []);
  const unrelated = { ...job, title: 'Office Assistant', titleZh: '办公室助理', company: 'Company Limited', category: 'corporate' };
  assert.deepEqual(search([unrelated], { query: '软件开发' }), []);
});

test('matches eligible careers only when the listing names that career', () => {
  assert.equal(categorize('Client Service Intern').career, 'intern');
  assert.equal(categorize('Software Engineer - New Graduate 2027').career, 'graduate');
  assert.equal(categorize('システムエンジニア（第二新卒歓迎）').career, 'early');
  assert.equal(categorize('Software Engineer', 'Our team graduated from college in 2027').career, '');
  assert.equal(categorize('Associate Engineer').career, '');
  assert.equal(categorize('Senior Data Engineer').career, 'experienced');
  assert.equal(categorize('Software Engineer', 'We are unable to offer internships.').career, '');
});

test('unrelated dates, relocation and vague compensation do not imply requirements', () => {
  const fields = facts('Relocation assistance is available. Salary dependent on experience. Updated 2026-05-10.', '');
  for (const name of ['visa', 'salary', 'deadline', 'language', 'overtime']) assert.equal(fields[name], '');
  assert.equal(facts('No visa sponsorship is available.', '').visa, '不提供签证支持');
  assert.equal(facts('Business level in either English or Japanese (JLPT N1)', '').language, '商务英语或商务日语（N1）');
  assert.equal(facts('Monthly Salary: JPY 571,000- JPY 959,000\nIncludes fixed overtime pay for 45 hours', '').salary, '57.1万–95.9万日元 / 月');
  assert.equal(facts('Monthly Salary: JPY 571,000- JPY 959,000\nIncludes fixed overtime pay for 45 hours', '').overtime, '含 45 小时固定加班');
  assert.equal(facts('Base salary: USD 148,000 per year', '').salary, '');
});

test('non-Japanese and non-job results are skipped and multi-city locations remain searchable', () => {
  const source = SOURCES[0];
  const raw = { id: 8, title: 'Technical Support Engineer', location: { name: 'Nagoya, Japan; Osaka, Japan; Tokyo, Japan' },
    absolute_url: 'https://job-boards.greenhouse.io/paypaysec/jobs/8' };
  const job = normalize(raw, source);
  assert.deepEqual(job.cities, ['东京', '大阪', '爱知县']);
  assert.equal(search([job], { query: '爱知 技术支持' }).length, 1);
  assert.equal(search([job], { city: '大阪' }).length, 1);
  const okazaki = normalize({ ...raw, location: { name: 'Okazaki, Aichi' } }, source);
  assert.equal(search([job, okazaki], { query: '名古屋' }).length, 1);
  assert.equal(normalize({ ...raw, location: { name: 'London' } }, source), null);
  assert.equal(normalize({ ...raw, title: 'Employee Referral' }, source), null);
  assert.equal(normalize({ ...raw, absolute_url: 'javascript:alert(0)' }, source), null);
});

test('normalizes Mynavi data source with Japanese salary, tags and remote mode', () => {
  const mynaviSource = SOURCES.find(s => s.key === 'mynavi');
  assert.ok(mynaviSource, 'Mynavi source should be registered');
  const rawMynavi = {
    id: '307477-1-49-1',
    company: '日研トータルソーシング株式会社',
    title: 'トヨタ・日産等に配属／未経験可／在宅可【テクニカルサポート】',
    url: 'https://tenshoku.mynavi.jp/jobinfo-307477-1-49-1/',
    location: '全国47都道府県（東京・大阪・愛知・福岡）',
    salary: '360万–420万日元 / 年',
    description: '大手メーカーの開発チームでエンジニアをサポート！\n第二新卒歓迎\n在宅勤務・リモートワーク可',
    tags: ['正社員', '第二新卒歓迎', 'リモートワーク可']
  };
  const job = normalize(rawMynavi, mynaviSource);
  assert.equal(job.company, '日研トータルソーシング株式会社');
  assert.equal(job.source, 'mynavi');
  assert.equal(job.titleZh, '技术支持工程师');
  assert.equal(job.career, 'early');
  assert.equal(job.mode, 'remote');
  assert.equal(job.salary, '360万–420万日元 / 年');
  assert.ok(job.cities.includes('东京'));
  assert.ok(job.cities.includes('大阪'));
  assert.ok(job.cities.includes('爱知县'));
  assert.ok(job.cities.includes('福冈'));

  assert.equal(search([job], { query: '技术支持' }).length, 1);
  assert.equal(search([job], { query: 'テクニカルサポート' }).length, 1);
  assert.equal(search([job], { query: '日研' }).length, 1);
  assert.equal(search([job], { query: '东京', career: 'early' }).length, 1);
});

test('normalizes Mynavi 2027 new graduate data source and matches graduate search', () => {
  const source27 = SOURCES.find(s => s.key === 'mynavi2027');
  assert.ok(source27, 'Mynavi 2027 source should be registered');
  const raw27 = {
    id: '228375',
    company: 'UTエイム(株)',
    title: '文理不問・未経験から将来性抜群の「半導体」エンジニアへ！',
    url: 'https://job.mynavi.jp/27/pc/search/corp228375/outline.html',
    location: '東京都品川区',
    industry: '半導体・電子・電気機器、機械、総合電機',
    career: 'graduate',
    country: 'JP',
    description: '【企业名称】\nUTエイム(株)\n【所属行业】\n半導体・電子・電気機器'
  };
  const job = normalize(raw27, source27);
  assert.equal(job.company, 'UTエイム(株)');
  assert.equal(job.source, 'mynavi2027');
  assert.equal(job.career, 'graduate');
  assert.ok(job.cities.includes('东京'));

  assert.equal(search([job], { query: '半导体' }).length, 1);
  assert.equal(search([job], { career: 'graduate' }).length, 1);
  assert.equal(search([job], { query: 'UTエイム' }).length, 1);
});
