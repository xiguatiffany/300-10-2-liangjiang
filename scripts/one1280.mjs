import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox','--disable-gpu','--hide-scrollbars'], userDataDir:'./.chrome-profile' });
const p = await b.newPage(); await p.setViewport({width:1280,height:900});
await p.goto('http://127.0.0.1:5188/center/indicators',{waitUntil:'networkidle0'}); await new Promise(r=>setTimeout(r,500));
await p.screenshot({path:'shots/1280-indicators2.png'}); await b.close();
