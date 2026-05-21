import { test } from '@playwright/test';

test('debug /history errors', async ({ page }) => {
  const errors: string[] = [];
  const trpcResponses: Array<{url: string, status: number, body: string}> = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  page.on('response', async res => {
    if (res.url().includes('/trpc/history')) {
      try {
        const body = await res.text();
        trpcResponses.push({url: res.url(), status: res.status(), body: body.slice(0, 200)});
      } catch {}
    }
  });
  
  await page.goto('http://localhost:3000/auth/dev-login');
  await page.waitForURL('http://localhost:5173/**');
  await page.goto('/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const errorElem = await page.locator('.text-destructive').first().textContent().catch(() => 'none');
  
  console.log('Console errors:', JSON.stringify(errors));
  console.log('tRPC responses:', JSON.stringify(trpcResponses));
  console.log('Error element:', errorElem);
});
