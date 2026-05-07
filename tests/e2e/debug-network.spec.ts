import { test } from '@playwright/test';

test('debug: check React Query cache data', async ({ page }) => {
  // Intercept AND log what we return
  await page.route('**/trpc/auth.me**', async (route) => {
    const mockBody = [{ result: { data: { ok: true, user: { id: 1, email: 'dev@local.test', name: 'Dev User' } } } }];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBody),
    });
  });
  
  await page.goto('/');
  await page.waitForSelector('[data-testid="app-header"]');
  await page.waitForTimeout(3000);
  
  // Inspect the actual DOM to see login vs user trigger
  const loginBtn = await page.locator('[data-testid="header-login-button"]').count();
  const userTrigger = await page.locator('[data-testid="header-user-trigger"]').count();
  console.log('LOGIN_BTN_COUNT:', loginBtn, 'USER_TRIGGER_COUNT:', userTrigger);
  
  // Inject a test to call useAuth internals
  const authState = await page.evaluate(async () => {
    // Make a direct fetch to see what the mocked response looks like
    const res = await fetch('http://localhost:3000/trpc/auth.me?batch=1&input=%7B%7D');
    const data = await res.json() as Array<{result: {data: unknown}}>;
    return { 
      rawData: data,
      // Check: is ok true?
      isOk: Array.isArray(data) && data[0]?.result?.data ? 
        (data[0].result.data as Record<string, unknown>)['ok'] : 'not found'
    };
  });
  console.log('AUTH_STATE:', JSON.stringify(authState));
});
