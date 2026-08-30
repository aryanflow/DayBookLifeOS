#!/usr/bin/env node
/** Rasterize Pure Dot SVGs to PNG/ICO for tabs, iOS, and PWA (requires Playwright). */
import { chromium } from "playwright";
import toIco from "to-ico";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BRAND_TILE, faviconSvg } from "../src/constants/brand.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function svgToPngBuffer(page, svg, px) {
  await page.setViewportSize({ width: px, height: px, deviceScaleFactor: 1 });
  await page.setContent(
    `<!DOCTYPE html><html><body style="margin:0;padding:0;width:${px}px;height:${px}px;background:${BRAND_TILE};overflow:hidden;display:flex">${svg}</body></html>`,
    { waitUntil: "networkidle" }
  );
  return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: px, height: px } });
}

async function svgFileToPng(page, svgFile, outFile, px) {
  const svg = readFileSync(path.join(root, svgFile), "utf8");
  const png = await svgToPngBuffer(page, svg, px);
  writeFileSync(path.join(root, outFile), png);
  console.log("Wrote", outFile);
  return png;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await svgFileToPng(page, "public/apple-touch-icon.svg", "public/apple-touch-icon.png", 180);
await svgFileToPng(page, "public/icon-512.svg", "public/icon-512.png", 512);

const png16 = await svgToPngBuffer(page, faviconSvg(16), 16);
const png32 = await svgToPngBuffer(page, faviconSvg(32), 32);
const png48 = await svgToPngBuffer(page, faviconSvg(48), 48);

writeFileSync(path.join(root, "public/favicon-16.png"), png16);
writeFileSync(path.join(root, "public/favicon-32.png"), png32);
writeFileSync(path.join(root, "public/favicon-48.png"), png48);
writeFileSync(path.join(root, "public/favicon.svg"), faviconSvg(32));
console.log("Wrote public/favicon-16.png");
console.log("Wrote public/favicon-32.png");
console.log("Wrote public/favicon-48.png");
console.log("Wrote public/favicon.svg");

writeFileSync(path.join(root, "public/favicon.ico"), await toIco([png16, png32, png48]));
console.log("Wrote public/favicon.ico");

await browser.close();
console.log("Done.");
