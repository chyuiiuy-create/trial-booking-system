/* ============================================
   Google Apps Script - 接收預約數據並保存到Google Sheets
   ============================================
   
   【使用說明】
   1. 打開 Google Sheets，創建一個名為「試堂預約記錄」的試算表
   2. 在試算表中，點擊「擴充功能」→「Apps Script」
   3. 刪除編輯器中的所有代碼
   4. 複製以下全部代碼並貼上
   5. 點擊「部署」→「新增部署」
   6. 選擇「網頁應用程式」
   7. 設定：
      - 執行身分：我
      - 誰可以存取：所有人
   8. 點擊「部署」
   9. 複製生成的網址，貼到 script.js 中的 GOOGLE_SCRIPT_URL
   
   ============================================ */

// ========================================
// 處理POST請求（接收預約數據）
// ========================================
function doPost(e) {
  try {
    // 解析接收到的JSON數據
    var data = JSON.parse(e.postData.contents);
    
    // 獲取當前的試算表
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // 獲取第一個工作表
    var sheet = spreadsheet.getActiveSheet();
    
    // 檢查是否需要添加表頭（如果第一行是空的）
    if (sheet.getRange('A1').getValue() === '') {
      // 添加表頭
      sheet.appendRow([
        '提交時間',
        '學生姓名',
        '年級',
        '聯絡電話',
        '電郵地址',
        '預約日期',
        '預約時段',
        '狀態'
      ]);
      
      // 設置表頭樣式
      var headerRange = sheet.getRange('A1:H1');
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4a86e8');
      headerRange.setFontColor('#ffffff');
    }
    
    // 添加新的預約記錄
    sheet.appendRow([
      data.timestamp,      // 提交時間
      data.studentName,    // 學生姓名
      data.grade,          // 年級
      data.phone,          // 聯絡電話
      data.email,          // 電郵地址
      data.bookingDate,    // 預約日期
      data.timeSlot,       // 預約時段
      data.status          // 狀態
    ]);
    
    // 返回成功響應
    return ContentService
      .createTextOutput(JSON.stringify({
        'status': 'success',
        'message': '預約已成功記錄'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // 返回錯誤響應
    return ContentService
      .createTextOutput(JSON.stringify({
        'status': 'error',
        'message': error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// 處理GET請求（用於測試）
// ========================================
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'success',
      'message': '試堂預約系統API運行正常'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 測試函數（可在Apps Script編輯器中運行）
// ========================================
function testAddRow() {
  var testData = {
    timestamp: new Date().toLocaleString('zh-HK'),
    studentName: '測試學生',
    grade: '小一',
    phone: '9123 4567',
    email: 'test@example.com',
    bookingDate: '2024年01月15日 (星期一)',
    timeSlot: '15:00 - 16:00',
    status: '待確認'
  };
  
  // 模擬POST請求
  var mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  // 調用doPost函數
  var result = doPost(mockEvent);
  
  // 輸出結果
  Logger.log(result.getContent());
}

