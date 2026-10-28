import puppeteer from 'puppeteer-core';
const routes = ['center/dashboard','center/assets','center/indicators','center/indicator/148','center/graph','center/sql','center/models','collection/overview','collection/runtime','collection/config/CFG-001','collection/tables','collection/table/T01','collection/reconcile','collection/tasks','collection/entry','admin/permissions','admin/role/admin','admin/settings','collection/debug'];
const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox','--disable-gpu'], userDataDir:'./.chrome-profile' });
for (const width of [1440, 1280, 1024, 390]) {
  const p = await b.newPage(); await p.setViewport({width, height:900});
  const bad = [];
  for (const r of routes) {
    await p.goto('http://127.0.0.1:5188/'+r,{waitUntil:'networkidle0'}); await new Promise(x=>setTimeout(x,200));
    const res = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth, win: window.innerWidth }));
    if (res.doc > res.win + 2) bad.push(`${r}:${res.doc}>${res.win}`);
  }
  console.log(width, bad.length ? bad.join(' | ') : 'no overflow');
  await p.close();
}
await b.close();
