import { test, expect } from "@playwright/test";

test.describe("persistence", () => {
  test("restores after reload", async ({ page }) => {
    await page.goto("/editor");
    await page.waitForFunction(() => !!(window as any).monacoApi?.main);
    await page.click(".monaco-editor");
    await page.keyboard.insertText('{"x":1}');
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForFunction(() => !!(window as any).monacoApi?.main);
    await page.waitForTimeout(1000);
    const val = await page.evaluate(() => (window as any).monacoApi?.main?.getValue());
    expect(val).toContain("\"x\"");
  });

  test("cross tab sync", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    await page1.goto("/editor");
    await page2.goto("/editor");
    await page1.waitForFunction(() => !!(window as any).monacoApi?.main);
    await page2.waitForFunction(() => !!(window as any).monacoApi?.main);
    await page1.click(".monaco-editor");
    await page1.keyboard.insertText('{"y":2}');
    await page1.waitForTimeout(1000);
    await page2.waitForTimeout(1000);
    const v2 = await page2.evaluate(() => (window as any).monacoApi?.main?.getValue());
    expect(v2).toContain("\"y\"");
    await context1.close();
    await context2.close();
  });
});
