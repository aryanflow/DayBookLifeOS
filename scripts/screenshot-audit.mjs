import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../screenshots-audit");
const base = "http://127.0.0.1:5173";

async function loginDemo(page) {
  const demoBtn = page.getByRole("button", { name: /Login as Test/i });
  if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await demoBtn.click();
    await page.waitForTimeout(800);
    return;
  }
  const testUser = page.getByRole("button", { name: /^Test/i });
  if (await testUser.isVisible({ timeout: 2000 }).catch(() => false)) {
    await testUser.click();
    await page.waitForTimeout(400);
    const cont = page.getByRole("button", { name: /Open my Daybook/i });
    if (await cont.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cont.click();
      await page.waitForTimeout(800);
    }
  }
}

async function shot(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, name), fullPage: true });
}

async function runViewport(browser, label, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(base, { waitUntil: "networkidle" });
  await shot(page, `${label}-01-entry.png`);
  await loginDemo(page);
  await shot(page, `${label}-02-today.png`);

  for (const tab of ["habits", "money", "food", "work", "trends"]) {
    const btn = page.getByRole("button", { name: new RegExp(`^${tab.charAt(0).toUpperCase() + tab.slice(1)}$`, "i") }).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await shot(page, `${label}-03-${tab}.png`);
    }
  }

  const settings = page.getByRole("button", { name: /Open settings/i });
  if (await settings.isVisible({ timeout: 2000 }).catch(() => false)) {
    await settings.click();
    await page.waitForTimeout(400);
    await shot(page, `${label}-04-settings.png`);
  }

  await page.close();
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  await runViewport(browser, "mobile", 390, 844);
  await runViewport(browser, "desktop", 1280, 900);
} finally {
  await browser.close();
}
console.log("Screenshots saved to", outDir);
