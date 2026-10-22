# Radiant

公司自用的電商網站，獨立於 repo 內其他專案。Next.js 15 + TypeScript，資料存成單一 JSON 檔，沒有外部資料庫。

## 啟動

```bash
cd radiant
npm install
npm run dev        # http://localhost:3100
# 或 npm run build && npm start
```

第一次打開 `/admin`（也就是前台最下方的「員工專用入口」）會要求設定後台密碼。

## 功能

前台
- 商品列表排序仿蝦皮：綜合排序（精選置頂 + 銷量 + 新品加權）、最新、熱銷、價格（升/降）。售完商品一律排最後。
- 搜尋、分類篩選、商品頁顏色選擇（每色獨立庫存與選配價格）、購物袋、結帳。
- 結帳以 LINE 登入取得 LINE 名稱與 LINE User ID；未設定 LINE 登入時，改由客戶自行填寫 LINE 名稱與 LINE ID（後台標示「未驗證」）。
- 「我的訂單」：LINE 登入後可看自己所有訂單。

員工後台（`/admin`）
- 商品：上架／下架、名稱、分類、說明、顏色與色票、各色數量與 SKU、款式價、規格細節、售價與原價、精選置頂、多圖上傳與排序。
- 訂單：狀態流轉（待確認／已付款／已出貨／已完成／已取消）。取消會自動把庫存加回。
- 客戶與合併單：同一位 LINE 使用者（以 LINE User ID 辨識；未驗證者以 LINE ID 不分大小寫辨識）的所有訂單歸在同一位客戶下。客戶頁會把待處理訂單合併成一張出貨單（品項加總、應收總額、收件資料），可列印，也可一次標記全部已出貨。訂單列表會標示「同客共 N 張」。
- 設定：LINE 官方帳號（名稱、Basic ID、加好友連結）、LINE 登入 channel、Messaging API 推播、運費與免運門檻、付款說明、頂部公告。

## 連接 LINE

1. LINE Developers 建立 **LINE Login** channel，Callback URL 填 `https://你的網域/api/line/callback`（設定頁會顯示確切網址）。
2. 在後台「設定」填入 Channel ID 與 Channel secret，並把此 channel 與官方帳號連結，客戶登入時會被引導加入好友。
3. 要推播新訂單通知：填入 Messaging API 的 channel access token 與「店家通知對象」的 User ID，按「發送 LINE 測試訊息」確認。客戶需已加入官方帳號好友才收得到訂單確認訊息。

也可用環境變數 `LINE_CHANNEL_ID`、`LINE_CHANNEL_SECRET`、`LINE_MESSAGING_TOKEN`（後台填的值優先）。正式環境請設定 `SITE_ORIGIN`，例如 `https://shop.example.com`。

## 資料與部署

- 資料在 `data/store.json`，上傳圖片在 `data/uploads/`，兩者都不進版控。部署時請把 `data/` 放在持久化磁碟並定期備份（可用 `RADIANT_DATA_FILE` 指定路徑）。
- 寫入有序列化與原子替換，適合單一實例運行；若要多實例或高流量，請把 `lib/store.ts` 換成資料庫實作。
