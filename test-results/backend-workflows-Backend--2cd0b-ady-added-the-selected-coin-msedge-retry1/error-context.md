# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backend-workflows.spec.ts >> Backend watchlist journeys >> accepts a stale add flow when the backend already added the selected coin
- Location: tests/e2e/backend-workflows.spec.ts:81:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('alert')
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for getByRole('alert')
    14 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: BTC
      - generic [ref=e6]: $67,842.50
      - generic [ref=e7]: +2.34%
    - generic [ref=e8]:
      - generic [ref=e9]: ETH
      - generic [ref=e10]: $3,521.80
      - generic [ref=e11]: "-1.12%"
    - generic [ref=e12]:
      - generic [ref=e13]: BNB
      - generic [ref=e14]: $608.30
      - generic [ref=e15]: +0.97%
    - generic [ref=e16]:
      - generic [ref=e17]: SOL
      - generic [ref=e18]: $182.40
      - generic [ref=e19]: +5.67%
    - generic [ref=e20]:
      - generic [ref=e21]: DOGE
      - generic [ref=e22]: $0.3800
      - generic [ref=e23]: +4.12%
    - generic [ref=e24]:
      - generic [ref=e25]: XRP
      - generic [ref=e26]: $0.5780
      - generic [ref=e27]: +1.42%
    - generic [ref=e28]:
      - generic [ref=e29]: ADA
      - generic [ref=e30]: $0.6240
      - generic [ref=e31]: "-0.88%"
    - generic [ref=e32]:
      - generic [ref=e33]: AVAX
      - generic [ref=e34]: $41.72
      - generic [ref=e35]: "-2.54%"
    - generic [ref=e36]:
      - generic [ref=e37]: LTC
      - generic [ref=e38]: $95.62
      - generic [ref=e39]: "-0.45%"
    - generic [ref=e40]:
      - generic [ref=e41]: LINK
      - generic [ref=e42]: $28.90
      - generic [ref=e43]: +2.15%
    - generic [ref=e44]:
      - generic [ref=e45]: DOT
      - generic [ref=e46]: $9.14
      - generic [ref=e47]: +3.21%
    - generic [ref=e48]:
      - generic [ref=e49]: MATIC
      - generic [ref=e50]: $0.9200
      - generic [ref=e51]: "-1.23%"
    - generic [ref=e52]:
      - generic [ref=e53]: UNI
      - generic [ref=e54]: $12.45
      - generic [ref=e55]: +6.78%
    - generic [ref=e56]:
      - generic [ref=e57]: ICP
      - generic [ref=e58]: $11.28
      - generic [ref=e59]: "-0.72%"
    - generic [ref=e60]:
      - generic [ref=e61]: ATOM
      - generic [ref=e62]: $11.78
      - generic [ref=e63]: +2.89%
    - generic [ref=e64]:
      - generic [ref=e65]: HBAR
      - generic [ref=e66]: $0.1100
      - generic [ref=e67]: +2.48%
    - generic [ref=e68]:
      - generic [ref=e69]: XMR
      - generic [ref=e70]: $195.34
      - generic [ref=e71]: +3.56%
    - generic [ref=e72]:
      - generic [ref=e73]: FIL
      - generic [ref=e74]: $6.12
      - generic [ref=e75]: +3.41%
    - generic [ref=e76]:
      - generic [ref=e77]: VET
      - generic [ref=e78]: $0.0480
      - generic [ref=e79]: "-2.34%"
    - generic [ref=e80]:
      - generic [ref=e81]: GRT
      - generic [ref=e82]: $0.3400
      - generic [ref=e83]: "-1.76%"
    - generic [ref=e84]:
      - generic [ref=e85]: THETA
      - generic [ref=e86]: $2.84
      - generic [ref=e87]: +1.87%
    - generic [ref=e88]:
      - generic [ref=e89]: ALGO
      - generic [ref=e90]: $0.1900
      - generic [ref=e91]: +0.95%
    - generic [ref=e92]:
      - generic [ref=e93]: EGLD
      - generic [ref=e94]: $43.70
      - generic [ref=e95]: "-2.63%"
    - generic [ref=e96]:
      - generic [ref=e97]: XTZ
      - generic [ref=e98]: $1.07
      - generic [ref=e99]: +1.32%
    - generic [ref=e100]:
      - generic [ref=e101]: BTC
      - generic [ref=e102]: $67,842.50
      - generic [ref=e103]: +2.34%
    - generic [ref=e104]:
      - generic [ref=e105]: ETH
      - generic [ref=e106]: $3,521.80
      - generic [ref=e107]: "-1.12%"
    - generic [ref=e108]:
      - generic [ref=e109]: BNB
      - generic [ref=e110]: $608.30
      - generic [ref=e111]: +0.97%
    - generic [ref=e112]:
      - generic [ref=e113]: SOL
      - generic [ref=e114]: $182.40
      - generic [ref=e115]: +5.67%
    - generic [ref=e116]:
      - generic [ref=e117]: DOGE
      - generic [ref=e118]: $0.3800
      - generic [ref=e119]: +4.12%
    - generic [ref=e120]:
      - generic [ref=e121]: XRP
      - generic [ref=e122]: $0.5780
      - generic [ref=e123]: +1.42%
    - generic [ref=e124]:
      - generic [ref=e125]: ADA
      - generic [ref=e126]: $0.6240
      - generic [ref=e127]: "-0.88%"
    - generic [ref=e128]:
      - generic [ref=e129]: AVAX
      - generic [ref=e130]: $41.72
      - generic [ref=e131]: "-2.54%"
    - generic [ref=e132]:
      - generic [ref=e133]: LTC
      - generic [ref=e134]: $95.62
      - generic [ref=e135]: "-0.45%"
    - generic [ref=e136]:
      - generic [ref=e137]: LINK
      - generic [ref=e138]: $28.90
      - generic [ref=e139]: +2.15%
    - generic [ref=e140]:
      - generic [ref=e141]: DOT
      - generic [ref=e142]: $9.14
      - generic [ref=e143]: +3.21%
    - generic [ref=e144]:
      - generic [ref=e145]: MATIC
      - generic [ref=e146]: $0.9200
      - generic [ref=e147]: "-1.23%"
    - generic [ref=e148]:
      - generic [ref=e149]: UNI
      - generic [ref=e150]: $12.45
      - generic [ref=e151]: +6.78%
    - generic [ref=e152]:
      - generic [ref=e153]: ICP
      - generic [ref=e154]: $11.28
      - generic [ref=e155]: "-0.72%"
    - generic [ref=e156]:
      - generic [ref=e157]: ATOM
      - generic [ref=e158]: $11.78
      - generic [ref=e159]: +2.89%
    - generic [ref=e160]:
      - generic [ref=e161]: HBAR
      - generic [ref=e162]: $0.1100
      - generic [ref=e163]: +2.48%
    - generic [ref=e164]:
      - generic [ref=e165]: XMR
      - generic [ref=e166]: $195.34
      - generic [ref=e167]: +3.56%
    - generic [ref=e168]:
      - generic [ref=e169]: FIL
      - generic [ref=e170]: $6.12
      - generic [ref=e171]: +3.41%
    - generic [ref=e172]:
      - generic [ref=e173]: VET
      - generic [ref=e174]: $0.0480
      - generic [ref=e175]: "-2.34%"
    - generic [ref=e176]:
      - generic [ref=e177]: GRT
      - generic [ref=e178]: $0.3400
      - generic [ref=e179]: "-1.76%"
    - generic [ref=e180]:
      - generic [ref=e181]: THETA
      - generic [ref=e182]: $2.84
      - generic [ref=e183]: +1.87%
    - generic [ref=e184]:
      - generic [ref=e185]: ALGO
      - generic [ref=e186]: $0.1900
      - generic [ref=e187]: +0.95%
    - generic [ref=e188]:
      - generic [ref=e189]: EGLD
      - generic [ref=e190]: $43.70
      - generic [ref=e191]: "-2.63%"
    - generic [ref=e192]:
      - generic [ref=e193]: XTZ
      - generic [ref=e194]: $1.07
      - generic [ref=e195]: +1.32%
  - navigation [ref=e196]:
    - link "CryptoWatch" [ref=e197] [cursor=pointer]:
      - /url: /
      - text: CryptoWatch
    - list [ref=e199]:
      - listitem [ref=e200]:
        - link "Watchlist" [ref=e201] [cursor=pointer]:
          - /url: /
      - listitem [ref=e202]:
        - link "All Coins" [ref=e203] [cursor=pointer]:
          - /url: /coins/browse
  - generic [ref=e204]:
    - generic [ref=e205]:
      - heading "My Watchlist" [level=1] [ref=e206]
      - paragraph [ref=e207]: Tracking 1 assets · Last updated just now
    - button "₿ Play Mini Game" [ref=e208] [cursor=pointer]
    - text: 1011010010110010010110100101101001011010010110100101101001011010 01011010010110100101101001011010
  - generic [ref=e209]:
    - generic [ref=e210]:
      - generic [ref=e211]: Total market cap
      - generic [ref=e212]: $2.41T↑ 1.4%
    - generic [ref=e213]:
      - generic [ref=e214]: 24h volume
      - generic [ref=e215]: $94.2B
    - generic [ref=e216]:
      - generic [ref=e217]: BTC dominance
      - generic [ref=e218]: 52.3%
    - generic [ref=e219]:
      - generic [ref=e220]: Gainers
      - generic [ref=e221]: 1 / 1
  - generic [ref=e222]:
    - generic [ref=e223]:
      - img
      - searchbox "Search watchlist" [ref=e224]
    - button "Value" [ref=e225] [cursor=pointer]
    - button "Percent Change" [ref=e226] [cursor=pointer]
    - button "Market Cap" [ref=e227] [cursor=pointer]
    - button "24h Volume" [ref=e228] [cursor=pointer]
    - button "Gainers" [ref=e229] [cursor=pointer]
    - button "Losers" [ref=e230] [cursor=pointer]
    - generic [ref=e231]:
      - button "Add Coin" [ref=e232] [cursor=pointer]:
        - img [ref=e233]
        - text: Add Coin
      - group "View mode" [ref=e234]:
        - button "Grid view" [ref=e235] [cursor=pointer]:
          - img [ref=e236]
        - button "List view" [ref=e241] [cursor=pointer]:
          - img [ref=e242]
  - main [ref=e243]:
    - generic [ref=e245]:
      - button "Remove Bitcoin from watchlist" [ref=e246] [cursor=pointer]: ×
      - 'link "BTC Bitcoin BTC #1 $67,842.50 USD ↑ 2.34% Market cap $1.34T 24h volume $28.4B" [ref=e247] [cursor=pointer]':
        - /url: /coins/bitcoin
        - generic [ref=e248]:
          - generic [ref=e249]:
            - generic [ref=e250]: BTC
            - generic [ref=e251]:
              - generic [ref=e252]: Bitcoin
              - generic [ref=e253]: BTC
          - generic [ref=e254]: "#1"
        - img [ref=e256]
        - generic [ref=e259]:
          - generic [ref=e260]:
            - generic [ref=e261]: $67,842.50
            - generic [ref=e262]: USD
          - generic [ref=e263]: ↑ 2.34%
        - generic [ref=e264]:
          - generic [ref=e265]:
            - generic [ref=e266]: Market cap
            - generic [ref=e267]: $1.34T
          - generic [ref=e268]:
            - generic [ref=e269]: 24h volume
            - generic [ref=e270]: $28.4B
  - button "Open Next.js Dev Tools" [ref=e276] [cursor=pointer]:
    - img [ref=e277]
  - alert [ref=e280]
```

# Test source

```ts
  1   | import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
  2   | 
  3   | const apiBaseUrl = 'http://127.0.0.1:8080/api';
  4   | 
  5   | async function resetWatchlist(request: APIRequestContext) {
  6   |   const response = await request.get(`${apiBaseUrl}/watchlist`);
  7   |   expect(response.ok()).toBeTruthy();
  8   | 
  9   |   const watchlist = (await response.json()) as Array<{ id: string }>;
  10  | 
  11  |   for (const coin of watchlist) {
  12  |     const removeResponse = await request.delete(`${apiBaseUrl}/watchlist/${coin.id}`);
  13  |     expect(removeResponse.ok()).toBeTruthy();
  14  |   }
  15  | }
  16  | 
  17  | async function seedWatchlist(request: APIRequestContext, coinIds: string[]) {
  18  |   for (const coinId of coinIds) {
  19  |     const response = await request.post(`${apiBaseUrl}/watchlist`, {
  20  |       data: { coinId },
  21  |     });
  22  | 
  23  |     expect(response.status()).toBe(201);
  24  |   }
  25  | }
  26  | 
  27  | async function openAddCoinModal(page: Page) {
  28  |   await page.getByRole('button', { name: /add coin/i }).click();
  29  |   await expect(page.getByRole('heading', { name: 'Add Cryptocurrency' })).toBeVisible();
  30  | }
  31  | 
  32  | test.describe('Backend watchlist journeys', () => {
  33  |   test('starts empty, lets the user add a coin, and keeps it after reload', async ({ page, request }) => {
  34  |     await resetWatchlist(request);
  35  | 
  36  |     await page.goto('/');
  37  | 
  38  |     await expect(page.getByText('Tracking 0 assets')).toBeVisible();
  39  |     await expect(page.getByText('No coins found')).toBeVisible();
  40  |     await expect(page.getByText('0 / 0')).toBeVisible();
  41  | 
  42  |     await openAddCoinModal(page);
  43  |     await page.getByLabel('Select Cryptocurrency').selectOption('bitcoin');
  44  |     await page.getByRole('button', { name: 'Add to Watchlist' }).click();
  45  | 
  46  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
  47  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  48  |     await expect(page.getByText('1 / 1')).toBeVisible();
  49  | 
  50  |     await page.reload();
  51  | 
  52  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
  53  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  54  |   });
  55  | 
  56  |   test('removes a persisted coin and keeps the trimmed watchlist after reload', async ({ page, request }) => {
  57  |     await resetWatchlist(request);
  58  |     await seedWatchlist(request, ['bitcoin', 'ethereum']);
  59  | 
  60  |     await page.goto('/');
  61  | 
  62  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
  63  |     await expect(page.locator('main a[href="/coins/ethereum"]')).toBeVisible({ timeout: 10000 });
  64  |     await expect(page.getByText('Tracking 2 assets')).toBeVisible();
  65  |     await expect(page.getByText('1 / 2')).toBeVisible();
  66  | 
  67  |     await page.getByRole('button', { name: 'Remove Ethereum from watchlist' }).click();
  68  | 
  69  |     await expect(page.locator('main a[href="/coins/ethereum"]')).toHaveCount(0);
  70  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible();
  71  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  72  |     await expect(page.getByText('1 / 1')).toBeVisible();
  73  | 
  74  |     await page.reload();
  75  | 
  76  |     await expect(page.locator('main a[href="/coins/ethereum"]')).toHaveCount(0);
  77  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
  78  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  79  |   });
  80  | 
  81  |   test('accepts a stale add flow when the backend already added the selected coin', async ({ page, request }) => {
  82  |     await resetWatchlist(request);
  83  | 
  84  |     await page.goto('/');
  85  |     await openAddCoinModal(page);
  86  |     await page.getByLabel('Select Cryptocurrency').selectOption('bitcoin');
  87  | 
  88  |     const externalAddResponse = await request.post(`${apiBaseUrl}/watchlist`, {
  89  |       data: { coinId: 'bitcoin' },
  90  |     });
  91  |     expect(externalAddResponse.status()).toBe(201);
  92  | 
  93  |     await page.getByRole('button', { name: 'Add to Watchlist' }).click();
  94  | 
  95  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toHaveCount(1, { timeout: 10000 });
  96  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
> 97  |     await expect(page.getByRole('alert')).toHaveCount(0);
      |                                           ^ Error: expect(locator).toHaveCount(expected) failed
  98  | 
  99  |     await page.reload();
  100 | 
  101 |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toHaveCount(1, { timeout: 10000 });
  102 |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  103 |   });
  104 | });
  105 | 
```