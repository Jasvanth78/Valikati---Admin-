const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('adminToken', 'design-test-session'));
  const uploaded = [];
  const iconFiles = new Map();
  await context.route('**/uploads/notification-icons/**', route => route.fulfill({ body: iconFiles.get(new URL(route.request().url()).pathname), contentType: 'image/png' }));
  // All backend requests are intercepted inside this isolated preview context.
  await context.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let data = [];
    if (url.pathname.endsWith('/notification-icons')) {
      if (route.request().method() === 'POST') {
        const form = await new Response(route.request().postDataBuffer(), { headers: { 'Content-Type': route.request().headers()['content-type'] } }).formData();
        const iconBytes = Buffer.from(await form.get('image').arrayBuffer());
        if (iconBytes.readUInt32BE(16) !== 96 || iconBytes.readUInt32BE(20) !== 96) throw Error('Icon was not normalized to 96px');
        const id = require('node:crypto').randomUUID();
        const asset = { id, label: form.get('label'), imageUrl: `/uploads/notification-icons/${id}.png` };
        iconFiles.set(asset.imageUrl, iconBytes);
        uploaded.push(asset); data = asset;
      } else data = uploaded;
    }
    if (url.pathname.endsWith('/session')) data = { email: 'admin@valikatti.app' };
    if (url.pathname.endsWith('/dashboard')) data = { totalUsers: 1248, activeUsers: 936, newUsers: 24, mostSelectedRasi: 'Mesham', dailyPredictions: 12 };
    if (url.pathname.endsWith('/app-content')) data = [
      { key: 'app_name', ta: 'Valikatti', en: 'Valikatti' },
      { key: 'app_logo_url', ta: 'http://127.0.0.1:5175/logo.png', en: 'http://127.0.0.1:5175/logo.png' },
      { key: 'launcher_icon', ta: 'default', en: 'default' },
      { key: 'notification_icon', ta: 'ic_notification', en: 'ic_notification' },
      { key: 'app_share_link', ta: 'https://play.google.com/store/apps', en: 'https://play.google.com/store/apps' },
    ];
    await route.fulfill({ json: data });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const output = path.resolve(__dirname, '../artifacts/design');
  fs.mkdirSync(output, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:5175');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('heading', { name: 'App settings' }).waitFor();
  await page.evaluate(async () => {
    const { normalizeNotificationIcon } = await import('/src/components/notificationIconImage.ts');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="white"/><circle cx="12" cy="12" r="6" fill="black"/></svg>';
    const png = await normalizeNotificationIcon(new Blob([svg], { type: 'image/svg+xml' }));
    const image = new Image(); image.src = URL.createObjectURL(png); await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    const center = context.getImageData(48, 48, 1, 1).data;
    const edge = context.getImageData(15, 15, 1, 1).data;
    if (center[0] !== 255 || center[1] !== 255 || center[2] !== 255 || center[3] < 240 || edge[3] !== 0) throw Error('Icon was not converted to a transparent white silhouette');
    URL.revokeObjectURL(image.src);
  });
  await page.getByAltText('App logo').evaluate(image => image.decode());
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, 'settings-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Edit Android Notification-bar Icon' }).click();
  await page.getByRole('button', { name: 'Use Heart icon', exact: true }).click();
  await page.getByAltText('Heart notification preview').waitFor();
  await page.getByAltText('Heart notification preview').evaluate(image => image.decode());
  await page.screenshot({ path: path.join(output, 'notification-icons-desktop.png'), fullPage: true });
  await page.getByLabel('Upload notification icon').setInputFiles({ name: 'react-icon.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 12L10 18L20 4" fill="none" stroke="black" stroke-width="3"/></svg>') });
  await page.getByAltText('react-icon notification preview').waitFor();
  await page.getByRole('button', { name: 'Paste SVG' }).click();
  await page.getByRole('textbox', { name: 'SVG markup' }).fill('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  await page.getByRole('button', { name: 'Use SVG', exact: true }).click();
  await page.getByText('Use a standalone SVG icon without scripts or embedded images.').waitFor();
  await page.getByRole('combobox', { name: 'Android Notification-bar Icon' }).selectOption('ic_notification_star');
  await page.getByRole('button', { name: 'Save & publish' }).click();
  await page.getByText('Changes saved and published.').waitFor();
  await page.getByRole('tab', { name: 'Legal' }).click();
  await page.getByRole('heading', { name: 'Privacy Policy' }).waitFor();
  await page.getByRole('tab', { name: 'Brand' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector('.admin-sidebar').getBoundingClientRect().right <= 0);
  await page.screenshot({ path: path.join(output, 'settings-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Edit Android Notification-bar Icon' }).click();
  await page.screenshot({ path: path.join(output, 'notification-icons-mobile.png'), fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Mobile page overflows horizontally');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.admin-sidebar').getBoundingClientRect().right <= 0);
  if (await page.locator('.admin-sidebar').evaluate(element => element.getBoundingClientRect().right > 0)) throw Error('Mobile navigation did not close');
  if (errors.length) throw Error(errors.join('\n'));
  await browser.close();
  console.log('Desktop/mobile screenshots and settings/navigation checks passed.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
