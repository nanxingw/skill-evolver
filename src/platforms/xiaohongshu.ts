// Xiaohongshu (Little Red Book) platform adapter
// Uses Playwright for browser automation — all page params typed as `any`.

import { join } from "node:path";
import { homedir } from "node:os";
import { mkdir } from "node:fs/promises";
import type {
  PlatformAdapter,
  PublishContent,
  PublishResult,
  Metrics,
  TrendData,
  CompetitorData,
} from "./base.js";

const AUTH_DIR = join(homedir(), ".skill-evolver", "auth", "xiaohongshu");

export const xiaohongshuAdapter: PlatformAdapter = {
  name: "xiaohongshu",
  loginUrl: "https://creator.xiaohongshu.com",
  publishUrl: "https://creator.xiaohongshu.com/publish/publish",

  // ── Auth ────────────────────────────────────────────────────────────────

  async checkLogin(page: any): Promise<boolean> {
    try {
      await page.goto("https://creator.xiaohongshu.com", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      // If redirected to login page, not logged in
      const url: string = page.url();
      return !url.includes("/login");
    } catch {
      return false;
    }
  },

  async login(page: any): Promise<boolean> {
    try {
      await page.goto("https://creator.xiaohongshu.com/login", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });

      // Wait for user to scan QR code and be redirected away from /login
      // Timeout: 120 seconds for user interaction
      await page.waitForURL((url: any) => {
        const s = typeof url === "string" ? url : url.toString();
        return !s.includes("/login");
      }, { timeout: 120_000 });

      return true;
    } catch {
      return false;
    }
  },

  // ── Publish ─────────────────────────────────────────────────────────────

  async publish(page: any, content: PublishContent): Promise<PublishResult> {
    try {
      await mkdir(AUTH_DIR, { recursive: true });

      await page.goto("https://creator.xiaohongshu.com/publish/publish", {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });

      // Upload media files
      if (content.mediaFiles.length > 0) {
        const fileInput = await page.locator('input[type="file"]').first();
        if (fileInput) {
          await fileInput.setInputFiles(content.mediaFiles);
          // Wait for upload processing
          await page.waitForTimeout(3_000);
        }
      }

      // Fill title (max 20 chars for Xiaohongshu)
      const titleText = content.title.slice(0, 20);
      const titleInput = page.locator('[placeholder*="标题"], [class*="title"] input, #title');
      try {
        await titleInput.first().fill(titleText);
      } catch {
        // Fallback: try contenteditable
        const titleEditable = page.locator('[contenteditable="true"]').first();
        await titleEditable.fill(titleText);
      }

      // Fill body (max 1000 chars)
      const bodyText = content.body.slice(0, 1000);
      const bodyInput = page.locator('[placeholder*="正文"], [class*="desc"] textarea, #desc');
      try {
        await bodyInput.first().fill(bodyText);
      } catch {
        const bodyEditable = page.locator('[contenteditable="true"]').nth(1);
        await bodyEditable.fill(bodyText);
      }

      // Add tags (max 10)
      const tags = content.tags.slice(0, 10);
      for (const tag of tags) {
        try {
          const tagInput = page.locator('[placeholder*="标签"], [class*="tag"] input');
          await tagInput.first().fill(tag);
          await page.keyboard.press("Enter");
          await page.waitForTimeout(500);
        } catch {
          break; // Stop if tag input not found
        }
      }

      // Take screenshot before publishing
      const screenshotPath = join(AUTH_DIR, `publish_${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Click publish button
      const publishBtn = page.locator('button:has-text("发布"), [class*="publish"] button');
      await publishBtn.first().click();

      // Wait for navigation or confirmation
      await page.waitForTimeout(5_000);

      const finalUrl = page.url();
      return {
        success: true,
        postUrl: finalUrl,
        screenshotPath,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Publish failed",
      };
    }
  },

  // ── Metrics ─────────────────────────────────────────────────────────────

  async scrapeMetrics(page: any, postUrl: string): Promise<Metrics> {
    await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForTimeout(2_000);

    const extractNumber = async (selector: string): Promise<number> => {
      try {
        const text: string = await page.locator(selector).first().innerText();
        const num = parseInt(text.replace(/[^\d]/g, ""), 10);
        return isNaN(num) ? 0 : num;
      } catch {
        return 0;
      }
    };

    return {
      likes: await extractNumber('[class*="like"] span, [class*="Like"] span'),
      comments: await extractNumber('[class*="comment"] span, [class*="Comment"] span'),
      shares: await extractNumber('[class*="share"] span, [class*="collect"] span'),
      views: 0, // Xiaohongshu doesn't always show views publicly
      collectedAt: new Date().toISOString(),
    };
  },

  // ── Trends ──────────────────────────────────────────────────────────────

  async scrapeTrending(page: any): Promise<TrendData> {
    await page.goto("https://www.xiaohongshu.com/explore", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page.waitForTimeout(3_000);

    const videos: TrendData["videos"] = [];

    try {
      // Extract top cards from explore page
      const cards = await page.locator('[class*="note-item"], [class*="feed-card"]').all();
      const limit = Math.min(cards.length, 20);

      for (let i = 0; i < limit; i++) {
        try {
          const card = cards[i];
          const title = await card.locator('[class*="title"], [class*="desc"]').first().innerText().catch(() => "");
          const link = await card.locator("a").first().getAttribute("href").catch(() => "");
          const creator = await card.locator('[class*="author"], [class*="name"]').first().innerText().catch(() => "");
          const likeText = await card.locator('[class*="like"]').first().innerText().catch(() => "0");
          const likes = parseInt(likeText.replace(/[^\d]/g, ""), 10) || 0;

          if (title) {
            videos.push({
              title: title.slice(0, 100),
              url: link ? `https://www.xiaohongshu.com${link.startsWith("/") ? link : `/${link}`}` : "",
              views: 0,
              likes,
              comments: 0,
              creator: creator.slice(0, 50),
            });
          }
        } catch {
          continue;
        }
      }
    } catch {
      // Page structure may have changed
    }

    return {
      platform: "xiaohongshu",
      collectedAt: new Date().toISOString(),
      videos,
      tags: [],
    };
  },

  // ── Competitor ──────────────────────────────────────────────────────────

  async scrapeCompetitor(page: any, profileUrl: string): Promise<CompetitorData> {
    await page.goto(profileUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page.waitForTimeout(3_000);

    let name = "";
    try {
      name = await page.locator('[class*="user-name"], [class*="nickname"]').first().innerText();
    } catch { /* ignore */ }

    const recentPosts: CompetitorData["recentPosts"] = [];

    try {
      const posts = await page.locator('[class*="note-item"], [class*="cover"]').all();
      const limit = Math.min(posts.length, 10);

      for (let i = 0; i < limit; i++) {
        try {
          const post = posts[i];
          const title = await post.locator('[class*="title"], [class*="desc"]').first().innerText().catch(() => "");
          const link = await post.locator("a").first().getAttribute("href").catch(() => "");
          const likeText = await post.locator('[class*="like"]').first().innerText().catch(() => "0");
          const likes = parseInt(likeText.replace(/[^\d]/g, ""), 10) || 0;

          recentPosts.push({
            title: title.slice(0, 100) || `Post ${i + 1}`,
            url: link ? `https://www.xiaohongshu.com${link.startsWith("/") ? link : `/${link}`}` : profileUrl,
            likes,
            comments: 0,
          });
        } catch {
          continue;
        }
      }
    } catch {
      // Page structure may have changed
    }

    return {
      platform: "xiaohongshu",
      profileUrl,
      name: name || "Unknown",
      recentPosts,
      collectedAt: new Date().toISOString(),
    };
  },
};
