/**
 * Focused regression: Admin first-time PIN setup (state length, button, persist).
 */
import puppeteer from 'puppeteer-core';

const BASE = process.env.STORE_URL || 'http://127.0.0.1:8894/store/';
const CHROME = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(BASE + '#admin', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#adminLoginBtn');

  const setupUi = await page.evaluate(() => ({
    title: document.getElementById('adminLoginTitle')?.textContent || '',
    btn: document.getElementById('adminLoginBtn')?.textContent || '',
    disabled: !!document.getElementById('adminLoginBtn')?.disabled,
    inputMode: document.getElementById('adminPin')?.getAttribute('inputmode') || '',
  }));
  ok('setup title', setupUi.title.includes('ตั้งรหัสหลังร้านครั้งแรก'), setupUi.title);
  ok('setup button label', setupUi.btn.includes('บันทึกรหัสและเข้าใช้งาน'), setupUi.btn);
  ok('button disabled when empty', setupUi.disabled);
  ok('inputmode numeric', setupUi.inputMode === 'numeric', setupUi.inputMode);

  // Type 3 digits — still short
  await page.type('#adminPin', '258');
  const shortState = await page.evaluate(() => ({
    disabled: !!document.getElementById('adminLoginBtn')?.disabled,
    errShow: document.getElementById('errAdminPin')?.classList.contains('show'),
    errText: document.getElementById('errAdminPin')?.textContent || '',
    valueLen: (document.getElementById('adminPin')?.value || '').length,
  }));
  ok('3 digits keeps button disabled', shortState.disabled, JSON.stringify(shortState));
  ok('3 digits shows length error', shortState.errShow && shortState.errText.includes('อย่างน้อย 4'), shortState.errText);

  // Add 4th digit → 2580
  await page.type('#adminPin', '0');
  const fourState = await page.evaluate(() => ({
    disabled: !!document.getElementById('adminLoginBtn')?.disabled,
    errShow: document.getElementById('errAdminPin')?.classList.contains('show'),
    value: document.getElementById('adminPin')?.value || '',
  }));
  ok('4 digits enables button', !fourState.disabled, JSON.stringify(fourState));
  ok('4 digits clears red error', !fourState.errShow, JSON.stringify(fourState));
  ok('PIN value is 2580', fourState.value === '2580', fourState.value);

  // Extend to 6 digits
  await page.type('#adminPin', '25');
  const sixState = await page.evaluate(() => ({
    disabled: !!document.getElementById('adminLoginBtn')?.disabled,
    value: document.getElementById('adminPin')?.value || '',
  }));
  ok('6 digits still enabled', !sixState.disabled && sixState.value === '258025', JSON.stringify(sixState));

  await page.click('#adminLoginBtn');
  await page.waitForSelector('#adminMainView', { visible: true, timeout: 15000 });
  ok('save enters admin main', true);

  // Refresh — should ask for login, not first-time setup again
  await page.reload({ waitUntil: 'networkidle0' });
  await page.goto(BASE + '#admin', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#adminLoginBtn');
  const afterReload = await page.evaluate(() => ({
    title: document.getElementById('adminLoginTitle')?.textContent || '',
    btn: document.getElementById('adminLoginBtn')?.textContent || '',
    mainHidden: getComputedStyle(document.getElementById('adminMainView')).display === 'none',
  }));
  ok(
    'refresh does not re-ask first-time setup',
    !afterReload.title.includes('ตั้งรหัสหลังร้านครั้งแรก') && afterReload.btn.includes('เข้าสู่ระบบ'),
    JSON.stringify(afterReload),
  );

  await page.type('#adminPin', '258025');
  await page.click('#adminLoginBtn');
  await page.waitForSelector('#adminMainView', { visible: true, timeout: 15000 });
  ok('login with saved PIN works', true);

  await ctx.close();
} catch (err) {
  ok('test runner', false, String(err?.stack || err));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
