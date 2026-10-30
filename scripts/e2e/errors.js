// Not found: an unknown page, collection, chapter, hadith number or
// category answers HTTP 404 with the site's Vietnamese not-found page, inside
// the site frame, so the reader can carry on.
'use strict';

const { BASE, api, assert, loc, meta, norm, spec, waitForH1, waitForText } = require('./harness');

const NOT_FOUND_TITLE = 'Không tìm thấy trang | Hadith tiếng Việt | Hadith.vn';
// The document itself is a 404: browsers log that as a failed resource.
const ALLOW_404 = [/status of 404/];

module.exports = spec(module, 'not found', (h) => {
  const cases = [
    ['an unknown page', '/no-such-page'],
    ['an unknown collection', '/books/no-such-book'],
    ['an unknown chapter', '/books/sahih-al-bukhari/chapters/9999'],
    ['a chapter that is not a number', '/books/sahih-al-bukhari/chapters/abc'],
    ['an unknown hadith number', '/books/sahih-al-bukhari/hadiths/999999'],
    ['a hadith number in an unknown collection', '/books/no-such-book/hadiths/1'],
    ['an unknown hadith id', '/hadiths/99999999'],
    ['a hadith id that is not a number', '/hadiths/abc'],
    ['an unknown category', '/categories/no-such-category'],
    ["an unknown category's hadiths", '/categories/no-such-category/hadiths'],
  ];

  h.test(
    'unknown pages, collections, chapters, hadiths and categories: HTTP 404 and the Vietnamese not-found page',
    async (t) => {
      // the API agrees these do not exist
      for (const path of ['/books/no-such-book', '/books/bukhari/chapters/9999', '/books/bukhari/hadiths/999999', '/hadiths/99999999', '/categories/no-such-category']) {
        await assert.rejects(api(`${path}${loc()}`), (error) => error.status === 404, `API 404 for ${path}`);
      }
      for (const [what, path] of cases) {
        await t.test(what, async (st) => {
          const { page, response } = await h.open(st, path, { allow: ALLOW_404 });
          assert.equal(response.status(), 404, `${path}: HTTP 404`);
          await waitForH1(page, 'Không tìm thấy trang');
          const info = await meta(page);
          assert.equal(norm(info.title), NOT_FOUND_TITLE);
          assert.equal(info.lang, 'vi');
          assert.equal(info.robots, 'noindex');
          assert.equal(norm(await page.getByText('Trang này không tồn tại hoặc đã được chuyển đi.').textContent()), 'Trang này không tồn tại hoặc đã được chuyển đi.');
          // a way on: the links of the not-found page, and the site header
          const links = await page.locator('main ul a').evaluateAll((items) => items.map((a) => [a.getAttribute('href'), a.textContent.trim()]));
          assert.deepEqual(links, [
            ['/', 'Trang chủ'],
            ['/books', 'Bộ sưu tập hadith'],
            ['/categories', 'Danh mục'],
            ['/search', 'Tìm kiếm'],
          ]);
        });
      }
    },
    { smoke: true }
  );

  h.test('an unknown bookmark folder says so', async (t) => {
    const { page } = await h.open(t, '/bookmarks?key=no-such-folder');
    await waitForText(page.getByText('Không tìm thấy thư mục dấu trang.'), 'Không tìm thấy thư mục dấu trang.');
  });

  h.test('the not-found page links lead on', async (t) => {
    const { page } = await h.open(t, '/no-such-page', { allow: ALLOW_404 });
    await page.locator('main ul').getByRole('link', { name: 'Bộ sưu tập hadith' }).click();
    await h.waitForPath(page, (url) => url.pathname === '/books', 'from 404 to the collections');
    await waitForH1(page, 'Bộ sưu tập hadith');
  });

  h.test('following a link to a missing hadith shows the not-found page too', async (t) => {
    const { page } = await h.open(t, '/books/sahih-al-bukhari', { allow: ALLOW_404 });
    // a client-side navigation (Next.js data request) to a missing number
    await page.evaluate(() => window.next.router.push('/books/sahih-al-bukhari/hadiths/999999'));
    await h.waitForPath(page, (url) => url.pathname === '/books/sahih-al-bukhari/hadiths/999999', 'client navigation');
    await waitForH1(page, 'Không tìm thấy trang');
    const res = await fetch(`${BASE}/books/sahih-al-bukhari/hadiths/999999`);
    assert.equal(res.status, 404);
  });
});
