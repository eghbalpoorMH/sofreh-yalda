/**
 * Builds a single, self-contained ArvanCloud Edge Computing Worker script:
 *   dist/arvan-edge-worker.js
 *
 * Ready to paste or upload directly into the ArvanCloud Edge Computing panel:
 *   https://panel.arvancloud.ir/edge-computing/edge-computes
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

const htmlRaw = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
const cssRaw = fs.readFileSync(path.join(PUBLIC_DIR, 'styles.css'), 'utf8');
const audioJs = fs.readFileSync(path.join(PUBLIC_DIR, 'audio.js'), 'utf8');
const levelsJs = fs.readFileSync(path.join(PUBLIC_DIR, 'levels.js'), 'utf8');
const rendererJs = fs.readFileSync(path.join(PUBLIC_DIR, 'renderer.js'), 'utf8');
const gameJs = fs.readFileSync(path.join(PUBLIC_DIR, 'game.js'), 'utf8');

// Read api-core.js without CommonJS module.exports line
const apiCoreRaw = fs
  .readFileSync(path.join(ROOT, 'edge', 'api-core.js'), 'utf8')
  .replace(/module\.exports\s*=\s*\{[\s\S]*?\};/, '');

// Inline CSS & JS into a single HTML payload for instant single-request Edge delivery
const inlinedHtml = htmlRaw
  .replace('<link rel="stylesheet" href="/styles.css" />', `<style>\n${cssRaw}\n</style>`)
  .replace(
    /<script src="\/audio\.js"><\/script>\s*<script src="\/levels\.js"><\/script>\s*<script src="\/renderer\.js"><\/script>\s*<script src="\/game\.js"><\/script>/,
    `<script>\n${audioJs}\n${levelsJs}\n${rendererJs}\n${gameJs}\n</script>`
  );

// Also save standalone dist/index.html
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), inlinedHtml, 'utf8');

const workerSource = `/**
 * ============================================================================
 * 🍉 سفره یلدا (Sofreh Yalda) - ArvanCloud Edge Computing Serverless Bundle
 * Ready for deployment at: https://panel.arvancloud.ir/edge-computing/edge-computes
 * ============================================================================
 */

${apiCoreRaw}

const INDEX_HTML = ${JSON.stringify(inlinedHtml)};

async function handleFetchRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Powered-By': 'ArvanCloud-Edge-Compute'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (pathname.startsWith('/api/')) {
    let bodyData = {};
    if (request.method === 'POST') {
      try {
        bodyData = await request.json();
      } catch (e) {
        bodyData = {};
      }
    }
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const result = await handleEdgeApiRequest(pathname, request.method, queryParams, bodyData);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }

  return new Response(INDEX_HTML, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60'
    }
  });
}

// Service Worker syntax supported by ArvanCloud Edge Computing
addEventListener('fetch', (event) => {
  event.respondWith(handleFetchRequest(event.request));
});
`;

const workerPath = path.join(DIST_DIR, 'arvan-edge-worker.js');
fs.writeFileSync(workerPath, workerSource, 'utf8');

console.log(`✅ Built Arvan Edge Worker bundle: ${workerPath} (${Math.round(workerSource.length / 1024)} KB)`);
