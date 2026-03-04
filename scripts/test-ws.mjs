// Test: WebSocket real-time updates - verify Dashboard auto-updates without refresh
import { chromium } from "playwright";

const BASE = "http://localhost:3271";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 1280, height: 800 } }).then(c => c.newPage());
  const errors = [];

  console.log("=== WebSocket Real-Time Update Test ===\n");

  // 1. Load Dashboard
  await page.goto(BASE);
  await page.waitForSelector(".dashboard");
  await page.waitForTimeout(1000);

  const statusBefore = await page.$eval(".badge", el => el.textContent.trim());
  console.log(`[1] Status before trigger: "${statusBefore}"`);

  // 2. Set up a mutation observer to track badge text changes
  await page.evaluate(() => {
    window.__badgeChanges = [];
    const badge = document.querySelector(".badge");
    if (badge) {
      const obs = new MutationObserver(() => {
        window.__badgeChanges.push({
          text: badge.textContent?.trim(),
          time: Date.now(),
        });
      });
      obs.observe(badge, { childList: true, characterData: true, subtree: true });
    }
  });

  // 3. Trigger evolution via API (not clicking button - to test WS independently)
  console.log("[2] Triggering evolution via API...");
  await fetch(`${BASE}/api/trigger`, { method: "POST" });

  // 4. Wait a few seconds and check if badge updated via WS (no page refresh!)
  await page.waitForTimeout(5000);
  const statusDuring = await page.$eval(".badge", el => el.textContent.trim());
  console.log(`[3] Status during evolution (no refresh): "${statusDuring}"`);

  if (statusDuring === "running") {
    console.log("    PASS: Badge updated via WebSocket!\n");
  } else {
    errors.push(`Expected "running" during evolution, got "${statusDuring}"`);
    console.log("    FAIL: Badge did not update via WebSocket\n");
  }

  // 5. Check live output panel appeared
  const livePanel = await page.$(".live-panel");
  if (livePanel) {
    console.log("[4] Live output panel: visible (via WS)");
  } else {
    errors.push("Live output panel not visible");
    console.log("[4] Live output panel: NOT visible");
  }

  // 6. Wait for completion
  console.log("[5] Waiting for evolution to complete...");
  const maxWait = 15 * 60 * 1000;
  const start = Date.now();
  let completed = false;

  while (Date.now() - start < maxWait) {
    await page.waitForTimeout(10_000);
    const status = await page.$eval(".badge", el => el.textContent.trim());
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`    [${elapsed}s] badge="${status}"`);
    if (status === "idle") {
      completed = true;
      break;
    }
  }

  if (completed) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`    Completed in ${elapsed}s`);

    // 7. Verify badge returned to idle WITHOUT refresh
    const statusAfter = await page.$eval(".badge", el => el.textContent.trim());
    console.log(`[6] Status after completion (no refresh): "${statusAfter}"`);
    if (statusAfter === "idle") {
      console.log("    PASS: Badge auto-returned to idle via WebSocket!");
    } else {
      errors.push(`Expected "idle" after completion, got "${statusAfter}"`);
      console.log("    FAIL");
    }

    // 8. Check badge change history
    const changes = await page.evaluate(() => window.__badgeChanges);
    console.log(`[7] Badge changes detected: ${changes.length}`);
    for (const c of changes) {
      console.log(`    → "${c.text}"`);
    }
  } else {
    errors.push("Evolution did not complete within 15 minutes");
  }

  console.log("\n=== SUMMARY ===");
  if (errors.length === 0) {
    console.log("ALL TESTS PASSED - WebSocket real-time updates working!");
  } else {
    console.log(`FAILURES (${errors.length}):`);
    errors.forEach(e => console.log(`  - ${e}`));
  }

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
}

run().catch(err => { console.error("FATAL:", err); process.exit(1); });
