import puppeteer from 'puppeteer-core';
const routes = [
'center/dashboard','center/assets','center/sources','center/metadata','center/quality','center/quality-rules','center/quality-issues','center/standards','center/domains','center/sql','center/datasets','center/dev','center/report','center/indicators','center/indicator/148','center/indicator/5','center/subscriptions','center/tags','center/graph','center/models','center/marketplace',
'collection/overview','collection/runtime','collection/services','collection/channels','collection/orchestrate','collection/configs','collection/config/CFG-001','collection/reconcile','collection/tasks','collection/tables','collection/table/T01','collection/query','collection/debug','collection/quality','collection/alerts','collection/audit','collection/env','collection/hosts','collection/users','collection/roles',
'admin/users','admin/roles','admin/role/admin','admin/permissions','admin/apps','admin/data-permissions','admin/logs','admin/settings'];
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox','--disable-gpu','--hide-scrollbars'], userDataDir:'./.chrome-profile' });
const page = await browser.newPage();
await page.setViewport({width:1440,height:1000});
let errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));
for (const r of routes) {
  await page.goto('http://127.0.0.1:5188/'+r, {waitUntil:'networkidle0'});
  await new Promise(x=>setTimeout(x,250));
  const notFound = await page.$('.page-404');
  const title = await page.$eval('.page-title', el => el.textContent.trim()).catch(()=>'(none)');
  console.log(notFound ? 'MISSING' : 'ok', r, '|', title);
}
console.log('console errors:', [...new Set(errors)].slice(0,20));
await browser.close();
