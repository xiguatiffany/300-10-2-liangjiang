import puppeteer from 'puppeteer-core';
const routes = ['center/dashboard','center/indicators','collection/config/CFG-001','collection/tables','admin/role/admin','collection/overview','center/quality','collection/orchestrate'];
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox','--disable-gpu','--hide-scrollbars'], userDataDir:'./.chrome-profile' });
const page = await browser.newPage(); await page.setViewport({width:1280,height:900});
for (const r of routes) {
  const name = r.replace(/[\/]/g,'-');
  await page.goto('http://127.0.0.1:5188/'+r,{waitUntil:'networkidle0'});
  await new Promise(x=>setTimeout(x,500));
  await page.screenshot({path:`shots/1280-${name}.png`});
}
await browser.close();
