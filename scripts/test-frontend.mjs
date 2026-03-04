// Comprehensive frontend test: all pages, light/dark theme, API integration
import { chromium } from "playwright";

const BASE = "http://localhost:3271";
const SCREENSHOT_DIR = "/tmp/se-screenshots";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`CONSOLE ERROR: ${msg.text()}`);
  });

  console.log("=== FRONTEND COMPREHENSIVE TEST ===\n");

  // 1. Dashboard page loads
  console.log("[1] Loading Dashboard...");
  await page.goto(BASE);
  await page.waitForSelector(".dashboard");
  const cards = await page.$$(".card");
  console.log(`  Cards rendered: ${cards.length} (expected 5)`);
  if (cards.length !== 5) errors.push(`Expected 5 cards, got ${cards.length}`);

  // Check status badge
  const badge = await page.$eval(".badge", el => el.textContent.trim());
  console.log(`  Status badge: "${badge}"`);

  // Check stat values
  const stats = await page.$$eval(".stat", els => els.map(el => el.textContent.trim()));
  console.log(`  Stats: reports=${stats[0]}, skills=${stats[1]}`);

  // Check trigger button exists and is clickable
  const triggerBtn = await page.$(".trigger-btn");
  const btnText = await triggerBtn.textContent();
  const btnDisabled = await triggerBtn.isDisabled();
  console.log(`  Trigger button: "${btnText.trim()}", disabled=${btnDisabled}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard-dark.png` });
  console.log("  Screenshot: 01-dashboard-dark.png\n");

  // 2. Theme toggle
  const initialTheme = await page.$eval("html", el => el.getAttribute("data-theme"));
  console.log(`[2] Testing theme toggle (initial: ${initialTheme})...`);
  const oppositeTheme = initialTheme === "dark" ? "light" : "dark";
  const themeToggle = await page.$(".theme-toggle");
  if (!themeToggle) {
    errors.push("Theme toggle button not found");
    console.log("  ERROR: Theme toggle not found\n");
  } else {
    await themeToggle.click();
    await page.waitForTimeout(300);
    const theme = await page.$eval("html", el => el.getAttribute("data-theme"));
    console.log(`  Theme after toggle: "${theme}" (expected: ${oppositeTheme})`);
    if (theme !== oppositeTheme) errors.push(`Expected ${oppositeTheme} theme, got "${theme}"`);

    const bgColor = await page.$eval("body", el => getComputedStyle(el).backgroundColor);
    console.log(`  Body background: ${bgColor}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-dashboard-toggled.png` });
    console.log("  Screenshot: 02-dashboard-toggled.png");

    // Toggle back
    await themeToggle.click();
    await page.waitForTimeout(300);
    const theme2 = await page.$eval("html", el => el.getAttribute("data-theme"));
    console.log(`  Theme after second toggle: "${theme2}" (expected: ${initialTheme})`);
    if (theme2 !== initialTheme) errors.push(`Expected ${initialTheme} theme, got "${theme2}"`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-dashboard-back.png` });
    console.log("  Screenshot: 03-dashboard-back.png\n");
  }

  // 3. Reports page
  console.log("[3] Testing Reports page...");
  await page.click('nav button:has-text("Reports")');
  await page.waitForSelector(".reports");
  await page.waitForTimeout(1000); // wait for API fetch
  const reportItems = await page.$$(".report-item");
  console.log(`  Report items: ${reportItems.length}`);

  if (reportItems.length > 0) {
    // Click to expand first report
    await reportItems[0].click();
    await page.waitForTimeout(500);
    const content = await page.$(".content pre");
    if (content) {
      const text = await content.textContent();
      console.log(`  Report content length: ${text.length} chars`);
      if (text.length < 10) errors.push("Report content too short or empty");
    } else {
      errors.push("Report content not rendered after click");
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-reports-dark.png` });

  // Test light mode on reports
  await page.click(".theme-toggle");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-reports-light.png` });
  await page.click(".theme-toggle");
  console.log("  Screenshots: 04-reports-dark.png, 05-reports-light.png\n");

  // 4. Data Browser page
  console.log("[4] Testing Data Browser page...");
  await page.click('nav button:has-text("Data Browser")');
  await page.waitForSelector(".browser");
  await page.waitForTimeout(500);

  // Check preference data loaded
  const contextEntries = await page.$$(".entry");
  console.log(`  Entries (preference): ${contextEntries.length}`);

  // Switch pillar
  await page.selectOption("select", "cognition");
  await page.waitForTimeout(500);
  const cognitionEntries = await page.$$(".entry");
  console.log(`  Entries (cognition): ${cognitionEntries.length}`);

  await page.selectOption("select", "success_experience");
  await page.waitForTimeout(500);
  const successEntries = await page.$$(".entry");
  console.log(`  Entries (success_experience): ${successEntries.length}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-databrowser-dark.png` });

  // Test light mode
  await page.click(".theme-toggle");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/07-databrowser-light.png` });
  await page.click(".theme-toggle");
  console.log("  Screenshots: 06-databrowser-dark.png, 07-databrowser-light.png\n");

  // 5. Settings page
  console.log("[5] Testing Settings page...");
  await page.click('nav button:has-text("Settings")');
  await page.waitForSelector(".settings");
  await page.waitForTimeout(500);

  // Check form values loaded from API
  const intervalVal = await page.$eval('input[type="text"]', el => el.value);
  const modelVal = await page.$eval('.form select', el => el.value);
  console.log(`  Interval: "${intervalVal}", Model: "${modelVal}"`);
  if (intervalVal !== "1h") errors.push(`Expected interval "1h", got "${intervalVal}"`);
  if (modelVal !== "opus") errors.push(`Expected model "opus", got "${modelVal}"`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/08-settings-dark.png` });

  // Test light mode
  await page.click(".theme-toggle");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/09-settings-light.png` });
  await page.click(".theme-toggle");
  console.log("  Screenshots: 08-settings-dark.png, 09-settings-light.png\n");

  // 6. Test settings save
  console.log("[6] Testing settings save...");
  const saveBtn = await page.$(".save-btn");
  await saveBtn.click();
  await page.waitForTimeout(1000);
  const msgEl = await page.$(".message");
  if (msgEl) {
    const msgText = await msgEl.textContent();
    console.log(`  Save message: "${msgText}"`);
    if (!msgText.includes("saved")) errors.push(`Expected save success, got "${msgText}"`);
  } else {
    errors.push("No message after save");
  }

  // 7. Nav active states
  console.log("\n[7] Testing navigation active states...");
  for (const tab of ["Dashboard", "Reports", "Data Browser", "Settings"]) {
    await page.click(`nav button:has-text("${tab}")`);
    await page.waitForTimeout(200);
    const activeBtn = await page.$("nav button.active");
    const activeText = await activeBtn.textContent();
    const isCorrect = activeText.trim() === tab;
    console.log(`  "${tab}" active: ${isCorrect}`);
    if (!isCorrect) errors.push(`Nav active mismatch for "${tab}": got "${activeText.trim()}"`);
  }

  // 8. Theme persistence
  console.log("\n[8] Testing theme persistence...");
  const preToggleTheme = await page.$eval("html", el => el.getAttribute("data-theme"));
  await page.click(".theme-toggle"); // toggle once
  await page.waitForTimeout(200);
  const expectedStored = preToggleTheme === "dark" ? "light" : "dark";
  const storedTheme = await page.evaluate(() => localStorage.getItem("se-theme"));
  console.log(`  localStorage se-theme: "${storedTheme}" (expected: ${expectedStored})`);
  if (storedTheme !== expectedStored) errors.push(`Expected "${expectedStored}" in localStorage, got "${storedTheme}"`);

  // Reload and check persistence
  await page.reload();
  await page.waitForSelector(".dashboard");
  await page.waitForTimeout(300);
  const themeAfterReload = await page.$eval("html", el => el.getAttribute("data-theme"));
  console.log(`  Theme after reload: "${themeAfterReload}" (expected: ${expectedStored})`);
  if (themeAfterReload !== expectedStored) errors.push(`Theme not persisted after reload: "${themeAfterReload}"`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/10-dashboard-persisted.png` });
  console.log("  Screenshot: 10-dashboard-persisted.png");

  // Clean up
  if (themeAfterReload !== "dark") await page.click(".theme-toggle");

  // Summary
  console.log("\n=== TEST SUMMARY ===");
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}/`);
  if (errors.length === 0) {
    console.log("ALL TESTS PASSED");
  } else {
    console.log(`FAILURES (${errors.length}):`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
