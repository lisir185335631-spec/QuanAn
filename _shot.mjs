import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
const pages = [['diagnosis', 'V-Diagnosis'], ['step/4', 'V-Step4'], ['step/3', 'V-Step3']];
for (const [route, name] of pages) {
  await page.goto(`http://localhost:5173/${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.evaluate(async () => { await new Promise((r)=>{let y=0;const h=document.body.scrollHeight;const s=()=>{window.scrollTo(0,y);y+=700;if(y<h)setTimeout(s,30);else{window.scrollTo(0,0);setTimeout(r,200);}};s();}); });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `/Users/return/Desktop/${name}.png`, fullPage: true });
}
console.log('SHOT_OK errs=' + (errs.length?errs.join('|'):'无'));
await browser.close();
