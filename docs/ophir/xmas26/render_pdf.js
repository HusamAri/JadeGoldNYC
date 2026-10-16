// Prints maker-brief.html to PDF with the bundled Chromium. Run from the repo root.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const dir = path.resolve(__dirname);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(dir, 'maker-brief.html'), { waitUntil: 'networkidle' });
  await page.pdf({ path: path.join(dir, 'Ophir-Christmas-2026-Maker-Brief.pdf'), format: 'A4',
                   printBackground: true, preferCSSPageSize: true,
                   displayHeaderFooter: true, headerTemplate: '<span></span>',
                   footerTemplate: '<div style="width:100%;font-family:Inter,sans-serif;font-size:7pt;color:#8a8378;padding:0 16mm;display:flex;justify-content:space-between"><span>Ophir Gold USA · Christmas 2026 ring line · maker\'s brief</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
                   margin: { top: '16mm', right: '16mm', bottom: '18mm', left: '16mm' } });
  await browser.close();
  console.log('pdf written');
})();
