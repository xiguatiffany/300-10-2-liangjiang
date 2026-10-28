import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  userDataDir: './.chrome-profile',
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const go = async (p) => { await page.goto(`http://127.0.0.1:5188/${p}`, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 500)); };
const clickText = async (sel, text) => { await page.evaluate((sel, text) => { const els = [...document.querySelectorAll(sel)]; const el = els.find(e => e.textContent.includes(text)); if (el) el.click(); }, sel, text); await new Promise(r => setTimeout(r, 600)); };
const shot = async (n) => { await page.screenshot({ path: `shots/${n}.png` }); console.log('shot', n); };

// indicator detail tabs
await go('center/indicators');
await page.click('.data-table tbody tr');
await new Promise(r => setTimeout(r, 600));
await clickText('.tab', '可视化分析');
await shot('i-visual');
await clickText('.tab', '指标图谱');
await shot('i-graph');

// search
await go('center/dashboard');
await page.click('.search-box input');
await page.type('.search-box input', '患者', { delay: 20 });
await new Promise(r => setTimeout(r, 400));
await shot('search');
await page.keyboard.press('Escape');

// notifications
await page.click('.bell-btn');
await new Promise(r => setTimeout(r, 300));
await shot('notifications');
await page.keyboard.press('Escape');

// asset drawer
await go('center/assets');
await page.click('.asset-main .data-table tbody tr');
await new Promise(r => setTimeout(r, 500));
await shot('asset-drawer');
await clickText('.drawer .tab', '字段信息');
await shot('asset-drawer-fields');

// sql run
await go('center/sql');
await page.click('.sql-run-actions .btn-primary');
await new Promise(r => setTimeout(r, 1200));
await shot('sql-result');

// dataset detail
await go('center/datasets');
await page.click('.dataset-card');
await new Promise(r => setTimeout(r, 500));
await shot('dataset-detail');

// service modal
await go('collection/services');
await clickText('.page-actions .btn', '新增服务');
await shot('service-modal');

// alerts drawer
await go('collection/alerts');
await page.click('.data-table tbody tr');
await new Promise(r => setTimeout(r, 500));
await shot('alert-drawer');

// mobile
const mobile = await browser.newPage();
await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await mobile.goto('http://127.0.0.1:5188/center/dashboard', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 700));
await mobile.screenshot({ path: 'shots/mobile.png' });
await mobile.click('.mobile-menu');
await new Promise(r => setTimeout(r, 400));
await mobile.screenshot({ path: 'shots/mobile-nav.png' });
await browser.close();
