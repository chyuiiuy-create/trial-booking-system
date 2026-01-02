# 📚 試堂預約系統

一個簡單易用的補習社試堂預約系統，可部署到 Cloudflare Pages。

---

## 📋 目錄

1. [功能介紹](#功能介紹)
2. [文件結構](#文件結構)
3. [快速開始](#快速開始)
4. [部署到 Cloudflare Pages](#部署到-cloudflare-pages)
5. [設置 Google Sheets 自動保存](#設置-google-sheets-自動保存)
6. [自訂設定](#自訂設定)
7. [常見問題](#常見問題)

---

## ✨ 功能介紹

- 📅 **在線預約**：家長可以選擇未來一周的可用時段（周一至周五，下午3-7點）
- 📝 **表單填寫**：收集學生姓名、年級（小一至中六）、聯絡方式
- 📊 **自動記錄**：預約數據自動保存到 Google Sheets
- ✅ **確認頁面**：預約成功後顯示確認詳情
- 📱 **響應式設計**：支援手機、平板、電腦

---

## 📁 文件結構

```
trial-booking-system/
├── index.html              # 預約表單頁面
├── confirmation.html       # 預約確認頁面
├── style.css              # 網頁樣式
├── script.js              # JavaScript 邏輯
├── google-apps-script.js  # Google Apps Script 代碼（複製到Google）
├── .gitignore             # Git 忽略文件
└── README.md              # 使用說明
```

---

## 🚀 快速開始

### 方法一：直接在本機預覽

1. 下載所有文件到同一個文件夾
2. 雙擊 `index.html` 打開
3. 即可預覽網站效果

> 注意：本機預覽時，數據會顯示在瀏覽器控制台（按F12查看）

### 方法二：部署到網絡

請參考下面的「部署到 Cloudflare Pages」部分。

---

## ☁️ 部署到 Cloudflare Pages

### 步驟 1：註冊 Cloudflare 帳戶

1. 訪問 [Cloudflare](https://dash.cloudflare.com/sign-up)
2. 使用電郵註冊帳戶
3. 驗證您的電郵地址

### 步驟 2：連接 GitHub 倉庫

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 點擊左側選單的 **「Workers & Pages」**
3. 點擊 **「Create application」** 按鈕
4. 選擇 **「Pages」** 標籤
5. 點擊 **「Connect to Git」**
6. 選擇 **GitHub**，並授權 Cloudflare 訪問您的帳戶
7. 選擇您的 `trial-booking-system` 倉庫

### 步驟 3：配置部署設定

1. **Project name**：輸入項目名稱（例如：`trial-booking`）
2. **Production branch**：選擇 `main`
3. **Build settings**：
   - Framework preset：選擇 **None**
   - Build command：留空
   - Build output directory：留空（或輸入 `/`）
4. 點擊 **「Save and Deploy」**

### 步驟 4：等待部署完成

1. Cloudflare 會自動部署您的網站
2. 部署完成後，您會獲得一個網址，例如：
   - `https://trial-booking.pages.dev`
3. 點擊網址即可訪問您的預約系統！

### 步驟 5：設置自訂域名（可選）

1. 在項目頁面，點擊 **「Custom domains」**
2. 點擊 **「Set up a custom domain」**
3. 輸入您的域名
4. 按照指示設置 DNS 記錄

---

## 📊 設置 Google Sheets 自動保存

這一步讓預約數據自動保存到 Google Sheets，方便您查看和管理。

### 步驟 1：創建 Google Sheets 試算表

1. 打開 [Google Sheets](https://sheets.google.com/)
2. 點擊 **「空白」** 創建新試算表
3. 將試算表命名為：**試堂預約記錄**

### 步驟 2：打開 Apps Script 編輯器

1. 在試算表中，點擊選單 **「擴充功能」** → **「Apps Script」**
2. 這會打開 Apps Script 編輯器

### 步驟 3：貼上代碼

1. **刪除**編輯器中的所有現有代碼
2. 打開 `google-apps-script.js` 文件
3. **複製全部代碼**
4. 貼上到 Apps Script 編輯器中
5. 點擊 **「保存」**（或按 Ctrl+S）
6. 給項目命名，例如：**試堂預約API**

### 步驟 4：部署為網頁應用程式

1. 點擊 **「部署」** → **「新增部署」**
2. 點擊 **「選取類型」** → 選擇 **「網頁應用程式」**
3. 填寫設定：
   - **說明**：試堂預約API
   - **執行身分**：我
   - **誰可以存取**：所有人
4. 點擊 **「部署」**
5. 點擊 **「授權存取權」**
6. 選擇您的 Google 帳戶
7. 點擊 **「進階」** → **「前往 試堂預約API（不安全）」**
8. 點擊 **「允許」**
9. **複製**顯示的網址（這很重要！）

網址格式類似：
```
https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxx/exec
```

### 步驟 5：更新您的網站代碼

1. 打開 `script.js` 文件
2. 找到這一行：
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. 將 `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` 替換為您剛才複製的網址
4. 保存文件
5. 提交更改到 GitHub：
   ```bash
   git add .
   git commit -m "Add Google Apps Script URL"
   git push
   ```
6. Cloudflare 會自動重新部署

### 步驟 6：測試數據保存

1. 訪問您的預約網站
2. 填寫並提交一個測試預約
3. 打開您的 Google Sheets 試算表
4. 檢查是否有新的預約記錄

---

## ⚙️ 自訂設定

### 修改補習社資訊

打開 `index.html` 和 `confirmation.html`，搜索並替換以下內容：

| 原文 | 替換為 |
|------|--------|
| `優質補習社` | 您的補習社名稱 |
| `香港九龍某某街123號` | 您的地址 |
| `2345 6789` | 您的電話 |
| `info@tutorial.com` | 您的電郵 |

### 修改可預約時段

打開 `index.html`，找到時段選擇的部分：

```html
<option value="15:00 - 16:00">15:00 - 16:00</option>
<option value="16:00 - 17:00">16:00 - 17:00</option>
<option value="17:00 - 18:00">17:00 - 18:00</option>
<option value="18:00 - 19:00">18:00 - 19:00</option>
```

您可以修改、添加或刪除時段。

### 修改年級選項

打開 `index.html`，找到年級選擇的部分，按需修改。

### 修改顏色主題

打開 `style.css`，找到 `:root` 部分，修改顏色變量：

```css
:root {
    --primary-color: #1a5276;    /* 主色調 */
    --success-color: #27ae60;    /* 成功色 */
    /* ... 其他顏色 ... */
}
```

---

## ❓ 常見問題

### Q1：預約數據沒有保存到 Google Sheets

**解決方法：**
1. 確認 `script.js` 中的 `GOOGLE_SCRIPT_URL` 已正確設置
2. 確認 Google Apps Script 已部署為「所有人」可訪問
3. 檢查瀏覽器控制台（F12）是否有錯誤信息

### Q2：Google Apps Script 部署時提示「不安全」

**這是正常的！** 因為是您自己創建的腳本，Google 會顯示這個警告。點擊「進階」→「前往 xxx（不安全）」→「允許」即可。

### Q3：如何查看提交的數據？

打開您的 Google Sheets 試算表，所有預約數據都會自動添加為新的行。

### Q4：手機上顯示正常嗎？

是的！網站採用響應式設計，在手機、平板和電腦上都能正常顯示。

### Q5：如何修改網站後更新？

1. 修改文件
2. 提交到 GitHub：
   ```bash
   git add .
   git commit -m "更新說明"
   git push
   ```
3. Cloudflare 會自動重新部署（通常1-2分鐘內完成）

### Q6：沒有設置 Google Sheets 也能用嗎？

可以！網站有「模擬模式」，預約數據會顯示在瀏覽器控制台（按F12查看）。但建議設置 Google Sheets 以便正式使用。

---

## 📝 更新日誌

### v2.0.0 (2024)
- 改為純靜態網站（HTML/CSS/JavaScript）
- 支援 Cloudflare Pages 部署
- 使用 Google Apps Script 作為後端

### v1.0.0 (2024)
- 初始版本（Python Flask）

---

## 📞 技術支援

如果您遇到任何問題：
1. 首先查看本文檔的「常見問題」部分
2. 檢查瀏覽器控制台（F12）的錯誤信息
3. 確保所有步驟都按順序完成

---

祝您使用愉快！🎓
