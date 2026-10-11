import "dotenv/config";

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Opt-in live CDP smoke test. No credentials in arguments or output.
 * Repoints all app storage at a throwaway directory before dynamic imports.
 * Requires an on-demand, owned CDP endpoint and explicit remote termination.
 * Run from apps/workers: tsx scripts/browserCdpSmoke.ts
 */
const scratch = mkdtempSync(path.join(os.tmpdir(), "karakeep-cdp-smoke-"));
process.env.DATA_DIR = scratch;
process.env.ASSETS_DIR = path.join(scratch, "assets");
mkdirSync(process.env.ASSETS_DIR, { recursive: true });
process.on("exit", () => rmSync(scratch, { recursive: true, force: true }));

async function main() {
  const { default: config } = await import("@karakeep/shared/config");
  assert(config.crawler.browserCdpUrl, "Set BROWSER_CDP_URL");
  assert(config.crawler.browserConnectOnDemand, "Use on-demand connections");
  assert(
    config.crawler.browserCdpCloseOnRelease,
    "Use an owned endpoint and BROWSER_CDP_CLOSE_ON_RELEASE=true",
  );
  const { connectBrowser, closeBrowserConnection } =
    await import("../workers/utils/browserConnection");

  const browser = await connectBrowser(config.crawler);
  assert(browser);
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      serviceWorkers: "block",
    });
    try {
      await context.addCookies([
        { name: "smoke", value: "cookie-ok", domain: "example.com", path: "/" },
      ]);
      await context.addInitScript(() => {
        Object.defineProperty(globalThis, "smokeInit", { value: true });
      });
      const page = await context.newPage();
      let blocked = false;
      await page.route("**/blocked-resource", async (route) => {
        blocked = true;
        await route.abort();
      });
      await page.route("**/karakeep-cdp-smoke", async (route) => {
        await route.fulfill({
          contentType: "text/html",
          body: `<!doctype html><html><head><title>CDP smoke</title></head><body><h1 id="result">waiting</h1><script>
            document.querySelector('#result').textContent = 'javascript-ok';
            document.querySelector('#result').dataset.init = globalThis.smokeInit ? 'ok' : 'missing';
            fetch('/blocked-resource').catch(() => {});
          </script></body></html>`,
        });
      });
      await page.goto("https://example.com/karakeep-cdp-smoke");
      await page.waitForFunction(
        () =>
          document.querySelector("#result")?.textContent === "javascript-ok",
      );
      // Patchright evaluates in an isolated world; observe init-script effects
      // through the DOM rather than looking for main-world globals there.
      assert.equal(
        await page.locator("#result").getAttribute("data-init"),
        "ok",
      );
      assert(
        (await page.evaluate(() => document.cookie)).includes(
          "smoke=cookie-ok",
        ),
      );
      await page.waitForTimeout(500);
      assert(blocked, "Request interception should abort the resource");
      assert((await page.content()).includes("javascript-ok"));
      const screenshot = await page.screenshot({ type: "jpeg" });
      assert(screenshot.length > 1000);
      const pdf = await page.pdf();
      assert(pdf.subarray(0, 5).toString() === "%PDF-");
      console.log(
        JSON.stringify({
          phase: "patchright-cdp",
          ok: true,
          features: [
            "isolated-context",
            "cookies",
            "init-script",
            "javascript",
            "request-routing",
            "html",
            "screenshot",
            "pdf",
          ],
          screenshotBytes: screenshot.length,
          pdfBytes: pdf.length,
        }),
      );
    } finally {
      await context.close();
    }
  } finally {
    await closeBrowserConnection(browser, true);
  }

  // Exercise the actual crawler path, including redirect/SSRF guards,
  // adblocking, autoconsent, capture, and the configured session cleanup.
  const { crawlPage, crawlLogger, CrawlerWorker } =
    await import("../workers/crawlerWorker");
  const { selectRunProxies } = await import("../network");
  await CrawlerWorker.prepareForAdhoc();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 60_000);
  try {
    const result = await crawlPage(
      {
        jobId: "cdp-live-smoke",
        bookmarkId: "smoke",
        userId: "smoke",
        url: "https://example.com",
        browserCrawlingEnabled: true,
        abortSignal: abort.signal,
        runProxy: selectRunProxies(),
        log: crawlLogger("cdp-live-smoke"),
      },
      true,
    );
    assert.equal(result.statusCode, 200);
    assert(result.htmlContent.includes("Example Domain"));
    assert(result.screenshot && result.screenshot.length > 1000);
    assert(result.pdf?.subarray(0, 5).toString() === "%PDF-");
    if (process.env.CDP_SMOKE_OUTPUT_DIR) {
      mkdirSync(process.env.CDP_SMOKE_OUTPUT_DIR, { recursive: true });
      writeFileSync(
        path.join(process.env.CDP_SMOKE_OUTPUT_DIR, "example.jpg"),
        result.screenshot,
      );
      writeFileSync(
        path.join(process.env.CDP_SMOKE_OUTPUT_DIR, "example.pdf"),
        result.pdf,
      );
    }
    console.log(
      JSON.stringify({
        phase: "karakeep-crawlPage",
        ok: true,
        statusCode: result.statusCode,
        htmlBytes: Buffer.byteLength(result.htmlContent),
        screenshotBytes: result.screenshot.length,
        pdfBytes: result.pdf.length,
      }),
    );

    const cancelled = new AbortController();
    cancelled.abort();
    await assert.rejects(
      crawlPage(
        {
          jobId: "cdp-cancelled-smoke",
          bookmarkId: "smoke",
          userId: "smoke",
          url: "https://example.com",
          browserCrawlingEnabled: true,
          abortSignal: cancelled.signal,
          runProxy: selectRunProxies(),
          log: crawlLogger("cdp-cancelled-smoke"),
        },
        false,
      ),
    );
    console.log(
      JSON.stringify({ phase: "karakeep-cancelled-crawl", ok: true }),
    );
  } finally {
    clearTimeout(timer);
    const { exitAbortController } = await import("../exit");
    exitAbortController.abort();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    let message = error instanceof Error ? error.message : "Unknown error";
    try {
      const headers: unknown = JSON.parse(
        process.env.BROWSER_CONNECT_HEADERS ?? "{}",
      );
      if (headers && typeof headers === "object") {
        for (const value of Object.values(headers)) {
          if (typeof value !== "string" || !value) continue;
          message = message.split(value).join("REDACTED");
          const token = value.replace(/^Bearer\s+/i, "");
          if (token) message = message.split(token).join("REDACTED");
        }
      }
      console.error(`CDP live smoke test failed: ${message}`);
    } catch {
      console.error("CDP live smoke test failed (invalid connection headers).");
    }
    process.exit(1);
  });
