# SOLISIA BAY

歐美跨境高端海島度假服飾品牌（Women's Resort & Swimwear / Men's Miami Resort Wear）的獨立電商網站。
視覺走 Quiet Luxury：暖沙白 `#FAF8F5`、深海藍 `#1B365D`、陽光金棕 `#C5A059`、炭黑 `#1E1E1E`；標題 Cormorant Garamond，內文與價格 Plus Jakarta Sans。

Next.js 15 + TypeScript，金流使用 [Creem](https://creem.io)，訂單存在 Supabase。

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

沒有設定 Creem 時（且非 production），結帳會走「模擬付款成功」流程，方便本機測整條路徑；訂單寫入 `data/orders.json`（不進版控）。
沒有設定 Supabase 時同樣使用本機 JSON 檔。

## 部署（Vercel + Supabase + Creem）

1. **Supabase**：在 Radiant 使用的同一個專案，SQL Editor 執行 `supabase/schema.sql`（只會建立 `solisia_orders`）。
2. **Creem**
   - Dashboard 建立一個 **一次性付款（one-time）、幣別 USD** 的商品，例如「SOLISIA BAY Order」，價格隨意（最少 $1）。
     結帳時程式會用 `custom_price` 帶入真正的訂單金額（商品小計 + 運費，金額一律由伺服器依目錄重新計算，不信任前端價格）。
   - Developers 取得 API Key（`creem_test_...` 會自動使用測試環境）與該商品的 Product ID。
   - Webhooks 新增 `https://你的網域/api/webhooks/creem`，訂閱 `checkout.completed`，取得 Signing secret。
3. **Vercel**：New Project → Import 同一個 GitHub repo → **Root Directory 設為 `solisia-bay`**。環境變數：
   - `SITE_ORIGIN`：正式網域，例如 `https://solisiabay.com`
   - `CREEM_API_KEY`、`CREEM_PRODUCT_ID`、`CREEM_WEBHOOK_SECRET`
   - `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（與 Radiant 同一組值）
4. 部署後用 Creem 測試模式跑一筆訂單，確認 `solisia_orders.status` 由 `pending` 變成 `paid`。

> Production 若沒有設定 Creem，`/api/checkout` 會直接回 503，不會模擬付款。

## 功能

- **首頁**：全螢幕度假氛圍 Hero、男女雙線入口（Shop Women / Shop Men / Couples Sets）、熱銷單品輪播、品牌故事。
- **商品列表** `/collection/[all|women|men|couples]`：依尺寸、款式（比基尼上身／下身拆賣、古巴領襯衫、古巴領套裝、泳褲…）篩選與排序（狀態寫進網址可分享）；滑鼠懸停切換模特兒背面，若商品設定 `media.video` 則播放動態實穿影片。
- **商品詳情** `/products/[slug]`：cm / inch 一鍵切換的尺碼表（含模特兒身高體重與穿著尺碼）、衛生貼條與運送／退換貨折疊選單、Complete the Look 搭配推薦、Product JSON-LD。
- **側邊購物車**：「滿 $120 USD 全球免運」動態進度條，自動計算還差多少、湊單推薦；購物車存在 localStorage。
- **結帳**：站內填寫收件資料 → 建立訂單 → 導向 Creem 付款頁 → Webhook 驗簽（HMAC-SHA256）後標記已付款 → 成功頁自動輪詢狀態。

## 商品與圖片

商品資料在 `lib/catalog.ts`。目前商品圖是由 `components/ProductArt.tsx` 程式繪製的 SVG 平拍示意圖（正面／背面／細節／面料），
上線前請換成實拍：在 `public/` 放圖片，並在商品上加

```ts
media: { front: "/products/xxx-front.jpg", back: "/products/xxx-back.jpg", gallery: ["/products/xxx-3.jpg"], video: "/products/xxx.mp4" }
```

首頁 Hero 同理，在 `lib/site.ts` 設定 `heroImage` / `heroVideo`。

運費規則、免運門檻、退貨天數在 `lib/site.ts`；運送／退換貨／衛生貼條文案在 `lib/policies.ts`（目前為預設範本，請依實際政策調整）。
