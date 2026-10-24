# 安森頂車 Anson Top Car

台中中古車商官網：公開庫存、車輛詳情、LINE / Instagram 諮詢，以及員工後台。

## 本機執行

```bash
npm install
cp .env.example .env
npm run dev
```

瀏覽 http://localhost:3000

未設定 Supabase 時，資料寫入專案根目錄 `data/store.json` 與 `data/settings.json`（已 gitignore）。首次啟動會種入 8 輛示範車（其中 1 輛下架，前台看不到）。

## 員工後台

- 網址：http://localhost:3000/admin
- 密碼：`.env` 的 `ADMIN_PASSWORD`（範例為 `anson-admin-2026`）。種子資料也使用同一組密碼。
- 功能：車輛 CRUD、上架／下架、照片、大小規格、配備、說明；以及 LINE / Instagram 聯絡網址。

## 聯絡按鈕

前台 LINE、Instagram 按鈕讀取「官網設定」。預設佔位：

- `NEXT_PUBLIC_LINE_URL=https://line.me/R/ti/p/@ansontopcar`
- `NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/ansontopcar`

員工可在後台「聯絡設定」覆寫，不必改環境變數。

## 生產建置

```bash
npm run build
npm start
```

可選：設定 Supabase 變數後改走遠端資料表（見 `supabase/schema.sql`）。本機無需付費資料庫。
