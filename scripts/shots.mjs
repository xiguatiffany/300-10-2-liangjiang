import puppeteer from 'puppeteer-core';

const routes = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  userDataDir: './.chrome-profile',
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
for (const route of routes) {
  const [path, name] = route.split(':');
  await page.goto(`http://127.0.0.1:5188/${path}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `shots/${name}.png` });
  console.log('captured', name);
}
await browser.close();
