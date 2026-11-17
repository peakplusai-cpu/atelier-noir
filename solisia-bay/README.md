# SOLISIA BAY

歐美跨境高端海島度假服飾品牌（Women's Resort & Swimwear / Men's Miami Resort Wear）的獨立電商網站。
視覺走 Quiet Luxury：暖沙白 `#FAF8F5`、深海藍 `#1B365D`、陽光金棕 `#C5A059`、炭黑 `#1E1E1E`；標題 Cormorant Garamond，內文與價格 Plus Jakarta Sans。

Next.js 15 + TypeScript，金流使用 PayPal Checkout（JS SDK 按鈕 + 伺服器端 Orders v2 API），訂單存在 Supabase。

## 與 Radiant 的關係

和 `radiant/` 一樣放在同一個 GitHub repo（`peakplusai-cpu/atelier-noir`），共用同一個 Supabase 專案與同一個 Vercel 帳號，
但**程式、Vercel Project、資料表、網域全部獨立**：

| 項目 | 共用 | 獨立 |
| --- | --- | --- |
| GitHub repo | 同一個 repo，資料夾 `solisia-bay/` | 獨立的 `package.json` / `vercel.json` |
| Supabase | 同一個專案 | 資料表前綴 `solisia_`（`solisia_orders`），不碰 `radiant_store` |
| Vercel | 同一個帳號 | 另開一個 Project，Root Directory = `solisia-bay` |

## 本機啟動

```bash
cd solisia-bay
npm install
npm run dev        # http://localhost:3200
```

沒有設定 PayPal 時，只有本機（`NODE_ENV` 不是 `production`，且不是 Vercel）會走「模擬付款成功」。Vercel 或 production 沒有 PayPal 會回 503，不會模擬付款。訂單寫入 `data/orders.json`（不進版控）。
沒有設定 Supabase 時同樣使用本機 JSON 檔。

## 部署（Vercel + Supabase + PayPal）

1. **Supabase**：在 Radiant 使用的同一個專案，SQL Editor 執行 `supabase/schema.sql`（建立 `solisia_orders` 與 `solisia_staff`）。若資料表已存在，仍要重跑檔尾的 `status` check，才能使用 `review`（付款金額不符、待人工核對）。
2. **PayPal**：[developer.paypal.com](https://developer.paypal.com) 建立 App，取得 Client ID 與 Secret。
   Sandbox 憑證配合 `PAYPAL_ENV=sandbox`，正式上線換成 Live 憑證並設 `PAYPAL_ENV=live`。
3. **Vercel**：New Project → Import 同一個 GitHub repo → **Root Directory 設為 `solisia-bay`**。環境變數：
   - `SITE_ORIGIN`：正式網域，例如 `https://solisiabay.com`
   - `PAYPAL_CLIENT_ID`、`PAYPAL_CLIENT_SECRET`、`PAYPAL_ENV`
   - `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（與 Radiant 同一組值）
   - `STAFF_SETUP_TOKEN`（建議）：第一次打開 `/admin/setup` 時必須輸入的設定代碼。未設定時，第一個打開該頁的人就能建立員工密碼。
4. 用 Sandbox 買家帳號跑一筆訂單，確認 `solisia_orders.status` 由 `pending` 變成 `paid`，`payment_capture_id` 有值。

金額一律由伺服器依商品目錄重算（小計 + 運費），前端傳來的價格會被忽略。PayPal 訂單的 `custom_id` 是我們的訂單編號，
capture 時會核對編號、幣別（USD）與金額完全一致才標記已付款。

> Production 若沒有設定 PayPal，`/api/checkout` 會直接回 503，不會模擬付款。

## 功能

- **首頁**：全螢幕度假氛圍 Hero、男女雙線入口（Shop Women / Shop Men / Couples Sets）、熱銷單品輪播、品牌故事。
- **商品列表** `/collection/[all|women|men|couples]`：依尺寸、款式（比基尼上身／下身拆賣、古巴領襯衫、古巴領套裝、泳褲…）篩選與排序（狀態寫進網址可分享）；滑鼠懸停切換模特兒背面，若商品設定 `media.video` 則播放動態實穿影片。
- **商品詳情** `/products/[slug]`：cm / inch 一鍵切換的尺碼表（含模特兒身高體重與穿著尺碼）、衛生貼條與運送／退換貨折疊選單、Complete the Look 搭配推薦、Product JSON-LD。
- **側邊購物車**：「滿 $120 USD 全球免運」動態進度條，自動計算還差多少、湊單推薦；購物車存在 localStorage。
- **員工入口**：頁尾「員工專用入口」。第一次進入設定密碼，之後可查看訂單並標記已出貨、已完成或取消（取消不會自動退 PayPal 款項）。
- **結帳**：站內填寫收件資料 → 建立訂單 → PayPal Checkout 按鈕（JS SDK）完成付款 → 伺服器呼叫 Orders v2 API capture 並核對金額後標記已付款 → 成功頁顯示收據。

## 商品與圖片

商品資料在 `lib/catalog.ts`。目前商品圖是由 `components/ProductArt.tsx` 程式繪製的 SVG 平拍示意圖（正面／背面／細節／面料），
上線前請換成實拍：在 `public/` 放圖片，並在商品上加

```ts
media: { front: "/products/xxx-front.jpg", back: "/products/xxx-back.jpg", gallery: ["/products/xxx-3.jpg"], video: "/products/xxx.mp4" }
```

首頁 Hero 同理，在 `lib/site.ts` 設定 `heroImage` / `heroVideo`。

運費規則、免運門檻、退貨天數在 `lib/site.ts`；運送／退換貨／衛生貼條文案在 `lib/policies.ts`（目前為預設範本，請依實際政策調整）。
