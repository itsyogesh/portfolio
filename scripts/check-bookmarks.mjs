/**
 * Check bookmarks for dead links and replace with archive.org versions.
 * Usage: node scripts/check-bookmarks.mjs
 *
 * Processes in batches with concurrency control.
 * Saves progress incrementally so it can be resumed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const bookmarksPath = new URL(
  '../content/pages/bookmarks.json',
  import.meta.url
).pathname;
const progressPath = new URL(
  '../content/pages/bookmarks-check-progress.json',
  import.meta.url
).pathname;

const CONCURRENCY = 15;
const TIMEOUT_MS = 8000;
const SAVE_EVERY = 50;

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    clearTimeout(timeout);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    clearTimeout(timeout);
    // Some servers reject HEAD, try GET
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller2.signal,
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      clearTimeout(timeout2);
      // Read and discard body
      await res.text().catch(() => {});
      return { ok: res.ok, status: res.status };
    } catch {
      clearTimeout(timeout2);
      return { ok: false, status: 0, error: err.message };
    }
  }
}

async function getArchiveUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();
    if (data?.archived_snapshots?.closest?.available) {
      return data.archived_snapshots.closest.url;
    }
    return null;
  } catch {
    return null;
  }
}

async function processBatch(bookmarks, startIdx, batchSize, progress) {
  const end = Math.min(startIdx + batchSize, bookmarks.length);
  const batch = [];

  for (let i = startIdx; i < end; i++) {
    if (progress.checked.has(bookmarks[i].url)) continue;
    batch.push(i);
  }

  const results = await Promise.allSettled(
    batch.map(async (i) => {
      const bookmark = bookmarks[i];
      const result = await checkUrl(bookmark.url);

      if (!result.ok) {
        const archiveUrl = await getArchiveUrl(bookmark.url);
        return { index: i, dead: true, archiveUrl, status: result.status };
      }
      return { index: i, dead: false, status: result.status };
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { index, dead, archiveUrl, status } = r.value;
      const bookmark = bookmarks[index];
      progress.checked.add(bookmark.url);

      if (dead) {
        if (archiveUrl) {
          progress.archived++;
          bookmark.originalUrl = bookmark.url;
          bookmark.url = archiveUrl;
          bookmark.archived = true;
        } else {
          progress.dead++;
          bookmark.dead = true;
        }
      } else {
        progress.alive++;
      }
    }
  }
}

async function main() {
  const bookmarks = JSON.parse(readFileSync(bookmarksPath, 'utf-8'));

  // Load progress if resuming
  const progress = {
    checked: new Set(),
    alive: 0,
    dead: 0,
    archived: 0,
  };

  if (existsSync(progressPath)) {
    const saved = JSON.parse(readFileSync(progressPath, 'utf-8'));
    progress.checked = new Set(saved.checkedUrls || []);
    progress.alive = saved.alive || 0;
    progress.dead = saved.dead || 0;
    progress.archived = saved.archived || 0;
    console.log(
      `Resuming: ${progress.checked.size} already checked (${progress.alive} alive, ${progress.dead} dead, ${progress.archived} archived)`
    );
  }

  const total = bookmarks.length;
  console.log(`Checking ${total} bookmarks (concurrency: ${CONCURRENCY})...\n`);

  for (let i = 0; i < total; i += CONCURRENCY) {
    await processBatch(bookmarks, i, CONCURRENCY, progress);

    const checked = progress.alive + progress.dead + progress.archived;
    process.stdout.write(
      `\r[${checked}/${total}] alive: ${progress.alive} | dead: ${progress.dead} | archived: ${progress.archived}`
    );

    // Save progress periodically
    if (checked % SAVE_EVERY === 0 || i + CONCURRENCY >= total) {
      writeFileSync(
        progressPath,
        JSON.stringify({
          checkedUrls: [...progress.checked],
          alive: progress.alive,
          dead: progress.dead,
          archived: progress.archived,
        })
      );
    }
  }

  console.log('\n');

  // Remove dead bookmarks (no archive available)
  const filtered = bookmarks.filter((b) => !b.dead);
  const removed = bookmarks.length - filtered.length;

  console.log(`\nResults:`);
  console.log(`  Alive: ${progress.alive}`);
  console.log(`  Replaced with archive.org: ${progress.archived}`);
  console.log(`  Removed (dead, no archive): ${removed}`);
  console.log(`  Final count: ${filtered.length}`);

  // Clean up temp fields
  for (const b of filtered) {
    delete b.dead;
  }

  writeFileSync(bookmarksPath, JSON.stringify(filtered, null, 2));
  console.log(`\nWritten to ${bookmarksPath}`);
}

main();
