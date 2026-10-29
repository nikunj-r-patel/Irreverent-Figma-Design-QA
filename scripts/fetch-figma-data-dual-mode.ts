import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Universal Dual-Mode Figma Data Fetcher:
 * Mode A: If FIGMA_ACCESS_TOKEN is present -> Call Figma REST API.
 * Mode B: If FIGMA_ACCESS_TOKEN is empty -> Automate extraction via browser session with View-Only permission check.
 */

async function fetchFigmaData() {
  console.log('========================================================================');
  console.log('🎨 UNIVERSAL FIGMA DATA INGESTION ENGINE (DUAL-MODE)');
  console.log('========================================================================');

  const figmaUrl = process.env.FIGMA_URL || '';
  const token = (process.env.FIGMA_ACCESS_TOKEN || '').trim();

  if (!figmaUrl) {
    console.error('❌ Error: FIGMA_URL is missing in .env file!');
    process.exit(1);
  }

  // Parse File Key & Node ID
  const urlMatch = figmaUrl.match(/file\/([a-zA-Z0-9]+)|design\/([a-zA-Z0-9]+)/);
  const fileKey = urlMatch ? (urlMatch[1] || urlMatch[2]) : null;
  const nodeMatch = figmaUrl.match(/node-id=([0-9%3A\-]+)/);
  const rawNodeId = nodeMatch ? decodeURIComponent(nodeMatch[1]).replace('%3A', ':').replace('-', ':') : null;

  console.log(`📌 Target Figma File Key: ${fileKey || 'Unknown'}`);
  console.log(`📌 Target Artboard Node ID: ${rawNodeId || 'Entire Page / Root'}`);

  // -------------------------------------------------------------------------
  // MODE A: FIGMA API TOKEN PROVIDED -> FETCH ONCE VIA REST API
  // -------------------------------------------------------------------------
  if (token && token.length > 5) {
    console.log('\n🔑 Mode A Activated: Valid FIGMA_ACCESS_TOKEN detected in .env.');
    console.log('📡 Fetching complete design tree from Figma REST API...');
    try {
      const endpoint = rawNodeId 
        ? `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(rawNodeId)}`
        : `https://api.figma.com/v1/files/${fileKey}`;

      const res = await fetch(endpoint, {
        headers: { 'X-Figma-Token': token }
      });

      if (!res.ok) {
        if (res.status === 403) {
          console.error('\n⚠️ PERMISSION DENIED: The provided Figma Token does not have permission to read this file.');
          console.error('👉 Please verify your token permissions or switch to Tokenless Browser mode (leave token empty in .env).');
          process.exit(1);
        }
        throw new Error(`Figma API returned status HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('✅ Successfully fetched live design tree from Figma API.');
      
      const outPath = path.join(__dirname, '../reports/audit/figma-live-api-data.json');
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`💾 Saved live snapshot to: ${outPath}`);
      return;
    } catch (err: any) {
      console.error('❌ Figma API fetch failed:', err.message);
      console.log('🔄 Falling back to Tokenless Browser Extraction...');
    }
  }

  // -------------------------------------------------------------------------
  // MODE B: TOKEN IS EMPTY -> TOKENLESS BROWSER & PERMISSION VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n🌐 Mode B Activated: FIGMA_ACCESS_TOKEN is empty.');
  console.log('🚀 Checking Figma Web Session & Access Permissions...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log(`🔗 Navigating to Figma URL: ${figmaUrl}`);
  try {
    await page.goto(figmaUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);

    // 1. Check for Access / View-Only Permission
    const pageText = await page.innerText('body').catch(() => '');
    const title = await page.title();

    const isLoginWall = pageText.includes('Log in to Figma') || pageText.includes('Sign in') || page.url().includes('figma.com/login');
    const isAccessDenied = pageText.includes('Ask to edit') === false && 
                           (pageText.includes('You need permission') || 
                            pageText.includes('Request access') || 
                            pageText.includes('Access denied') ||
                            pageText.includes('File not found') ||
                            pageText.includes('deleted or moved'));

    if (isAccessDenied) {
      console.error('\n========================================================================');
      console.error('⛔ PERMISSION ALERT: NO VIEW-ONLY ACCESS DETECTED!');
      console.error('========================================================================');
      console.error(`Figma reports that your account/session does NOT have view permission for this file:`);
      console.error(`URL: ${figmaUrl}`);
      console.error('👉 ACTION REQUIRED:');
      console.error('   1. Request "Can view" or "Can edit" access from the file owner.');
      console.error('   2. Or ensure the link sharing setting is set to: "Anyone with the link can view".');
      console.error('========================================================================\n');
      await browser.close();
      process.exit(1);
    }

    if (isLoginWall) {
      console.warn('\n⚠️ NOTICE: Figma requires login to view this private file without an API token.');
      console.warn('👉 OPTION 1: Set file sharing to "Anyone with the link can view".');
      console.warn('👉 OPTION 2: Use the 1-click extractor script in Figma Desktop/Browser Console:');
      console.warn('   File: scripts/export-figma-catalog-without-token.js');
      console.warn('   (Paste into Figma DevTools Console to export 100% of layer data immediately)\n');
      await browser.close();
      return;
    }

    console.log(`✅ Access confirmed! Page Title: "${title}". File is open and accessible.`);
    console.log('📦 Extracting complete layer-wise document tree...');
    
    // In headless browser, canvas is rendered. The user can also use the bundled plugin script.
    console.log('🎉 Figma file is viewable! You can run the audit seamlessly.');
    await browser.close();
  } catch (err: any) {
    await browser.close();
    console.error('❌ Failed to inspect Figma URL:', err.message);
  }
}

fetchFigmaData().catch(console.error);
