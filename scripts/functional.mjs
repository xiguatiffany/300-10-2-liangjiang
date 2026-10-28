import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox','--disable-gpu'], userDataDir:'./.chrome-profile' });
const page = await browser.newPage();
await page.setViewport({width:1440,height:1000});
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
const go=async p=>{await page.goto('http://127.0.0.1:5188/'+p,{waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,400));};
const text=async s=>page.$eval(s,e=>e.textContent).catch(()=>null);

// add service
await go('collection/services');
await page.evaluate(()=>{const b=[...document.querySelectorAll('.page-actions .btn')].find(x=>x.textContent.includes('新增服务'));b.click();});
await new Promise(r=>setTimeout(r,300));
await page.type('.modal input.input', 'demo_service_source');
await page.evaluate(()=>{const b=[...document.querySelectorAll('.modal-foot .btn')].find(x=>x.textContent.includes('注册服务'));b.click();});
await new Promise(r=>setTimeout(r,500));
console.log('service rows:', await page.$$eval('.data-table tbody tr', els=>els.length));
console.log('toast:', await text('.toast'));

// config transfer
await go('collection/config/CFG-001');
const before = await text('.transfer-pane-head em');
await page.evaluate(()=>{const rows=[...document.querySelectorAll('.transfer-pane')][1].querySelectorAll('.transfer-row input');rows[0].click();});
await page.evaluate(()=>{const b=[...document.querySelectorAll('.transfer-actions button')][1];b.click();});
await new Promise(r=>setTimeout(r,300));
const after = await text('.transfer-pane-head em');
console.log('transfer count before/after:', before, after);

// reconcile run
await go('collection/reconcile');
await page.click('.data-table tbody tr');
await new Promise(r=>setTimeout(r,400));
await page.evaluate(()=>{const b=[...document.querySelectorAll('.drawer .btn')].find(x=>x.textContent.includes('重新对账'));b.click();});
await new Promise(r=>setTimeout(r,1600));
console.log('reconcile state:', await text('.drawer-summary'));

// search navigate
await go('center/dashboard');
await page.click('.search-box input');
await page.type('.search-box input','爽约');
await new Promise(r=>setTimeout(r,400));
await page.evaluate(()=>{const b=document.querySelector('.search-panel .sp-row');b&&b.click();});
await new Promise(r=>setTimeout(r,500));
console.log('search nav path:', await page.evaluate(()=>location.pathname));
console.log('search nav title:', await text('.page-title'));

// mobile nav
const m = await browser.newPage(); await m.setViewport({width:390,height:844});
await m.goto('http://127.0.0.1:5188/center/dashboard',{waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,300));
await m.click('.mobile-menu'); await new Promise(r=>setTimeout(r,300));
console.log('mobile sidebar open:', await m.$eval('.sidebar', e=>e.classList.contains('is-open')));
console.log('errors:', errors);
await browser.close();
