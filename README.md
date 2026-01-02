# 📚 試堂預約系統

一個簡單易用的補習社試堂預約系統，讓家長可以輕鬆預約試堂時間。

---

## 📋 目錄

1. [功能介紹](#功能介紹)
2. [系統要求](#系統要求)
3. [安裝步驟](#安裝步驟)
4. [Google Sheets 設置教學](#google-sheets-設置教學)
5. [運行系統](#運行系統)
6. [常見問題](#常見問題)
7. [文件說明](#文件說明)

---

## ✨ 功能介紹

- 📅 **在線預約**：家長可以選擇未來一周的可用時段
- 📝 **表單填寫**：收集學生姓名、年級、聯絡方式
- 📊 **自動記錄**：預約數據自動保存到 Google Sheets
- ✉️ **確認通知**：預約成功後顯示確認頁面（可擴展為郵件通知）
- 📱 **響應式設計**：支援手機、平板、電腦

---

## 💻 系統要求

- Python 3.8 或更高版本
- 網絡連接（用於連接 Google Sheets）
- Google 帳戶（用於 Google Sheets API）

---

## 🚀 安裝步驟

### 步驟 1：安裝 Python

如果您還沒有安裝 Python：

1. 訪問 [Python 官網](https://www.python.org/downloads/)
2. 下載 Python 3.8 或更高版本
3. **重要**：安裝時勾選 "Add Python to PATH"
4. 完成安裝

### 步驟 2：下載項目文件

確保您有以下文件：
```
trial-booking/
├── app.py              # 主程序
├── config.py           # 配置文件
├── requirements.txt    # 依賴包列表
├── env_template.txt    # 環境變量模板（需重命名為 .env）
├── templates/
│   ├── index.html     # 預約頁面
│   └── confirmation.html  # 確認頁面
├── static/
│   └── style.css      # 樣式文件
└── README.md          # 使用說明
```

### 步驟 2.5：創建環境變量文件

1. 找到 `env_template.txt` 文件
2. 將它重命名為 `.env`（注意前面有一個點）
3. 如果系統提示「確定要更改文件擴展名嗎」，點擊「是」

### 步驟 3：安裝依賴包

1. 打開命令提示符（Windows）或終端（Mac）
2. 切換到項目目錄：
   ```bash
   cd 您的項目路徑
   ```
3. 安裝所需的 Python 包：
   ```bash
   pip install -r requirements.txt
   ```

等待安裝完成，您會看到類似這樣的信息：
```
Successfully installed Flask-2.3.3 gspread-5.12.0 ...
```

---

## 🔧 Google Sheets 設置教學

這是最重要的步驟，請按照以下詳細說明操作：

### 第 1 步：創建 Google Cloud 項目

1. 打開瀏覽器，訪問 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用您的 Google 帳戶登入
3. 點擊頁面頂部的 **"選擇項目"** 下拉菜單
4. 在彈出的窗口中，點擊右上角的 **"新建項目"**
5. 輸入項目名稱，例如：`試堂預約系統`
6. 點擊 **"創建"** 按鈕
7. 等待幾秒鐘，項目創建完成

### 第 2 步：啟用 Google Sheets API

1. 在 Google Cloud Console 中，確保您已選擇剛創建的項目
2. 點擊左側菜單的 **"API和服務"** → **"庫"**
3. 在搜索框中輸入 `Google Sheets API`
4. 點擊搜索結果中的 **"Google Sheets API"**
5. 點擊藍色的 **"啟用"** 按鈕
6. 等待啟用完成

### 第 3 步：啟用 Google Drive API

1. 返回 API 庫頁面
2. 在搜索框中輸入 `Google Drive API`
3. 點擊搜索結果中的 **"Google Drive API"**
4. 點擊藍色的 **"啟用"** 按鈕
5. 等待啟用完成

### 第 4 步：創建服務帳戶

1. 點擊左側菜單的 **"API和服務"** → **"憑據"**
2. 點擊頁面頂部的 **"+ 創建憑據"** 按鈕
3. 選擇 **"服務帳戶"**
4. 填寫服務帳戶詳情：
   - 服務帳戶名稱：`trial-booking`（或任意名稱）
   - 服務帳戶說明：`試堂預約系統`
5. 點擊 **"創建並繼續"**
6. 在「授予此服務帳戶對項目的存取權限」頁面，可以直接跳過，點擊 **"繼續"**
7. 在最後一頁，點擊 **"完成"**

### 第 5 步：下載憑據文件

1. 在「憑據」頁面，找到您剛創建的服務帳戶
2. 點擊服務帳戶的 **電子郵件地址**（例如：trial-booking@xxxx.iam.gserviceaccount.com）
3. 點擊頂部的 **"密鑰"** 標籤
4. 點擊 **"添加密鑰"** → **"創建新密鑰"**
5. 選擇 **"JSON"** 格式
6. 點擊 **"創建"**
7. 文件會自動下載到您的電腦
8. **重要**：將下載的文件重命名為 `credentials.json`
9. **重要**：將 `credentials.json` 複製到您的項目文件夾中（與 app.py 同一目錄）

### 第 6 步：創建 Google Sheets 試算表

1. 打開 [Google Sheets](https://sheets.google.com/)
2. 點擊 **"空白"** 創建新的試算表
3. 將試算表命名為：`試堂預約記錄`（這個名稱必須與 config.py 中的設置一致）
4. 保持試算表頁面打開

### 第 7 步：分享試算表權限

這一步非常重要，讓系統能夠寫入數據：

1. 在您剛創建的 Google Sheets 中，點擊右上角的 **"共用"** 按鈕
2. 打開您下載的 `credentials.json` 文件（用記事本打開）
3. 找到 `"client_email"` 這一行，複製引號內的電子郵件地址
   - 它看起來像這樣：`trial-booking@xxxx.iam.gserviceaccount.com`
4. 回到 Google Sheets，在「新增使用者和群組」輸入框中貼上這個電子郵件地址
5. 權限設為 **"編輯者"**
6. 取消勾選「通知使用者」
7. 點擊 **"共用"**

恭喜！Google Sheets 設置完成！

---

## ▶️ 運行系統

### 方法一：使用命令行

1. 打開命令提示符（Windows）或終端（Mac）
2. 切換到項目目錄：
   ```bash
   cd 您的項目路徑
   ```
3. 運行程序：
   ```bash
   python app.py
   ```
4. 您會看到類似這樣的信息：
   ```
   ============================================
   🎓 優質補習社 - 試堂預約系統
   ============================================
   📍 網站地址：http://localhost:5000
   📍 測試連接：http://localhost:5000/test-sheets
   ============================================
   ```
5. 打開瀏覽器，訪問 http://localhost:5000

### 方法二：在 Cursor 中運行

1. 在 Cursor 中打開項目文件夾
2. 打開 `app.py` 文件
3. 按 `Ctrl+Shift+`（反引號）打開終端
4. 輸入 `python app.py` 並按 Enter
5. 打開瀏覽器訪問 http://localhost:5000

### 測試 Google Sheets 連接

1. 在瀏覽器中訪問 http://localhost:5000/test-sheets
2. 如果看到 `✅ Google Sheets連接成功！`，表示設置正確
3. 如果看到連接失敗的信息，請檢查：
   - `credentials.json` 文件是否在正確位置
   - 是否已分享試算表給服務帳戶

---

## ❓ 常見問題

### Q1：運行時出現 "ModuleNotFoundError"

**問題**：提示找不到某個模組
**解決**：重新安裝依賴包
```bash
pip install -r requirements.txt
```

### Q2：Google Sheets 連接失敗

**問題**：系統提示連接失敗
**解決**：
1. 確認 `credentials.json` 文件在正確位置
2. 確認試算表名稱是 `試堂預約記錄`
3. 確認已將服務帳戶電郵添加為試算表編輯者

### Q3：網頁無法打開

**問題**：瀏覽器無法訪問 http://localhost:5000
**解決**：
1. 確認程序正在運行（終端中有輸出信息）
2. 檢查是否有其他程序佔用 5000 端口
3. 嘗試訪問 http://127.0.0.1:5000

### Q4：模擬模式運行

**問題**：系統顯示「模擬模式」
**說明**：這不是錯誤！即使沒有設置 Google Sheets，系統也能運行。預約數據會顯示在終端中。

### Q5：如何修改補習社名稱？

打開 `config.py` 文件，修改以下內容：
```python
TUTORIAL_CENTER_NAME = "您的補習社名稱"
TUTORIAL_CENTER_ADDRESS = "您的地址"
TUTORIAL_CENTER_PHONE = "您的電話"
TUTORIAL_CENTER_EMAIL = "您的電郵"
```

### Q6：如何修改可預約時間？

打開 `config.py` 文件，修改 `TIME_SLOTS` 列表：
```python
TIME_SLOTS = [
    "15:00 - 16:00",
    "16:00 - 17:00",
    # 添加或修改時段
]
```

### Q7：如何停止程序？

在運行程序的終端中按 `Ctrl + C`

---

## 📁 文件說明

| 文件 | 說明 |
|------|------|
| `app.py` | Flask 主程序，處理網頁請求和數據 |
| `config.py` | 配置文件，包含時間、年級等設定 |
| `requirements.txt` | Python 依賴包列表 |
| `.env` | 環境變量配置 |
| `templates/index.html` | 預約表單頁面 |
| `templates/confirmation.html` | 預約確認頁面 |
| `static/style.css` | 網頁樣式文件 |
| `credentials.json` | Google 服務帳戶憑據（需自行添加） |

---

## 🔒 安全提示

1. **不要公開 credentials.json**：這個文件包含敏感信息
2. **修改 SECRET_KEY**：在 .env 文件中更改為複雜的隨機字符串
3. **正式運行時關閉除錯模式**：在 config.py 中將 `DEBUG_MODE = False`

---

## 📞 需要幫助？

如果您遇到任何問題：
1. 首先檢查本文檔的「常見問題」部分
2. 確保所有步驟都按順序完成
3. 檢查終端中的錯誤信息

---

## 📝 版本信息

- 版本：1.0.0
- 最後更新：2024年
- 適用於：香港補習社

---

祝您使用愉快！🎓

