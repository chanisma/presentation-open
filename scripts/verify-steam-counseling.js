const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const fileUrl = pathToFileURL(path.join(__dirname, '..', 'data', '스팀', '상담', 'index.html')).href;

  await page.goto(fileUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator('#studentName').fill('student-a');
  await page.locator('#studentId').fill('2-3-15');
  await page.locator('#activityType').fill('pixel coloring meditation');

  for (let i = 1; i <= 10; i += 1) {
    await page.locator(`label[for="pre-q${i}-a${i <= 3 ? 3 : 1}"]`).click();
    await page.locator(`label[for="post-q${i}-a${i <= 3 ? 1 : 3}"]`).click();
  }

  await page.locator('#activityNote').fill('Made a pixel walk map and practiced short breathing.');
  await page.locator('#showResults').click();

  await page.locator('#comparisonChart svg').waitFor();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('steam_counseling_stress_activity_v1')));
  assert(stored.student.name === 'student-a', 'student name should be saved to localStorage');
  assert(stored.activity.type === 'pixel coloring meditation', 'custom activity type should be saved to localStorage');
  assert(stored.pre.length === 10 && stored.post.length === 10, 'pre/post answers should be saved');

  const resultText = await page.locator('#scoreSummary').innerText();
  assert(resultText.includes('활동 전') && resultText.includes('활동 후'), 'score summary should show before/after labels');

  await page.reload();
  await page.locator('#comparisonChart svg').waitFor();
  const restoredName = await page.locator('#studentName').inputValue();
  assert(restoredName === 'student-a', 'saved student name should be restored after reload');
  const restoredActivityType = await page.locator('#activityType').inputValue();
  assert(restoredActivityType === 'pixel coloring meditation', 'custom activity type should be restored after reload');

  const questionRows = await page.locator('.question-row').count();
  assert(questionRows === 20, 'page should render 10 pre and 10 post question rows');

  await browser.close();
})().catch((error) => {
  console.error(error && (error.stack || error.message) ? (error.stack || error.message) : String(error));
  process.exit(1);
});
